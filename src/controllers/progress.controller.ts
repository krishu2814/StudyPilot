import { Response } from "express";
import { progressService } from "../services/progress.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const summary = await progressService.getDashboardSummary(req.userId!);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch dashboard summary.",
    });
  }
};

export const getWeakTopics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const weakTopics = await progressService.getWeakTopics(req.userId!);
    res.status(200).json({
      success: true,
      data: { weakTopics },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch weak topics.",
    });
  }
};

export const logStudySession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectName, topicName, durationMin, summary } = req.body;

    const session = await progressService.logStudySession({
      userId: req.userId!,
      subjectName,
      topicName,
      durationMin,
      summary,
    });

    res.status(201).json({
      success: true,
      message: "Study session logged successfully",
      data: { session },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to log study session.",
    });
  }
};

export const getStudySessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await progressService.getStudySessions(req.userId!);
    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch study sessions.",
    });
  }
};
