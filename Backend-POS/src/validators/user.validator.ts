import { z } from "zod";

export const registerValidate = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Please provide a valid email address"),
    age: z.number().optional(),
    phone: z
      .string()
      .regex(
        /^\+?[1-9]\d{8,14}$/,
        "Please provide a valid international phone number",
      ),
    password: z.string().min(6, "Password must be at least 6 characters"),
    // `role` intentionally removed: this is a PUBLIC route, so accepting a
    // client-supplied role would let anyone self-register as Admin/Cashier.
    // New accounts always fall back to the Mongoose schema default
    // ("Customer"). Staff accounts should be created through a separate,
    // Admin-only endpoint if/when that's needed.
  })
  .strict();

export const loginValidate = z
  .object({
    email: z.string().email("Please provide a valid email adress"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .strict();