import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export interface ChatHistoryMessage {
  sender: string; // "user" or "assistant"
  content: string;
}

export interface ContextChunkInput {
  content: string;
  documentTitle?: string;
}

export interface GenerateTutorResponseParams {
  question: string;
  history?: ChatHistoryMessage[];
  contextChunks?: ContextChunkInput[];
}

export interface TutorResponse {
  reply: string;
  usedSources: string[];
}

export class AIService {
  private ai: GoogleGenAI | null = null;
  public readonly modelName = "gemini-3.7-flash";

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
      this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
  }

  async generateTutorResponse(params: GenerateTutorResponseParams): Promise<TutorResponse> {
    const { question, history = [], contextChunks = [] } = params;

    if (!question || question.trim().length === 0) {
      throw new Error("Question cannot be empty.");
    }

    const uniqueSources = Array.from(
      new Set(
        contextChunks
          .map((c) => c.documentTitle)
          .filter((t): t is string => Boolean(t && t.trim().length > 0))
      )
    );

    // If no live API client (testing or offline), return mock tutor response
    if (!this.ai || process.env.NODE_ENV === "test") {
      return {
        reply: this.generateMockReply(question, contextChunks),
        usedSources: uniqueSources,
      };
    }

    try {
      const prompt = this.buildPrompt(question, history, contextChunks);

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      const reply = response.text || "I'm sorry, I couldn't formulate an answer at this moment.";

      return {
        reply: reply.trim(),
        usedSources: uniqueSources,
      };
    } catch (error: any) {
      if (process.env.NODE_ENV === "test" || !env.GEMINI_API_KEY) {
        return {
          reply: this.generateMockReply(question, contextChunks),
          usedSources: uniqueSources,
        };
      }
      throw new Error(`Failed to generate tutor response: ${error.message || error}`);
    }
  }

  private buildPrompt(
    question: string,
    history: ChatHistoryMessage[],
    contextChunks: ContextChunkInput[]
  ): string {
    let systemInstruction = `You are StudyPilot AI Tutor, an empathetic, engaging, and expert academic learning assistant.
Your mission:
1. Explain concepts clearly using simple analogies, structured breakdowns, and concrete examples.
2. Ground your explanations primarily in the provided Study Material Context whenever relevant.
3. Apply active learning: End your response with a concise, thoughtful follow-up question or quick concept check to test the student's understanding.
4. Keep a friendly, encouraging, and focused tone. Use markdown headings, bullet points, and code blocks where helpful.`;

    let contextSection = "";
    if (contextChunks.length > 0) {
      contextSection = `\n\n--- STUDY MATERIAL CONTEXT (Ground Truth) ---\n` +
        contextChunks
          .map(
            (c, i) =>
              `[Source ${i + 1}: ${c.documentTitle || "Document"}]\n${c.content}`
          )
          .join("\n\n") +
        `\n--- END CONTEXT ---\n`;
    }

    let historySection = "";
    if (history.length > 0) {
      historySection = `\n\n--- PREVIOUS CONVERSATION ---\n` +
        history
          .map((m) => `${m.sender === "user" ? "Student" : "Tutor"}: ${m.content}`)
          .join("\n") +
        `\n--- END PREVIOUS CONVERSATION ---\n`;
    }

    return `${systemInstruction}${contextSection}${historySection}\n\nStudent: ${question.trim()}\nTutor:`;
  }

  private generateMockReply(question: string, contextChunks: ContextChunkInput[]): string {
    const hasContext = contextChunks.length > 0;
    const contextSnippet = hasContext ? contextChunks[0].content.slice(0, 100) : "";

    return (
      `Great question about "${question.trim()}"!\n\n` +
      (hasContext
        ? `Based on your study materials ("${contextSnippet}..."), `
        : `Let's break down this concept step-by-step: `) +
      `Here is the key takeaway you should focus on: understanding the core principles and how they connect.\n\n` +
      `**Quick Knowledge Check:** Can you explain in your own words how this applies to a real-world scenario?`
    );
  }
}

export const aiService = new AIService();
