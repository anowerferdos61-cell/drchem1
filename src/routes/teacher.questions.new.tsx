import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { generateQuestions, saveQuestionSet } from "@/lib/questions.functions";

export const Route = createFileRoute("/teacher/questions/new")({
  component: NewQuestionWizard,
});

type Diff = "easy" | "medium" | "hard" | "mixed";
type QType = "mcq" | "cq";

interface McqItem {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}
interface CqPart {
  q: string;
  marks: number;
  sample: string;
}
interface CqItem {
  stem: string;
  ka: CqPart;
  kha: CqPart;
  ga: CqPart;
  gha: CqPart;
}

function NewQuestionWizard() {
  const navigate = useNavigate();
  const gen = useServerFn(generateQuestions);
  const save = useServerFn(saveQuestionSet);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [chapter, setChapter] = useState("");
  const [type, setType] = useState<QType>("mcq");
  const [difficulty, setDifficulty] = useState<Diff>("medium");
  const [count, setCount] = useState(5);
  const [experiment, setExperiment] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mcqItems, setMcqItems] = useState<McqItem[]>([]);
  const [cqItems, setCqItems] = useState<CqItem[]>([]);

  const doGenerate = async () => {
    if (!chapter.trim()) return toast.error("Chapter দাও");
    if (!title.trim()) setTitle(`${chapter} — ${type === "mcq" ? "MCQ" : "CQ"}`);
    setGenerating(true);
    setStep(2);
    const r = await gen({
      data: {
        chapter,
        type,
        difficulty,
        count,
        experiment: experiment.trim() || undefined,
      },
    });
    setGenerating(false);
    if (r.error || !r.questions) {
      toast.error(r.error ?? "Failed");
      setStep(1);
      return;
    }
    if (type === "mcq") {
      setMcqItems(r.questions as McqItem[]);
      setCqItems([]);
    } else {
      setCqItems(r.questions as CqItem[]);
      setMcqItems([]);
    }
    setStep(3);
  };

  const doSave = async () => {
    setSaving(true);
    const r = await save({
      data: {
        title: title || `${chapter} — ${type.toUpperCase()}`,
        chapter,
        question_type: type,
        difficulty,
        source_experiment: experiment.trim() || undefined,
        mcq_items: type === "mcq" ? mcqItems : [],
        cq_items: type === "cq" ? cqItems : [],
      },
    });
    setSaving(false);
    if (r.error || !r.set_id) return toast.error(r.error ?? "Failed");
    toast.success("Saved");
    void navigate({ to: "/teacher/questions/$setId", params: { setId: r.set_id } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/teacher/questions" })}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">New AI Question Set</h1>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={step >= 1 ? "font-bold text-foreground" : ""}>১. Setup</span> →
        <span className={step >= 2 ? "font-bold text-foreground" : ""}>২. AI Generate</span> →
        <span className={step >= 3 ? "font-bold text-foreground" : ""}>৩. Editor</span>
      </div>

      {step === 1 && (
        <Card className="p-4 space-y-3">
          <div>
            <Label>Test Title (optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chapter 5 Weekly Test" />
          </div>
          <div>
            <Label>Chapter / Topic *</Label>
            <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="অধ্যায় ৫ — রাসায়নিক বন্ধন" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as QType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">MCQ</SelectItem>
                  <SelectItem value="cq">CQ (সৃজনশীল)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Diff)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">সহজ</SelectItem>
                  <SelectItem value="medium">মাঝারি</SelectItem>
                  <SelectItem value="hard">কঠিন</SelectItem>
                  <SelectItem value="mixed">মিক্স</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Count</Label>
              <Input
                type="number"
                min={1}
                max={type === "cq" ? 3 : 10}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(type === "cq" ? 3 : 10, Number(e.target.value) || 1)))}
              />
            </div>
          </div>
          <div>
            <Label>Related Experiment (optional)</Label>
            <Input value={experiment} onChange={(e) => setExperiment(e.target.value)} placeholder="আয়নিক ও সমযোজী যৌগের বিদ্যুৎ পরিবাহিতা" />
          </div>
          <Button onClick={doGenerate} disabled={!chapter.trim()}>
            <Sparkles className="h-4 w-4" /> AI দিয়ে Generate কর
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">AI প্রশ্ন বানাচ্ছে…</p>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-md" placeholder="Test title" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Regenerate</Button>
              <Button onClick={doSave} disabled={saving}>
                {saving ? "Saving…" : "Save Draft"}
              </Button>
            </div>
          </div>

          {type === "mcq" ? (
            <McqEditor items={mcqItems} onChange={setMcqItems} />
          ) : (
            <CqEditor items={cqItems} onChange={setCqItems} />
          )}
        </div>
      )}
    </div>
  );
}

function McqEditor({ items, onChange }: { items: McqItem[]; onChange: (v: McqItem[]) => void }) {
  const upd = (i: number, patch: Partial<McqItem>) => {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const updOpt = (i: number, oi: number, val: string) => {
    onChange(items.map((it, idx) => (idx === i ? { ...it, options: it.options.map((o, k) => (k === oi ? val : o)) } : it)));
  };
  return (
    <div className="space-y-3">
      {items.map((m, i) => (
        <Card key={i} className="p-4 space-y-2">
          <div className="text-xs text-muted-foreground">Question {i + 1}</div>
          <textarea
            className="w-full rounded border p-2 text-sm bg-background"
            rows={2}
            value={m.question}
            onChange={(e) => upd(i, { question: e.target.value })}
          />
          <div className="grid gap-2">
            {m.options.map((o, oi) => (
              <label key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={m.correct_index === oi}
                  onChange={() => upd(i, { correct_index: oi })}
                />
                <Input value={o} onChange={(e) => updOpt(i, oi, e.target.value)} />
              </label>
            ))}
          </div>
          <textarea
            className="w-full rounded border p-2 text-xs bg-muted/30"
            rows={2}
            value={m.explanation}
            onChange={(e) => upd(i, { explanation: e.target.value })}
            placeholder="Explanation"
          />
        </Card>
      ))}
    </div>
  );
}

function CqEditor({ items, onChange }: { items: CqItem[]; onChange: (v: CqItem[]) => void }) {
  const upd = (i: number, patch: Partial<CqItem>) => {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const updPart = (i: number, key: "ka" | "kha" | "ga" | "gha", patch: Partial<CqPart>) => {
    onChange(
      items.map((it, idx) => (idx === i ? { ...it, [key]: { ...it[key], ...patch } } : it)),
    );
  };
  return (
    <div className="space-y-4">
      {items.map((c, i) => (
        <Card key={i} className="p-4">
          <div className="text-xs text-muted-foreground mb-2">CQ {i + 1}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">উদ্দীপক (Stem)</Label>
              <textarea
                className="w-full rounded border p-2 text-sm bg-background"
                rows={8}
                value={c.stem}
                onChange={(e) => upd(i, { stem: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              {(["ka", "kha", "ga", "gha"] as const).map((k) => (
                <div key={k} className="rounded border p-2">
                  <div className="text-xs font-semibold">
                    ({k === "ka" ? "ক" : k === "kha" ? "খ" : k === "ga" ? "গ" : "ঘ"}) — {c[k].marks} mark
                  </div>
                  <Input
                    value={c[k].q}
                    onChange={(e) => updPart(i, k, { q: e.target.value })}
                    className="mt-1"
                  />
                  <textarea
                    className="mt-1 w-full rounded border p-2 text-xs bg-muted/30"
                    rows={2}
                    value={c[k].sample}
                    onChange={(e) => updPart(i, k, { sample: e.target.value })}
                    placeholder="আদর্শ উত্তর"
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
