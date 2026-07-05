/**
 * Chapter 6 — Avogadro Number & Mole Concept Lab
 * Interactive: pick substance × moles → visualise mass, particle count, math.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Scale,
  Beaker,
  Atom,
  TrendingUp,
  FileText,
  FlaskConical,
  Sparkles,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Data ────────────────────────────────────────────────────
type SubKey = "carbon" | "water" | "nacl";
interface Substance {
  key: SubKey;
  name: string;
  nameBn: string;
  formula: string;
  molarMass: number; // g/mol
  unit: string; // atoms / molecules / formula units
  unitBn: string;
  color: string; // tailwind text/border accent
  chip: string; // gradient bg
  particleColor: string; // hex fill
  swatch: React.ReactNode;
}

const SUBS: Record<SubKey, Substance> = {
  carbon: {
    key: "carbon",
    name: "Carbon",
    nameBn: "কার্বন",
    formula: "C",
    molarMass: 12,
    unit: "atoms",
    unitBn: "পরমাণু",
    color: "text-slate-800 dark:text-slate-200",
    chip: "from-slate-800 to-neutral-900",
    particleColor: "#111827",
    swatch: (
      <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 to-neutral-900 shadow-inner">
        <span className="absolute inset-0 grid place-items-center text-[10px] font-black text-white/80">C</span>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-slate-500/60 blur-[2px]" />
      </div>
    ),
  },
  water: {
    key: "water",
    name: "Water",
    nameBn: "পানি",
    formula: "H₂O",
    molarMass: 18,
    unit: "molecules",
    unitBn: "অণু",
    color: "text-sky-600 dark:text-sky-300",
    chip: "from-sky-500 to-cyan-500",
    particleColor: "#0ea5e9",
    swatch: (
      <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gradient-to-b from-sky-100 to-sky-300 shadow-inner">
        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-sky-500/70 to-sky-300/40" />
        <span className="absolute inset-0 grid place-items-center text-[10px] font-black text-sky-900">H₂O</span>
      </div>
    ),
  },
  nacl: {
    key: "nacl",
    name: "Sodium Chloride",
    nameBn: "সোডিয়াম ক্লোরাইড",
    formula: "NaCl",
    molarMass: 58.5,
    unit: "formula units",
    unitBn: "সূত্র-একক",
    color: "text-amber-600 dark:text-amber-300",
    chip: "from-amber-400 to-yellow-500",
    particleColor: "#f59e0b",
    swatch: (
      <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gradient-to-br from-white to-amber-100 shadow-inner ring-1 ring-amber-200">
        <span className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] p-[3px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="rounded-[1px] bg-amber-300/70" />
          ))}
        </span>
      </div>
    ),
  },
};

const NA = 6.023e23;
const MOLE_OPTIONS = [0.5, 1.0, 2.0];

// ── Helpers ─────────────────────────────────────────────────
function formatSci(x: number): { m: string; e: number } {
  if (x === 0) return { m: "0", e: 0 };
  const e = Math.floor(Math.log10(x));
  const m = x / Math.pow(10, e);
  return { m: m.toFixed(4).replace(/\.?0+$/, ""), e };
}

function SciNumber({ value, className }: { value: number; className?: string }) {
  const { m, e } = formatSci(value);
  return (
    <span className={cn("tabular-nums", className)}>
      {m} × 10<sup className="text-[0.6em]">{e}</sup>
    </span>
  );
}

// Counter with rAF animation, locks onto target
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(target);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const from = val;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setVal(target);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

// ── Particle field (SVG, floating) ──────────────────────────
function ParticleField({ sub, count }: { sub: Substance; count: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (t: number) => {
      setTick((t - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const particles = useMemo(() => {
    const rng = mulberry32(sub.key.charCodeAt(0) * 97 + count);
    return Array.from({ length: count }).map(() => ({
      x: rng() * 100,
      y: rng() * 100,
      r: 1.4 + rng() * 1.6,
      phase: rng() * Math.PI * 2,
      speed: 0.4 + rng() * 0.8,
      hueShift: (rng() - 0.5) * 20,
    }));
  }, [sub.key, count]);

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <radialGradient id="pf-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={sub.particleColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={sub.particleColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {particles.map((p, i) => {
        const dx = Math.sin(tick * p.speed + p.phase) * 2.5;
        const dy = Math.cos(tick * p.speed * 0.8 + p.phase) * 2.5;
        return (
          <g key={i} transform={`translate(${p.x + dx} ${p.y + dy})`}>
            <circle r={p.r * 2.2} fill="url(#pf-glow)" opacity={0.5} />
            <circle r={p.r} fill={sub.particleColor} />
          </g>
        );
      })}
    </svg>
  );
}

// Deterministic PRNG
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Component ──────────────────────────────────────────────
export default function MoleConceptLab({ onBack }: { onBack: () => void }) {
  const [sub, setSub] = useState<SubKey | null>("water");
  const [moleIdx, setMoleIdx] = useState(1); // default 1.0 mol
  const [tab, setTab] = useState<"equipment" | "lab" | "data">("lab");

  const substance = sub ? SUBS[sub] : null;
  const moles = MOLE_OPTIONS[moleIdx];
  const mass = substance ? substance.molarMass * moles : 0;
  const particleTarget = substance ? moles * NA : 0;
  const displayCount = useCountUp(particleTarget);
  const particleVisual = Math.round(40 * moles); // 20 / 40 / 80

  const place = (k: SubKey) => {
    setSub(k);
    setTab("lab");
    toast.success(`${SUBS[k].nameBn} স্কেলে বসানো হয়েছে`);
  };

  const generateReport = () => {
    if (!substance) {
      toast.error("প্রথমে একটি পদার্থ নির্বাচন করো");
      return;
    }
    toast.success("Lab Report তৈরি হয়েছে ✓", {
      description: `${moles} mol ${substance.formula} = ${mass.toFixed(2)} g`,
    });
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-background dark:to-emerald-950/40 lg:h-[100dvh] lg:overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 shrink-0 border-b bg-background/85 backdrop-blur-xl lg:static">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 h-8 shrink-0 gap-1 px-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden text-xs sm:inline">Back</span>
            </Button>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
              <Atom className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-extrabold tracking-tight sm:text-base">
                অ্যাভোগেড্রো সংখ্যা ও মোল ধারণা
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                Ch 6 · Avogadro Number & Mole Concept Lab
              </div>
            </div>
          </div>
          <Badge className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            n = W/M
          </Badge>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 p-2 pb-24 sm:p-3 lg:min-h-0 lg:overflow-hidden lg:pb-3">
        <div className="flex h-full flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,0.95fr)] lg:grid-rows-1 lg:gap-3">
          {/* EQUIPMENT — hidden on mobile unless tab active */}
          <aside
            className={cn(
              "flex-col gap-3 lg:order-1 lg:flex lg:min-h-0 lg:overflow-y-auto lg:pr-1",
              tab === "equipment" ? "flex" : "hidden lg:flex",
            )}
          >
            <EquipmentPanel active={sub} onPlace={place} />
          </aside>

          {/* LAB (visual) */}
          <section
            className={cn(
              "relative min-h-0 min-w-0 items-center justify-center lg:order-2 lg:flex",
              tab === "lab" ? "flex flex-col" : "hidden lg:flex",
            )}
          >
            <div className="flex w-full flex-col items-center justify-center gap-3" style={{ height: "min(70vh, 460px)" }}>
              <VisualStage
                substance={substance}
                mass={mass}
                particleCount={particleVisual}
                displayCount={displayCount}
                moles={moles}
              />
            </div>
            <AiHint substance={substance} moles={moles} mass={mass} />
          </section>

          {/* DATA / CONTROLS */}
          <aside
            className={cn(
              "flex-col gap-3 lg:order-3 lg:flex lg:min-h-0 lg:overflow-y-auto lg:pl-1",
              tab === "data" ? "flex" : "hidden lg:flex",
            )}
          >
            <ControlsPanel moleIdx={moleIdx} setMoleIdx={setMoleIdx} substance={substance} />
            <DataTable substance={substance} moles={moles} mass={mass} particles={particleTarget} />
            <Button
              onClick={generateReport}
              className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:opacity-90"
            >
              <FileText className="h-4 w-4" /> Generate Lab Report
            </Button>
          </aside>
        </div>
      </main>

      {/* Bottom mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {(
            [
              { k: "equipment", label: "Equipment", icon: Beaker },
              { k: "lab", label: "Lab", icon: FlaskConical },
              { k: "data", label: "Data", icon: TrendingUp },
            ] as const
          ).map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                tab === k ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ── Equipment Panel ─────────────────────────────────────────
function EquipmentPanel({ active, onPlace }: { active: SubKey | null; onPlace: (k: SubKey) => void }) {
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center gap-2">
        <Beaker className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-bold">Substance Shelf</h3>
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Tap any container to place it on the scale.
      </p>
      <div className="flex flex-col gap-2">
        {(Object.keys(SUBS) as SubKey[]).map((k) => {
          const s = SUBS[k];
          const isActive = active === k;
          return (
            <button
              key={k}
              onClick={() => onPlace(k)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all",
                isActive
                  ? "border-emerald-500/60 bg-emerald-500/5 shadow-sm"
                  : "border-border hover:border-emerald-500/40 hover:bg-muted/40",
              )}
            >
              {s.swatch}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <span className="truncate">{s.nameBn}</span>
                  <span className="text-xs text-muted-foreground">({s.formula})</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  M = {s.molarMass} g/mol
                </div>
              </div>
              {isActive && <Sparkles className="h-4 w-4 text-emerald-500" />}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── Visual Stage: Scale + Particle Viewer ───────────────────
function VisualStage({
  substance,
  mass,
  particleCount,
  displayCount,
  moles,
}: {
  substance: Substance | null;
  mass: number;
  particleCount: number;
  displayCount: number;
  moles: number;
}) {
  const { m, e } = formatSci(displayCount);
  return (
    <div className="grid h-full w-full grid-rows-[auto_minmax(0,1fr)] gap-2">
      {/* Scale */}
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border bg-gradient-to-b from-neutral-100 to-neutral-200 p-3 shadow-inner dark:from-slate-800 dark:to-slate-900">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1">
              <Scale className="h-3 w-3" /> Digital Balance
            </span>
            <span className={cn("text-emerald-500", substance ? "opacity-100" : "opacity-40")}>
              ● READY
            </span>
          </div>
          {/* Pan */}
          <div className="relative mx-auto flex h-16 items-end justify-center">
            <div className="absolute bottom-6 h-1.5 w-40 rounded-full bg-neutral-400/60 dark:bg-slate-700" />
            <div className="absolute bottom-7 h-8 w-32 rounded-t-2xl border border-neutral-300 bg-gradient-to-b from-white to-neutral-200 shadow-md dark:border-slate-600 dark:from-slate-700 dark:to-slate-800" />
            {substance && (
              <div
                key={substance.key + moles}
                className={cn(
                  "absolute bottom-9 flex h-10 w-24 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-black text-white shadow-lg animate-in fade-in zoom-in-95 duration-500",
                  substance.chip,
                )}
                style={{ transform: `scaleY(${0.6 + Math.min(moles, 2) * 0.2})`, transformOrigin: "bottom" }}
              >
                {substance.formula}
              </div>
            )}
          </div>
          {/* LCD */}
          <div className="mt-2 rounded-lg border border-emerald-900/30 bg-gradient-to-b from-emerald-950 to-black px-3 py-2 font-mono shadow-inner">
            <div className="flex items-baseline justify-end gap-1 text-emerald-300">
              <span className="text-2xl font-black tabular-nums drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]">
                {mass.toFixed(2)}
              </span>
              <span className="text-xs opacity-80">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Particle Viewer */}
      <div className="relative min-h-0 overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-950 to-black shadow-lg">
        {substance ? (
          <>
            <ParticleField sub={substance} count={particleCount} />
            {/* Overlay counter */}
            <div className="pointer-events-none absolute inset-x-0 top-1.5 flex flex-col items-center gap-0.5 px-3 text-center">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/70 backdrop-blur">
                Particle Count
              </span>
              <div className="font-mono text-lg font-black text-white drop-shadow sm:text-2xl">
                {m} × 10<sup className="text-[0.55em]">{e}</sup>
              </div>
              <span className="text-[10px] text-white/70">{substance.unit} · {substance.unitBn}</span>
            </div>
            <div className="pointer-events-none absolute bottom-1.5 left-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
              🔬 Zoom-in view
            </div>
            <div className="pointer-events-none absolute bottom-1.5 right-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
              {moles} mol
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-white/60">
            <Beaker className="h-8 w-8" />
            <p className="text-xs">
              Equipment shelf থেকে একটি পদার্থ বেছে নাও
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Controls (moles selector) ───────────────────────────────
function ControlsPanel({
  moleIdx,
  setMoleIdx,
  substance,
}: {
  moleIdx: number;
  setMoleIdx: (n: number) => void;
  substance: Substance | null;
}) {
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-bold">Amount (mol)</h3>
        </div>
        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">
          {MOLE_OPTIONS[moleIdx].toFixed(1)} mol
        </span>
      </div>

      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {MOLE_OPTIONS.map((v, i) => (
          <button
            key={v}
            onClick={() => setMoleIdx(i)}
            className={cn(
              "rounded-lg border py-1.5 text-xs font-bold transition-all tabular-nums",
              moleIdx === i
                ? "border-emerald-500 bg-emerald-500 text-white shadow"
                : "border-border bg-background hover:border-emerald-400",
            )}
          >
            {v} mol
          </button>
        ))}
      </div>

      <Slider
        min={0}
        max={2}
        step={1}
        value={[moleIdx]}
        onValueChange={(v) => setMoleIdx(v[0])}
        className="mt-1"
      />

      {substance && (
        <div className="mt-3 rounded-lg border bg-muted/40 p-2 text-[11px] leading-relaxed">
          <div className="font-mono">
            W = n × M = {MOLE_OPTIONS[moleIdx]} × {substance.molarMass} ={" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-300">
              {(MOLE_OPTIONS[moleIdx] * substance.molarMass).toFixed(2)} g
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Data Table ──────────────────────────────────────────────
function DataTable({
  substance,
  moles,
  mass,
  particles,
}: {
  substance: Substance | null;
  moles: number;
  mass: number;
  particles: number;
}) {
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-bold">Live Calculations</h3>
      </div>
      {substance ? (
        <div className="space-y-1.5 text-xs">
          <Row label="Substance" value={`${substance.nameBn} (${substance.formula})`} />
          <Row label="Given Mass (W)" value={`${mass.toFixed(2)} g`} accent />
          <Row label="Molar Mass (M)" value={`${substance.molarMass} g/mol`} />
          <Row label="Moles (n = W/M)" value={`${moles.toFixed(2)} mol`} accent />
          <Row
            label={`Particles (N = n × Nₐ)`}
            value={<SciNumber value={particles} className="font-bold text-emerald-600 dark:text-emerald-300" />}
          />
          <div className="mt-2 rounded-lg border border-dashed p-2 text-[10.5px] text-muted-foreground">
            Nₐ = 6.023 × 10²³ /mol · {substance.unit}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">পদার্থ নির্বাচন করলে হিসাব দেখাবে।</p>
      )}
    </Card>
  );
}

function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-dashed border-border/60 pb-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", accent && "font-bold text-emerald-600 dark:text-emerald-300")}>
        {value}
      </span>
    </div>
  );
}

// ── AI Hint (inline, static logic) ──────────────────────────
function AiHint({
  substance,
  moles,
  mass,
}: {
  substance: Substance | null;
  moles: number;
  mass: number;
}) {
  if (!substance) return null;
  const hint = buildHint(substance, moles, mass);
  return (
    <div className="mx-auto mt-2 flex w-full max-w-xl items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-[11.5px] leading-relaxed shadow-sm">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div>
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
          Lab AI Assistant
        </div>
        <p className="text-foreground/90">{hint}</p>
      </div>
    </div>
  );
}

function buildHint(s: Substance, moles: number, mass: number): string {
  const totalParticles = moles * NA;
  const { m, e } = formatSci(totalParticles);
  if (moles === 1) {
    return `তুমি ১ মোল ${s.nameBn} মেপেছ, যার ভর ${mass.toFixed(2)} গ্রাম। খেয়াল করো — ${s.nameBn}-এর ${s.unitBn} সংখ্যা ঠিক ${m} × 10^${e} টি, ঠিক Avogadro's Number!`;
  }
  if (moles === 0.5) {
    return `০.৫ মোল ${s.nameBn} = ${mass.toFixed(2)} g। অর্ধেক মোল মানে অর্ধেক Nₐ = ${m} × 10^${e} ${s.unitBn}। ভর কমেছে কিন্তু হিসাব একই সূত্রে।`;
  }
  return `২ মোল ${s.nameBn} = ${mass.toFixed(2)} g। এবার ${s.unitBn} দ্বিগুণ — ${m} × 10^${e}। n বাড়লে N ঠিক সমানুপাতে বাড়ে (N = n × Nₐ)।`;
}
