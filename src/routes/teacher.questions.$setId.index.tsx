import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Send, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSetDetail, saveQuestionSet, publishQuestionSet } from "@/lib/questions.functions";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/teacher/questions/$setId/")({
  component: EditSet,
});

function EditSet() {
  const { setId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const get = useServerFn(getSetDetail);
  const save = useServerFn(saveQuestionSet);
  const pub = useServerFn(publishQuestionSet);
  const [loading, setLoading] = useState(true);
  const [set, setSet] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const r = await get({ data: { set_id: setId } });
      if (r.error) toast.error(r.error);
      setSet(r.set);
      setQuestions(r.questions);
      setSelectedClass(r.set?.class_id ?? "");
      setLoading(false);
    })();
  }, [setId, get]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase.from("classes").select("id, name").eq("teacher_id", user.id);
      setClasses(data ?? []);
    })();
  }, [user]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!set) return <p className="text-sm">Not found</p>;

  const persist = async () => {
    const mcq_items = questions
      .filter((q) => q.type === "mcq")
      .map((q) => ({
        question: q.question_text ?? "",
        options: q.options ?? ["", "", "", ""],
        correct_index: q.correct_index ?? 0,
        explanation: q.explanation ?? "",
      }));
    const cq_items = questions
      .filter((q) => q.type === "cq")
      .map((q) => ({
        stem: q.stem ?? "",
        ka: q.parts?.ka ?? { q: "", marks: 1, sample: "" },
        kha: q.parts?.kha ?? { q: "", marks: 2, sample: "" },
        ga: q.parts?.ga ?? { q: "", marks: 3, sample: "" },
        gha: q.parts?.gha ?? { q: "", marks: 4, sample: "" },
      }));
    const r = await save({
      data: {
        set_id: setId,
        title: set.title,
        chapter: set.chapter,
        question_type: set.question_type,
        difficulty: set.difficulty,
        source_experiment: set.source_experiment,
        class_id: selectedClass || undefined,
        mcq_items,
        cq_items,
      },
    });
    if (r.error) return toast.error(r.error);
    toast.success("Saved");
  };

  const doPublish = async () => {
    if (!selectedClass) return toast.error("প্রথমে একটি ক্লাস সিলেক্ট কর");
    await persist();
    const r = await pub({ data: { set_id: setId, class_id: selectedClass, due_at: null } });
    if (r.error) return toast.error(r.error);
    toast.success(
      `✓ Published! ${r.class_name} ক্লাসের ${r.student_count} জন স্টুডেন্টকে assign করা হয়েছে।`,
      { duration: 5000 },
    );

    void navigate({ to: "/teacher/questions/$setId/results", params: { setId } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/teacher/questions" })}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {set.status === "published" && (
          <Button asChild variant="outline">
            <Link to="/teacher/questions/$setId/results" params={{ setId }}>
              <BarChart3 className="h-4 w-4" /> Results
            </Link>
          </Button>
        )}
      </div>

      <Card className="p-4">
        <input
          className="w-full text-xl font-bold bg-transparent outline-none"
          value={set.title}
          onChange={(e) => setSet({ ...set, title: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          {set.chapter} · {set.question_type.toUpperCase()} · {set.difficulty} ·{" "}
          <span className="rounded bg-muted px-2 py-0.5">{set.status}</span>
        </p>
      </Card>

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground">Assign to class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={persist}>
          Save
        </Button>
        <Button onClick={doPublish}>
          <Send className="h-4 w-4" /> Publish to Class
        </Button>
      </Card>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-4">
            <div className="text-xs text-muted-foreground mb-2">
              Q{i + 1} · {q.type.toUpperCase()}
            </div>
            {q.type === "mcq" ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded border p-2 text-sm bg-background"
                  rows={2}
                  value={q.question_text ?? ""}
                  onChange={(e) => {
                    const nq = [...questions];
                    nq[i] = { ...q, question_text: e.target.value };
                    setQuestions(nq);
                  }}
                />
                {(q.options ?? []).map((o: string, oi: number) => (
                  <label key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={q.correct_index === oi}
                      onChange={() => {
                        const nq = [...questions];
                        nq[i] = { ...q, correct_index: oi };
                        setQuestions(nq);
                      }}
                    />
                    <input
                      className="flex-1 rounded border p-1 text-sm bg-background"
                      value={o}
                      onChange={(e) => {
                        const nq = [...questions];
                        const opts = [...(q.options ?? [])];
                        opts[oi] = e.target.value;
                        nq[i] = { ...q, options: opts };
                        setQuestions(nq);
                      }}
                    />
                  </label>
                ))}
                <textarea
                  className="w-full rounded border p-2 text-xs bg-muted/30"
                  rows={2}
                  value={q.explanation ?? ""}
                  placeholder="Explanation"
                  onChange={(e) => {
                    const nq = [...questions];
                    nq[i] = { ...q, explanation: e.target.value };
                    setQuestions(nq);
                  }}
                />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs">উদ্দীপক</label>
                  <textarea
                    className="w-full rounded border p-2 text-sm bg-background"
                    rows={8}
                    value={q.stem ?? ""}
                    onChange={(e) => {
                      const nq = [...questions];
                      nq[i] = { ...q, stem: e.target.value };
                      setQuestions(nq);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  {(["ka", "kha", "ga", "gha"] as const).map((k) => {
                    const p = q.parts?.[k] ?? { q: "", marks: 0, sample: "" };
                    return (
                      <div key={k} className="rounded border p-2">
                        <div className="text-xs font-semibold">
                          ({k === "ka" ? "ক" : k === "kha" ? "খ" : k === "ga" ? "গ" : "ঘ"}) —{" "}
                          {p.marks} mark
                        </div>
                        <input
                          className="mt-1 w-full rounded border p-1 text-sm bg-background"
                          value={p.q}
                          onChange={(e) => {
                            const nq = [...questions];
                            const parts = { ...(q.parts ?? {}) };
                            parts[k] = { ...p, q: e.target.value };
                            nq[i] = { ...q, parts };
                            setQuestions(nq);
                          }}
                        />
                        <textarea
                          className="mt-1 w-full rounded border p-2 text-xs bg-muted/30"
                          rows={2}
                          value={p.sample}
                          placeholder="আদর্শ উত্তর"
                          onChange={(e) => {
                            const nq = [...questions];
                            const parts = { ...(q.parts ?? {}) };
                            parts[k] = { ...p, sample: e.target.value };
                            nq[i] = { ...q, parts };
                            setQuestions(nq);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
