/**
 * Admin-only server functions for the admin dashboard.
 * All callers are checked against the 'admin' role.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
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
  banned_until: string | null;
}

// ─── listAllUsers ───────────────────────────────────────────────────────
export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await ensureAdmin(context.supabase, context.userId);

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

    // Hydrate last_sign_in_at + banned_until + phone from auth.users via admin API
    const lastSignInMap = new Map<string, string | null>();
    const bannedUntilMap = new Map<string, string | null>();
    const authPhoneMap = new Map<string, string | null>();
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      for (const u of authData?.users ?? []) {
        lastSignInMap.set(u.id, u.last_sign_in_at ?? null);
        bannedUntilMap.set(
          u.id,
          ((u as unknown as Record<string, unknown>).banned_until as string | null) ?? null,
        );
        const meta = u.user_metadata as Record<string, unknown> | undefined;
        let ph =
          u.phone ||
          (meta?.phone as string | null) ||
          ((
            (u as unknown as Record<string, unknown>).raw_user_meta_data as
              | Record<string, unknown>
              | undefined
          )?.phone as string | null) ||
          null;
        if (!ph && u.email && u.email.endsWith("@phone.drchem.local")) {
          const local = u.email.split("@")[0];
          ph = local.startsWith("88") ? `+${local}` : local;
        }
        if (ph) authPhoneMap.set(u.id, ph);
      }
    } catch {
      /* ignore */
    }

    return (profiles ?? []).map((p) => {
      let phone = (p.phone as string) || authPhoneMap.get(p.user_id as string) || null;
      if (!phone && p.email && (p.email as string).endsWith("@phone.drchem.local")) {
        const local = (p.email as string).split("@")[0];
        phone = local.startsWith("88") ? `+${local}` : local;
      }
      return {
        user_id: p.user_id as string,
        email: (p.email as string) ?? null,
        display_name: (p.display_name as string) ?? null,
        school: (p.school as string) ?? null,
        class: (p.class as string) ?? null,
        phone,
        created_at: p.created_at as string,
        roles: rolesByUser.get(p.user_id as string) ?? [],
        subscription: subByUser.get(p.user_id as string) ?? null,
        last_sign_in_at: lastSignInMap.get(p.user_id as string) ?? null,
        banned_until: bannedUntilMap.get(p.user_id as string) ?? null,
      };
    });
  });

// ─── banUser ───────────────────────────────────────────────────────────
// Ban duration examples: '24h', '168h' (7d), '876000h' (~100y = permanent)
export const banUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        durationHours: z.number().int().positive().default(876000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot ban yourself");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Safety: refuse to ban another admin
    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((targetRoles ?? []).some((r) => r.role === "admin")) {
      throw new Error("Cannot ban another admin");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: `${data.durationHours}h`,
    } as Record<string, unknown>);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── unbanUser ─────────────────────────────────────────────────────────
export const unbanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: "none",
    } as Record<string, unknown>);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── deleteUser ────────────────────────────────────────────────────────
// Permanently removes the user from auth.users; cascades to profiles/roles/subs.
export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete yourself");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Safety: refuse to delete another admin
    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((targetRoles ?? []).some((r) => r.role === "admin")) {
      throw new Error("Cannot delete another admin");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── promoteToAdmin ────────────────────────────────────────────────────
export const promoteToAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: "admin" });
    // 23505 = unique_violation → already admin, treat as no-op
    if (error && error.code !== "23505") throw new Error(error.message);
    return { ok: true };
  });

// ─── revokeAdmin ───────────────────────────────────────────────────────
export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot revoke your own admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
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
    await ensureAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("duration_days")
      .eq("code", data.planCode)
      .single();

    if (planError) throw new Error(planError.message);
    if (!plan?.duration_days) throw new Error(`Invalid plan: ${data.planCode}`);

    const now = new Date();
    const currentPeriodEnd = new Date(
      now.getTime() + Number(plan.duration_days) * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: expireError } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("user_id", data.userId)
      .in("status", ["trialing", "active"]);
    if (expireError) throw new Error(expireError.message);

    const { error: insertError } = await supabaseAdmin.from("subscriptions").insert({
      user_id: data.userId,
      plan_code: data.planCode,
      status: "active",
      started_at: now.toISOString(),
      current_period_end: currentPeriodEnd,
    });
    if (insertError) throw new Error(insertError.message);

    return { ok: true };
  });

