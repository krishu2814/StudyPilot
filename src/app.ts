import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";
import subjectRouter from "./routes/subject.routes.js";
import documentRouter from "./routes/document.routes.js";
import searchRouter from "./routes/search.routes.js";
import chatRouter from "./routes/chat.routes.js";
import quizRouter from "./routes/quiz.routes.js";
import progressRouter from "./routes/progress.routes.js";

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
  app.use("/api/progress", progressRouter);

  // Fallback 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
  });

  // Global JSON error handler (e.g. for multer / file upload validation errors)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const statusCode =
      err.status ||
      err.statusCode ||
      (err.name === "MulterError" || (err.message && err.message.includes("Invalid file type"))
        ? 400
        : 500);

    res.status(statusCode).json({
      success: false,
      error: err.message || "Internal server error",
    });
  });

  return app;
};
