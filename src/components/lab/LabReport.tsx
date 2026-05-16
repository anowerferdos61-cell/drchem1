import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, RotateCcw } from "lucide-react";
import type { Report } from "./types";

interface Props {
  report: Report;
  onReset: () => void;
}

export default function LabReport({ report, onReset }: Props) {
  const min = Math.floor(report.durationSec / 60);
  const sec = report.durationSec % 60;
  return (
    <Card className="p-6 space-y-4 print:shadow-none print:border-0">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Lab Report · ল্যাব রিপোর্ট</h2>
          <p className="text-xs text-muted-foreground">
            Acid–Base Titration · অ্যাসিড-ক্ষার টাইট্রেশন
          </p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-primary">{report.grade}</div>
          <div className="text-xs text-muted-foreground">Grade · গ্রেড</div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric label="Final Vb" value={`${report.Vb_final.toFixed(2)} mL`} />
        <Metric label="Equivalence Ve" value={`${report.Ve.toFixed(2)} mL`} />
        <Metric label="Accuracy" value={`${report.accuracy.toFixed(1)}%`} />
        <Metric label="Duration" value={`${min}m ${sec}s`} />
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Steps</h3>
        <ul className="space-y-1 text-sm">
          {report.steps.map((s) => (
            <li key={s.id}>
              {s.done ? "✅" : "⬜"} {s.label}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Mistakes</h3>
        {report.mistakes.length === 0 ? (
          <p className="text-sm text-emerald-600">No mistakes recorded — excellent technique!</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="py-1">Time</th>
                <th>Type</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {report.mistakes.map((m, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1 font-mono text-xs">
                    {new Date(m.ts).toLocaleTimeString()}
                  </td>
                  <td>{m.message}</td>
                  <td>
                    <span
                      className={[
                        "rounded px-2 py-0.5 text-xs",
                        m.severity === "high"
                          ? "bg-destructive/15 text-destructive"
                          : m.severity === "med"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-muted",
                      ].join(" ")}
                    >
                      {m.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="flex gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> Print · প্রিন্ট
        </Button>
        <Button onClick={onReset}>
          <RotateCcw className="mr-1 h-4 w-4" /> Redo · পুনরায় শুরু
        </Button>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-mono text-lg">{value}</div>
    </div>
  );
}
