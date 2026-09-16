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

export interface MealsPagination {
  totalMeals: number;
  totalPaged: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
