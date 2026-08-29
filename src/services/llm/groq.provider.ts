import Groq from "groq-sdk";
import { env } from "../../config/env.js";
import { ILLMProvider, GenerateOptions, LLMResponse, ProviderName } from "./llm.types.js";

export class GroqProvider implements ILLMProvider {
  public readonly name: ProviderName = "groq";
  public readonly defaultModel = "openai/gpt-oss-120b";
  private client: Groq | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || env.GROQ_API_KEY;
    if (key && key !== "your_groq_api_key_here") {
      this.client = new Groq({ apiKey: key });
    }
  }

  isAvailable(): boolean {
    return Boolean(this.client);
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error("Groq API key is not configured or invalid.");
    }

    const messages: Array<{ role: "system" | "user"; content: string }> = [];

    if (options?.systemInstruction) {
      messages.push({
        role: "system",
        content: options.systemInstruction,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    try {
      const completion = await this.client.chat.completions.create({
        messages,
        model: this.defaultModel,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
      });

      const text = completion.choices[0]?.message?.content || "";

      return {
        text: text.trim(),
        provider: this.name,
        model: this.defaultModel,
      };
    } catch (error: any) {
      throw new Error(`[Groq Error] ${error.message || error}`);
    }
  }
}
