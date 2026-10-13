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
  TrendingUp,
  Calendar,
  UserPlus,
  GraduationCap,
  Bot,
  Radio,
  Cpu,
  Ban,
  Undo2,
  Trash2,
  ShieldPlus,
  ShieldMinus,
  Eye,
  Phone,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
import { useActiveUserCount } from "@/hooks/usePresence";
import UserMenu from "@/components/auth/UserMenu";
import { UserProfileModal } from "@/components/admin/UserProfileModal";
import {
  adminAiUsageDaily,
  adminRevenueDaily,
  adminStats,
  banUser,
  cancelUserSubscription,
  deleteUser,
  grantSubscription,
  listAllUsers,
  promoteToAdmin,
  revokeAdmin,
  unbanUser,
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
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Free</span>
    );
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
  const { isAuthenticated, loading, roles, rolesLoaded, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (loading || !rolesLoaded) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/admin" }, replace: true });
      return;
    }
    if (!isAdmin) {
      void navigate({ to: "/app", replace: true });
    }
  }, [loading, rolesLoaded, isAuthenticated, isAdmin, navigate]);

  const qc = useQueryClient();
  const usersFn = useServerFn(listAllUsers);
  const statsFn = useServerFn(adminStats);
  const grantFn = useServerFn(grantSubscription);
  const cancelFn = useServerFn(cancelUserSubscription);
  const banFn = useServerFn(banUser);
  const unbanFn = useServerFn(unbanUser);
  const deleteFn = useServerFn(deleteUser);
  const promoteFn = useServerFn(promoteToAdmin);
  const revokeFn = useServerFn(revokeAdmin);
  const aiDailyFn = useServerFn(adminAiUsageDaily);
  const revenueDailyFn = useServerFn(adminRevenueDaily);

  const active = useActiveUserCount(isAuthenticated && rolesLoaded && isAdmin);

  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => usersFn(),
    enabled: isAuthenticated && rolesLoaded && isAdmin,
    refetchInterval: 60_000,
    retry: 1,
  });

  const { data: stats, error: statsError } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => statsFn(),
    enabled: isAuthenticated && rolesLoaded && isAdmin,
    refetchInterval: 60_000,
    retry: 1,
  });

  const { data: aiDaily = [] } = useQuery({
    queryKey: ["admin", "ai-daily"],
    queryFn: () => aiDailyFn(),
    enabled: isAuthenticated && rolesLoaded && isAdmin,
    refetchInterval: 120_000,
    retry: 1,
  });

  const { data: revenueDaily = [] } = useQuery({
    queryKey: ["admin", "revenue-daily"],
    queryFn: () => revenueDailyFn(),
    enabled: isAuthenticated && rolesLoaded && isAdmin,
    refetchInterval: 120_000,
    retry: 1,
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
          (u.phone ?? "").includes(q) ||
          (u.school ?? "").toLowerCase().includes(q) ||
          (u.class ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null);
  const [grantTarget, setGrantTarget] = useState<AdminUserRow | null>(null);
  const [grantPlan, setGrantPlan] =
    useState<(typeof PLAN_OPTIONS)[number]["code"]>("student_monthly");
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

  const doBan = async (u: AdminUserRow) => {
    const input = prompt(
      `Ban ${u.email} — কত ঘণ্টা?\n\n24 = 1 day, 168 = 7 days, 720 = 30 days.\nখালি রেখে OK দিলে permanent ban হবে।`,
      "",
    );
    if (input === null) return;
    const hours = input.trim() === "" ? 876000 : Number(input.trim());
    if (!Number.isFinite(hours) || hours <= 0) {
      toast.error("Invalid hours");
      return;
    }
    try {
      await banFn({ data: { userId: u.user_id, durationHours: Math.floor(hours) } });
      toast.success(`🚫 ${u.email} banned`);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const doUnban = async (u: AdminUserRow) => {
    try {
      await unbanFn({ data: { userId: u.user_id } });
      toast.success(`✅ ${u.email} unbanned`);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const doDelete = async (u: AdminUserRow) => {
    const confirmText = prompt(
      `⚠️ PERMANENTLY delete ${u.email}?\n\nএটা undo করা যাবে না। কনফার্ম করতে "DELETE" টাইপ করুন।`,
    );
    if (confirmText !== "DELETE") return;
    try {
      await deleteFn({ data: { userId: u.user_id } });
      toast.success(`🗑️ ${u.email} deleted`);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const doPromote = async (u: AdminUserRow) => {
    if (!confirm(`Make ${u.email} an ADMIN?\n\nএই ইউজার full admin access পাবে।`)) return;
    try {
      await promoteFn({ data: { userId: u.user_id } });
      toast.success(`🛡️ ${u.email} is now an admin`);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const doRevoke = async (u: AdminUserRow) => {
    if (!confirm(`Revoke admin role from ${u.email}?`)) return;
    try {
      await revokeFn({ data: { userId: u.user_id } });
      toast.success(`Admin role revoked from ${u.email}`);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (loading || !rolesLoaded || (isAuthenticated && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const fatalError = (usersError ?? statsError) as Error | undefined;
  if (fatalError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-600 font-semibold">
            <AlertCircle className="h-5 w-5" /> Admin data load failed
          </div>
          <p className="text-sm text-muted-foreground break-words">
            {fatalError.message || "Unknown error"}
          </p>
          <Button
            size="sm"
            onClick={() => {
              void qc.invalidateQueries({ queryKey: ["admin"] });
            }}
          >
            Retry
          </Button>
        </div>
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
            <Link to="/admin/analytics">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4" /> Analytics
              </Button>
            </Link>
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Command Center</h1>
            <p className="text-muted-foreground text-sm">
              Live overview — users, revenue, AI cost, activity
            </p>
          </div>
          <LiveActivePill active={active} />
        </div>

        {/* Top KPI row — the "at-a-glance" strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={UsersIcon} label="Total Users" value={stats?.totalUsers} tint="primary" />
          <StatCard
            icon={UserPlus}
            label="New Signups Today"
            value={stats?.signupsToday}
            tint="emerald"
          />
          <StatCard
            icon={CheckCircle2}
            label="Active Subs"
            value={stats?.activeSubs}
            tint="emerald"
          />
          <StatCard
            icon={Calendar}
            label="This Month Revenue"
            value={stats?.monthlyRevenue}
            tint="amber"
            prefix="৳"
          />
        </div>

        {/* Second KPI row — roles + AI budget + pending payments */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={GraduationCap}
            label="Students"
            value={stats?.studentCount}
            tint="primary"
          />
          <StatCard
            icon={GraduationCap}
            label="Teachers"
            value={stats?.teacherCount}
            tint="primary"
          />
          <StatCard
            icon={Bot}
            label="AI Cost (this month)"
            value={stats?.aiMonthlyCostUsd}
            tint="rose"
            prefix="$"
            fraction={4}
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Payments"
            value={stats?.pendingPayments}
            tint="rose"
            link="/admin/payments"
          />
        </div>

        {/* Charts row: Revenue + AI cost, 14-day trailing */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Revenue (৳) — last 14 days"
            subtitle={`Total: ৳${(stats?.totalRevenue ?? 0).toLocaleString("bn-BD")}`}
            icon={TrendingUp}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueDaily}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  formatter={(v: number) => [`৳${Number(v).toLocaleString("bn-BD")}`, "Revenue"]}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="amount_bdt" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="AI cost ($) — last 14 days"
            subtitle={`Tokens this month: ${(stats?.aiMonthlyTokens ?? 0).toLocaleString("en-US")}`}
            icon={Cpu}
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={aiDaily}>
                <defs>
                  <linearGradient id="aicost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v: number) => `$${v.toFixed(3)}`} />
                <Tooltip
                  formatter={(v: number, name) => {
                    if (name === "cost_usd") return [`$${Number(v).toFixed(4)}`, "Cost"];
                    return [v, name];
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cost_usd"
                  stroke="hsl(var(--destructive))"
                  fill="url(#aicost)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Payments-today mini row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={CheckCircle2}
            label="Approved Today"
            value={stats?.approvedToday}
            tint="emerald"
          />
          <StatCard
            icon={XCircle}
            label="Rejected Today"
            value={stats?.rejectedToday}
            tint="rose"
          />
          <StatCard icon={Sparkles} label="On Trial" value={stats?.trialingSubs} tint="amber" />
          <StatCard
            icon={TrendingUp}
            label="Total Revenue"
            value={stats?.totalRevenue}
            tint="primary"
            prefix="৳"
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
                  <th className="text-left px-4 py-3">Phone / মোবাইল</th>
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
                    <td colSpan={7} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary inline" />
                    </td>
                  </tr>
                )}
                {!usersLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      কোন user পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.user_id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setViewProfileUserId(u.user_id)}
                        className="text-left group cursor-pointer focus:outline-none"
                      >
                        <div className="font-medium flex items-center gap-1.5 group-hover:text-primary transition-colors">
                          {u.display_name ?? "—"}
                          {u.banned_until && new Date(u.banned_until).getTime() > Date.now() && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold">
                              BANNED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email && !u.email.endsWith("@phone.drchem.local")
                            ? u.email
                            : "ইমেইল নেই"}
                        </div>
                        {(u.school || u.class) && (
                          <div className="text-[11px] text-muted-foreground/90 flex items-center gap-1 mt-0.5">
                            {u.school && <span>🏫 {u.school}</span>}
                            {u.school && u.class && <span>·</span>}
                            {u.class && <span>Class {u.class}</span>}
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {u.phone ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic font-sans">—</span>
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
                            <>
                              {" "}
                              · till{" "}
                              {new Date(u.subscription.current_period_end).toLocaleDateString(
                                "bn-BD",
                              )}
                            </>
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
                      {(() => {
                        const isBanned =
                          !!u.banned_until && new Date(u.banned_until).getTime() > Date.now();
                        const isAdminRow = u.roles.includes("admin");
                        const isSelf = u.user_id === user?.id;
                        return (
                          <div className="flex gap-1 justify-end flex-wrap">
                            <Button
                              variant="secondary"
                              size="sm"
                              title="সম্পূর্ণ প্রোফাইল দেখুন"
                              onClick={() => setViewProfileUserId(u.user_id)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Profile
                            </Button>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Cancel subscription"
                                  onClick={() => doCancel(u)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            {!isAdminRow &&
                              (isBanned ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Unban user"
                                  onClick={() => doUnban(u)}
                                >
                                  <Undo2 className="h-3.5 w-3.5 text-emerald-600" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Ban user"
                                  onClick={() => doBan(u)}
                                >
                                  <Ban className="h-3.5 w-3.5 text-amber-600" />
                                </Button>
                              ))}
                            {isAdminRow ? (
                              !isSelf && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Revoke admin role"
                                  onClick={() => doRevoke(u)}
                                >
                                  <ShieldMinus className="h-3.5 w-3.5 text-rose-600" />
                                </Button>
                              )
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Make admin"
                                onClick={() => doPromote(u)}
                              >
                                <ShieldPlus className="h-3.5 w-3.5 text-indigo-600" />
                              </Button>
                            )}
                            {!isAdminRow && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete user permanently"
                                onClick={() => doDelete(u)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                              </Button>
                            )}
                          </div>
                        );
                      })()}
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
              {grantTarget?.email} এর জন্য paid plan activate করুন। বর্তমান plan থাকলে replace হবে।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Plan</label>
              <Select value={grantPlan} onValueChange={(v) => setGrantPlan(v as typeof grantPlan)}>
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

      {/* View User Profile Modal */}
      <UserProfileModal
        userId={viewProfileUserId}
        open={Boolean(viewProfileUserId)}
        onOpenChange={(open) => !open && setViewProfileUserId(null)}
        currentAdminId={user?.id}
        onGrantPro={(target) => {
          const fullUser = users.find((usr) => usr.user_id === target.user_id);
          if (fullUser) {
            setGrantTarget(fullUser);
            setGrantPlan("student_monthly");
          }
        }}
        onBan={(target) => {
          const fullUser = users.find((usr) => usr.user_id === target.user_id);
          if (fullUser) void doBan(fullUser);
        }}
        onUnban={(target) => {
          const fullUser = users.find((usr) => usr.user_id === target.user_id);
          if (fullUser) void doUnban(fullUser);
        }}
        onPromote={(target) => {
          const fullUser = users.find((usr) => usr.user_id === target.user_id);
          if (fullUser) void doPromote(fullUser);
        }}
        onRevoke={(target) => {
          const fullUser = users.find((usr) => usr.user_id === target.user_id);
          if (fullUser) void doRevoke(fullUser);
        }}
        onDelete={(target) => {
          const fullUser = users.find((usr) => usr.user_id === target.user_id);
          if (fullUser) void doDelete(fullUser);
        }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
  link,
  prefix,
  fraction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  tint: "primary" | "emerald" | "amber" | "rose";
  link?: string;
  prefix?: string;
  /** Fractional digits (for currency like USD cost). Bangla numerals otherwise. */
  fraction?: number;
}) {
  const tintMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/15 text-emerald-600",
    amber: "bg-amber-500/15 text-amber-600",
    rose: "bg-rose-500/15 text-rose-600",
  };
  const formatted =
    value === undefined
      ? "—"
      : fraction !== undefined
        ? value.toLocaleString("en-US", {
            minimumFractionDigits: fraction,
            maximumFractionDigits: fraction,
          })
        : value.toLocaleString("bn-BD");
  const display = value === undefined ? "—" : `${prefix ?? ""}${formatted}`;
  const inner = (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tintMap[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none">{display}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function LiveActivePill({
  active,
}: {
  active: { total: number; byLocation: Record<string, number> };
}) {
  const parts: string[] = [];
  if (active.byLocation.lab) parts.push(`${active.byLocation.lab} lab`);
  if (active.byLocation.tutor) parts.push(`${active.byLocation.tutor} tutor`);
  const detail = parts.length ? ` · ${parts.join(" + ")}` : "";
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      <Radio className="h-3.5 w-3.5 text-emerald-600" />
      <span className="text-sm font-semibold">{active.total} live</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}
