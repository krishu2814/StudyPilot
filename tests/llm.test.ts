import { LLMManager } from "../src/services/llm/llm.manager.js";
import { GeminiProvider } from "../src/services/llm/gemini.provider.js";
import { GroqProvider } from "../src/services/llm/groq.provider.js";
import { OpenAIProvider } from "../src/services/llm/openai.provider.js";
import { MockProvider } from "../src/services/llm/mock.provider.js";
import { ILLMProvider, LLMResponse } from "../src/services/llm/llm.types.js";

describe("Multi-Provider LLM Orchestration & Failover", () => {
  describe("Provider Availability & Initialization", () => {
    it("should report availability correctly based on API keys", () => {
      const geminiWithKey = new GeminiProvider("valid_key_test");
      const geminiNoKey = new GeminiProvider("your_gemini_api_key_here");
      expect(geminiWithKey.isAvailable()).toBe(true);
      expect(geminiNoKey.isAvailable()).toBe(false);

      const groqWithKey = new GroqProvider("valid_groq_key");
      const groqNoKey = new GroqProvider("your_groq_api_key_here");
      expect(groqWithKey.isAvailable()).toBe(true);
      expect(groqNoKey.isAvailable()).toBe(false);

      const openAiWithKey = new OpenAIProvider("valid_openai_key");
      const openAiNoKey = new OpenAIProvider("your_openai_api_key_here");
      expect(openAiWithKey.isAvailable()).toBe(true);
      expect(openAiNoKey.isAvailable()).toBe(false);

      const mock = new MockProvider();
      expect(mock.isAvailable()).toBe(true);
    });

    it("should throw error if generating with unconfigured provider", async () => {
      const gemini = new GeminiProvider("your_gemini_api_key_here");
      await expect(gemini.generate("Hello")).rejects.toThrow("Gemini API key is not configured");

      const groq = new GroqProvider("your_groq_api_key_here");
      await expect(groq.generate("Hello")).rejects.toThrow("Groq API key is not configured");

      const openai = new OpenAIProvider("your_openai_api_key_here");
      await expect(openai.generate("Hello")).rejects.toThrow("OpenAI API key is not configured");
    });
  });

  describe("MockProvider", () => {
    const mock = new MockProvider();

    it("should generate mock text response", async () => {
      const res = await mock.generate("Explain deadlock");
      expect(res.provider).toBe("mock");
      expect(res.text).toContain("Explain deadlock");
    });

    it("should generate valid JSON in jsonMode", async () => {
      const res = await mock.generate("Give me quiz", { jsonMode: true });
      expect(res.provider).toBe("mock");
      const parsed = JSON.parse(res.text);
      expect(parsed).toHaveProperty("message");
    });
  });

  describe("LLMManager Cascade & Failover", () => {
    it("should respect primary provider cascade order from env", () => {
      const manager = new LLMManager();
      const order = manager.getProviderCascadeOrder();
      expect(order).toHaveLength(3);
      expect(order).toContain("gemini");
      expect(order).toContain("groq");
      expect(order).toContain("openai");
    });

    it("should reject empty prompts", async () => {
      const manager = new LLMManager();
      await expect(manager.generate("")).rejects.toThrow("Prompt cannot be empty");
      await expect(manager.generate("   ")).rejects.toThrow("Prompt cannot be empty");
    });

    it("should automatically fail over from Gemini to Groq if Gemini fails", async () => {
      const mockGemini: ILLMProvider = {
        name: "gemini",
        defaultModel: "gemini-3.7-flash",
        isAvailable: () => true,
        generate: async () => {
          throw new Error("429 ResourceExhausted: Quota exceeded for model gemini-3.7-flash");
        },
      };

      const mockGroq: ILLMProvider = {
        name: "groq",
        defaultModel: "llama-3.3-70b-versatile",
        isAvailable: () => true,
        generate: async (prompt) => ({
          text: `Groq response for: ${prompt}`,
          provider: "groq",
          model: "llama-3.3-70b-versatile",
        }),
      };

      const customProviders = new Map<any, ILLMProvider>();
      customProviders.set("gemini", mockGemini);
      customProviders.set("groq", mockGroq);

      const manager = new LLMManager(customProviders);
      const res = await manager.generate("What is 3NF in database normalization?");

      expect(res.provider).toBe("groq");
      expect(res.model).toBe("llama-3.3-70b-versatile");
      expect(res.text).toContain("Groq response for");
    });

    it("should fail over across multiple providers (Gemini -> Groq -> OpenAI)", async () => {
      const mockGemini: ILLMProvider = {
        name: "gemini",
        defaultModel: "gemini-3.7-flash",
        isAvailable: () => true,
        generate: async () => {
          throw new Error("Gemini rate limit 429");
        },
      };

      const mockGroq: ILLMProvider = {
        name: "groq",
        defaultModel: "llama-3.3-70b-versatile",
        isAvailable: () => true,
        generate: async () => {
          throw new Error("Groq connection timeout 504");
        },
      };

      const mockOpenAI: ILLMProvider = {
        name: "openai",
        defaultModel: "gpt-4o",
        isAvailable: () => true,
        generate: async (prompt) => ({
          text: `OpenAI GPT-4o response: ${prompt}`,
          provider: "openai",
          model: "gpt-4o",
        }),
      };

      const customProviders = new Map<any, ILLMProvider>();
      customProviders.set("gemini", mockGemini);
      customProviders.set("groq", mockGroq);
      customProviders.set("openai", mockOpenAI);

      const manager = new LLMManager(customProviders);
      const res = await manager.generate("Explain ACID transactions");

      expect(res.provider).toBe("openai");
      expect(res.model).toBe("gpt-4o");
      expect(res.text).toContain("OpenAI GPT-4o response");
    });

    it("should fall back to MockProvider when all configured external providers fail", async () => {
      const failingGemini: ILLMProvider = {
        name: "gemini",
        defaultModel: "gemini-3.7-flash",
        isAvailable: () => true,
        generate: async () => {
          throw new Error("Gemini down");
        },
      };

      const failingGroq: ILLMProvider = {
        name: "groq",
        defaultModel: "llama-3.3-70b-versatile",
        isAvailable: () => true,
        generate: async () => {
          throw new Error("Groq down");
        },
      };

      const customProviders = new Map<any, ILLMProvider>();
      customProviders.set("gemini", failingGemini);
      customProviders.set("groq", failingGroq);

      const manager = new LLMManager(customProviders);
      const res = await manager.generate("Testing ultimate fallback");

      expect(res.provider).toBe("mock");
      expect(res.text).toContain("Testing ultimate fallback");
    });
  });

  describe("generateJSON Helper", () => {
    it("should parse clean JSON object and stripped markdown blocks", async () => {
      const mockProvider: ILLMProvider = {
        name: "gemini",
        defaultModel: "gemini-3.7-flash",
        isAvailable: () => true,
        generate: async () => ({
          text: "```json\n{\n  \"score\": 0.95,\n  \"isCorrect\": true\n}\n```",
          provider: "gemini",
          model: "gemini-3.7-flash",
        }),
      };

      const customProviders = new Map<any, ILLMProvider>();
      customProviders.set("gemini", mockProvider);

      const manager = new LLMManager(customProviders);
      const { data, response } = await manager.generateJSON<{ score: number; isCorrect: boolean }>(
        "Grade this answer"
      );

      expect(response.provider).toBe("gemini");
      expect(data.score).toBe(0.95);
      expect(data.isCorrect).toBe(true);
    });

    it("should throw descriptive error on malformed JSON response", async () => {
      const corruptProvider: ILLMProvider = {
        name: "groq",
        defaultModel: "llama-3.3-70b-versatile",
        isAvailable: () => true,
        generate: async () => ({
          text: "Here is your JSON: { unclosed bracket",
          provider: "groq",
          model: "llama-3.3-70b-versatile",
        }),
      };

      const customProviders = new Map<any, ILLMProvider>();
      customProviders.set("gemini", corruptProvider);

      const manager = new LLMManager(customProviders);
      await expect(manager.generateJSON("Generate data")).rejects.toThrow("Failed to parse JSON response");
    });
  });
});
