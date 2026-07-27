import { z } from "zod";

export const createTableValidate = z.object({
    tableNo: z.number().int().positive("Table number must be a positive number"),
});

export const updateTableValidate = z.object({
    status: z.enum(["Available", "Occupied", "Reserved"]),
    orderId: z.string().optional(),
});