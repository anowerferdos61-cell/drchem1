/**
 * One-time role selection for users who signed up via Google.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

    // Don't allow downgrading an admin
    const { data: existing } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = (existing ?? []).some((r) => r.role === "admin");

    // Reset non-admin roles
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
