export interface Order {
  _id: string;
  totalPrice: number;
  status: "pending" | "preparing" | "completed" | "cancelled";
  phone: string;
  address?: string;
  table?: string;
}
