import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { getTestForStudent, submitAttempt } from "@/lib/tests.functions";

export const Route = createFileRoute("/app/tests/$setId")({
  component: TakeTest,
});

// deno-lint-ignore no-explicit-any
type Answers = Record<string, number | { ka: string; kha: string; ga: string; gha: string }>;

function TakeTest() {
  const { setId } = Route.useParams();
  const navigate = useNavigate();
  const load = useServerFn(getTestForStudent);
  const submit = useServerFn(submitAttempt);
  // deno-lint-ignore no-explicit-any
  const [set, setSet] = useState<any>(null);
  // deno-lint-ignore no-explicit-any
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const r = await load({ data: { set_id: setId } });
      if (r.error) toast.error(r.error);
      setSet(r.set);
      setQuestions(r.questions);
      if (r.attempt?.submitted_at) {
        setSubmitted(true);
        setAnswers((r.attempt.answers ?? {}) as Answers);
      }
      setLoading(false);
    })();
  }, [setId]);

  const doSubmit = async () => {
    if (!confirm("Submit test? আর এডিট করা যাবে না।")) return;
    setSubmitting(true);
    const r = await submit({ data: { set_id: setId, answers } });
    setSubmitting(false);
    if (r.error) return toast.error(r.error);
    toast.success(`Submitted! MCQ Score: ${r.mcqScore}/${r.mcqTotal}`);
    setSubmitted(true);
  };

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  if (!set) return <p className="p-6">Not available</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app/tests" })}>
        <ArrowLeft className="h-4 w-4" /> All tests
      </Button>
      <Card className="p-4">
        <h1 className="text-2xl font-bold">{set.title}</h1>
        <p className="text-xs text-muted-foreground">{set.chapter}</p>
        {submitted && (
          <p className="mt-2 rounded bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300 inline-block">
            ✓ Submitted — read only
          </p>
        )}
      </Card>

      {questions.map((q, i) => (
        <Card key={q.id} className="p-4">
          <div className="text-xs text-muted-foreground mb-2">Q{i + 1}</div>
          {q.type === "mcq" ? (
            <div>
              <div className="font-medium mb-2">{q.question_text}</div>
              <div className="space-y-1">
                {(q.options ?? []).map((o: string, oi: number) => (
                  <label key={oi} className="flex items-center gap-2 rounded p-2 hover:bg-muted/40 cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      disabled={submitted}
                      checked={answers[q.id] === oi}
                      onChange={() => setAnswers({ ...answers, [q.id]: oi })}
                    />
                    <span>{o}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                <strong>উদ্দীপক:</strong> {q.stem}
              </div>
              {(["ka", "kha", "ga", "gha"] as const).map((part) => {
                const p = q.parts?.[part] ?? { q: "", marks: 0 };
                // deno-lint-ignore no-explicit-any
                const cur = (answers[q.id] as any) ?? { ka: "", kha: "", ga: "", gha: "" };
                return (
                  <div key={part}>
                    <label className="text-sm font-semibold">
                      ({part === "ka" ? "ক" : part === "kha" ? "খ" : part === "ga" ? "গ" : "ঘ"}) {p.q} — {p.marks} mark
                    </label>
                    <textarea
                      disabled={submitted}
                      className="mt-1 w-full rounded border p-2 text-sm bg-background"
                      rows={part === "ga" || part === "gha" ? 5 : 2}
                      value={cur[part] ?? ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.id]: { ...cur, [part]: e.target.value } })
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ))}

      {!submitted && (
        <Button onClick={doSubmit} disabled={submitting} className="w-full">
          {submitting ? "Submitting…" : "Submit Test · সাবমিট করো"}
        </Button>
      )}
    </div>
  );
}
