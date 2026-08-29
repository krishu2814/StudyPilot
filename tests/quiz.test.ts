import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { env } from "../src/config/env.js";

describe("Quiz & Active Recall Endpoints", () => {
  const app = createApp();
  const testUserId = "user-quiz-test-123";
  const validToken = jwt.sign(
    { id: testUserId, email: "student@example.com" },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("Authentication Guard", () => {
    it("should reject requests without token", async () => {
      const res = await request(app).get("/api/quizzes");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/quizzes/generate", () => {
    it("should fail if topicName is missing", async () => {
      const res = await request(app)
        .post("/api/quizzes/generate")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ topicName: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Topic name is required");
    });

    it("should generate and return a quiz with sanitized questions", async () => {
      const mockCreatedQuiz = {
        id: "quiz-1",
        userId: testUserId,
        subjectId: null,
        topicName: "Deadlock Prevention",
        score: null,
        completed: false,
        createdAt: new Date(),
        questions: [
          {
            id: "q-1",
            quizId: "quiz-1",
            topicId: null,
            questionText: "What condition is eliminated in hold and wait prevention?",
            expectedAnswer: "Require process to request all resources at once.",
            difficulty: "intermediate",
            options: ["Option A", "Option B", "Option C", "Option D"],
          },
        ],
      };

      jest.spyOn(prisma.quiz, "create").mockResolvedValueOnce(mockCreatedQuiz as any);

      const res = await request(app)
        .post("/api/quizzes/generate")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          topicName: "Deadlock Prevention",
          count: 1,
          difficulty: "intermediate",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quiz.id).toBe("quiz-1");
      expect(res.body.data.quiz.questions).toHaveLength(1);
      expect(res.body.data.quiz.questions[0].expectedAnswer).toBeUndefined(); // verify answer is hidden
    });
  });

  describe("GET /api/quizzes", () => {
    it("should return list of user quizzes", async () => {
      jest.spyOn(prisma.quiz, "findMany").mockResolvedValueOnce([
        {
          id: "quiz-1",
          userId: testUserId,
          topicName: "Deadlock Prevention",
          score: 0.9,
          completed: true,
          createdAt: new Date(),
          _count: { questions: 3, answers: 3 },
        } as any,
      ]);

      const res = await request(app)
        .get("/api/quizzes")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quizzes).toHaveLength(1);
    });
  });

  describe("GET /api/quizzes/:id", () => {
    it("should return sanitized questions if quiz is uncompleted", async () => {
      jest.spyOn(prisma.quiz, "findFirst").mockResolvedValueOnce({
        id: "quiz-1",
        userId: testUserId,
        topicName: "Deadlock Prevention",
        score: null,
        completed: false,
        questions: [
          {
            id: "q-1",
            questionText: "Sample question?",
            expectedAnswer: "Secret Answer",
            difficulty: "intermediate",
            options: ["A", "B"],
          },
        ],
        answers: [],
      } as any);

      const res = await request(app)
        .get("/api/quizzes/quiz-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quiz.questions[0].expectedAnswer).toBeUndefined();
    });

    it("should return 404 if quiz not found", async () => {
      jest.spyOn(prisma.quiz, "findFirst").mockResolvedValueOnce(null);

      const res = await request(app)
        .get("/api/quizzes/non-existent")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/quizzes/:id/submit", () => {
    it("should fail if quiz has already been submitted and completed", async () => {
      jest.spyOn(prisma.quiz, "findFirst").mockResolvedValueOnce({
        id: "quiz-1",
        userId: testUserId,
        topicName: "DBMS",
        completed: true,
      } as any);

      const res = await request(app)
        .post("/api/quizzes/quiz-1/submit")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ answers: [{ questionId: "q-1", userAnswer: "ans" }] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("already been submitted");
    });

    it("should fail if answers array is empty or not provided", async () => {
      jest.spyOn(prisma.quiz, "findFirst").mockResolvedValueOnce({
        id: "quiz-1",
        userId: testUserId,
        topicName: "DBMS",
        completed: false,
        questions: [],
      } as any);

      const res = await request(app)
        .post("/api/quizzes/quiz-1/submit")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ answers: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("provide answers");
    });

    it("should grade answers, record topic progress, and return results", async () => {
      const mockQuiz = {
        id: "quiz-1",
        userId: testUserId,
        subjectId: "sub-1",
        topicName: "DBMS Normalization",
        completed: false,
        questions: [
          {
            id: "q-1",
            topicId: "top-1",
            questionText: "What is 1NF?",
            expectedAnswer: "Each column must contain atomic values.",
            difficulty: "beginner",
          },
        ],
      };

      jest.spyOn(prisma.quiz, "findFirst").mockResolvedValueOnce(mockQuiz as any);
      jest.spyOn(prisma, "$transaction").mockResolvedValueOnce([] as any);
      jest.spyOn(prisma.userTopicProgress, "upsert").mockResolvedValueOnce({} as any);

      const res = await request(app)
        .post("/api/quizzes/quiz-1/submit")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          answers: [
            {
              questionId: "q-1",
              userAnswer: "Atomic values only in each column",
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBe(true);
      expect(res.body.data.score).toBeGreaterThan(0);
      expect(res.body.data.answers).toHaveLength(1);
      expect(res.body.data.answers[0].isCorrect).toBe(true);
    });
  });

  describe("GET /api/quizzes/:id/results", () => {
    it("should return full results when quiz is completed", async () => {
      jest.spyOn(prisma.quiz, "findFirst").mockResolvedValueOnce({
        id: "quiz-1",
        userId: testUserId,
        topicName: "DBMS Normalization",
        score: 1.0,
        completed: true,
        questions: [
          { id: "q-1", questionText: "What is 1NF?", expectedAnswer: "Atomic values" },
        ],
        answers: [
          {
            id: "ans-1",
            questionId: "q-1",
            userAnswer: "Atomic values",
            score: 1.0,
            isCorrect: true,
            feedback: "Great!",
            detectedWeakness: null,
          },
        ],
      } as any);

      const res = await request(app)
        .get("/api/quizzes/quiz-1/results")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quiz.score).toBe(1.0);
      expect(res.body.data.quiz.answers).toHaveLength(1);
    });

    it("should return 404 if quiz is not yet completed", async () => {
      jest.spyOn(prisma.quiz, "findFirst").mockResolvedValueOnce({
        id: "quiz-1",
        userId: testUserId,
        completed: false,
      } as any);

      const res = await request(app)
        .get("/api/quizzes/quiz-1/results")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Quiz has not been completed yet");
    });
  });

  describe("DELETE /api/quizzes/:id", () => {
    it("should delete quiz", async () => {
      jest.spyOn(prisma.quiz, "findFirst").mockResolvedValueOnce({
        id: "quiz-1",
        userId: testUserId,
      } as any);

      jest.spyOn(prisma.quiz, "delete").mockResolvedValueOnce({
        id: "quiz-1",
      } as any);

      const res = await request(app)
        .delete("/api/quizzes/quiz-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("deleted successfully");
    });

    it("should return 404 when deleting non-existent quiz", async () => {
      jest.spyOn(prisma.quiz, "findFirst").mockResolvedValueOnce(null);

      const res = await request(app)
        .delete("/api/quizzes/quiz-ghost")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Quiz not found");
    });
  });
});
