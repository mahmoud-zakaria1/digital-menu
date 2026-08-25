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

// 1️⃣ Create Paymob Payment Intention & Internal Payment Record
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

    // Prevent payment for cancelled or already completed orders
    if (order.status === "cancelled" || order.status === "completed") {
      const error: any = new Error(
        `Cannot pay for an order that is already ${order.status}`,
      );
      error.statusCode = 400;
      return next(error);
    }

    // Prevent duplicate payments for already fulfilled orders
    const existingPaidPayment = await Payment.findOne({
      order: orderId,
      status: "paid",
    });

    if (existingPaidPayment) {
      const error: any = new Error("This order has already been paid");
      error.statusCode = 400;
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

    // Save initial pending payment state in database including paymobIntentionId
    const newPayment = await Payment.create({
      order: order._id,
      amount: order.totalPrice,
      currency: "EGP",
      paymobIntentionId: paymobData.id,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Payment intention created successfully",
      data: {
        payment: newPayment,
        clientSecret: paymobData.client_secret,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2️⃣ Handle Webhook Callbacks from Paymob
export const paymobWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.body;

    // Verify HMAC signature to prevent forged webhook requests
    const isValid = verifyPaymobHmac(payload, req.query.hmac as string);

    if (!isValid) {
      const error: any = new Error("Invalid HMAC signature");
      error.statusCode = 401;
      return next(error);
    }

    const { success, order: paymobOrder, id: transactionId } = payload.obj;
    const orderId =
      paymobOrder.merchant_order_id || payload.obj.special_reference;

    const payment = await Payment.findOne({ order: orderId });

    // Acknowledge receipt if payment record doesn't exist or is already processed
    if (!payment || payment.status === "paid") {
      return res.status(200).json({ received: true });
    }

    // Update payment record with final status & transaction ID
    payment.status = success ? "paid" : "failed";
    payment.paymobTransactionId = transactionId?.toString();
    await payment.save();

    // 🔄 Update corresponding Order status when payment succeeds
    if (success) {
      const order = await Order.findById(orderId);

      if (order && order.status === "pending") {
        order.status = "preparing";
        await order.save();

        // Broadcast order status change to staff/kitchen dashboard
        io.to("staff_room").emit("order_status_changed", {
          orderId,
          status: order.status,
        });
      }
    }

    // Broadcast real-time payment status update to specific order room
    io.to(`order_${orderId}`).emit("payment_status_changed", {
      orderId,
      paymentStatus: payment.status,
    });

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
