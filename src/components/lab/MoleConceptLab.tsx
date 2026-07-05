/**
 * Chapter 6 — Avogadro Number & Mole Concept Lab (v2, canvas-driven)
 * 5 substances · flicker balance · molecular canvas engine · zoom transition.
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
type SubKey = "carbon" | "water" | "nacl" | "sugar" | "cuso4";
type MolShape = "sphere" | "water" | "ionpair" | "chain" | "hydrate";

interface Substance {
  key: SubKey;
  name: string;
  nameBn: string;
  formula: string;
  molarMass: number;
  unit: string;
  unitBn: string;
  chip: string;      // gradient bg for chip/scale label
  primary: string;   // hex accent
  secondary: string; // hex accent 2
  shape: MolShape;
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
    chip: "from-slate-800 to-neutral-900",
    primary: "#1f2937",
    secondary: "#6b7280",
    shape: "sphere",
    swatch: (
      <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-neutral-950 ring-1 ring-white/10 shadow-inner">
        <span className="absolute inset-0 grid place-items-center text-[11px] font-black text-white/90">C</span>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-slate-400/40 blur-[2px]" />
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
    chip: "from-sky-500 to-cyan-500",
    primary: "#0ea5e9",
    secondary: "#22d3ee",
    shape: "water",
    swatch: (
      <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-gradient-to-b from-sky-100 to-sky-400 ring-1 ring-sky-200/50 shadow-inner">
        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-sky-600/80 to-sky-300/40" />
        <span className="absolute inset-0 grid place-items-center text-[10px] font-black text-white drop-shadow">H₂O</span>
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
    chip: "from-amber-400 to-yellow-500",
    primary: "#f59e0b",
    secondary: "#facc15",
    shape: "ionpair",
    swatch: (
      <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-200 ring-1 ring-amber-300/60 shadow-inner">
        <span className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] p-[3px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className={cn("rounded-[1px]", i % 2 ? "bg-amber-500/80" : "bg-amber-300/80")} />
          ))}
        </span>
      </div>
    ),
  },
  sugar: {
    key: "sugar",
    name: "Sucrose",
    nameBn: "চিনি",
    formula: "C₁₂H₂₂O₁₁",
    molarMass: 342,
    unit: "molecules",
    unitBn: "অণু",
    chip: "from-neutral-100 to-neutral-300 text-neutral-900",
    primary: "#e5e7eb",
    secondary: "#a3a3a3",
    shape: "chain",
    swatch: (
      <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-gradient-to-br from-white to-neutral-200 ring-1 ring-neutral-300/70 shadow-inner">
        <span className="absolute inset-0 grid place-items-center text-[9px] font-black text-neutral-700">C₁₂</span>
        <span className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" />
      </div>
    ),
  },
  cuso4: {
    key: "cuso4",
    name: "Copper Sulfate",
    nameBn: "তুঁতে",
    formula: "CuSO₄·5H₂O",
    molarMass: 249.5,
    unit: "formula units",
    unitBn: "সূত্র-একক",
    chip: "from-cyan-500 to-blue-600",
    primary: "#06b6d4",
    secondary: "#3b82f6",
    shape: "hydrate",
    swatch: (
      <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 ring-1 ring-cyan-200/60 shadow-inner">
        <span className="absolute inset-0 grid place-items-center text-[9px] font-black text-white drop-shadow">Cu</span>
        <span className="absolute -right-1 -bottom-1 h-4 w-4 rotate-45 bg-cyan-200/60 blur-[3px]" />
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

// Balance flicker → lock. Returns display value.
function useBalanceFlicker(target: number, key: string, ms = 420) {
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = (t - start) / ms;
      if (p >= 1) { setDisplay(target); return; }
      // random flicker around the target
      const jitter = (Math.random() - 0.5) * target * 1.4 + Math.random() * 20;
      setDisplay(Math.max(0, target * 0.3 + jitter));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return display;
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

// ── Canvas particle engine ──────────────────────────────────
interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; va: number; }

function ParticleCanvas({
  substance,
  moles,
  zoomKey,
}: {
  substance: Substance;
  moles: number;
  zoomKey: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ ps: P[]; W: number; H: number }>({ ps: [], W: 0, H: 0 });
  const zoomStartRef = useRef<number>(performance.now());

  const count = Math.round(14 + moles * 10); // ~19 / 24 / 34

  // rebuild particles when substance or count changes
  useEffect(() => {
    zoomStartRef.current = performance.now();
    const rng = mulberry32(substance.key.charCodeAt(0) * 131 + count);
    const speed = 0.35 + moles * 0.4;
    const rBase = substance.shape === "chain" ? 14 : substance.shape === "hydrate" ? 12 : 8;
    stateRef.current.ps = Array.from({ length: count }).map(() => ({
      x: rng(), y: rng(),
      vx: (rng() - 0.5) * speed,
      vy: (rng() - 0.5) * speed,
      r: rBase + rng() * 3,
      a: rng() * Math.PI * 2,
      va: (rng() - 0.5) * 0.04 * (1 + moles),
    }));
  }, [substance.key, count, moles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = container.getBoundingClientRect();
      stateRef.current.W = rect.width;
      stateRef.current.H = rect.height;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = 0;
    const draw = () => {
      const { W, H, ps } = stateRef.current;
      // background wash
      const g = ctx.createRadialGradient(W * 0.5, H * 0.55, 20, W * 0.5, H * 0.55, Math.max(W, H) * 0.8);
      g.addColorStop(0, "rgba(30,41,59,0.9)");
      g.addColorStop(1, "rgba(2,6,23,1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // subtle grid
      ctx.strokeStyle = "rgba(148,163,184,0.05)";
      ctx.lineWidth = 1;
      const step = 28;
      for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // zoom transition (macro grid → micro particles)
      const elapsed = (performance.now() - zoomStartRef.current) / 700;
      const t = Math.min(1, elapsed);
      const scale = 0.35 + t * 0.65; // grow from 35% → 100%
      const alpha = t;

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(scale, scale);
      ctx.translate(-W / 2, -H / 2);
      ctx.globalAlpha = alpha;

      for (const p of ps) {
        // physics — normalized [0,1] positions, elastic walls
        p.x += p.vx / W;
        p.y += p.vy / H;
        p.a += p.va;
        if (p.x < 0.03) { p.x = 0.03; p.vx = Math.abs(p.vx); }
        if (p.x > 0.97) { p.x = 0.97; p.vx = -Math.abs(p.vx); }
        if (p.y < 0.06) { p.y = 0.06; p.vy = Math.abs(p.vy); }
        if (p.y > 0.94) { p.y = 0.94; p.vy = -Math.abs(p.vy); }

        const cx = p.x * W;
        const cy = p.y * H;
        drawMolecule(ctx, substance, cx, cy, p.r, p.a);
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [substance, zoomKey]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

function drawMolecule(
  ctx: CanvasRenderingContext2D,
  s: Substance,
  x: number, y: number, r: number, a: number,
) {
  const drawAtom = (cx: number, cy: number, rad: number, c1: string, c2: string) => {
    const g = ctx.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.1, cx, cy, rad);
    g.addColorStop(0, c2);
    g.addColorStop(1, c1);
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    // highlight
    ctx.beginPath();
    ctx.arc(cx - rad * 0.35, cy - rad * 0.35, rad * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();
  };
  const drawBond = (x1: number, y1: number, x2: number, y2: number, w = 2) => {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  if (s.shape === "sphere") {
    drawAtom(x, y, r, "#0f172a", "#475569");
    return;
  }

  if (s.shape === "water") {
    // V-shape: O at center, 2 H at angle
    const oR = r;
    const hR = r * 0.55;
    const angle = 1.83; // ~104.5° opening
    const d = r * 1.4;
    const h1x = x + Math.cos(a - angle / 2) * d;
    const h1y = y + Math.sin(a - angle / 2) * d;
    const h2x = x + Math.cos(a + angle / 2) * d;
    const h2y = y + Math.sin(a + angle / 2) * d;
    drawBond(x, y, h1x, h1y);
    drawBond(x, y, h2x, h2y);
    drawAtom(x, y, oR, "#0369a1", "#38bdf8");
    drawAtom(h1x, h1y, hR, "#94a3b8", "#f1f5f9");
    drawAtom(h2x, h2y, hR, "#94a3b8", "#f1f5f9");
    return;
  }

  if (s.shape === "ionpair") {
    // Na+ and Cl- side by side
    const d = r * 1.1;
    drawAtom(x - d, y, r * 0.85, "#b45309", "#fbbf24");
    drawAtom(x + d, y, r * 1.05, "#065f46", "#34d399");
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `bold ${r * 0.75}px ui-sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("+", x - d, y - r * 0.05);
    ctx.fillText("−", x + d, y - r * 0.05);
    return;
  }

  if (s.shape === "chain") {
    // sucrose-ish: two fused rings hint
    const rr = r * 0.5;
    for (let i = 0; i < 6; i++) {
      const th = a + (i * Math.PI) / 3;
      const px = x + Math.cos(th) * r * 0.75;
      const py = y + Math.sin(th) * r * 0.75;
      const th2 = a + ((i + 1) * Math.PI) / 3;
      const px2 = x + Math.cos(th2) * r * 0.75;
      const py2 = y + Math.sin(th2) * r * 0.75;
      drawBond(px, py, px2, py2, 1.2);
    }
    for (let i = 0; i < 6; i++) {
      const th = a + (i * Math.PI) / 3;
      const px = x + Math.cos(th) * r * 0.75;
      const py = y + Math.sin(th) * r * 0.75;
      drawAtom(px, py, rr * 0.9, i % 3 === 0 ? "#7c2d12" : "#1e293b", i % 3 === 0 ? "#f97316" : "#94a3b8");
    }
    // bridge O
    drawAtom(x + r * 0.9, y, rr, "#0369a1", "#38bdf8");
    drawBond(x + r * 0.75, y, x + r * 1.05, y, 1.2);
    return;
  }

  if (s.shape === "hydrate") {
    // Cu core + 4 H2O satellites
    drawAtom(x, y, r * 0.9, "#0e7490", "#22d3ee");
    for (let i = 0; i < 4; i++) {
      const th = a + (i * Math.PI) / 2;
      const px = x + Math.cos(th) * r * 1.5;
      const py = y + Math.sin(th) * r * 1.5;
      drawBond(x, y, px, py, 1);
      drawAtom(px, py, r * 0.4, "#1e40af", "#93c5fd");
    }
    return;
  }
}

// ── Component ──────────────────────────────────────────────
type LabMode = "avogadro" | "molarity" | "empirical";

export default function MoleConceptLab({
  onBack,
  forcedMode = "avogadro",
}: {
  onBack: () => void;
  forcedMode?: LabMode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-background dark:to-emerald-950/40 lg:h-[100dvh] lg:overflow-hidden">
      {forcedMode === "avogadro" ? (
        <AvogadroMode onBack={onBack} />
      ) : forcedMode === "molarity" ? (
        <MolarityMode onBack={onBack} />
      ) : (
        <EmpiricalMode onBack={onBack} />
      )}
    </div>
  );
}

function AvogadroMode({ onBack }: { onBack: () => void }) {

  const [sub, setSub] = useState<SubKey | null>("water");
  const [moleIdx, setMoleIdx] = useState(1);
  const [tab, setTab] = useState<"equipment" | "lab" | "data">("lab");

  const substance = sub ? SUBS[sub] : null;
  const moles = MOLE_OPTIONS[moleIdx];
  const mass = substance ? substance.molarMass * moles : 0;
  const particleTarget = substance ? moles * NA : 0;
  const displayCount = useCountUp(particleTarget);
  const balanceKey = `${sub}-${moleIdx}`;
  const balanceDisplay = useBalanceFlicker(mass, balanceKey);
  const zoomKey = sub ?? "none";

  const place = (k: SubKey) => {
    setSub(k);
    setTab("lab");
    toast.success(`${SUBS[k].nameBn} স্কেলে বসানো হয়েছে`);
  };

  const generateReport = () => {
    if (!substance) { toast.error("প্রথমে একটি পদার্থ নির্বাচন করো"); return; }
    toast.success("Lab Report তৈরি হয়েছে ✓", {
      description: `${moles} mol ${substance.formula} = ${mass.toFixed(2)} g`,
    });
  };

  return (
    <div className="relative flex flex-1 min-h-0 w-full flex-col lg:overflow-hidden">

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

      <main className="flex-1 p-2 pb-24 sm:p-3 lg:min-h-0 lg:overflow-hidden lg:pb-3">
        <div className="flex h-full flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,0.95fr)] lg:grid-rows-1 lg:gap-3">
          <aside className={cn("flex-col gap-3 lg:order-1 lg:flex lg:min-h-0 lg:overflow-y-auto lg:pr-1", tab === "equipment" ? "flex" : "hidden lg:flex")}>
            <SubstanceShelf active={sub} onPlace={place} />
          </aside>

          <section className={cn("relative min-h-0 min-w-0 lg:order-2 lg:flex lg:flex-col", tab === "lab" ? "flex flex-col" : "hidden lg:flex")}>
            <div className="flex w-full flex-col items-center justify-center gap-3" style={{ height: "min(70vh, 460px)" }}>
              <VisualStage
                substance={substance}
                mass={mass}
                balanceDisplay={balanceDisplay}
                displayCount={displayCount}
                moles={moles}
                zoomKey={zoomKey}
              />
            </div>
            <AiHint substance={substance} moles={moles} mass={mass} />
          </section>

          <aside className={cn("flex-col gap-3 lg:order-3 lg:flex lg:min-h-0 lg:overflow-y-auto lg:pl-1", tab === "data" ? "flex" : "hidden lg:flex")}>
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

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {([
            { k: "equipment", label: "Equipment", icon: Beaker },
            { k: "lab", label: "Lab", icon: FlaskConical },
            { k: "data", label: "Data", icon: TrendingUp },
          ] as const).map(({ k, label, icon: Icon }) => (
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

// ── Substance Shelf ─────────────────────────────────────────
function SubstanceShelf({ active, onPlace }: { active: SubKey | null; onPlace: (k: SubKey) => void }) {
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center gap-2">
        <Beaker className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-bold">Substance Shelf</h3>
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Tap a container → auto-places on the balance.
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
                  ? "border-emerald-500/60 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-400/30"
                  : "border-border hover:border-emerald-500/40 hover:bg-muted/40",
              )}
            >
              {s.swatch}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <span className="truncate">{s.nameBn}</span>
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {s.formula} · M = {s.molarMass} g/mol
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

// ── Visual Stage: Scale + Canvas Viewer ─────────────────────
function VisualStage({
  substance,
  mass,
  balanceDisplay,
  displayCount,
  moles,
  zoomKey,
}: {
  substance: Substance | null;
  mass: number;
  balanceDisplay: number;
  displayCount: number;
  moles: number;
  zoomKey: string;
}) {
  const { m, e } = formatSci(displayCount);
  return (
    <div className="grid h-full w-full grid-rows-[auto_minmax(0,1fr)] gap-2">
      {/* Balance */}
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-100 to-neutral-200 p-3 shadow-inner dark:from-slate-800 dark:to-slate-900">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1">
              <Scale className="h-3 w-3" /> Digital Balance
            </span>
            <span className={cn("flex items-center gap-1 text-emerald-500", substance ? "opacity-100" : "opacity-40")}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              READY
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
                style={{ transform: `scaleY(${0.55 + Math.min(moles, 2) * 0.22})`, transformOrigin: "bottom" }}
              >
                {substance.formula}
              </div>
            )}
          </div>
          {/* LCD */}
          <div className="mt-2 rounded-lg border border-emerald-900/30 bg-gradient-to-b from-emerald-950 to-black px-3 py-2 font-mono shadow-inner">
            <div className="flex items-baseline justify-end gap-1 text-emerald-300">
              <span className="text-2xl font-black tabular-nums drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]">
                {balanceDisplay.toFixed(2)}
              </span>
              <span className="text-xs opacity-80">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas viewer */}
      <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg">
        {substance ? (
          <>
            <ParticleCanvas substance={substance} moles={moles} zoomKey={zoomKey} />
            <div className="pointer-events-none absolute inset-x-0 top-1.5 flex flex-col items-center gap-0.5 px-3 text-center">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/80 backdrop-blur">
                Avogadro Counter
              </span>
              <div className="font-mono text-lg font-black text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)] sm:text-2xl">
                {m} × 10<sup className="text-[0.55em]">{e}</sup>
              </div>
              <span className="text-[10px] text-white/70">{substance.unit} · {substance.unitBn}</span>
            </div>
            <div className="pointer-events-none absolute bottom-1.5 left-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
              🔬 Microscopic view
            </div>
            <div className="pointer-events-none absolute bottom-1.5 right-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
              {moles} mol · {mass.toFixed(1)} g
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-white/60">
            <Beaker className="h-8 w-8" />
            <p className="text-xs">Shelf থেকে একটি পদার্থ বেছে নাও</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────
function ControlsPanel({
  moleIdx,
  setMoleIdx,
  substance,
}: {
  moleIdx: number;
  setMoleIdx: (n: number) => void;
  substance: Substance | null;
}) {
  const moles = MOLE_OPTIONS[moleIdx];
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-bold">Amount (mol)</h3>
        </div>
        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">
          {moles.toFixed(1)} mol
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

      <Slider min={0} max={2} step={1} value={[moleIdx]} onValueChange={(v) => setMoleIdx(v[0])} className="mt-1" />

      {substance && (
        <div className="mt-3 space-y-1.5 rounded-lg border bg-muted/40 p-2 text-[11.5px] leading-relaxed">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Formula Substitution
          </div>
          <div className="font-mono">
            W = n × M<br />
            <span className="text-muted-foreground">= {moles} × {substance.molarMass}</span><br />
            <span className="font-bold text-emerald-600 dark:text-emerald-300">
              = {(moles * substance.molarMass).toFixed(2)} g
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Data table ──────────────────────────────────────────────
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
          <Row label="Moles (n)" value={`${moles.toFixed(2)} mol`} accent />
          <Row
            label={`Particles (N)`}
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

// ── AI Hint ─────────────────────────────────────────────────
function AiHint({ substance, moles, mass }: { substance: Substance | null; moles: number; mass: number }) {
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
  const carbonMass = (moles * 12).toFixed(0);
  if (s.key === "sugar" && moles === 2) {
    return `দেখো — ২ মোল চিনি = ${mass.toFixed(0)} g, আর ২ মোল কার্বন = মাত্র ${carbonMass} g। ভরে বিশাল পার্থক্য, কিন্তু particle সংখ্যা exactly same: ${m} × 10^${e} ${s.unitBn}!`;
  }
  if (moles === 1) {
    return `১ মোল ${s.nameBn} = ${mass.toFixed(2)} g। ${s.nameBn}-এর ${s.unitBn} সংখ্যা exact ${m} × 10^${e} — এটাই Avogadro's Number (Nₐ)।`;
  }
  if (moles === 0.5) {
    return `০.৫ মোল মানে অর্ধেক Nₐ = ${m} × 10^${e} ${s.unitBn}। ভর ${mass.toFixed(2)} g, সূত্র একই: W = n × M।`;
  }
  return `২ মোল ${s.nameBn} = ${mass.toFixed(2)} g → particle এখন ${m} × 10^${e}। n দ্বিগুণ হলে N-ও দ্বিগুণ (N = n × Nₐ)।`;
}

// ═══════════════════════════════════════════════════════════
// ── EXPERIMENT 2 · Molarity & Dilution ─────────────────────
// ═══════════════════════════════════════════════════════════
const CUSO4_M = 160; // g/mol (anhydrous for molarity calc)

function MolarityMode({ onBack: _onBack }: { onBack: () => void }) {
  const [massW, setMassW] = useState(16); // g of CuSO4
  const [v1, setV1] = useState(100); // mL initial
  const [v2, setV2] = useState(100); // mL after dilution (>= v1)
  const [tab, setTab] = useState<"equipment" | "lab" | "data">("lab");

  // Molarity S = (W × 1000) / (M × V) => mol/L
  const s1 = (massW * 1000) / (CUSO4_M * v1);
  const s2 = (massW * 1000) / (CUSO4_M * v2);
  const dilutionRatio = v2 / v1;

  // color: higher molarity => deeper blue.
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
  const sat = clamp(s2 / 1.5, 0.05, 1); // normalize (1.5 M ~ deepest)

  const setV1Safe = (v: number) => {
    setV1(v);
    if (v2 < v) setV2(v);
  };
  const addWater = (amt: number) => setV2((prev) => clamp(prev + amt, v1, 500));
  const reset = () => setV2(v1);

  return (
    <div className="relative flex flex-1 min-h-0 w-full flex-col lg:overflow-hidden">
      <header className="sticky top-[54px] z-20 shrink-0 border-b bg-background/85 backdrop-blur-xl lg:static lg:top-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md">
              <FlaskConical className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-extrabold tracking-tight sm:text-base">
                মোলারিটি ও দ্রবণ লঘুকরণ
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                Molarity & Dilution · CuSO₄ (M = 160 g/mol)
              </div>
            </div>
          </div>
          <Badge className="shrink-0 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300">
            S₁V₁ = S₂V₂
          </Badge>
        </div>
      </header>

      <main className="flex-1 p-2 pb-24 sm:p-3 lg:min-h-0 lg:overflow-hidden lg:pb-3">
        <div className="flex h-full flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,0.95fr)] lg:grid-rows-1 lg:gap-3">
          {/* EQUIPMENT / SOLUTE */}
          <aside className={cn("flex-col gap-3 lg:order-1 lg:flex lg:min-h-0 lg:overflow-y-auto lg:pr-1", tab === "equipment" ? "flex" : "hidden lg:flex")}>
            <Card className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <Beaker className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold">Solute Shelf</h3>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-sky-500/40 bg-sky-500/5 p-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 to-blue-700 ring-1 ring-cyan-200/60 shadow-inner">
                  <span className="absolute inset-0 grid place-items-center text-[10px] font-black text-white drop-shadow">CuSO₄</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">তুঁতে (CuSO₄)</div>
                  <div className="text-[11px] text-muted-foreground">Molar Mass · 160 g/mol</div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-semibold">Solute Mass (W)</span>
                    <span className="rounded bg-sky-500/10 px-1.5 py-0.5 font-bold text-sky-700 dark:text-sky-300 tabular-nums">{massW.toFixed(1)} g</span>
                  </div>
                  <Slider min={1} max={40} step={0.5} value={[massW]} onValueChange={(v) => setMassW(v[0])} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-semibold">Initial Volume (V₁)</span>
                    <span className="rounded bg-sky-500/10 px-1.5 py-0.5 font-bold text-sky-700 dark:text-sky-300 tabular-nums">{v1} mL</span>
                  </div>
                  <Slider min={50} max={250} step={10} value={[v1]} onValueChange={(v) => setV1Safe(v[0])} />
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold">Dilution Controls</h3>
              </div>
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold">Final Volume (V₂)</span>
                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 font-bold text-sky-700 dark:text-sky-300 tabular-nums">{v2} mL</span>
              </div>
              <Slider min={v1} max={500} step={10} value={[v2]} onValueChange={(v) => setV2(v[0])} />
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {[25, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => addWater(n)}
                    className="rounded-lg border border-sky-500/40 bg-sky-500/10 py-1.5 text-[11px] font-bold text-sky-700 hover:bg-sky-500/20 dark:text-sky-300"
                  >
                    +{n} mL H₂O
                  </button>
                ))}
              </div>
              <Button onClick={reset} variant="outline" size="sm" className="mt-2 w-full text-xs">
                Reset V₂ = V₁
              </Button>
            </Card>
          </aside>

          {/* CENTER — VISUAL */}
          <section className={cn("relative min-h-0 min-w-0 lg:order-2 lg:flex lg:flex-col", tab === "lab" ? "flex flex-col" : "hidden lg:flex")}>
            <div className="flex w-full flex-col items-center justify-center gap-3" style={{ height: "min(70vh, 460px)" }}>
              <MolarityVisual s1={s1} s2={s2} v1={v1} v2={v2} sat={sat} massW={massW} />
            </div>
            <MolarityHint s1={s1} s2={s2} v1={v1} v2={v2} />
          </section>

          {/* RIGHT — MATH / DATA */}
          <aside className={cn("flex-col gap-3 lg:order-3 lg:flex lg:min-h-0 lg:overflow-y-auto lg:pl-1", tab === "data" ? "flex" : "hidden lg:flex")}>
            <Card className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold">Live Formulas</h3>
              </div>
              <div className="space-y-2 text-[11.5px]">
                <div className="rounded-lg border bg-muted/40 p-2 font-mono leading-relaxed">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Initial Molarity</div>
                  S₁ = (W × 1000) / (M × V₁)<br />
                  <span className="text-muted-foreground">= ({massW} × 1000) / (160 × {v1})</span><br />
                  <span className="font-bold text-sky-600 dark:text-sky-300">= {s1.toFixed(4)} mol/L</span>
                </div>
                <div className="rounded-lg border bg-muted/40 p-2 font-mono leading-relaxed">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">After Dilution</div>
                  S₁V₁ = S₂V₂ → S₂ = S₁V₁ / V₂<br />
                  <span className="text-muted-foreground">= ({s1.toFixed(3)} × {v1}) / {v2}</span><br />
                  <span className="font-bold text-sky-600 dark:text-sky-300">= {s2.toFixed(4)} mol/L</span>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold">Data Table</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                <Row label="Solute" value="CuSO₄" />
                <Row label="Mass (W)" value={`${massW.toFixed(1)} g`} />
                <Row label="M" value="160 g/mol" />
                <Row label="V₁" value={`${v1} mL`} />
                <Row label="V₂" value={`${v2} mL`} accent />
                <Row label="S₁" value={`${s1.toFixed(4)} M`} />
                <Row label="S₂" value={`${s2.toFixed(4)} M`} accent />
                <Row label="Dilution ×" value={dilutionRatio.toFixed(2)} />
              </div>
              {/* gauge */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Molarity Gauge</span>
                  <span className="text-sky-600 dark:text-sky-300 tabular-nums">{s2.toFixed(3)} M</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-300 via-sky-500 to-blue-800 transition-all duration-500"
                    style={{ width: `${clamp((s2 / 1.5) * 100, 4, 100)}%` }}
                  />
                </div>
              </div>
            </Card>

            <Button
              onClick={() => toast.success("Lab Report তৈরি ✓", { description: `S₂ = ${s2.toFixed(4)} mol/L in V₂ = ${v2} mL` })}
              className="w-full gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md hover:opacity-90"
            >
              <FileText className="h-4 w-4" /> Generate Lab Report
            </Button>
          </aside>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {([
            { k: "equipment", label: "Equipment", icon: Beaker },
            { k: "lab", label: "Lab", icon: FlaskConical },
            { k: "data", label: "Data", icon: TrendingUp },
          ] as const).map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                tab === k ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground",
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

// Ion count is CONSERVED across dilution (mass W is fixed → moles fixed).
const ION_PAIRS = 22;

function MolarityVisual({
  s1: _s1, s2, v1: _v1, v2, sat, massW,
}: { s1: number; s2: number; v1: number; v2: number; sat: number; massW: number }) {
  // Flask visual: fill height maps to v2 (max 500 mL).
  const fillPct = Math.min(1, Math.max(0.08, v2 / 500));
  // Liquid color: 0.1M → faint sky · 1.0M → rich cobalt.
  const r = Math.round(186 - sat * 156);
  const g = Math.round(230 - sat * 180);
  const b = Math.round(253 - sat * 100);
  const liquid = `rgb(${r}, ${g}, ${b})`;
  const liquidDeep = `rgb(${Math.max(r - 40, 8)}, ${Math.max(g - 40, 20)}, ${Math.max(b - 20, 90)})`;
  // Opacity: faint at low molarity, rich at high molarity.
  const fillOpacity = 0.28 + sat * 0.65;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-black shadow-lg">
      <FlaskWithIons
        fillPct={fillPct}
        liquid={liquid}
        liquidDeep={liquidDeep}
        fillOpacity={fillOpacity}
        sat={sat}
      />

      {/* HUD — Molarity Meter */}
      <div className="pointer-events-none absolute inset-x-0 top-1.5 flex flex-col items-center gap-0.5 px-3 text-center">
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/80 backdrop-blur">
          Molarity Meter · S₂
        </span>
        <div className="font-mono text-lg font-black text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)] sm:text-2xl">
          {s2.toFixed(3)} <span className="text-xs opacity-80">mol/L</span>
        </div>
      </div>

      {/* Corner labels */}
      <div className="pointer-events-none absolute bottom-1.5 left-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
        Cu²⁺ · SO₄²⁻
      </div>
      <div className="pointer-events-none absolute bottom-1.5 right-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
        V = {v2} mL · W = {massW}g
      </div>
    </div>
  );
}

// Flask geometry in viewBox 200×260
// Neck: x∈[85,115], y∈[30,100]
// Body: trapezoid from (85,100)-(115,100) widening to (40,220)-(160,220)
// Base curve: (40,220)→(60,240) & (160,220)→(140,240)
function flaskBoundsAt(y: number): { xMin: number; xMax: number } {
  if (y < 30) return { xMin: 100, xMax: 100 };
  if (y <= 100) return { xMin: 87, xMax: 113 };
  if (y <= 220) {
    const t = (y - 100) / 120;
    return { xMin: 87 - t * 45, xMax: 113 + t * 45 };
  }
  // curved base — approximate inset
  const t = Math.min(1, (y - 220) / 20);
  return { xMin: 42 + t * 18, xMax: 158 - t * 18 };
}

interface Ion { x: number; y: number; vx: number; vy: number; kind: "cu" | "so4"; r: number; seed: number }

function FlaskWithIons({
  fillPct,
  liquid,
  liquidDeep,
  fillOpacity,
  sat,
}: { fillPct: number; liquid: string; liquidDeep: string; fillOpacity: number; sat: number }) {
  const ionsRef = useRef<Ion[]>([]);
  const [, force] = useState(0);

  // one-time init: conserved ion population
  if (ionsRef.current.length === 0) {
    const rng = mulberry32(7);
    ionsRef.current = Array.from({ length: ION_PAIRS * 2 }).map((_, i) => {
      const kind: "cu" | "so4" = i % 2 === 0 ? "cu" : "so4";
      return {
        x: 100 + (rng() - 0.5) * 40,
        y: 200,
        vx: (rng() - 0.5) * 0.35,
        vy: (rng() - 0.5) * 0.35,
        kind,
        r: kind === "cu" ? 4.2 : 5.2,
        seed: rng() * 1000,
      };
    });
  }

  // Liquid top y in viewBox coords
  const liquidTopY = 240 - fillPct * 210;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const ions = ionsRef.current;
      for (const p of ions) {
        // Brownian jitter — gentler when concentrated (more crowded)
        const jitter = 0.02 + (1 - sat) * 0.05;
        p.vx += (Math.random() - 0.5) * jitter;
        p.vy += (Math.random() - 0.5) * jitter;
        // damping
        p.vx *= 0.96;
        p.vy *= 0.96;
        // step
        p.x += p.vx * dt * 0.06;
        p.y += p.vy * dt * 0.06;

        // Confine to liquid volume:
        // Vertical: between liquidTopY (+ ion r) and 238 (- ion r)
        const yMin = liquidTopY + p.r + 2;
        const yMax = 238 - p.r;
        if (p.y < yMin) { p.y = yMin; p.vy = Math.abs(p.vy) * 0.6; }
        if (p.y > yMax) { p.y = yMax; p.vy = -Math.abs(p.vy) * 0.6; }

        // Horizontal: bounded by flask walls at current y
        const b = flaskBoundsAt(p.y);
        const xMin = b.xMin + p.r;
        const xMax = b.xMax - p.r;
        if (xMin >= xMax) {
          p.x = (b.xMin + b.xMax) / 2;
          p.vx = 0;
        } else {
          if (p.x < xMin) { p.x = xMin; p.vx = Math.abs(p.vx) * 0.6; }
          if (p.x > xMax) { p.x = xMax; p.vx = -Math.abs(p.vx) * 0.6; }
        }
      }
      force((n) => (n + 1) % 1000000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [liquidTopY, sat]);

  return (
    <svg viewBox="0 0 200 260" className="absolute inset-0 mx-auto h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="glass" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.22)" />
        </linearGradient>
        <linearGradient id="liq" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={liquid} stopOpacity={fillOpacity} />
          <stop offset="1" stopColor={liquidDeep} stopOpacity={Math.min(0.98, fillOpacity + 0.08)} />
        </linearGradient>
        <clipPath id="flaskClip">
          <path d="M85 30 L85 100 L40 220 Q40 240 60 240 L140 240 Q160 240 160 220 L115 100 L115 30 Z" />
        </clipPath>
        <radialGradient id="cuGrad" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset="1" stopColor="#0369a1" />
        </radialGradient>
        <radialGradient id="so4Grad" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fef9c3" />
          <stop offset="1" stopColor="#b45309" />
        </radialGradient>
      </defs>

      {/* liquid + ions — everything strictly clipped to the flask */}
      <g clipPath="url(#flaskClip)">
        <rect x="20" y={liquidTopY} width="160" height={240 - liquidTopY} fill="url(#liq)" />
        {/* meniscus */}
        <ellipse cx="100" cy={liquidTopY} rx="70" ry="3.2" fill="rgba(255,255,255,0.28)" />
        {/* ions — only rendered inside liquid volume */}
        {ionsRef.current.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={p.kind === "cu" ? "url(#cuGrad)" : "url(#so4Grad)"}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="0.35"
          />
        ))}
      </g>

      {/* glass outline */}
      <path
        d="M85 30 L85 100 L40 220 Q40 240 60 240 L140 240 Q160 240 160 220 L115 100 L115 30 Z"
        fill="url(#glass)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
      />
      {/* neck rim */}
      <rect x="80" y="24" width="40" height="8" rx="2" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.7)" />
      {/* graduation ticks */}
      {[0.25, 0.5, 0.75].map((p) => (
        <g key={p}>
          <line x1="45" x2="55" y1={240 - p * 210} y2={240 - p * 210} stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
          <text x="58" y={240 - p * 210 + 3} fill="rgba(255,255,255,0.6)" fontSize="7">
            {Math.round(p * 500)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function MolarityHint({ s1, s2, v1, v2 }: { s1: number; s2: number; v1: number; v2: number }) {
  let msg = "";
  if (v2 > v1 * 1.05) {
    msg = `পানি যোগ করার ফলে অণুগুলোর মধ্যবর্তী দূরত্ব বাড়ছে — নীল রঙ হালকা হচ্ছে। S₁V₁ = S₂V₂ অনুযায়ী molarity ${s1.toFixed(3)} → ${s2.toFixed(3)} mol/L এ নেমে এসেছে।`;
  } else if (s2 > 0.8) {
    msg = `এই দ্রবণটি বেশ ঘন (S = ${s2.toFixed(3)} M)। CuSO₄ পানিতে সম্পূর্ণ ionize হয়ে Cu²⁺ ও SO₄²⁻ আয়ন তৈরি করছে — তাই গাঢ় নীল রঙ।`;
  } else {
    msg = `Molarity S = (W × 1000)/(M × V) = ${s2.toFixed(3)} mol/L। "Add Extra Water" চাপলে V বাড়বে, S কমবে (dilution)।`;
  }
  return (
    <div className="mx-auto mt-2 flex w-full max-w-xl items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/5 p-2.5 text-[11.5px] leading-relaxed shadow-sm">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div>
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-300">
          Lab AI Assistant
        </div>
        <p className="text-foreground/90">{msg}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MODE 3 — Empirical & Molecular Formula Builder
// ═══════════════════════════════════════════════════════════

type ElemSym = "C" | "H" | "O" | "N" | "S" | "Na" | "Cl" | "K" | "Ca" | "Fe" | "P";
interface ElemInfo {
  sym: ElemSym;
  name: string;
  mass: number;
  color: string;   // atom fill
  ring: string;    // atom ring / stroke
  chart: string;   // pie hex
}
const ELEMS: Record<ElemSym, ElemInfo> = {
  C:  { sym: "C",  name: "Carbon",   mass: 12,   color: "#1f2937", ring: "#4b5563", chart: "#374151" },
  H:  { sym: "H",  name: "Hydrogen", mass: 1,    color: "#67e8f9", ring: "#22d3ee", chart: "#67e8f9" },
  O:  { sym: "O",  name: "Oxygen",   mass: 16,   color: "#ef4444", ring: "#b91c1c", chart: "#ef4444" },
  N:  { sym: "N",  name: "Nitrogen", mass: 14,   color: "#3b82f6", ring: "#1d4ed8", chart: "#3b82f6" },
  S:  { sym: "S",  name: "Sulfur",   mass: 32,   color: "#eab308", ring: "#a16207", chart: "#eab308" },
  Na: { sym: "Na", name: "Sodium",   mass: 23,   color: "#a855f7", ring: "#7e22ce", chart: "#a855f7" },
  Cl: { sym: "Cl", name: "Chlorine", mass: 35.5, color: "#22c55e", ring: "#15803d", chart: "#22c55e" },
  K:  { sym: "K",  name: "Potassium",mass: 39,   color: "#f472b6", ring: "#db2777", chart: "#f472b6" },
  Ca: { sym: "Ca", name: "Calcium",  mass: 40,   color: "#94a3b8", ring: "#475569", chart: "#94a3b8" },
  Fe: { sym: "Fe", name: "Iron",     mass: 56,   color: "#d97706", ring: "#92400e", chart: "#d97706" },
  P:  { sym: "P",  name: "Phosphorus",mass: 31,  color: "#fb923c", ring: "#c2410c", chart: "#fb923c" },
};

interface Compound {
  key: string;
  nameBn: string;
  formula: string;
  molecular: string;
  molarMass: number;
  percents: { sym: ElemSym; pct: number }[];
  layout: { sym: ElemSym; x: number; y: number; r: number }[]; // 0..1 space
  bonds: [number, number][]; // indices into layout
}

const PRESETS: Compound[] = [
  {
    key: "h2o",
    nameBn: "পানি",
    formula: "H₂O",
    molecular: "H₂O",
    molarMass: 18,
    percents: [
      { sym: "H", pct: 11.11 },
      { sym: "O", pct: 88.89 },
    ],
    layout: [
      { sym: "O", x: 0.5, y: 0.5, r: 34 },
      { sym: "H", x: 0.28, y: 0.72, r: 20 },
      { sym: "H", x: 0.72, y: 0.72, r: 20 },
    ],
    bonds: [[0, 1], [0, 2]],
  },
  {
    key: "co2",
    nameBn: "কার্বন ডাই অক্সাইড",
    formula: "CO₂",
    molecular: "CO₂",
    molarMass: 44,
    percents: [
      { sym: "C", pct: 27.27 },
      { sym: "O", pct: 72.73 },
    ],
    layout: [
      { sym: "O", x: 0.18, y: 0.5, r: 30 },
      { sym: "C", x: 0.5,  y: 0.5, r: 28 },
      { sym: "O", x: 0.82, y: 0.5, r: 30 },
    ],
    bonds: [[0, 1], [1, 2]],
  },
  {
    key: "glucose",
    nameBn: "গ্লুকোজ",
    formula: "CH₂O",
    molecular: "C₆H₁₂O₆",
    molarMass: 180,
    percents: [
      { sym: "C", pct: 40.0 },
      { sym: "H", pct: 6.67 },
      { sym: "O", pct: 53.33 },
    ],
    // hexagonal-ish ring: 6 C's with O's / H's around
    layout: (() => {
      const items: { sym: ElemSym; x: number; y: number; r: number }[] = [];
      const cx = 0.5, cy = 0.5, R = 0.24;
      for (let i = 0; i < 6; i++) {
        const a = (-Math.PI / 2) + (i * Math.PI) / 3;
        items.push({ sym: "C", x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, r: 20 });
      }
      // outer O's
      for (let i = 0; i < 6; i++) {
        const a = (-Math.PI / 2) + (i * Math.PI) / 3;
        items.push({ sym: "O", x: cx + Math.cos(a) * (R + 0.16), y: cy + Math.sin(a) * (R + 0.16), r: 14 });
      }
      return items;
    })(),
    bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]],
  },
];

function EmpiricalMode() {
  const [preset, setPreset] = useState<string>("glucose");
  const [rows, setRows] = useState<{ sym: ElemSym; pct: string }[]>(() =>
    PRESETS[2].percents.map((p) => ({ sym: p.sym, pct: String(p.pct) })),
  );
  const [molarMass, setMolarMass] = useState<string>("180");
  const [tab, setTab] = useState<"compounds" | "visualizer" | "formula">("visualizer");
  const [assembleKey, setAssembleKey] = useState(0);

  const loadPreset = (key: string) => {
    const p = PRESETS.find((x) => x.key === key);
    if (!p) return;
    setPreset(key);
    setRows(p.percents.map((r) => ({ sym: r.sym, pct: String(r.pct) })));
    setMolarMass(String(p.molarMass));
    setAssembleKey((k) => k + 1);
    toast.success(`${p.nameBn} লোড হয়েছে`);
  };

  const parsed = rows
    .map((r) => ({ sym: r.sym, pct: parseFloat(r.pct) || 0 }))
    .filter((r) => r.pct > 0);
  const total = parsed.reduce((a, b) => a + b.pct, 0);
  const totalOk = Math.abs(total - 100) < 0.5;

  // Empirical formula math
  const steps = useMemo(() => {
    if (!parsed.length) return null;
    const moles = parsed.map((r) => ({ ...r, mol: r.pct / ELEMS[r.sym].mass }));
    const minMol = Math.min(...moles.map((m) => m.mol));
    const ratios = moles.map((m) => ({ ...m, ratio: m.mol / minMol }));
    // simple integerization
    let mult = 1;
    for (let m = 1; m <= 6; m++) {
      const ok = ratios.every((r) => Math.abs(r.ratio * m - Math.round(r.ratio * m)) < 0.08);
      if (ok) { mult = m; break; }
    }
    const ints = ratios.map((r) => ({ ...r, n: Math.max(1, Math.round(r.ratio * mult)) }));
    const empFormula = ints.map((r) => r.n === 1 ? r.sym : `${r.sym}${sub(r.n)}`).join("");
    const empMass = ints.reduce((a, r) => a + ELEMS[r.sym].mass * r.n, 0);
    const mm = parseFloat(molarMass) || 0;
    const n = mm > 0 ? Math.max(1, Math.round(mm / empMass)) : 1;
    const molFormula = ints.map((r) => (r.n * n) === 1 ? r.sym : `${r.sym}${sub(r.n * n)}`).join("");
    return { moles, ratios, ints, empFormula, empMass, n, molFormula, mm };
  }, [rows, molarMass]);

  const compound = PRESETS.find((p) => p.key === preset) ?? PRESETS[2];

  return (
    <main className="flex-1 p-2 pb-24 sm:p-3 lg:min-h-0 lg:overflow-hidden lg:pb-3">
      {/* Mobile tabs */}
      <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl border bg-muted/60 p-1 lg:hidden">
        {([
          { k: "compounds",  label: "Compounds", icon: FlaskConical },
          { k: "visualizer", label: "Visualizer", icon: Atom },
          { k: "formula",    label: "Formula",   icon: FileText },
        ] as const).map(({ k, label, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition",
              tab === k ? "bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow" : "text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:grid lg:h-[calc(100dvh-140px)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-3">
        {/* LEFT — Compounds & percent inputs */}
        <aside className={cn("flex flex-col gap-2 lg:min-h-0 lg:overflow-y-auto lg:pr-1", tab !== "compounds" && "hidden lg:flex")}>
          <Card className="p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black">প্রিসেট যৌগ</div>
                <div className="text-[10px] text-muted-foreground">Quick-load compounds</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => loadPreset(p.key)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition",
                    preset === p.key
                      ? "border-fuchsia-400 bg-fuchsia-500/10 shadow-sm"
                      : "hover:border-fuchsia-300 hover:bg-fuchsia-500/5",
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold">{p.nameBn}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {p.molecular} · M = {p.molarMass}
                    </div>
                  </div>
                  <div className="flex shrink-0 -space-x-1.5">
                    {p.percents.map((e) => (
                      <span
                        key={e.sym}
                        className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-black text-white ring-2 ring-background"
                        style={{ background: ELEMS[e.sym].color }}
                      >
                        {e.sym}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-black">শতকরা সংযুতি</div>
              <Badge
                variant="outline"
                className={cn(
                  "h-5 px-1.5 text-[10px]",
                  totalOk ? "border-emerald-400 text-emerald-600" : "border-amber-400 text-amber-600",
                )}
              >
                Σ = {total.toFixed(2)}%
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <select
                    value={r.sym}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...next[i], sym: e.target.value as ElemSym };
                      setRows(next);
                    }}
                    className="h-8 rounded-md border bg-background px-1.5 text-xs font-bold"
                  >
                    {(Object.keys(ELEMS) as ElemSym[]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={r.pct}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...next[i], pct: e.target.value };
                      setRows(next);
                    }}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs tabular-nums"
                    placeholder="%"
                  />
                  <span className="text-[10px] text-muted-foreground">%</span>
                  <button
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md border text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="remove"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => setRows([...rows, { sym: "C", pct: "" }])}
                className="mt-1 rounded-md border border-dashed py-1.5 text-[11px] font-semibold text-muted-foreground hover:border-fuchsia-400 hover:text-fuchsia-600"
              >
                + মৌল যোগ করো
              </button>
            </div>
            <div className="mt-3 border-t pt-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                আণবিক ভর (Molar Mass)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={molarMass}
                  onChange={(e) => setMolarMass(e.target.value)}
                  className="h-8 w-full rounded-md border bg-background px-2 text-xs tabular-nums"
                  placeholder="e.g. 180"
                />
                <span className="text-[10px] text-muted-foreground">g/mol</span>
              </div>
            </div>
          </Card>
        </aside>

        {/* CENTER — visualizer */}
        <section className={cn("flex min-h-0 flex-col gap-2", tab !== "visualizer" && "hidden lg:flex")}>
          <Card className="relative flex flex-1 flex-col overflow-hidden border-fuchsia-200/60 bg-gradient-to-br from-white via-fuchsia-50/40 to-violet-50/60 shadow-sm dark:from-slate-950 dark:via-fuchsia-950/20 dark:to-violet-950/30">
            <div className="flex items-center justify-between border-b border-fuchsia-200/50 bg-white/50 px-3 py-1.5 backdrop-blur dark:bg-slate-900/40">
              <div className="text-[11px] font-black">{compound.nameBn}</div>
              <Badge className="h-5 bg-gradient-to-br from-fuchsia-500 to-violet-600 px-1.5 text-[10px] text-white">
                {compound.molecular}
              </Badge>
            </div>
            <div
              className="relative flex w-full items-center justify-center"
              style={{ height: "min(70vh, 460px)" }}
            >
              <div className="grid h-full w-full grid-rows-[1fr_auto] gap-1 p-2">
                {/* Molecule assembly */}
                <div className="relative overflow-hidden rounded-xl border border-fuchsia-200/50 bg-white/60 backdrop-blur dark:bg-slate-900/50">
                  <MoleculeAssembly key={assembleKey + preset} compound={compound} />
                </div>
                {/* Pie */}
                <div className="rounded-xl border border-fuchsia-200/50 bg-white/60 p-2 backdrop-blur dark:bg-slate-900/50">
                  <PercentPie rows={parsed} />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* RIGHT — Formula lab */}
        <aside className={cn("flex flex-col gap-2 lg:min-h-0 lg:overflow-y-auto lg:pl-1", tab !== "formula" && "hidden lg:flex")}>
          <Card className="p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow">
                <FileText className="h-4 w-4" />
              </div>
              <div className="text-xs font-black">সংকেত নির্ণয় (Step-by-step)</div>
            </div>
            {!steps ? (
              <div className="rounded-lg bg-muted/50 p-3 text-center text-[11px] text-muted-foreground">
                শতকরা মান দিন…
              </div>
            ) : (
              <div className="space-y-2.5 text-[11px]">
                {/* Step 1 */}
                <StepBlock n={1} title="Percentage ÷ Atomic Mass">
                  <div className="space-y-1 font-mono">
                    {steps.moles.map((m) => (
                      <div key={m.sym} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                        <span>
                          <b style={{ color: ELEMS[m.sym].color }}>{m.sym}</b>: {m.pct.toFixed(2)} ÷ {ELEMS[m.sym].mass}
                        </span>
                        <span className="font-bold tabular-nums">= {m.mol.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </StepBlock>
                {/* Step 2 */}
                <StepBlock n={2} title="Divide by smallest → integer ratio">
                  <div className="space-y-1 font-mono">
                    {steps.ints.map((r) => (
                      <div key={r.sym} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                        <span>
                          <b style={{ color: ELEMS[r.sym].color }}>{r.sym}</b>: {r.mol.toFixed(4)} ÷ {Math.min(...steps.moles.map((x) => x.mol)).toFixed(4)}
                        </span>
                        <span className="font-bold tabular-nums">≈ {r.n}</span>
                      </div>
                    ))}
                  </div>
                </StepBlock>
                {/* Step 3 */}
                <StepBlock n={3} title="স্থূল সংকেত · Empirical Formula">
                  <div className="rounded-lg bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 px-3 py-2 text-center">
                    <FormulaText text={steps.empFormula} className="text-lg font-black" />
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      Empirical mass = {steps.empMass.toFixed(1)} g/mol
                    </div>
                  </div>
                </StepBlock>
                {/* Step 4 */}
                <StepBlock n={4} title="আণবিক সংকেত · Molecular Formula">
                  {steps.mm > 0 ? (
                    <>
                      <div className="mb-1.5 rounded bg-muted/50 px-2 py-1 font-mono text-[11px]">
                        n = M / m = {steps.mm} / {steps.empMass.toFixed(1)} ≈ <b>{steps.n}</b>
                      </div>
                      <div className="rounded-lg bg-gradient-to-r from-emerald-500/15 to-teal-500/15 px-3 py-2 text-center">
                        <FormulaText text={steps.molFormula} className="text-xl font-black" />
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-muted-foreground">Molar mass দিন…</div>
                  )}
                </StepBlock>
              </div>
            )}
          </Card>
          <EmpiricalAssistant compound={compound} steps={steps} totalOk={totalOk} />
        </aside>
      </div>
    </main>
  );
}

// Subscript helper
function sub(n: number): string {
  const map: Record<string, string> = { "0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉" };
  return String(n).split("").map((c) => map[c] ?? c).join("");
}

function FormulaText({ text, className }: { text: string; className?: string }) {
  return <span className={cn("tracking-wide", className)}>{text}</span>;
}

function StepBlock({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-fuchsia-200/50 bg-white/60 p-2 dark:bg-slate-900/40">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-[10px] font-black text-white">
          {n}
        </span>
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function PercentPie({ rows }: { rows: { sym: ElemSym; pct: number }[] }) {
  const total = rows.reduce((a, b) => a + b.pct, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0 -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="16" />
        {rows.map((r) => {
          const frac = r.pct / total;
          const dash = C * frac;
          const seg = (
            <circle
              key={r.sym}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={ELEMS[r.sym].chart}
              strokeWidth="16"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
          );
          offset += dash;
          return seg;
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-1">
        {rows.map((r) => (
          <div key={r.sym} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ background: ELEMS[r.sym].chart }}
            />
            <span className="font-bold">{r.sym}</span>
            <span className="text-muted-foreground">{ELEMS[r.sym].name}</span>
            <span className="ml-auto font-mono font-bold tabular-nums">{r.pct.toFixed(2)}%</span>
          </div>
        ))}
        {!rows.length && <div className="text-[11px] text-muted-foreground">No data</div>}
      </div>
    </div>
  );
}

function MoleculeAssembly({ compound }: { compound: Compound }) {
  const [assembled, setAssembled] = useState(false);
  useEffect(() => {
    setAssembled(false);
    const t = setTimeout(() => setAssembled(true), 80);
    return () => clearTimeout(t);
  }, [compound.key]);

  // Container size measured via viewBox → use a fixed 400x300 coord space
  const W = 400, H = 300;
  return (
    <div className="absolute inset-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
        <defs>
          {(Object.keys(ELEMS) as ElemSym[]).map((s) => (
            <radialGradient key={s} id={`atom-${s}`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor={ELEMS[s].color} />
              <stop offset="100%" stopColor={ELEMS[s].ring} />
            </radialGradient>
          ))}
        </defs>
        {/* Bonds */}
        <g style={{ opacity: assembled ? 1 : 0, transition: "opacity 500ms ease 350ms" }}>
          {compound.bonds.map(([a, b], i) => {
            const A = compound.layout[a];
            const B = compound.layout[b];
            if (!A || !B) return null;
            return (
              <line
                key={i}
                x1={A.x * W} y1={A.y * H}
                x2={B.x * W} y2={B.y * H}
                stroke="hsl(var(--foreground) / 0.35)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}
        </g>
        {/* Atoms */}
        {compound.layout.map((a, i) => {
          const targetX = a.x * W;
          const targetY = a.y * H;
          // fly-in start position from screen edge
          const angle = (i / compound.layout.length) * Math.PI * 2;
          const startX = W / 2 + Math.cos(angle) * W;
          const startY = H / 2 + Math.sin(angle) * H;
          return (
            <g
              key={i}
              style={{
                transform: assembled
                  ? `translate(${targetX}px, ${targetY}px)`
                  : `translate(${startX}px, ${startY}px)`,
                transition: `transform 700ms cubic-bezier(.2,.9,.3,1.05) ${i * 45}ms, opacity 400ms ${i * 45}ms`,
                opacity: assembled ? 1 : 0,
              }}
            >
              <circle r={a.r} fill={`url(#atom-${a.sym})`} stroke={ELEMS[a.sym].ring} strokeWidth={1.5} />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={a.r * 0.9}
                fontWeight={900}
                fill={a.sym === "H" || a.sym === "C" && ELEMS.C.color === "#1f2937" ? (a.sym === "H" ? "#0e7490" : "#ffffff") : "#ffffff"}
                style={{ pointerEvents: "none" }}
              >
                {a.sym}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Reassemble button */}
      <button
        onClick={() => { setAssembled(false); setTimeout(() => setAssembled(true), 60); }}
        className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-fuchsia-400/40 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-fuchsia-700 shadow-sm backdrop-blur transition hover:bg-fuchsia-500 hover:text-white dark:bg-slate-900/70 dark:text-fuchsia-300"
      >
        <Sparkles className="h-3 w-3" /> Re-assemble
      </button>
    </div>
  );
}

function EmpiricalAssistant({
  compound,
  steps,
  totalOk,
}: {
  compound: Compound;
  steps: { empFormula: string; molFormula: string; n: number; empMass: number; mm: number } | null;
  totalOk: boolean;
}) {
  let msg: string;
  if (!steps) {
    msg = "শুরু করতে বাম দিক থেকে একটি প্রিসেট যৌগ নির্বাচন কর অথবা মৌলের শতকরা মান দাও।";
  } else if (!totalOk) {
    msg = "শতকরা সংযুতির যোগফল ১০০% হওয়া উচিত — মান একটু সমন্বয় কর, নইলে হিসাব নির্ভুল হবে না।";
  } else if (steps.mm > 0 && steps.n > 1 && steps.empFormula !== steps.molFormula) {
    msg = `খেয়াল করো — ${compound.nameBn} এর স্থূল সংকেত ${steps.empFormula} হলেও, আণবিক ভর (${steps.mm}) থেকে n = ${steps.n} পাই। তাই আসল আণবিক সংকেত ${steps.molFormula}। যেমন গ্লুকোজ ও ফরমালডিহাইড উভয়েরই স্থূল সংকেত CH₂O!`;
  } else {
    msg = `শতকরা সংযুতি থেকে সরাসরি আসল সংকেত পাই না — প্রথমে পাই স্থূল সংকেত (${steps.empFormula})। আণবিক ভর দিলে তবেই আণবিক সংকেত (${steps.molFormula}) বের করা যায়।`;
  }
  return (
    <div className="flex items-start gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-2.5 text-[11.5px] leading-relaxed shadow-sm">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-300">
          Lab AI Assistant
        </div>
        <p className="text-foreground/90">{msg}</p>
      </div>
    </div>
  );
}


