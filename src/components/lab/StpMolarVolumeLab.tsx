/**
 * STP & Molar Volume Explorer — Chapter 6 · মোল ও রাসায়নিক গণনা
 *
 * Interactive piston chamber that visualises V = n × 22.4 L at STP.
 * Three responsive panes: Gas Source · Piston Lab · Data Panel.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FlaskConical, Lock, RefreshCw, Sparkles, Thermometer, Wind } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type GasKey = "O2" | "H2" | "CO2";

interface GasMeta {
  key: GasKey;
  labelBn: string;
  labelEn: string;
  formula: string;
  M: number;              // g/mol
  radius: number;         // px, particle size
  speed: number;          // relative speed
  color: string;          // fill
  glow: string;           // glow
}

const GASES: Record<GasKey, GasMeta> = {
  H2: {
    key: "H2",
    labelBn: "হাইড্রোজেন",
    labelEn: "Hydrogen",
    formula: "H₂",
    M: 2,
    radius: 4,
    speed: 3.2,
    color: "#7dd3fc",
    glow: "rgba(125,211,252,0.9)",
  },
  O2: {
    key: "O2",
    labelBn: "অক্সিজেন",
    labelEn: "Oxygen",
    formula: "O₂",
    M: 32,
    radius: 6.5,
    speed: 1.8,
    color: "#fb7185",
    glow: "rgba(251,113,133,0.9)",
  },
  CO2: {
    key: "CO2",
    labelBn: "কার্বন ডাই অক্সাইড",
    labelEn: "Carbon Dioxide",
    formula: "CO₂",
    M: 44,
    radius: 9,
    speed: 1.2,
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.9)",
  },
};

const MIN_MOLES = 0.5;
const MAX_MOLES = 3.0;
const STP_VOLUME = 22.4;

// Piston geometry (canvas coords)
const CANVAS_W = 520;
const CANVAS_H = 560;
const CHAMBER_LEFT = 120;
const CHAMBER_RIGHT = 420;
const CHAMBER_TOP_MIN = 60;     // piston can rise this high (max volume ~ 3 mol → 67.2 L)
const CHAMBER_BOTTOM = 520;
const PISTON_H = 26;

function volumeFor(n: number) {
  return n * STP_VOLUME;
}

// Map moles → piston top Y (linear). 0.5 mol shrinks, 3 mol expands.
function pistonYFor(n: number) {
  const maxVol = MAX_MOLES * STP_VOLUME;   // 67.2 L
  const minVol = MIN_MOLES * STP_VOLUME;   // 11.2 L
  const usable = CHAMBER_BOTTOM - CHAMBER_TOP_MIN;
  const v = volumeFor(n);
  const t = (v - minVol) / (maxVol - minVol); // 0..1
  return CHAMBER_BOTTOM - (0.25 + 0.75 * t) * usable;
}

const STP_MOLES = 1.0;
const STP_Y = pistonYFor(STP_MOLES);

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function PistonCanvas({
  gas,
  moles,
  atSTP,
}: {
  gas: GasMeta;
  moles: number;
  atSTP: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pistonYRef = useRef(pistonYFor(moles));
  const rafRef = useRef<number | null>(null);
  const gasRef = useRef(gas);
  const targetYRef = useRef(pistonYFor(moles));

  useEffect(() => {
    gasRef.current = gas;
  }, [gas]);

  useEffect(() => {
    targetYRef.current = pistonYFor(moles);
  }, [moles]);

  // Reseed particles when gas or moles change (count scales with moles)
  useEffect(() => {
    const count = Math.round(20 + moles * 22);
    const arr: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const y = pistonYRef.current + 12 + Math.random() * (CHAMBER_BOTTOM - pistonYRef.current - 20);
      arr.push({
        x: CHAMBER_LEFT + 12 + Math.random() * (CHAMBER_RIGHT - CHAMBER_LEFT - 24),
        y,
        vx: (Math.random() - 0.5) * gas.speed * 2,
        vy: (Math.random() - 0.5) * gas.speed * 2,
      });
    }
    particlesRef.current = arr;
  }, [gas, moles]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      // Ease piston toward target
      pistonYRef.current += (targetYRef.current - pistonYRef.current) * 0.14;
      const pistonY = pistonYRef.current;
      const g = gasRef.current;

      // Clear background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Backdrop grid
      ctx.strokeStyle = "rgba(148,163,184,0.08)";
      ctx.lineWidth = 1;
      for (let y = 40; y < CANVAS_H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }

      // Chamber walls (glass)
      const wallGrad = ctx.createLinearGradient(CHAMBER_LEFT, 0, CHAMBER_RIGHT, 0);
      wallGrad.addColorStop(0, "rgba(148,163,184,0.35)");
      wallGrad.addColorStop(0.5, "rgba(226,232,240,0.08)");
      wallGrad.addColorStop(1, "rgba(148,163,184,0.35)");
      ctx.fillStyle = wallGrad;
      ctx.fillRect(CHAMBER_LEFT - 8, 30, 8, CHAMBER_BOTTOM - 30 + 8);
      ctx.fillRect(CHAMBER_RIGHT, 30, 8, CHAMBER_BOTTOM - 30 + 8);
      // Base
      ctx.fillStyle = "rgba(71,85,105,0.9)";
      ctx.fillRect(CHAMBER_LEFT - 20, CHAMBER_BOTTOM, CHAMBER_RIGHT - CHAMBER_LEFT + 40, 18);

      // Gas fill (subtle tint above the bottom, under piston)
      const gasGrad = ctx.createLinearGradient(0, pistonY, 0, CHAMBER_BOTTOM);
      gasGrad.addColorStop(0, `${g.color}22`);
      gasGrad.addColorStop(1, `${g.color}0a`);
      ctx.fillStyle = gasGrad;
      ctx.fillRect(CHAMBER_LEFT, pistonY + PISTON_H, CHAMBER_RIGHT - CHAMBER_LEFT, CHAMBER_BOTTOM - pistonY - PISTON_H);

      // STP indicator line (22.4 L) — glowing neon
      ctx.save();
      ctx.strokeStyle = atSTP ? "rgba(34,197,94,1)" : "rgba(34,197,94,0.55)";
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = atSTP ? 2.5 : 1.5;
      ctx.shadowColor = "rgba(34,197,94,0.8)";
      ctx.shadowBlur = atSTP ? 22 : 8;
      ctx.beginPath();
      ctx.moveTo(CHAMBER_LEFT - 30, STP_Y);
      ctx.lineTo(CHAMBER_RIGHT + 30, STP_Y);
      ctx.stroke();
      ctx.restore();

      // STP label
      ctx.fillStyle = atSTP ? "#22c55e" : "rgba(134,239,172,0.75)";
      ctx.font = "bold 11px ui-sans-serif, system-ui";
      ctx.fillText("22.4 L · STP", CHAMBER_RIGHT + 34, STP_Y + 4);

      // Update & draw particles
      const particles = particlesRef.current;
      for (const p of particles) {
        // Wall collisions
        if (p.x - g.radius < CHAMBER_LEFT) {
          p.x = CHAMBER_LEFT + g.radius;
          p.vx *= -1;
        } else if (p.x + g.radius > CHAMBER_RIGHT) {
          p.x = CHAMBER_RIGHT - g.radius;
          p.vx *= -1;
        }
        const ceiling = pistonY + PISTON_H + g.radius;
        if (p.y < ceiling) {
          p.y = ceiling;
          p.vy *= -1;
        } else if (p.y + g.radius > CHAMBER_BOTTOM) {
          p.y = CHAMBER_BOTTOM - g.radius;
          p.vy *= -1;
        }
        p.x += p.vx;
        p.y += p.vy;

        // Particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, g.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x - g.radius * 0.3, p.y - g.radius * 0.3, 0.4, p.x, p.y, g.radius);
        grad.addColorStop(0, "#fff");
        grad.addColorStop(0.35, g.color);
        grad.addColorStop(1, g.glow);
        ctx.fillStyle = grad;
        ctx.shadowColor = g.glow;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Piston
      const pistonGrad = ctx.createLinearGradient(0, pistonY, 0, pistonY + PISTON_H);
      pistonGrad.addColorStop(0, "#94a3b8");
      pistonGrad.addColorStop(0.5, "#e2e8f0");
      pistonGrad.addColorStop(1, "#475569");
      ctx.fillStyle = pistonGrad;
      ctx.fillRect(CHAMBER_LEFT - 4, pistonY, CHAMBER_RIGHT - CHAMBER_LEFT + 8, PISTON_H);
      // Piston rod
      ctx.fillStyle = "#64748b";
      ctx.fillRect((CHAMBER_LEFT + CHAMBER_RIGHT) / 2 - 8, 20, 16, pistonY - 20);
      // Rod cap
      ctx.fillStyle = "#334155";
      ctx.fillRect((CHAMBER_LEFT + CHAMBER_RIGHT) / 2 - 30, 12, 60, 12);

      // LOCKED badge inside canvas
      if (atSTP) {
        ctx.save();
        ctx.translate(CANVAS_W / 2, 44);
        ctx.fillStyle = "rgba(34,197,94,0.15)";
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(34,197,94,0.6)";
        ctx.shadowBlur = 16;
        const w = 190;
        const h = 30;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 12px ui-sans-serif, system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🔒 LOCKED AT STP · 22.4 L", 0, 0);
        ctx.restore();
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [atSTP]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="block h-auto w-full"
        style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
      />
      {/* Molarity/Molar-volume HUD */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur">
        <div className="text-[10px] uppercase tracking-wide text-emerald-300/80">Gas · গ্যাস</div>
        <div className="text-sm font-bold text-white">
          {gas.formula} · {gas.labelBn}
        </div>
        <div className="mt-1 text-[10px] text-slate-300">
          n = {moles.toFixed(2)} mol · V = {volumeFor(moles).toFixed(2)} L
        </div>
      </div>
    </div>
  );
}

