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
type Phase = "idle" | "transfer" | "react" | "deliver" | "done";

interface Mover {
  kind: Kind;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t0: number;
  dur: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

// ── Reaction Canvas — 3-Vessel Pipeline ─────────────────────
function ReactionCanvas({
  h2Count,
  o2Count,
  running,
  onReactionEnd,
  paused,
  resetKey,
}: {
  h2Count: number;
  o2Count: number;
  running: boolean;
  onReactionEnd: (produced: number, limiting: Kind) => void;
  paused: boolean;
  resetKey: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const [size, setSize] = useState({ w: 640, h: 380 });

  const h2Rem = useRef(h2Count);
  const o2Rem = useRef(o2Count);
  const h2oMade = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const phaseStart = useRef(0);
  const moversRef = useRef<Mover[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const limitingRef = useRef<Kind | null>(null);
  const blinkRef = useRef(0);
  const endedRef = useRef(false);

  useEffect(() => {
    h2Rem.current = h2Count;
    o2Rem.current = o2Count;
    h2oMade.current = 0;
    phaseRef.current = "idle";
    phaseStart.current = performance.now();
    moversRef.current = [];
    sparksRef.current = [];
    limitingRef.current = null;
    endedRef.current = false;
  }, [h2Count, o2Count, resetKey]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: Math.max(320, Math.floor(cr.width)), h: Math.max(260, Math.floor(cr.height)) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const geom = useMemo(() => {
    const W = size.w;
    const H = size.h;
    const pad = 10;
    const colW = Math.min(150, W * 0.24);
    const vesselH = (H - pad * 3) / 2;
    const vesselA = { x: pad, y: pad, w: colW, h: vesselH };
    const vesselB = { x: pad, y: pad * 2 + vesselH, w: colW, h: vesselH };
    const vesselC = { x: W - pad - colW, y: pad, w: colW, h: H - pad * 2 };
    const center = { x: W / 2, y: H / 2 };
    return { W, H, vesselA, vesselB, vesselC, center };
  }, [size.w, size.h]);

  const slotPos = useCallback(
    (v: { x: number; y: number; w: number; h: number }, i: number, total: number, r: number) => {
      const cols = Math.max(2, Math.ceil(Math.sqrt(Math.max(1, total) * (v.w / v.h))));
      const rows = Math.max(2, Math.ceil(Math.max(1, total) / cols));
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = cols > 1 ? (v.w - 2 * r - 8) / (cols - 1) : 0;
      const cellH = rows > 1 ? (v.h - 2 * r - 8) / (rows - 1) : 0;
      const x = v.x + r + 4 + col * cellW;
      const y = v.y + r + 4 + row * cellH;
      return { x, y };
    },
    [],
  );

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

    const DUR = { idle: 250, transfer: 800, react: 350, deliver: 800 };

    const startPhase = (p: Phase, t: number) => {
      phaseRef.current = p;
      phaseStart.current = t;
    };

    const beginTransfer = (t: number) => {
      const { vesselA, vesselB, center } = geom;
      const movers: Mover[] = [];
      for (let k = 0; k < 2; k++) {
        const idx = h2Rem.current - 1 - k;
        const p = slotPos(vesselA, idx, h2Rem.current, 14);
        movers.push({
          kind: "H2",
          sx: p.x,
          sy: p.y,
          tx: center.x + (k === 0 ? -22 : 22),
          ty: center.y - 8,
          t0: t,
          dur: DUR.transfer,
        });
      }
      const oIdx = o2Rem.current - 1;
      const op = slotPos(vesselB, oIdx, o2Rem.current, 18);
      movers.push({
        kind: "O2",
        sx: op.x,
        sy: op.y,
        tx: center.x,
        ty: center.y + 14,
        t0: t,
        dur: DUR.transfer,
      });
      moversRef.current = movers;
      startPhase("transfer", t);
    };

    const beginReact = (t: number) => {
      const { center } = geom;
      const sparks: Spark[] = [];
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 2.5;
        sparks.push({ x: center.x, y: center.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 350 });
      }
      sparksRef.current = sparks;
      h2Rem.current = Math.max(0, h2Rem.current - 2);
      o2Rem.current = Math.max(0, o2Rem.current - 1);
      moversRef.current = [];
      startPhase("react", t);
    };

    const beginDeliver = (t: number) => {
      const { vesselC, center } = geom;
      const base = h2oMade.current;
      const movers: Mover[] = [];
      for (let k = 0; k < 2; k++) {
        const p = slotPos(vesselC, base + k, base + 2, 16);
        movers.push({
          kind: "H2O",
          sx: center.x + (k === 0 ? -14 : 14),
          sy: center.y,
          tx: p.x,
          ty: p.y,
          t0: t,
          dur: DUR.deliver,
        });
      }
      moversRef.current = movers;
      startPhase("deliver", t);
    };

    const finishAndMaybeLoop = (t: number) => {
      moversRef.current = [];
      if (h2Rem.current >= 2 && o2Rem.current >= 1) {
        startPhase("idle", t);
        return;
      }
      let limiting: Kind;
      if (h2Rem.current < 2 && o2Rem.current >= 1) limiting = "H2";
      else if (o2Rem.current < 1 && h2Rem.current >= 2) limiting = "O2";
      else limiting = h2Count / 2 <= o2Count ? "H2" : "O2";
      limitingRef.current = limiting;
      endedRef.current = true;
      phaseRef.current = "done";
      onReactionEnd(h2oMade.current, limiting);
    };

    const step = (t: number) => {
      const { W, H, vesselA, vesselB, vesselC, center } = geom;

      const bg = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H));
      bg.addColorStop(0, "#0b1220");
      bg.addColorStop(1, "#020617");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      drawArrow(ctx, vesselA.x + vesselA.w + 6, vesselA.y + vesselA.h / 2, center.x - 40, center.y - 8);
      drawArrow(ctx, vesselB.x + vesselB.w + 6, vesselB.y + vesselB.h / 2, center.x - 40, center.y + 12);
      drawArrow(ctx, center.x + 40, center.y, vesselC.x - 6, vesselC.y + vesselC.h / 2);

      const zonePulse =
        phaseRef.current === "react" ? 1 - (t - phaseStart.current) / DUR.react : 0.15;
      ctx.save();
      ctx.strokeStyle = `rgba(250,204,21,${0.35 + Math.max(0, zonePulse) * 0.5})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, 46 + Math.max(0, zonePulse) * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "rgba(148,163,184,0.55)";
      ctx.font = "bold 10px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText("REACTION ZONE", center.x, center.y - 54);
      ctx.fillText("বিক্রিয়া অঞ্চল", center.x, center.y + 66);

      blinkRef.current += 0.08;
      const limiting = limitingRef.current;
      drawVessel(ctx, vesselA, "Vessel A · H₂", "H₂ ট্যাংক", "#0891b2", endedRef.current && limiting === "H2", blinkRef.current);
      drawVessel(ctx, vesselB, "Vessel B · O₂", "O₂ ট্যাংক", "#c2410c", endedRef.current && limiting === "O2", blinkRef.current);
      drawVessel(ctx, vesselC, "Vessel C · H₂O", "উৎপাদ পাত্র", "#0ea5e9", false, blinkRef.current);

      if (h2oMade.current > 0) {
        const maxCap = Math.max(2, Math.min(h2Count, o2Count * 2));
        const frac = Math.min(1, h2oMade.current / maxCap);
        const fillH = (vesselC.h - 16) * frac;
        const fillY = vesselC.y + vesselC.h - 8 - fillH;
        const g = ctx.createLinearGradient(0, fillY, 0, fillY + fillH);
        g.addColorStop(0, "rgba(56,189,248,0.35)");
        g.addColorStop(1, "rgba(56,189,248,0.10)");
        ctx.fillStyle = g;
        ctx.fillRect(vesselC.x + 6, fillY, vesselC.w - 12, fillH);
      }

      for (let i = 0; i < h2Rem.current; i++) {
        const p = slotPos(vesselA, i, h2Rem.current, 14);
        drawH2(ctx, p.x, p.y, endedRef.current && limiting === "H2" ? blinkRef.current : 0);
      }
      for (let i = 0; i < o2Rem.current; i++) {
        const p = slotPos(vesselB, i, o2Rem.current, 18);
        drawO2(ctx, p.x, p.y, endedRef.current && limiting === "O2" ? blinkRef.current : 0);
      }
      for (let i = 0; i < h2oMade.current; i++) {
        const p = slotPos(vesselC, i, h2oMade.current, 16);
        drawH2O(ctx, p.x, p.y);
      }

      if (running && !paused && !endedRef.current) {
        const elapsed = t - phaseStart.current;
        const cur = phaseRef.current;
        if (cur === "idle") {
          if (elapsed >= DUR.idle) {
            if (h2Rem.current >= 2 && o2Rem.current >= 1) beginTransfer(t);
            else finishAndMaybeLoop(t);
          }
        } else if (cur === "transfer" && elapsed >= DUR.transfer) beginReact(t);
        else if (cur === "react" && elapsed >= DUR.react) beginDeliver(t);
        else if (cur === "deliver" && elapsed >= DUR.deliver) finishAndMaybeLoop(t);
      }

      for (const m of moversRef.current) {
        const p = Math.min(1, (t - m.t0) / m.dur);
        const e = easeInOut(p);
        const x = m.sx + (m.tx - m.sx) * e;
        const y = m.sy + (m.ty - m.sy) * e;
        if (m.kind === "H2") drawH2(ctx, x, y, 0);
        else if (m.kind === "O2") drawO2(ctx, x, y, 0);
        else drawH2O(ctx, x, y);
      }

      if (sparksRef.current.length) {
        const next: Spark[] = [];
        for (const s of sparksRef.current) {
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.96;
          s.vy *= 0.96;
          s.life += 16;
          const a = 1 - s.life / s.max;
          if (a > 0) {
            ctx.fillStyle = `rgba(253,224,71,${a})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            next.push(s);
          }
        }
        sparksRef.current = next;
      }

      drawHudChip(ctx, 8, H - 26, `H₂: ${h2Rem.current}`, "#22d3ee");
      drawHudChip(ctx, 82, H - 26, `O₂: ${o2Rem.current}`, "#fb923c");
      drawHudChip(ctx, 156, H - 26, `H₂O: ${h2oMade.current}`, "#38bdf8");

      if (endedRef.current && limiting) {
        const flash = 0.7 + 0.3 * Math.sin(blinkRef.current * 2);
        ctx.fillStyle = `rgba(239,68,68,${flash})`;
        roundRect(ctx, W / 2 - 135, 6, 270, 22, 6);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px ui-sans-serif, system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`LIMITING: ${limiting === "H2" ? "H₂" : "O₂"} · শেষ হয়ে গেছে`, W / 2, 17);
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size.w, size.h, geom, running, paused, onReactionEnd, slotPos, h2Count, o2Count]);

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-inner"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

