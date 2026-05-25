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
  const isOxygen = report.experiment === "oxygen_prep";
  const isCO2 = report.experiment === "co2_prep";
  const isNaCl = report.experiment === "nacl_crystal";
  const isIonic = report.experiment === "ionic_covalent";
  const isNa2CO3 = report.experiment === "na2co3_standard";

  const title = isNa2CO3
    ? "0.1 M Na₂CO₃ Standard Solution · প্রমাণ দ্রবণ"
    : isIonic
      ? "Ionic vs Covalent · আয়নিক ও সমযোজী যৌগ"
      : isNaCl
        ? "NaCl Crystallisation · সোডিয়াম ক্লোরাইডের কেলাস"
        : isCO2
          ? "Preparation of CO₂ · কার্বন ডাইঅক্সাইড প্রস্তুতি"
          : isOxygen
            ? "Preparation of Oxygen · অক্সিজেন প্রস্তুতি"
            : "Acid–Base Titration · অ্যাসিড-ক্ষার টাইট্রেশন";

  return (
    <Card className="space-y-4 p-6 print:border-0 print:shadow-none">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Lab Report · ল্যাব রিপোর্ট</h2>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-primary">{report.grade}</div>
          <div className="text-xs text-muted-foreground">Grade · গ্রেড</div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        {isNa2CO3 ? (
          <>
            <Metric label="Mass (W)" value={`${(report.actualMassG ?? 0).toFixed(3)} g`} />
            <Metric label="Volume (V)" value={`${(report.actualVolumeMl ?? 0).toFixed(1)} mL`} />
            <Metric label="Final Molarity" value={`${(report.finalMolarity ?? 0).toFixed(3)} M`} />
            <Metric label="Accuracy" value={`${report.accuracy.toFixed(1)}%`} />
          </>
        ) : isIonic ? (
          <>
            <Metric label="Solubility" value={`${(report.solubilityScore ?? 0).toFixed(0)}%`} />
            <Metric label="Conductivity" value={`${(report.conductivityScore ?? 0).toFixed(0)}%`} />
            <Metric label="Melting" value={`${(report.meltingScore ?? 0).toFixed(0)}%`} />
            <Metric label="Cu deposit" value={`${(report.copperDepositPct ?? 0).toFixed(0)}%`} />
          </>
        ) : isNaCl ? (
          <>
            <Metric label="বাষ্পীভবন" value={`${report.volumeReductionPct ?? 0}%`} />
            <Metric label="Crystal quality" value={`${(report.crystalQuality ?? 0).toFixed(0)}%`} />
            <Metric label="Seed crystal" value={report.seedUsed ? "✓ Added" : "✗ None"} />
            <Metric label="Accuracy" value={`${report.accuracy.toFixed(1)}%`} />
          </>
        ) : isCO2 ? (
          <>
            <Metric label="CO₂ Collected" value={`${(report.VCO2_final ?? 0).toFixed(1)} mL`} />
            <Metric label="Target" value={`${(report.VCO2_target ?? 0).toFixed(0)} mL`} />
            <Metric
              label="Tests passed"
              value={`${
                report.tests
                  ? Object.values(report.tests).filter((r) => r === "pass").length
                  : 0
              } / 4`}
            />
            <Metric label="Accuracy" value={`${report.accuracy.toFixed(1)}%`} />
          </>
        ) : isOxygen ? (
          <>
            <Metric label="O₂ Collected" value={`${(report.VO2_final ?? 0).toFixed(1)} mL`} />
            <Metric label="Target" value={`${(report.VO2_target ?? 0).toFixed(0)} mL`} />
            <Metric
              label="Splint test"
              value={
                report.splintResult === "pass"
                  ? "✓ Passed"
                  : report.splintResult === "early"
                    ? "Too early"
                    : "Not tested"
              }
            />
            <Metric label="Accuracy" value={`${report.accuracy.toFixed(1)}%`} />
          </>
        ) : (
          <>
            <Metric label="Final Vb" value={`${(report.Vb_final ?? 0).toFixed(2)} mL`} />
            <Metric label="Equivalence Ve" value={`${(report.Ve ?? 0).toFixed(2)} mL`} />
            <Metric label="Accuracy" value={`${report.accuracy.toFixed(1)}%`} />
            <Metric label="Duration" value={`${min}m ${sec}s`} />
          </>
        )}
      </div>

      {isNa2CO3 && (
        <section className="rounded-xl border bg-gradient-to-br from-emerald-50 to-sky-50 p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
            Molarity Calculation · মোলারিটি গণনা
          </h3>
          <div className="space-y-2 text-center">
            <div className="text-lg italic text-slate-700">
              <span className="font-serif">S</span>
              <span className="mx-2">=</span>
              <span className="inline-flex flex-col text-base">
                <span className="border-b border-slate-400 px-2 font-mono">1000 × W</span>
                <span className="px-2 font-mono">106 × V</span>
              </span>
              <span className="mx-2">=</span>
              <span className="inline-flex flex-col text-base">
                <span className="border-b border-slate-400 px-2 font-mono">
                  1000 × {(report.actualMassG ?? 0).toFixed(3)}
                </span>
                <span className="px-2 font-mono">
                  106 × {(report.actualVolumeMl ?? 250).toFixed(1)}
                </span>
              </span>
              <span className="mx-2">=</span>
              <span className="font-mono font-bold text-emerald-700">
                {(report.finalMolarity ?? 0).toFixed(3)} M
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your final solution concentration is{" "}
              <span className="font-mono font-semibold text-foreground">
                {(report.finalMolarity ?? 0).toFixed(3)} M
              </span>{" "}
              (target 0.100 M · Δm = {(report.massError ?? 0).toFixed(3)} g · ΔV ={" "}
              {(report.volumeError ?? 0).toFixed(1)} mL).
            </p>
          </div>
        </section>
      )}

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
