import type { OrderStatus } from "../../orders/types/order.types";

export type TableStatus = "Available" | "Occupied" | "Reserved";

// GET /api/tables populates currentOrder with these two fields only
// (.populate("currentOrder", "status totalPrice") - see tables.controller.ts)
export interface TableCurrentOrder {
  _id: string;
  status: OrderStatus;
  totalPrice: number;
}

export interface Table {
  _id: string;
  tableNo: number;
  status: TableStatus;
  // undefined once the table is released, a bare id if never populated,
  // and null if the order it pointed to was deleted
  currentOrder?: TableCurrentOrder | string | null;
  reservedAt?: string;
}
