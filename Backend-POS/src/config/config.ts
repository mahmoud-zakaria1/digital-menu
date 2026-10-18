import dotenv from "dotenv";
dotenv.config();

interface Config {
  port: number;
  databaseURI: string;
  nodeEnv: "development" | "production" | "test";
  jwtSecret: string;
  isProduction: boolean;
  frontendUrl: string;
  paymobPublicKey: string;
  paymobSecretKey: string;
  paymobIntegrationId: string;
  paymobHmacSecret: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
}

// 1️⃣ Fail fast instead of silently signing every session with a public,
// guessable fallback secret: anyone who has read this repo could forge a
// valid Admin token against a production deployment that forgot to set it.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

// 2️⃣ Central, frozen configuration object
const config: Config = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  databaseURI: process.env.MONGODB_URI || "mongodb://localhost:27017",
  nodeEnv: (process.env.NODE_ENV as Config["nodeEnv"]) || "development",
  // The fallback only ever applies in development/test (guarded above)
  jwtSecret: process.env.JWT_SECRET || "default_super_secret_key",
  isProduction: process.env.NODE_ENV === "production",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  paymobPublicKey: process.env.PAYMOB_PUBLIC_KEY || "",
  paymobSecretKey: process.env.PAYMOB_SECRET_KEY || "",
  paymobIntegrationId: process.env.PAYMOB_INTEGRATION_ID || "",
  paymobHmacSecret: process.env.PAYMOB_HMAC_SECRET || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
});

export default config;
