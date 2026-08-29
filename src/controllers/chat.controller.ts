import { Response } from "express";
import { chatService } from "../services/chat.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    const conversation = await chatService.createConversation(req.userId!, title);

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: { conversation },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create conversation.",
    });
  }
};

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await chatService.getConversations(req.userId!);
    res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch conversations.",
    });
  }
};

export const getConversationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversation = await chatService.getConversationById(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      data: { conversation },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Conversation not found.",
    });
  }
};

export const updateConversationTitle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    const conversation = await chatService.updateTitle(req.params.id, req.userId!, title);

    res.status(200).json({
      success: true,
      message: "Conversation title updated successfully",
      data: { conversation },
    });
  } catch (error: any) {
    const status = error.message === "Conversation not found." ? 404 : 400;
    res.status(status).json({
      success: false,
      error: error.message || "Failed to update conversation title.",
    });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await chatService.deleteConversation(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Failed to delete conversation.",
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, subjectId, topicId } = req.body;

    const result = await chatService.sendMessage({
      userId: req.userId!,
      conversationId: req.params.id,
      content,
      subjectId: subjectId && subjectId.trim().length > 0 ? subjectId.trim() : undefined,
      topicId: topicId && topicId.trim().length > 0 ? topicId.trim() : undefined,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const status = error.message === "Conversation not found." ? 404 : 400;
    res.status(status).json({
      success: false,
      error: error.message || "Failed to send message.",
    });
  }
};
