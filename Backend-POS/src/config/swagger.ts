import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Digital Menu - POS System API",
      version: "1.0.0",
      description:
        "Restaurant POS backend with real-time order tracking, role-based access, and Paymob payment integration.",
    },
    servers: [
      { url: "http://localhost:8000", description: "Local development" },
      {
        url: "https://digital-menu-production-4182.up.railway.app",
        description: "Production (Railway)",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
