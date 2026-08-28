import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";

export const createApp = () => {
  const app = express();

  // Standard middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use("/", healthRouter);
  app.use("/api/auth", authRouter);

  // Fallback 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
  });

  return app;
};
