/**
 * Admin Dashboard — Users, Subscriptions, Stats.
 * Only accessible to users with the 'admin' role.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast, Toaster } from "sonner";
import {
  CheckCircle2,
  FlaskConical,
  Loader2,
  Search,
  ShieldCheck,
  Users as UsersIcon,
  CreditCard,
  Sparkles,
  AlertCircle,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-store";
import UserMenu from "@/components/auth/UserMenu";
import {
  adminStats,
  cancelUserSubscription,
  grantSubscription,
  listAllUsers,
  type AdminUserRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  head: () => ({
    meta: [
      { title: "Admin Dashboard · Dr. Chem" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const PLAN_OPTIONS = [
  { code: "student_monthly", label: "Student · Monthly (৳99)" },
  { code: "student_yearly", label: "Student · Yearly (৳999)" },
  { code: "teacher_monthly", label: "Teacher · Monthly (৳299)" },
  { code: "teacher_yearly", label: "Teacher · Yearly (৳1290)" },
] as const;

function StatusBadge({ status }: { status: string | undefined }) {
  if (!status || status === "none")
    return <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Free</span>;
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    trialing: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    expired: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
    cancelled: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

function AdminDashboard() {
  const { isAuthenticated, loading, roles } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/admin" }, replace: true });
    } else if (!isAdmin) {
      void navigate({ to: "/app", replace: true });
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  const qc = useQueryClient();
  const usersFn = useServerFn(listAllUsers);
  const statsFn = useServerFn(adminStats);
  const grantFn = useServerFn(grantSubscription);
  const cancelFn = useServerFn(cancelUserSubscription);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => usersFn(),
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 60_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => statsFn(),
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 60_000,
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "teacher" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "trialing" | "free" | "expired"
  >("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && !u.roles.includes(roleFilter)) return false;
      const subStatus = u.subscription?.status ?? "free";
      if (statusFilter !== "all") {
        if (statusFilter === "free" && u.subscription) return false;
        if (statusFilter !== "free" && subStatus !== statusFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.display_name ?? "").toLowerCase().includes(q) ||
          (u.phone ?? "").includes(q)
        );
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const [grantTarget, setGrantTarget] = useState<AdminUserRow | null>(null);
  const [grantPlan, setGrantPlan] = useState<(typeof PLAN_OPTIONS)[number]["code"]>(
    "student_monthly",
  );
  const [busy, setBusy] = useState(false);

  const doGrant = async () => {
    if (!grantTarget) return;
    setBusy(true);
    try {
      await grantFn({ data: { userId: grantTarget.user_id, planCode: grantPlan } });
      toast.success(`✅ ${grantTarget.email} এর জন্য Pro activated`);
      setGrantTarget(null);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async (u: AdminUserRow) => {
    if (!confirm(`Cancel subscription for ${u.email}?`)) return;
    try {
      await cancelFn({ data: { userId: u.user_id } });
      toast.success("Subscription cancelled");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (loading || (isAuthenticated && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app" className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <span className="font-bold">Dr. Chem</span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> ADMIN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/payments">
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4" /> Payments
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Users, subscriptions, and platform overview
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={UsersIcon} label="Total Users" value={stats?.totalUsers} tint="primary" />
          <StatCard
            icon={CheckCircle2}
            label="Active Subs"
            value={stats?.activeSubs}
            tint="emerald"
          />
          <StatCard
            icon={Sparkles}
            label="On Trial"
            value={stats?.trialingSubs}
            tint="amber"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Payments"
            value={stats?.pendingPayments}
            tint="rose"
            link="/admin/payments"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name / email / phone…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="md:w-44">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Subscription" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Subscription</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-left px-4 py-3">Last login</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading && (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary inline" />
                    </td>
                  </tr>
                )}
                {!usersLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      কোন user পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.user_id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.display_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      {u.phone && (
                        <div className="text-xs text-muted-foreground font-mono">{u.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              r === "admin"
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                : r === "teacher"
                                  ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400"
                                  : "bg-sky-500/15 text-sky-700 dark:text-sky-400"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.subscription?.status} />
                      {u.subscription && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {u.subscription.plan_code}
                          {u.subscription.current_period_end && (
                            <> · till {new Date(u.subscription.current_period_end).toLocaleDateString("bn-BD")}</>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleString("bn-BD")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGrantTarget(u);
                            setGrantPlan("student_monthly");
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Grant Pro
                        </Button>
                        {u.subscription &&
                          (u.subscription.status === "active" ||
                            u.subscription.status === "trialing") && (
                            <Button variant="ghost" size="sm" onClick={() => doCancel(u)}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grant Pro modal */}
      <Dialog open={!!grantTarget} onOpenChange={(o) => !o && setGrantTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Pro Subscription</DialogTitle>
            <DialogDescription>
              {grantTarget?.email} এর জন্য paid plan activate করুন। বর্তমান plan থাকলে replace
              হবে।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Plan</label>
              <Select
                value={grantPlan}
                onValueChange={(v) => setGrantPlan(v as typeof grantPlan)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={doGrant} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
  link,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  tint: "primary" | "emerald" | "amber" | "rose";
  link?: string;
}) {
  const tintMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/15 text-emerald-600",
    amber: "bg-amber-500/15 text-amber-600",
    rose: "bg-rose-500/15 text-rose-600",
  };
  const inner = (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tintMap[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none">{value ?? "—"}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}
