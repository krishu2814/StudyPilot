import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { env } from "../src/config/env.js";

describe("Document Ingestion Endpoints", () => {
  const app = createApp();
  const testUserId = "user-doc-test-123";
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
      const res = await request(app).get("/api/documents");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/documents/upload", () => {
    it("should fail when no file is attached", async () => {
      const res = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("No file uploaded");
    });

    it("should upload and process a text document into chunks", async () => {
      const mockDocument = {
        id: "doc-123",
        userId: testUserId,
        subjectId: null,
        title: "notes",
        fileType: "txt",
        fileSize: 100,
        createdAt: new Date(),
        chunks: [
          {
            id: "chunk-1",
            chunkIndex: 0,
            topicId: null,
            content: "This is study material for DBMS.",
          },
        ],
        subject: null,
      };

      jest.spyOn(prisma.document, "create").mockResolvedValueOnce(mockDocument as any);

      const fileContent = Buffer.from("This is study material for DBMS.", "utf-8");

      const res = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${validToken}`)
        .attach("file", fileContent, "notes.txt");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.document.id).toBe("doc-123");
      expect(res.body.data.chunkCount).toBeGreaterThanOrEqual(1);
    });

    it("should reject upload if specified subjectId does not belong to user", async () => {
      jest.spyOn(prisma.subject, "findFirst").mockResolvedValueOnce(null);

      const fileContent = Buffer.from("Sample topic notes.", "utf-8");

      const res = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${validToken}`)
        .field("subjectId", "non-existent-sub")
        .attach("file", fileContent, "notes.txt");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Subject not found");
    });
  });

  describe("GET /api/documents", () => {
    it("should return list of user documents", async () => {
      const mockDocs = [
        {
          id: "doc-1",
          userId: testUserId,
          title: "Operating Systems Notes",
          fileType: "txt",
          fileSize: 500,
          createdAt: new Date(),
          subject: { id: "sub-1", name: "OS" },
          _count: { chunks: 3 },
        },
      ];

      jest.spyOn(prisma.document, "findMany").mockResolvedValueOnce(mockDocs as any);

      const res = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.documents).toHaveLength(1);
      expect(res.body.data.documents[0].title).toBe("Operating Systems Notes");
    });
  });

  describe("GET /api/documents/:id", () => {
    it("should return single document with its chunks", async () => {
      const mockDoc = {
        id: "doc-1",
        userId: testUserId,
        title: "OS Notes",
        fileType: "txt",
        fileSize: 300,
        createdAt: new Date(),
        subject: null,
        chunks: [
          { id: "c-1", chunkIndex: 0, topicId: null, content: "Chunk 1" },
          { id: "c-2", chunkIndex: 1, topicId: null, content: "Chunk 2" },
        ],
      };

      jest.spyOn(prisma.document, "findFirst").mockResolvedValueOnce(mockDoc as any);

      const res = await request(app)
        .get("/api/documents/doc-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.document.chunks).toHaveLength(2);
    });

    it("should return 404 if document is not found", async () => {
      jest.spyOn(prisma.document, "findFirst").mockResolvedValueOnce(null);

      const res = await request(app)
        .get("/api/documents/non-existent")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/documents/:id", () => {
    it("should delete document successfully", async () => {
      jest.spyOn(prisma.document, "findFirst").mockResolvedValueOnce({
        id: "doc-1",
        userId: testUserId,
      } as any);

      jest.spyOn(prisma.document, "delete").mockResolvedValueOnce({
        id: "doc-1",
      } as any);

      const res = await request(app)
        .delete("/api/documents/doc-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("deleted successfully");
    });
  });
});
