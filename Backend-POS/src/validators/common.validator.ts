import { z } from "zod";

export const paginationQueryValidate = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1, "Page must be at least 1")),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(
      z
        .number()
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100"),
    ),
});

export type PaginationQueryInput = z.infer<typeof paginationQueryValidate>;
