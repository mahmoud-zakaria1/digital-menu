import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

// Redux Store Configuration
export const store = configureStore({
  reducer: {
    // Inject RTK Query reducer under its dedicated path
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    // Enable caching, invalidation, and polling features of RTK Query
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Infer State and Dispatch types for strong TypeScript support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
