import mongoose, { Schema } from "mongoose";
import { IOrder } from "../types/order.types.js";

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    meals: [
      {
        meal: { type: Schema.Types.ObjectId, ref: "Meal", required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    totalPrice: { type: Number, required: true },
    address: { type: String },
    phone: { type: String, required: true },
    table: { type: Schema.Types.ObjectId, ref: "Table" },
    // 1️⃣ How the customer chose to pay. Defaults to "cash" so orders that
    // were created before online payments existed keep behaving as cash.
    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
    },
    // 2️⃣ Only ever changed by the HMAC-verified Paymob webhook - never by
    // anything the client sends.
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model<IOrder>("Order", orderSchema);
