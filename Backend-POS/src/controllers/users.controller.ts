import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { registerValidate } from "../validators/user.validator.js";
import User from "../models/user.schema.js";
import { ZodError } from "zod";

export const register = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validateData = registerValidate.parse(req.body);

    const isUserPresent = await User.findOne({ email: validateData.email });
    if (isUserPresent) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const newUser = new User(validateData);
    await newUser.save();

    return res.status(201).json({
      message: "User Added Successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err: any) => ({
        field: err.path && err.path.length > 0 ? err.path[0] : "field",        
        message: err.message,
      }));

      return res
        .status(400)
        .json({ message: "Validation Error", errors: formattedErrors });
    }
    return res
      .status(400)
      .json({ success: false, message: "Database Validation Error", error: error.message });
  }
};
