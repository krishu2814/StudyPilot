import OpenAI from "openai";
import { env } from "../../config/env.js";
import { ILLMProvider, GenerateOptions, LLMResponse, ProviderName } from "./llm.types.js";

export class OpenAIProvider implements ILLMProvider {
  public readonly name: ProviderName = "openai";
  public readonly defaultModel = "gpt-4o";
  private client: OpenAI | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || env.OPENAI_API_KEY;
    if (key && key !== "your_openai_api_key_here") {
      this.client = new OpenAI({ apiKey: key });
    }
  }

  isAvailable(): boolean {
    return Boolean(this.client);
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error("OpenAI API key is not configured or invalid.");
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
      throw new Error(`[OpenAI Error] ${error.message || error}`);
    }
  }
}
