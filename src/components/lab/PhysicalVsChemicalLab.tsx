/**
 * Physical vs Chemical Change — Microscopic View
 * চ্যাপ্টার ৭ · রাসায়নিক বিক্রিয়া
 *
 * Split-screen HTML5 canvas simulator contrasting a phase change
 * (ice → water, molecules intact) with a chemical reaction
 * (C + O₂ → CO₂, bonds break & new molecules form).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Snowflake,
  Sparkles,
  CheckCircle2,
  XCircle,
  Atom,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Props {
  onBack: () => void;
}

type Mode = "physical" | "chemical";

const CANVAS_W = 720;
const CANVAS_H = 460;

/* ──────────────────────────────────────────────────────────────
 * PHYSICAL — H2O molecules in a lattice that melts as T rises
 * ────────────────────────────────────────────────────────────── */
interface WaterMol {
  x: number; y: number;      // current
  hx: number; hy: number;    // home (lattice)
  vx: number; vy: number;
  rot: number; vrot: number;
}

function initWater(): WaterMol[] {
  const arr: WaterMol[] = [];
  const cols = 12, rows = 8;
  const gapX = CANVAS_W / (cols + 2);
  const gapY = (CANVAS_H - 60) / (rows + 1);
  const offX = gapX * 1.3;
  const offY = 40;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const stagger = r % 2 === 0 ? 0 : gapX / 2;
      const x = offX + c * gapX + stagger;
      const y = offY + r * gapY;
      arr.push({
        x, y, hx: x, hy: y,
        vx: 0, vy: 0,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.02,
      });
    }
  }
  return arr;
}

/* ──────────────────────────────────────────────────────────────
 * CHEMICAL — C + O2 → CO2
 * ────────────────────────────────────────────────────────────── */
type ChemKind = "C" | "O2" | "CO2";
interface ChemMol {
  kind: ChemKind;
  x: number; y: number;
  vx: number; vy: number;
  rot: number;
  reacting: number;   // 0..1 flash timer
  alive: boolean;
}
interface Spark {
  x: number; y: number; vx: number; vy: number; life: number;
}

function initChem(): ChemMol[] {
  const arr: ChemMol[] = [];
  // 6 carbons + 6 oxygen molecules
  for (let i = 0; i < 6; i++) {
    arr.push({
      kind: "C",
      x: 80 + Math.random() * 260,
      y: 60 + Math.random() * (CANVAS_H - 120),
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      rot: 0, reacting: 0, alive: true,
    });
  }
  for (let i = 0; i < 6; i++) {
    arr.push({
      kind: "O2",
      x: CANVAS_W - 340 + Math.random() * 260,
      y: 60 + Math.random() * (CANVAS_H - 120),
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      rot: Math.random() * Math.PI * 2, reacting: 0, alive: true,
    });
  }
  return arr;
}

/* ──────────────────────────────────────────────────────────────
 * QUIZ
 * ────────────────────────────────────────────────────────────── */
const QUIZ = [
  {
    q: "নতুন পদার্থ তৈরি হয় কোন পরিবর্তনে? / In which change are new substances formed?",
    options: ["ভৌত পরিবর্তন (Physical)", "রাসায়নিক পরিবর্তন (Chemical)"],
    answer: 1,
  },
  {
    q: "বরফ গলে পানি হওয়া কী ধরনের পরিবর্তন? / Melting of ice is a…",
    options: ["ভৌত (Physical)", "রাসায়নিক (Chemical)"],
    answer: 0,
  },
];

/* ══════════════════════════════════════════════════════════════ */

