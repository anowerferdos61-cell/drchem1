/**
 * Subscription system — server functions.
 * All entitlement logic, payment submission, and admin approval lives here.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Types ──────────────────────────────────────────────────────────────
export type PlanCode =
  | "free"
  | "student_monthly"
  | "student_yearly"
  | "teacher_monthly"
  | "teacher_yearly";

export type Tier = "free" | "student" | "teacher";

export interface Entitlements {
  tier: Tier;
  planCode: PlanCode;
  status: "trialing" | "active" | "expired" | "cancelled" | "none";
  trialEndsAt: string | null;
  periodEndsAt: string | null;
  aiMessagesUsedToday: number;
  aiMessagesPerDay: number; // -1 = unlimited
  labsAllowed: number; // -1 = unlimited
  canWriteNotes: boolean;
}

// Labs that are FREE for the Free tier (2 introductory ones).
export const FREE_TIER_LABS = ["ph_scale", "indicator_compare"] as const;

function todayDhaka(): string {
  // YYYY-MM-DD in Asia/Dhaka
  const now = new Date();
  const dhaka = new Date(now.getTime() + (6 * 60 - now.getTimezoneOffset()) * 60_000);
  return dhaka.toISOString().slice(0, 10);
}

// ─── getEntitlements ────────────────────────────────────────────────────
export const getEntitlements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Entitlements> => {
    const { supabase, userId } = context;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_code, status, trial_ends_at, current_period_end")
      .eq("user_id", userId)
      .in("status", ["trialing", "active"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    const planCode = (sub?.plan_code as PlanCode | undefined) ?? "free";

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("tier, features")
      .eq("code", planCode)
      .maybeSingle();

    const features = (plan?.features as Record<string, unknown>) ?? {};
    const tier = (plan?.tier as Tier) ?? "free";

    const today = todayDhaka();
    const { data: usage } = await supabase
      .from("usage_counters")
      .select("ai_messages_used")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .maybeSingle();

    return {
      tier,
      planCode,
      status: (sub?.status as Entitlements["status"]) ?? "none",
      trialEndsAt: sub?.trial_ends_at ?? null,
      periodEndsAt: sub?.current_period_end ?? null,
      aiMessagesUsedToday: usage?.ai_messages_used ?? 0,
      aiMessagesPerDay: (features.ai_messages_per_day as number) ?? 5,
      labsAllowed: (features.labs as number) ?? 2,
      canWriteNotes: Boolean(features.notes_write),
    };
  });

// ─── startTrial ────────────────────────────────────────────────────────
export const startTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        phone: z
          .string()
          .trim()
          .regex(/^01[3-9]\d{8}$/, "Bangladeshi phone number লাগবে (01XXXXXXXXX)"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check if trial already used
    const { data: profile } = await supabase
      .from("profiles")
      .select("trial_used")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.trial_used) {
      throw new Error("আপনি ইতিমধ্যে trial ব্যবহার করেছেন।");
    }

    // Check no active subscription
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["trialing", "active"])
      .maybeSingle();

    if (existing) {
      throw new Error("আপনার একটি active subscription আছে।");
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Update profile: store phone + mark verified + trial_used
    // NOTE: Real SMS OTP verification is a Phase 2 enhancement.
    await supabase
      .from("profiles")
      .update({
        phone: data.phone,
        phone_verified_at: now.toISOString(),
        trial_used: true,
      })
      .eq("user_id", userId);

    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_code: "student_monthly",
      status: "trialing",
      started_at: now.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      current_period_end: trialEnd.toISOString(),
    });

    if (error) throw new Error(error.message);
    return { ok: true, trialEndsAt: trialEnd.toISOString() };
  });

// ─── submitPaymentRequest ──────────────────────────────────────────────
export const submitPaymentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        planCode: z.enum([
          "student_monthly",
          "student_yearly",
          "teacher_monthly",
          "teacher_yearly",
        ]),
        senderPhone: z
          .string()
          .trim()
          .regex(/^01[3-9]\d{8}$/, "Valid bKash number লাগবে"),
        note: z.string().trim().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: plan, error: planErr } = await supabase
      .from("subscription_plans")
      .select("price_bdt")
      .eq("code", data.planCode)
      .maybeSingle();
    if (planErr || !plan) throw new Error("Invalid plan");

    const { data: inserted, error } = await supabase
      .from("payment_requests")
      .insert({
        user_id: userId,
        plan_code: data.planCode,
        amount_bdt: plan.price_bdt,
        method: "bkash",
        sender_phone: data.senderPhone,
        trx_id: null,
        note: data.note ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

// ─── listMyPayments ────────────────────────────────────────────────────
export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("payment_requests")
      .select("id, plan_code, amount_bdt, sender_phone, status, review_note, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });

// ─── ADMIN: listPendingPayments ────────────────────────────────────────
export const listPendingPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data } = await supabase
      .from("payment_requests")
      .select(
        "id, user_id, plan_code, amount_bdt, sender_phone, trx_id, note, status, created_at, reviewed_at, review_note",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    // Hydrate emails via profiles
    const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, email, display_name, phone")
      .in("user_id", userIds);
    const profMap = new Map(
      (profs ?? []).map((p) => [p.user_id as string, p as { email: string; display_name: string; phone: string }]),
    );

    return (data ?? []).map((r) => ({
      ...r,
      user_email: profMap.get(r.user_id)?.email ?? null,
      user_name: profMap.get(r.user_id)?.display_name ?? null,
      user_phone: profMap.get(r.user_id)?.phone ?? null,
    }));
  });

// ─── ADMIN: approvePayment ─────────────────────────────────────────────
export const approvePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ paymentId: z.string().uuid(), note: z.string().max(300).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pr, error: prErr } = await supabaseAdmin
      .from("payment_requests")
      .select("id, user_id, plan_code, status")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (prErr) throw new Error(prErr.message);
    if (!pr) throw new Error("Payment not found");
    if (pr.status !== "pending") throw new Error("ইতিমধ্যে review হয়েছে");

    const { data: plan, error: planErr } = await supabaseAdmin
      .from("subscription_plans")
      .select("duration_days")
      .eq("code", pr.plan_code)
      .maybeSingle();
    if (planErr) throw new Error(planErr.message);
    if (!plan) throw new Error("Invalid plan");

    // Expire any existing active subscription for this user
    const { error: expErr } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("user_id", pr.user_id)
      .in("status", ["trialing", "active"]);
    if (expErr) throw new Error(expErr.message);

    const now = new Date();
    const periodEnd = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    const { error: subErr } = await supabaseAdmin.from("subscriptions").insert({
      user_id: pr.user_id,
      plan_code: pr.plan_code,
      status: "active",
      started_at: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
    if (subErr) throw new Error(subErr.message);

    const { error: updErr } = await supabaseAdmin
      .from("payment_requests")
      .update({
        status: "approved",
        reviewed_by: userId,
        reviewed_at: now.toISOString(),
        review_note: data.note ?? null,
      })
      .eq("id", data.paymentId);
    if (updErr) throw new Error(updErr.message);

    return { ok: true };
  });


// ─── ADMIN: rejectPayment ──────────────────────────────────────────────
export const rejectPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ paymentId: z.string().uuid(), note: z.string().max(300) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payment_requests")
      .update({
        status: "rejected",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_note: data.note,
      })
      .eq("id", data.paymentId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ─── cancelSubscription ────────────────────────────────────────────────
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", userId)
      .in("status", ["trialing", "active"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── incrementAiUsage (called by AI tutor server fns) ──────────────────
export const incrementAiUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const today = todayDhaka();
    const { data, error } = await supabase.rpc("increment_ai_usage", {
      _usage_date: today,
    });
    if (error) throw new Error(error.message);
    return { used: data ?? 0 };
  });

