import Table from "../models/table.schema.js";
import { io } from "../app.js";
import type { IOrder } from "../types/order.types.js";

// An order becomes "real" to the restaurant at one specific moment:
//   - cash orders: the instant they're created
//   - online orders: only once the payment is confirmed (by the webhook)
// Until then it must not occupy a table, show up on a board, or ring the
// Cashier's bell - an abandoned checkout would otherwise leave a ghost
// order the kitchen might start cooking.
//
// Both code paths call this, so "what happens when an order goes live" is
// defined in exactly one place.
export const publishOrderToStaff = async (order: IOrder): Promise<void> => {
  // 1️⃣ Keep the table's currentOrder in sync automatically, instead of
  // relying on staff to link it manually via PUT /api/tables/:id
  if (order.table) {
    await Table.findByIdAndUpdate(order.table, {
      currentOrder: order._id,
      status: "Occupied",
    });
  }

  // 2️⃣ Populate before broadcasting - dashboards listening for "new_order"
  // need meal names/prices, the customer's name, and the table number
  // immediately, the same shape getAllOrders returns. Without this, a
  // live-arriving order would render with blank meal names until the next
  // full refetch.
  const populatedOrder = await order.populate([
    { path: "user", select: "name email" },
    { path: "meals.meal", select: "name price" },
    { path: "table", select: "tableNo" },
  ]);

  // 3️⃣ staff_room only - NOT io.emit. The payload carries the customer's
  // name, email, phone and delivery address; it must never reach the
  // sockets of other customers.
  io.to("staff_room").emit("new_order", populatedOrder);
};

// The mirror image of publishOrderToStaff: when an order ends (completed or
// cancelled) its table goes back to Available. Without this a table stayed
// "Occupied" with a stale currentOrder forever, which also made
// DELETE /api/tables/:id impossible for good.
export const releaseTable = async (order: IOrder): Promise<void> => {
  if (!order.table) return;

  // The currentOrder condition is the safety net: if the table has already
  // been handed to a NEWER order, this (older) order must not free it.
  await Table.findOneAndUpdate(
    { _id: order.table, currentOrder: order._id },
    { status: "Available", $unset: { currentOrder: "" } },
  );
};
