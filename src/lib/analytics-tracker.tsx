/**
 * Client-side analytics tracker. Wire into the root component so every
 * route change and feature click is captured for the admin analytics panel.
 */
import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics.functions";

const ANON_KEY = "drchem_anon_id";
const SESSION_KEY = "drchem_analytics_session";

function getAnonId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(ANON_KEY);
  if (!id) {
    id =
      (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
      `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

function readSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_KEY);
}

function writeSessionId(id: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_KEY, id);
}

async function send(payload: Parameters<typeof trackEvent>[0]["data"]) {
  try {
    const res = await trackEvent({ data: payload });
    if (res?.sessionId) writeSessionId(res.sessionId);
  } catch {
    // Silently drop analytics errors — never impact UX.
  }
}

export function trackFeature(
  featureKey: string,
  metadata: Record<string, string | number | boolean | null> = {},
) {
  if (typeof window === "undefined") return;
  const anonId = getAnonId();
  void supabase.auth.getUser().then(({ data }) => {
    void send({
      anonId,
      sessionId: readSessionId(),
      userId: data.user?.id ?? null,
      eventType: "feature",
      path: window.location.pathname,
      featureKey,
      metadata,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
    });
  });
}

export function AnalyticsTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const anonId = getAnonId();
    void supabase.auth.getUser().then(({ data }) => {
      void send({
        anonId,
        sessionId: readSessionId(),
        userId: data.user?.id ?? null,
        eventType: "page_view",
        path: pathname,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    });
  }, [pathname]);

  return null;
}
