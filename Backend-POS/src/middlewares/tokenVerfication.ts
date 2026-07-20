import config from "../config/config.js";
import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const isVerifiedUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      const error: any = new Error("Please provide token! Access Denied.");
      error.statusCode = 404;
      return next(error);
    }

    const decoded = jwt.sign(token, config.jwtSecret);

    req.user = decoded;

    next();
  } catch (error: any) {
    error.message = "Invalid or Expired Token!";
    error.statusCode = 401;
    next(error);
  }
};
