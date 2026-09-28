import type { Order, OrderStatus } from "../types/order.types";

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

const getOrderTypeLabel = (order: Order): string => {
  if (order.table) {
    const tableNo =
      typeof order.table === "string" ? undefined : order.table?.tableNo;
    return tableNo ? `Table ${tableNo}` : "Dine-in";
  }
  return order.address ? "Delivery" : "Takeaway";
};

export const OrderCard = ({
  order,
  onAdvance,
  onCancel,
  isBusy,
}: OrderCardProps) => {
  const nextLabel = NEXT_STATUS_LABEL[order.status];
  const customerName =
    !order.user || typeof order.user === "string"
      ? "Customer"
      : (order.user?.name ?? "Customer");

  return (
    <div className="bg-white rounded-xl border border-brand-peach p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-orange bg-brand-peach px-2.5 py-1 rounded-full">
          {getOrderTypeLabel(order)}
        </span>
        {order.createdAt && (
          <span className="text-xs text-brand-charcoal/40">
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-brand-charcoal">
          {customerName}
        </p>
        <p className="text-xs text-brand-charcoal/50">{order.phone}</p>
        {order.address && (
          <p className="text-xs text-brand-charcoal/50 mt-0.5">
            {order.address}
          </p>
        )}
      </div>

      <ul className="text-sm text-brand-charcoal/70 space-y-1">
        {order.meals.map((item, idx) => {
          const mealName =
            !item.meal || typeof item.meal === "string"
              ? "Unknown item"
              : (item.meal?.name ?? "Unknown item");
          return (
            <li key={idx} className="flex justify-between">
              <span>
                {item.quantity} × {mealName}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between pt-2 border-t border-brand-peach">
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
