import { quizRepository, QuizRepository } from "../repositories/quiz.repository.js";
import { quizAIService, QuizAIService, DifficultyLevel } from "./quizAI.service.js";
import { searchService, SearchService } from "./search.service.js";
import { subjectRepository, SubjectRepository } from "../repositories/subject.repository.js";

export interface GenerateQuizParams {
  userId: string;
  topicName: string;
  subjectId?: string;
  topicId?: string;
  count?: number;
  difficulty?: DifficultyLevel;
}

export interface SubmitAnswerItem {
  questionId: string;
  userAnswer: string;
}

export interface SubmitQuizParams {
  id: string;
  userId: string;
  answers: SubmitAnswerItem[];
}

export class QuizService {
  constructor(
    private quizRepo: QuizRepository = quizRepository,
    private quizAISvc: QuizAIService = quizAIService,
    private searchSvc: SearchService = searchService,
    private subjectRepo: SubjectRepository = subjectRepository
  ) {}

  async generateQuiz(params: GenerateQuizParams) {
    const { userId, topicName, subjectId, topicId, count = 3, difficulty = "intermediate" } = params;

    if (!topicName || typeof topicName !== "string" || topicName.trim().length === 0) {
      throw new Error("Topic name is required for quiz generation.");
    }

    if (subjectId) {
      const subject = await this.subjectRepo.findByIdAndUserId(subjectId, userId);
      if (!subject) {
        throw new Error("Subject not found or does not belong to user.");
      }
    }

    // 1. Fetch relevant study context from user documents
    let contextChunks: { content: string }[] = [];
    try {
      const searchResults = await this.searchSvc.semanticSearch({
        userId,
        query: topicName.trim(),
        subjectId,
        topicId,
        limit: 3,
        minSimilarity: 0.3,
      });
      contextChunks = searchResults.results.map((r) => ({ content: r.content }));
    } catch {
      // Fallback if no documents or search fails
    }

    // 2. Generate questions via AI
    const generatedQuestions = await this.quizAISvc.generateQuestions({
      topicName: topicName.trim(),
      count,
      difficulty,
      contextChunks,
    });

    // 3. Persist quiz and questions
    const quiz = await this.quizRepo.createWithQuestions({
      userId,
      subjectId: subjectId || null,
      topicName: topicName.trim(),
      questions: generatedQuestions.map((q) => ({
        questionText: q.questionText,
        expectedAnswer: q.expectedAnswer,
        difficulty: q.difficulty,
        options: q.options,
        topicId: topicId || null,
      })),
    });

    // 4. Return quiz with sanitized questions (spoiler-free)
    return {
      id: quiz.id,
      topicName: quiz.topicName,
      subjectId: quiz.subjectId,
      completed: quiz.completed,
      createdAt: quiz.createdAt,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        options: q.options,
      })),
    };
  }

  async getQuizzes(userId: string) {
    return this.quizRepo.findAllByUserId(userId);
  }

  async getQuizById(id: string, userId: string) {
    const quiz = await this.quizRepo.findByIdAndUserId(id, userId);
    if (!quiz) {
      throw new Error("Quiz not found.");
    }

    // If not completed, hide expected answers
    if (!quiz.completed) {
      return {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          difficulty: q.difficulty,
          options: q.options,
        })),
      };
    }

    return quiz;
  }

  async submitQuiz(params: SubmitQuizParams) {
    const { id, userId, answers } = params;

    const quiz = await this.quizRepo.findByIdAndUserId(id, userId);
    if (!quiz) {
      throw new Error("Quiz not found.");
    }

    if (quiz.completed) {
      throw new Error("Quiz has already been submitted and graded.");
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new Error("Please provide answers to submit.");
    }

    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
    const gradedAnswers: {
      questionId: string;
      userAnswer: string;
      isCorrect: boolean;
      score: number;
      feedback: string;
      detectedWeakness: string | null;
    }[] = [];

    let totalScore = 0;

    for (const item of answers) {
      const question = questionMap.get(item.questionId);
      if (!question) continue;

      const evalResult = await this.quizAISvc.evaluateAnswer({
        questionText: question.questionText,
        expectedAnswer: question.expectedAnswer,
        userAnswer: item.userAnswer || "",
      });

      gradedAnswers.push({
        questionId: question.id,
        userAnswer: item.userAnswer || "",
        isCorrect: evalResult.isCorrect,
        score: evalResult.score,
        feedback: evalResult.feedback,
        detectedWeakness: evalResult.detectedWeakness,
      });

      totalScore += evalResult.score;
    }

    const totalQuestions = quiz.questions.length || 1;
    const finalScore = totalScore / totalQuestions;

    await this.quizRepo.saveAnswersAndUpdateScore(id, finalScore, gradedAnswers);

    return {
      quizId: id,
      completed: true,
      score: parseFloat(finalScore.toFixed(2)),
      percentage: Math.round(finalScore * 100),
      answers: gradedAnswers,
    };
  }

  async getQuizResults(id: string, userId: string) {
    const quiz = await this.quizRepo.findByIdAndUserId(id, userId);
    if (!quiz) {
      throw new Error("Quiz not found.");
    }
    if (!quiz.completed) {
      throw new Error("Quiz has not been completed yet.");
    }
    return quiz;
  }

  async deleteQuiz(id: string, userId: string) {
    const quiz = await this.quizRepo.findByIdAndUserId(id, userId);
    if (!quiz) {
      throw new Error("Quiz not found.");
    }
    return this.quizRepo.delete(id);
  }
}

export const quizService = new QuizService();
