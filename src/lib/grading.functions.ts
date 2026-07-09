// Teacher-side grading server functions.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getGeminiApiKey } from "./ai-gateway";

/** Class results for a set — MCQ auto scores + CQ status. */
export const getSetResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ set_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: set } = await supabase
      .from("question_sets")
      .select("id, title, class_id")
      .eq("id", data.set_id)
      .eq("teacher_id", userId)
      .maybeSingle();
    if (!set) return { error: "Not found", set: null, rows: [] };

    const { data: attempts } = await supabase
      .from("test_attempts")
      .select("id, student_id, submitted_at, mcq_score, mcq_total, cq_score")
      .eq("set_id", data.set_id);

    const ids = (attempts ?? []).map((a) => a.student_id);
    const profiles = ids.length
      ? (
          await supabase
            .from("profiles")
            .select("user_id, display_name, email")
            .in("user_id", ids)
        ).data ?? []
      : [];
    const map = new Map(profiles.map((p) => [p.user_id, p]));
    const rows = (attempts ?? []).map((a) => ({
      ...a,
      name: map.get(a.student_id)?.display_name ?? map.get(a.student_id)?.email ?? "Student",
    }));
    return { error: null as string | null, set, rows };
  });

/** Full attempt detail for teacher CQ grading. */
export const getAttemptDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ attempt_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: attempt } = await supabase
      .from("test_attempts")
      .select("*")
      .eq("id", data.attempt_id)
      .maybeSingle();
    if (!attempt) return { error: "Not found", attempt: null, set: null, questions: [], grades: [] };
    const { data: set } = await supabase
      .from("question_sets")
      .select("id, title, teacher_id")
      .eq("id", attempt.set_id)
      .maybeSingle();
    if (!set || set.teacher_id !== userId) return { error: "Forbidden", attempt: null, set: null, questions: [], grades: [] };
    const { data: qs } = await supabase
      .from("questions")
      .select("*")
      .eq("set_id", attempt.set_id)
      .order("order_index");
    const { data: grades } = await supabase
      .from("cq_grades")
      .select("*")
      .eq("attempt_id", data.attempt_id);
    return { error: null as string | null, attempt, set, questions: qs ?? [], grades: grades ?? [] };
  });

const SaveGradeSchema = z.object({
  attempt_id: z.string().uuid(),
  question_id: z.string().uuid(),
  part: z.enum(["ka", "kha", "ga", "gha"]),
  marks_awarded: z.number().min(0).max(10),
  ai_similarity_score: z.number().min(0).max(100).nullable().optional(),
  teacher_note: z.string().max(500).optional().nullable(),
});

export const saveCqGrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => SaveGradeSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("cq_grades").upsert(
      {
        attempt_id: data.attempt_id,
        question_id: data.question_id,
        part: data.part,
        marks_awarded: data.marks_awarded,
        ai_similarity_score: data.ai_similarity_score ?? null,
        teacher_note: data.teacher_note ?? null,
        graded_by: userId,
      },
      { onConflict: "attempt_id,question_id,part" },
    );
    if (error) return { error: error.message };

    // Recompute total cq_score for this attempt.
    const { data: allGrades } = await supabase
      .from("cq_grades")
      .select("marks_awarded")
      .eq("attempt_id", data.attempt_id);
    const total = (allGrades ?? []).reduce((s, g) => s + Number(g.marks_awarded ?? 0), 0);
    await supabase
      .from("test_attempts")
      .update({
        cq_score: total,
        cq_graded_at: new Date().toISOString(),
        cq_graded_by: userId,
      })
      .eq("id", data.attempt_id);

    return { error: null as string | null, total };
  });

/** AI-suggested score for one CQ part. */
export const aiSuggestCqScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        sample: z.string().min(1),
        student: z.string(),
        max_marks: z.number().min(1).max(10),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const key = getGeminiApiKey();
    if (!key) return { error: "AI not configured", result: null };
    const { scoreCqAnswer } = await import("./gemini-questions.server");
    const result = await scoreCqAnswer(key, data.sample, data.student, data.max_marks);
    return { error: null as string | null, result };
  });
