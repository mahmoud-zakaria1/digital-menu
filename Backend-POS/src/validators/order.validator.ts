import { z } from "zod";

export const createOrderValidate = z
  .object({
    meals: z
      .array(
        z.object({
          meal: z.string().min(1, "Meal is required"),
          quantity: z.number().int().positive("Quantity must be at least 1"),
        }),
      )
      .min(1, "Order must contain at least one meal"),
    address: z.string().optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{8,14}$/, "Please provide a valid phone number"),
  })
  .strict();

export const updateOrderStatusValidate = z
  .object({
    status: z.enum(["pending", "preparing", "completed", "cancelled"]),
  })
  .strict();
