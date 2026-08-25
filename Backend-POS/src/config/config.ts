import dotenv from "dotenv";
dotenv.config();

interface Config {
  port: number;
  databaseURI: string;
  nodeEnv: "development" | "production" | "test";
  jwtSecret: string;
  isProduction: boolean;
  frontendUrl: string;
  paymobSecretKey: string;
  paymobIntegrationId: string;
  paymobHmacSecret: string;
}

const config: Config = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  databaseURI: process.env.MONGODB_URI || "mongodb://localhost:27017",
  nodeEnv: (process.env.NODE_ENV as Config["nodeEnv"]) || "development",
  jwtSecret: process.env.JWT_SECRET || "default_super_secret_key",
  isProduction: process.env.NODE_ENV === "production",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  paymobSecretKey: process.env.PAYMOB_SECRET_KEY || "",
  paymobIntegrationId: process.env.PAYMOB_INTEGRATION_ID || "",
  paymobHmacSecret: process.env.PAYMOB_HMAC_SECRET || "",
});

export default config;
