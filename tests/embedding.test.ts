import { EmbeddingService, embeddingService } from "../src/services/embedding.service.js";

describe("EmbeddingService", () => {
  const service = new EmbeddingService();

  it("should fail when embedding empty or whitespace-only text", async () => {
    await expect(service.embedText("")).rejects.toThrow("Text to embed cannot be empty.");
    await expect(service.embedText("   ")).rejects.toThrow("Text to embed cannot be empty.");
  });

  it("should generate a 768-dimensional vector for a string", async () => {
    const vector = await service.embedText("Binary Search Trees and Big O Notation");
    expect(Array.isArray(vector)).toBe(true);
    expect(vector).toHaveLength(768);
  });

  it("should generate normalized unit vectors", async () => {
    const vector = await service.embedText("Normalization test");
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    expect(magnitude).toBeCloseTo(1.0, 3);
  });

  it("should embed a batch of texts", async () => {
    const texts = [
      "Process Scheduling in Operating Systems",
      "Deadlock Prevention and Banker's Algorithm",
    ];
    const results = await service.embedBatch(texts);
    expect(results).toHaveLength(2);
    expect(results[0]).toHaveLength(768);
    expect(results[1]).toHaveLength(768);
  });

  it("should return empty array for empty batch", async () => {
    const results = await service.embedBatch([]);
    expect(results).toEqual([]);
  });

  it("should be deterministic for mock embeddings with identical input", async () => {
    const emb1 = service.generateMockEmbedding("Relational Algebra");
    const emb2 = service.generateMockEmbedding("Relational Algebra");
    expect(emb1).toEqual(emb2);
  });
});
