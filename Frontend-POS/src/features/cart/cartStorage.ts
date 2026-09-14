import type { CartState } from "./cartSlice";

// Single source of truth for the storage key - one cart per device/browser,
// not one per table (see architecture discussion: tableId lives INSIDE the
// cart state, not in the storage key itself).
export const CART_STORAGE_KEY = "digital-menu-cart";

const DEFAULT_CART_STATE: CartState = {
  items: [],
  tableId: undefined,
};

// 1️⃣ Read persisted cart on app startup
export const loadCartFromStorage = (): CartState => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return DEFAULT_CART_STATE;

    const parsed = JSON.parse(raw) as CartState;

    // Defensive: don't trust localStorage blindly - malformed/tampered
    // data should fall back to a clean cart instead of crashing the app.
    if (!Array.isArray(parsed.items)) return DEFAULT_CART_STATE;

    return parsed;
  } catch {
    // Corrupted JSON, private browsing restrictions, etc.
    return DEFAULT_CART_STATE;
  }
};

// 2️⃣ Persist cart after every change (called from the middleware)
export const saveCartToStorage = (state: CartState): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full / disabled - the cart still works in-memory for this
    // session, it just won't survive a reload. Not worth surfacing to
    // the user as an error.
  }
};
