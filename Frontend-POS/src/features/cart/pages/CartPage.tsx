import { useNavigate } from "react-router-dom";
import { Navbar } from "../../../components/Navbar";
import { useCartLines } from "../useCartLines";
import { CartLineItem } from "../components/CartLineItem";

export const CartPage = () => {
  const navigate = useNavigate();
  const { lines, totalPrice, isLoading, isError } = useCartLines();

  const isEmpty = !isLoading && !isError && lines.length === 0;
  const hasItems = !isLoading && !isError && lines.length > 0;

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      {/* pb-32 reserves room for the fixed checkout bar when the cart has items */}
      <div className="max-w-2xl mx-auto p-4 md:p-8 pb-32">
        <h1 className="text-2xl font-bold text-brand-charcoal mb-6">
          Your Cart
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

        {hasItems && (
          <div className="bg-white rounded-2xl border border-brand-peach px-5">
            {lines.map((line) => (
              <CartLineItem key={line.mealId} line={line} />
            ))}
          </div>
        )}
      </div>

      {hasItems && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-peach p-4 md:p-6 z-40">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-brand-charcoal/50">Total</p>
              <p className="text-xl font-bold text-brand-charcoal">
                {totalPrice.toFixed(2)} EGP
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/checkout")}
              className="flex-1 max-w-xs py-3.5 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold rounded-xl transition cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
