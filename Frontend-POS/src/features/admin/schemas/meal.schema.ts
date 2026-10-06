import { z } from "zod";

export const mealSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  // Plain number, not z.coerce.number() - the DOM input's string value
  // is converted to a number by React Hook Form itself (valueAsNumber
  // on the input's register call), not by the schema. Using z.coerce
  // here made the resolver's input type "unknown" while MealFormData
  // (the schema's output type) said "number", which is what caused the
  // "price: unknown" / handleSubmit type errors.
  price: z.number().positive("Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  // Allow empty string in the form (no image yet), converted to
  // undefined before hitting the API - backend's z.string().url() would
  // otherwise reject an empty string as an invalid URL.
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isAvailable: z.boolean(),
});

export type MealFormData = z.infer<typeof mealSchema>;
