import { ZodError } from "zod";

export interface IFormattedZodError {
  field: string;
  message: string;
}

export const formatZodError = (error: ZodError): IFormattedZodError[] =>
  error.issues.map((err) => ({
    field: err.path.length > 0 ? err.path.join(".") : "field",
    message: err.message,
  }));
