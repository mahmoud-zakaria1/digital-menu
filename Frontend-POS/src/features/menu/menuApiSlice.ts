import { apiSlice } from "./../../api/apiSlice";
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
      providesTags: ["Meal"],
    }),
    // Public, unpaginated (categories list is small)
    getCategories: builder.query<Category[], void>({
      query: () => ({
        url: "/categories",
        method: "GET",
      }),
      transformResponse: (response: CategoriesResponse) => response.data,
      providesTags: ["Category"],
    }),
  }),
});

// 2️⃣ Export Auto-Generated Hooks for Components
export const { useGetMealsQuery, useGetCategoriesQuery } = menuApiSlice;
