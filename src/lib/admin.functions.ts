/**
 * Admin-only server functions for the admin dashboard.
 * All callers are checked against the 'admin' role.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: { supabase: ReturnType<typeof Object>; userId: string }) {
  // @ts-expect-error supabase is the supabase-js client from middleware
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export interface AdminUserRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  school: string | null;
  class: string | null;
  phone: string | null;
  created_at: string;
  roles: string[];
  subscription: {
    plan_code: string;
    status: string;
    current_period_end: string | null;
    trial_ends_at: string | null;
  } | null;
  last_sign_in_at: string | null;
}

// ─── listAllUsers ───────────────────────────────────────────────────────
export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await ensureAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pull profiles + roles + subscriptions
    const [{ data: profiles }, { data: roles }, { data: subs }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("user_id, email, display_name, school, class, phone, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, plan_code, status, current_period_end, trial_ends_at, started_at")
        .order("started_at", { ascending: false }),
    ]);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = rolesByUser.get(r.user_id as string) ?? [];
      arr.push(r.role as string);
      rolesByUser.set(r.user_id as string, arr);
    }

    // First subscription per user is most recent (already ordered)
    const subByUser = new Map<string, NonNullable<AdminUserRow["subscription"]>>();
    for (const s of subs ?? []) {
      if (!subByUser.has(s.user_id as string)) {
        subByUser.set(s.user_id as string, {
          plan_code: s.plan_code as string,
          status: s.status as string,
          current_period_end: (s.current_period_end as string) ?? null,
          trial_ends_at: (s.trial_ends_at as string) ?? null,
        });
      }
    }

    // Hydrate last_sign_in_at from auth.users via admin API
    const lastSignInMap = new Map<string, string | null>();
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      for (const u of authData?.users ?? []) {
        lastSignInMap.set(u.id, u.last_sign_in_at ?? null);
      }
    } catch {
      /* ignore */
    }

    return (profiles ?? []).map((p) => ({
      user_id: p.user_id as string,
      email: (p.email as string) ?? null,
      display_name: (p.display_name as string) ?? null,
      school: (p.school as string) ?? null,
      class: (p.class as string) ?? null,
      phone: (p.phone as string) ?? null,
      created_at: p.created_at as string,
      roles: rolesByUser.get(p.user_id as string) ?? [],
      subscription: subByUser.get(p.user_id as string) ?? null,
      last_sign_in_at: lastSignInMap.get(p.user_id as string) ?? null,
    }));
  });

// ─── grantSubscription ─────────────────────────────────────────────────
export const grantSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        planCode: z.enum([
          "student_monthly",
          "student_yearly",
          "teacher_monthly",
          "teacher_yearly",
        ]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.rpc("admin_grant_subscription", {
      _user_id: data.userId,
      _plan_code: data.planCode,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── cancelUserSubscription ────────────────────────────────────────────
export const cancelUserSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", data.userId)
      .in("status", ["trialing", "active"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── adminStats ────────────────────────────────────────────────────────
export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [
      { count: totalUsers },
      { count: activeSubs },
      { count: trialingSubs },
      { count: pendingPayments },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "trialing"),
      supabaseAdmin
        .from("payment_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);
    return {
      totalUsers: totalUsers ?? 0,
      activeSubs: activeSubs ?? 0,
      trialingSubs: trialingSubs ?? 0,
      pendingPayments: pendingPayments ?? 0,
    };
  });
