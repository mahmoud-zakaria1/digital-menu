import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import config from "./config/config.js";
import globalErrorHandling from "./middlewares/globalErrorHandler.js";
import userRouter from "./routes/users.route.js";
import orderRouter from "./routes/orders.route.js";
// import mealRouter from "./routes/meals.route.js";
import cookieParser from "cookie-parser";


const app = express();

const PORT = config.port || 8000;

connectDB();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
// app.use("/api/meals", mealRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error); 
});

app.use(globalErrorHandling);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});