import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { ILLMProvider, GenerateOptions, LLMResponse, ProviderName } from "./llm.types.js";

export class GeminiProvider implements ILLMProvider {
  public readonly name: ProviderName = "gemini";
  public readonly defaultModel = "gemini-3.7-flash";
  private client: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || env.GEMINI_API_KEY;
    if (key && key !== "your_gemini_api_key_here") {
      this.client = new GoogleGenAI({ apiKey: key });
    }
  }

  isAvailable(): boolean {
    return Boolean(this.client);
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error("Gemini API key is not configured or invalid.");
    }

    const model = this.defaultModel;
    let fullPrompt = prompt;
    if (options?.systemInstruction) {
      fullPrompt = `${options.systemInstruction}\n\n${prompt}`;
    }

    try {
      const response = await this.client.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          responseMimeType: options?.jsonMode ? "application/json" : undefined,
        },
      });

      const text = response.text || "";
      if (!text && text !== "") {
        throw new Error("Received empty response from Gemini.");
      }

      return {
        text: text.trim(),
        provider: this.name,
        model,
      };
    } catch (error: any) {
      throw new Error(`[Gemini Error] ${error.message || error}`);
    }
  }
}
