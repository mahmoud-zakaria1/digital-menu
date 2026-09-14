import type { CartState } from './../features/cart/cartSlice';
import type { Middleware } from "@reduxjs/toolkit";
import { saveCartToStorage } from "../features/cart/cartStorage";

// Persists the cart slice to localStorage after any action whose type
// starts with "cart/" (i.e. every action dispatched by cartSlice).
// Kept as a small hand-written middleware instead of pulling in
// redux-persist, since the cart is the only slice that needs this -
// redux-persist's whitelist/rehydration machinery would be overhead
// for a single-slice use case.
interface LocalRootState {
    cart: CartState
}

export const cartPersistMiddleware: Middleware<object, LocalRootState> =
  (store) => (next) => (action) => {
    const result = next(action);

    if (typeof action === "object" && action !== null && "type" in action) {
      const actionType = (action as { type: unknown }).type;
      if (typeof actionType === "string" && actionType.startsWith("cart/")) {
        saveCartToStorage(store.getState().cart);
      }
    }

    return result;
  };
