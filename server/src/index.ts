import "dotenv/config";
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import app from "./app";
import { connectDB } from "./config/db";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { getEnv } from "./config/env";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
    },
  },
  // הכי חשוב: נתיב מוחלט, לא יחסי
  apis: [path.resolve(process.cwd(), "src/**/*.ts")],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions as any);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

function resolveCertPath(filePath: string) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(__dirname, "..", filePath);
}

async function main() {
  const env = getEnv();
  if (!env) {
    process.exit(1);
  }

  await connectDB(env.databaseUrl);

  const useHttps = env.nodeEnv !== "production" && env.sslKeyPath && env.sslCertPath;
  if (useHttps) {
    const key = fs.readFileSync(resolveCertPath(env.sslKeyPath));
    const cert = fs.readFileSync(resolveCertPath(env.sslCertPath));
    https.createServer({ key, cert }, app).listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
    return;
  }

  http.createServer(app).listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error(`Startup error: ${message}`);
  process.exit(1);
});