export default function StpMolarVolumeLab({ onBack }: { onBack: () => void }) {
  const [gasKey, setGasKey] = useState<GasKey>("O2");
  const [moles, setMoles] = useState(1.0);
  const [tempC, setTempC] = useState(0);          // °C, STP = 0
  const [pressure, setPressure] = useState(1);    // atm, STP = 1
  const [mobileTab, setMobileTab] = useState<"source" | "piston" | "data">("piston");

  const gas = GASES[gasKey];
  const isSTP = Math.abs(tempC - 0) < 0.01 && Math.abs(pressure - 1) < 0.01;
  const lockedAtSTP = isSTP && Math.abs(moles - 1) < 0.02;

  const volume = useMemo(() => volumeFor(moles), [moles]);
  const mass = useMemo(() => moles * gas.M, [moles, gas]);
  const particles = useMemo(() => moles * 6.022e23, [moles]);

  const prevLock = useRef(false);
  useEffect(() => {
    if (lockedAtSTP && !prevLock.current) {
      toast.success("🔒 LOCKED AT STP · 22.4 L", {
        description: `১ মোল ${gas.formula} STP-তে ঠিক ২২.৪ L আয়তন দখল করেছে!`,
      });
    }
    prevLock.current = lockedAtSTP;
  }, [lockedAtSTP, gas.formula]);

  const generateReport = useCallback(() => {
    toast(
      `${gas.formula} · ${moles.toFixed(2)} mol → ${volume.toFixed(2)} L · ${mass.toFixed(2)} g`,
      { icon: <Sparkles className="h-4 w-4" /> },
    );
  }, [gas.formula, moles, volume, mass]);

  const resetSTP = () => {
    setTempC(0);
    setPressure(1);
    setMoles(1);
  };

  // ── Panels ─────────────────────────────────────────────────

  const SourcePanel = (
    <Card className="border-slate-800 bg-slate-900/60 p-4 text-slate-100 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <Wind className="h-4 w-4 text-cyan-400" />
        <h2 className="text-sm font-bold">Gas Source · গ্যাস নির্বাচন</h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(GASES) as GasKey[]).map((k) => {
          const g = GASES[k];
          const active = gasKey === k;
          return (
            <button
              key={k}
              onClick={() => setGasKey(k)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all",
                active
                  ? "border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-500/20"
                  : "border-slate-700 bg-slate-950/40 hover:border-slate-600",
              )}
            >
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: g.color, boxShadow: `0 0 8px ${g.glow}` }}
              />
              <span className="text-sm font-bold">{g.formula}</span>
              <span className="text-[10px] text-slate-400">{g.M} g/mol</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{gas.labelBn} · {gas.labelEn}</p>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            মোল · Moles (n)
          </label>
          <Badge variant="secondary" className="bg-slate-800 text-emerald-300">
            {moles.toFixed(2)} mol
          </Badge>
        </div>
        <Slider
          value={[moles]}
          min={MIN_MOLES}
          max={MAX_MOLES}
          step={0.1}
          onValueChange={(v) => setMoles(v[0])}
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>{MIN_MOLES} mol</span>
          <span>{MAX_MOLES} mol</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {[0.5, 1.0, 1.5, 2.0].map((m) => (
            <button
              key={m}
              onClick={() => setMoles(m)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] transition",
                Math.abs(moles - m) < 0.01
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-500",
              )}
            >
              {m} mol
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="flex items-center gap-2">
          <Thermometer className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-xs font-semibold text-slate-300">STP Environment</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Temperature · তাপমাত্রা</span>
          <div className="flex items-center gap-2">
            <span className="tabular-nums text-slate-100">{tempC}°C ({(tempC + 273.15).toFixed(2)} K)</span>
            <Switch checked={tempC === 0} onCheckedChange={(c) => setTempC(c ? 0 : 25)} />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Pressure · চাপ</span>
          <div className="flex items-center gap-2">
            <span className="tabular-nums text-slate-100">{pressure} atm</span>
            <Switch checked={pressure === 1} onCheckedChange={(c) => setPressure(c ? 1 : 2)} />
          </div>
        </div>
        <button
          onClick={resetSTP}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
        >
          <RefreshCw className="h-3 w-3" /> Reset to STP (0°C, 1 atm, 1 mol)
        </button>
      </div>
    </Card>
  );

  const DataPanel = (
    <Card className="border-slate-800 bg-slate-900/60 p-4 text-slate-100 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-emerald-400" />
        <h2 className="text-sm font-bold">Math & Data · গণনা</h2>
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/80">
          Core formula · মূল সূত্র
        </div>
        <div className="mt-1 text-center font-mono text-base text-emerald-200">
          n = V (L) / 22.4
        </div>
        <div className="mt-1 text-center font-mono text-xs text-emerald-300/70">
          V = n × 22.4 L · W = n × M
        </div>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <Row
          label="Volume · আয়তন"
          value={`${volume.toFixed(2)} L`}
          calc={`${moles.toFixed(2)} × 22.4`}
        />
        <Row
          label="Mass · ভর"
          value={`${mass.toFixed(2)} g`}
          calc={`${moles.toFixed(2)} × ${gas.M}`}
        />
        <Row
          label="Molar mass · মোলার ভর"
          value={`${gas.M} g/mol`}
          calc={gas.formula}
        />
        <Row
          label="কণা সংখ্যা"
          value={particles.toExponential(3)}
          calc={`${moles.toFixed(2)} × Nₐ`}
        />
      </div>

      <div
        className={cn(
          "mt-3 rounded-xl border p-3 transition-colors",
          lockedAtSTP
            ? "border-emerald-400/60 bg-emerald-500/10"
            : "border-slate-700 bg-slate-950/40",
        )}
      >
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Lock className={cn("h-3.5 w-3.5", lockedAtSTP ? "text-emerald-300" : "text-slate-500")} />
          <span className={lockedAtSTP ? "text-emerald-300" : "text-slate-400"}>
            {lockedAtSTP ? "STP LOCK ACTIVE · 22.4 L" : "1 mol নাও, STP-তে থাকো — Lock হবে"}
          </span>
        </div>
      </div>

      <Button
        className="mt-4 w-full gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
        onClick={generateReport}
      >
        <Sparkles className="h-4 w-4" /> Generate Lab Report
      </Button>
    </Card>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold md:text-base">STP & Molar Volume Explorer</div>
              <div className="text-[10px] text-slate-400 md:text-xs">
                Chapter 6 · মোল ও রাসায়নিক গণনা
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="hidden gap-1.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 sm:inline-flex">
            V = n × 22.4 L
          </Badge>
        </div>
      </header>

      {/* Desktop grid */}
      <div className="mx-auto hidden max-w-7xl gap-4 px-4 py-6 lg:grid lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        <div>{SourcePanel}</div>
        <div className="flex flex-col items-center gap-3">
          <PistonCanvas gas={gas} moles={moles} atSTP={lockedAtSTP} />
        </div>
        <div>{DataPanel}</div>
      </div>

      {/* Mobile tabs */}
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-4 lg:hidden">
        {mobileTab === "source" && SourcePanel}
        {mobileTab === "piston" && (
          <div className="flex justify-center">
            <PistonCanvas gas={gas} moles={moles} atSTP={lockedAtSTP} />
          </div>
        )}
        {mobileTab === "data" && DataPanel}
      </div>

      {/* AI Assistant banner */}
      <div className="mx-auto max-w-7xl px-4 pb-6">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/50 p-4 text-slate-100">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
              <Sparkles className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="text-sm leading-relaxed">
              <div className="mb-1 text-xs font-bold text-emerald-300">
                Lab AI Assistant · Chemistry সহকারী
              </div>
              <p className="text-slate-200">
                ম্যাজিকটা দেখেছ? তুমি <b>2 g হাইড্রোজেন</b> নাও আর{" "}
                <b>44 g কার্বন ডাই অক্সাইড</b> নাও — <b>১ মোল</b> হলেই STP-তে
                তারা ঠিক <b className="text-emerald-300">২২.৪ লিটার</b> জায়গা
                দখল করবে! তাই পরীক্ষায় গ্যাসের আয়তন দেখলেই চোখ বন্ধ করে{" "}
                <span className="font-mono text-emerald-300">n = V / 22.4</span>{" "}
                সূত্রটি ব্যবহার করবে।
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {([
            { k: "source", label: "Gas Source" },
            { k: "piston", label: "Piston Lab" },
            { k: "data", label: "Data Panel" },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setMobileTab(t.k)}
              className={cn(
                "py-3 text-xs font-semibold transition",
                mobileTab === t.k ? "text-emerald-400" : "text-slate-400",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Row({ label, value, calc }: { label: string; value: string; calc: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 py-2">
      <div>
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className="font-mono text-[10px] text-slate-500">{calc}</div>
      </div>
      <div className="font-mono text-sm font-bold text-emerald-300">{value}</div>
    </div>
  );
}
