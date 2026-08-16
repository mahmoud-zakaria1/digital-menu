import mongoose, { Schema, Model } from "mongoose";
import { IPayment } from "../types/payment.types.js";

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EGP" },
    paymobIntentionId: { type: String },
    paymobTransactionId: { type: String },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const Payment: Model<IPayment> = mongoose.model<IPayment>(
  "Payment",
  paymentSchema,
);
export default Payment;
