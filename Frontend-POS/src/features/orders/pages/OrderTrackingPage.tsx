import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Navbar } from "../../../components/Navbar";
import {
  useGetOrderByIdQuery,
  useCancelOrderMutation,
} from "../ordersApiSlice";
import { useOrderTracking } from "../useOrderTracking";
import { OrderStatusStepper } from "../components/OrderStatusStepper";
import {
  getMealName,
  getOrderTypeLabel,
  getShortOrderId,
} from "../utils/orderLabels";
import type { OrderStatus } from "../types/order.types";

const STATUS_COPY: Record<OrderStatus, { title: string; subtitle: string }> = {
  pending: {
    title: "We've received your order",
    subtitle: "Waiting for the kitchen to start on it.",
  },
  preparing: {
    title: "Your order is being prepared",
    subtitle: "Hang tight, it won't be long.",
  },
  completed: {
    title: "Your order is complete",
    subtitle: "Enjoy your meal!",
  },
  cancelled: {
    title: "This order was cancelled",
    subtitle: "If this wasn't expected, please contact the restaurant.",
  },
};

export const OrderTrackingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: order,
    isLoading,
    isError,
  } = useGetOrderByIdQuery(id ?? "", { skip: !id });
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  // Only listen while there's still something to hear about. Before the
  // order has loaded we connect optimistically; once it's completed or
  // cancelled the socket is closed.
  const isActive =
    !order || (order.status !== "completed" && order.status !== "cancelled");
  const { isLive } = useOrderTracking(isActive ? id : undefined);

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm("Cancel this order?")) return;

    try {
      await cancelOrder(order._id).unwrap();
      toast.success("Order cancelled");
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(errorData.data?.message || "Couldn't cancel the order.");
    }
  };

  const placedAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      <div className="max-w-xl mx-auto p-4 md:p-8 space-y-5">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-orange"></div>
          </div>
        )}

        {isError && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">We couldn't load this order.</p>
            <button
              type="button"
              onClick={() => navigate("/menu")}
              className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange-dark text-white font-medium rounded-lg transition cursor-pointer"
            >
              Back to Menu
            </button>
          </div>
        )}

        {order && (
          <>
            <section className="bg-white rounded-2xl border border-brand-peach p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-brand-orange bg-brand-peach px-3 py-1 rounded-full">
                  {getOrderTypeLabel(order)}
                </span>

                {isActive && (
                  <span className="flex items-center gap-1.5 text-xs text-brand-charcoal/50">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLive
                          ? "bg-green-500"
                          : "bg-brand-charcoal/30 animate-pulse"
                      }`}
                    />
                    {isLive ? "Live" : "Connecting..."}
                  </span>
                )}
              </div>

              {/* aria-live so a screen reader announces status changes as
                  they arrive over the socket */}
              <div aria-live="polite">
                <h1 className="text-xl font-bold text-brand-charcoal">
                  {STATUS_COPY[order.status].title}
                </h1>
                <p className="text-sm text-brand-charcoal/60 mt-1">
                  {STATUS_COPY[order.status].subtitle}
                </p>
              </div>

              {order.status !== "cancelled" && (
                <div className="mt-6">
                  <OrderStatusStepper status={order.status} />
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-brand-peach p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-brand-charcoal">
                  Order #{getShortOrderId(order)}
                </h2>
                {placedAt && (
                  <span className="text-xs text-brand-charcoal/40">
                    {placedAt}
                  </span>
                )}
              </div>

              {/* Names and quantities only - an order stores meal refs plus
                  one server-calculated total, not a price per line, so a
                  per-line price here could drift from the total if a meal's
                  price changed after the order was placed. */}
              <ul className="space-y-1.5 text-sm text-brand-charcoal/70">
                {order.meals.map((item, idx) => (
                  <li key={idx}>
                    {item.quantity} × {getMealName(item.meal)}
                  </li>
                ))}
              </ul>

              {order.address && (
                <p className="text-xs text-brand-charcoal/50 mt-3">
                  Delivering to: {order.address}
                </p>
              )}

              <div className="flex justify-between font-bold text-brand-charcoal mt-4 pt-4 border-t border-brand-peach">
                <span>Total</span>
                <span>{order.totalPrice.toFixed(2)} EGP</span>
              </div>
            </section>

            <div className="flex gap-3">
              {order.status === "pending" && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-medium transition disabled:opacity-50 cursor-pointer"
                >
                  {isCancelling ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/menu")}
                className="flex-1 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold transition cursor-pointer"
              >
                Back to Menu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
