import { Document, Types } from "mongoose";

export interface IOrderMealItem {
  meal: Types.ObjectId;
  quantity: number;
}

export type PaymentMethod = "cash" | "online";
export type OrderPaymentStatus = "pending" | "paid" | "failed";

export interface IOrderFields {
  user: Types.ObjectId;
  meals: IOrderMealItem[];
  totalPrice: number;
  address?: string;
  phone: string;
  table?: Types.ObjectId;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  status: "pending" | "preparing" | "completed" | "cancelled";
}

export interface IOrder extends IOrderFields, Document {}