// ─── cancelUserSubscription ────────────────────────────────────────────
export const cancelUserSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
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
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Start of "today" in Asia/Dhaka, expressed as UTC ISO.
    const now = new Date();
    const dhakaOffsetMs = 6 * 60 * 60 * 1000;
    const dhakaNow = new Date(now.getTime() + dhakaOffsetMs);
    const dhakaMidnight = new Date(
      Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate()),
    );
    const todayStartUtc = new Date(dhakaMidnight.getTime() - dhakaOffsetMs).toISOString();
    const monthStartUtc = new Date(
      Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), 1) - dhakaOffsetMs,
    ).toISOString();

    const [
      { count: totalUsers },
      { count: activeSubs },
      { count: trialingSubs },
      { count: pendingPayments },
      { count: approvedToday },
      { count: rejectedToday },
      { data: revenueAll },
      { data: revenueMonth },
      { count: signupsToday },
      { count: studentCount },
      { count: teacherCount },
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
      supabaseAdmin
        .from("payment_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("reviewed_at", todayStartUtc),
      supabaseAdmin
        .from("payment_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected")
        .gte("reviewed_at", todayStartUtc),
      supabaseAdmin.from("payment_requests").select("amount_bdt").eq("status", "approved"),
      supabaseAdmin
        .from("payment_requests")
        .select("amount_bdt")
        .eq("status", "approved")
        .gte("reviewed_at", monthStartUtc),
      supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStartUtc),
      supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher"),
    ]);

    const sum = (rows: { amount_bdt: number | null }[] | null) =>
      (rows ?? []).reduce((acc, r) => acc + (Number(r.amount_bdt) || 0), 0);

    // AI cost so far this month (from ai_usage_logs)
    const { data: aiMonthRows } = await supabaseAdmin
      .from("ai_usage_logs")
      .select("cost_usd, total_tokens")
      .gte("created_at", monthStartUtc);
    const aiMonthlyCostUsd = (aiMonthRows ?? []).reduce((a, r) => a + (Number(r.cost_usd) || 0), 0);
    const aiMonthlyTokens = (aiMonthRows ?? []).reduce(
      (a, r) => a + (Number(r.total_tokens) || 0),
      0,
    );

    return {
      totalUsers: totalUsers ?? 0,
      activeSubs: activeSubs ?? 0,
      trialingSubs: trialingSubs ?? 0,
      pendingPayments: pendingPayments ?? 0,
      approvedToday: approvedToday ?? 0,
      rejectedToday: rejectedToday ?? 0,
      totalRevenue: sum(revenueAll),
      monthlyRevenue: sum(revenueMonth),
      signupsToday: signupsToday ?? 0,
      studentCount: studentCount ?? 0,
      teacherCount: teacherCount ?? 0,
      aiMonthlyCostUsd,
      aiMonthlyTokens,
    };
  });

// ─── adminAiUsageDaily ─────────────────────────────────────────────────
// Returns daily aggregated AI usage for the last N days (Asia/Dhaka),
// used by the admin dashboard cost chart.
export const adminAiUsageDaily = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<Array<{ date: string; tokens: number; cost_usd: number; requests: number }>> => {
      await ensureAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const days = 14;
      const dhakaOffsetMs = 6 * 60 * 60 * 1000;
      const now = new Date();
      const dhakaNow = new Date(now.getTime() + dhakaOffsetMs);
      const dhakaMidnight = new Date(
        Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate()),
      );
      const startUtc = new Date(
        dhakaMidnight.getTime() - dhakaOffsetMs - (days - 1) * 86_400_000,
      ).toISOString();

      const { data } = await supabaseAdmin
        .from("ai_usage_logs")
        .select("created_at, total_tokens, cost_usd")
        .gte("created_at", startUtc);

      const buckets = new Map<string, { tokens: number; cost_usd: number; requests: number }>();
      // Seed with zeros so gaps still render on the chart.
      for (let i = 0; i < days; i++) {
        const t = new Date(dhakaMidnight.getTime() - (days - 1 - i) * 86_400_000);
        const key = t.toISOString().slice(0, 10);
        buckets.set(key, { tokens: 0, cost_usd: 0, requests: 0 });
      }
      for (const row of data ?? []) {
        const t = new Date(new Date(row.created_at as string).getTime() + dhakaOffsetMs);
        const key = t.toISOString().slice(0, 10);
        const b = buckets.get(key) ?? { tokens: 0, cost_usd: 0, requests: 0 };
        b.tokens += Number(row.total_tokens) || 0;
        b.cost_usd += Number(row.cost_usd) || 0;
        b.requests += 1;
        buckets.set(key, b);
      }
      return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
    },
  );

// ─── adminRevenueDaily ────────────────────────────────────────────────
export const adminRevenueDaily = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<Array<{ date: string; amount_bdt: number; count: number }>> => {
      await ensureAdmin(context.supabase, context.userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const days = 14;
      const dhakaOffsetMs = 6 * 60 * 60 * 1000;
      const now = new Date();
      const dhakaNow = new Date(now.getTime() + dhakaOffsetMs);
      const dhakaMidnight = new Date(
        Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate()),
      );
      const startUtc = new Date(
        dhakaMidnight.getTime() - dhakaOffsetMs - (days - 1) * 86_400_000,
      ).toISOString();

      const { data } = await supabaseAdmin
        .from("payment_requests")
        .select("reviewed_at, amount_bdt")
        .eq("status", "approved")
        .gte("reviewed_at", startUtc);

      const buckets = new Map<string, { amount_bdt: number; count: number }>();
      for (let i = 0; i < days; i++) {
        const t = new Date(dhakaMidnight.getTime() - (days - 1 - i) * 86_400_000);
        buckets.set(t.toISOString().slice(0, 10), { amount_bdt: 0, count: 0 });
      }
      for (const row of data ?? []) {
        if (!row.reviewed_at) continue;
        const t = new Date(new Date(row.reviewed_at as string).getTime() + dhakaOffsetMs);
        const key = t.toISOString().slice(0, 10);
        const b = buckets.get(key) ?? { amount_bdt: 0, count: 0 };
        b.amount_bdt += Number(row.amount_bdt) || 0;
        b.count += 1;
        buckets.set(key, b);
      }
      return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
    },
  );

