import { Response } from "express";
import { subjectService } from "../services/subject.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const subject = await subjectService.createSubject(req.userId!, name, description);

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: { subject },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create subject.",
    });
  }
};

export const getSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await subjectService.getSubjects(req.userId!);
    res.status(200).json({
      success: true,
      data: { subjects },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch subjects.",
    });
  }
};

export const getSubjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subject = await subjectService.getSubjectById(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      data: { subject },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Subject not found.",
    });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await subjectService.deleteSubject(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Failed to delete subject.",
    });
  }
};

export const createTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const topic = await subjectService.createTopic(req.userId!, req.params.subjectId, name, description);

    res.status(201).json({
      success: true,
      message: "Topic created successfully",
      data: { topic },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create topic.",
    });
  }
};

export const getTopics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const topics = await subjectService.getTopics(req.userId!, req.params.subjectId);
    res.status(200).json({
      success: true,
      data: { topics },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Failed to fetch topics.",
    });
  }
};

export const deleteTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await subjectService.deleteTopic(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      message: "Topic deleted successfully",
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Failed to delete topic.",
    });
  }
};
