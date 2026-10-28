/**
 * Streaming chat endpoint for the AI Tutor with optional RAG retrieval.
 * Body: { messages, ragMode?, model?, system? }
 *
 * When ragMode === true:
 *   1. Embed the last user message via Lovable AI Gateway.
 *   2. Retrieve top-K matching chunks from kb_documents.
 *   3. Inject them as authoritative context into the system prompt.
 *   4. Stream AI response upstream as usual.
 *   5. After [DONE], emit a final SSE event:
 *      data: {"type":"sources","sources":[...]}\n\n
 *      so the client can attach citation chips to the message.
 */
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createClient } from "@supabase/supabase-js";
import { ALL_FREE_ACCESS_MODE } from "@/lib/subscription.functions";

async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const supa = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await supa.auth.getUser(token);
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

async function checkAndConsumeQuota(userId: string): Promise<{ ok: boolean; used: number }> {
  const now = new Date();
  const dhaka = new Date(now.getTime() + (6 * 60 - now.getTimezoneOffset()) * 60_000);
  const today = dhaka.toISOString().slice(0, 10);

  // During ALL_FREE_ACCESS_MODE, all users get effectively unlimited AI questions (safety capped at 150/day against bot abuse)
  if (ALL_FREE_ACCESS_MODE) {
    const { data: usage } = await supabaseAdmin
      .from("usage_counters")
      .select("ai_messages_used")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .maybeSingle();
    const used = usage?.ai_messages_used ?? 0;
    if (used >= 150) return { ok: false, used };

    if (usage) {
      await supabaseAdmin
        .from("usage_counters")
        .update({ ai_messages_used: used + 1 })
        .eq("user_id", userId)
        .eq("usage_date", today);
    } else {
      await supabaseAdmin.from("usage_counters").insert({
        user_id: userId,
        usage_date: today,
        ai_messages_used: 1,
      });
    }
    return { ok: true, used: used + 1 };
  }

  // Check active subscription
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan_code, status")
    .eq("user_id", userId)
    .in("status", ["trialing", "active"])
    .maybeSingle();
  const isPaid = !!sub && sub.plan_code !== "free";
  if (isPaid) return { ok: true, used: 0 };

  const { data: usage } = await supabaseAdmin
    .from("usage_counters")
    .select("ai_messages_used")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();
  const used = usage?.ai_messages_used ?? 0;
  if (used >= 5) return { ok: false, used };

  if (usage) {
    await supabaseAdmin
      .from("usage_counters")
      .update({ ai_messages_used: used + 1 })
      .eq("user_id", userId)
      .eq("usage_date", today);
  } else {
    await supabaseAdmin.from("usage_counters").insert({
      user_id: userId,
      usage_date: today,
      ai_messages_used: 1,
    });
  }
  return { ok: true, used: used + 1 };
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai";
const GATEWAY_URL = `${GEMINI_BASE}/chat/completions`;
const EMBED_URL = `${GEMINI_BASE}/embeddings`;
const DEFAULT_MODEL = "gemini-2.5-flash";
const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 1536;
const TOP_K = 6;

const BASE_SYSTEM_PROMPT = `তুমি **Dr. Chem** — বাংলাদেশী শিক্ষার্থীদের জন্য একজন অভিজ্ঞ, formal রসায়ন শিক্ষক।

🎯 **পরিচয় ও দর্শন**
- নাম: Dr. Chem (ডক্টর কেম)
- বর্তমান target audience: **NCTB Class 9-10 রসায়ন পাঠ্যক্রম**।
- Tone: **Formal teacher** — শিক্ষার্থীকে "তুমি" সম্বোধন কর, structured ও exam-focused থাকো।

📝 **ভাষা ও ফরম্যাট**
- Reply সবসময় **বাংলায়** — scientific terms English-এ। Ratio Bangla 70% / English term 30%।
- Markdown ব্যবহার কর: **bold** key terms, bullet/numbered list, table।
- Equation render KaTeX-এ: inline \`$CaCO_3$\`, block \`$$CaCO_3 + 2HCl \\rightarrow CaCl_2 + H_2O + CO_2$$\`।

🎓 **শিক্ষাদান স্টাইল**
- প্রথমে concept clear করো, তারপর example/equation দাও।
- ভুল ধরলে gentle correction করো।
- উত্তর না জানলে honestly বলো।
`;

const RAG_INSTRUCTIONS = `

📚 **বই থেকে উত্তর (RAG mode)**
- নিচে [BOOK CONTEXT] section-এ NCTB রসায়ন বই থেকে relevant অংশ দেওয়া আছে।
- প্রথমে **এই context থেকেই** উত্তর তৈরি করো। বইয়ের ভাষা যতটুকু সম্ভব ধরে রাখো।
- প্রতিটি claim-এর জন্য বইয়ের page/chapter মাথায় রাখো — শেষে "📖 সূত্র" section-এ source list দেওয়া হবে automatically।
- যদি context-এ উত্তর না থাকে, তবে honestly বলো "এই অধ্যায়ের বইয়ে এ বিষয়ে সরাসরি পাইনি" এবং তারপর general knowledge দিয়ে সাহায্য করো।
`;

interface BookChunk {
  id: string;
  content: string;
  source: string | null;
  chapter: string | null;
  page: number | null;
  similarity: number;
}

async function embedQuery(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch(EMBED_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: text.slice(0, 4000),
        dimensions: EMBED_DIMS,
      }),
    });
    if (!res.ok) {
      console.error("embed failed", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      data: Array<{ embedding: number[] }>;
    };
    return data.data?.[0]?.embedding ?? null;
  } catch (e) {
    console.error("embed exception", e);
    return null;
  }
}

