import { vectorRepository, VectorRepository, SimilarChunkResult } from "../repositories/vector.repository.js";
import { embeddingService, EmbeddingService } from "./embedding.service.js";

export interface SemanticSearchParams {
  userId: string;
  query: string;
  subjectId?: string;
  topicId?: string;
  limit?: number;
  minSimilarity?: number;
}

export interface SemanticSearchResult {
  query: string;
  resultsCount: number;
  results: SimilarChunkResult[];
}

export class SearchService {
  constructor(
    private vectorRepo: VectorRepository = vectorRepository,
    private embService: EmbeddingService = embeddingService
  ) {}

  async semanticSearch(params: SemanticSearchParams): Promise<SemanticSearchResult> {
    const { userId, query, subjectId, topicId, limit = 5, minSimilarity = 0.0 } = params;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      throw new Error("Search query cannot be empty.");
    }

    const trimmedQuery = query.trim();

    // 1. Generate query vector embedding
    const queryEmbedding = await this.embService.embedText(trimmedQuery);

    // 2. Perform cosine distance search in pgvector
    const results = await this.vectorRepo.findSimilarChunks({
      userId,
      queryEmbedding,
      subjectId,
      topicId,
      limit,
      minSimilarity,
    });

    return {
      query: trimmedQuery,
      resultsCount: results.length,
      results,
    };
  }
}

export const searchService = new SearchService();
