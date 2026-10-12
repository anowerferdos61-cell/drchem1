/**
 * Teacher-only server functions (classroom management).
 * Most classroom reads/writes go directly through the supabase client with RLS,
 * but joining by code and regenerating codes use SECURITY DEFINER RPCs so we
 * expose typed wrappers here for the /app join flow.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureTeacherOrAdmin(supabase: any, userId: string) {
  const [{ data: isTeacher }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "teacher" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
  ]);
  if (!isTeacher && !isAdmin) throw new Error("Forbidden");
}

// Student joins a class by code — usable by any signed-in user.
export const joinClassByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(3).max(12) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: classId, error } = await context.supabase.rpc("join_class", {
      _code: data.code.trim().toUpperCase(),
    });
    if (error) return { error: error.message, classId: null as string | null };
    return { error: null as string | null, classId: classId as string };
  });

// Teacher/admin regenerates a class code.
export const regenerateClassCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ classId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureTeacherOrAdmin(context.supabase, context.userId);
    const { data: newCode, error } = await context.supabase.rpc("regenerate_class_code", {
      _class_id: data.classId,
    });
    if (error) return { error: error.message, code: null as string | null };
    return { error: null as string | null, code: newCode as string };
  });
