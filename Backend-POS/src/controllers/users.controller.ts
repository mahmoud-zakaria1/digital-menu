import { loginValidate } from "../validators/user.validator.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { registerValidate } from "../validators/user.validator.js";
import User from "../models/user.schema.js";
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
      const error: any = new Error("User already exists!");
      error.statusCode = 400;
      return next(error);
    }

    const newUser = new User(validateData);
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User Added Successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validateData = loginValidate.parse(req.body);

    const user = await User.findOne({ email: validateData.email }).select(
      "+password",
    );

    if (!user || !(await user.comparePassword(validateData.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    const token = jwt.sign(
      { _id: user._id, phone: user.phone, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: "1d" },
    );

    res.cookie("accessToken", token, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: config.isProduction ? "none" : "lax",
      secure: config.isProduction,
    });

    return res.status(200).json({
      success: true,
      message: "User Logged in Successfully",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getProfile = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      const error: any = new Error("You are not authenticated");
      error.statusCode = 401;
      return next(error);
    }
    return res.status(200).json({
      success: true,
      message: "Welcome to your profile",
      user: req.user,
    });
  }
  catch (error: any) {
    next(error);
  }
}