async function retrieveContext(
  query: string,
  apiKey: string,
): Promise<{ block: string; sources: Array<Omit<BookChunk, "content">> }> {
  const empty = { block: "", sources: [] };
  const embedding = await embedQuery(query, apiKey);
  if (!embedding) return empty;

  const { data, error } = await supabaseAdmin.rpc("match_kb_documents", {
    query_embedding: embedding as unknown as string,
    match_count: TOP_K,
  });
  if (error || !data) {
    console.error("rpc match_kb_documents failed", error);
    return empty;
  }
  const rows = data as BookChunk[];
  if (rows.length === 0) return empty;

  const block =
    "\n\n[BOOK CONTEXT — NCTB Chemistry]\n" +
    rows
      .map(
        (r, i) =>
          `--- excerpt ${i + 1} (${r.source ?? "Book"}${
            r.chapter ? " · " + r.chapter : ""
          }${r.page ? " · p." + r.page : ""}) ---\n${r.content}`,
      )
      .join("\n\n") +
    "\n[END BOOK CONTEXT]\n";

  const sources = rows.map(({ content: _c, ...rest }) => rest);
  return { block, sources };
}

export const Route = createFileRoute("/api/tutor/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "AI service not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // ─── Auth + Quota (Free tier = 5/day, Pro = unlimited) ────
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized — sign in to use AI Tutor" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        const quota = await checkAndConsumeQuota(userId);
        if (!quota.ok) {
          return new Response(
            JSON.stringify({
              error:
                "আজকের ৫টি free AI message শেষ হয়ে গেছে। Unlimited access এর জন্য Pro upgrade করো।",
              quotaExceeded: true,
            }),
            { status: 429, headers: { "Content-Type": "application/json" } },
          );
        }

        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { z } = await import("zod");
        const BodySchema = z.object({
          messages: z
            .array(
              z.object({
                role: z.enum(["user", "assistant", "system"]),
                content: z.string().max(4000),
              }),
            )
            .min(1)
            .max(40),
          ragMode: z.boolean().optional(),
        });
        const parsed = BodySchema.safeParse(rawBody);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "Invalid request", issues: parsed.error.issues }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        const body = parsed.data;
        const messages = body.messages;

        // ------- Optional RAG retrieval -------
        let systemContent = BASE_SYSTEM_PROMPT;
        let sources: Array<Omit<BookChunk, "content">> = [];
        if (body.ragMode) {
          const lastUser = [...messages].reverse().find((m) => m.role === "user");
          if (lastUser?.content) {
            const ctx = await retrieveContext(lastUser.content, key);
            sources = ctx.sources;
            systemContent = BASE_SYSTEM_PROMPT + RAG_INSTRUCTIONS + ctx.block;
          }
        }

        const model = DEFAULT_MODEL;

        const upstream = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            stream: true,
            stream_options: { include_usage: true },
            messages: [{ role: "system", content: systemContent }, ...messages],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          if (upstream.status === 429) {
            return new Response(
              JSON.stringify({
                error: "Rate limit reached, please try again later.",
              }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }
          if (upstream.status === 402) {
            return new Response(
              JSON.stringify({
                error: "AI credits exhausted. Top up workspace usage.",
              }),
              { status: 402, headers: { "Content-Type": "application/json" } },
            );
          }
          const text = await upstream.text();
          console.error("AI gateway error:", upstream.status, text);
          return new Response(JSON.stringify({ error: "AI gateway error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Forward upstream SSE, then append our own sources event before [DONE].
        const encoder = new TextEncoder();
        const reader = upstream.body.getReader();

        // Capture token usage from the final SSE chunk (stream_options.include_usage)
        let capturedUsage: { input: number; output: number } | null = null;
        const tryCaptureUsage = (chunk: string) => {
          // Parse each `data: {...}` line, looking for a `usage` field.
          for (const line of chunk.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload);
              if (j && typeof j === "object" && j.usage) {
                capturedUsage = {
                  input: Number(j.usage.prompt_tokens ?? j.usage.input_tokens ?? 0),
                  output: Number(j.usage.completion_tokens ?? j.usage.output_tokens ?? 0),
                };
              }
            } catch {
              /* ignore non-JSON chunks */
            }
          }
        };

        const finalizeLogging = () => {
          if (!capturedUsage) return;
          void (async () => {
            try {
              const { logAiUsage } = await import("@/lib/ai-usage.server");
              await logAiUsage({
                userId,
                endpoint: body.ragMode ? "tutor_stream_rag" : "tutor_stream",
                model,
                inputTokens: capturedUsage!.input,
                outputTokens: capturedUsage!.output,
              });
            } catch (e) {
              console.error("tutor usage log failed", e);
            }
          })();
        };

        const stream = new ReadableStream({
          async start(controller) {
            const decoder = new TextDecoder();
            let buf = "";
            let sentSources = false;

            const flushSources = () => {
              if (sentSources || sources.length === 0) return;
              sentSources = true;
              const payload = JSON.stringify({ type: "sources", sources });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            };

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const decoded = decoder.decode(value, { stream: true });
                buf += decoded;
                tryCaptureUsage(decoded);

                // Detect [DONE] marker → emit sources just before it.
                if (buf.includes("data: [DONE]")) {
                  const [pre, post] = buf.split("data: [DONE]", 2);
                  controller.enqueue(encoder.encode(pre));
                  flushSources();
                  controller.enqueue(encoder.encode("data: [DONE]" + post));
                  buf = "";
                } else {
                  // Forward as-is, holding back potential split markers
                  if (buf.length > 4096) {
                    controller.enqueue(encoder.encode(buf));
                    buf = "";
                  }
                }
              }
              if (buf) controller.enqueue(encoder.encode(buf));
              flushSources();
              controller.close();
              finalizeLogging();
            } catch (e) {
              console.error("stream forward error", e);
              finalizeLogging();
              try {
                controller.error(e);
              } catch {
                /* noop */
              }
            }
          },
          cancel() {
            reader.cancel().catch(() => {});
            finalizeLogging();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
