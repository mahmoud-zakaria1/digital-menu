import { apiSlice } from "../../api/apiSlice";

// Shape the backend actually returns from POST /payments/create -
// see payments.controller.ts
interface CreatePaymentResponse {
  success: boolean;
  message: string;
  data: { checkoutUrl: string };
}

// 1️⃣ Inject Payment Endpoints into Central apiSlice
export const paymentsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Starts ONE payment attempt for an order and returns Paymob's hosted
    // checkout URL. Each call is a fresh attempt, so it doubles as the
    // "try payment again" action. The backend builds the URL, which means
    // the frontend never needs to know anything about Paymob (keys, URL
    // format). No tag invalidation: the order's paymentStatus changes
    // later, when the webhook fires - not as a result of this call.
    createPayment: builder.mutation<{ checkoutUrl: string }, string>({
      query: (orderId) => ({
        url: "/payments/create",
        method: "POST",
        data: { orderId },
      }),
      transformResponse: (response: CreatePaymentResponse) => response.data,
    }),
  }),
});

// 2️⃣ Export Auto-Generated Hooks for Components
export const { useCreatePaymentMutation } = paymentsApiSlice;
