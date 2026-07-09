import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { getAssignedTests } from "@/lib/tests.functions";

export const Route = createFileRoute("/app/tests/")({
  component: MyTests,
});

interface SetRow {
  id: string;
  title: string;
  chapter: string;
  question_type: string;
  due_at: string | null;
  published_at: string | null;
}
interface AttemptRow {
  id: string;
  set_id: string;
  submitted_at: string | null;
  mcq_score: number;
  mcq_total: number;
  cq_score: number | null;
}

function MyTests() {
  const load = useServerFn(getAssignedTests);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const r = await load();
      setSets(r.sets as SetRow[]);
      setAttempts(r.attempts as AttemptRow[]);
      setLoading(false);
    })();
  }, []);

  const attemptFor = (setId: string) => attempts.find((a) => a.set_id === setId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" /> My Tests · আমার পরীক্ষা
        </h1>
        <p className="text-sm text-muted-foreground">শিক্ষকের দেওয়া MCQ / CQ পরীক্ষাগুলো।</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sets.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          এখনও কোনো পরীক্ষা assign হয়নি।
        </Card>
      ) : (
        <div className="grid gap-3">
          {sets.map((s) => {
            const a = attemptFor(s.id);
            return (
              <Card key={s.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {s.chapter} · {s.question_type.toUpperCase()}
                  </p>
                  {a?.submitted_at && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Submitted · MCQ {a.mcq_score}/{a.mcq_total}
                      {a.cq_score != null ? ` · CQ ${a.cq_score}` : ""}
                    </p>
                  )}
                </div>
                <Button asChild size="sm">
                  <Link to="/app/tests/$setId" params={{ setId: s.id }}>
                    {a?.submitted_at ? "Review" : "Start"}
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
