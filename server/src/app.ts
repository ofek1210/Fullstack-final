import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import requestsRoutes from "./routes/requests.routes";
import usersRoutes from "./routes/users.routes";
import postsRoutes from "./routes/posts.routes";
import commentsRoutes from "./routes/comments.routes";
import likesRoutes from "./routes/likes.routes";
import aiRoutes from "./routes/ai.routes";
import { getUploadsRoot } from "./lib/uploads";

const app = express();

const helmetMiddleware: express.RequestHandler = (() => {
  try {
    const moduleName = "helmet";
    // Use dynamic require so tests can run without the dependency installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const helmetModule = require(moduleName);
    const helmetFactory = typeof helmetModule === "function" ? helmetModule : helmetModule.default;
    if (typeof helmetFactory === "function") {
      return helmetFactory();
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Helmet middleware unavailable, continuing without it.");
    }
  }
  return (_req, _res, next) => next();
})();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmetMiddleware);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) {
        return callback(new Error("Not allowed by CORS"));
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(getUploadsRoot()));

app.use("/auth", authRoutes);

app.use("/requests", requestsRoutes);

app.use("/users", usersRoutes);
app.use("/", usersRoutes);
app.use("/posts", postsRoutes);
app.use("/posts", commentsRoutes);
app.use("/posts", likesRoutes);
app.use("/ai", aiRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : "Unexpected error";
  const status = message === "Not allowed by CORS" ? 403 : 500;
  console.error(`Request error: ${message}`);
  res.status(status).json({ error: status === 403 ? "CORS blocked" : "Internal server error" });
});

export default app;
