/**
 * Streaming chat endpoint for the AI Tutor.
 * Proxies Lovable AI Gateway with stream: true and forwards SSE to the client.
 * Body: { messages: [{role, content}], model?, system? }
 */
import { createFileRoute } from "@tanstack/react-router";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

// NOTE: prompt is intentionally minimal placeholder — will be replaced
// during the interactive prompt-design step.
const DEFAULT_SYSTEM_PROMPT = `You are "রসায়ন স্যার", an expert bilingual Chemistry tutor for Bangladeshi students (Class 9–10, HSC).

Style:
- Reply in Bangla as the primary language, mixing English scientific terms naturally (e.g. "এই reaction-এ MnO₂ catalyst").
- Use clean Markdown: **bold** for key terms, bullets/numbered lists for steps.
- Render equations in KaTeX: inline \`$CaCO_3$\` and block \`$$CaCO_3 + 2HCl \\rightarrow CaCl_2 + H_2O + CO_2$$\`.
- Use Socratic guidance — give a hint first, then build up to the full answer.
- Keep answers focused; expand only if asked.
- If unsure, say so and suggest the next step to investigate.
`;

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

        const systemContent = body.system || DEFAULT_SYSTEM_PROMPT;
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

        if (!upstream.ok) {
          if (upstream.status === 429) {
            return new Response(
              JSON.stringify({
                error: "Rate limit reached, please try again later.",
              }),
              {
                status: 429,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          if (upstream.status === 402) {
            return new Response(
              JSON.stringify({
                error: "AI credits exhausted. Top up workspace usage.",
              }),
              {
                status: 402,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          const text = await upstream.text();
          console.error("AI gateway error:", upstream.status, text);
          return new Response(JSON.stringify({ error: "AI gateway error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(upstream.body, {
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
