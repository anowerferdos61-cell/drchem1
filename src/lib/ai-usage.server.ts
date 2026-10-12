/**
 * Server-only helper: log AI token usage & estimated cost to public.ai_usage_logs.
 * Called from every server-side AI endpoint (tutor stream, chat, viva, title-gen).
 * Never import this from client code.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** USD per 1M tokens — Gemini paid tier reference prices (adjust when Google updates). */
const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "gemini-embedding-001": { input: 0.15, output: 0 },
};

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] ?? PRICING["gemini-2.5-flash"];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

export interface AiUsageEntry {
  userId: string | null;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/** Fire-and-forget; failures are logged but do not throw to the caller. */
export async function logAiUsage(entry: AiUsageEntry): Promise<void> {
  const input = Math.max(0, Math.floor(Number(entry.inputTokens) || 0));
  const output = Math.max(0, Math.floor(Number(entry.outputTokens) || 0));
  const cost = estimateCostUsd(entry.model, input, output);
  try {
    await supabaseAdmin.from("ai_usage_logs").insert({
      user_id: entry.userId,
      endpoint: entry.endpoint,
      model: entry.model,
      input_tokens: input,
      output_tokens: output,
      total_tokens: input + output,
      cost_usd: cost,
    });
  } catch (e) {
    console.error("logAiUsage failed", e);
  }
}
