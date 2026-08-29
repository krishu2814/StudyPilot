import { prisma } from "../db/prisma.js";
import { UserTopicProgress, StudySession } from "@prisma/client";

export interface UpsertTopicProgressInput {
  userId: string;
  subjectId: string;
  topicId: string;
  masteryScore: number;
  questionsAttemptedDelta: number;
  correctAnswersDelta: number;
  isWeak: boolean;
  weaknessNotes?: string | null;
}

export interface CreateStudySessionInput {
  userId: string;
  subjectName: string;
  topicName?: string | null;
  durationMin?: number | null;
  summary?: string | null;
}

export class ProgressRepository {
  async upsertTopicProgress(input: UpsertTopicProgressInput): Promise<UserTopicProgress> {
    const {
      userId,
      subjectId,
      topicId,
      masteryScore,
      questionsAttemptedDelta,
      correctAnswersDelta,
      isWeak,
      weaknessNotes,
    } = input;

    return prisma.userTopicProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId,
        },
      },
      create: {
        userId,
        subjectId,
        topicId,
        masteryScore: parseFloat(masteryScore.toFixed(2)),
        questionsAttempted: questionsAttemptedDelta,
        correctAnswers: correctAnswersDelta,
        isWeak,
        weaknessNotes: weaknessNotes || null,
        lastStudiedAt: new Date(),
      },
      update: {
        masteryScore: parseFloat(masteryScore.toFixed(2)),
        questionsAttempted: {
          increment: questionsAttemptedDelta,
        },
        correctAnswers: {
          increment: correctAnswersDelta,
        },
        isWeak,
        weaknessNotes: weaknessNotes !== undefined ? weaknessNotes : undefined,
        lastStudiedAt: new Date(),
      },
      include: {
        subject: {
          select: { id: true, name: true },
        },
        topic: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.userTopicProgress.findMany({
      where: { userId },
      include: {
        subject: {
          select: { id: true, name: true },
        },
        topic: {
          select: { id: true, name: true },
        },
      },
      orderBy: { lastStudiedAt: "desc" },
    });
  }

  async findWeakTopics(userId: string) {
    return prisma.userTopicProgress.findMany({
      where: {
        userId,
        OR: [{ isWeak: true }, { masteryScore: { lt: 0.6 } }],
      },
      include: {
        subject: {
          select: { id: true, name: true },
        },
        topic: {
          select: { id: true, name: true },
        },
      },
      orderBy: { masteryScore: "asc" },
    });
  }

  async createStudySession(input: CreateStudySessionInput): Promise<StudySession> {
    return prisma.studySession.create({
      data: {
        userId: input.userId,
        subjectName: input.subjectName.trim(),
        topicName: input.topicName ? input.topicName.trim() : null,
        durationMin: input.durationMin || null,
        summary: input.summary ? input.summary.trim() : null,
      },
    });
  }

  async findStudySessionsByUserId(userId: string) {
    return prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
    });
  }
}

export const progressRepository = new ProgressRepository();
