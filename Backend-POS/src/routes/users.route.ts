import express from "express";
import {
  login,
  register,
  getProfile,
} from "../controllers/users.controller.js";
import { isVerifiedUser } from "../middlewares/tokenVerfication.js";

const userRouter = express.Router();

// 1️⃣ Auth Routes
userRouter.post("/register", register);
userRouter.post("/login", login);

// 2️⃣ Protected Routes
userRouter.get("/profile", isVerifiedUser, getProfile);

export default userRouter;