// ─── getUserProfileDetail ─────────────────────────────────────────────
export interface UserProfileDetail {
  user_id: string;
  email: string | null;
  display_name: string | null;
  school: string | null;
  class: string | null;
  phone: string | null;
  avatar_url: string | null;
  role_selected: boolean;
  created_at: string;
  updated_at: string | null;
  roles: string[];
  last_sign_in_at: string | null;
  banned_until: string | null;
  subscription: {
    plan_code: string;
    status: string;
    started_at: string | null;
    current_period_end: string | null;
    trial_ends_at: string | null;
  } | null;
  payments: Array<{
    id: string;
    amount_bdt: number;
    method: string;
    trx_id: string | null;
    status: string;
    created_at: string;
  }>;
  stats: {
    labsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    testsTaken: number;
    classesCount: number;
    aiMessagesToday: number;
  };
}

export const getUserProfileDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<UserProfileDetail | null> => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const userId = data.userId;

    const now = new Date();
    const dhaka = new Date(now.getTime() + (6 * 60 - now.getTimezoneOffset()) * 60_000);
    const today = dhaka.toISOString().slice(0, 10);

    const [
      { data: profile },
      { data: rolesData },
      { data: subData },
      { data: paymentsData },
      { count: labsCount },
      { data: streakData },
      { count: testsCount },
      { count: teacherClassesCount },
      { count: studentMembershipsCount },
      { data: usageData },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
      supabaseAdmin
        .from("subscriptions")
        .select("plan_code, status, started_at, current_period_end, trial_ends_at")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("payment_requests")
        .select("id, amount_bdt, method, trx_id, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("lab_attempts")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId),
      supabaseAdmin
        .from("streaks")
        .select("current_days, longest_days")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("test_attempts")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId),
      supabaseAdmin
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", userId),
      supabaseAdmin
        .from("class_members")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId),
      supabaseAdmin
        .from("usage_counters")
        .select("ai_messages_used")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle(),
    ]);

    if (!profile) return null;

    let last_sign_in_at: string | null = null;
    let banned_until: string | null = null;
    let authPhone: string | null = null;
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user) {
        last_sign_in_at = authUser.user.last_sign_in_at ?? null;
        banned_until =
          ((authUser.user as unknown as Record<string, unknown>).banned_until as string | null) ??
          null;
        const meta = authUser.user.user_metadata as Record<string, unknown> | undefined;
        authPhone =
          authUser.user.phone ||
          (meta?.phone as string | null) ||
          ((
            (authUser.user as unknown as Record<string, unknown>).raw_user_meta_data as
              | Record<string, unknown>
              | undefined
          )?.phone as string | null) ||
          null;
      }
    } catch {
      /* ignore */
    }

    let finalPhone = (profile.phone as string | null) || authPhone;
    if (!finalPhone && profile.email && profile.email.endsWith("@phone.drchem.local")) {
      const local = profile.email.split("@")[0];
      finalPhone = local.startsWith("88") ? `+${local}` : local;
    }

    const roles = (rolesData ?? []).map((r) => r.role as string);
    const classesCount = roles.includes("teacher")
      ? (teacherClassesCount ?? 0)
      : (studentMembershipsCount ?? 0);

    return {
      user_id: profile.user_id,
      email: profile.email,
      display_name: profile.display_name,
      school: profile.school,
      class: profile.class,
      phone: finalPhone,
      avatar_url: profile.avatar_url,
      role_selected: profile.role_selected,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      roles,
      last_sign_in_at,
      banned_until,
      subscription: subData
        ? {
            plan_code: subData.plan_code,
            status: subData.status,
            started_at: subData.started_at,
            current_period_end: subData.current_period_end,
            trial_ends_at: subData.trial_ends_at,
          }
        : null,
      payments: (paymentsData ?? []).map((p) => ({
        id: p.id,
        amount_bdt: Number(p.amount_bdt) || 0,
        method: p.method,
        trx_id: p.trx_id,
        status: p.status,
        created_at: p.created_at,
      })),
      stats: {
        labsCompleted: labsCount ?? 0,
        currentStreak: streakData?.current_days ?? 0,
        longestStreak: streakData?.longest_days ?? 0,
        testsTaken: testsCount ?? 0,
        classesCount,
        aiMessagesToday: usageData?.ai_messages_used ?? 0,
      },
    };
  });
