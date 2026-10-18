import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import Order from "../models/order.schema.js";
import Payment from "../models/payment.schema.js";
import { createPaymentValidate } from "../validators/payment.validator.js";
import { IPaymobIntentionResponse } from "../types/paymob.types.js";
import { toObjectId } from "../utils/toObjectId.js";
import config from "../config/config.js";
import { assertUser, assertExists } from "../utils/assertions.js";
import { io } from "../app.js";
import { publishOrderToStaff } from "../utils/orderEvents.js";

// 1️⃣ Create Paymob Payment Intention & Internal Payment Record
// Each call is a fresh payment ATTEMPT (a new intention + Payment record), so
// a customer whose attempt failed - or who closed the Paymob tab - can retry.
// The webhook ties each callback to the right attempt by Paymob's order id.
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Authenticated user assertion check
    if (!assertUser(req.user, next)) return;

    const validatedData = createPaymentValidate.parse(req.body);
    const orderId = toObjectId(validatedData.orderId);

    const order = await Order.findById(orderId);
    if (!assertExists(order, "Order", next)) return;

    // Authorization check: ensure logged-in user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      const error: any = new Error(
        "You are not authorized to pay for this order",
      );
      error.statusCode = 403;
      return next(error);
    }

    // Only orders the customer chose to pay online go through Paymob
    if (order.paymentMethod !== "online") {
      const error: any = new Error(
        "This order isn't set up for online payment",
      );
      error.statusCode = 400;
      return next(error);
    }

    // Prevent payment for cancelled or already completed orders
    if (order.status === "cancelled" || order.status === "completed") {
      const error: any = new Error(
        `Cannot pay for an order that is already ${order.status}`,
      );
      error.statusCode = 400;
      return next(error);
    }

    // Prevent duplicate payments for already paid orders
    const existingPaidPayment = await Payment.findOne({
      order: orderId,
      status: "paid",
    });

    if (order.paymentStatus === "paid" || existingPaidPayment) {
      const error: any = new Error("This order has already been paid");
      error.statusCode = 400;
      return next(error);
    }

    // The hosted checkout URL needs Paymob's PUBLIC key. Fail loudly and
    // clearly if it was never configured, instead of handing the customer a
    // broken link.
    if (!config.paymobPublicKey) {
      const error: any = new Error("Online payment isn't configured");
      error.statusCode = 503;
      return next(error);
    }

    // Extract real user details from req.user with fallbacks
    const userFirstName = req.user.name?.split(" ")[0] || "Customer";
    const userLastName = req.user.name?.split(" ").slice(1).join(" ") || "User";
    const userEmail = req.user.email || "customer@example.com";
    const userPhone = req.user.phone || "+201000000000";

    // Call Paymob Intentions API to create payment transaction session
    const paymobResponse = await fetch(
      "https://accept.paymob.com/v1/intention/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${config.paymobSecretKey}`,
        },
        body: JSON.stringify({
          amount: Math.round(order.totalPrice * 100), // Convert amount to cents/piastres
          currency: "EGP",
          payment_methods: [Number(config.paymobIntegrationId)],
          items: [],
          special_reference: order._id.toString(),
          // Where Paymob sends the customer's browser afterwards. The query
          // params it appends are NEVER trusted - the tracking page only
          // shows what the HMAC-verified webhook has recorded.
          redirection_url: `${config.frontendUrl}/orders/${order._id}/track`,
          billing_data: {
            first_name: userFirstName,
            last_name: userLastName,
            email: userEmail,
            phone_number: userPhone,
            apartment: "NA",
            floor: "NA",
            street: "NA",
            building: "NA",
            shipping_method: "NA",
            postal_code: "NA",
            city: "Alexandria",
            country: "EG",
            state: "NA",
          },
        }),
      },
    );

    if (!paymobResponse.ok) {
      const errorBody = await paymobResponse.text();
      console.error("Paymob error response:", errorBody);

      const error: any = new Error(
        "Failed to create payment intention with Paymob",
      );
      error.statusCode = 502;
      return next(error);
    }

    const paymobData =
      (await paymobResponse.json()) as IPaymobIntentionResponse;

    // Without Paymob's order id the webhook could never be matched back to
    // this payment safely, so don't create a payment we can't reconcile.
    if (
      paymobData.intention_order_id === undefined ||
      paymobData.intention_order_id === null
    ) {
      console.error(
        `Paymob intention ${paymobData.id} came back without intention_order_id`,
      );
      const error: any = new Error(
        "Payment provider returned an incomplete response",
      );
      error.statusCode = 502;
      return next(error);
    }

    const newPayment = await Payment.create({
      order: order._id,
      amount: order.totalPrice,
      currency: "EGP",
      paymobIntentionId: paymobData.id,
      paymobOrderId: String(paymobData.intention_order_id),
      status: "pending",
    });

    // The backend builds the hosted-checkout URL so the frontend never has
    // to know anything about Paymob (keys, URL format).
    const checkoutUrl =
      "https://accept.paymob.com/unifiedcheckout/" +
      `?publicKey=${encodeURIComponent(config.paymobPublicKey)}` +
      `&clientSecret=${encodeURIComponent(paymobData.client_secret)}`;

    return res.status(201).json({
      success: true,
      message: "Payment intention created successfully",
      data: {
        payment: newPayment,
        clientSecret: paymobData.client_secret,
        checkoutUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2️⃣ Handle Webhook Callbacks from Paymob
//
// Trust model: the HMAC only authenticates the fields it covers (listed in
// verifyPaymobHmac). So this handler:
//   - finds the payment by obj.order.id (Paymob's order id - SIGNED), never
//     by merchant_order_id / special_reference (NOT signed: anyone holding a
//     validly-signed payload could swap them to point at a different order)
//   - checks the signed amount_cents/currency against what we recorded
//   - makes every state change an atomic compare-and-set, so Paymob retries
//     or two simultaneous callbacks can't apply an effect twice
export const paymobWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.body;

    // verifyPaymobHmac reads these - refuse anything that isn't shaped like
    // a transaction callback instead of letting it throw a 500.
    if (!payload?.obj?.order || !payload.obj.source_data) {
      const error: any = new Error("Malformed webhook payload");
      error.statusCode = 400;
      return next(error);
    }

    // Verify HMAC signature to prevent forged webhook requests
    const isValid = verifyPaymobHmac(payload, req.query.hmac as string);

    if (!isValid) {
      const error: any = new Error("Invalid HMAC signature");
      error.statusCode = 401;
      return next(error);
    }

    const obj = payload.obj;
    const success = obj.success === true;
    const paymobOrderId = String(obj.order.id);

    const payment = await Payment.findOne({ paymobOrderId });

    // Acknowledge (so Paymob stops retrying) but do nothing: this callback
    // doesn't belong to any payment attempt we created.
    if (!payment) {
      console.warn(
        `[payments] Webhook for unknown Paymob order ${paymobOrderId} - ignored`,
      );
      return res.status(200).json({ received: true });
    }

    // The signed amount must be exactly what we asked Paymob to charge.
    const expectedAmountCents = Math.round(payment.amount * 100);
    if (
      Number(obj.amount_cents) !== expectedAmountCents ||
      obj.currency !== payment.currency
    ) {
      console.error(
        `[payments] Amount/currency mismatch on payment ${payment._id}: ` +
          `got ${obj.amount_cents} ${obj.currency}, expected ` +
          `${expectedAmountCents} ${payment.currency}`,
      );
      const error: any = new Error("Payment amount mismatch");
      error.statusCode = 400;
      return next(error);
    }

    // Atomic transition. A failed attempt may later be followed by a
    // successful retry, so "paid" can come from pending OR failed; "failed"
    // only from pending. null = this callback was already applied.
    const updatedPayment = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        status: { $in: success ? ["pending", "failed"] : ["pending"] },
      },
      {
        status: success ? "paid" : "failed",
        paymobTransactionId: String(obj.id),
      },
      { returnDocument: "after" },
    );

    if (!updatedPayment) {
      return res.status(200).json({ received: true });
    }

    const orderId = updatedPayment.order.toString();
    const orderRoom = `order_${orderId}`;

    // ❌ Failed attempt: record it (unless the order got paid by another
    // attempt in the meantime) and let the customer's page know.
    if (!success) {
      const failedOrder = await Order.findOneAndUpdate(
        { _id: updatedPayment.order, paymentStatus: { $ne: "paid" } },
        { paymentStatus: "failed" },
        { returnDocument: "after" },
      );

      if (failedOrder) {
        io.to(orderRoom).emit("payment_status_changed", {
          orderId,
          paymentStatus: failedOrder.paymentStatus,
        });
      }

      return res.status(200).json({ received: true });
    }

    // ✅ Successful payment. First paid attempt wins (atomic): if the order
    // is missing or already paid, this is a double payment.
    const paidOrder = await Order.findOneAndUpdate(
      { _id: updatedPayment.order, paymentStatus: { $ne: "paid" } },
      { paymentStatus: "paid" },
      { returnDocument: "after" },
    );

    if (!paidOrder) {
      console.warn(
        `[payments] Payment ${updatedPayment._id} succeeded but order ${orderId} ` +
          "is missing or was already paid - needs a manual refund",
      );
      return res.status(200).json({ received: true });
    }

    io.to(orderRoom).emit("payment_status_changed", {
      orderId,
      paymentStatus: paidOrder.paymentStatus,
    });

    // Paid for an order that was cancelled in the meantime: keep it
    // cancelled (the kitchen must not cook it) and flag it for a refund -
    // there's no refund flow yet.
    if (paidOrder.status === "cancelled") {
      console.warn(
        `[payments] Payment ${updatedPayment._id} succeeded for CANCELLED ` +
          `order ${orderId} - needs a manual refund`,
      );
      return res.status(200).json({ received: true });
    }

    // Normal case: the order is now paid, so it goes straight to the
    // kitchen, and only NOW does staff get to see it (table occupied,
    // new_order + the bell).
    if (paidOrder.status === "pending") {
      paidOrder.status = "preparing";
      await paidOrder.save();

      // Tell the tracking customer; staff learn about it via new_order.
      io.to(orderRoom).emit("status_changed", {
        orderId: paidOrder._id,
        status: paidOrder.status,
      });

      await publishOrderToStaff(paidOrder);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// 3️⃣ Verify Paymob HMAC Signature (SHA-512 with Timing-Safe Comparison)
const verifyPaymobHmac = (payload: any, receivedHmac: string): boolean => {
  if (!receivedHmac) return false;

  // Exact lexicographical key sequence required by Paymob HMAC spec
  const orderedFields = [
    payload.obj.amount_cents,
    payload.obj.created_at,
    payload.obj.currency,
    payload.obj.error_occured,
    payload.obj.has_parent_transaction,
    payload.obj.id,
    payload.obj.integration_id,
    payload.obj.is_3d_secure,
    payload.obj.is_auth,
    payload.obj.is_capture,
    payload.obj.is_refunded,
    payload.obj.is_standalone_payment,
    payload.obj.is_voided,
    payload.obj.order.id,
    payload.obj.owner,
    payload.obj.pending,
    payload.obj.source_data.pan,
    payload.obj.source_data.sub_type,
    payload.obj.source_data.type,
    payload.obj.success,
  ].join("");

  const calculatedHmac = crypto
    .createHmac("sha512", config.paymobHmacSecret)
    .update(orderedFields)
    .digest("hex");

  const calculatedBuffer = Buffer.from(calculatedHmac, "utf8");
  const receivedBuffer = Buffer.from(receivedHmac, "utf8");

  // timingSafeEqual requires buffers of identical length
  if (calculatedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);
};
