// Server functions powering the AI viva (oral exam) for the chemistry lab.
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createGeminiProvider, getGeminiApiKey, DEFAULT_CHAT_MODEL } from "./ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL_ID = DEFAULT_CHAT_MODEL;

const QuestionSchema = z.object({
  q: z.string().describe("The viva question"),
  expected: z.string().describe("A concise model answer (1-2 sentences)"),
});

const GenerateSchema = z.object({
  questions: z.array(QuestionSchema),
});

const ExperimentEnum = z.enum(["titration", "oxygen_prep", "co2_prep", "nacl_crystal", "ionic_covalent", "na2co3_standard", "cuso4_water"]);

function experimentContext(exp: z.infer<typeof ExperimentEnum>): string {
  if (exp === "oxygen_prep") {
    return [
      "the laboratory preparation of oxygen gas",
      "Equation: 2 H2O2(aq) --[MnO2]--> 2 H2O(l) + O2(g).",
      "Cover: role of MnO2 as a catalyst (not consumed), properties of O2 (colorless, odorless, supports combustion),",
      "collection by downward displacement of water, the glowing-splint test (relights/bursts into flame),",
      "and lab safety (eye protection, no open flame near H2O2, keep H2O2 away from organics).",
    ].join(" ");
  }
  if (exp === "co2_prep") {
    return [
      "the laboratory preparation of carbon dioxide gas",
      "Equation: CaCO3(s) + 2 HCl(aq) --> CaCl2(aq) + H2O(l) + CO2(g).",
      "Cover: apparatus (round-bottom flask, two-hole cork, thistle funnel with submerged tip, twice-bent delivery tube, gas jar),",
      "why CO2 is collected by upward displacement of air (denser than air), and identification tests:",
      "(a) limewater turns milky [Ca(OH)2 + CO2 -> CaCO3 + H2O], excess CO2 re-dissolves it as Ca(HCO3)2,",
      "(b) a burning splint is extinguished, (c) moist blue litmus turns faint red (H2CO3),",
      "(d) burning magnesium ribbon continues to burn producing black carbon (2 Mg + CO2 -> 2 MgO + C),",
      "and safety (handle dilute HCl carefully, ventilation).",
    ].join(" ");
  }
  if (exp === "nacl_crystal") {
    return [
      "preparation of pure cubic NaCl crystals from impure salt (Class 9-10, Bangladesh NCTB).",
      "Procedure: crush 20-25 g impure salt, dissolve in ~100 mL distilled water, filter through funnel + filter paper into Beaker-2,",
      "transfer filtrate to an evaporating dish on tripod + wire gauze, heat with Bunsen burner until volume reduces to ~50% (saturated solution),",
      "turn off the burner, allow natural slow cooling, optionally add a seed crystal (বীজ কেলাস) for uniform cubic geometry.",
      "Cover: why filtration must precede heating (removes insoluble impurities like sand/dust),",
      "meaning of saturated solution (সম্পৃক্ত দ্রবণ) and why ~50% volume reduction is the target,",
      "why rapid cooling produces small/irregular crystals while slow cooling yields well-formed cubic crystals,",
      "role of the seed crystal, cubic geometry of NaCl (face-centred ionic lattice),",
      "why distilled water (not tap water) is used, and lab safety with the Bunsen burner and hot evaporating dish.",
    ].join(" ");
  }
  if (exp === "ionic_covalent") {
    return [
      "properties of ionic vs covalent compounds and the electrolysis of CuSO4 (Class 9-10, Bangladesh NCTB).",
      "Substances tested: NaCl (ionic), sugar (polar covalent), naphthalene (non-polar covalent), CuSO4 (ionic).",
      "Cover: (a) Solubility — NaCl and CuSO4 dissolve in water, sugar dissolves, naphthalene is insoluble (like dissolves like).",
      "(b) Electrical conductivity — solid NaCl does NOT conduct (ions locked in lattice), but aqueous NaCl/CuSO4 conduct due to free mobile ions; sugar and naphthalene solutions do not conduct (no ions).",
      "(c) Melting point — ionic compounds have high melting points (strong electrostatic lattice), covalent (naphthalene/sugar) have low melting points; overheating naphthalene causes sublimation/vaporization.",
      "(d) Electrolysis of CuSO4(aq) with carbon/copper electrodes: Cu2+ migrates to the cathode and is reduced (Cu2+ + 2e- -> Cu, reddish-brown deposit); at the anode either SO4^2- stays in solution and water is oxidized (2 H2O -> O2 + 4H+ + 4e-) or, with a copper anode, Cu is oxidized (Cu -> Cu2+ + 2e-).",
      "Discuss why reversing the electrodes deposits Cu on the wrong side, the role of free ions in conduction, and lab safety (handle CuSO4 carefully, avoid skin contact, ventilation, do not overheat naphthalene over an open flame).",
    ].join(" ");
  }
  if (exp === "na2co3_standard") {
    return [
      "preparation of 250 mL of 0.1 M sodium carbonate (Na2CO3) standard solution (Class 9-10, Bangladesh NCTB).",
      "Theoretical mass formula: W = (S × M × V)/1000 where S = molarity, M = molar mass (106 g/mol for Na2CO3), V = volume in mL.",
      "For 0.1 M × 250 mL: W = (0.1 × 106 × 250)/1000 = 2.650 g.",
      "Final molarity: S = (1000 × W_actual)/(106 × V_actual).",
      "Cover: (a) PRIMARY STANDARD vs secondary standard substance — Na2CO3 qualifies as primary standard (high purity ≥99.9%, stable in air, non-hygroscopic, accurately known molar mass, easily soluble, no water of crystallization in anhydrous form). NaOH is NOT primary standard (hygroscopic, absorbs CO2).",
      "(b) Equivalent weight of Na2CO3 = M/2 = 53 g/eq (since it provides 2 H+ equivalents in acid-base reactions).",
      "(c) Definition of molarity: moles of solute per litre of solution.",
      "(d) Procedure rationale: tare the watch glass first to read solute mass only; transfer through a FUNNEL to prevent spillage of analyte; rinse watch glass and funnel with a fine jet of distilled water to ensure quantitative transfer (no loss = correct concentration); dilute only to the calibration mark, never beyond.",
      "(e) Why the LOWER MENISCUS is read at eye level — water wets glass and curves downward; reading the lower meniscus at eye level eliminates parallax error and gives accurate volume.",
      "(f) Why use ROOM TEMPERATURE (~25 °C) distilled water — warm water expands, so when it cools the actual volume becomes less than 250 mL and concentration becomes higher than expected; volumetric flasks are calibrated at 20-25 °C.",
      "(g) Safety: handle Na2CO3 carefully (mild irritant), use distilled water (not tap), do not shake before reaching the mark.",
    ].join(" ");
  }
  if (exp === "cuso4_water") {
    return [
      "determination of crystallization water in copper(II) sulfate pentahydrate, CuSO4·5H2O (blue vitriol / নীল তুঁতে), Class 9-10 NCTB.",
      "Molar masses: hydrated 249.5 g/mol, anhydrous CuSO4 159.5 g/mol, 5H2O = 90.0 g/mol; theoretical water percentage = 90.0/249.5 × 100 = 36.07 %.",
      "Procedure: weigh empty porcelain crucible (x), add 3-5 g pulverized blue vitriol and reweigh (y), heat over a Bunsen burner on a tripod + wire gauze, stir gently with a glass rod until colour changes blue → pale blue → white (anhydrous), cool in a DESICCATOR to room temperature, reweigh (z).",
      "Calculation: %H2O = (y − z)/(y − x) × 100. Tolerance ±1.5 % around 36.07 %.",
      "Concepts to cover: (a) why the blue colour disappears — water of crystallization (coordination + lattice water in [Cu(H2O)4]SO4·H2O) is the chromophore; loss of water breaks the d-orbital ligand field and gives white anhydrous CuSO4; reaction is REVERSIBLE, so anhydrous CuSO4 is used as a moisture test (turns blue with water).",
      "(b) Efflorescence — slow loss of water of crystallization in dry air.",
      "(c) Why a DESICCATOR is required for cooling — open-air cooling lets anhydrous CuSO4 re-absorb atmospheric moisture (hygroscopic) → z becomes too large → %H2O reads too LOW; silica gel keeps the chamber dry.",
      "(d) Why we never weigh a HOT crucible — rising convection air currents push the pan up and produce a falsely LOW reading, and thermal expansion can damage the balance; also rapid temperature change makes the analytical balance drift.",
      "(e) Use crucible TONGS, never bare hands (burn risk + skin oil/moisture adds mass).",
      "(f) Sample viva: 'Why does the blue colour disappear on heating?', 'What happens if anhydrous CuSO4 is left in open air?', 'Why a desiccator instead of cooling in the open room?', 'Why must heating be sustained until the powder is fully white?', 'Coordination water vs lattice water — how many of each in CuSO4·5H2O?' (4 coordinated to Cu²⁺, 1 lattice H-bonded to sulfate).",
    ].join(" ");
  }
  return [
    "acid-base titration (HCl + NaOH)",
    "Cover: indicators (phenolphthalein), equivalence point vs endpoint,",
    "neutralization stoichiometry (Ma·Va = Mb·Vb), pH at endpoint for strong acid + strong base,",
    "burette/pipette technique and sources of error.",
  ].join(" ");
}



