import config from "../config/config.js";
import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.schema.js";
import { IJwtPayload } from "../types/jwt.types.js";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  renewSessionIfNeeded,
} from "../utils/session.js";

// 1️⃣ Authentication Middleware
export const isVerifiedUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];

    if (!token) {
      const error: any = new Error("Please provide token! Access Denied.");
      error.statusCode = 401;
      return next(error);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as IJwtPayload;

    // The user is re-read from the DB on every request, so deleting or
    // demoting someone takes effect immediately regardless of how long
    // their token has left.
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      const error: any = new Error("User does not exist anymore!");
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;

    // Sliding session: an active user's cookie is renewed once it's a day
    // old (up to the absolute cap) - see utils/session.ts. Runs only after
    // the token and the user have both checked out.
    renewSessionIfNeeded(res, decoded, user);

    next();
  } catch (error: any) {
    error.message = "Invalid or Expired Token!";
    error.statusCode = 401;
    next(error);
  }
};

// 2️⃣ Admin Authorization Middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    const error: any = new Error("You are not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  if (req.user.role !== "Admin") {
    const error: any = new Error("Access Denied! Admins only.");
    error.statusCode = 403;
    return next(error);
  }

  next();
};

// 3️⃣ Admin or Cashier Authorization Middleware
export const isAdminOrCashier = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    const error: any = new Error("You are not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  if (req.user.role !== "Admin" && req.user.role !== "Cashier") {
    const error: any = new Error("Access Denied! Admins or Cashiers only.");
    error.statusCode = 403;
    return next(error);
  }

  next();
};
