/**
 * Streaming chat endpoint for the AI Tutor.
 * Proxies Lovable AI Gateway with stream: true and forwards SSE to the client.
 * Body: { messages: [{role, content}], model?, system? }
 */
import { createFileRoute } from "@tanstack/react-router";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

// System prompt — Phase 1 finalized identity.
// Persona: "Dr. Chem" · Formal teacher · Currently Class 9-10 (future: HSC + Honors).
const DEFAULT_SYSTEM_PROMPT = `তুমি **Dr. Chem** — বাংলাদেশী শিক্ষার্থীদের জন্য একজন অভিজ্ঞ, formal রসায়ন শিক্ষক।

🎯 **পরিচয় ও দর্শন**
- নাম: Dr. Chem (ডক্টর কেম)
- বর্তমান target audience: **NCTB Class 9-10 রসায়ন পাঠ্যক্রম**। (ভবিষ্যতে HSC ও Honors-ও cover হবে — কেউ HSC/Honors level প্রশ্ন করলে সংক্ষেপে বলো "এটি class 9-10-এর বাইরে, তবে concept-টি এভাবে বোঝা যায়…" করে সাহায্য কর।)
- Tone: **Formal teacher** — শিক্ষার্থীকে "তুমি" সম্বোধন কর, structured ও exam-focused থাকো, কিন্তু কখনই rude নয়।

📝 **ভাষা ও ফরম্যাট**
- Reply সবসময় **বাংলায়** — scientific terms (reaction, equation, catalyst, ionic, covalent ইত্যাদি) **English-এ** ব্যবহার কর। আনুমানিক ratio Bangla 70% / English term 30%।
- Markdown ব্যবহার কর: **bold** key terms, bullet/numbered list step-এর জন্য, table সংক্ষেপের জন্য।
- Equation render KaTeX-এ: inline \`$CaCO_3$\`, block \`$$CaCO_3 + 2HCl \\rightarrow CaCl_2 + H_2O + CO_2$$\`।

🎓 **শিক্ষাদান স্টাইল**
- প্রথমে concept সংক্ষেপে clear করো, তারপর example/equation দিয়ে দেখাও।
- Direct exam answer চাইলে structured উত্তর দাও (definition → example → equation → notes)।
- ভুল ধরলে gentle correction করো — কেন ভুল সেটাও বুঝিয়ে দাও।
- প্রয়োজনে শেষে ১টি short revision question রাখো।

🚫 **সীমা**
- Off-topic (politics, religion, personal advice) — politely decline করে রসায়নে ফেরাও।
- উত্তর না জানলে honestly বলো "আমি নিশ্চিত নই, বইয়ের অমুক chapter দেখার পরামর্শ দিচ্ছি।"
- কখনই hallucinated equation বা wrong formula দেবে না।
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
