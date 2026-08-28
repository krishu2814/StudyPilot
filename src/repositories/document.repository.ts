import { prisma } from "../db/prisma.js";
import { Document, DocumentChunk, Prisma } from "@prisma/client";

export interface CreateDocumentInput {
  userId: string;
  subjectId?: string | null;
  title: string;
  fileType: string;
  fileSize: number;
  chunks: { content: string; topicId?: string | null }[];
}

export class DocumentRepository {
  async createWithChunks(input: CreateDocumentInput) {
    return prisma.document.create({
      data: {
        userId: input.userId,
        subjectId: input.subjectId || null,
        title: input.title.trim(),
        fileType: input.fileType.toLowerCase(),
        fileSize: input.fileSize,
        chunks: {
          create: input.chunks.map((chunk, index) => ({
            content: chunk.content,
            chunkIndex: index,
            topicId: chunk.topicId || null,
          })),
        },
      },
      include: {
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            topicId: true,
            content: true,
          },
          orderBy: { chunkIndex: "asc" },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.document.findMany({
      where: { userId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            chunks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return prisma.document.findFirst({
      where: { id, userId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            topicId: true,
            content: true,
          },
          orderBy: { chunkIndex: "asc" },
        },
      },
    });
  }

  async delete(id: string): Promise<Document> {
    return prisma.document.delete({
      where: { id },
    });
  }
}

export const documentRepository = new DocumentRepository();
