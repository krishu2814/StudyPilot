import { progressRepository, ProgressRepository } from "../repositories/progress.repository.js";

export interface LogSessionParams {
  userId: string;
  subjectName: string;
  topicName?: string;
  durationMin?: number;
  summary?: string;
}

export interface RecordQuizProgressParams {
  userId: string;
  subjectId: string;
  topicId: string;
  questionsCount: number;
  correctCount: number;
  score: number; // 0.0 - 1.0
  weaknesses: string[];
}

export class ProgressService {
  constructor(private progressRepo: ProgressRepository = progressRepository) {}

  async getDashboardSummary(userId: string) {
    const [progressRecords, sessions] = await Promise.all([
      this.progressRepo.findAllByUserId(userId),
      this.progressRepo.findStudySessionsByUserId(userId),
    ]);

    const totalTopicsTracked = progressRecords.length;
    const masteredTopicsCount = progressRecords.filter((p) => p.masteryScore >= 0.8).length;
    const weakTopics = progressRecords.filter((p) => p.isWeak || p.masteryScore < 0.6);

    const overallMasteryScore =
      totalTopicsTracked > 0
        ? progressRecords.reduce((sum, p) => sum + p.masteryScore, 0) / totalTopicsTracked
        : 0.0;

    const totalStudyMinutes = sessions.reduce((sum, s) => sum + (s.durationMin || 0), 0);

    return {
      overview: {
        totalTopicsTracked,
        masteredTopicsCount,
        weakTopicsCount: weakTopics.length,
        overallMasteryPercentage: Math.round(overallMasteryScore * 100),
        totalStudyMinutes,
        totalSessionsCount: sessions.length,
      },
      weakTopics: weakTopics.slice(0, 5),
      recentSessions: sessions.slice(0, 5),
      topicsProgress: progressRecords,
    };
  }

  async getWeakTopics(userId: string) {
    return this.progressRepo.findWeakTopics(userId);
  }

  async logStudySession(params: LogSessionParams) {
    const { userId, subjectName, topicName, durationMin, summary } = params;

    if (!subjectName || subjectName.trim().length === 0) {
      throw new Error("Subject name is required to log a study session.");
    }

    return this.progressRepo.createStudySession({
      userId,
      subjectName,
      topicName,
      durationMin: durationMin ? Math.max(1, parseInt(String(durationMin), 10)) : null,
      summary,
    });
  }

  async getStudySessions(userId: string) {
    return this.progressRepo.findStudySessionsByUserId(userId);
  }

  async recordQuizProgress(params: RecordQuizProgressParams) {
    const { userId, subjectId, topicId, questionsCount, correctCount, score, weaknesses } = params;

    const isWeak = score < 0.6 || weaknesses.length > 0;
    const uniqueWeaknesses = Array.from(new Set(weaknesses.filter(Boolean)));
    const weaknessNotes = isWeak && uniqueWeaknesses.length > 0 ? uniqueWeaknesses.join("; ") : null;

    return this.progressRepo.upsertTopicProgress({
      userId,
      subjectId,
      topicId,
      masteryScore: score,
      questionsAttemptedDelta: questionsCount,
      correctAnswersDelta: correctCount,
      isWeak,
      weaknessNotes,
    });
  }
}

export const progressService = new ProgressService();
