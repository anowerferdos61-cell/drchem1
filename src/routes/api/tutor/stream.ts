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
  // Check active subscription
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan_code, status")
    .eq("user_id", userId)
    .in("status", ["trialing", "active"])
    .maybeSingle();
  const isPaid = !!sub && sub.plan_code !== "free";
  if (isPaid) return { ok: true, used: 0 };

  const now = new Date();
  const dhaka = new Date(now.getTime() + (6 * 60 - now.getTimezoneOffset()) * 60_000);
  const today = dhaka.toISOString().slice(0, 10);

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

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const EMBED_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";
const EMBED_MODEL = "google/gemini-embedding-001";
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
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "AI service not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let body: {
          messages?: Array<{ role: string; content: string }>;
          ragMode?: boolean;
          model?: string;
          system?: string;
        };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return new Response(JSON.stringify({ error: "No messages" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // ------- Optional RAG retrieval -------
        let systemContent = body.system || BASE_SYSTEM_PROMPT;
        let sources: Array<Omit<BookChunk, "content">> = [];
        if (body.ragMode) {
          const lastUser = [...messages].reverse().find((m) => m.role === "user");
          if (lastUser?.content) {
            const ctx = await retrieveContext(lastUser.content, key);
            sources = ctx.sources;
            systemContent =
              (body.system || BASE_SYSTEM_PROMPT) + RAG_INSTRUCTIONS + ctx.block;
          }
        }

        const model = body.model || DEFAULT_MODEL;

        const upstream = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            stream: true,
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
                buf += decoder.decode(value, { stream: true });

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
            } catch (e) {
              console.error("stream forward error", e);
              try {
                controller.error(e);
              } catch {
                /* noop */
              }
            }
          },
          cancel() {
            reader.cancel().catch(() => {});
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
