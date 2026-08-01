import { ZodError } from "zod";

export const formatZodError = (error: ZodError) =>
  error.issues.map((err) => ({
    field: err.path.length > 0 ? err.path[0] : "field",
    message: err.message,
  }));
