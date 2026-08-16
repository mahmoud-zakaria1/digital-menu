import { NextFunction } from "express";
import { IUser } from "../types/user.types.js";

export const assertUser = (
  user: Omit<IUser, "password"> | undefined,
  next: NextFunction,
): user is Omit<IUser, "password"> => {
  if (!user) {
    const error: any = new Error("You are not authenticated");
    error.statusCode = 401;
    next(error);
    return false;
  }
  return true;
};

export const assertExists = <T>(
  doc: T | null,
  resourceName: string,
  next: NextFunction,
): doc is T => {
  if (!doc) {
    const error: any = new Error(`${resourceName} not found`);
    error.statusCode = 404;
    next(error);
    return false;
  }
  return true;
};