export const generateViva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        topic: z.string().trim().min(1).max(300),
        count: z.number().int().min(3).max(10).default(6),
        experiment: ExperimentEnum.default("titration"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = getGeminiApiKey();
    if (!key) {
      return {
        questions: [] as Array<z.infer<typeof QuestionSchema>>,
        error: "AI service is not configured.",
      };
    }
    const gateway = createGeminiProvider(key);
    const model = gateway(MODEL_ID);

    const ctx = experimentContext(data.experiment);
    try {
      const { object, usage } = await generateObject({
        model,
        schema: GenerateSchema,
        prompt: `You are a high-school chemistry teacher. Generate exactly ${data.count} concise viva (oral exam) questions about: "${data.topic}". Context: ${ctx} For each, return an object with "q" (question) and "expected" (one-sentence model answer). Return JSON: { "questions": [ { "q": "...", "expected": "..." }, ... ] }.`,
      });
      const { logAiUsage } = await import("./ai-usage.server");
      const u = (usage ?? {}) as {
        inputTokens?: number;
        outputTokens?: number;
        promptTokens?: number;
        completionTokens?: number;
      };
      void logAiUsage({
        userId: null,
        endpoint: "viva_generate",
        model: MODEL_ID,
        inputTokens: u.inputTokens ?? u.promptTokens ?? 0,
        outputTokens: u.outputTokens ?? u.completionTokens ?? 0,
      });
      return { questions: object.questions, error: null as string | null };
    } catch (e) {
      console.error("generateViva failed", e);
      return { questions: [], error: "Failed to generate questions. Try again." };
    }
  });

