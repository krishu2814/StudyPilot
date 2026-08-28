import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";
import subjectRouter from "./routes/subject.routes.js";
import documentRouter from "./routes/document.routes.js";
import searchRouter from "./routes/search.routes.js";
import chatRouter from "./routes/chat.routes.js";
import quizRouter from "./routes/quiz.routes.js";

export const createApp = () => {
  const app = express();

  // Standard middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use("/", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/subjects", subjectRouter);
  app.use("/api/documents", documentRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/conversations", chatRouter);
  app.use("/api/quizzes", quizRouter);

  // Fallback 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
  });

  return app;
};
