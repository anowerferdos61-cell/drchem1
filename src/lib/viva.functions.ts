// Server functions powering the AI viva (oral exam) for the chemistry lab.
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const MODEL_ID = "google/gemini-3-flash-preview";

const QuestionSchema = z.object({
  q: z.string().describe("The viva question"),
  expected: z.string().describe("A concise model answer (1-2 sentences)"),
});

const GenerateSchema = z.object({
  questions: z.array(QuestionSchema),
});

export const generateViva = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        topic: z.string().trim().min(1).max(300),
        count: z.number().int().min(3).max(10).default(6),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        questions: [] as Array<z.infer<typeof QuestionSchema>>,
        error: "Lovable AI is not configured.",
      };
    }
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway(MODEL_ID);

    try {
      const { object } = await generateObject({
        model,
        schema: GenerateSchema,
        prompt: `You are a high-school chemistry teacher. Generate exactly ${data.count} concise viva (oral exam) questions about: "${data.topic}". Focus on acid-base titration concepts (HCl + NaOH, indicators, equivalence point, calculations). For each, return an object with "q" (question) and "expected" (one-sentence model answer). Return JSON: { "questions": [ { "q": "...", "expected": "..." }, ... ] }.`,
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
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { result: null, error: "Lovable AI is not configured." };
    }
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway(MODEL_ID);

    const transcript = data.items
      .map(
        (it, i) =>
          `Q${i + 1}: ${it.q}\nExpected: ${it.expected}\nStudent answer: ${it.answer || "(no answer)"}`,
      )
      .join("\n\n");

    try {
      const { object } = await generateObject({
        model,
        schema: GradeSchema,
        prompt: `Grade the following chemistry viva. Be fair but rigorous. For each question return { correct: boolean, score: 0-1, feedback: string }. Then overallScore (0-100), gaps (array of strings), summary (one paragraph).\n\n${transcript}`,
      });
      return { result: object, error: null as string | null };
    } catch (e) {
      console.error("gradeViva failed", e);
      return { result: null, error: "Grading failed. Try again." };
    }
  });
