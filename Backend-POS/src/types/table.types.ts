import { Document, Types } from "mongoose";

export type TableStatus = "Available" | "Occupied" | "Reserved";

export interface ITableFields {
  tableNo: number;
  status: TableStatus;
  currentOrder?: Types.ObjectId;
  reservedAt?: Date;
}

export interface ITable extends ITableFields, Document {}
