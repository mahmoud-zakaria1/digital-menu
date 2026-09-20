import { useAppSelector } from "../../app/hooks";
import { selectCartItems } from "./cartSelectors";
import { useGetMealsQuery } from "../menu/menuApiSlice";

export interface CartSummary {
  totalQuantity: number;
  totalPrice: number;
  isLoading: boolean;
}

// Cart state only stores mealId+quantity (see cartSlice), so computing a
// total means cross-referencing against live meal prices. Fetches a
// broad, unfiltered meals page so the total stays correct even if the
// customer added something while a category filter or search was
// active on the menu page.
export const useCartSummary = (): CartSummary => {
  const items = useAppSelector(selectCartItems);
  const { data, isLoading } = useGetMealsQuery({ page: 1, limit: 100 });

  const priceById = new Map((data?.meals ?? []).map((m) => [m._id, m.price]));

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = priceById.get(item.mealId) ?? 0;
    return sum + price * item.quantity;
  }, 0);

  return { totalQuantity, totalPrice, isLoading };
};
