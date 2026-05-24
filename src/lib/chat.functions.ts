// Chat server functions for the bilingual Lab AI Assistant.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatComplete, type ChatTurn } from "./ai-gateway";

const SYSTEM_PROMPT = `You are an expert Chemistry professor for the Bangladeshi curriculum (Class 9–10/HSC).

Communication Rules:
- Use Bangla as primary language, mix English scientific terms naturally (e.g. "এই reaction-এ MnO₂ catalyst হিসেবে কাজ করে")
- Keep answers concise (max 6–8 lines unless user asks for more)
- Always format responses in clean Markdown (bullets, numbered steps, **bold** for key terms)

Teaching Method:
- Use Socratic questioning — guide first, don't immediately give the answer
- If student struggles → give hints → partial explanation → then full answer
- Use the provided experiment context (current step, mistakes, chemicals, equipment) to tailor your response

Behavior:
- Gently correct mistakes with reasoning, not scolding
- If the question is outside the active experiment, switch to general concept-explanation mode
- Reference relevant equations, units, and safety notes when appropriate

Fallback:
- If you are unsure, openly say so and suggest the next investigative step
`;

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const ContextSchema = z.object({
  experimentId: z.string().max(64),
  mode: z.enum(["guide", "student", "classroom"]),
  currentStep: z.number().int().min(0).max(50),
  mistakesMade: z.array(z.string().max(200)).max(50),
  currentChemicals: z.array(z.string().max(80)).max(30).optional(),
  currentEquipment: z.array(z.string().max(80)).max(30).optional(),
  goal: z.string().max(400).optional(),
});

function buildContextBlock(ctx: z.infer<typeof ContextSchema>): string {
  const expName =
    ctx.experimentId === "titration"
      ? "Acid-Base Titration (HCl + NaOH)"
      : ctx.experimentId === "oxygen_prep"
        ? "Preparation of Oxygen Gas (H₂O₂ + MnO₂)"
        : ctx.experimentId === "co2_prep"
          ? "Preparation of CO₂ Gas (CaCO₃ + dilute HCl)"
          : ctx.experimentId === "nacl_crystal"
            ? "Preparation of pure NaCl crystals from impure salt (dissolve → filter → evaporate to সম্পৃক্ত দ্রবণ → slow cooling → বীজ কেলাস → ঘনকীয় কেলাস)"
            : ctx.experimentId === "ionic_covalent"
              ? "Properties of Ionic vs Covalent compounds (solubility, electrical conductivity, melting point) and Electrolysis of CuSO₄ (Cu²⁺ migrates to cathode → copper deposit; SO₄²⁻/H₂O at anode)"
              : ctx.experimentId || "general chemistry";

  const lines = [
    `Active experiment: ${expName}`,
    `Mode: ${ctx.mode}`,
    `Current step index: ${ctx.currentStep}`,
  ];
  if (ctx.goal) lines.push(`Goal: ${ctx.goal}`);
  if (ctx.currentChemicals?.length)
    lines.push(`Chemicals placed: ${ctx.currentChemicals.join(", ")}`);
  if (ctx.currentEquipment?.length)
    lines.push(`Equipment placed: ${ctx.currentEquipment.join(", ")}`);
  if (ctx.mistakesMade.length)
    lines.push(`Recent mistakes: ${ctx.mistakesMade.slice(-5).join("; ")}`);
  return `\n\n[Live experiment context]\n${lines.join("\n")}\n`;
}

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        messages: z.array(MessageSchema).min(1).max(40),
        context: ContextSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        reply: "",
        error: "Lovable AI is not configured. দয়া করে পরে চেষ্টা করুন।",
      };
    }
    const systemPrompt = SYSTEM_PROMPT + buildContextBlock(data.context);
    const history: ChatTurn[] = data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    try {
      const reply = await chatComplete({ apiKey: key, systemPrompt, history });
      return { reply, error: null as string | null };
    } catch (e) {
      console.error("chatWithAssistant failed", e);
      return {
        reply: "",
        error: "AI assistant সাড়া দিতে পারেনি। আবার চেষ্টা করুন।",
      };
    }
  });
