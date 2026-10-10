import { z } from "zod";

export const staffSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{8,14}$/,
      "Enter a valid phone number (e.g. +201000000000)",
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Cashier", "Admin"]),
});

export type StaffFormData = z.infer<typeof staffSchema>;
