import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Sparkles, FileText, BarChart3, Trash2, Send, FileEdit } from "lucide-react";
import { getMyQuestionSets, deleteQuestionSet } from "@/lib/questions.functions";

export const Route = createFileRoute("/teacher/questions/")({
  component: QuestionsList,
});

type SetRow = {
  id: string;
  title: string;
  chapter: string;
  question_type: string;
  difficulty: string;
  status: string;
  class_id: string | null;
  class_name: string | null;
  published_at: string | null;
  created_at: string;
};

function QuestionsList() {
  const navigate = useNavigate();
  const list = useServerFn(getMyQuestionSets);
  const del = useServerFn(deleteQuestionSet);
  const [rows, setRows] = useState<SetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await list();
    setRows(r.sets as SetRow[]);
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this question set?")) return;
    const r = await del({ data: { set_id: id } });
    if (r.error) return toast.error(r.error);
    toast.success("Deleted");
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI Question Generator
          </h1>
          <p className="text-sm text-muted-foreground">
            AI দিয়ে NCTB standard MCQ / সৃজনশীল প্রশ্ন বানান, এডিট করুন, ক্লাসে অ্যাসাইন করুন।
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/teacher/questions/new" })}>
          <Plus className="h-4 w-4" /> New Test
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          এখনও কোনো প্রশ্নপত্র বানানো হয়নি। "New Test" চাপুন।
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{r.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {r.chapter} · {r.question_type.toUpperCase()} · {r.difficulty}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${
                        r.status === "published"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status === "published" ? (
                        <Send className="h-3 w-3" />
                      ) : (
                        <FileEdit className="h-3 w-3" />
                      )}
                      {r.status}
                    </span>
                    {r.status === "published" ? (
                      r.class_name ? (
                        <span className="text-muted-foreground">
                          → <span className="font-medium text-foreground">{r.class_name}</span>
                          {r.published_at && (
                            <>
                              {" "}
                              ·{" "}
                              {new Date(r.published_at).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">→ class removed</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">
                        Created {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to="/teacher/questions/$setId" params={{ setId: r.id }}>
                    <FileText className="h-4 w-4" /> Edit
                  </Link>
                </Button>
                {r.status === "published" && (
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to="/teacher/questions/$setId/results" params={{ setId: r.id }}>
                      <BarChart3 className="h-4 w-4" /> Results
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
