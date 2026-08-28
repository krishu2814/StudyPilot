import { Response } from "express";
import { searchService } from "../services/search.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const searchSemantic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query, subjectId, topicId, limit, minSimilarity } = req.body;

    const parsedLimit = limit !== undefined ? parseInt(String(limit), 10) : 5;
    const parsedMinSim = minSimilarity !== undefined ? parseFloat(String(minSimilarity)) : 0.0;

    const result = await searchService.semanticSearch({
      userId: req.userId!,
      query,
      subjectId: subjectId && subjectId.trim().length > 0 ? subjectId.trim() : undefined,
      topicId: topicId && topicId.trim().length > 0 ? topicId.trim() : undefined,
      limit: isNaN(parsedLimit) ? 5 : parsedLimit,
      minSimilarity: isNaN(parsedMinSim) ? 0.0 : parsedMinSim,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to perform semantic search.",
    });
  }
};
