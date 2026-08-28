import { Response } from "express";
import { quizService } from "../services/quiz.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const generateQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topicName, subjectId, topicId, count, difficulty } = req.body;

    const quiz = await quizService.generateQuiz({
      userId: req.userId!,
      topicName,
      subjectId: subjectId && subjectId.trim().length > 0 ? subjectId.trim() : undefined,
      topicId: topicId && topicId.trim().length > 0 ? topicId.trim() : undefined,
      count: count ? parseInt(String(count), 10) : 3,
      difficulty,
    });

    res.status(201).json({
      success: true,
      message: "Quiz generated successfully",
      data: { quiz },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to generate quiz.",
    });
  }
};

export const getQuizzes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quizzes = await quizService.getQuizzes(req.userId!);
    res.status(200).json({
      success: true,
      data: { quizzes },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch quizzes.",
    });
  }
};

export const getQuizById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quiz = await quizService.getQuizById(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      data: { quiz },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Quiz not found.",
    });
  }
};

export const submitQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answers } = req.body;
    const result = await quizService.submitQuiz({
      id: req.params.id,
      userId: req.userId!,
      answers,
    });

    res.status(200).json({
      success: true,
      message: "Quiz submitted and evaluated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to submit quiz.",
    });
  }
};

export const getQuizResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quiz = await quizService.getQuizResults(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      data: { quiz },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Failed to fetch quiz results.",
    });
  }
};

export const deleteQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await quizService.deleteQuiz(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Failed to delete quiz.",
    });
  }
};
