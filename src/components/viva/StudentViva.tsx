import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { gradeViva } from "@/lib/viva.functions";
import type { VivaQuestion } from "./TeacherViva";

interface GradeResult {
  perQuestion: Array<{ correct: boolean; score: number; feedback: string }>;
  overallScore: number;
  gaps: string[];
  summary: string;
}

export default function StudentViva() {
  const [questions, setQuestions] = useState<VivaQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const grade = useServerFn(gradeViva);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ questions: VivaQuestion[] }>).detail;
      setQuestions(detail.questions);
      setAnswers(new Array(detail.questions.length).fill(""));
      setResult(null);
    };
    window.addEventListener("viva:update", handler);
    return () => window.removeEventListener("viva:update", handler);
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await grade({
        data: {
          items: questions.map((q, i) => ({
            q: q.q,
            expected: q.expected,
            answer: answers[i] ?? "",
          })),
        },
      });
      if (res.error || !res.result) {
        toast.error(res.error ?? "Grading failed");
      } else {
        setResult(res.result);
        toast.success(`Scored ${res.result.overallScore.toFixed(0)}/100`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (questions.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Student Viva · ছাত্রের পরীক্ষা
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Waiting for the teacher to publish questions… · শিক্ষকের প্রশ্নের অপেক্ষায়
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold uppercase text-muted-foreground">
        Student Viva · ছাত্রের পরীক্ষা
      </h3>
      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={i} className="space-y-1">
            <p className="text-sm font-medium">
              {i + 1}. {q.q}
            </p>
            <Textarea
              value={answers[i] ?? ""}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
              }}
              placeholder="Your answer · আপনার উত্তর"
              rows={2}
              disabled={!!result}
            />
            {result && (
              <div
                className={[
                  "rounded border p-2 text-xs",
                  result.perQuestion[i]?.correct
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-amber-300 bg-amber-50",
                ].join(" ")}
              >
                <strong>
                  {result.perQuestion[i]?.correct ? "✓" : "✗"} Score:{" "}
                  {(result.perQuestion[i]?.score * 100).toFixed(0)}%
                </strong>
                <p>{result.perQuestion[i]?.feedback}</p>
              </div>
            )}
          </li>
        ))}
      </ol>
      {!result ? (
        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? "Grading..." : "Submit · জমা দিন"}
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Overall Score</span>
            <span className="text-2xl font-bold text-primary">
              {result.overallScore.toFixed(0)}/100
            </span>
          </div>
          <p className="text-xs">{result.summary}</p>
          {result.gaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold">Concept gaps:</p>
              <ul className="list-disc pl-5 text-xs">
                {result.gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
