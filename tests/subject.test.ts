import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { env } from "../src/config/env.js";

describe("Subject & Topic Endpoints", () => {
  const app = createApp();
  const testUserId = "user-subject-test-123";
  const validToken = jwt.sign({ id: testUserId, email: "student@example.com" }, env.JWT_SECRET, { expiresIn: "1h" });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("Authentication Guard", () => {
    it("should reject requests without token", async () => {
      const res = await request(app).get("/api/subjects");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/subjects", () => {
    it("should create a subject successfully", async () => {
      jest.spyOn(prisma.subject, "findUnique").mockResolvedValueOnce(null);
      jest.spyOn(prisma.subject, "create").mockResolvedValueOnce({
        id: "sub-1",
        userId: testUserId,
        name: "DBMS",
        description: "Database Management Systems",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post("/api/subjects")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ name: "DBMS", description: "Database Management Systems" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject.name).toBe("DBMS");
    });

    it("should reject creating a subject with existing name for same user", async () => {
      jest.spyOn(prisma.subject, "findUnique").mockResolvedValueOnce({
        id: "sub-1",
        userId: testUserId,
        name: "DBMS",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post("/api/subjects")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ name: "DBMS" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("already exists");
    });
  });

  describe("GET /api/subjects", () => {
    it("should return list of user subjects", async () => {
      jest.spyOn(prisma.subject, "findMany").mockResolvedValueOnce([
        {
          id: "sub-1",
          userId: testUserId,
          name: "DBMS",
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { topics: 3, documents: 2 },
        } as any,
      ]);

      const res = await request(app)
        .get("/api/subjects")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subjects).toHaveLength(1);
    });
  });

  describe("GET /api/subjects/:id", () => {
    it("should return single subject details", async () => {
      jest.spyOn(prisma.subject, "findFirst").mockResolvedValueOnce({
        id: "sub-1",
        userId: testUserId,
        name: "DBMS",
        description: "Databases",
        createdAt: new Date(),
        updatedAt: new Date(),
        topics: [],
        documents: [],
      } as any);

      const res = await request(app)
        .get("/api/subjects/sub-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject.name).toBe("DBMS");
    });
  });

  describe("POST /api/subjects/:subjectId/topics", () => {
    it("should add a topic to an existing subject", async () => {
      jest.spyOn(prisma.subject, "findFirst").mockResolvedValueOnce({
        id: "sub-1",
        userId: testUserId,
        name: "DBMS",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      jest.spyOn(prisma.topic, "findUnique").mockResolvedValueOnce(null);
      jest.spyOn(prisma.topic, "create").mockResolvedValueOnce({
        id: "top-1",
        subjectId: "sub-1",
        name: "Normalization",
        description: "1NF to BCNF",
        createdAt: new Date(),
      });

      const res = await request(app)
        .post("/api/subjects/sub-1/topics")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ name: "Normalization", description: "1NF to BCNF" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topic.name).toBe("Normalization");
    });
  });

  describe("GET /api/subjects/:subjectId/topics", () => {
    it("should return topics for a subject", async () => {
      jest.spyOn(prisma.subject, "findFirst").mockResolvedValueOnce({
        id: "sub-1",
        userId: testUserId,
        name: "DBMS",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      jest.spyOn(prisma.topic, "findMany").mockResolvedValueOnce([
        {
          id: "top-1",
          subjectId: "sub-1",
          name: "Normalization",
          description: null,
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get("/api/subjects/sub-1/topics")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topics).toHaveLength(1);
    });
  });

  describe("DELETE /api/subjects/topics/:id", () => {
    it("should delete a topic", async () => {
      jest.spyOn(prisma.topic, "findUnique").mockResolvedValueOnce({
        id: "top-1",
        subjectId: "sub-1",
        name: "Normalization",
        description: null,
        createdAt: new Date(),
        subject: {
          id: "sub-1",
          userId: testUserId,
          name: "DBMS",
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any);

      jest.spyOn(prisma.topic, "delete").mockResolvedValueOnce({
        id: "top-1",
        subjectId: "sub-1",
        name: "Normalization",
        description: null,
        createdAt: new Date(),
      });

      const res = await request(app)
        .delete("/api/subjects/topics/top-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
