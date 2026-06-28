/**
 * React hook for current user's subscription entitlements.
 * Auto-refetches on auth change.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEntitlements, FREE_TIER_LABS, type Entitlements } from "@/lib/subscription.functions";
import { useAuth } from "@/lib/auth-store";

export function useEntitlements() {
  const { isAuthenticated, loading, user } = useAuth();
  const fetcher = useServerFn(getEntitlements);

  const query = useQuery({
    queryKey: ["entitlements", user?.id ?? "anon"],
    queryFn: () => fetcher(),
    enabled: isAuthenticated && !loading,
    staleTime: 60_000,
  });

  const ent: Entitlements | undefined = query.data;

  const isPro =
    !!ent && (ent.status === "trialing" || ent.status === "active") && ent.tier !== "free";

  const canAccessLab = (labId: string): boolean => {
    if (isPro) return true;
    return (FREE_TIER_LABS as readonly string[]).includes(labId);
  };

  const aiMessagesRemaining = ent
    ? ent.aiMessagesPerDay === -1
      ? Infinity
      : Math.max(0, ent.aiMessagesPerDay - ent.aiMessagesUsedToday)
    : 0;

  const trialDaysLeft = ent?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil((new Date(ent.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      )
    : 0;

  return {
    entitlements: ent,
    loading: query.isLoading,
    isPro,
    isTrialing: ent?.status === "trialing",
    trialDaysLeft,
    canAccessLab,
    aiMessagesRemaining,
    refetch: query.refetch,
  };
}
