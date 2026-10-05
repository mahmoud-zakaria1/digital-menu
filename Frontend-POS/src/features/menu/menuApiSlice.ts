import { apiSlice } from "../../api/apiSlice";
import type { Category, Meal, MealsPagination } from "./types/menu.types";

interface GetMealsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

interface MealsData {
  meals: Meal[];
  pagination: MealsPagination;
}

// Shapes the backend actually returns - see meals.controller.ts / categories.controller.ts
interface MealsResponse {
  success: boolean;
  data: MealsData;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

interface MealMutationResponse {
  success: boolean;
  message: string;
  data: Meal;
}

interface CategoryMutationResponse {
  success: boolean;
  message: string;
  data: Category;
}

export interface MealPayload {
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable?: boolean;
}

export type UpdateMealPayload = Partial<MealPayload>;

export interface CategoryPayload {
  name: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  isActive?: boolean;
}

// 1️⃣ Inject Menu Endpoints into Central apiSlice
export const menuApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Public, paginated, supports ?search= and ?category=
    getMeals: builder.query<MealsData, GetMealsParams>({
      query: (params) => ({
        url: "/meals",
        method: "GET",
        params,
      }),
      transformResponse: (response: MealsResponse) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.meals.map((meal) => ({
                type: "Meal" as const,
                id: meal._id,
              })),
              { type: "Meal" as const, id: "LIST" },
            ]
          : [{ type: "Meal" as const, id: "LIST" }],
    }),

    // Public, unpaginated (categories list is small)
    getCategories: builder.query<Category[], void>({
      query: () => ({
        url: "/categories",
        method: "GET",
      }),
      transformResponse: (response: CategoriesResponse) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((category) => ({
                type: "Category" as const,
                id: category._id,
              })),
              { type: "Category" as const, id: "LIST" },
            ]
          : [{ type: "Category" as const, id: "LIST" }],
    }),

    // 2️⃣ Admin-only mutations (Meals)
    createMeal: builder.mutation<Meal, MealPayload>({
      query: (payload) => ({
        url: "/meals",
        method: "POST",
        data: payload,
      }),
      transformResponse: (response: MealMutationResponse) => response.data,
      invalidatesTags: [{ type: "Meal", id: "LIST" }],
    }),

    updateMeal: builder.mutation<
      Meal,
      { id: string; payload: UpdateMealPayload }
    >({
      query: ({ id, payload }) => ({
        url: `/meals/${id}`,
        method: "PUT",
        data: payload,
      }),
      transformResponse: (response: MealMutationResponse) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Meal", id },
        { type: "Meal", id: "LIST" },
      ],
    }),

    deleteMeal: builder.mutation<void, string>({
      query: (id) => ({
        url: `/meals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Meal", id },
        { type: "Meal", id: "LIST" },
      ],
    }),

    // 3️⃣ Admin-only mutations (Categories)
    createCategory: builder.mutation<Category, CategoryPayload>({
      query: (payload) => ({
        url: "/categories",
        method: "POST",
        data: payload,
      }),
      transformResponse: (response: CategoryMutationResponse) => response.data,
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    updateCategory: builder.mutation<
      Category,
      { id: string; payload: UpdateCategoryPayload }
    >({
      query: ({ id, payload }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        data: payload,
      }),
      transformResponse: (response: CategoryMutationResponse) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),

    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),
  }),
});

// 4️⃣ Export Auto-Generated Hooks for Components
export const {
  useGetMealsQuery,
  useGetCategoriesQuery,
  useCreateMealMutation,
  useUpdateMealMutation,
  useDeleteMealMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = menuApiSlice;
