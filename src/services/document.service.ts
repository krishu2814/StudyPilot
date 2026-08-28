import path from "path";
import { documentRepository, DocumentRepository } from "../repositories/document.repository.js";
import { subjectRepository, SubjectRepository } from "../repositories/subject.repository.js";
import { vectorRepository, VectorRepository } from "../repositories/vector.repository.js";
import { embeddingService, EmbeddingService } from "./embedding.service.js";
import { DocumentParser } from "../utils/documentParser.js";
import { RecursiveCharacterTextSplitter, defaultTextSplitter } from "../utils/textSplitter.js";

export interface IngestDocumentParams {
  userId: string;
  file: {
    originalname: string;
    buffer: Buffer;
    size: number;
    mimetype?: string;
  };
  title?: string;
  subjectId?: string;
  topicId?: string;
}

export class DocumentService {
  constructor(
    private docRepo: DocumentRepository = documentRepository,
    private subjectRepo: SubjectRepository = subjectRepository,
    private vectorRepo: VectorRepository = vectorRepository,
    private embService: EmbeddingService = embeddingService,
    private splitter: RecursiveCharacterTextSplitter = defaultTextSplitter
  ) {}

  async ingestDocument(params: IngestDocumentParams) {
    const { userId, file, subjectId, topicId } = params;

    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new Error("A valid non-empty file is required.");
    }

    // Determine and validate file extension
    const ext = path.extname(file.originalname).toLowerCase().replace(/^\./, "");
    if (!["pdf", "txt", "md"].includes(ext)) {
      throw new Error(`Unsupported file format '.${ext}'. Supported formats: pdf, txt, md`);
    }

    // Validate subject ownership if subjectId is provided
    if (subjectId) {
      const subject = await this.subjectRepo.findByIdAndUserId(subjectId, userId);
      if (!subject) {
        throw new Error("Subject not found or does not belong to user.");
      }
    }

    // Extract text from the file buffer
    const rawText = await DocumentParser.extractText(file.buffer, ext);
    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Document does not contain readable text.");
    }

    // Split text into semantic chunks
    const chunkTexts = this.splitter.splitText(rawText);
    if (chunkTexts.length === 0) {
      throw new Error("Failed to extract any text chunks from document.");
    }

    // Determine title
    const docTitle =
      params.title && params.title.trim().length > 0
        ? params.title.trim()
        : path.basename(file.originalname, path.extname(file.originalname));

    // Save document and chunks in repository
    const document = await this.docRepo.createWithChunks({
      userId,
      subjectId: subjectId || null,
      title: docTitle,
      fileType: ext,
      fileSize: file.size,
      chunks: chunkTexts.map((content) => ({
        content,
        topicId: topicId || null,
      })),
    });

    // Generate vector embeddings and persist in pgvector
    try {
      const embeddings = await this.embService.embedBatch(chunkTexts);
      const itemsToUpdate = document.chunks.map((chunk, index) => ({
        chunkId: chunk.id,
        embedding: embeddings[index],
      }));
      await this.vectorRepo.updateChunkEmbeddingsBatch(itemsToUpdate);
    } catch (err) {
      console.warn("Failed to generate/save vector embeddings for document chunks:", err);
    }

    return {
      document,
      chunkCount: chunkTexts.length,
    };
  }

  async getDocuments(userId: string) {
    return this.docRepo.findAllByUserId(userId);
  }

  async getDocumentById(id: string, userId: string) {
    const document = await this.docRepo.findByIdAndUserId(id, userId);
    if (!document) {
      throw new Error("Document not found.");
    }
    return document;
  }

  async deleteDocument(id: string, userId: string) {
    const document = await this.docRepo.findByIdAndUserId(id, userId);
    if (!document) {
      throw new Error("Document not found.");
    }
    return this.docRepo.delete(id);
  }
}

export const documentService = new DocumentService();
