import { Document, Types } from "mongoose";

export interface IOrderMealItem {
  meal: Types.ObjectId;
  quantity: number;
}

export interface IOrderFields {
  user: Types.ObjectId;
  meals: IOrderMealItem[];
  totalPrice: number;
  address?: string;
  phone: string;
  status: "pending" | "preparing" | "completed" | "cancelled";
}

export interface IOrder extends IOrderFields, Document {}
