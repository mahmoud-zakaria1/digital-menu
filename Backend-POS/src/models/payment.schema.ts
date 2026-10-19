import mongoose, { Schema, Model } from "mongoose";
import { IPayment } from "../types/payment.types.js";

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EGP" },
    // 1️⃣ Paymob's own order id. The webhook finds the payment attempt by
    // this value (it is covered by the HMAC signature), so it MUST be
    // persisted - without it no callback could ever be matched back.
    // `unique` makes one Paymob order map to exactly one attempt; `sparse`
    // lets older documents that were saved before this field existed
    // coexist with the index.
    paymobOrderId: { type: String, required: true, unique: true, sparse: true },
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
