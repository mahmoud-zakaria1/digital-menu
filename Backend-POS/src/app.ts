import express, { NextFunction, Request, Response } from "express";
import { connectDB } from "./config/db.js";
import config from "./config/config.js";
import globalErrorHandling from "./middlewares/globalErrorHandler.js";
import userRoute from "./routes/users.route.js";
import cookieParser from "cookie-parser";

const app = express();

const PORT = config.port || 8000;

connectDB();

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoute);

app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

app.use(globalErrorHandling);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});