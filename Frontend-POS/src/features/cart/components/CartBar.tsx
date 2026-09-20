import { useNavigate } from "react-router-dom";
import { useCartSummary } from "../useCartSummary";

export const CartBar = () => {
  const navigate = useNavigate();
  const { totalQuantity, totalPrice } = useCartSummary();

  if (totalQuantity === 0) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/cart")}
      // grid-cols-3 keeps "View Cart" visually centered regardless of how
      // wide the count badge or the price text end up being on either side.
      className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-sm z-40 grid grid-cols-3 items-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white py-3.5 px-5 rounded-2xl shadow-lg shadow-black/20 transition cursor-pointer"
    >
      <span className="justify-self-start bg-white/25 rounded-full w-7 h-7 flex items-center justify-center text-sm font-semibold">
        {totalQuantity}
      </span>

      <span className="justify-self-center font-semibold">View Cart</span>

      <span className="justify-self-end font-bold">
        {totalPrice.toFixed(2)} EGP
      </span>
    </button>
  );
};
