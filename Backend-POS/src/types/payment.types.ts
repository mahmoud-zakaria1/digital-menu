import { Document, Types } from "mongoose";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface IPaymentFields {
  order: Types.ObjectId;
  amount: number;
  currency: string;
  paymobIntentionId?: string;
  paymobTransactionId?: string;
  status: PaymentStatus;
}

export interface IPayment extends IPaymentFields, Document {}
