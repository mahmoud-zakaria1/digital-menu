import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadCartFromStorage } from "./cartStorage";

// 1️⃣ Cart stores references only - mealId + quantity.
// Price, name, and image are intentionally NOT duplicated here; they're
// read from the /api/meals RTK Query cache at display time. Same
// "references over embedding" principle the backend uses for
// Meal -> Category (see Plan.txt). This also means if a meal's price
// changes while it's sitting in someone's cart, the displayed price
// stays live/correct instead of showing a stale snapshot.
export interface CartItem {
  mealId: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  // Present = dine-in order tied to a table (from ?table= in the URL).
  // Absent = delivery or takeaway (address is collected separately at
  // checkout, not stored here).
  tableId?: string;
}

const initialState: CartState = loadCartFromStorage();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // 2️⃣ Add a meal to the cart (or bump quantity if it's already there)
    addItem: (
      state,
      action: PayloadAction<{ mealId: string; quantity?: number }>,
    ) => {
      const { mealId, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.mealId === mealId);

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ mealId, quantity });
      }
    },

    // 3️⃣ Remove a meal from the cart entirely, regardless of quantity
    removeItem: (state, action: PayloadAction<{ mealId: string }>) => {
      state.items = state.items.filter(
        (item) => item.mealId !== action.payload.mealId,
      );
    },

    // 4️⃣ Increment / decrement quantity (decrementing to 0 removes the item)
    incrementItem: (state, action: PayloadAction<{ mealId: string }>) => {
      const existing = state.items.find(
        (item) => item.mealId === action.payload.mealId,
      );
      if (existing) existing.quantity += 1;
    },

    decrementItem: (state, action: PayloadAction<{ mealId: string }>) => {
      const existing = state.items.find(
        (item) => item.mealId === action.payload.mealId,
      );
      if (!existing) return;

      if (existing.quantity <= 1) {
        state.items = state.items.filter(
          (item) => item.mealId !== action.payload.mealId,
        );
      } else {
        existing.quantity -= 1;
      }
    },

    // 5️⃣ Empty the cart (keeps whatever tableId is currently set)
    clearCart: (state) => {
      state.items = [];
    },

    // 6️⃣ Called on /menu load with the ?table= value read from the URL.
    // Encodes the agreed rule: switching to a DIFFERENT table silently
    // clears whatever was in the cart before (avoids ordering table 3's
    // items while sitting at table 7). Landing on /menu without a table
    // param is a no-op - it does not force delivery/takeaway, it just
    // leaves things as they are.
    setTableFromUrl: (state, action: PayloadAction<string | undefined>) => {
      const newTableId = action.payload;
      if (!newTableId) return;

      if (state.tableId && state.tableId !== newTableId) {
        state.items = [];
      }

      state.tableId = newTableId;
    },

    // 7️⃣ Explicitly switch to delivery/takeaway (checkout page will ask
    // for an address separately if needed) - keeps existing cart items.
    clearTable: (state) => {
      state.tableId = undefined;
    },
  },
});

export const {
  addItem,
  removeItem,
  incrementItem,
  decrementItem,
  clearCart,
  setTableFromUrl,
  clearTable,
} = cartSlice.actions;

export default cartSlice.reducer;
