import { prisma } from "../db/prisma.js";
import { Prisma } from "@prisma/client";

export interface SimilarChunkResult {
  id: string;
  documentId: string;
  documentTitle: string;
  subjectId: string | null;
  topicId: string | null;
  content: string;
  chunkIndex: number;
  similarity: number;
}

export interface SimilaritySearchParams {
  userId: string;
  queryEmbedding: number[];
  subjectId?: string;
  topicId?: string;
  limit?: number;
  minSimilarity?: number;
}

export class VectorRepository {
  /**
   * Updates the 768-dim vector embedding for a specific document chunk
   */
  async updateChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
    const vectorString = `[${embedding.join(",")}]`;
    await prisma.$executeRaw`
      UPDATE "document_chunks"
      SET "embedding" = ${vectorString}::vector
      WHERE "id" = ${chunkId}
    `;
  }

  /**
   * Updates embeddings for multiple chunks in a single transaction
   */
  async updateChunkEmbeddingsBatch(
    items: { chunkId: string; embedding: number[] }[]
  ): Promise<void> {
    if (items.length === 0) return;

    await prisma.$transaction(
      items.map((item) => {
        const vectorString = `[${item.embedding.join(",")}]`;
        return prisma.$executeRaw`
          UPDATE "document_chunks"
          SET "embedding" = ${vectorString}::vector
          WHERE "id" = ${item.chunkId}
        `;
      })
    );
  }

  /**
   * Searches for most semantically similar document chunks using cosine distance (<=>)
   */
  async findSimilarChunks(params: SimilaritySearchParams): Promise<SimilarChunkResult[]> {
    const { userId, queryEmbedding, subjectId, topicId, limit = 5, minSimilarity = 0.0 } = params;

    const vectorString = `[${queryEmbedding.join(",")}]`;

    // Dynamic filtering conditions with Prisma.sql
    const subjectFilter = subjectId
      ? Prisma.sql`AND d."subjectId" = ${subjectId}`
      : Prisma.empty;

    const topicFilter = topicId
      ? Prisma.sql`AND c."topicId" = ${topicId}`
      : Prisma.empty;

    const results = await prisma.$queryRaw<
      Array<{
        id: string;
        documentId: string;
        documentTitle: string;
        subjectId: string | null;
        topicId: string | null;
        content: string;
        chunkIndex: number;
        similarity: number;
      }>
    >`
      SELECT
        c."id",
        c."documentId",
        d."title" AS "documentTitle",
        d."subjectId",
        c."topicId",
        c."content",
        c."chunkIndex",
        (1 - (c."embedding" <=> ${vectorString}::vector))::float AS "similarity"
      FROM "document_chunks" c
      JOIN "documents" d ON c."documentId" = d."id"
      WHERE d."userId" = ${userId}
        AND c."embedding" IS NOT NULL
        ${subjectFilter}
        ${topicFilter}
      ORDER BY c."embedding" <=> ${vectorString}::vector ASC
      LIMIT ${limit}
    `;

    return results
      .map((row) => ({
        ...row,
        similarity: Number(row.similarity),
      }))
      .filter((row) => row.similarity >= minSimilarity);
  }
}

export const vectorRepository = new VectorRepository();
