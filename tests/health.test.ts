import request from "supertest";
import { createApp } from "../src/app.js";

describe("Health Check Endpoint", () => {
  const app = createApp();

  it("should return 200 and ok status on GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("service", "StudyPilot API");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("should return 404 on unknown routes", async () => {
    const res = await request(app).get("/api/unknown-endpoint");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("success", false);
  });
});
