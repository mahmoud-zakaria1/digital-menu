export interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

// Backend populates category with "name" only (.populate("category", "name")),
// so on a meal it's either the full Category (populated) or just an id string
// (never populated) - components should handle both defensively.
export interface Meal {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: Pick<Category, "_id" | "name"> | string;
  image?: string;
  isAvailable: boolean;
}

// Mirrors the pagination object meals.controller.ts returns exactly.
// (The key used to be spelled "totalPaged", which the backend never sent.)
export interface MealsPagination {
  totalMeals: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
