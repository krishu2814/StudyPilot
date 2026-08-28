import { Router } from "express";
import {
  generateQuiz,
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResults,
  deleteQuiz,
} from "../controllers/quiz.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all quiz endpoints
router.use(authenticate);

// Generate a new quiz
router.post("/generate", generateQuiz);

// List quizzes and view a specific quiz for taking
router.get("/", getQuizzes);
router.get("/:id", getQuizById);

// Submit quiz answers for AI grading
router.post("/:id/submit", submitQuiz);

// View detailed results and feedback after completion
router.get("/:id/results", getQuizResults);

// Delete quiz
router.delete("/:id", deleteQuiz);

export default router;
