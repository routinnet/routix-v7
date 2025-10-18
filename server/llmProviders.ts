// Multiple LLM Provider Support
import { invokeLLM } from "./_core/llm";

export type LLMProvider = "openai" | "claude" | "gemini" | "llama";

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
}

const providerModels = {
  openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  claude: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
  gemini: ["gemini-pro", "gemini-pro-vision"],
  llama: ["llama-2-70b", "llama-2-13b"],
};

export async function generateWithProvider(
  prompt: string,
  config: LLMConfig
): Promise<string> {
  // Route to appropriate provider
  switch (config.provider) {
    case "openai":
      return generateWithOpenAI(prompt, config);
    case "claude":
      return generateWithClaude(prompt, config);
    case "gemini":
      return generateWithGemini(prompt, config);
    case "llama":
      return generateWithLlama(prompt, config);
    default:
      return generateWithOpenAI(prompt, config);
  }
}

async function generateWithOpenAI(prompt: string, config: LLMConfig): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a creative thumbnail generation expert.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (Array.isArray(content)) {
    // Assuming text content is the primary one, join them if multiple or pick the first
    return content.map(item => typeof item === 'object' && 'text' in item ? item.text : '').join(' ') || "";
  } else if (typeof content === 'string') {
    return content;
  }
  return "";
}

async function generateWithClaude(prompt: string, config: LLMConfig): Promise<string> {
  // Claude API call would go here
  // Using OpenAI as fallback for now
  return generateWithOpenAI(prompt, config);
}

async function generateWithGemini(prompt: string, config: LLMConfig): Promise<string> {
  // Gemini API call would go here
  // Using OpenAI as fallback for now
  return generateWithOpenAI(prompt, config);
}

async function generateWithLlama(prompt: string, config: LLMConfig): Promise<string> {
  // Llama API call would go here
  // Using OpenAI as fallback for now
  return generateWithOpenAI(prompt, config);
}

export function getAvailableModels(provider: LLMProvider): string[] {
  return providerModels[provider] || [];
}

export function validateProvider(provider: string): boolean {
  return Object.keys(providerModels).includes(provider);
}

export default {
  generateWithProvider,
  getAvailableModels,
  validateProvider,
};
