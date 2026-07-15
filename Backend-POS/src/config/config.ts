import dotenv from "dotenv";
dotenv.config();

interface Config {
  port: number;
  databaseURI: string;
  nodeEnv: "development" | "production" | "test";
}

const config = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  databaseURI: process.env.MONGODB_URI || "mongodb://localhost:2701",
  nodeEnv: process.env.NODE_ENV || "development",
});

export default config;
