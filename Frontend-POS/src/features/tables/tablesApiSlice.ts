import { apiSlice } from "../../api/apiSlice";
import type { Table } from "./types/table.types";

export interface AddTablePayload {
  tableNo: number;
}

// Shapes the backend actually returns - see tables.controller.ts
interface GetTablesResponse {
  success: boolean;
  data: Table[];
}

interface TableMutationResponse {
  success: boolean;
  message: string;
  data: Table;
}

// 1️⃣ Inject Table Endpoints into Central apiSlice
export const tablesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Admin / Cashier only. Each table comes with a small summary of its
    // current order (status + total) so the Admin can see what's going on.
    getTables: builder.query<Table[], void>({
      query: () => ({
        url: "/tables",
        method: "GET",
      }),
      transformResponse: (response: GetTablesResponse) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((table) => ({
                type: "Table" as const,
                id: table._id,
              })),
              { type: "Table" as const, id: "LIST" },
            ]
          : [{ type: "Table" as const, id: "LIST" }],
    }),

    // 2️⃣ Admin-only mutations
    addTable: builder.mutation<Table, AddTablePayload>({
      query: (payload) => ({
        url: "/tables",
        method: "POST",
        data: payload,
      }),
      transformResponse: (response: TableMutationResponse) => response.data,
      invalidatesTags: [{ type: "Table", id: "LIST" }],
    }),

    // The backend refuses to delete a table that still has an active
    // order - the caller surfaces that real message to the Admin.
    deleteTable: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tables/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Table", id },
        { type: "Table", id: "LIST" },
      ],
    }),
  }),
});

// 3️⃣ Export Auto-Generated Hooks for Components
export const {
  useGetTablesQuery,
  useAddTableMutation,
  useDeleteTableMutation,
} = tablesApiSlice;
