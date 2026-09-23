import { useAppSelector } from "../../app/hooks";
import { selectCartItems } from "./cartSelectors";
import { useGetMealsQuery } from "../menu/menuApiSlice";
import type { Meal } from "../menu/types/menu.types";

export interface CartLine {
  mealId: string;
  quantity: number;
  // undefined if the meal was removed from the menu after being added to
  // the cart, or hasn't loaded yet - CartLineItem handles this explicitly
  // rather than assuming it's always present.
  meal: Meal | undefined;
}

export interface CartLinesResult {
  lines: CartLine[];
  totalQuantity: number;
  totalPrice: number;
  isLoading: boolean;
  isError: boolean;
}

// Cart state only stores mealId+quantity (see cartSlice), so anything that
// needs to display or total the cart has to cross-reference live meal
// data. Fetches a broad, unfiltered meals page so this stays correct even
// if the customer added something while a category filter or search was
// active on the menu page.
export const useCartLines = (): CartLinesResult => {
  const items = useAppSelector(selectCartItems);
  const { data, isLoading, isError } = useGetMealsQuery({
    page: 1,
    limit: 100,
  });

  const mealsById = new Map((data?.meals ?? []).map((m) => [m._id, m]));

  const lines: CartLine[] = items.map((item) => ({
    mealId: item.mealId,
    quantity: item.quantity,
    meal: mealsById.get(item.mealId),
  }));

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = lines.reduce(
    (sum, line) => sum + (line.meal?.price ?? 0) * line.quantity,
    0,
  );

  return { lines, totalQuantity, totalPrice, isLoading, isError };
};
