import { prisma } from "../db/prisma.js";
import { Quiz, Question, QuizAnswer, Prisma } from "@prisma/client";

export interface CreateQuestionInput {
  questionText: string;
  expectedAnswer: string;
  difficulty: string;
  options?: string[] | null;
  topicId?: string | null;
}

export interface CreateQuizInput {
  userId: string;
  subjectId?: string | null;
  topicName: string;
  questions: CreateQuestionInput[];
}

export interface SaveAnswerInput {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
  detectedWeakness?: string | null;
}

export class QuizRepository {
  async createWithQuestions(input: CreateQuizInput) {
    return prisma.quiz.create({
      data: {
        userId: input.userId,
        subjectId: input.subjectId || null,
        topicName: input.topicName.trim(),
        questions: {
          create: input.questions.map((q) => ({
            questionText: q.questionText.trim(),
            expectedAnswer: q.expectedAnswer.trim(),
            difficulty: q.difficulty,
            options: q.options ? q.options : Prisma.DbNull,
            topicId: q.topicId || null,
          })),
        },
      },
      include: {
        questions: true,
      },
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.quiz.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            questions: true,
            answers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return prisma.quiz.findFirst({
      where: { id, userId },
      include: {
        questions: true,
        answers: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async saveAnswersAndUpdateScore(
    quizId: string,
    overallScore: number,
    answers: SaveAnswerInput[]
  ) {
    return prisma.$transaction([
      ...answers.map((ans) =>
        prisma.quizAnswer.create({
          data: {
            quizId,
            questionId: ans.questionId,
            userAnswer: ans.userAnswer.trim(),
            isCorrect: ans.isCorrect,
            score: ans.score,
            feedback: ans.feedback,
            detectedWeakness: ans.detectedWeakness || null,
          },
        })
      ),
      prisma.quiz.update({
        where: { id: quizId },
        data: {
          score: parseFloat(overallScore.toFixed(2)),
          completed: true,
        },
      }),
    ]);
  }

  async delete(id: string): Promise<Quiz> {
    return prisma.quiz.delete({
      where: { id },
    });
  }
}

export const quizRepository = new QuizRepository();
