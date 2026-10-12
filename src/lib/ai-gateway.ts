/**
 * Direct Google Gemini API integration via the OpenAI-compatible endpoint.
 * Uses GEMINI_API_KEY from env. No Lovable AI Gateway dependency.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText, type ModelMessage } from "ai";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
export const DEFAULT_CHAT_MODEL = "gemini-2.5-flash";
export const DEFAULT_EMBED_MODEL = "gemini-embedding-001";

export const createGeminiProvider = (apiKey: string) =>
  createOpenAICompatible({
    name: "gemini",
    baseURL: GEMINI_BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

// Backwards-compat alias so callers that still import the old name keep working.
export const createLovableAiGatewayProvider = createGeminiProvider;

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCallOptions {
  apiKey: string;
  systemPrompt: string;
  history: ChatTurn[];
  model?: string;
}

export interface ChatCompleteResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  model: string;
}

export async function chatComplete({
  apiKey,
  systemPrompt,
  history,
  model = DEFAULT_CHAT_MODEL,
}: ChatCallOptions): Promise<ChatCompleteResult> {
  const provider = createGeminiProvider(apiKey);
  const messages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content }) as ModelMessage),
  ];
  const { text, usage } = await generateText({ model: provider(model), messages });
  // AI SDK v6 uses inputTokens/outputTokens; guard against undefined.
  const u = (usage ?? {}) as {
    inputTokens?: number;
    outputTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
  return {
    text,
    model,
    usage: {
      inputTokens: u.inputTokens ?? u.promptTokens ?? 0,
      outputTokens: u.outputTokens ?? u.completionTokens ?? 0,
    },
  };
}

export async function* chatStream({
  apiKey,
  systemPrompt,
  history,
  model = DEFAULT_CHAT_MODEL,
}: ChatCallOptions): AsyncGenerator<string> {
  const provider = createGeminiProvider(apiKey);
  const messages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content }) as ModelMessage),
  ];
  const result = streamText({ model: provider(model), messages });
  for await (const delta of result.textStream) {
    yield delta;
  }
}

/** Resolve the Gemini API key from server-side env (Vercel: GEMINI_API_KEY). */
export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}
