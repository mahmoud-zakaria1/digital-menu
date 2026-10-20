import { z } from "zod";

export const tableSchema = z.object({
  // A plain number - React Hook Form converts the input's string value
  // itself (valueAsNumber on the register call), same approach as the meal
  // price. An empty input becomes NaN, which the custom message below
  // turns into something readable instead of Zod's default type error.
  tableNo: z
    .number({ error: "Table number is required" })
    .int("Table number must be a whole number")
    .positive("Table number must be greater than 0"),
});

export type TableFormData = z.infer<typeof tableSchema>;
