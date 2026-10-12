import type { Order } from "../types/order.types";

export const getOrderTypeLabel = (order: Order): string => {
  if (order.table) {
    const tableNo =
      typeof order.table === "string" ? undefined : order.table.tableNo;
    return tableNo ? `Table ${tableNo}` : "Dine-in";
  }
  return order.address ? "Delivery" : "Takeaway";
};

// A populated meal ref can resolve to null if the meal was deleted after the
// order was placed - never assume it's always a full object just because it
// isn't a string id.
export const getMealName = (meal: Order["meals"][number]["meal"]): string => {
  if (!meal) return "Unavailable item";
  return typeof meal === "string" ? "Unknown item" : meal.name;
};

// A short, human-quotable reference: the customer sees it on the tracking
// page and the cashier sees the same one on the card, so "it's order
// #A1B2C3" actually means something across the counter.
export const getShortOrderId = (order: Order): string =>
  order._id.slice(-6).toUpperCase();
