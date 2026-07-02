// Chat server functions for the bilingual Lab AI Assistant.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatComplete, getGeminiApiKey, type ChatTurn } from "./ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
              : ctx.experimentId === "na2co3_standard"
                ? "Preparation of 250 mL of 0.1 M Na₂CO₃ standard solution. Theoretical mass W = (S × M × V)/1000 = (0.1 × 106 × 250)/1000 = 2.650 g. Na₂CO₃ is a PRIMARY STANDARD substance (high purity, stable, non-hygroscopic, accurate molar mass, soluble in water). Procedure: tare watch glass on digital analytical balance → weigh exactly 2.650 g → transfer through funnel into 250 mL volumetric flask → wash watch glass & funnel with distilled water → swirl to dissolve → add water close to the calibration mark → align the LOWER meniscus exactly at the 250 mL ring at eye level → stopper and invert to homogenize. Final molarity S = (1000 × W)/(106 × V). Always use room-temperature (~25 °C) distilled water — warm water expands and volume reading becomes incorrect."
                : ctx.experimentId === "cuso4_water"
                  ? "Determination of crystallization water in CuSO₄·5H₂O (blue vitriol / নীল তুঁতে). Molar masses: hydrated 249.5 g/mol, anhydrous CuSO₄ 159.5 g/mol, 5H₂O = 90.0 g/mol. Theoretical water % = 90.0/249.5 × 100 = 36.07 %. Procedure: weigh empty porcelain crucible (x) on the analytical balance → add 3–5 g pulverized blue vitriol & reweigh (y) → place crucible on wire gauze on tripod → heat with Bunsen burner, stirring gently with a glass rod, until colour changes blue → pale blue → WHITE (anhydrous CuSO₄) → turn off burner → transfer with crucible tongs to a DESICCATOR (silica gel) and cool to 25 °C (room temp) → reweigh (z). Calculation: %H₂O = (y − z)/(y − x) × 100. Key concepts: coordination water vs lattice water in [Cu(H₂O)₄]SO₄·H₂O, efflorescence (slow loss of water in dry air), reversibility — white anhydrous CuSO₄ re-absorbs moisture and turns blue (used as a water test). Safety: never weigh a HOT crucible (convection currents falsify the reading and may damage the balance pan); never touch with bare hands — use tongs; do not stir aggressively to avoid spilling crystals; insufficient heating leaves residual water → low %H₂O."
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
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        messages: z.array(MessageSchema).min(1).max(40),
        context: ContextSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // ─── Quota check for Free tier ─────────────────────────────
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_code, status")
      .eq("user_id", userId)
      .in("status", ["trialing", "active"])
      .maybeSingle();

    const isPaid = !!sub && sub.plan_code !== "free";

    if (!isPaid) {
      // Free tier: 5 messages/day in Asia/Dhaka
      const now = new Date();
      const dhaka = new Date(now.getTime() + (6 * 60 - now.getTimezoneOffset()) * 60_000);
      const today = dhaka.toISOString().slice(0, 10);

      const { data: usage } = await supabase
        .from("usage_counters")
        .select("ai_messages_used")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();

      const used = usage?.ai_messages_used ?? 0;
      if (used >= 5) {
        return {
          reply: "",
          error:
            "আজকের ৫টি free AI message শেষ হয়ে গেছে। Unlimited access এর জন্য Pro upgrade করো।",
          quotaExceeded: true as const,
        };
      }
    }

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

      // Record usage (only for free tier) via SECURITY DEFINER RPC
      if (!isPaid) {
        const now = new Date();
        const dhaka = new Date(now.getTime() + (6 * 60 - now.getTimezoneOffset()) * 60_000);
        const today = dhaka.toISOString().slice(0, 10);
        await supabase.rpc("increment_ai_usage", { _usage_date: today });
      }


      return { reply, error: null as string | null };
    } catch (e) {
      console.error("chatWithAssistant failed", e);
      return {
        reply: "",
        error: "AI assistant সাড়া দিতে পারেনি। আবার চেষ্টা করুন।",
      };
    }
  });
