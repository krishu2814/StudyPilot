import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { env } from "../src/config/env.js";

describe("Chat & AI Tutor Endpoints", () => {
  const app = createApp();
  const testUserId = "user-chat-test-123";
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
      const res = await request(app).get("/api/conversations");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/conversations", () => {
    it("should create a new conversation session", async () => {
      jest.spyOn(prisma.conversation, "create").mockResolvedValueOnce({
        id: "conv-1",
        userId: testUserId,
        title: "Study OS Concepts",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ title: "Study OS Concepts" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversation.id).toBe("conv-1");
      expect(res.body.data.conversation.title).toBe("Study OS Concepts");
    });
  });

  describe("GET /api/conversations", () => {
    it("should return list of conversations for user", async () => {
      jest.spyOn(prisma.conversation, "findMany").mockResolvedValueOnce([
        {
          id: "conv-1",
          userId: testUserId,
          title: "Study OS",
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { messages: 4 },
          messages: [{ content: "Last message", sender: "assistant", createdAt: new Date() }],
        } as any,
      ]);

      const res = await request(app)
        .get("/api/conversations")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversations).toHaveLength(1);
    });
  });

  describe("GET /api/conversations/:id", () => {
    it("should return single conversation with full message history", async () => {
      jest.spyOn(prisma.conversation, "findFirst").mockResolvedValueOnce({
        id: "conv-1",
        userId: testUserId,
        title: "Study OS",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          { id: "m-1", conversationId: "conv-1", sender: "user", content: "Hi", createdAt: new Date(), metadata: null },
          { id: "m-2", conversationId: "conv-1", sender: "assistant", content: "Hello!", createdAt: new Date(), metadata: null },
        ],
      } as any);

      const res = await request(app)
        .get("/api/conversations/conv-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversation.messages).toHaveLength(2);
    });

    it("should return 404 if conversation not found", async () => {
      jest.spyOn(prisma.conversation, "findFirst").mockResolvedValueOnce(null);

      const res = await request(app)
        .get("/api/conversations/conv-unknown")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /api/conversations/:id", () => {
    it("should update conversation title", async () => {
      jest.spyOn(prisma.conversation, "findFirst").mockResolvedValueOnce({
        id: "conv-1",
        userId: testUserId,
        title: "Old Title",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      jest.spyOn(prisma.conversation, "update").mockResolvedValueOnce({
        id: "conv-1",
        userId: testUserId,
        title: "Renamed Title",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .patch("/api/conversations/conv-1")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ title: "Renamed Title" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversation.title).toBe("Renamed Title");
    });
  });

  describe("DELETE /api/conversations/:id", () => {
    it("should delete conversation", async () => {
      jest.spyOn(prisma.conversation, "findFirst").mockResolvedValueOnce({
        id: "conv-1",
        userId: testUserId,
      } as any);

      jest.spyOn(prisma.conversation, "delete").mockResolvedValueOnce({
        id: "conv-1",
      } as any);

      const res = await request(app)
        .delete("/api/conversations/conv-1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("deleted successfully");
    });
  });

  describe("POST /api/conversations/:id/messages", () => {
    it("should reject empty message content", async () => {
      const res = await request(app)
        .post("/api/conversations/conv-1/messages")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Message content cannot be empty");
    });

    it("should process user message, retrieve RAG context, and return AI Tutor response", async () => {
      const mockConversation = {
        id: "conv-1",
        userId: testUserId,
        title: "New Session",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      };

      jest.spyOn(prisma.conversation, "findFirst").mockResolvedValueOnce(mockConversation as any);

      // Mock user message insertion
      jest.spyOn(prisma.message, "create").mockResolvedValueOnce({
        id: "m-user-1",
        conversationId: "conv-1",
        sender: "user",
        content: "Explain virtual memory",
        metadata: null,
        createdAt: new Date(),
      } as any);

      // Mock conversation updatedAt & title updates
      jest.spyOn(prisma.conversation, "update").mockResolvedValue({} as any);

      // Mock RAG semantic search queryRaw
      jest.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([
        {
          id: "chunk-1",
          documentId: "doc-1",
          documentTitle: "Operating Systems Ch 8",
          subjectId: null,
          topicId: null,
          content: "Virtual memory maps virtual addresses to physical pages via page tables.",
          chunkIndex: 0,
          similarity: 0.88,
        },
      ] as any);

      // Mock assistant message insertion
      jest.spyOn(prisma.message, "create").mockResolvedValueOnce({
        id: "m-asst-1",
        conversationId: "conv-1",
        sender: "assistant",
        content: "Virtual memory allows execution of processes not completely in memory.",
        metadata: { sources: ["Operating Systems Ch 8"] },
        createdAt: new Date(),
      } as any);

      const res = await request(app)
        .post("/api/conversations/conv-1/messages")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ content: "Explain virtual memory" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userMessage).toBeDefined();
      expect(res.body.data.assistantMessage).toBeDefined();
      expect(res.body.data.sources).toEqual(["Operating Systems Ch 8"]);
    });
  });
});
