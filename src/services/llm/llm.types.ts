export type ProviderName = "gemini" | "groq" | "openai" | "mock";

export interface GenerateOptions {
  systemInstruction?: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  provider: ProviderName;
  model: string;
}

export interface ILLMProvider {
  readonly name: ProviderName;
  readonly defaultModel: string;
  isAvailable(): boolean;
  generate(prompt: string, options?: GenerateOptions): Promise<LLMResponse>;
}
