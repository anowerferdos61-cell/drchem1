/**
 * Progress tracking — server functions for persistent lab attempts + streaks.
 * - Students save lab attempts and check in their daily streak.
 * - Teachers read progress for students in their own classes.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const attemptInput = z.object({
  experiment_id: z.string().min(1).max(80),
  mode: z.string().max(24).default("student"),
  accuracy: z.number().min(0).max(100).default(0),
  grade: z.string().max(2).default("F"),
  duration_sec: z.number().int().min(0).max(60 * 60 * 12).default(0),
  mistakes_count: z.number().int().min(0).max(9999).default(0),
  steps_completed: z.number().int().min(0).max(9999).default(0),
  steps_total: z.number().int().min(0).max(9999).default(0),
  report: z.unknown().optional(),
});

export const saveLabAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => attemptInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, data: row } = await supabase
      .from("lab_attempts")
      .insert({
        student_id: userId,
        experiment_id: data.experiment_id,
        mode: data.mode,
        accuracy: data.accuracy,
        grade: data.grade,
        duration_sec: data.duration_sec,
        mistakes_count: data.mistakes_count,
        steps_completed: data.steps_completed,
        steps_total: data.steps_total,
        report: (data.report ?? {}) as object,
      })
      .select("id")
      .single();
    if (error) throw error;
    // Also check in the streak.
    await supabase.rpc("streak_checkin");
    return { id: row?.id ?? null };
  });

export const streakCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("streak_checkin");
    if (error) throw error;
    return data;
  });

export const getMyStreak = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("streaks")
      .select("current_days, longest_days, last_check_date, start_date")
      .eq("user_id", userId)
      .maybeSingle();
    return (
      data ?? {
        current_days: 0,
        longest_days: 0,
        last_check_date: null,
        start_date: null,
      }
    );
  });

function summarize(attempts: Array<{ experiment_id: string; accuracy: number; grade: string; created_at: string; duration_sec: number }>) {
  const byExp = new Map<string, { count: number; best: number; bestGrade: string; last: string }>();
  for (const a of attempts) {
    const cur = byExp.get(a.experiment_id);
    if (!cur) {
      byExp.set(a.experiment_id, { count: 1, best: a.accuracy, bestGrade: a.grade, last: a.created_at });
    } else {
      cur.count += 1;
      if (a.accuracy > cur.best) {
        cur.best = a.accuracy;
        cur.bestGrade = a.grade;
      }
      if (a.created_at > cur.last) cur.last = a.created_at;
    }
  }
  const totalAttempts = attempts.length;
  const uniqueLabs = byExp.size;
  const avgAccuracy = totalAttempts
    ? Math.round(attempts.reduce((s, a) => s + Number(a.accuracy || 0), 0) / totalAttempts)
    : 0;
  const totalMinutes = Math.round(
    attempts.reduce((s, a) => s + (a.duration_sec || 0), 0) / 60,
  );
  return {
    totalAttempts,
    uniqueLabs,
    avgAccuracy,
    totalMinutes,
    perExperiment: Array.from(byExp.entries()).map(([experiment_id, v]) => ({
      experiment_id,
      ...v,
    })),
  };
}

export const getMyProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [attemptsRes, streakRes, testsRes] = await Promise.all([
      supabase
        .from("lab_attempts")
        .select("id, experiment_id, accuracy, grade, duration_sec, mistakes_count, created_at")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("streaks")
        .select("current_days, longest_days, last_check_date, start_date")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("test_attempts")
        .select("id, set_id, submitted_at, mcq_score, mcq_total, cq_score")
        .eq("student_id", userId)
        .order("submitted_at", { ascending: false })
        .limit(50),
    ]);
    const attempts = attemptsRes.data ?? [];
    const tests = testsRes.data ?? [];
    return {
      streak: streakRes.data ?? {
        current_days: 0,
        longest_days: 0,
        last_check_date: null,
        start_date: null,
      },
      summary: summarize(attempts),
      recentAttempts: attempts.slice(0, 20),
      testAttempts: tests,
    };
  });

const classInput = z.object({ class_id: z.string().uuid() });

export const getClassProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => classInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify teacher owns the class (RLS on classes will also filter).
    const { data: cls } = await supabase
      .from("classes")
      .select("id, teacher_id")
      .eq("id", data.class_id)
      .maybeSingle();
    if (!cls) throw new Error("Class not found");
    const isOwner = cls.teacher_id === userId;
    const { data: adminCheck } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isOwner && !adminCheck) throw new Error("Forbidden");

    const { data: members } = await supabase
      .from("class_members")
      .select("student_id")
      .eq("class_id", data.class_id);
    const studentIds = (members ?? []).map((m) => m.student_id);
    if (studentIds.length === 0) {
      return { students: [], leaderboard: [] };
    }

    const [profilesRes, attemptsRes, streaksRes, testsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", studentIds),
      supabase
        .from("lab_attempts")
        .select("student_id, experiment_id, accuracy, grade, created_at, duration_sec")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("streaks")
        .select("user_id, current_days, longest_days, last_check_date")
        .in("user_id", studentIds),
      supabase
        .from("test_attempts")
        .select("student_id, mcq_score, mcq_total, cq_score, submitted_at")
        .in("student_id", studentIds),
    ]);

    const profiles = new Map(
      (profilesRes.data ?? []).map((p) => [p.user_id, p]),
    );
    const streaks = new Map(
      (streaksRes.data ?? []).map((s) => [s.user_id, s]),
    );
    const attemptsBy = new Map<string, typeof (attemptsRes.data extends null ? never : NonNullable<typeof attemptsRes.data>)>();
    for (const a of attemptsRes.data ?? []) {
      const arr = attemptsBy.get(a.student_id) ?? [];
      arr.push(a);
      attemptsBy.set(a.student_id, arr);
    }
    const testsBy = new Map<string, Array<{ mcq_score: number | null; mcq_total: number | null; cq_score: number | null }>>();
    for (const t of testsRes.data ?? []) {
      const arr = testsBy.get(t.student_id) ?? [];
      arr.push(t);
      testsBy.set(t.student_id, arr);
    }

    const leaderboard = studentIds.map((sid) => {
      const attempts = attemptsBy.get(sid) ?? [];
      const uniqueLabs = new Set(attempts.map((a) => a.experiment_id)).size;
      const avgAccuracy = attempts.length
        ? Math.round(
            attempts.reduce((s, a) => s + Number(a.accuracy || 0), 0) /
              attempts.length,
          )
        : 0;
      const tests = testsBy.get(sid) ?? [];
      const testsDone = tests.length;
      const streak = streaks.get(sid);
      const p = profiles.get(sid);
      return {
        student_id: sid,
        display_name: p?.display_name ?? p?.email ?? "Student",
        email: p?.email ?? null,
        uniqueLabs,
        totalAttempts: attempts.length,
        avgAccuracy,
        testsDone,
        currentStreak: streak?.current_days ?? 0,
        lastActive: attempts[0]?.created_at ?? null,
      };
    });
    leaderboard.sort((a, b) => b.avgAccuracy - a.avgAccuracy || b.uniqueLabs - a.uniqueLabs);

    return { leaderboard };
  });
