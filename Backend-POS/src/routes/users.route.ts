import express from "express";
import { login, register } from "../controllers/users.controller.js";
import { isVerifiedUser } from "../middlewares/tokenVerfication.js";

const userRouter = express.Router();

// Register API
userRouter.post("/register", register);
// Login API
userRouter.post("/login", login);
// Profile API
userRouter.get("/profile", isVerifiedUser, (req, res, next) => {
  if (!req.user) {
    const error: any = new Error("You are not authenticated");
    (error as any).statusCode = 401;
    return next(error);
  }
  res.json({
    success: true,
    message: "Welcome to your profile",
    user: req.user,
  });
});

export default userRouter;
