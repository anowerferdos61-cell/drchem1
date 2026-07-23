/**
 * Admin Analytics — visitors, sessions, top pages/features, live sessions,
 * and per-session timeline drill-down.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Eye,
  FlaskConical,
  Loader2,
  MousePointerClick,
  ShieldCheck,
  Users as UsersIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-store";
import UserMenu from "@/components/auth/UserMenu";
import {
  getAnalyticsOverview,
  getRecentSessions,
  getSessionTimeline,
  type RecentSessionRow,
} from "@/lib/analytics.functions";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
  head: () => ({
    meta: [
      { title: "Analytics · Admin · Dr. Chem" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AdminAnalytics() {
  const { isAuthenticated, loading, roles, rolesLoaded } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (loading || !rolesLoaded) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/admin/analytics" }, replace: true });
      return;
    }
    if (!isAdmin) void navigate({ to: "/app", replace: true });
  }, [loading, rolesLoaded, isAuthenticated, isAdmin, navigate]);

  const overviewFn = useServerFn(getAnalyticsOverview);
  const recentFn = useServerFn(getRecentSessions);
  const timelineFn = useServerFn(getSessionTimeline);

  const enabled = isAuthenticated && rolesLoaded && isAdmin;

  // Selected day (local date). Defaults to today.
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  });
  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);
  const isToday = useMemo(() => dateStr === format(new Date(), "yyyy-MM-dd"), [dateStr]);

  const shiftDay = (delta: number) => {
    const next = new Date(selectedDate.getTime() + delta * 24 * 60 * 60 * 1000);
    setSelectedDate(new Date(next.getFullYear(), next.getMonth(), next.getDate()));
  };

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin", "analytics", "overview", dateStr],
    queryFn: () => overviewFn({ data: { date: dateStr } }),
    enabled,
    refetchInterval: isToday ? 30_000 : false,
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["admin", "analytics", "recent", dateStr],
    queryFn: () => recentFn({ data: { limit: 100, date: dateStr } }),
    enabled,
    refetchInterval: isToday ? 15_000 : false,
  });

  const [selected, setSelected] = useState<RecentSessionRow | null>(null);

  const { data: timeline = [], isLoading: timelineLoading } = useQuery({
    queryKey: ["admin", "analytics", "timeline", selected?.id],
    queryFn: () => timelineFn({ data: { sessionId: selected!.id } }),
    enabled: !!selected,
  });

  if (loading || !rolesLoaded || (isAuthenticated && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <span className="font-bold">Dr. Chem</span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> ADMIN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" /> Admin
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" /> Analytics
            </h1>
            <p className="text-muted-foreground text-sm">
              {isToday ? "Today" : format(selectedDate, "PPPP")} · visitors, sessions & features
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftDay(-1)} aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("min-w-[180px] justify-start text-left font-normal")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={() => shiftDay(1)}
              disabled={isToday}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))}>
                Today
              </Button>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI icon={UsersIcon} label="Visitors" value={overview?.visitors} />
          <KPI icon={Activity} label="Sessions" value={overview?.sessions} />
          <KPI icon={Eye} label="Page views" value={overview?.pageViews} />
          <KPI icon={Activity} label="Active now (5m)" value={overview?.activeNow} tint="emerald" />
        </div>

        {/* Hourly chart */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">
              Hourly activity — {isToday ? "today" : format(selectedDate, "PPP")}
            </h2>
            {overviewLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={overview?.hourly ?? []}>
              <defs>
                <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="hour" tickFormatter={(v: string) => `${v}:00`} fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v: string) => `${v}:00`}
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="hsl(var(--primary))"
                fill="url(#visitors)"
                name="Visitors"
              />
              <Area
                type="monotone"
                dataKey="page_views"
                stroke="hsl(var(--muted-foreground))"
                fill="none"
                name="Page views"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top pages / features */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" /> Top pages
            </h2>
            <div className="space-y-1.5">
              {(overview?.topPages ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
              {(overview?.topPages ?? []).map((p) => (
                <div key={p.path} className="flex items-center justify-between text-sm">
                  <span className="truncate font-mono text-xs">{p.path}</span>
                  <span className="text-muted-foreground tabular-nums">{p.views}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" /> Top features
            </h2>
            <div className="space-y-1.5">
              {(overview?.topFeatures ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No feature events tracked yet. Call{" "}
                  <code className="text-xs">trackFeature(&quot;key&quot;)</code> from any button.
                </p>
              )}
              {(overview?.topFeatures ?? []).map((f) => (
                <div key={f.feature} className="flex items-center justify-between text-sm">
                  <span className="truncate">{f.feature}</span>
                  <span className="text-muted-foreground tabular-nums">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="rounded-xl border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent sessions</h2>
            <span className="text-xs text-muted-foreground">Click a row for the full timeline</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Who</th>
                  <th className="text-left px-3 py-2">Started</th>
                  <th className="text-left px-3 py-2">Last seen</th>
                  <th className="text-right px-3 py-2">Duration</th>
                  <th className="text-right px-3 py-2">Views</th>
                  <th className="text-right px-3 py-2">Events</th>
                  <th className="text-left px-3 py-2">Entry</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No sessions yet.
                    </td>
                  </tr>
                )}
                {recent.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-3 py-2">
                      {s.email ? (
                        <div>
                          <div className="font-medium">{s.display_name ?? s.email}</div>
                          <div className="text-xs text-muted-foreground">{s.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs font-mono">
                          anon · {s.anon_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(s.started_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs">{timeAgo(s.last_seen_at)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatDuration(s.duration_seconds)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.page_views}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.event_count}</td>
                    <td className="px-3 py-2 font-mono text-xs truncate max-w-[200px]">
                      {s.entry_path ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Timeline dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session timeline</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">User:</span>{" "}
                  <span className="font-medium">
                    {selected.email ?? `anon · ${selected.anon_id.slice(0, 8)}`}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(selected.started_at).toLocaleString()} · duration{" "}
                  {formatDuration(selected.duration_seconds)} · {selected.page_views} views
                </div>
                {selected.user_agent && (
                  <div className="text-xs text-muted-foreground truncate">
                    {selected.user_agent}
                  </div>
                )}
              </div>

              {timelineLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <ol className="relative border-l border-border pl-4 space-y-2">
                  {timeline.map((ev) => (
                    <li key={ev.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="text-xs text-muted-foreground">
                        {new Date(ev.created_at).toLocaleTimeString()}
                      </div>
                      <div className="text-sm">
                        {ev.event_type === "page_view" ? (
                          <>
                            <span className="text-muted-foreground">Viewed </span>
                            <span className="font-mono">{ev.path}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-muted-foreground">Used </span>
                            <span className="font-medium">{ev.feature_key}</span>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                  {timeline.length === 0 && (
                    <p className="text-sm text-muted-foreground">No events recorded.</p>
                  )}
                </ol>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  tint = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  tint?: "primary" | "emerald";
}) {
  const tintClass =
    tint === "emerald"
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      : "text-primary bg-primary/10";
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`h-6 w-6 rounded-md inline-flex items-center justify-center ${tintClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">
        {value === undefined ? "—" : value.toLocaleString("en-US")}
      </div>
    </div>
  );
}
