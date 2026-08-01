import { ITable } from "../types/table.types.js";
import mongoose, { Schema, Model } from "mongoose";

const tableSchema = new Schema<ITable>(
  {
    tableNo: {
      type: Number,
      required: [true, "Table number is required"],
      unique: true,
    },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Reserved"],
      default: "Available",
    },
    currentOrder: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true },
);

const Table: Model<ITable> = mongoose.model<ITable>("Table", tableSchema);
export default Table;
