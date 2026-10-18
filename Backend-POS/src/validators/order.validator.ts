import { z } from "zod";
import { paginationQueryValidate } from "./common.validator.js";

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
    // Optional: set when the order originates from a table's QR code
    // (frontend reads ?table=<id> from the URL and sends it here).
    table: z.string().optional(),
    // How the customer wants to pay. This is only a CHOICE - whether an
    // online order is actually paid is decided by the Paymob webhook, never
    // by the client (paymentStatus is deliberately not accepted here).
    paymentMethod: z.enum(["cash", "online"]).default("cash"),
  })
  .strict();

export const updateOrderStatusValidate = z
  .object({
    status: z.enum(["pending", "preparing", "completed", "cancelled"]),
  })
  .strict();

// 💡 Query params schema for pagination and filtering
export const getOrdersQueryValidate = paginationQueryValidate
  .merge(
    z.object({
      status: z
        .enum(["pending", "preparing", "completed", "cancelled"])
        .optional(),
    }),
  )
  .strict();

export type GetOrdersQueryInput = z.infer<typeof getOrdersQueryValidate>;