// ── Drawing helpers ─────────────────────────────────────────
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function drawVessel(
  ctx: CanvasRenderingContext2D,
  v: { x: number; y: number; w: number; h: number },
  label: string,
  bnLabel: string,
  tint: string,
  blinking: boolean,
  phase: number,
) {
  ctx.save();
  const pulse = blinking ? 0.5 + 0.5 * Math.sin(phase * 2) : 0;
  ctx.strokeStyle = blinking ? `rgba(239,68,68,${0.7 + pulse * 0.3})` : "rgba(148,163,184,0.55)";
  ctx.lineWidth = blinking ? 2.5 : 1.5;
  roundRect(ctx, v.x, v.y, v.w, v.h, 12);
  ctx.fillStyle = blinking ? `rgba(239,68,68,${0.05 + pulse * 0.08})` : "rgba(15,23,42,0.4)";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tint;
  roundRect(ctx, v.x + 6, v.y + 6, Math.min(v.w - 12, 118), 18, 6);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, v.x + 12, v.y + 15);
  ctx.fillStyle = "rgba(226,232,240,0.75)";
  ctx.font = "9px ui-sans-serif, system-ui";
  ctx.fillText(bnLabel, v.x + 6, v.y + v.h - 8);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.fillStyle = "rgba(148,163,184,0.55)";
  ctx.translate(x2, y2);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-8, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawH2(ctx: CanvasRenderingContext2D, x: number, y: number, blinkPhase: number) {
  const off = 6;
  if (blinkPhase) {
    const a = 0.4 + 0.4 * Math.sin(blinkPhase * 2);
    ctx.save();
    ctx.shadowColor = `rgba(239,68,68,${a})`;
    ctx.shadowBlur = 10;
  }
  drawAtom(ctx, x - off, y, 7, "#67e8f9", "#0891b2");
  drawAtom(ctx, x + off, y, 7, "#67e8f9", "#0891b2");
  strokeBond(ctx, x - off, y, x + off, y, "#a5f3fc");
  if (blinkPhase) ctx.restore();
}

