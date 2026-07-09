import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { getSetResults } from "@/lib/grading.functions";

export const Route = createFileRoute("/teacher/questions/$setId/results")({
  component: ResultsPage,
});

interface Row {
  id: string;
  student_id: string;
  submitted_at: string | null;
  mcq_score: number;
  mcq_total: number;
  cq_score: number | null;
  name: string;
}

function ResultsPage() {
  const { setId } = Route.useParams();
  const navigate = useNavigate();
  const load = useServerFn(getSetResults);
  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    void (async () => {
      const r = await load({ data: { set_id: setId } });
      setRows(r.rows as Row[]);
      setTitle(r.set?.title ?? "");
    })();
  }, [setId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/teacher/questions" })}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{title} — Results</h1>
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Users className="mx-auto h-8 w-8 opacity-40" />
            <p className="mt-2">কোনো স্টুডেন্ট এখনও পরীক্ষা দেয়নি।</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">MCQ Score</th>
                <th className="px-4 py-2">CQ Score</th>
                <th className="px-4 py-2">Submitted</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2">{r.mcq_score} / {r.mcq_total}</td>
                  <td className="px-4 py-2">
                    {r.cq_score == null ? <span className="text-muted-foreground">Pending</span> : r.cq_score}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/teacher/questions/$setId/attempts/$attemptId" params={{ setId, attemptId: r.id }}>
                        Grade →
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
