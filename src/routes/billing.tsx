/**
 * Billing page — authenticated route.
 * - Shows current subscription
 * - 7-day trial activation (phone)
 * - bKash payment submission form
 * - Payment history
 */
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast, Toaster } from "sonner";
import {
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  FlaskConical,
  Loader2,
  Phone,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-store";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  startTrial,
  submitPaymentRequest,
  listMyPayments,
  cancelSubscription,
} from "@/lib/subscription.functions";
import UserMenu from "@/components/auth/UserMenu";

const BKASH_NUMBER = "01581553923";

const PLAN_INFO: Record<
  string,
  { name: string; price: number; cycle: string }
> = {
  student_monthly: { name: "Student Monthly", price: 99, cycle: "মাসিক" },
  student_yearly: { name: "Student Yearly", price: 999, cycle: "বার্ষিক" },
  teacher_monthly: { name: "Teacher Monthly", price: 499, cycle: "মাসিক" },
  teacher_yearly: { name: "Teacher Yearly", price: 4990, cycle: "বার্ষিক" },
};

export const Route = createFileRoute("/billing")({
  validateSearch: (s: Record<string, unknown>) => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
  }),
  component: BillingPage,
  head: () => ({
    meta: [
      { title: "Billing · Dr. Chem" },
      { name: "description", content: "Dr. Chem subscription billing and payment management." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function BillingPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { plan: preselectedPlan } = useSearch({ from: "/billing" });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/billing" }, replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const { entitlements, isPro, isTrialing, trialDaysLeft, refetch } = useEntitlements();
  const qc = useQueryClient();
  const listMine = useServerFn(listMyPayments);
  const { data: payments } = useQuery({
    queryKey: ["my-payments"],
    queryFn: () => listMine(),
    enabled: isAuthenticated,
  });

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <span className="font-bold">Dr. Chem</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Billing & Subscription</h1>
          <p className="text-muted-foreground">আপনার plan ও payment manage করুন</p>
        </div>

        {/* Current status card */}
        <div className="rounded-2xl border-2 border-primary/30 bg-card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                {isPro ? (
                  <Crown className="h-6 w-6 text-primary-foreground" />
                ) : (
                  <FlaskConical className="h-6 w-6 text-primary-foreground" />
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Current Plan
                </div>
                <h2 className="text-xl font-bold">
                  {entitlements?.tier === "teacher"
                    ? "Teacher Pro"
                    : entitlements?.tier === "student"
                      ? "Student Pro"
                      : "Free"}
                </h2>
              </div>
            </div>
            <StatusBadge entitlements={entitlements} />
          </div>

          {isTrialing && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm mb-3">
              <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                <Sparkles className="h-4 w-4" /> Free Trial চলছে
              </div>
              <p className="text-amber-700/80 dark:text-amber-300/80 mt-1">
                আর {trialDaysLeft} দিন বাকি। Trial শেষ হলে Pro continue করতে bKash payment করুন।
              </p>
            </div>
          )}

          {isPro && entitlements?.periodEndsAt && (
            <p className="text-sm text-muted-foreground">
              পরবর্তী renewal:{" "}
              <strong className="text-foreground">
                {new Date(entitlements.periodEndsAt).toLocaleDateString("bn-BD", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </strong>
            </p>
          )}

          {isPro && entitlements?.status === "active" && (
            <CancelButton
              onCancel={async () => {
                await refetch();
                void qc.invalidateQueries({ queryKey: ["my-payments"] });
              }}
            />
          )}
        </div>

        {/* Trial activation OR Payment form */}
        {!isPro && (
          <TrialOrPay
            preselectedPlan={preselectedPlan}
            onSuccess={async () => {
              await refetch();
              void qc.invalidateQueries({ queryKey: ["my-payments"] });
            }}
          />
        )}

        {/* Payment history */}
        {payments && payments.length > 0 && (
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Payment History
            </h3>
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {PLAN_INFO[p.plan_code]?.name ?? p.plan_code} · ৳{p.amount_bdt}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      TrxID: {p.trx_id} · {new Date(p.created_at).toLocaleString("bn-BD")}
                    </div>
                    {p.review_note && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Note: {p.review_note}
                      </div>
                    )}
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ entitlements }: { entitlements: ReturnType<typeof useEntitlements>["entitlements"] }) {
  if (!entitlements) return null;
  const styles =
    entitlements.status === "active"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : entitlements.status === "trialing"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "bg-muted text-muted-foreground";
  const label =
    entitlements.status === "active"
      ? "Active"
      : entitlements.status === "trialing"
        ? "Trial"
        : entitlements.status === "expired"
          ? "Expired"
          : "Free";
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles}`}>{label}</span>;
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; Icon: typeof CheckCircle2 }> = {
    pending: {
      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      label: "Pending",
      Icon: Clock,
    },
    approved: {
      cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      label: "Approved",
      Icon: CheckCircle2,
    },
    rejected: {
      cls: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
      label: "Rejected",
      Icon: XCircle,
    },
  };
  const v = map[status] ?? map.pending;
  const I = v.Icon;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${v.cls}`}>
      <I className="h-3 w-3" /> {v.label}
    </span>
  );
}

/* ─────────── Trial OR Payment form ─────────── */

type Tab = "trial" | "pay";

function TrialOrPay({
  preselectedPlan,
  onSuccess,
}: {
  preselectedPlan: string | undefined;
  onSuccess: () => void | Promise<void>;
}) {
  const { entitlements } = useEntitlements();
  const trialUsed = !!entitlements && entitlements.status === "expired";
  const [tab, setTab] = useState<Tab>(preselectedPlan ? "pay" : trialUsed ? "pay" : "trial");

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="grid grid-cols-2 border-b">
        <button
          onClick={() => setTab("trial")}
          disabled={trialUsed}
          className={`p-3 text-sm font-medium transition-colors ${
            tab === "trial"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          🎁 ৭ দিন ফ্রি Trial
        </button>
        <button
          onClick={() => setTab("pay")}
          className={`p-3 text-sm font-medium transition-colors ${
            tab === "pay" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          💳 bKash দিয়ে Pay
        </button>
      </div>
      {tab === "trial" ? (
        <TrialForm onSuccess={onSuccess} />
      ) : (
        <PaymentForm preselectedPlan={preselectedPlan} onSuccess={onSuccess} />
      )}
    </div>
  );
}

function TrialForm({ onSuccess }: { onSuccess: () => void | Promise<void> }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const startTrialFn = useServerFn(startTrial);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await startTrialFn({ data: { phone } });
      toast.success("🎉 ৭ দিনের trial activate হয়ে গেছে!");
      await onSuccess();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Phone verify করে শুরু করুন
        </h3>
        <p className="text-sm text-muted-foreground">
          ৭ দিন full Pro access — কার্ড বা bKash কিছুই লাগবে না।
        </p>
      </div>
      <div>
        <Label htmlFor="trial-phone">আপনার মোবাইল নম্বর</Label>
        <div className="relative mt-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="trial-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="pl-9"
            maxLength={11}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          ⚠️ Trial প্রতি account এ একবার পাওয়া যাবে।
        </p>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "🎁 Trial Activate করো"}
      </Button>
    </form>
  );
}

