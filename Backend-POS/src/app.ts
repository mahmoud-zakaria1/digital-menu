import express, { NextFunction, Request, Response } from "express";
import { connectDB } from "./config/db.js";
import  config  from "./config/config.js";
import globalErrorHandling from "./middlewares/globalErrorHandler.js";
// import createHttpError from "http-errors";
const app = express();

const PORT = config.port;
connectDB();

app.use(express.json());


app.use((req: Request, res: Response, next: NextFunction) => {

  // const err = createHttpError(404, "Something went wrong");
  // throw err;
  const error: any = new Error (`Route ${req.originalUrl} not found`)
  error.statusCode = 404;
  next(error);
});

app.use(globalErrorHandling);

// const port = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
