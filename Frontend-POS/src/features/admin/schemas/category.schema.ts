import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  isActive: z.boolean(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
