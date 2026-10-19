// 1️⃣ User Entity Representation
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "Customer" | "Cashier" | "Admin";
  createdAt?: string;
  updatedAt?: string;
}

// 2️⃣ API Request Payloads
export interface LoginInput {
  email: string;
  password?: string;
}

// `role` is intentionally absent: public registration can never choose a
// role (the backend's .strict() schema rejects it). Staff accounts are
// created by an Admin through POST /api/users/staff instead.
export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

// 3️⃣ API Response Shape
export interface AuthResponse {
  message: string;
  user: User;
}
