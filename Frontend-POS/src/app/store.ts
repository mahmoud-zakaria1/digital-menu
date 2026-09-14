import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import cartReducer from "../features/cart/cartSlice";
import { cartPersistMiddleware } from "./cartPersistMiddleware";

// Redux Store Configuration
export const store = configureStore({
  reducer: {
    // Inject RTK Query reducer under its dedicated path
    [apiSlice.reducerPath]: apiSlice.reducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    // Enable caching, invalidation, and polling features of RTK Query
    getDefaultMiddleware().concat(apiSlice.middleware,
      cartPersistMiddleware
    ),
});

// Infer State and Dispatch types for strong TypeScript support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
