import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { env } from "../src/config/env.js";

describe("Knowledge Mastery & Progress Analytics Endpoints", () => {
  const app = createApp();
  const testUserId = "user-progress-test-123";
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
      const res = await request(app).get("/api/progress/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/progress/dashboard", () => {
    it("should return empty metrics when user has no progress records", async () => {
      jest.spyOn(prisma.userTopicProgress, "findMany").mockResolvedValueOnce([]);
      jest.spyOn(prisma.studySession, "findMany").mockResolvedValueOnce([]);

      const res = await request(app)
        .get("/api/progress/dashboard")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview.totalTopicsTracked).toBe(0);
      expect(res.body.data.overview.overallMasteryPercentage).toBe(0);
      expect(res.body.data.overview.totalStudyMinutes).toBe(0);
    });

    it("should return comprehensive analytics summary", async () => {
      const mockProgress = [
        {
          id: "p-1",
          userId: testUserId,
          subjectId: "sub-1",
          topicId: "top-1",
          masteryScore: 0.9,
          questionsAttempted: 10,
          correctAnswers: 9,
          isWeak: false,
          weaknessNotes: null,
          lastStudiedAt: new Date(),
          subject: { id: "sub-1", name: "DBMS" },
          topic: { id: "top-1", name: "Indexing" },
        },
        {
          id: "p-2",
          userId: testUserId,
          subjectId: "sub-1",
          topicId: "top-2",
          masteryScore: 0.4,
          questionsAttempted: 5,
          correctAnswers: 2,
          isWeak: true,
          weaknessNotes: "Transitive Dependency",
          lastStudiedAt: new Date(),
          subject: { id: "sub-1", name: "DBMS" },
          topic: { id: "top-2", name: "Normalization" },
        },
      ];

      const mockSessions = [
        {
          id: "sess-1",
          userId: testUserId,
          subjectName: "DBMS",
          topicName: "Indexing",
          startedAt: new Date(),
          durationMin: 45,
          summary: "Studied B-Trees and Hash Indexing",
        },
      ];

      jest.spyOn(prisma.userTopicProgress, "findMany").mockResolvedValueOnce(mockProgress as any);
      jest.spyOn(prisma.studySession, "findMany").mockResolvedValueOnce(mockSessions as any);

      const res = await request(app)
        .get("/api/progress/dashboard")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview.totalTopicsTracked).toBe(2);
      expect(res.body.data.overview.masteredTopicsCount).toBe(1);
      expect(res.body.data.overview.weakTopicsCount).toBe(1);
      expect(res.body.data.overview.overallMasteryPercentage).toBe(65);
      expect(res.body.data.overview.totalStudyMinutes).toBe(45);
      expect(res.body.data.weakTopics).toHaveLength(1);
    });
  });

  describe("GET /api/progress/weak-topics", () => {
    it("should return list of weak topics", async () => {
      const mockWeakTopics = [
        {
          id: "p-2",
          userId: testUserId,
          subjectId: "sub-1",
          topicId: "top-2",
          masteryScore: 0.4,
          isWeak: true,
          weaknessNotes: "Transitive Dependency",
          subject: { id: "sub-1", name: "DBMS" },
          topic: { id: "top-2", name: "Normalization" },
        },
      ];

      jest.spyOn(prisma.userTopicProgress, "findMany").mockResolvedValueOnce(mockWeakTopics as any);

      const res = await request(app)
        .get("/api/progress/weak-topics")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.weakTopics).toHaveLength(1);
      expect(res.body.data.weakTopics[0].topic.name).toBe("Normalization");
    });
  });

  describe("POST /api/progress/sessions", () => {
    it("should fail if subjectName is missing", async () => {
      const res = await request(app)
        .post("/api/progress/sessions")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ subjectName: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Subject name is required");
    });

    it("should successfully log a study session", async () => {
      const mockSession = {
        id: "sess-1",
        userId: testUserId,
        subjectName: "Operating Systems",
        topicName: "Deadlocks",
        durationMin: 60,
        summary: "Reviewed Banker's Algorithm",
        startedAt: new Date(),
      };

      jest.spyOn(prisma.studySession, "create").mockResolvedValueOnce(mockSession as any);

      const res = await request(app)
        .post("/api/progress/sessions")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          subjectName: "Operating Systems",
          topicName: "Deadlocks",
          durationMin: 60,
          summary: "Reviewed Banker's Algorithm",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.session.id).toBe("sess-1");
      expect(res.body.data.session.durationMin).toBe(60);
    });
  });

  describe("GET /api/progress/sessions", () => {
    it("should return history of study sessions", async () => {
      jest.spyOn(prisma.studySession, "findMany").mockResolvedValueOnce([
        {
          id: "sess-1",
          userId: testUserId,
          subjectName: "Operating Systems",
          topicName: "Deadlocks",
          durationMin: 60,
          summary: "Reviewed Banker's Algorithm",
          startedAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get("/api/progress/sessions")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessions).toHaveLength(1);
    });
  });
});
