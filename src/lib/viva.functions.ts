// Server functions powering the AI viva (oral exam) for the chemistry lab.
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const MODEL_ID = "google/gemini-3-flash-preview";

const QuestionSchema = z.object({
  q: z.string().describe("The viva question"),
  expected: z.string().describe("A concise model answer / rubric (1-2 sentences)"),
});

const GenerateSchema = z.object({
  questions: z.array(QuestionSchema).min(3).max(10),
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
      const { experimental_output } = await generateText({
        model,
        experimental_output: Output.object({ schema: GenerateSchema }),
        prompt: `You are a high-school chemistry teacher. Generate ${data.count} concise viva (oral exam) questions about: "${data.topic}". Focus on acid-base titration concepts (HCl + NaOH, indicators, equivalence point, calculations). Return both the question and a one-sentence expected answer for grading.`,
      });
      return { questions: experimental_output.questions, error: null as string | null };
    } catch (e) {
      console.error("generateViva failed", e);
      return { questions: [], error: "Failed to generate questions. Try again." };
    }
  });

const GradeSchema = z.object({
  perQuestion: z
    .array(
      z.object({
        correct: z.boolean(),
        score: z.number().min(0).max(1),
        feedback: z.string(),
      }),
    )
    .min(1),
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
      const { experimental_output } = await generateText({
        model,
        experimental_output: Output.object({ schema: GradeSchema }),
        prompt: `Grade the following chemistry viva. Be fair but rigorous. For each question return a boolean correct, a 0-1 score, and a short feedback. Then give an overallScore (0-100), a list of concept gaps, and a one-paragraph summary.\n\n${transcript}`,
      });
      return { result: experimental_output, error: null as string | null };
    } catch (e) {
      console.error("gradeViva failed", e);
      return { result: null, error: "Grading failed. Try again." };
    }
  });
