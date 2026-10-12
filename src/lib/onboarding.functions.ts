/**
 * One-time role selection fallback for accounts that missed signup role setup,
 * plus a helper to add a phone number to an existing account (legacy users).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeBdPhone } from "@/lib/phone";

export const setMyRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        role: z.enum(["student", "teacher"]),
        school: z.string().trim().max(120).optional(),
        klass: z.string().trim().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = (existing ?? []).some((r) => r.role === "admin");

    const { error: deleteErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .neq("role", "admin");
    if (deleteErr) throw new Error(deleteErr.message);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleErr && roleErr.code !== "23505") throw new Error(roleErr.message);

    const updates: {
      role_selected: boolean;
      school?: string;
      class?: string;
    } = { role_selected: true };
    if (data.school !== undefined) updates.school = data.school;
    if (data.klass !== undefined) updates.class = data.klass;

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);
    if (profErr) throw new Error(profErr.message);

    return { ok: true, isAdmin };
  });

/**
 * Add / update phone number for the current user.
 * Enforces BD format and unique-per-account.
 */
export const setMyPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ phone: z.string().trim().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const normalized = normalizeBdPhone(data.phone);
    if (!normalized) {
      throw new Error("ফোন নাম্বার সঠিক নয়। যেমন: 01XXXXXXXXX");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Duplicate check
    const { data: existing, error: lookupErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("phone", normalized)
      .maybeSingle();
    if (lookupErr) throw new Error(lookupErr.message);
    if (existing && existing.user_id !== userId) {
      throw new Error("এই ফোন নাম্বার অন্য একটি অ্যাকাউন্টে ব্যবহার হয়েছে।");
    }

    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ phone: normalized })
      .eq("user_id", userId);
    if (updErr) throw new Error(updErr.message);

    return { ok: true, phone: normalized };
  });
