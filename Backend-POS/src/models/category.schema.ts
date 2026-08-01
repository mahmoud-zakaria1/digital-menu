import mongoose, { Schema, Model } from "mongoose";
import { ICategory } from "../types/category.types.js";

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true, 
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Category: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  categorySchema,
);
export default Category;
