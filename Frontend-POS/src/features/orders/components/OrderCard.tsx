import type { Order, OrderStatus } from "../types/order.types";
import {
  getMealName,
  getOrderTypeLabel,
  getShortOrderId,
} from "../utils/orderLabels";

interface OrderCardProps {
  order: Order;
  onAdvance: (order: Order) => void;
  onCancel: (order: Order) => void;
  isBusy: boolean;
}

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Start Preparing",
  preparing: "Mark Completed",
};

// A populated reference (user/meal) can resolve to null if the document
// it pointed to was deleted after the order was placed - never assume
// it's always a full object just because it isn't a string id.
const getCustomerName = (order: Order): string => {
  if (!order.user) return "Unknown customer";
  return typeof order.user === "string" ? "Customer" : order.user.name;
};

export const OrderCard = ({
  order,
  onAdvance,
  onCancel,
  isBusy,
}: OrderCardProps) => {
  const nextLabel = NEXT_STATUS_LABEL[order.status];
  const customerName = getCustomerName(order);
  const placedAt = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Tells the Cashier whether there is money to collect. An online order
  // only ever reaches this board AFTER the webhook confirmed its payment
  // (the backend hides unpaid ones from staff), so "Paid online" is accurate.
  const isPaidOnline = order.paymentMethod === "online";

  return (
    <div className="bg-white rounded-xl border border-brand-peach p-4 space-y-3">
      {/* 1️⃣ flex-wrap on both rows below is what keeps a card inside a phone
          screen. Two badges ("Table 5", "Paid online") plus the order id
          and time are wider than a ~360px card, and a row that can't wrap
          just pushes past the edge - which widens the whole page, so the
          sticky header drifts sideways when the cashier scrolls. Now the id
          drops under the badges when there isn't room. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-brand-orange bg-brand-peach px-2.5 py-1 rounded-full">
            {getOrderTypeLabel(order)}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isPaidOnline
                ? "bg-green-50 text-green-600"
                : "bg-brand-peach text-brand-charcoal/70"
            }`}
          >
            {isPaidOnline ? "Paid online" : "Cash"}
          </span>
        </div>
        <span className="text-xs text-brand-charcoal/40 whitespace-nowrap">
          #{getShortOrderId(order)}
          {placedAt && ` · ${placedAt}`}
        </span>
      </div>

      {/* 2️⃣ break-words: names, phones and addresses are free text from the
          customer, so one long unbroken string must wrap instead of
          stretching the card. */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-charcoal break-words">
          {customerName}
        </p>
        <p className="text-xs text-brand-charcoal/50 break-words">
          {order.phone}
        </p>
        {order.address && (
          <p className="text-xs text-brand-charcoal/50 mt-0.5 break-words">
            {order.address}
          </p>
        )}
      </div>

      <ul className="text-sm text-brand-charcoal/70 space-y-1">
        {order.meals.map((item, idx) => (
          <li key={idx} className="flex justify-between">
            <span className="min-w-0 break-words">
              {item.quantity} × {getMealName(item.meal)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-brand-peach">
        <span className="font-bold text-brand-charcoal text-sm">
          {order.totalPrice.toFixed(2)} EGP
        </span>

        <div className="flex items-center gap-2">
          {order.status === "pending" && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              disabled={isBusy}
              className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50 transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          {nextLabel && (
            <button
              type="button"
              onClick={() => onAdvance(order)}
              disabled={isBusy}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white transition disabled:opacity-50 cursor-pointer"
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