function PaymentForm({
  preselectedPlan,
  onSuccess,
}: {
  preselectedPlan: string | undefined;
  onSuccess: () => void | Promise<void>;
}) {
  const validPlan =
    preselectedPlan && preselectedPlan in PLAN_INFO ? preselectedPlan : "student_monthly";
  const [plan, setPlan] = useState(validPlan);
  const [senderPhone, setSenderPhone] = useState("");
  const [trxId, setTrxId] = useState("");
  const [busy, setBusy] = useState(false);
  const submitFn = useServerFn(submitPaymentRequest);

  const info = PLAN_INFO[plan];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await submitFn({
        data: {
          planCode: plan as "student_monthly" | "student_yearly" | "teacher_monthly" | "teacher_yearly",
          senderPhone,
          trxId,
        },
      });
      toast.success("✅ Payment submit হয়েছে! ২৪ ঘন্টার মধ্যে approve হবে।");
      setTrxId("");
      setSenderPhone("");
      await onSuccess();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyBkash = async () => {
    try {
      await navigator.clipboard.writeText(BKASH_NUMBER);
      toast.success("bKash number copy হয়েছে");
    } catch {
      /* noop */
    }
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-5">
      <div>
        <Label>Plan নির্বাচন করুন</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(PLAN_INFO).map(([code, p]) => (
            <button
              key={code}
              type="button"
              onClick={() => setPlan(code)}
              className={`text-left p-3 rounded-lg border-2 transition-colors ${
                plan === code ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="text-xs text-muted-foreground">{p.cycle}</div>
              <div className="font-semibold text-sm">{p.name}</div>
              <div className="text-lg font-bold mt-1">৳{p.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* bKash instructions */}
      <div className="rounded-xl bg-pink-500/5 border border-pink-500/20 p-4">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <span className="text-pink-600">📱</span> bKash এ পাঠান
        </h4>
        <ol className="text-sm space-y-2 mb-3">
          <li>
            <strong>১.</strong> bKash app খুলে "Send Money" তে যান
          </li>
          <li>
            <strong>২.</strong> এই number এ পাঠান:
            <div className="flex items-center gap-2 mt-1 p-2 rounded bg-background border">
              <code className="font-mono text-base font-bold tracking-wider flex-1">
                {BKASH_NUMBER}
              </code>
              <Button type="button" variant="ghost" size="sm" onClick={copyBkash}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
          <li>
            <strong>৩.</strong> Amount:{" "}
            <strong className="text-base">৳{info.price}</strong> (Reference: "DrChem")
          </li>
          <li>
            <strong>৪.</strong> Success message থেকে TrxID copy করে নিচে দিন
          </li>
        </ol>
      </div>

      <div>
        <Label htmlFor="sender-phone">আপনার bKash নম্বর (যেটা থেকে পাঠালেন)</Label>
        <Input
          id="sender-phone"
          type="tel"
          required
          value={senderPhone}
          onChange={(e) => setSenderPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          maxLength={11}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="trx-id">Transaction ID (TrxID)</Label>
        <Input
          id="trx-id"
          required
          value={trxId}
          onChange={(e) => setTrxId(e.target.value.trim().toUpperCase())}
          placeholder="যেমন: 8N7K9P2Q3M"
          className="mt-1 font-mono"
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground mt-1">
          ⚠️ TrxID ভুল হলে approve হবে না।
        </p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            ৳{info.price} এর Payment Submit করো
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Admin payment verify করে ২৪ ঘন্টার মধ্যে activate করবেন।
      </p>
    </form>
  );
}

function CancelButton({ onCancel }: { onCancel: () => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const cancelFn = useServerFn(cancelSubscription);
  const handle = async () => {
    if (!confirm("আপনি কি subscription cancel করতে চান? Current period শেষ হলে Free tier এ চলে যাবেন।"))
      return;
    setBusy(true);
    try {
      await cancelFn();
      toast.success("Subscription cancelled");
      await onCancel();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      onClick={handle}
      disabled={busy}
      className="mt-4 text-xs text-muted-foreground hover:text-rose-500 transition-colors"
    >
      {busy ? "Cancelling..." : "Subscription Cancel করো"}
    </button>
  );
}
