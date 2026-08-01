import { z } from "zod";

export const createCategoryValidate = z
    .object({
        name: z.string().min(2, "Category name must be at least 2 characters"),
    })
    .strict();

export const updateCategoryValidate = z
    .object({
        name: z.string().min(2, "Category name must be at least 2 characters").optional(),
        isActive: z.boolean().optional(),
    })    
    .strict();