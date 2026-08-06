import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import config from "../config/config.js";
import { formatZodError } from "../utils/formatZodError.js";

const globalErrorHandling = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1️⃣ Zod Request Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: formatZodError(err),
    });
  }

  // 2️⃣ Mongoose Invalid ObjectId / Cast Errors
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // 3️⃣ Mongoose Schema Validation Errors
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: "Database Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // 4️⃣ MongoDB Duplicate Key Error (Unique Constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // 5️⃣ Generic / Unhandled Application Errors
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
};

export default globalErrorHandling;
