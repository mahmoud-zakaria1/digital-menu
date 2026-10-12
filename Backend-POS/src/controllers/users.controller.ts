import { Request, Response, NextFunction } from "express";
import User from "../models/user.schema.js";
import {
  registerValidate,
  createStaffValidate,
  loginValidate,
} from "../validators/user.validator.js";
import { assertUser, assertExists } from "../utils/assertions.js";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  issueSessionCookie,
} from "../utils/session.js";

// 1️⃣ User Registration
export const register = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validateData = registerValidate.parse(req.body);

    // Prevent duplicate user registration
    const isUserPresent = await User.findOne({ email: validateData.email });
    if (isUserPresent) {
      const error: any = new Error("User already exists!");
      error.statusCode = 400;
      return next(error);
    }

    // Save triggers pre('save') hook to hash password
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

// 2️⃣ Create Staff Account (Admin only - gated at the route level)
// The sanctioned way to create Admin/Cashier accounts. The public
// register endpoint can never assign these roles; this one can, but
// only for an authenticated Admin. (The very FIRST Admin can't come from
// here - it needs an existing Admin - see scripts/seedAdmin.ts.)
export const createStaff = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validateData = createStaffValidate.parse(req.body);

    const isUserPresent = await User.findOne({ email: validateData.email });
    if (isUserPresent) {
      const error: any = new Error("User already exists!");
      error.statusCode = 400;
      return next(error);
    }

    // Same save() path as register, so the pre('save') hook hashes the
    // password here too. A duplicate phone is caught by the unique index
    // and turned into a 409 by the global error handler.
    const newUser = new User(validateData);
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Staff account created successfully",
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

// 3️⃣ User Login & Session Cookie Issuance
export const login = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validateData = loginValidate.parse(req.body);

    // Expressly select +password field for verification
    const user = await User.findOne({ email: validateData.email }).select(
      "+password",
    );

    if (!user || !(await user.comparePassword(validateData.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    // Signs the token and sets the httpOnly cookie. A fresh login starts a
    // new session: its absolute-cap clock (authTime) starts now.
    issueSessionCookie(res, user);

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

// 4️⃣ Logout - clears the httpOnly auth cookie.
// Deliberately NOT behind isVerifiedUser: it only clears the caller's own
// cookie, and requiring a valid token to log out would mean someone with
// an expired/invalid token can't clear it. Idempotent - calling it while
// already logged out is harmless.
export const logout = function (req: Request, res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_OPTIONS);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// 5️⃣ Get Current Authenticated User Profile
export const getProfile = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!assertUser(req.user, next)) return;

    const user = await User.findById(req.user._id);
    if (!assertExists(user, "User", next)) return;

    return res.status(200).json({
      success: true,
      message: "Welcome to your profile",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    next(error);
  }
};
