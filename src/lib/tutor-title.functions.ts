/**
 * Auto-generate a short Bangla title for a new conversation from the first user message.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatComplete } from "./ai-gateway";

export const generateTitle = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ message: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { title: "নতুন চ্যাট" };
    try {
      const reply = await chatComplete({
        apiKey: key,
        systemPrompt:
          "You generate a short conversation title (max 5 words) in Bangla summarizing the user's message. Return ONLY the title, no quotes, no punctuation at the end.",
        history: [{ role: "user", content: data.message }],
      });
      const title = reply
        .replace(/["“”'`]/g, "")
        .replace(/\.+$/, "")
        .trim()
        .slice(0, 60);
      return { title: title || "নতুন চ্যাট" };
    } catch (e) {
      console.error("generateTitle failed", e);
      return { title: "নতুন চ্যাট" };
    }
  });
