import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText, type CoreMessage } from "ai";

const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";
export const DEFAULT_CHAT_MODEL = "google/gemini-3-flash-preview";

export const createLovableAiGatewayProvider = (lovableApiKey: string) =>
  createOpenAICompatible({
    name: "lovable",
    baseURL: GATEWAY_BASE,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

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

/** Non-streaming chat (used for tools like viva, summaries). */
export async function chatComplete({
  apiKey,
  systemPrompt,
  history,
  model = DEFAULT_CHAT_MODEL,
}: ChatCallOptions): Promise<string> {
  const provider = createLovableAiGatewayProvider(apiKey);
  const messages: CoreMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content }) as CoreMessage),
  ];
  const { text } = await generateText({ model: provider(model), messages });
  return text;
}

/** Streaming chat — returns an async iterable of text deltas. */
export async function* chatStream({
  apiKey,
  systemPrompt,
  history,
  model = DEFAULT_CHAT_MODEL,
}: ChatCallOptions): AsyncGenerator<string> {
  const provider = createLovableAiGatewayProvider(apiKey);
  const messages: CoreMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content }) as CoreMessage),
  ];
  const result = streamText({ model: provider(model), messages });
  for await (const delta of result.textStream) {
    yield delta;
  }
}
