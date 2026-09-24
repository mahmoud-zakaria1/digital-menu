import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Navbar } from "../../../components/Navbar";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectCartTableId } from "../../cart/cartSelectors";
import { clearCart, clearTable } from "../../cart/cartSlice";
import { useCartLines } from "../../cart/useCartLines";
import { useGetProfileQuery } from "../../auth/authApiSlice";
import { useCreateOrderMutation } from "../ordersApiSlice";
import type { Order } from "../types/order.types";

type OrderType = "delivery" | "takeaway";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const tableId = useAppSelector(selectCartTableId);
  const isDineIn = Boolean(tableId);

  const { lines, totalPrice, isLoading, isError } = useCartLines();
  const { data: profile } = useGetProfileQuery();
  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();

  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Prefill phone from the logged-in user's profile once it loads, without
  // clobbering it if the customer edits it afterward. Deliberately NOT a
  // useEffect + setState - React's own guidance ("You Might Not Need an
  // Effect") calls that pattern out as causing an extra, avoidable render.
  // Adjusting state directly during render (guarded so it only fires once
  // when the source value actually changes) is the recommended fix, which
  // is also what the newer eslint-plugin-react-hooks warns about.
  const [prefilledFrom, setPrefilledFrom] = useState<string | undefined>();
  if (profile?.phone && profile.phone !== prefilledFrom) {
    setPrefilledFrom(profile.phone);
    setPhone(profile.phone);
  }

  const isEmpty = !isLoading && !isError && lines.length === 0;
  const hasInvalidLines = lines.some((line) => !line.meal);
  const needsAddress = !isDineIn && orderType === "delivery";

  const isPhoneValid = /^\+?[1-9]\d{8,14}$/.test(phone.trim());
  const isAddressValid = !needsAddress || address.trim().length > 0;
  const canSubmit =
    !isEmpty && !hasInvalidLines && isPhoneValid && isAddressValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      const order = await createOrder({
        meals: lines.map((line) => ({
          meal: line.mealId,
          quantity: line.quantity,
        })),
        phone: phone.trim(),
        ...(needsAddress && { address: address.trim() }),
        ...(isDineIn && tableId && { table: tableId }),
      }).unwrap();

      dispatch(clearCart());
      dispatch(clearTable());
      setPlacedOrder(order);
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      toast.error(
        errorData.data?.message || "Couldn't place your order. Try again.",
      );
    }
  };

  // 1️⃣ Success state - inline for now. Phase 5 replaces this with the
  // real /orders/:id/track live-tracking page.
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <Navbar />
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-4 text-3xl text-brand-orange">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-brand-charcoal mb-2">
            Order Placed!
          </h1>
          <p className="text-brand-charcoal/60 text-sm mb-1">
            Total: {placedOrder.totalPrice.toFixed(2)} EGP
          </p>
          <p className="text-brand-charcoal/60 text-sm mb-6">
            We'll get started on it right away. Live order tracking is coming
            soon.
          </p>
          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange-dark text-white font-medium rounded-lg transition cursor-pointer"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      <div className="max-w-2xl mx-auto p-4 md:p-8 pb-32">
        <h1 className="text-2xl font-bold text-brand-charcoal mb-6">
          Checkout
        </h1>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-orange"></div>
          </div>
        )}

        {isError && (
          <p className="text-center text-red-500 py-16">
            Couldn't load your cart right now. Please try again in a moment.
          </p>
        )}

        {isEmpty && (
          <div className="text-center py-16">
            <p className="text-brand-charcoal/40 mb-4">Your cart is empty.</p>
            <button
              type="button"
              onClick={() => navigate("/menu")}
              className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange-dark text-white font-medium rounded-lg transition cursor-pointer"
            >
              Browse Menu
            </button>
          </div>
        )}

        {!isLoading && !isError && !isEmpty && (
          <div className="space-y-6">
            {hasInvalidLines && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4">
                One or more items in your cart are no longer available.{" "}
                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="font-medium underline cursor-pointer"
                >
                  Go back to your cart
                </button>{" "}
                to remove them before checking out.
              </div>
            )}

            {/* 2️⃣ Order type */}
            <section className="bg-white rounded-2xl border border-brand-peach p-5">
              <h2 className="font-semibold text-brand-charcoal mb-3">
                Order Type
              </h2>

              {isDineIn ? (
                <span className="inline-block text-sm font-semibold text-brand-orange bg-brand-peach px-3 py-1.5 rounded-full">
                  Dine-in (Table order)
                </span>
              ) : (
                <div className="flex gap-2">
                  {(["delivery", "takeaway"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderType(type)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition cursor-pointer ${
                        orderType === type
                          ? "bg-brand-orange text-white"
                          : "bg-brand-peach text-brand-charcoal hover:bg-brand-orange/20"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 3️⃣ Contact details */}
            <section className="bg-white rounded-2xl border border-brand-peach p-5 space-y-4">
              <h2 className="font-semibold text-brand-charcoal">
                Contact Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+201000000000"
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
                />
                {!isPhoneValid && phone.length > 0 && (
                  <p className="text-red-500 text-xs mt-1">
                    Enter a valid phone number
                  </p>
                )}
              </div>

              {needsAddress && (
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, Alexandria"
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-peach focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm"
                  />
                </div>
              )}
            </section>

            {/* 4️⃣ Payment method */}
            <section className="bg-white rounded-2xl border border-brand-peach p-5">
              <h2 className="font-semibold text-brand-charcoal mb-3">
                Payment Method
              </h2>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-brand-orange bg-brand-peach/40 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked
                    readOnly
                    className="accent-brand-orange"
                  />
                  <span className="text-sm font-medium text-brand-charcoal">
                    Cash on {isDineIn ? "table" : "delivery/pickup"}
                  </span>
                </label>

                <label className="flex items-center justify-between gap-3 p-3 rounded-lg border-2 border-brand-peach opacity-50 cursor-not-allowed">
                  <span className="flex items-center gap-3">
                    <input type="radio" name="paymentMethod" disabled />
                    <span className="text-sm font-medium text-brand-charcoal">
                      Online Payment (Paymob)
                    </span>
                  </span>
                  <span className="text-xs font-medium text-brand-charcoal/50">
                    Coming in Phase 5
                  </span>
                </label>
              </div>
            </section>

            {/* 5️⃣ Order summary */}
            <section className="bg-white rounded-2xl border border-brand-peach p-5">
              <h2 className="font-semibold text-brand-charcoal mb-3">
                Order Summary
              </h2>
              <div className="space-y-2 text-sm">
                {lines.map((line) => (
                  <div
                    key={line.mealId}
                    className="flex justify-between text-brand-charcoal/70"
                  >
                    <span>
                      {line.quantity} × {line.meal?.name ?? "Unavailable item"}
                    </span>
                    <span>
                      {((line.meal?.price ?? 0) * line.quantity).toFixed(2)} EGP
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-brand-charcoal mt-3 pt-3 border-t border-brand-peach">
                <span>Total</span>
                <span>{totalPrice.toFixed(2)} EGP</span>
              </div>
            </section>
          </div>
        )}
      </div>

      {!isLoading && !isError && !isEmpty && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-peach p-4 md:p-6 z-40">
          <div className="max-w-2xl mx-auto">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full py-3.5 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? "Placing Order..."
                : `Place Order — ${totalPrice.toFixed(2)} EGP`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
