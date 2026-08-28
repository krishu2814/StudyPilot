import { Response } from "express";
import { documentService } from "../services/document.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "No file uploaded. Please provide a file under the 'file' field.",
      });
      return;
    }

    const { title, subjectId, topicId } = req.body;

    const result = await documentService.ingestDocument({
      userId: req.userId!,
      file: {
        originalname: req.file.originalname,
        buffer: req.file.buffer,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      title,
      subjectId: subjectId && subjectId.trim().length > 0 ? subjectId.trim() : undefined,
      topicId: topicId && topicId.trim().length > 0 ? topicId.trim() : undefined,
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded and processed successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to upload and process document.",
    });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const documents = await documentService.getDocuments(req.userId!);
    res.status(200).json({
      success: true,
      data: { documents },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch documents.",
    });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await documentService.getDocumentById(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      data: { document },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Document not found.",
    });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await documentService.deleteDocument(req.params.id, req.userId!);
    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || "Failed to delete document.",
    });
  }
};
