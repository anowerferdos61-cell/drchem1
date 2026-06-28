/**
 * Yellow banner shown on the dashboard when the user has a pending
 * (unreviewed) bKash payment request. Hides Upgrade CTA implicitly by
 * communicating "approval in progress".
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock } from "lucide-react";

import { listMyPayments } from "@/lib/subscription.functions";
import { useAuth } from "@/lib/auth-store";
import { useEntitlements } from "@/hooks/useEntitlements";

export function PendingPaymentBanner() {
  const { isAuthenticated } = useAuth();
  const { isPro } = useEntitlements();
  const fetcher = useServerFn(listMyPayments);

  const { data } = useQuery({
    queryKey: ["my-payments", "banner"],
    queryFn: () => fetcher(),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (isPro) return null;
  const pending = (data ?? []).find((p) => p.status === "pending");
  if (!pending) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6">
      <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-amber-800 dark:text-amber-200">
            Payment Verification Pending
          </div>
          <p className="text-sm text-amber-800/90 dark:text-amber-200/90 mt-0.5">
            আপনার <strong>৳{pending.amount_bdt}</strong> এর payment request (TrxID:{" "}
            <code className="font-mono">{pending.trx_id}</code>) submit হয়েছে। Admin verify
            করছেন — সাধারণত কয়েক ঘন্টার মধ্যে approve হয়ে যায়।
          </p>
        </div>
      </div>
    </div>
  );
}
