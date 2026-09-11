// 1️⃣ User Entity Representation
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "Customer" | "Cashier" | "Admin";
  createdAt?: string;
  updatedAt?: string;
}

// 2️⃣ API Request Payloads
export interface LoginInput {
  email: string;
  password?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password?: string;
  role?: "Customer" | "Cashier" | "Admin";
}

// 3️⃣ API Response Shape
export interface AuthResponse {
  message: string;
  user: User;
}
