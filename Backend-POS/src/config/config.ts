import dotenv from "dotenv";
dotenv.config();

interface Config {
  port: number;
  databaseURI: string;
  nodeEnv: "development" | "production" | "test";
  jwtSecret: string;
  isProduction: boolean;
}

const config: Config = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  databaseURI: process.env.MONGODB_URI || "mongodb://localhost:2701",
  nodeEnv: (process.env.NODE_ENV as Config["nodeEnv"]) || "development",
  jwtSecret: process.env.JWT_SECRET || "default_super_secret_key",
  isProduction: process.env.NODE_ENV === "production",
});

export default config;
