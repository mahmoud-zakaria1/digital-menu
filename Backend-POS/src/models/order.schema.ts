import mongoose, { Schema } from "mongoose";
import { IOrder } from '../types/order.types.js';


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
    status: {
      type: String,
      enum: ["pending", "preparing", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model<IOrder>("Order", orderSchema);
