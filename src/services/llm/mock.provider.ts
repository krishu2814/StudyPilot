import { ILLMProvider, GenerateOptions, LLMResponse, ProviderName } from "./llm.types.js";

export class MockProvider implements ILLMProvider {
  public readonly name: ProviderName = "mock";
  public readonly defaultModel = "mock-tutor-v1";

  isAvailable(): boolean {
    return true;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<LLMResponse> {
    if (options?.jsonMode) {
      return {
        text: JSON.stringify({
          message: "Mock response",
          promptSummary: prompt.slice(0, 50),
        }),
        provider: this.name,
        model: this.defaultModel,
      };
    }

    return {
      text: `[Mock AI Response] Evaluated input: "${prompt.slice(0, 60)}..."`,
      provider: this.name,
      model: this.defaultModel,
    };
  }
}
