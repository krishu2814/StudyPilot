import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface GeneratedQuestion {
  questionText: string;
  expectedAnswer: string;
  difficulty: DifficultyLevel;
  options: string[] | null;
}

export interface GenerateQuestionsParams {
  topicName: string;
  count?: number;
  difficulty?: DifficultyLevel;
  contextChunks?: { content: string }[];
}

export interface EvaluationResult {
  isCorrect: boolean;
  score: number; // 0.0 to 1.0
  feedback: string;
  detectedWeakness: string | null;
}

export interface EvaluateAnswerParams {
  questionText: string;
  expectedAnswer: string;
  userAnswer: string;
}

export class QuizAIService {
  private ai: GoogleGenAI | null = null;
  public readonly modelName = "gemini-3.7-flash";

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
      this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const { topicName, count = 3, difficulty = "intermediate", contextChunks = [] } = params;

    if (!topicName || topicName.trim().length === 0) {
      throw new Error("Topic name is required for quiz generation.");
    }

    if (!this.ai || process.env.NODE_ENV === "test") {
      return this.generateMockQuestions(topicName.trim(), count, difficulty);
    }

    try {
      const contextText =
        contextChunks.length > 0
          ? `\n\nStudy Context:\n${contextChunks.map((c) => c.content).join("\n---\n")}`
          : "";

      const prompt = `You are a university exam creator. Create exactly ${count} quiz questions about "${topicName.trim()}" at "${difficulty}" difficulty level.${contextText}

Format your response as a valid JSON array of objects with the following keys:
- "questionText": The question
- "expectedAnswer": The correct answer (or letter/option if multiple choice)
- "difficulty": "${difficulty}"
- "options": An array of 4 distinct choices if multiple choice, or null for conceptual questions.

Return ONLY the raw JSON array without markdown formatting.`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      const rawText = response.text || "";
      const cleanedJson = rawText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleanedJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q) => ({
          questionText: String(q.questionText || "").trim(),
          expectedAnswer: String(q.expectedAnswer || "").trim(),
          difficulty: difficulty,
          options: Array.isArray(q.options) ? q.options.map(String) : null,
        }));
      }

      return this.generateMockQuestions(topicName.trim(), count, difficulty);
    } catch (error) {
      return this.generateMockQuestions(topicName.trim(), count, difficulty);
    }
  }

  async evaluateAnswer(params: EvaluateAnswerParams): Promise<EvaluationResult> {
    const { questionText, expectedAnswer, userAnswer } = params;

    if (!userAnswer || userAnswer.trim().length === 0) {
      return {
        isCorrect: false,
        score: 0.0,
        feedback: "No answer provided.",
        detectedWeakness: "Unattempted Question",
      };
    }

    if (!this.ai || process.env.NODE_ENV === "test") {
      return this.generateMockEvaluation(expectedAnswer, userAnswer);
    }

    try {
      const prompt = `You are an academic evaluator. Grade the student's answer based on the question and expected answer.

Question: ${questionText}
Expected Correct Answer: ${expectedAnswer}
Student's Answer: ${userAnswer}

Evaluate the student's response for factual correctness, completeness, and conceptual clarity.
Respond with a JSON object containing:
- "score": A float between 0.0 and 1.0 (1.0 for perfect, 0.5-0.9 for partially correct, 0.0 for wrong)
- "isCorrect": Boolean (true if score >= 0.7)
- "feedback": Short, constructive explanation of what was right/wrong
- "detectedWeakness": Short phrase describing the missing concept if flawed, or null if completely correct.

Return ONLY the raw JSON object.`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      const rawText = response.text || "";
      const cleanedJson = rawText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleanedJson);

      const score = Math.max(0.0, Math.min(1.0, Number(parsed.score || 0)));
      return {
        score,
        isCorrect: Boolean(parsed.isCorrect ?? score >= 0.7),
        feedback: String(parsed.feedback || "Answer evaluated.").trim(),
        detectedWeakness: parsed.detectedWeakness ? String(parsed.detectedWeakness).trim() : null,
      };
    } catch (error) {
      return this.generateMockEvaluation(expectedAnswer, userAnswer);
    }
  }

  private generateMockQuestions(
    topicName: string,
    count: number,
    difficulty: DifficultyLevel
  ): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    for (let i = 1; i <= count; i++) {
      questions.push({
        questionText: `What is a primary characteristic of ${topicName} (Question ${i})?`,
        expectedAnswer: `A key characteristic of ${topicName} is efficient data management and consistency.`,
        difficulty,
        options: [
          `A key characteristic of ${topicName} is efficient data management and consistency.`,
          `It only operates in uniprocessor systems.`,
          `It bypasses memory protection mechanisms.`,
          `It executes in non-deterministic time.`,
        ],
      });
    }
    return questions;
  }

  private generateMockEvaluation(expectedAnswer: string, userAnswer: string): EvaluationResult {
    const expected = expectedAnswer.toLowerCase().trim();
    const actual = userAnswer.toLowerCase().trim();

    // Check if user answer matches or contains keywords from expected answer
    if (actual === expected || expected.includes(actual) || actual.includes(expected)) {
      return {
        isCorrect: true,
        score: 1.0,
        feedback: "Excellent! Your answer is accurate and complete.",
        detectedWeakness: null,
      };
    }

    if (actual.length > 5 && expected.split(" ").some((w) => w.length > 4 && actual.includes(w))) {
      return {
        isCorrect: true,
        score: 0.8,
        feedback: "Good attempt! You captured the main concept with minor details missing.",
        detectedWeakness: "Incomplete Terminology",
      };
    }

    return {
      isCorrect: false,
      score: 0.2,
      feedback: `Not quite. Expected: "${expectedAnswer}". Your answer missed the core relationship.`,
      detectedWeakness: "Core Concept Misunderstanding",
    };
  }
}

export const quizAIService = new QuizAIService();
