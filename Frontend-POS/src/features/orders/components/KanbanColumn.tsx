import type { Order } from "../types/order.types";
import { OrderCard } from "./OrderCard";

interface KanbanColumnProps {
  title: string;
  orders: Order[];
  onAdvance: (order: Order) => void;
  onCancel: (order: Order) => void;
  busyOrderId: string | null;
}

export const KanbanColumn = ({
  title,
  orders,
  onAdvance,
  onCancel,
  busyOrderId,
}: KanbanColumnProps) => {
  return (
    <div className="bg-brand-peach/30 rounded-2xl p-3 flex flex-col min-h-[60vh]">
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <h2 className="font-semibold text-brand-charcoal">{title}</h2>
        <span className="text-xs font-semibold text-brand-charcoal/50 bg-white px-2 py-0.5 rounded-full">
          {orders.length}
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1">
        {orders.length === 0 && (
          <p className="text-center text-brand-charcoal/30 text-sm py-8">
            No orders here
          </p>
        )}

        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onAdvance={onAdvance}
            onCancel={onCancel}
            isBusy={busyOrderId === order._id}
          />
        ))}
      </div>
    </div>
  );
};
