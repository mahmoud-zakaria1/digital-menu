import { z } from "zod";

export const registerValidate = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Please provide a valid email address"),
  age: z.number().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{8,14}$/, "Please provide a valid international phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Cashier", "Customer"]).default("Customer"),
}); 