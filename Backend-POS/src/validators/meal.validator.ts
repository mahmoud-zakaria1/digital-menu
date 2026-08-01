import { z } from "zod";

export const createMealValidate = z.object({
  name: z.string().min(2, "Meal name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
  category: z.string().min(1, "Category id is required"),
  image: z.string().url("Image must be a valid URL").optional(),
  isAvailable: z.boolean().optional().default(true),
});

export const updateMealValidate = createMealValidate.partial();
