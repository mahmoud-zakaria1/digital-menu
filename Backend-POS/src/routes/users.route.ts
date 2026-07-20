import express from "express";
import { login, register } from "../controllers/users.controller.js";
import { isVerifiedUser } from "../middlewares/tokenVerfication.js";

const route = express.Router();

// Register API
route.post("/register", register);
// Login API
route.post("/login", login);

route.get("/profile", isVerifiedUser, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to your profile",
    user: req.user,
  });
});

export default route;
