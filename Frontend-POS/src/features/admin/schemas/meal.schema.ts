import { z } from "zod";

export const mealSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  // Allow empty string in the form (no image yet), converted to
  // undefined before hitting the API - backend's z.string().url() would
  // otherwise reject an empty string as an invalid URL.
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
});

export type MealFormData = z.infer<typeof mealSchema>;
