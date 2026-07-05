/**
 * Chapter 6 — Limiting Reactant & Yield Predictor Lab
 * 2 H₂ + O₂ → 2 H₂O
 * Molecular collision canvas + stoichiometric math + %-yield calculator.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  FlaskConical,
  Sparkles,
  Bot,
  Beaker,
  Calculator,
  Minus,
  Plus,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ── Constants ───────────────────────────────────────────────
const M_H2 = 2;
const M_O2 = 32;
const M_H2O = 18;

// ── Types ───────────────────────────────────────────────────
type Kind = "H2" | "O2" | "H2O";
interface Mol {
  id: number;
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  angle: number;
  spin: number;
  bornAt?: number; // fade-in
  limiting?: boolean; // outline highlight
}

// Simple hash id
let _uid = 0;
const uid = () => ++_uid;

// ── Reaction Canvas ─────────────────────────────────────────
function ReactionCanvas({
  h2Count,
  o2Count,
  running,
  onReactionEnd,
  limitingKind,
  paused,
}: {
  h2Count: number;
  o2Count: number;
  running: boolean;
  onReactionEnd: (produced: number) => void;
  limitingKind: Kind | null;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const molsRef = useRef<Mol[]>([]);
  const rafRef = useRef<number>(0);
  const producedRef = useRef(0);
  const endedRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 640, h: 380 });

  // Resize observer
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: Math.max(280, Math.floor(cr.width)), h: Math.max(240, Math.floor(cr.height)) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // (Re)seed molecules whenever counts change or user resets
  useEffect(() => {
    const W = size.w;
    const H = size.h;
    const mols: Mol[] = [];
    const seed = (kind: Kind, n: number) => {
      for (let i = 0; i < n; i++) {
        const r = kind === "O2" ? 18 : kind === "H2" ? 12 : 16;
        mols.push({
          id: uid(),
          kind,
          x: r + Math.random() * (W - 2 * r),
          y: r + Math.random() * (H - 2 * r),
          vx: (Math.random() - 0.5) * 1.1,
          vy: (Math.random() - 0.5) * 1.1,
          r,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.03,
        });
      }
    };
    seed("H2", h2Count);
    seed("O2", o2Count);
    molsRef.current = mols;
    producedRef.current = 0;
    endedRef.current = false;
  }, [h2Count, o2Count, size.w, size.h]);

  // Animation loop
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    cvs.width = size.w * dpr;
    cvs.height = size.h * dpr;
    cvs.style.width = size.w + "px";
    cvs.style.height = size.h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let last = performance.now();

    const step = (t: number) => {
      const dt = Math.min(48, t - last);
      last = t;
      const W = size.w;
      const H = size.h;

      // Background
      const grad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H));
      grad.addColorStop(0, "#0b1220");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "rgba(148,163,184,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const mols = molsRef.current;
      const speedMul = running && !paused ? 3.2 : 0.8;

      // Move & wall-bounce
      for (const m of mols) {
        m.x += m.vx * speedMul * (dt / 16);
        m.y += m.vy * speedMul * (dt / 16);
        m.angle += m.spin * speedMul;
        if (m.x < m.r) { m.x = m.r; m.vx = Math.abs(m.vx); }
        if (m.x > W - m.r) { m.x = W - m.r; m.vx = -Math.abs(m.vx); }
        if (m.y < m.r) { m.y = m.r; m.vy = Math.abs(m.vy); }
        if (m.y > H - m.r) { m.y = H - m.r; m.vy = -Math.abs(m.vy); }
      }

      // Reactions: when an O2 touches ≥2 H2 within radius, react → 2 H2O
      if (running && !paused && !endedRef.current) {
        const toRemove = new Set<number>();
        const toAdd: Mol[] = [];
        for (const o of mols) {
          if (o.kind !== "O2" || toRemove.has(o.id)) continue;
          const hits: Mol[] = [];
          for (const h of mols) {
            if (h.kind !== "H2" || toRemove.has(h.id)) continue;
            const dx = h.x - o.x;
            const dy = h.y - o.y;
            const d = Math.hypot(dx, dy);
            if (d < o.r + h.r + 4) hits.push(h);
            if (hits.length >= 2) break;
          }
          if (hits.length >= 2) {
            toRemove.add(o.id);
            toRemove.add(hits[0].id);
            toRemove.add(hits[1].id);
            // Emit 2 H2O near the site
            for (let k = 0; k < 2; k++) {
              const ang = Math.random() * Math.PI * 2;
              toAdd.push({
                id: uid(),
                kind: "H2O",
                x: o.x + Math.cos(ang) * 8,
                y: o.y + Math.sin(ang) * 8,
                vx: (Math.random() - 0.5) * 1.4,
                vy: (Math.random() - 0.5) * 1.4,
                r: 16,
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.04,
                bornAt: t,
              });
            }
            producedRef.current += 2;
          }
        }
        if (toRemove.size) {
          molsRef.current = mols.filter((m) => !toRemove.has(m.id)).concat(toAdd);
        }

        // End detection
        const hasH2 = molsRef.current.some((m) => m.kind === "H2");
        const hasO2 = molsRef.current.some((m) => m.kind === "O2");
        if (!hasH2 || !hasO2) {
          // no more possible reactions (need 2 H2 + 1 O2)
          endedRef.current = true;
          onReactionEnd(producedRef.current);
        }
      }

      // Draw molecules
      for (const m of molsRef.current) {
        const born = m.bornAt ? Math.min(1, (t - m.bornAt) / 300) : 1;
        drawMolecule(ctx, m, born, limitingKind);
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size.w, size.h, running, paused, onReactionEnd, limitingKind]);

  // HUD overlay counts
  const counts = countByKind(molsRef.current);

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-inner"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
        <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-cyan-200 ring-1 ring-cyan-400/30">
          H₂ : {counts.H2}
        </span>
        <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-rose-200 ring-1 ring-rose-400/30">
          O₂ : {counts.O2}
        </span>
        <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-sky-200 ring-1 ring-sky-400/30">
          H₂O : {counts.H2O}
        </span>
      </div>
      {limitingKind && running && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-red-500/90 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-lg ring-1 ring-red-300/40 animate-pulse">
          Limiting: {limitingKind === "H2" ? "H₂" : "O₂"}
        </div>
      )}
    </div>
  );
}

function countByKind(mols: Mol[]) {
  const c = { H2: 0, O2: 0, H2O: 0 };
  for (const m of mols) c[m.kind]++;
  return c;
}

function drawMolecule(
  ctx: CanvasRenderingContext2D,
  m: Mol,
  alpha: number,
  limitingKind: Kind | null,
) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(m.angle);
  ctx.globalAlpha = alpha;

  const isLimiting = limitingKind && limitingKind === m.kind;

  if (m.kind === "H2") {
    // two cyan spheres
    const off = 6;
    drawAtom(ctx, -off, 0, 8, "#67e8f9", "#0891b2");
    drawAtom(ctx, off, 0, 8, "#67e8f9", "#0891b2");
    strokeBond(ctx, -off, 0, off, 0, "#a5f3fc");
    if (isLimiting) glow(ctx, 0, 0, 20, "rgba(239,68,68,0.9)");
  } else if (m.kind === "O2") {
    const off = 9;
    drawAtom(ctx, -off, 0, 12, "#fb923c", "#c2410c");
    drawAtom(ctx, off, 0, 12, "#fb923c", "#c2410c");
    strokeBond(ctx, -off, 0, off, 0, "#fdba74");
    if (isLimiting) glow(ctx, 0, 0, 26, "rgba(239,68,68,0.9)");
  } else {
    // H2O: V-shape, central O with two H
    drawAtom(ctx, 0, 0, 11, "#f87171", "#991b1b"); // O
    const a = Math.PI / 4;
    const d = 12;
    const hx1 = -Math.cos(a) * d;
    const hy1 = Math.sin(a) * d;
    const hx2 = Math.cos(a) * d;
    const hy2 = Math.sin(a) * d;
    strokeBond(ctx, 0, 0, hx1, hy1, "#fecaca");
    strokeBond(ctx, 0, 0, hx2, hy2, "#fecaca");
    drawAtom(ctx, hx1, hy1, 6, "#e0f2fe", "#38bdf8");
    drawAtom(ctx, hx2, hy2, 6, "#e0f2fe", "#38bdf8");
  }

  ctx.restore();
}

function drawAtom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  light: string,
  dark: string,
) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function strokeBond(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ── Math Helpers ────────────────────────────────────────────
function computeLimiting(h2: number, o2: number): {
  limiting: "H2" | "O2";
  maxH2O: number;
  h2Used: number;
  o2Used: number;
  h2Excess: number;
  o2Excess: number;
} {
  // 2 H2 + O2 -> 2 H2O
  const byH2 = h2; // each 2 H2 makes 2 H2O so H2O_from_H2 = h2 (in molecules)
  const byO2 = o2 * 2; // each O2 makes 2 H2O
  if (byH2 <= byO2) {
    // H2 limits
    const maxH2O = byH2; // molecules
    const o2Used = Math.floor(h2 / 2);
    return {
      limiting: "H2",
      maxH2O,
      h2Used: h2,
      o2Used,
      h2Excess: 0,
      o2Excess: o2 - o2Used,
    };
  } else {
    // O2 limits
    const maxH2O = byO2;
    const h2Used = o2 * 2;
    return {
      limiting: "O2",
      maxH2O,
      h2Used,
      o2Used: o2,
      h2Excess: h2 - h2Used,
      o2Excess: 0,
    };
  }
}

// ── Counter Control ─────────────────────────────────────────
function Counter({
  label,
  labelBn,
  value,
  onChange,
  tint,
  formula,
}: {
  label: string;
  labelBn: string;
  value: number;
  onChange: (v: number) => void;
  tint: string;
  formula: string;
}) {
  return (
    <div className={cn("rounded-xl border p-3", tint)}>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground">
            {label} · {labelBn}
          </div>
          <div className="text-lg font-black tracking-tight">{formula}</div>
        </div>
        <div className="text-2xl font-black tabular-nums">{value}</div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Slider
          value={[value]}
          min={1}
          max={20}
          step={1}
          onValueChange={(v) => onChange(v[0])}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(Math.min(20, value + 1))}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function LimitingReactantLab({ onBack }: { onBack: () => void }) {
  const [h2, setH2] = useState(4);
  const [o2, setO2] = useState(5);
  const [efficiency, setEfficiency] = useState(80); // 50..100
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [producedMolecules, setProducedMolecules] = useState(0);
  const [reactionEnded, setReactionEnded] = useState(false);
  const [tab, setTab] = useState<"reactants" | "sim" | "math">("sim");

  const stoich = useMemo(() => computeLimiting(h2, o2), [h2, o2]);

  const start = useCallback(() => {
    setProducedMolecules(0);
    setReactionEnded(false);
    setRunning(true);
    setPaused(false);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setPaused(false);
    setProducedMolecules(0);
    setReactionEnded(false);
  }, []);

  const onReactionEnd = useCallback((produced: number) => {
    setProducedMolecules(produced);
    setReactionEnded(true);
    setPaused(true);
  }, []);

  // Molecule -> mass (per-molecule mass in g using molar mass / Nₐ omitted; we treat 1 "molecule" ≈ 1 mole scaled — use mass in g for 1 mole per molecule for clarity)
  // Educational simplification: show mass as if each molecule = 1 mole
  const theoreticalMoles = stoich.maxH2O;
  const theoreticalMassG = theoreticalMoles * M_H2O;
  const actualMoles = (theoreticalMoles * efficiency) / 100;
  const actualMassG = (theoreticalMassG * efficiency) / 100;
  const yieldPct = efficiency;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 dark:from-slate-950 dark:via-background dark:to-slate-900 lg:h-[100dvh] lg:overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 shrink-0 border-b bg-background/85 backdrop-blur-xl lg:static">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 h-8 shrink-0 gap-1 px-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Back</span>
            </Button>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 shadow-md">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-extrabold tracking-tight sm:text-base">
                লিমিটিং বিক্রিয়ক ও উৎপাদ নির্ণয়
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                Ch 6 · Limiting Reactant & Yield Predictor · 2H₂ + O₂ → 2H₂O
              </div>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 gap-1 border font-mono text-[11px]",
              stoich.limiting === "H2"
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                : "border-orange-400/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
            )}
          >
            <Sparkles className="h-3 w-3" />
            Limiting: {stoich.limiting === "H2" ? "H₂" : "O₂"}
          </Badge>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="sticky top-[52px] z-10 flex border-b bg-background/85 backdrop-blur lg:hidden">
        {(
          [
            { id: "reactants", label: "Reactants", icon: Beaker },
            { id: "sim", label: "Simulation", icon: FlaskConical },
            { id: "math", label: "Math & Yield", icon: Calculator },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 gap-1 flex items-center justify-center py-2 text-[11px] font-semibold transition",
                tab === t.id
                  ? "border-b-2 border-emerald-500 text-emerald-600"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <main className="flex-1 p-2 sm:p-3 lg:min-h-0 lg:overflow-hidden">
        <div className="flex flex-col gap-2 sm:gap-3 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,0.95fr)]">
          {/* LEFT — reactant panel */}
          <aside
            className={cn(
              "flex flex-col gap-2 lg:min-h-0 lg:overflow-y-auto lg:pr-1",
              tab !== "reactants" && "hidden lg:flex",
            )}
          >
            <Card className="p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Beaker className="h-3.5 w-3.5" /> Reactant Injector · বিক্রিয়ক
              </div>
              <div className="space-y-2">
                <Counter
                  label="Hydrogen"
                  labelBn="হাইড্রোজেন"
                  formula="H₂"
                  value={h2}
                  onChange={setH2}
                  tint="border-cyan-500/30 bg-cyan-500/5"
                />
                <Counter
                  label="Oxygen"
                  labelBn="অক্সিজেন"
                  formula="O₂"
                  value={o2}
                  onChange={setO2}
                  tint="border-orange-500/30 bg-orange-500/5"
                />
              </div>
            </Card>

            <Card className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Efficiency · দক্ষতা
                </div>
                <div className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                  {efficiency}%
                </div>
              </div>
              <Slider
                value={[efficiency]}
                min={50}
                max={100}
                step={1}
                onValueChange={(v) => setEfficiency(v[0])}
              />
              <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
                অপূর্ণ বিক্রিয়া, অপদ্রব্য এবং বাস্তবতা প্রকৃত উৎপাদ কমিয়ে দেয়।
              </p>
            </Card>

            <Card className="p-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={start}
                  className="h-10 gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 font-bold shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
                <Button variant="outline" onClick={reset} className="h-10 gap-1.5">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                বিক্রিয়া চলবে যতক্ষণ না লিমিটিং বিক্রিয়ক শেষ হয়।
              </p>
            </Card>

            <Card className="p-3 text-[11px] leading-relaxed">
              <div className="mb-1 font-semibold">Legend · চিহ্ন</div>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-4 rounded-full bg-gradient-to-r from-cyan-300 to-cyan-500" />
                  H₂ — cyan pair
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-4 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
                  O₂ — orange pair
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-4 rounded-full bg-gradient-to-r from-red-400 to-sky-400" />
                  H₂O — V-shape
                </li>
              </ul>
            </Card>
          </aside>

          {/* CENTER — simulation */}
          <section
            className={cn(
              "flex flex-col gap-2 lg:min-h-0",
              tab !== "sim" && "hidden lg:flex",
            )}
          >
            <div className="relative flex-1" style={{ minHeight: "min(70vh, 460px)" }}>
              <ReactionCanvas
                h2Count={h2}
                o2Count={o2}
                running={running}
                paused={paused}
                onReactionEnd={onReactionEnd}
                limitingKind={reactionEnded ? (stoich.limiting as Kind) : null}
              />
            </div>
          </section>

          {/* RIGHT — math */}
          <aside
            className={cn(
              "flex flex-col gap-2 lg:min-h-0 lg:overflow-y-auto lg:pl-1",
              tab !== "math" && "hidden lg:flex",
            )}
          >
            <Card className="p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Calculator className="h-3.5 w-3.5" /> Step 1 · অনুপাত যাচাই
              </div>
              <div className="rounded-lg bg-muted/50 p-2 font-mono text-[11px] leading-relaxed">
                <div>2 H₂ + O₂ → 2 H₂O</div>
                <div className="mt-1 text-muted-foreground">
                  Given: H₂ = {h2}, O₂ = {o2}
                </div>
                <div>
                  Ratio needed:{" "}
                  <span className="font-bold">
                    H₂/O₂ = 2/1 = 2.00
                  </span>
                </div>
                <div>
                  You have:{" "}
                  <span className="font-bold">
                    {(h2 / o2).toFixed(2)}
                  </span>{" "}
                  {h2 / o2 < 2 ? "→ H₂ কম → H₂ Limiting" : "→ O₂ কম → O₂ Limiting"}
                </div>
              </div>
              <div
                className={cn(
                  "mt-2 rounded-lg border-2 p-2 text-center text-sm font-black",
                  stoich.limiting === "H2"
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                    : "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300",
                )}
              >
                LIMITING REACTANT: {stoich.limiting === "H2" ? "H₂" : "O₂"}
              </div>
            </Card>

            <Card className="p-3">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 2 · Theoretical Yield · তাত্ত্বিক উৎপাদ
              </div>
              <div className="rounded-lg bg-muted/50 p-2 font-mono text-[11px] leading-relaxed">
                <div>
                  From {stoich.limiting === "H2" ? h2 + " H₂" : o2 + " O₂"} →{" "}
                  <span className="font-bold">{stoich.maxH2O} H₂O</span> molecules
                </div>
                <div className="mt-1">
                  Used: {stoich.h2Used} H₂ + {stoich.o2Used} O₂
                </div>
                <div>
                  Excess:{" "}
                  {stoich.h2Excess > 0 ? `${stoich.h2Excess} H₂ leftover` : ""}
                  {stoich.o2Excess > 0 ? `${stoich.o2Excess} O₂ leftover` : ""}
                  {stoich.h2Excess === 0 && stoich.o2Excess === 0 ? "0 (perfect ratio)" : ""}
                </div>
                <div className="mt-1 border-t border-dashed pt-1">
                  Mass H₂O ={" "}
                  <span className="font-bold">
                    {stoich.maxH2O} × {M_H2O} = {theoreticalMassG} g
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 3 · % Yield · শতকরা উৎপাদ
              </div>
              <div className="rounded-lg bg-muted/50 p-2 font-mono text-[11px] leading-relaxed">
                <div>% Yield = (Actual / Theoretical) × 100</div>
                <div className="mt-1">
                  Efficiency slider ={" "}
                  <span className="font-bold">{efficiency}%</span>
                </div>
                <div>
                  Actual mass = {theoreticalMassG} × {efficiency}/100 ={" "}
                  <span className="font-bold">{actualMassG.toFixed(2)} g</span>
                </div>
                <div>
                  Actual molecules ≈{" "}
                  <span className="font-bold">{actualMoles.toFixed(2)}</span>{" "}
                  H₂O
                </div>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                <div className="rounded-md bg-sky-500/10 p-1.5 ring-1 ring-sky-400/30">
                  <div className="text-[9px] uppercase text-muted-foreground">Theo.</div>
                  <div className="text-sm font-black tabular-nums text-sky-700 dark:text-sky-300">
                    {theoreticalMassG}g
                  </div>
                </div>
                <div className="rounded-md bg-emerald-500/10 p-1.5 ring-1 ring-emerald-400/30">
                  <div className="text-[9px] uppercase text-muted-foreground">Actual</div>
                  <div className="text-sm font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                    {actualMassG.toFixed(1)}g
                  </div>
                </div>
                <div className="rounded-md bg-amber-500/10 p-1.5 ring-1 ring-amber-400/30">
                  <div className="text-[9px] uppercase text-muted-foreground">Yield</div>
                  <div className="text-sm font-black tabular-nums text-amber-700 dark:text-amber-300">
                    {yieldPct}%
                  </div>
                </div>
              </div>
            </Card>

            {reactionEnded && (
              <Card className="border-emerald-500/40 bg-emerald-500/5 p-3 text-[11px]">
                <div className="mb-1 flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" /> Reaction complete
                </div>
                Produced <b>{producedMolecules}</b> H₂O molecules in the canvas.
                Predicted maximum: <b>{stoich.maxH2O}</b>.
              </Card>
            )}
          </aside>
        </div>
      </main>

      {/* AI Tutor bottom banner */}
      <div className="sticky bottom-0 z-10 shrink-0 border-t bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-start gap-2 px-3 py-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="text-[11px] leading-snug text-foreground/90">
            <b>Lab AI:</b> খেয়াল করো! পাত্রে{" "}
            {stoich.limiting === "H2" ? "অক্সিজেন (O₂)" : "হাইড্রোজেন (H₂)"} বেশি
            থাকলেও বিক্রিয়া থেমে যাবে কারণ{" "}
            {stoich.limiting === "H2" ? "হাইড্রোজেন (H₂)" : "অক্সিজেন (O₂)"}{" "}
            ফুরিয়ে গেছে — তাই{" "}
            <b>{stoich.limiting === "H2" ? "H₂" : "O₂"}</b> এখানে{" "}
            <b>লিমিটিং বিক্রিয়ক</b>। পরীক্ষায় সবসময় আগে লিমিটিং বিক্রিয়ক বের
            করে তারপর উৎপাদের হিসাব করবে!
          </p>
        </div>
      </div>
    </div>
  );
}
