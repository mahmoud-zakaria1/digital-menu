export type OrderStatus = "pending" | "preparing" | "completed" | "cancelled";

// How the customer chose to pay (a choice made at checkout)
export type PaymentMethod = "cash" | "online";

// Where an ONLINE payment currently stands. Only the backend's HMAC-verified
// Paymob webhook ever changes it - the client just displays it.
export type PaymentStatus = "pending" | "paid" | "failed";

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
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
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
  // Count of orders currently "pending" or "preparing" (unpaid online
  // orders are not counted - they aren't real orders yet)
  activeOrders: number;
  bestSellingMeals: BestSellingMeal[];
}
