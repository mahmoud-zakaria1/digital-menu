import { apiSlice } from "../../api/apiSlice";
import type { Order, OrderStats, OrderStatus } from "./types/order.types";

export interface CreateOrderPayload {
  meals: { meal: string; quantity: number }[];
  phone: string;
  address?: string;
  table?: string;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

interface OrdersPagination {
  totalOrders: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface OrdersData {
  orders: Order[];
  pagination: OrdersPagination;
}

// Shapes the backend actually returns - see orders.controller.ts
interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

interface GetOrdersResponse {
  success: boolean;
  data: OrdersData;
}

interface OrderMutationResponse {
  success: boolean;
  message: string;
  data: Order;
}

interface GetOrderStatsResponse {
  success: boolean;
  data: OrderStats;
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
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),

    // Used by the Cashier/Admin dashboard - the Kanban board fetches a
    // broad, unfiltered page once and splits it into columns by status
    // client-side, rather than running three separate paginated queries.
    getOrders: builder.query<OrdersData, GetOrdersParams>({
      query: (params) => ({
        url: "/orders",
        method: "GET",
        params,
      }),
      transformResponse: (response: GetOrdersResponse) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.orders.map((order) => ({
                type: "Order" as const,
                id: order._id,
              })),
              { type: "Order" as const, id: "LIST" },
            ]
          : [{ type: "Order" as const, id: "LIST" }],
    }),

    // Admin Dashboard analytics cards (revenue, active orders, best sellers)
    getOrderStats: builder.query<OrderStats, void>({
      query: () => ({
        url: "/orders/stats",
        method: "GET",
      }),
      transformResponse: (response: GetOrderStatsResponse) => response.data,
      providesTags: [{ type: "Order", id: "STATS" }],
    }),

    updateOrderStatus: builder.mutation<
      Order,
      { id: string; status: OrderStatus }
    >({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        data: { status },
      }),
      transformResponse: (response: OrderMutationResponse) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "STATS" },
      ],
    }),

    cancelOrder: builder.mutation<Order, string>({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: "PATCH",
      }),
      transformResponse: (response: OrderMutationResponse) => response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: "Order", id },
        { type: "Order", id: "STATS" },
      ],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetOrderStatsQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
} = ordersApiSlice;
