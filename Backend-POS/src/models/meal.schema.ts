import mongoose, { Schema, Model, Types } from "mongoose";
import { IMeal } from "../types/meal.types.js";

const mealSchema = new Schema<IMeal>(
  {
    name: {
      type: String,
      required: [true, "Meal name is required"],
      trim: true,
    },
    description: { type: String, trim: true },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Meal: Model<IMeal> = mongoose.model<IMeal>("Meal", mealSchema);
export default Meal;
