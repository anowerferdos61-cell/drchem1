/**
 * Student progress dashboard — persistent streak, labs completed,
 * best grades, test averages, recent activity feed.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Flame, Trophy, Timer, FlaskConical, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyProgress } from "@/lib/progress.functions";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
  head: () => ({
    meta: [
      { title: "My Progress · Dr. Chem" },
      {
        name: "description",
        content:
          "Track your chemistry lab streak, completed experiments, best grades and recent test scores.",
      },
    ],
  }),
});

interface RecentAttempt {
  id: string;
  experiment_id: string;
  accuracy: number;
  grade: string;
  duration_sec: number;
  mistakes_count: number;
  created_at: string;
}

interface ProgressData {
  streak: {
    current_days: number;
    longest_days: number;
    last_check_date: string | null;
    start_date: string | null;
  };
  summary: {
    totalAttempts: number;
    uniqueLabs: number;
    avgAccuracy: number;
    totalMinutes: number;
    perExperiment: Array<{
      experiment_id: string;
      count: number;
      best: number;
      bestGrade: string;
      last: string;
    }>;
  };
  recentAttempts: RecentAttempt[];
  testAttempts: Array<{
    id: string;
    set_id: string;
    submitted_at: string | null;
    mcq_score: number | null;
    mcq_total: number | null;
    cq_score: number | null;
  }>;
}

function formatExperiment(id: string) {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProgressPage() {
  const { isAuthenticated, loading } = useAuth();
  const load = useServerFn(getMyProgress);
  const [data, setData] = useState<ProgressData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setErr("Please sign in to see your progress.");
      return;
    }
    load({})
      .then((d) => setData(d as ProgressData))
      .catch((e) => setErr(e?.message ?? "Failed to load"));
  }, [isAuthenticated, loading, load]);

  if (err) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card className="p-6 text-sm">{err}</Card>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm text-muted-foreground">
        Loading your progress…
      </div>
    );
  }

  const testAvg = (() => {
    const done = data.testAttempts.filter((t) => t.submitted_at && (t.mcq_total ?? 0) > 0);
    if (done.length === 0) return null;
    const pct =
      done.reduce(
        (s, t) => s + ((t.mcq_score ?? 0) + (t.cq_score ?? 0)) / (t.mcq_total ?? 1),
        0,
      ) / done.length;
    return Math.round(pct * 100);
  })();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Link
          to="/app"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <h1 className="text-lg font-bold md:text-2xl">My Progress · আমার অগ্রগতি</h1>
        <div className="w-16" />
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          label="Current Streak"
          value={`${data.streak.current_days} d`}
          sub={`Longest ${data.streak.longest_days}`}
        />
        <StatCard
          icon={<FlaskConical className="h-5 w-5 text-emerald-500" />}
          label="Labs Done"
          value={String(data.summary.uniqueLabs)}
          sub={`${data.summary.totalAttempts} attempts`}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5 text-amber-500" />}
          label="Avg Accuracy"
          value={`${data.summary.avgAccuracy}%`}
          sub={testAvg !== null ? `Tests: ${testAvg}%` : "No tests yet"}
        />
        <StatCard
          icon={<Timer className="h-5 w-5 text-cyan-500" />}
          label="Time in Labs"
          value={`${data.summary.totalMinutes} min`}
          sub=""
        />
      </div>

      {/* Best per experiment */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
          Best per Experiment
        </div>
        {data.summary.perExperiment.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No lab attempts yet. Start one from the{" "}
            <Link to="/app" className="text-primary underline">
              home dashboard
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Experiment</th>
                  <th className="px-4 py-2">Attempts</th>
                  <th className="px-4 py-2">Best</th>
                  <th className="px-4 py-2">Grade</th>
                  <th className="px-4 py-2">Last</th>
                </tr>
              </thead>
              <tbody>
                {data.summary.perExperiment
                  .sort((a, b) => b.best - a.best)
                  .map((r) => (
                    <tr key={r.experiment_id} className="border-t">
                      <td className="px-4 py-2 font-medium">{formatExperiment(r.experiment_id)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.count}</td>
                      <td className="px-4 py-2 font-semibold">{Math.round(r.best)}%</td>
                      <td className="px-4 py-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                          {r.bestGrade}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(r.last).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent activity */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
          Recent Activity
        </div>
        {data.recentAttempts.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nothing yet.</div>
        ) : (
          <ul className="divide-y">
            {data.recentAttempts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{formatExperiment(a.experiment_id)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()} · {a.mistakes_count} mistakes ·{" "}
                    {Math.round(a.duration_sec / 60)} min
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{Math.round(a.accuracy)}%</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {a.grade}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex justify-center gap-3">
        <Button asChild>
          <Link to="/app">
            <FlaskConical className="mr-1 h-4 w-4" /> Continue in the Lab
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app/tests">
            <GraduationCap className="mr-1 h-4 w-4" /> My Tests
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}
