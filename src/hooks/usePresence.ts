/**
 * Realtime presence tracking via Supabase channel "app-presence".
 *
 * - usePresenceTracker(location): call from any authenticated user page
 *   (e.g. lab, tutor). Broadcasts the current user's presence + location.
 * - useActiveUserCount(): admin-only observer that returns
 *   { total, byLocation } from the same channel's presence state.
 *
 * The channel key is the auth user id; each mount replaces prior presence
 * for that user, so the same account open in two tabs still counts as 1.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";

const CHANNEL = "app-presence";

export function usePresenceTracker(location: string) {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const channel = supabase.channel(CHANNEL, {
      config: { presence: { key: user.id } },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          await channel.track({
            userId: user.id,
            location,
            ts: Date.now(),
          });
        } catch (e) {
          console.error("presence track failed", e);
        }
      }
    });

    return () => {
      try {
        void channel.untrack();
      } catch {
        /* noop */
      }
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, location]);
}

export interface ActiveUserCount {
  total: number;
  byLocation: Record<string, number>;
}

export function useActiveUserCount(enabled: boolean): ActiveUserCount {
  const [state, setState] = useState<ActiveUserCount>({
    total: 0,
    byLocation: {},
  });

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase.channel(CHANNEL);

    const recompute = () => {
      const raw = channel.presenceState() as Record<
        string,
        Array<{ userId?: string; location?: string }>
      >;
      const byLoc: Record<string, number> = {};
      let total = 0;
      for (const key of Object.keys(raw)) {
        const entries = raw[key];
        if (!entries || entries.length === 0) continue;
        total += 1;
        const loc = entries[0].location ?? "unknown";
        byLoc[loc] = (byLoc[loc] ?? 0) + 1;
      }
      setState({ total, byLocation: byLoc });
    };

    channel
      .on("presence", { event: "sync" }, recompute)
      .on("presence", { event: "join" }, recompute)
      .on("presence", { event: "leave" }, recompute)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  return state;
}
