/**
 * Admin payments approval UI — only visible to users with the 'admin' role.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { DrChemLogo } from "@/components/brand/DrChemLogo";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast, Toaster } from "sonner";
import { CheckCircle2, FlaskConical, Loader2, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-store";
import { approvePayment, listPendingPayments, rejectPayment } from "@/lib/subscription.functions";
import UserMenu from "@/components/auth/UserMenu";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPayments,
  head: () => ({
    meta: [{ title: "Admin · Payments" }, { name: "robots", content: "noindex,nofollow" }],
  }),
});

function AdminPayments() {
  const { isAuthenticated, loading, roles, rolesLoaded } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (loading || !rolesLoaded) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/admin/payments" }, replace: true });
    } else if (!isAdmin) {
      void navigate({ to: "/app", replace: true });
    }
  }, [loading, rolesLoaded, isAuthenticated, isAdmin, navigate]);

  const qc = useQueryClient();
  const listFn = useServerFn(listPendingPayments);
  const approveFn = useServerFn(approvePayment);
  const rejectFn = useServerFn(rejectPayment);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: () => listFn(),
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 30_000,
  });

  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this payment? Subscription সাথে সাথে activate হবে।")) return;
    setBusyId(id);
    try {
      await approveFn({ data: { paymentId: id } });
      toast.success("✅ Payment approved, subscription active");
      void qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const note = rejectNotes[id]?.trim();
    if (!note) {
      toast.error("Rejection reason লিখুন");
      return;
    }
    setBusyId(id);
    try {
      await rejectFn({ data: { paymentId: id, note } });
      toast.success("Payment rejected");
      void qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading || (isAuthenticated && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pending = (payments ?? []).filter((p) => p.status === "pending");
  const reviewed = (payments ?? []).filter((p) => p.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app" className="flex items-center gap-2">
              <DrChemLogo size="sm" showText />
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> ADMIN
            </span>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Payment Approvals</h1>
          <p className="text-muted-foreground text-sm">
            bKash payment requests review করে approve/reject করুন
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && pending.length === 0 && reviewed.length === 0 && (
          <div className="text-center py-16 rounded-xl border bg-card">
            <p className="text-muted-foreground">কোন payment request নেই।</p>
          </div>
        )}

        {pending.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-xs">
                {pending.length}
              </span>
              Pending Review
            </h2>
            <div className="space-y-3 mb-8">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border-2 border-amber-500/30 bg-card p-5 space-y-3"
                >
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">User</div>
                      <div className="font-semibold">
                        {p.user_name ?? "—"}{" "}
                        <span className="text-muted-foreground font-normal">({p.user_email})</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Plan / Amount</div>
                      <div className="font-semibold">
                        {p.plan_code} · ৳{p.amount_bdt}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Sender bKash</div>
                      <div className="font-mono">{p.sender_phone}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="font-semibold capitalize">{p.status}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground">Submitted</div>
                      <div>{new Date(p.created_at).toLocaleString("bn-BD")}</div>
                    </div>
                    {p.note && (
                      <div className="md:col-span-2">
                        <div className="text-xs text-muted-foreground">User Note</div>
                        <div className="italic">{p.note}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    <Input
                      placeholder="Rejection reason (if rejecting)..."
                      value={rejectNotes[p.id] ?? ""}
                      onChange={(e) =>
                        setRejectNotes((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === p.id}
                        onClick={() => handleReject(p.id)}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={busyId === p.id}
                        onClick={() => handleApprove(p.id)}
                      >
                        {busyId === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {reviewed.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Recent Reviewed</h2>
            <div className="space-y-2">
              {reviewed.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50 text-sm"
                >
                  <div className="flex items-center gap-3">
                    {p.status === "approved" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    )}
                    <div>
                      <div>
                        <strong>{p.user_email}</strong> · {p.plan_code} · ৳{p.amount_bdt} · bKash:{" "}
                        <code className="font-mono">{p.sender_phone}</code>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.reviewed_at && new Date(p.reviewed_at).toLocaleString("bn-BD")}
                        {p.review_note && ` · ${p.review_note}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
