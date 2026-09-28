export type OrderStatus = "pending" | "preparing" | "completed" | "cancelled";

export interface OrderMealItem {
  meal: { _id: string; name: string; price: number } | string;
  quantity: number;
}

export interface Order {
  _id: string;
  user: { _id: string; name: string; email?: string } | string;
  meals: OrderMealItem[];
  totalPrice: number;
  status: OrderStatus;
  phone: string;
  address?: string;
  table?: { _id: string; tableNo: number } | string;
  createdAt?: string;
}
