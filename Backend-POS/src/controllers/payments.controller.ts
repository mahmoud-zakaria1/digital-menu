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

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!assertUser(req.user, next)) return;

    const validatedData = createPaymentValidate.parse(req.body);
    const orderId = toObjectId(validatedData.orderId);

    const order = await Order.findById(orderId);
    if (!assertExists(order, "Order", next)) return;

    if (order.user.toString() !== order.user._id.toString()) {
      const error: any = new Error(
        "You are not authorized to pay for this order",
      );
      error.statusCode = 403;
      return next(error);
    }

    const existingPaidPayment = await Payment.findOne({
      order: orderId,
      status: "paid",
    });

    if (existingPaidPayment) {
      const error: any = new Error("This order has already been paid");
      error.statusCode = 400;
      return next(error);
    }

    const paymobResponse = await fetch(
      "https://accept.paymob.com/v1/intention/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${config.paymobSecretkey}`,
        },
        body: JSON.stringify({
          amount: Math.round(order.totalPrice * 100),
          currency: "EGP",
          payment_methods: [Number(config.paymobIntegrationId)],
          items: [],
          special_reference: order._id.toString(),
          billing_data: {
            first_name: "Customer",
            last_name: "Name",
            email: "customer@example.com",
            phone_number: "+201000000000",
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

    const newPayment = await Payment.create({
      order: order._id,
      amount: order.totalPrice,
      currency: "EGP",
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

export const paymobWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.body;

    const isValid = verifyPaymobHmac(payload, req.query.hmac as string);

    if (!isValid) {
      const error: any = new Error("Invalid HAMC signature");
      error.statusCode = 401;
      return next(error);
    }

    const { success, order: paymobOrder, id: transactionId } = payload.obj;
    const orderId =
      paymobOrder.merchant_order_id || payload.obj.special_reference;

    const payment = await Payment.findOne({ order: orderId });

    if (!payment) {
      return res.status(200).json({ received: true });
    }

    if (payment.status === "paid") {
      return res.status(200).json({ received: true });
    }

    payment.status = success ? "paid" : "failed";
    payment.paymobTransactionId = transactionId?.toString();
    await payment.save();

    io.to(`order_{orderId}`).emit("payment_status_changed", {
      orderId,
      paymentStatus: payment.status,
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

const verifyPaymobHmac = (payload: any, receivedHmac: string): boolean => {
  if (!receivedHmac) return false;

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

  return calculatedHmac === receivedHmac;
};
