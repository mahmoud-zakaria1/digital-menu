import config from "../config/config.js";
import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.schema.js";

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
      error.statusCode = 401;
      return next(error);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { _id: string };

    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      const error: any = new Error("User does not exist anymore!");
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (error: any) {
    error.message = "Invalid or Expired Token!";
    error.statusCode = 401;
    next(error);
  }
};


export const isAdmin = (req: Request, res: Response, next: NextFunction) => {

  if(!req.user) {
    const error: any = new Error("You are not authenticated");
    error.statusCode = 404;
    next(error);
  }

  if(req.user.role !== "Admin") {
    const error: any = new Error("Access Denied! Admins only.");
    error.statusCode = 403;
    next(error);
  }

  next();
};