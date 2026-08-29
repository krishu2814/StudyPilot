import { env } from "../../config/env.js";
import { GeminiProvider } from "./gemini.provider.js";
import { GroqProvider } from "./groq.provider.js";
import { OpenAIProvider } from "./openai.provider.js";
import { MockProvider } from "./mock.provider.js";
import { ILLMProvider, GenerateOptions, LLMResponse, ProviderName } from "./llm.types.js";

export class LLMManager {
  private providers: Map<ProviderName, ILLMProvider> = new Map();
  private mockProvider: MockProvider = new MockProvider();

  constructor(customProviders?: Map<ProviderName, ILLMProvider>) {
    if (customProviders) {
      this.providers = customProviders;
    } else {
      this.providers.set("gemini", new GeminiProvider());
      this.providers.set("groq", new GroqProvider());
      this.providers.set("openai", new OpenAIProvider());
    }
  }

  /**
   * Returns the prioritized list of provider names to try in order.
   * Primary provider is determined by LLM_PROVIDER in env.
   */
  getProviderCascadeOrder(): ProviderName[] {
    const primary = env.LLM_PROVIDER as ProviderName;
    const allProviders: ProviderName[] = ["gemini", "groq", "openai"];
    const ordered = [primary, ...allProviders.filter((p) => p !== primary)];
    return ordered;
  }

  /**
   * Generates a text completion by attempting providers in cascading fallback sequence.
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<LLMResponse> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty.");
    }

    if (process.env.NODE_ENV === "test" && !env.GEMINI_API_KEY && !env.GROQ_API_KEY && !env.OPENAI_API_KEY) {
      return this.mockProvider.generate(prompt, options);
    }

    const cascadeOrder = this.getProviderCascadeOrder();
    const errors: { provider: string; error: string }[] = [];

    for (const providerName of cascadeOrder) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.isAvailable()) {
        continue;
      }

      try {
        const response = await provider.generate(prompt, options);
        return response;
      } catch (err: any) {
        const errorMsg = err.message || String(err);
        errors.push({ provider: providerName, error: errorMsg });
        console.warn(
          `⚠️ [LLM Failover] Provider '${providerName}' failed: ${errorMsg}. Attempting next available provider...`
        );
      }
    }

    // Fallback in testing or offline development
    if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
      console.warn("⚠️ [LLM Failover] All external providers failed or unavailable. Falling back to MockProvider.");
      return this.mockProvider.generate(prompt, options);
    }

    throw new Error(
      `All LLM providers failed. Errors:\n${errors
        .map((e) => `- [${e.provider}] ${e.error}`)
        .join("\n")}`
    );
  }

  /**
   * Helper that prompts the model in JSON mode, cleans Markdown blocks, and parses into typed object T.
   */
  async generateJSON<T>(prompt: string, options?: Omit<GenerateOptions, "jsonMode">): Promise<{ data: T; response: LLMResponse }> {
    const response = await this.generate(prompt, {
      ...options,
      jsonMode: true,
    });

    const cleanedText = response.text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```$/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleanedText) as T;
      return { data: parsed, response };
    } catch (parseError: any) {
      throw new Error(
        `Failed to parse JSON response from provider '${response.provider}'. Output:\n${cleanedText}`
      );
    }
  }

  getProvider(name: ProviderName): ILLMProvider | undefined {
    return this.providers.get(name);
  }

  setProvider(name: ProviderName, provider: ILLMProvider) {
    this.providers.set(name, provider);
  }
}

export const llmManager = new LLMManager();
