import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectCartQuantityForMeal } from "../../cart/cartSelectors";
import { addItem, incrementItem, decrementItem } from "../../cart/cartSlice";
import type { Meal } from "../types/menu.types";

interface MealCardProps {
  meal: Meal;
  onOpen: (meal: Meal) => void;
}

export const MealCard = ({ meal, onOpen }: MealCardProps) => {
  const dispatch = useAppDispatch();
  const quantityInCart = useAppSelector(selectCartQuantityForMeal(meal._id));
  const [imageFailed, setImageFailed] = useState(false);

  const categoryName =
    typeof meal.category === "string" ? undefined : meal.category.name;

  const stopPropagation = (e: MouseEvent) => e.stopPropagation();

  const handleCardKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(meal);
    }
  };

  return (
    <div
      onClick={() => onOpen(meal)}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${meal.name}`}
      className="group bg-white rounded-2xl border border-brand-peach overflow-hidden flex flex-col transition-shadow duration-300 hover:shadow-lg hover:shadow-brand-orange/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange"
    >
      <div className="aspect-[4/3] bg-brand-peach overflow-hidden">
        {meal.image && !imageFailed ? (
          <img
            src={meal.image}
            alt={meal.name}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-orange/40 text-sm">
            No image
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {categoryName && (
          <span className="text-xs font-medium text-brand-orange mb-1">
            {categoryName}
          </span>
        )}

        <h3 className="font-semibold text-brand-charcoal text-lg">
          {meal.name}
        </h3>

        {meal.description && (
          <p className="text-sm text-brand-charcoal/60 mt-1 line-clamp-2 flex-1">
            {meal.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-brand-charcoal">
            {(meal.price * (quantityInCart || 1)).toFixed(2)} EGP
            {quantityInCart > 1 && (
              <span className="block text-xs font-normal text-brand-charcoal/50">
                {quantityInCart} × {meal.price.toFixed(2)}
              </span>
            )}
          </span>

          {!meal.isAvailable ? (
            <span className="text-xs font-medium text-red-500">
              Unavailable
            </span>
          ) : quantityInCart === 0 ? (
            <button
              type="button"
              onClick={(e) => {
                stopPropagation(e);
                dispatch(addItem({ mealId: meal._id }));
              }}
              // 48px touch target, text-2xl + leading-none so the glyph
              // itself sits dead-center in the circle instead of looking
              // small/low (a font's line-height throws off "+"/"−"
              // vertical centering at small sizes).
              className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-orange hover:bg-brand-orange-dark text-white text-2xl leading-none font-bold transition cursor-pointer"
              aria-label={`Add ${meal.name} to cart`}
            >
              +
            </button>
          ) : (
            <div className="flex items-center gap-2" onClick={stopPropagation}>
              <button
                type="button"
                onClick={() => dispatch(decrementItem({ mealId: meal._id }))}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-peach hover:bg-brand-orange/20 text-brand-charcoal text-2xl leading-none font-bold transition cursor-pointer"
                aria-label={`Decrease ${meal.name} quantity`}
              >
                −
              </button>
              <span className="text-sm font-semibold text-brand-charcoal min-w-4 text-center">
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={() => dispatch(incrementItem({ mealId: meal._id }))}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-orange hover:bg-brand-orange-dark text-white text-2xl leading-none font-bold transition cursor-pointer"
                aria-label={`Increase ${meal.name} quantity`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
