import { z } from "zod";

export const createPaymentValidate = z
  .object({
    orderId: z.string().min(1, "Order is required"),
  })
  .strict();
