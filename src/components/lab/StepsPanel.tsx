import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import type { Mistake, Step } from "./types";

interface Props {
  steps: Step[];
  mistakes: Mistake[];
  guideMode: boolean;
  nextHint?: string;
}

export default function StepsPanel({ steps, mistakes, guideMode, nextHint }: Props) {
  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
        Steps · ধাপ
      </h3>
      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.id} className="flex items-start gap-2 text-sm">
            {s.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}</span>
          </li>
        ))}
      </ul>

      {guideMode && nextHint && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-2 text-xs">
          💡 <span className="font-medium">Hint:</span> {nextHint}
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
          <AlertTriangle className="h-3 w-3" /> Mistakes · ভুল ({mistakes.length})
        </div>
        {mistakes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No mistakes yet — keep going!</p>
        ) : (
          <ul className="max-h-32 space-y-1 overflow-auto text-xs">
            {mistakes.map((m, i) => (
              <li
                key={i}
                className={[
                  "rounded border px-2 py-1",
                  m.severity === "high"
                    ? "border-destructive/40 bg-destructive/5"
                    : m.severity === "med"
                      ? "border-amber-400/40 bg-amber-50"
                      : "border-border bg-muted",
                ].join(" ")}
              >
                {m.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
