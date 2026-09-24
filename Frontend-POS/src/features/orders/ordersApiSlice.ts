import { apiSlice } from "../../api/apiSlice";
import type { Order } from "./types/order.types";

export interface CreateOrderPayload {
  meals: { meal: string; quantity: number }[];
  phone: string;
  address?: string;
  table?: string;
}

// Shape the backend actually returns from POST /api/orders - see
// orders.controller.ts
interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export const ordersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<Order, CreateOrderPayload>({
      query: (payload) => ({
        url: "/orders",
        method: "POST",
        data: payload,
      }),
      transformResponse: (response: CreateOrderResponse) => response.data,
      invalidatesTags: ["Order"],
    }),
  }),
});

export const { useCreateOrderMutation } = ordersApiSlice;
