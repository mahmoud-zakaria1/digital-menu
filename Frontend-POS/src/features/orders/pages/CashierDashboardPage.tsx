import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
} from "../ordersApiSlice";
import { useOrdersSocket, ORDERS_QUERY_ARGS } from "../useOrdersSocket";
import { KanbanColumn } from "../components/KanbanColumn";
import { LogoutButton } from "../../auth/components/LogoutButton";
import type { Order, OrderStatus } from "../types/order.types";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "preparing",
  preparing: "completed",
};

export const CashierDashboardPage = () => {
  const { data, isLoading, isError } = useGetOrdersQuery(ORDERS_QUERY_ARGS);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [cancelOrder] = useCancelOrderMutation();

  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Stable across renders (useCallback, no deps) - required so
  // useOrdersSocket's effect doesn't reconnect the socket every render.
  const playNewOrderSound = useCallback(() => {
    // Browsers block autoplay without a prior user gesture - if a
    // Cashier hasn't clicked anywhere on the page yet, this rejects
    // silently rather than throwing, which is fine; it's a "nice to
    // have" alert, not a critical feature.
    audioRef.current?.play().catch(() => {});
  }, []);

  useOrdersSocket({ onNewOrder: playNewOrderSound });

  const orders = data?.orders ?? [];
  // Cancelled orders are a dead end for the board's workflow - staff
  // don't act on them here, so they're excluded rather than given their
  // own column.
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const completedOrders = orders.filter((o) => o.status === "completed");

  const handleAdvance = async (order: Order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    setBusyOrderId(order._id);
    try {
      await updateOrderStatus({ id: order._id, status: nextStatus }).unwrap();
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(
        errorData.data?.message || "Couldn't update the order status.",
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleCancel = async (order: Order) => {
    setBusyOrderId(order._id);
    try {
      await cancelOrder(order._id).unwrap();
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(errorData.data?.message || "Couldn't cancel the order.");
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Silent until a new_order event arrives - add an actual file at
          public/sounds/new-order.mp3 for this to play anything. */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-brand-peach px-4 md:px-8 py-3 flex items-center justify-between">
        <span className="text-lg font-extrabold text-brand-charcoal tracking-tight">
          Cashier<span className="text-brand-orange">Dashboard</span>
        </span>
        <LogoutButton />
      </header>

      <div className="p-4 md:p-8">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-orange"></div>
          </div>
        )}

        {isError && (
          <p className="text-center text-red-500 py-16">
            Couldn't load orders right now. Please try again in a moment.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KanbanColumn
              title="Pending"
              orders={pendingOrders}
              onAdvance={handleAdvance}
              onCancel={handleCancel}
              busyOrderId={busyOrderId}
            />
            <KanbanColumn
              title="Preparing"
              orders={preparingOrders}
              onAdvance={handleAdvance}
              onCancel={handleCancel}
              busyOrderId={busyOrderId}
            />
            <KanbanColumn
              title="Completed"
              orders={completedOrders}
              onAdvance={handleAdvance}
              onCancel={handleCancel}
              busyOrderId={busyOrderId}
            />
          </div>
        )}
      </div>
    </div>
  );
};
