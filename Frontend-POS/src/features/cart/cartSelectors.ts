import type { RootState } from "../../app/store";

// 1️⃣ Basic selectors
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTableId = (state: RootState) => state.cart.tableId;

// 2️⃣ Total number of individual items (for a badge icon, e.g. "🛒 5")
export const selectCartTotalQuantity = (state: RootState) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

// 3️⃣ Quantity of one specific meal currently in the cart (0 if absent) -
// useful on the menu page to show a stepper instead of an "Add" button
// for meals already in the cart.
export const selectCartQuantityForMeal =
  (mealId: string) =>
  (state: RootState): number =>
    state.cart.items.find((item) => item.mealId === mealId)?.quantity ?? 0;

// NOTE: cart total price is intentionally NOT computed here. It requires
// cross-referencing item.mealId against the /api/meals RTK Query cache
// for live prices, which belongs in the Menu/Cart page hook, not in a
// state selector that shouldn't need to know about the API layer.