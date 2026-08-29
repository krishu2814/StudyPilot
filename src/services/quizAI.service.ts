import { llmManager, LLMManager } from "./llm/llm.manager.js";

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
  constructor(private llm: LLMManager = llmManager) {}

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const { topicName, count = 3, difficulty = "intermediate", contextChunks = [] } = params;

    if (!topicName || topicName.trim().length === 0) {
      throw new Error("Topic name is required for quiz generation.");
    }

    if (process.env.NODE_ENV === "test") {
      return this.generateMockQuestions(topicName.trim(), count, difficulty);
    }

    try {
      const contextText =
        contextChunks.length > 0
          ? `\n\nStudy Material Context:\n${contextChunks.map((c) => c.content).join("\n---\n")}`
          : "";

      const prompt = `Create exactly ${count} quiz questions about "${topicName.trim()}" at "${difficulty}" difficulty level.${contextText}

Format your response as a valid JSON array of objects with the following keys:
- "questionText": The question text
- "expectedAnswer": The correct answer (or letter/option if multiple choice)
- "difficulty": "${difficulty}"
- "options": An array of 4 distinct choices if multiple choice, or null for conceptual questions.`;

      const systemInstruction = "You are a university exam creator and educational assessment specialist. Return ONLY valid JSON array without markdown wrapping.";

      const { data } = await this.llm.generateJSON<GeneratedQuestion[]>(prompt, {
        systemInstruction,
        temperature: 0.7,
      });

      if (Array.isArray(data) && data.length > 0) {
        return data.map((q) => ({
          questionText: String(q.questionText || "").trim(),
          expectedAnswer: String(q.expectedAnswer || "").trim(),
          difficulty,
          options: Array.isArray(q.options) ? q.options.map(String) : null,
        }));
      }

      return this.generateMockQuestions(topicName.trim(), count, difficulty);
    } catch {
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

    if (process.env.NODE_ENV === "test") {
      return this.generateMockEvaluation(expectedAnswer, userAnswer);
    }

    try {
      const prompt = `Grade the student's answer based on the question and expected answer.

Question: ${questionText}
Expected Correct Answer: ${expectedAnswer}
Student's Answer: ${userAnswer}

Evaluate the student's response for factual correctness, completeness, and conceptual clarity.
Respond with a JSON object containing:
- "score": A float between 0.0 and 1.0 (1.0 for perfect, 0.5-0.9 for partially correct, 0.0 for wrong)
- "isCorrect": Boolean (true if score >= 0.7)
- "feedback": Short, constructive explanation of what was right/wrong
- "detectedWeakness": Short phrase describing the missing concept if flawed, or null if completely correct.`;

      const systemInstruction = "You are an academic evaluator. Return ONLY a valid JSON object.";

      const { data } = await this.llm.generateJSON<Partial<EvaluationResult>>(prompt, {
        systemInstruction,
        temperature: 0.2,
      });

      const score = Math.max(0.0, Math.min(1.0, Number(data.score ?? 0)));
      return {
        score,
        isCorrect: Boolean(data.isCorrect ?? score >= 0.7),
        feedback: String(data.feedback || "Answer evaluated.").trim(),
        detectedWeakness: data.detectedWeakness ? String(data.detectedWeakness).trim() : null,
      };
    } catch {
      return this.generateMockEvaluation(expectedAnswer, userAnswer);
    }
  }

  public generateMockQuestions(
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

  public generateMockEvaluation(expectedAnswer: string, userAnswer: string): EvaluationResult {
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
