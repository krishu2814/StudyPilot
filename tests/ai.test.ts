import { AIService } from "../src/services/ai.service.js";

describe("AIService (AI Tutor)", () => {
  const service = new AIService();

  it("should fail when question is empty or whitespace", async () => {
    await expect(service.generateTutorResponse({ question: "" })).rejects.toThrow(
      "Question cannot be empty."
    );
    await expect(service.generateTutorResponse({ question: "   " })).rejects.toThrow(
      "Question cannot be empty."
    );
  });

  it("should generate tutor response with active recall follow-up", async () => {
    const result = await service.generateTutorResponse({
      question: "What is the difference between TCP and UDP?",
    });

    expect(result.reply).toBeDefined();
    expect(result.reply.length).toBeGreaterThan(20);
    expect(result.reply).toContain("Quick Knowledge Check");
    expect(Array.isArray(result.usedSources)).toBe(true);
  });

  it("should incorporate context chunks and extract unique sources", async () => {
    const contextChunks = [
      { content: "TCP provides reliable, ordered data delivery.", documentTitle: "Networking 101" },
      { content: "UDP is connectionless and low-latency.", documentTitle: "Networking 101" },
      { content: "OSI model defines network layers.", documentTitle: "OSI Ref Guide" },
    ];

    const result = await service.generateTutorResponse({
      question: "Explain TCP reliability",
      contextChunks,
    });

    expect(result.reply).toBeDefined();
    expect(result.usedSources).toEqual(["Networking 101", "OSI Ref Guide"]);
  });

  it("should handle conversation history without errors", async () => {
    const history = [
      { sender: "user", content: "Hi, let's study OS." },
      { sender: "assistant", content: "Great! What topic would you like to start with?" },
    ];

    const result = await service.generateTutorResponse({
      question: "Let's review process synchronization.",
      history,
    });

    expect(result.reply).toBeDefined();
  });
});
