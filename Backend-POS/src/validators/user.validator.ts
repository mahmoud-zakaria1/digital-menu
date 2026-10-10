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
    // `role` intentionally absent: this is a PUBLIC route, so accepting a
    // client-supplied role would let anyone self-register as Admin or
    // Cashier. New accounts always fall back to the Mongoose schema
    // default ("Customer"). Staff accounts go through createStaffValidate
    // below, behind an Admin-only route.
  })
  .strict();

// Used only by the Admin-only POST /api/users/staff endpoint. Unlike the
// public register schema, `role` IS accepted here - but restricted to
// the two staff roles (a "staff" endpoint creating a Customer would be
// meaningless), and the route itself is gated behind isAdmin.
export const createStaffValidate = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Please provide a valid email address"),
    phone: z
      .string()
      .regex(
        /^\+?[1-9]\d{8,14}$/,
        "Please provide a valid international phone number",
      ),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["Admin", "Cashier"]),
  })
  .strict();

export const loginValidate = z
  .object({
    email: z.string().email("Please provide a valid email adress"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .strict();
