import { apiSlice } from "../../api/apiSlice";
import type { User } from "./types/auth.types";

// Shape the backend actually returns from /users/profile
interface ProfileResponse {
  success: boolean;
  message: string;
  user: User;
}

// 1️⃣ Inject Auth Endpoints into Central apiSlice
export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Login Mutation
    login: builder.mutation({
      query: (credentials) => ({
        url: "/users/login",
        method: "POST",
        data: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    // Register Mutation
    register: builder.mutation({
      query: (userData) => ({
        url: "/users/register",
        method: "POST",
        data: userData,
      }),
    }),

    // Get Current User Profile
    // Backend wraps the user in { success, message, user }, so we unwrap
    // it here — every component that uses this hook should get the User
    // object directly, not the raw envelope.
    getProfile: builder.query<User, void>({
      query: () => ({
        url: "/users/profile",
        method: "GET",
      }),
      transformResponse: (response: ProfileResponse) => response.user,
      providesTags: ["User"],
    }),
  }),
});

// 2️⃣ Export Auto-Generated Hooks for Components
export const { useLoginMutation, useRegisterMutation, useGetProfileQuery } =
  authApiSlice;
