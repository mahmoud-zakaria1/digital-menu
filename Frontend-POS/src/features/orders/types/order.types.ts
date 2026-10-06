export type OrderStatus = "pending" | "preparing" | "completed" | "cancelled";

export interface OrderMealItem {
  // null when the referenced Meal was deleted after the order was placed
  meal: { _id: string; name: string; price: number } | string | null;
  quantity: number;
}

export interface Order {
  _id: string;
  // null when the referenced User was deleted after the order was placed
  user: { _id: string; name: string; email?: string } | string | null;
  meals: OrderMealItem[];
  totalPrice: number;
  status: OrderStatus;
  phone: string;
  address?: string;
  table?: { _id: string; tableNo: number } | string | null;
  createdAt?: string;
}

export interface BestSellingMeal {
  mealId: string;
  name: string;
  totalQuantity: number;
}

export interface OrderStats {
  // Sum of totalPrice across "completed" orders only - see
  // orders.controller.ts getOrderStats for the reasoning.
  totalRevenue: number;
  // Count of orders currently "pending" or "preparing"
  activeOrders: number;
  bestSellingMeals: BestSellingMeal[];
}
