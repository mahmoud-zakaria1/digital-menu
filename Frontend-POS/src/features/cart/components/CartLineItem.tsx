import { useState } from "react";
import { useAppDispatch } from "../../../app/hooks";
import { incrementItem, decrementItem, removeItem } from "../cartSlice";
import type { CartLine } from "../useCartLines";

interface CartLineItemProps {
  line: CartLine;
}

export const CartLineItem = ({ line }: CartLineItemProps) => {
  const dispatch = useAppDispatch();
  const [imageFailed, setImageFailed] = useState(false);

  // The meal was removed from the menu after being added to the cart -
  // we still owe the customer a clear way to get rid of the stale line,
  // rather than silently dropping it or crashing on meal.price.
  if (!line.meal) {
    return (
      <div className="flex items-center justify-between py-4 border-b border-brand-peach last:border-b-0">
        <div>
          <p className="text-sm font-medium text-brand-charcoal">
            This item is no longer available
          </p>
          <p className="text-xs text-brand-charcoal/50">
            It may have been removed from the menu
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(removeItem({ mealId: line.mealId }))}
          className="text-sm font-medium text-red-500 hover:text-red-600 transition cursor-pointer"
        >
          Remove
        </button>
      </div>
    );
  }

  const { meal, quantity } = line;

  return (
    <div className="flex items-center gap-3 py-4 border-b border-brand-peach last:border-b-0">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-peach flex-shrink-0">
        {meal.image && !imageFailed ? (
          <img
            src={meal.image}
            alt={meal.name}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-orange/40 text-xs">
            No image
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-brand-charcoal truncate">
          {meal.name}
        </h3>
        <p className="text-sm text-brand-charcoal/50">
          {meal.price.toFixed(2)} EGP
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => dispatch(decrementItem({ mealId: meal._id }))}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-peach hover:bg-brand-orange/20 text-brand-charcoal text-xl leading-none font-bold transition cursor-pointer"
          aria-label={`Decrease ${meal.name} quantity`}
        >
          −
        </button>
        <span className="text-sm font-semibold text-brand-charcoal min-w-5 text-center">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => dispatch(incrementItem({ mealId: meal._id }))}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-orange hover:bg-brand-orange-dark text-white text-xl leading-none font-bold transition cursor-pointer"
          aria-label={`Increase ${meal.name} quantity`}
        >
          +
        </button>
      </div>

      <span className="font-bold text-brand-charcoal w-20 text-right">
        {(meal.price * quantity).toFixed(2)} EGP
      </span>

      <button
        type="button"
        onClick={() => dispatch(removeItem({ mealId: meal._id }))}
        className="w-10 h-10 flex items-center justify-center rounded-full text-brand-charcoal/40 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
        aria-label={`Remove ${meal.name} from cart`}
      >
        🗑
      </button>
    </div>
  );
};
