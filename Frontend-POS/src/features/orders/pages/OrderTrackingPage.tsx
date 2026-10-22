import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Navbar } from "../../../components/Navbar";
import {
  useGetOrderByIdQuery,
  useCancelOrderMutation,
} from "../ordersApiSlice";
import { useCreatePaymentMutation } from "../paymentsApiSlice";
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

const PAYMENT_COPY = {
  title: "Complete your payment",
  subtitle: "Your order is sent to the kitchen once the payment is confirmed.",
};

const PAYMENT_POLL_INTERVAL_MS = 5000;
const PAYMENT_SLOW_AFTER_MS = 60000;

export const OrderTrackingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isPaymentSlow, setIsPaymentSlow] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useGetOrderByIdQuery(id ?? "", { skip: !id });
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [createPayment, { isLoading: isRetrying }] = useCreatePaymentMutation();

  const isActive =
    !order || (order.status !== "completed" && order.status !== "cancelled");
  const { isLive } = useOrderTracking(isActive ? id : undefined);

  const needsPayment =
    order?.paymentMethod === "online" &&
    order.paymentStatus !== "paid" &&
    order.status === "pending";
  const isAwaitingPayment = needsPayment && order?.paymentStatus === "pending";
  const paymentFailed = needsPayment && order?.paymentStatus === "failed";

// 3️⃣ Poll server and set a slow-payment warning timer after 60s
useEffect(() => {
  if (!isAwaitingPayment) return;

  const slowTimerId = setTimeout(() => {
    setIsPaymentSlow(true);
  }, PAYMENT_SLOW_AFTER_MS);

  const intervalId = setInterval(() => {
    void refetch();
  }, PAYMENT_POLL_INTERVAL_MS);

  return () => {
    clearTimeout(slowTimerId);
    clearInterval(intervalId);
    setIsPaymentSlow(false);
  };
}, [isAwaitingPayment, refetch]);

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

  const handleRetryPayment = async () => {
    if (!order) return;

    try {
      const { checkoutUrl } = await createPayment(order._id).unwrap();
      window.location.assign(checkoutUrl);
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(errorData.data?.message || "Couldn't start the payment.");
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

  const statusCopy = order
    ? needsPayment
      ? PAYMENT_COPY
      : STATUS_COPY[order.status]
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

        {order && statusCopy && (
          <>
            {/* 5️⃣ Payment banners (online orders only) */}
            {isAwaitingPayment && (
              <div
                className={`border text-sm rounded-xl p-4 flex items-center gap-3 transition-colors ${
                  isPaymentSlow
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-brand-peach border-brand-orange/30 text-brand-charcoal"
                }`}
              >
                <div
                  className={`animate-spin rounded-full h-5 w-5 border-b-2 flex-shrink-0 ${
                    isPaymentSlow ? "border-amber-600" : "border-brand-orange"
                  }`}
                />
                <div className="space-y-1">
                  <p className="font-medium">
                    {isPaymentSlow
                      ? "Payment confirmation is taking longer than usual."
                      : "Confirming your payment... this usually takes a few seconds."}
                  </p>
                  {isPaymentSlow && (
                    <p className="text-xs text-amber-700/80">
                      If you already paid, please wait a moment while we confirm with Paymob. If you didn't complete payment on Paymob, you can retry using the button below.
                    </p>
                  )}
                </div>
              </div>
            )}

            {paymentFailed && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4 space-y-3">
                <p>
                  Your payment didn't go through. Your order hasn't been sent to
                  the kitchen yet.
                </p>
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  disabled={isRetrying}
                  className="px-4 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white font-medium transition disabled:opacity-50 cursor-pointer"
                >
                  {isRetrying ? "Redirecting..." : "Try payment again"}
                </button>
              </div>
            )}

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

              <div aria-live="polite">
                <h1 className="text-xl font-bold text-brand-charcoal">
                  {statusCopy.title}
                </h1>
                <p className="text-sm text-brand-charcoal/60 mt-1">
                  {statusCopy.subtitle}
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
                <span>
                  Total
                  {order.paymentStatus === "paid" && (
                    <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Paid
                    </span>
                  )}
                </span>
                <span>{order.totalPrice.toFixed(2)} EGP</span>
              </div>
            </section>

            <div className="flex gap-3">
              {needsPayment && (
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  disabled={isRetrying}
                  className="flex-1 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {isRetrying ? "Redirecting..." : "Pay Now"}
                </button>
              )}

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
                className="flex-1 py-3 rounded-xl bg-brand-peach text-brand-charcoal hover:bg-brand-peach/70 font-semibold transition cursor-pointer"
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