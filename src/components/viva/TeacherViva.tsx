import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { generateViva } from "@/lib/viva.functions";
import type { ExperimentId } from "@/components/lab/types";

export interface VivaQuestion {
  q: string;
  expected: string;
}

interface Props {
  onPublish: (questions: VivaQuestion[]) => void;
  experiment?: ExperimentId;
  defaultTopic?: string;
}

export default function TeacherViva({
  onPublish,
  experiment = "titration",
  defaultTopic = "HCl + NaOH titration: indicators and equivalence point",
}: Props) {
  const [topic, setTopic] = useState(defaultTopic);
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<VivaQuestion[]>([]);
  const [published, setPublished] = useState(false);
  const gen = useServerFn(generateViva);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await gen({ data: { topic, count, experiment } });
      if (res.error) {
        toast.error(res.error);
      } else {
        setQuestions(res.questions);
        setPublished(false);
        toast.success(`Generated ${res.questions.length} questions`);
      }
    } catch (e) {
      toast.error("Failed to generate. Try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => {
    if (questions.length === 0) {
      toast.error("Generate questions first");
      return;
    }
    onPublish(questions);
    window.dispatchEvent(new CustomEvent("viva:update", { detail: { questions } }));
    setPublished(true);
    toast.success("Viva published to students");
  };

  const resetViva = () => {
    setPublished(false);
    setQuestions([]);
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold uppercase text-muted-foreground">
        Teacher Viva · শিক্ষকের প্রশ্ন
      </h3>

      {!published ? (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Topic</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Number of questions ({count})</Label>
            <Input
              type="range"
              min={3}
              max={10}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={loading} size="sm" className="flex-1">
              <Sparkles className="mr-1 h-4 w-4" />
              {loading ? "Generating..." : "Generate · তৈরি করুন"}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={questions.length === 0}
              size="sm"
              variant="default"
            >
              <Send className="mr-1 h-4 w-4" /> Publish
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs">
          <span className="font-medium text-emerald-700">
            ✓ Published · প্রকাশিত ({questions.length} questions)
          </span>
          <Button onClick={resetViva} size="sm" variant="ghost">
            New set
          </Button>
        </div>
      )}

      {questions.length > 0 && (
        <ol className="max-h-64 list-decimal space-y-2 overflow-auto pl-5 text-xs">
          {questions.map((q, i) => (
            <li key={i} className="space-y-0.5">
              <p className="font-medium">{q.q}</p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground/70">Answer · উত্তর:</span>{" "}
                {q.expected}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
