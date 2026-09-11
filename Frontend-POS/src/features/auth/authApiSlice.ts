import { apiSlice } from "../../api/apiSlice";

// 1️⃣ Inject Auth Endpoints into Central apiSlice
export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Login Mutation
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        data: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    // Register Mutation
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        data: userData,
      }),
    }),

    // Get Current User Profile
    getProfile: builder.query({
      query: () => ({
        url: "/auth/profile",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
  }),
});

// 2️⃣ Export Auto-Generated Hooks for Components
export const { useLoginMutation, useRegisterMutation, useGetProfileQuery } =
  authApiSlice;
