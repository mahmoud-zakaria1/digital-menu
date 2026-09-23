import { useCartLines } from "./useCartLines";

export interface CartSummary {
  totalQuantity: number;
  totalPrice: number;
  isLoading: boolean;
}

export const useCartSummary = (): CartSummary => {
  const { totalQuantity, totalPrice, isLoading } = useCartLines();
  return { totalQuantity, totalPrice, isLoading };
};
