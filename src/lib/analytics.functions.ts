/**
 * Analytics tracking + admin query server functions.
 *
 * Writes (track, heartbeat) are unauthenticated so anonymous visitors are
 * captured. Reads are gated behind the admin role.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

// ─── Tracking (public) ──────────────────────────────────────────────────

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((data: {
    anonId: string;
    sessionId?: string | null;
    userId?: string | null;
    eventType: "page_view" | "feature";
    path?: string | null;
    featureKey?: string | null;
    referrer?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, string | number | boolean | null>;
  }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let sessionId = data.sessionId ?? null;

    // Reuse session if id is valid and less than 30 minutes idle. Otherwise
    // create a new session row.
    if (sessionId) {
      const { data: existing } = await supabaseAdmin
        .from("analytics_sessions")
        .select("id, started_at, last_seen_at")
        .eq("id", sessionId)
        .maybeSingle();
      if (!existing) {
        sessionId = null;
      } else {
        const idleMs = Date.now() - new Date(existing.last_seen_at as string).getTime();
        if (idleMs > 30 * 60 * 1000) sessionId = null;
      }
    }

    if (!sessionId) {
      const { data: created, error } = await supabaseAdmin
        .from("analytics_sessions")
        .insert({
          anon_id: data.anonId,
          user_id: data.userId ?? null,
          entry_path: data.path ?? null,
          referrer: data.referrer ?? null,
          user_agent: data.userAgent ?? null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      sessionId = created!.id as string;
    }

    // Insert event
    await supabaseAdmin.from("analytics_events").insert({
      session_id: sessionId,
      user_id: data.userId ?? null,
      event_type: data.eventType,
      path: data.path ?? null,
      feature_key: data.featureKey ?? null,
      metadata: (data.metadata ?? {}) as never,
    });

    // Update session counters + last_seen + duration
    const { data: sess } = await supabaseAdmin
      .from("analytics_sessions")
      .select("started_at, page_views, event_count")
      .eq("id", sessionId)
      .single();
    if (sess) {
      const now = new Date();
      const duration = Math.max(
        0,
        Math.floor((now.getTime() - new Date(sess.started_at as string).getTime()) / 1000),
      );
      await supabaseAdmin
        .from("analytics_sessions")
        .update({
          last_seen_at: now.toISOString(),
          duration_seconds: duration,
          page_views:
            data.eventType === "page_view"
              ? (sess.page_views as number) + 1
              : (sess.page_views as number),
          event_count: (sess.event_count as number) + 1,
          user_id: data.userId ?? undefined,
        })
        .eq("id", sessionId);
    }

    return { sessionId };
  });

// ─── Admin queries ──────────────────────────────────────────────────────

export interface AnalyticsOverview {
  visitorsToday: number;
  sessionsToday: number;
  pageViewsToday: number;
  activeNow: number;
  visitors28d: number;
  daily: { date: string; visitors: number; sessions: number; page_views: number }[];
  topPages: { path: string; views: number }[];
  topFeatures: { feature: string; count: number }[];
}

export const getAnalyticsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsOverview> => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const start28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();
    const activeCutoff = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const [sessions28Res, todaySessionsRes, todayEventsRes, activeRes, topPagesRes, topFeatRes] =
      await Promise.all([
        supabaseAdmin
          .from("analytics_sessions")
          .select("id, anon_id, started_at")
          .gte("started_at", start28)
          .limit(50000),
        supabaseAdmin
          .from("analytics_sessions")
          .select("id, anon_id")
          .gte("started_at", startToday),
        supabaseAdmin
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "page_view")
          .gte("created_at", startToday),
        supabaseAdmin
          .from("analytics_sessions")
          .select("id", { count: "exact", head: true })
          .gte("last_seen_at", activeCutoff),
        supabaseAdmin
          .from("analytics_events")
          .select("path")
          .eq("event_type", "page_view")
          .gte("created_at", start28)
          .not("path", "is", null)
          .limit(50000),
        supabaseAdmin
          .from("analytics_events")
          .select("feature_key")
          .eq("event_type", "feature")
          .gte("created_at", start28)
          .not("feature_key", "is", null)
          .limit(50000),
      ]);

    const sessions28 = sessions28Res.data ?? [];
    const todaySessions = todaySessionsRes.data ?? [];

    // Daily bucket by yyyy-mm-dd
    const dailyMap = new Map<string, { visitors: Set<string>; sessions: number; page_views: number }>();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { visitors: new Set(), sessions: 0, page_views: 0 });
    }
    for (const s of sessions28) {
      const key = (s.started_at as string).slice(0, 10);
      const b = dailyMap.get(key);
      if (b) {
        b.visitors.add(s.anon_id as string);
        b.sessions += 1;
      }
    }

    // Page views per day: run one aggregate query per bucket would be expensive; use events with created_at
    const { data: pvEvents } = await supabaseAdmin
      .from("analytics_events")
      .select("created_at")
      .eq("event_type", "page_view")
      .gte("created_at", start28)
      .limit(100000);
    for (const e of pvEvents ?? []) {
      const key = (e.created_at as string).slice(0, 10);
      const b = dailyMap.get(key);
      if (b) b.page_views += 1;
    }

    const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date,
      visitors: v.visitors.size,
      sessions: v.sessions,
      page_views: v.page_views,
    }));

    // Top pages
    const pageCount = new Map<string, number>();
    for (const e of topPagesRes.data ?? []) {
      const p = e.path as string;
      pageCount.set(p, (pageCount.get(p) ?? 0) + 1);
    }
    const topPages = Array.from(pageCount.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top features
    const featCount = new Map<string, number>();
    for (const e of topFeatRes.data ?? []) {
      const f = e.feature_key as string;
      featCount.set(f, (featCount.get(f) ?? 0) + 1);
    }
    const topFeatures = Array.from(featCount.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const visitorsTodaySet = new Set<string>();
    for (const s of todaySessions) visitorsTodaySet.add(s.anon_id as string);
    const visitors28Set = new Set<string>();
    for (const s of sessions28) visitors28Set.add(s.anon_id as string);

    return {
      visitorsToday: visitorsTodaySet.size,
      sessionsToday: todaySessions.length,
      pageViewsToday: todayEventsRes.count ?? 0,
      activeNow: activeRes.count ?? 0,
      visitors28d: visitors28Set.size,
      daily,
      topPages,
      topFeatures,
    };
  });

export interface RecentSessionRow {
  id: string;
  anon_id: string;
  user_id: string | null;
  email: string | null;
  display_name: string | null;
  started_at: string;
  last_seen_at: string;
  duration_seconds: number;
  page_views: number;
  event_count: number;
  entry_path: string | null;
  referrer: string | null;
  user_agent: string | null;
}

export const getRecentSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number } | undefined) => data ?? {})
  .handler(async ({ context, data }): Promise<RecentSessionRow[]> => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const limit = Math.min(data.limit ?? 100, 500);
    const { data: rows, error } = await supabaseAdmin
      .from("analytics_sessions")
      .select(
        "id, anon_id, user_id, started_at, last_seen_at, duration_seconds, page_views, event_count, entry_path, referrer, user_agent",
      )
      .order("last_seen_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);

    // Hydrate profile info
    const userIds = Array.from(
      new Set((rows ?? []).map((r) => r.user_id).filter((x): x is string => !!x)),
    );
    const profileMap = new Map<string, { email: string | null; display_name: string | null }>();
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", userIds);
      for (const p of profs ?? []) {
        profileMap.set(p.user_id as string, {
          email: (p.email as string) ?? null,
          display_name: (p.display_name as string) ?? null,
        });
      }
    }

    return (rows ?? []).map((r) => ({
      id: r.id as string,
      anon_id: r.anon_id as string,
      user_id: (r.user_id as string) ?? null,
      email: r.user_id ? profileMap.get(r.user_id as string)?.email ?? null : null,
      display_name: r.user_id
        ? profileMap.get(r.user_id as string)?.display_name ?? null
        : null,
      started_at: r.started_at as string,
      last_seen_at: r.last_seen_at as string,
      duration_seconds: r.duration_seconds as number,
      page_views: r.page_views as number,
      event_count: r.event_count as number,
      entry_path: (r.entry_path as string) ?? null,
      referrer: (r.referrer as string) ?? null,
      user_agent: (r.user_agent as string) ?? null,
    }));
  });

export interface SessionTimelineEvent {
  id: string;
  event_type: string;
  path: string | null;
  feature_key: string | null;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
}

export const getSessionTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ context, data }): Promise<SessionTimelineEvent[]> => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("analytics_events")
      .select("id, event_type, path, feature_key, metadata, created_at")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);

    return (rows ?? []).map((r) => ({
      id: r.id as string,
      event_type: r.event_type as string,
      path: (r.path as string) ?? null,
      feature_key: (r.feature_key as string) ?? null,
      metadata: (r.metadata as Record<string, string | number | boolean | null>) ?? {},
      created_at: r.created_at as string,
    }));
  });
