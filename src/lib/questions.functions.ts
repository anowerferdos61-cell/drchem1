// Teacher-side server functions for AI Question Generator.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getGeminiApiKey } from "./ai-gateway";

const GenSchema = z.object({
  chapter: z.string().trim().min(1).max(200),
  type: z.enum(["mcq", "cq"]),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  count: z.number().int().min(1).max(10),
  experiment: z.string().trim().max(200).optional().nullable(),
});

/** Generate preview questions from AI (does NOT save). */
export const generateQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => GenSchema.parse(i))
  .handler(async ({ data, context }) => {
    const key = getGeminiApiKey();
    if (!key) return { error: "AI service not configured.", questions: null };

    // Rate limit: 30 generations / teacher / day (reuse usage_counters).
    const now = new Date();
    const dhaka = new Date(now.getTime() + (6 * 60 - now.getTimezoneOffset()) * 60_000);
    const today = dhaka.toISOString().slice(0, 10);
    const { data: usage } = await context.supabase
      .from("usage_counters")
      .select("ai_messages_used")
      .eq("user_id", context.userId)
      .eq("usage_date", today)
      .maybeSingle();
    if ((usage?.ai_messages_used ?? 0) >= 100) {
      return { error: "আজকের generation limit শেষ। কাল আবার চেষ্টা করুন।", questions: null };
    }

    const { generateMcqs, generateCqs } = await import("./gemini-questions.server");
    try {
      const questions =
        data.type === "mcq"
          ? await generateMcqs({
              apiKey: key,
              chapter: data.chapter,
              difficulty: data.difficulty,
              count: data.count,
              experiment: data.experiment ?? undefined,
            })
          : await generateCqs({
              apiKey: key,
              chapter: data.chapter,
              difficulty: data.difficulty,
              count: data.count,
              experiment: data.experiment ?? undefined,
            });
      await context.supabase.rpc("increment_ai_usage", { _usage_date: today });
      return { error: null as string | null, questions };
    } catch (e) {
      console.error("generateQuestions failed", e);
      return {
        error: "AI প্রশ্ন বানাতে পারেনি। আবার চেষ্টা করুন।",
        questions: null,
      };
    }
  });

// ── Save / update set ─────────────────────────────────────────────
const McqQ = z.object({
  question: z.string().trim().min(1),
  options: z.array(z.string()).length(4),
  correct_index: z.number().int().min(0).max(3),
  explanation: z.string().default(""),
});
const CqPartS = z.object({
  q: z.string().default(""),
  marks: z.number(),
  sample: z.string().default(""),
});
const CqQ = z.object({
  stem: z.string().trim().min(1),
  ka: CqPartS,
  kha: CqPartS,
  ga: CqPartS,
  gha: CqPartS,
});
const SaveSchema = z.object({
  set_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(200),
  chapter: z.string().trim().min(1).max(200),
  question_type: z.enum(["mcq", "cq", "mixed"]),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  source_experiment: z.string().trim().max(200).optional().nullable(),
  class_id: z.string().uuid().optional().nullable(),
  mcq_items: z.array(McqQ).optional().default([]),
  cq_items: z.array(CqQ).optional().default([]),
});

export const saveQuestionSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => SaveSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let setId = data.set_id ?? null;

    if (setId) {
      const { error } = await supabase
        .from("question_sets")
        .update({
          title: data.title,
          chapter: data.chapter,
          question_type: data.question_type,
          difficulty: data.difficulty,
          source_experiment: data.source_experiment ?? null,
          class_id: data.class_id ?? null,
        })
        .eq("id", setId)
        .eq("teacher_id", userId);
      if (error) return { error: error.message, set_id: null };
      await supabase.from("questions").delete().eq("set_id", setId);
    } else {
      const { data: ins, error } = await supabase
        .from("question_sets")
        .insert({
          teacher_id: userId,
          title: data.title,
          chapter: data.chapter,
          question_type: data.question_type,
          difficulty: data.difficulty,
          source_experiment: data.source_experiment ?? null,
          class_id: data.class_id ?? null,
          status: "draft",
        })
        .select("id")
        .single();
      if (error || !ins) return { error: error?.message ?? "Failed", set_id: null };
      setId = ins.id;
    }

    const rows: Array<Record<string, unknown>> = [];
    let idx = 0;
    for (const m of data.mcq_items) {
      rows.push({
        set_id: setId,
        order_index: idx++,
        type: "mcq",
        question_text: m.question,
        options: m.options,
        correct_index: m.correct_index,
        explanation: m.explanation,
      });
    }
    for (const c of data.cq_items) {
      rows.push({
        set_id: setId,
        order_index: idx++,
        type: "cq",
        stem: c.stem,
        parts: { ka: c.ka, kha: c.kha, ga: c.ga, gha: c.gha },
      });
    }
    if (rows.length > 0) {
      const { error } = await supabase.from("questions").insert(rows);
      if (error) return { error: error.message, set_id: setId };
    }
    return { error: null as string | null, set_id: setId };
  });

// ── List / get ────────────────────────────────────────────────────
export const getMyQuestionSets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("question_sets")
      .select("id, title, chapter, question_type, difficulty, status, class_id, published_at, created_at")
      .eq("teacher_id", context.userId)
      .order("created_at", { ascending: false });
    return { error: error?.message ?? null, sets: data ?? [] };
  });

export const getSetDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ set_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: set, error: e1 } = await context.supabase
      .from("question_sets")
      .select("*")
      .eq("id", data.set_id)
      .eq("teacher_id", context.userId)
      .maybeSingle();
    if (e1 || !set) return { error: e1?.message ?? "Not found", set: null, questions: [] };
    const { data: qs, error: e2 } = await context.supabase
      .from("questions")
      .select("*")
      .eq("set_id", data.set_id)
      .order("order_index");
    return { error: e2?.message ?? null, set, questions: qs ?? [] };
  });

// ── Publish ───────────────────────────────────────────────────────
export const publishQuestionSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        set_id: z.string().uuid(),
        class_id: z.string().uuid(),
        due_at: z.string().datetime().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    // Verify class ownership
    const { data: cls } = await context.supabase
      .from("classes")
      .select("id")
      .eq("id", data.class_id)
      .eq("teacher_id", context.userId)
      .maybeSingle();
    if (!cls) return { error: "Class not found or not yours" };
    const { error } = await context.supabase
      .from("question_sets")
      .update({
        class_id: data.class_id,
        status: "published",
        published_at: new Date().toISOString(),
        due_at: data.due_at ?? null,
      })
      .eq("id", data.set_id)
      .eq("teacher_id", context.userId);
    return { error: error?.message ?? null };
  });

export const deleteQuestionSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ set_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("question_sets")
      .delete()
      .eq("id", data.set_id)
      .eq("teacher_id", context.userId);
    return { error: error?.message ?? null };
  });

export const getClassQuestionSets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ class_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: sets, error } = await context.supabase
      .from("question_sets")
      .select("id, title, question_type, status, published_at, due_at, created_at")
      .eq("class_id", data.class_id)
      .eq("teacher_id", context.userId)
      .order("created_at", { ascending: false });
    return { error: error?.message ?? null, sets: sets ?? [] };
  });
