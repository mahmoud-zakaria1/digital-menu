import { apiSlice } from "../../api/apiSlice";

export interface CreateStaffPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "Cashier" | "Admin";
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Same envelope shape as the register endpoint: the user sits at the top
// level (`user`), not under `data` - see users.controller.ts.
interface CreateStaffResponse {
  success: boolean;
  message: string;
  user: StaffUser;
}

export const staffApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createStaff: builder.mutation<StaffUser, CreateStaffPayload>({
      query: (payload) => ({
        url: "/users/staff",
        method: "POST",
        data: payload,
      }),
      transformResponse: (response: CreateStaffResponse) => response.user,
    }),
  }),
});

export const { useCreateStaffMutation } = staffApiSlice;
