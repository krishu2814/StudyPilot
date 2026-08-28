import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export class EmbeddingService {
  private ai: GoogleGenAI | null = null;
  public readonly modelName = "text-embedding-004";
  public readonly dimension = 768;

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
      this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
  }

  async embedText(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text to embed cannot be empty.");
    }

    if (!this.ai) {
      return this.generateMockEmbedding(text);
    }

    try {
      const response = await this.ai.models.embedContent({
        model: this.modelName,
        contents: text.trim(),
      });

      const values = response.embeddings?.[0]?.values;
      if (!values || values.length === 0) {
        throw new Error("Empty embedding received from Gemini API.");
      }

      return values;
    } catch (error: any) {
      if (process.env.NODE_ENV === "test" || !env.GEMINI_API_KEY) {
        return this.generateMockEmbedding(text);
      }
      throw new Error(`Failed to generate embedding: ${error.message || error}`);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    const embeddings: number[][] = [];
    for (const text of texts) {
      const emb = await this.embedText(text);
      embeddings.push(emb);
    }
    return embeddings;
  }

  /**
   * Generates a deterministic 768-dimensional normalized unit vector for testing or offline dev
   */
  generateMockEmbedding(text: string): number[] {
    const vector = new Array<number>(this.dimension).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    for (let i = 0; i < this.dimension; i++) {
      const val = Math.sin(hash + i * 0.1);
      vector[i] = val;
    }

    // Normalize to unit length
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map((val) => parseFloat((val / (norm || 1)).toFixed(6)));
  }
}

export const embeddingService = new EmbeddingService();