export default function PhysicalVsChemicalLab({ onBack }: Props) {
  const [mode, setMode] = useState<Mode>("physical");
  const [temp, setTemp] = useState(30);           // 0..100
  const [playing, setPlaying] = useState(true);
  const [showBonds, setShowBonds] = useState(true);
  const [tick, setTick] = useState(0);            // reset trigger
  const [quizAns, setQuizAns] = useState<(number | null)[]>([null, null]);
  const [mobileTab, setMobileTab] = useState<"sim" | "data">("sim");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const waterRef = useRef<WaterMol[]>(initWater());
  const chemRef = useRef<ChemMol[]>(initChem());
  const sparksRef = useRef<Spark[]>([]);
  const co2CountRef = useRef(0);
  const [co2Count, setCo2Count] = useState(0);

  const resetSim = useCallback(() => {
    waterRef.current = initWater();
    chemRef.current = initChem();
    sparksRef.current = [];
    co2CountRef.current = 0;
    setCo2Count(0);
    setTick((t) => t + 1);
  }, []);

  // reset when mode changes
  useEffect(() => { resetSim(); }, [mode, resetSim]);

  /* ── Animation loop ─────────────────────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = CANVAS_W * dpr;
    cv.height = CANVAS_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    const draw = () => {
      // BG
      const bgTop = mode === "physical" ? "#0b1220" : "#150b0b";
      const bgBot = mode === "physical" ? "#0f1e33" : "#20120a";
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, bgTop);
      grad.addColorStop(1, bgBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // subtle vessel frame
      ctx.strokeStyle = "rgba(148,163,184,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, CANVAS_W - 24, CANVAS_H - 24);

      if (playing) {
        if (mode === "physical") stepPhysical(temp);
        else stepChemical(temp);
      }

      if (mode === "physical") drawPhysical(ctx, showBonds, temp);
      else drawChemical(ctx, showBonds);

      // HUD
      ctx.fillStyle = "rgba(15,23,42,0.72)";
      ctx.fillRect(20, 20, 240, 44);
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.strokeRect(20, 20, 240, 44);
      ctx.font = "600 12px ui-sans-serif, system-ui";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(
        mode === "physical" ? "PHYSICAL · Bonds Intact" : "CHEMICAL · Bonds Breaking",
        30, 40,
      );
      ctx.font = "500 11px ui-sans-serif, system-ui";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`Temp: ${temp}°  ·  ${playing ? "▶ running" : "❚❚ paused"}`, 30, 56);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    rafRef.current = raf;
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, temp, playing, showBonds, tick]);

  /* ── Physics: physical ─────────────────────────────────── */
  function stepPhysical(t: number) {
    const mols = waterRef.current;
    // 0..1: 0 rigid lattice, 1 fully liquid
    const melt = Math.max(0, Math.min(1, (t - 20) / 60));
    for (const m of mols) {
      const jitter = 0.05 + melt * 0.9;
      m.vx += (Math.random() - 0.5) * jitter;
      m.vy += (Math.random() - 0.5) * jitter;
      // spring back to home (weakens as melt increases)
      const k = 0.06 * (1 - melt) + 0.002;
      m.vx += (m.hx - m.x) * k;
      m.vy += (m.hy - m.y) * k;
      // damping
      m.vx *= 0.92;
      m.vy *= 0.92;
      m.x += m.vx;
      m.y += m.vy;
      m.rot += m.vrot + melt * 0.03;
      // walls
      if (m.x < 20) { m.x = 20; m.vx *= -0.6; }
      if (m.x > CANVAS_W - 20) { m.x = CANVAS_W - 20; m.vx *= -0.6; }
      if (m.y < 20) { m.y = 20; m.vy *= -0.6; }
      if (m.y > CANVAS_H - 20) { m.y = CANVAS_H - 20; m.vy *= -0.6; }
    }
  }

  /* ── Physics: chemical ─────────────────────────────────── */
  function stepChemical(t: number) {
    const mols = chemRef.current;
    // reaction threshold
    const react = t > 55;
    const speed = 0.4 + (t / 100) * 2;
    for (const m of mols) {
      if (!m.alive) continue;
      m.vx += (Math.random() - 0.5) * 0.1;
      m.vy += (Math.random() - 0.5) * 0.1;
      const sp = Math.hypot(m.vx, m.vy);
      if (sp > speed) { m.vx = (m.vx / sp) * speed; m.vy = (m.vy / sp) * speed; }
      m.x += m.vx;
      m.y += m.vy;
      m.rot += 0.03;
      if (m.reacting > 0) m.reacting = Math.max(0, m.reacting - 0.03);
      if (m.x < 20) { m.x = 20; m.vx *= -1; }
      if (m.x > CANVAS_W - 20) { m.x = CANVAS_W - 20; m.vx *= -1; }
      if (m.y < 20) { m.y = 20; m.vy *= -1; }
      if (m.y > CANVAS_H - 20) { m.y = CANVAS_H - 20; m.vy *= -1; }
    }

    // collisions → reaction
    if (react) {
      for (let i = 0; i < mols.length; i++) {
        const a = mols[i];
        if (!a.alive || a.kind !== "C") continue;
        for (let j = 0; j < mols.length; j++) {
          const b = mols[j];
          if (!b.alive || b.kind !== "O2") continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          if (dx * dx + dy * dy < 30 * 30) {
            // produce a CO2 in place of B, kill A
            a.alive = false;
            b.kind = "CO2";
            b.reacting = 1;
            b.vx *= 0.5; b.vy *= 0.5;
            co2CountRef.current += 1;
            setCo2Count(co2CountRef.current);
            // sparks
            const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
            for (let k = 0; k < 14; k++) {
              const ang = Math.random() * Math.PI * 2;
              const s = 1 + Math.random() * 2.5;
              sparksRef.current.push({
                x: cx, y: cy,
                vx: Math.cos(ang) * s, vy: Math.sin(ang) * s,
                life: 1,
              });
            }
            break;
          }
        }
      }
    }

    // sparks
    for (const s of sparksRef.current) {
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.94; s.vy *= 0.94;
      s.life -= 0.03;
    }
    sparksRef.current = sparksRef.current.filter((s) => s.life > 0);
  }

  /* ── Drawers ───────────────────────────────────────────── */
  function drawPhysical(
    ctx: CanvasRenderingContext2D,
    bonds: boolean,
    t: number,
  ) {
    const mols = waterRef.current;
    const melt = Math.max(0, Math.min(1, (t - 20) / 60));

    // lattice / H-bonds (dashed)
    if (bonds) {
      ctx.strokeStyle = `rgba(125,211,252,${0.35 * (1 - melt) + 0.08})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (let i = 0; i < mols.length; i++) {
        for (let j = i + 1; j < mols.length; j++) {
          const a = mols[i], b = mols[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 55 * 55) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.setLineDash([]);
    }

    // molecules — O + 2H
    for (const m of mols) {
      // O
      const grad = ctx.createRadialGradient(m.x - 2, m.y - 2, 1, m.x, m.y, 9);
      grad.addColorStop(0, "#fef3c7");
      grad.addColorStop(1, "#0ea5e9");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
      ctx.fill();
      // H atoms
      const ang1 = m.rot - 0.9;
      const ang2 = m.rot + 0.9;
      for (const a of [ang1, ang2]) {
        const hx = m.x + Math.cos(a) * 11;
        const hy = m.y + Math.sin(a) * 11;
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // covalent bond (always solid — inside molecule)
        ctx.strokeStyle = "rgba(226,232,240,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(hx, hy);
        ctx.stroke();
      }
    }

    // label
    ctx.font = "600 12px ui-sans-serif";
    ctx.fillStyle = "#7dd3fc";
    ctx.fillText("H₂O", CANVAS_W - 60, CANVAS_H - 24);
  }

  function drawChemical(ctx: CanvasRenderingContext2D, bonds: boolean) {
    const mols = chemRef.current;
    for (const m of mols) {
      if (!m.alive) continue;
      if (m.kind === "C") {
        ctx.fillStyle = "#374151";
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 9, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.font = "700 10px ui-sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("C", m.x - 3, m.y + 3);
      } else if (m.kind === "O2") {
        // two red oxygens with double bond
        const dx = Math.cos(m.rot) * 8;
        const dy = Math.sin(m.rot) * 8;
        if (bonds) {
          ctx.strokeStyle = "#f87171";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(m.x - dx, m.y - dy);
          ctx.lineTo(m.x + dx, m.y + dy);
          ctx.stroke();
        }
        for (const s of [-1, 1]) {
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(m.x + dx * s, m.y + dy * s, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.font = "700 9px ui-sans-serif";
        ctx.fillStyle = "#fee2e2";
        ctx.fillText("O", m.x + dx - 3, m.y + dy + 3);
        ctx.fillText("O", m.x - dx - 3, m.y - dy + 3);
      } else {
        // CO2 : O=C=O linear
        const dx = Math.cos(m.rot) * 11;
        const dy = Math.sin(m.rot) * 11;
        if (bonds) {
          ctx.strokeStyle = "#34d399";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(m.x - dx, m.y - dy);
          ctx.lineTo(m.x + dx, m.y + dy);
          ctx.stroke();
        }
        // center C
        ctx.fillStyle = "#111827";
        ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, Math.PI * 2); ctx.fill();
        // O ends
        for (const s of [-1, 1]) {
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(m.x + dx * s, m.y + dy * s, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        // reacting flash
        if (m.reacting > 0) {
          ctx.strokeStyle = `rgba(52,211,153,${m.reacting})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 18 + (1 - m.reacting) * 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    // sparks
    for (const s of sparksRef.current) {
      ctx.fillStyle = `rgba(251,191,36,${s.life})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // legend
    ctx.font = "600 11px ui-sans-serif";
    ctx.fillStyle = "#fbbf24"; ctx.fillText("● C", CANVAS_W - 130, CANVAS_H - 42);
    ctx.fillStyle = "#f87171"; ctx.fillText("● O₂", CANVAS_W - 90, CANVAS_H - 42);
    ctx.fillStyle = "#34d399"; ctx.fillText("● CO₂", CANVAS_W - 130, CANVAS_H - 24);
  }

  /* ── Derived status text ───────────────────────────────── */
  const status = useMemo(() => {
    if (mode === "physical") {
      if (temp < 20) return { bn: "কঠিন বরফ · Rigid lattice", en: "Bonds intact — solid ice", tone: "sky" };
      if (temp < 60) return { bn: "গলছে · Melting", en: "Lattice loosening — bonds intact", tone: "cyan" };
      return { bn: "তরল পানি · Liquid", en: "Molecules sliding — H₂O unchanged", tone: "sky" };
    }
    if (temp < 55) return { bn: "বিক্রিয়ার আগে · Below activation", en: "Bonds intact — no new substance", tone: "amber" };
    return { bn: "বন্ধন ভাঙছে · Reacting", en: "Bonds breaking → new substance CO₂ forming", tone: "emerald" };
  }, [mode, temp]);

  /* ── UI blocks ─────────────────────────────────────────── */
  const controls = (
    <Card className="space-y-4 border border-slate-200/60 bg-white/70 p-4 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70">
      <div className="flex items-center gap-2">
        <Atom className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-bold">Control Panel</h3>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="physical" className="gap-1.5">
            <Snowflake className="h-3.5 w-3.5" /> Physical
          </TabsTrigger>
          <TabsTrigger value="chemical" className="gap-1.5">
            <Flame className="h-3.5 w-3.5" /> Chemical
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="-mt-2 text-[11px] text-muted-foreground">
        {mode === "physical"
          ? "বরফ গলে পানি (Melting Ice) · H₂O অটুট থাকে"
          : "C + O₂ → CO₂ · নতুন পদার্থ তৈরি হয়"}
      </p>

      <div className="flex gap-2">
        <Button
          size="sm" variant={playing ? "secondary" : "default"}
          className="flex-1 gap-1.5"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={resetSim}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold">
            {mode === "physical" ? "Temperature · তাপমাত্রা" : "Energy · শক্তি"}
          </span>
          <Badge variant="secondary" className="tabular-nums">
            {temp}{mode === "physical" ? "°C" : " J"}
          </Badge>
        </div>
        <Slider min={0} max={100} step={1} value={[temp]} onValueChange={([v]) => setTemp(v)} />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>Low</span><span>High</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-slate-50/60 px-3 py-2 dark:border-slate-800/60 dark:bg-slate-800/40">
        <div className="text-xs">
          <div className="font-semibold">Bond Indicators</div>
          <div className="text-[10px] text-muted-foreground">
            {mode === "physical" ? "Dashed = H-bonds" : "Solid = covalent"}
          </div>
        </div>
        <Switch checked={showBonds} onCheckedChange={setShowBonds} />
      </div>
    </Card>
  );

  const dataPanel = (
    <div className="flex flex-col gap-3">
      <Card className={cn(
        "border p-4 backdrop-blur",
        mode === "physical"
          ? "border-sky-300/50 bg-sky-50/60 dark:border-sky-800/50 dark:bg-sky-950/40"
          : "border-emerald-300/50 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-950/40",
      )}>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Molecular Status
        </div>
        <div className="mt-1 text-sm font-extrabold">{status.bn}</div>
        <div className="text-xs text-muted-foreground">{status.en}</div>
        {mode === "chemical" && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-white/60 px-3 py-1.5 text-xs font-semibold dark:bg-slate-900/50">
            <span>CO₂ molecules formed</span>
            <Badge className="bg-emerald-500 tabular-nums">{co2Count}</Badge>
          </div>
        )}
      </Card>

      <Card className="border border-slate-200/60 bg-white/70 p-4 dark:border-slate-800/60 dark:bg-slate-900/70">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          NCTB · অধ্যায় ৭ — রাসায়নিক বিক্রিয়া
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          <b>ভৌত পরিবর্তনে</b> পদার্থের কেবল অবস্থা বা আকার বদলায় — অণু অটুট থাকে
          (যেমন বরফ → পানি)। কিন্তু <b>রাসায়নিক পরিবর্তনে</b> পুরনো বন্ধন ভেঙে
          সম্পূর্ণ নতুন পদার্থ তৈরি হয় (যেমন <span className="font-mono">C + O₂ → CO₂</span>)।
          মাইক্রোস্কোপিক দৃশ্যে এই পার্থক্যই আসল পরিচয়।
        </p>
      </Card>

      <Card className="border border-slate-200/60 bg-white/70 p-4 dark:border-slate-800/60 dark:bg-slate-900/70">
        <div className="mb-2 text-xs font-bold">Quick Check · মাইক্রো কুইজ</div>
        <div className="space-y-3">
          {QUIZ.map((q, qi) => {
            const chosen = quizAns[qi];
            return (
              <div key={qi} className="rounded-lg border border-slate-200/60 p-2.5 dark:border-slate-800/60">
                <div className="text-[11px] font-medium leading-snug">{q.q}</div>
                <div className="mt-2 grid gap-1.5">
                  {q.options.map((opt, oi) => {
                    const isChosen = chosen === oi;
                    const isCorrect = q.answer === oi;
                    const showState = chosen !== null;
                    return (
                      <button
                        key={oi}
                        onClick={() => setQuizAns((a) => { const n = [...a]; n[qi] = oi; return n; })}
                        className={cn(
                          "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition",
                          !showState && "border-slate-200 hover:border-primary hover:bg-primary/5 dark:border-slate-700",
                          showState && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                          showState && isChosen && !isCorrect && "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
                          showState && !isChosen && !isCorrect && "border-slate-200 opacity-60 dark:border-slate-800",
                        )}
                      >
                        {opt}
                        {showState && isCorrect && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {showState && isChosen && !isCorrect && <XCircle className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const canvasBlock = (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "min(70vh, 460px)",
          maxHeight: 460,
          display: "block",
          borderRadius: 16,
        }}
        className="border border-slate-800/50 bg-slate-950 shadow-xl"
      />
      <div className="pointer-events-none absolute right-3 top-3 flex gap-2">
        <Badge className={cn(
          "gap-1",
          mode === "physical" ? "bg-sky-500" : "bg-amber-500",
        )}>
          {mode === "physical" ? <Snowflake className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
          {mode === "physical" ? "Physical" : "Chemical"}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[100dvh] w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-background/80 backdrop-blur-xl dark:border-slate-800/60">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 md:px-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 shadow-lg">
            <Atom className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-extrabold md:text-base">
              ভৌত বনাম রাসায়নিক পরিবর্তন
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              Chapter 7 · Physical vs Chemical Change (Microscopic View)
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-3 pb-8 pt-4 md:px-6">
        {/* Desktop */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,300px)]">
          <aside>{controls}</aside>
          <section>{canvasBlock}<AIBanner mode={mode} /></section>
          <aside>{dataPanel}</aside>
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          <div className="mb-3">{controls}</div>
          <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as "sim" | "data")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sim">Simulation</TabsTrigger>
              <TabsTrigger value="data">Data & Quiz</TabsTrigger>
            </TabsList>
            <TabsContent value="sim" className="mt-3 space-y-3">
              {canvasBlock}
              <AIBanner mode={mode} />
            </TabsContent>
            <TabsContent value="data" className="mt-3">
              {dataPanel}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function AIBanner({ mode }: { mode: Mode }) {
  return (
    <Card className="mt-3 border border-emerald-300/40 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent p-3">
      <div className="flex gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="text-[11px] leading-relaxed">
          <div className="font-bold">Lab AI Assistant</div>
          <p className="text-muted-foreground">
            {mode === "physical"
              ? "খেয়াল করো — বরফ গলে পানি হলেও প্রতিটি অণু কিন্তু এখনও H₂O-ই থেকে যাচ্ছে। শুধু অণুগুলোর সাজানো ভাঙছে, বন্ধন নয়। তাই এটা ভৌত পরিবর্তন — reversible!"
              : "দেখো, তাপমাত্রা বাড়ালে C ও O₂ এর বন্ধন ভেঙে সম্পূর্ণ নতুন অণু CO₂ তৈরি হচ্ছে। নতুন পদার্থ = রাসায়নিক পরিবর্তন। এটি সাধারণত irreversible!"}
          </p>
        </div>
      </div>
    </Card>
  );
}
