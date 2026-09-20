import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectCartQuantityForMeal } from "../../cart/cartSelectors";
import { addItem, incrementItem, decrementItem } from "../../cart/cartSlice";
import type { Meal } from "../types/menu.types";

interface MealDetailModalProps {
  meal: Meal;
  onClose: () => void;
}

export const MealDetailModal = ({ meal, onClose }: MealDetailModalProps) => {
  const dispatch = useAppDispatch();
  const quantityInCart = useAppSelector(selectCartQuantityForMeal(meal._id));
  const [imageFailed, setImageFailed] = useState(false);

  const categoryName =
    typeof meal.category === "string" ? undefined : meal.category.name;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aspect-[4/3] bg-brand-peach relative">
          {meal.image && !imageFailed ? (
            <img
              src={meal.image}
              alt={meal.name}
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-orange/40">
              No image
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 text-brand-charcoal font-bold cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {categoryName && (
            <span className="text-xs font-medium text-brand-orange">
              {categoryName}
            </span>
          )}
          <h2 className="text-xl font-bold text-brand-charcoal mt-1">
            {meal.name}
          </h2>
          {meal.description && (
            <p className="text-sm text-brand-charcoal/60 mt-2">
              {meal.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-6">
            <span className="text-lg font-bold text-brand-charcoal">
              {(meal.price * (quantityInCart || 1)).toFixed(2)} EGP
            </span>

            {!meal.isAvailable ? (
              <span className="text-sm font-medium text-red-500">
                Unavailable
              </span>
            ) : quantityInCart === 0 ? (
              <button
                type="button"
                onClick={() => dispatch(addItem({ mealId: meal._id }))}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-orange hover:bg-brand-orange-dark text-white text-2xl leading-none font-bold transition cursor-pointer"
                aria-label="Add to cart"
              >
                +
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(decrementItem({ mealId: meal._id }))}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-peach hover:bg-brand-orange/20 text-brand-charcoal text-2xl leading-none font-bold transition cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="text-base font-semibold text-brand-charcoal min-w-5 text-center">
                  {quantityInCart}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch(incrementItem({ mealId: meal._id }))}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-orange hover:bg-brand-orange-dark text-white text-2xl leading-none font-bold transition cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
