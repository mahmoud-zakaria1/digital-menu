import { loginValaidate } from "../validators/user.validator.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { registerValidate } from "../validators/user.validator.js";
import User from "../models/user.schema.js";
import { ZodError } from "zod";
import config from "../config/config.js";

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
    next(error);
  }
};

export const login = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validateData = loginValaidate.parse(req.body);

    const user = await User.findOne({ email: validateData.email });

    if (!user || !(await user.comparePassword(validateData.password))) {
      return res.status(401).json({ success: false, message: "Invalid Email or Password" });
    }

    const token = jwt.sign(
      { _id: user._id, phone: user.phone, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: "1d" }
    );

    res.cookie("accessToken", token, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: "none",
      secure: true
    })

    return res.status(200).json({
      message: "User Logged in Successfully",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        token: token,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err: any) => ({
        field: err.path && err.path.length > 0 ? err.path[0] : "field",
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: formattedErrors,
      });
    }
    next(error);
  }
};
