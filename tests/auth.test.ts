import { jest } from "@jest/globals";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import bcrypt from "bcryptjs";

describe("Auth Endpoints", () => {
  const app = createApp();

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should fail if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("required");
    });

    it("should fail if user already exists", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashed",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Test User", email: "test@example.com", password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("already exists");
    });

    it("should successfully register a new user and return token", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce(null);
      jest.spyOn(prisma.user, "create").mockResolvedValueOnce({
        id: "user-new",
        email: "newuser@example.com",
        name: "New Learner",
        passwordHash: "hashed_pass",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "New Learner", email: "newuser@example.com", password: "password123" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("newuser@example.com");
      expect(res.body.data).toHaveProperty("token");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should fail on invalid credentials", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@example.com", password: "wrong" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Invalid email or password");
    });

    it("should log in successfully with correct credentials", async () => {
      const hashedPassword = await bcrypt.hash("correctpassword", 10);
      jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({
        id: "user-login",
        email: "student@example.com",
        name: "Student A",
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "student@example.com", password: "correctpassword" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("student@example.com");
      expect(res.body.data).toHaveProperty("token");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should reject request without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return user profile with valid token", async () => {
      // First register or login to get token
      jest.spyOn(prisma.user, "findUnique")
        .mockResolvedValueOnce(null) // for register findUnique
        .mockResolvedValueOnce({   // for me endpoint
          id: "user-123",
          email: "learner@example.com",
          name: "Learner One",
          createdAt: new Date(),
        } as any);

      jest.spyOn(prisma.user, "create").mockResolvedValueOnce({
        id: "user-123",
        email: "learner@example.com",
        name: "Learner One",
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const regRes = await request(app)
        .post("/api/auth/register")
        .send({ name: "Learner One", email: "learner@example.com", password: "password123" });

      const token = regRes.body.data.token;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("learner@example.com");
    });
  });
});