const GradeSchema = z.object({
  perQuestion: z.array(
    z.object({
      correct: z.boolean(),
      score: z.number().min(0).max(1),
      feedback: z.string(),
    }),
  ),
  overallScore: z.number().min(0).max(100),
  gaps: z.array(z.string()),
  summary: z.string(),
});

export const gradeViva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        items: z
          .array(
            z.object({
              q: z.string(),
              expected: z.string(),
              answer: z.string().max(2000),
            }),
          )
          .min(1)
          .max(10),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = getGeminiApiKey();
    if (!key) {
      return { result: null, error: "AI service is not configured." };
    }
    const gateway = createGeminiProvider(key);
    const model = gateway(MODEL_ID);

    const transcript = data.items
      .map(
        (it, i) =>
          `Q${i + 1}: ${it.q}\nExpected: ${it.expected}\nStudent answer: ${it.answer || "(no answer)"}`,
      )
      .join("\n\n");

    try {
      const { object, usage } = await generateObject({
        model,
        schema: GradeSchema,
        prompt: `Grade the following chemistry viva. Be fair but rigorous. For each question return { correct: boolean, score: 0-1, feedback: string }. Then overallScore (0-100), gaps (array of strings), summary (one paragraph).\n\n${transcript}`,
      });
      const { logAiUsage } = await import("./ai-usage.server");
      const u = (usage ?? {}) as {
        inputTokens?: number;
        outputTokens?: number;
        promptTokens?: number;
        completionTokens?: number;
      };
      void logAiUsage({
        userId: null,
        endpoint: "viva_grade",
        model: MODEL_ID,
        inputTokens: u.inputTokens ?? u.promptTokens ?? 0,
        outputTokens: u.outputTokens ?? u.completionTokens ?? 0,
      });
      return { result: object, error: null as string | null };
    } catch (e) {
      console.error("gradeViva failed", e);
      return { result: null, error: "Grading failed. Try again." };
    }
  });
