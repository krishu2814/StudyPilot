import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { env } from "../src/config/env.js";

describe("Semantic Search Endpoints", () => {
  const app = createApp();
  const testUserId = "user-search-test-123";
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
      const res = await request(app)
        .post("/api/search/semantic")
        .send({ query: "What is normal form in DBMS?" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/search/semantic", () => {
    it("should fail if query is missing or empty", async () => {
      const res = await request(app)
        .post("/api/search/semantic")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ query: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Search query cannot be empty");
    });

    it("should return semantically similar chunks with scores", async () => {
      const mockRawResults = [
        {
          id: "chunk-1",
          documentId: "doc-1",
          documentTitle: "DBMS Chapter 3",
          subjectId: "sub-1",
          topicId: "topic-1",
          content: "Third Normal Form (3NF) eliminates transitive dependency.",
          chunkIndex: 2,
          similarity: 0.892,
        },
        {
          id: "chunk-2",
          documentId: "doc-1",
          documentTitle: "DBMS Chapter 3",
          subjectId: "sub-1",
          topicId: "topic-1",
          content: "BCNF is a stricter version of 3NF.",
          chunkIndex: 3,
          similarity: 0.824,
        },
      ];

      jest.spyOn(prisma, "$queryRaw").mockResolvedValueOnce(mockRawResults as any);

      const res = await request(app)
        .post("/api/search/semantic")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          query: "Tell me about normalization and 3NF",
          limit: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.query).toBe("Tell me about normalization and 3NF");
      expect(res.body.data.resultsCount).toBe(2);
      expect(res.body.data.results[0].similarity).toBeCloseTo(0.892, 3);
      expect(res.body.data.results[0].content).toContain("Third Normal Form");
    });

    it("should filter results by minSimilarity threshold", async () => {
      const mockRawResults = [
        {
          id: "chunk-1",
          documentId: "doc-1",
          documentTitle: "DBMS Chapter 3",
          subjectId: null,
          topicId: null,
          content: "Relevant high score chunk",
          chunkIndex: 0,
          similarity: 0.95,
        },
        {
          id: "chunk-2",
          documentId: "doc-2",
          documentTitle: "OS Chapter 1",
          subjectId: null,
          topicId: null,
          content: "Low score unrelated chunk",
          chunkIndex: 0,
          similarity: 0.35,
        },
      ];

      jest.spyOn(prisma, "$queryRaw").mockResolvedValueOnce(mockRawResults as any);

      const res = await request(app)
        .post("/api/search/semantic")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          query: "DBMS indexing",
          minSimilarity: 0.7,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resultsCount).toBe(1);
      expect(res.body.data.results[0].id).toBe("chunk-1");
    });
  });
});
