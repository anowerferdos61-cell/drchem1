import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Props {
  Vb: number;
  Ve: number;
  pH: number;
  Ma: number;
  Va: number;
  Mb: number;
  timer: number;
}

function fmt(n: number, d = 2) {
  return n.toFixed(d);
}

export default function StatusPanel({ Vb, Ve, pH, Ma, Va, Mb, timer }: Props) {
  const pct = Math.min(100, (Vb / Math.max(Ve * 1.2, 1)) * 100);
  const min = Math.floor(timer / 60);
  const sec = timer % 60;
  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
        Live Data · সরাসরি তথ্য
      </h3>

      <div className="lcd-font rounded-lg bg-[oklch(0.18_0.05_145)] p-3 text-[oklch(0.92_0.18_145)] shadow-inner">
        <div className="flex justify-between text-xs opacity-70">
          <span>Vb (mL)</span>
          <span>pH</span>
        </div>
        <div className="flex justify-between text-2xl font-bold">
          <span>{fmt(Vb)}</span>
          <span>{fmt(pH, 2)}</span>
        </div>
      </div>

      <Progress value={pct} />

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Ma" value={`${fmt(Ma, 3)} M`} />
        <Stat label="Va" value={`${fmt(Va, 1)} mL`} />
        <Stat label="Mb" value={`${fmt(Mb, 3)} M`} />
        <Stat label="Ve" value={`${fmt(Ve, 2)} mL`} />
      </div>

      <div className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs">
        <span>Timer · সময়</span>
        <span className="font-mono">{`${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`}</span>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-card p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
