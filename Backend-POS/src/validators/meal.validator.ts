import { z } from "zod";
import { paginationQueryValidate } from "./common.validator.js";

export const createMealValidate = z
  .object({
    name: z.string().min(2, "Meal name must be at least 2 characters"),
    description: z.string().optional(),
    price: z.number().positive("Price must be greater than 0"),
    category: z.string().min(1, "Category id is required"),
    image: z.string().url("Image must be a valid URL").optional(),
    isAvailable: z.boolean().optional().default(true),
  })
  .strict();

export const updateMealValidate = createMealValidate.partial().strict();

// 💡 Reuse pagination schema & merge meal-specific search & filter params
export const getMealsQueryValidate = paginationQueryValidate
  .merge(
    z.object({
      category: z.string().optional(),
      search: z.string().optional(),
    }),
  )
  .strict();

export type GetMealsQueryInput = z.infer<typeof getMealsQueryValidate>;
