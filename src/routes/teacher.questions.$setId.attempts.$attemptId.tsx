import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getAttemptDetail, saveCqGrade, aiSuggestCqScore } from "@/lib/grading.functions";

export const Route = createFileRoute("/teacher/questions/$setId/attempts/$attemptId")({
  component: GradeAttempt,
});

function GradeAttempt() {
  const { setId, attemptId } = Route.useParams();
  const navigate = useNavigate();
  const load = useServerFn(getAttemptDetail);
  const saveG = useServerFn(saveCqGrade);
  const suggest = useServerFn(aiSuggestCqScore);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const r = await load({ data: { attempt_id: attemptId } });
      if (r.error) toast.error(r.error);
      setAttempt(r.attempt);
      setQuestions(r.questions);
      setGrades(r.grades);
      setLoading(false);
    })();
  }, [attemptId, load]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!attempt) return <p className="text-sm">Not found</p>;

  const cqs = questions.filter((q) => q.type === "cq");
  const gradeFor = (qid: string, part: string) =>
    grades.find((g) => g.question_id === qid && g.part === part);

  const doSave = async (
    qid: string,
    part: "ka" | "kha" | "ga" | "gha",
    marks: number,
    similarity: number | null,
  ) => {
    const r = await saveG({
      data: {
        attempt_id: attemptId,
        question_id: qid,
        part,
        marks_awarded: marks,
        ai_similarity_score: similarity,
      },
    });
    if (r.error) return toast.error(r.error);
    toast.success("Saved");
    // reload grades
    const rr = await load({ data: { attempt_id: attemptId } });
    setGrades(rr.grades);
  };

  const doAiSuggest = async (
    qid: string,
    part: "ka" | "kha" | "ga" | "gha",
    sample: string,
    student: string,
    max: number,
  ) => {
    if (!sample) return toast.error("No sample answer");
    const r = await suggest({ data: { sample, student, max_marks: max } });
    if (r.error || !r.result) return toast.error(r.error ?? "Failed");
    toast.success(`AI: ${r.result.similarity}% match, suggests ${r.result.suggested_marks}/${max}`);
    await doSave(qid, part, r.result.suggested_marks, r.result.similarity);
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/teacher/questions/$setId/results", params: { setId } })}
      >
        <ArrowLeft className="h-4 w-4" /> Back to results
      </Button>
      <Card className="p-4">
        <h1 className="text-xl font-bold">Grade Attempt</h1>
        <p className="text-xs text-muted-foreground">
          MCQ: {attempt.mcq_score}/{attempt.mcq_total} · CQ: {attempt.cq_score ?? "pending"}
        </p>
      </Card>

      {cqs.length === 0 && <p className="text-sm text-muted-foreground">No CQ questions.</p>}
      {cqs.map((q, i) => {
        const studentAns = attempt.answers?.[q.id] ?? {};
        return (
          <Card key={q.id} className="p-4 space-y-3">
            <div className="text-xs text-muted-foreground">CQ {i + 1}</div>
            <div className="rounded bg-muted/30 p-2 text-sm">
              <strong>উদ্দীপক:</strong> {q.stem}
            </div>
            {(["ka", "kha", "ga", "gha"] as const).map((part) => {
              const p = q.parts?.[part] ?? { q: "", marks: 0, sample: "" };
              const g = gradeFor(q.id, part);
              const studentText = studentAns[part] ?? "";
              return (
                <div key={part} className="rounded border p-3 space-y-2">
                  <div className="text-sm font-semibold">
                    ({part === "ka" ? "ক" : part === "kha" ? "খ" : part === "ga" ? "গ" : "ঘ"}) {p.q}{" "}
                    — {p.marks} mark
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">শিক্ষার্থীর উত্তর:</div>
                    <div className="whitespace-pre-wrap rounded bg-muted/20 p-2 text-sm">
                      {studentText || <em className="text-muted-foreground">খালি</em>}
                    </div>
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      আদর্শ উত্তর দেখুন
                    </summary>
                    <div className="mt-1 whitespace-pre-wrap rounded bg-emerald-50 dark:bg-emerald-900/20 p-2">
                      {p.sample}
                    </div>
                  </details>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs">মার্কস:</span>
                    <Input
                      type="number"
                      min={0}
                      max={p.marks}
                      defaultValue={g?.marks_awarded ?? 0}
                      className="w-20"
                      onBlur={(e) =>
                        doSave(q.id, part, Number(e.target.value), g?.ai_similarity_score ?? null)
                      }
                    />
                    <span className="text-xs text-muted-foreground">/ {p.marks}</span>
                    {g?.ai_similarity_score != null && (
                      <span className="rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 text-xs">
                        AI match: {Math.round(g.ai_similarity_score)}%
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => doAiSuggest(q.id, part, p.sample, studentText, p.marks)}
                    >
                      <Sparkles className="h-3 w-3" /> AI Suggest
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
}