function drawO2(ctx: CanvasRenderingContext2D, x: number, y: number, blinkPhase: number) {
  const off = 8;
  if (blinkPhase) {
    const a = 0.4 + 0.4 * Math.sin(blinkPhase * 2);
    ctx.save();
    ctx.shadowColor = `rgba(239,68,68,${a})`;
    ctx.shadowBlur = 10;
  }
  drawAtom(ctx, x - off, y, 10, "#fb923c", "#c2410c");
  drawAtom(ctx, x + off, y, 10, "#fb923c", "#c2410c");
  strokeBond(ctx, x - off, y, x + off, y, "#fdba74");
  if (blinkPhase) ctx.restore();
}

function drawH2O(ctx: CanvasRenderingContext2D, x: number, y: number) {
  drawAtom(ctx, x, y, 9, "#f87171", "#991b1b");
  const a = Math.PI / 4;
  const d = 11;
  const hx1 = x - Math.cos(a) * d;
  const hy1 = y + Math.sin(a) * d;
  const hx2 = x + Math.cos(a) * d;
  const hy2 = y + Math.sin(a) * d;
  strokeBond(ctx, x, y, hx1, hy1, "#fecaca");
  strokeBond(ctx, x, y, hx2, hy2, "#fecaca");
  drawAtom(ctx, hx1, hy1, 5, "#e0f2fe", "#38bdf8");
  drawAtom(ctx, hx2, hy2, 5, "#e0f2fe", "#38bdf8");
}

function drawHudChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.85)";
  roundRect(ctx, x, y, 68, 20, 6);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "bold 11px ui-sans-serif, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 34, y + 10);
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
  const [resetKey, setResetKey] = useState(0);

  const stoich = useMemo(() => computeLimiting(h2, o2), [h2, o2]);

  const start = useCallback(() => {
    setProducedMolecules(0);
    setReactionEnded(false);
    setResetKey((k) => k + 1);
    setRunning(true);
    setPaused(false);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setPaused(false);
    setProducedMolecules(0);
    setReactionEnded(false);
    setResetKey((k) => k + 1);
  }, []);

  const onReactionEnd = useCallback((produced: number, _limiting: Kind) => {
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
