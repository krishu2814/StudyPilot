import { Router } from "express";
import {
  getDashboardSummary,
  getWeakTopics,
  logStudySession,
  getStudySessions,
} from "../controllers/progress.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all progress & analytics endpoints
router.use(authenticate);

// Mastery dashboard & weakness analytics
router.get("/dashboard", getDashboardSummary);
router.get("/weak-topics", getWeakTopics);

// Study session tracking
router.post("/sessions", logStudySession);
router.get("/sessions", getStudySessions);

export default router;
