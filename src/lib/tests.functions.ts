// Student-side server functions for tests/attempts.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** List published tests visible to me across my classes. */
export const getAssignedTests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: memberships } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("student_id", userId);
    const classIds = (memberships ?? []).map((m) => m.class_id);
    if (classIds.length === 0) return { sets: [], attempts: [] };

    const { data: sets } = await supabase
      .from("question_sets")
      .select("id, title, chapter, question_type, difficulty, due_at, published_at, class_id")
      .in("class_id", classIds)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    const setIds = (sets ?? []).map((s) => s.id);
    const { data: qCounts } = setIds.length
      ? await supabase.from("questions").select("set_id").in("set_id", setIds)
      : { data: [] as { set_id: string }[] };
    const countBySet = new Map<string, number>();
    for (const r of qCounts ?? []) {
      countBySet.set(r.set_id, (countBySet.get(r.set_id) ?? 0) + 1);
    }
    const setsWithCount = (sets ?? []).map((s) => ({
      ...s,
      question_count: countBySet.get(s.id) ?? 0,
    }));

    const { data: attempts } = setIds.length
      ? await supabase
          .from("test_attempts")
          .select("id, set_id, submitted_at, mcq_score, mcq_total, cq_score")
          .eq("student_id", userId)
          .in("set_id", setIds)
      : { data: [] };
    return { sets: setsWithCount, attempts: attempts ?? [] };
  });

/** Fetch a published test for the student to take. Strips correct_index/explanation. */
export const getTestForStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ set_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: set } = await supabase
      .from("question_sets")
      .select("id, title, chapter, question_type, class_id, status, due_at")
      .eq("id", data.set_id)
      .maybeSingle();
    if (!set || set.status !== "published") {
      return { error: "Test not available", set: null, questions: [], attempt: null };
    }
    const { data: qs } = await supabase
      .from("questions")
      .select("id, order_index, type, question_text, options, stem, parts")
      .eq("set_id", data.set_id)
      .order("order_index");
    // Strip sample answers from CQ parts
    const sanitized = (qs ?? []).map((q) => {
      if (q.type === "cq" && q.parts && typeof q.parts === "object") {
        const p = q.parts as Record<string, { q: string; marks: number }>;
        return {
          ...q,
          parts: {
            ka: { q: p.ka?.q, marks: p.ka?.marks },
            kha: { q: p.kha?.q, marks: p.kha?.marks },
            ga: { q: p.ga?.q, marks: p.ga?.marks },
            gha: { q: p.gha?.q, marks: p.gha?.marks },
          },
        };
      }
      return q;
    });
    const { data: attempt } = await supabase
      .from("test_attempts")
      .select("id, answers, submitted_at, mcq_score, mcq_total, cq_score")
      .eq("set_id", data.set_id)
      .eq("student_id", userId)
      .maybeSingle();
    return { error: null as string | null, set, questions: sanitized, attempt };
  });

const AnswersSchema = z.record(
  z.string(),
  z.union([
    z.number().int().min(0).max(3), // mcq
    z.object({
      // cq
      ka: z.string().max(2000).default(""),
      kha: z.string().max(2000).default(""),
      ga: z.string().max(5000).default(""),
      gha: z.string().max(5000).default(""),
    }),
  ]),
);

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        set_id: z.string().uuid(),
        answers: AnswersSchema,
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Load questions to auto-grade MCQ
    const { data: qs } = await supabase
      .from("questions")
      .select("id, type, correct_index")
      .eq("set_id", data.set_id);
    let mcqScore = 0;
    let mcqTotal = 0;
    for (const q of qs ?? []) {
      if (q.type !== "mcq") continue;
      mcqTotal++;
      const a = data.answers[q.id];
      if (typeof a === "number" && a === q.correct_index) mcqScore++;
    }
    const { data: upserted, error } = await supabase
      .from("test_attempts")
      .upsert(
        {
          set_id: data.set_id,
          student_id: userId,
          answers: data.answers,
          mcq_score: mcqScore,
          mcq_total: mcqTotal,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "set_id,student_id" },
      )
      .select("id")
      .single();
    if (error) return { error: error.message, attempt_id: null, mcqScore, mcqTotal };
    return { error: null as string | null, attempt_id: upserted?.id ?? null, mcqScore, mcqTotal };
  });
