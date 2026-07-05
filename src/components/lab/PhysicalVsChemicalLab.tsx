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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Props {
  onBack: () => void;
}

type Mode = "physical" | "chemical";

/* ──────────────────────────────────────────────────────────────
 * PHYSICAL — H2O molecules in a lattice that melts as T rises
 * ────────────────────────────────────────────────────────────── */
interface WaterMol {
  x: number; y: number;      // current
  hx: number; hy: number;    // home (lattice)
  vx: number; vy: number;
  rot: number; vrot: number;
}

function initWater(w: number, h: number): WaterMol[] {
  const arr: WaterMol[] = [];
  const cols = 12, rows = 8;
  const gapX = w / (cols + 2);
  const gapY = (h - 60) / (rows + 1);
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
 * CHEMICAL — Three-Vessel Reaction Transfer Pipeline
 * C (flask A) + O₂ (flask B) → REACTION ZONE → CO₂ (product flask)
 * ────────────────────────────────────────────────────────────── */
type ChemKind = "C" | "O2" | "CO2";
type ChemPhase = "source" | "travelIn" | "waiting" | "travelOut" | "collected";
interface ChemMol {
  kind: ChemKind;
  phase: ChemPhase;
  x: number; y: number;
  vx: number; vy: number;
  rot: number;
  // bezier travel
  fromX: number; fromY: number;
  toX: number; toY: number;
  ctrlX: number; ctrlY: number;
  t: number;
  reacting: number;
  alive: boolean;
}
interface Spark {
  x: number; y: number; vx: number; vy: number; life: number;
}

interface FlaskRect { cx: number; cy: number; w: number; h: number }
interface ChemLayout {
  fA: FlaskRect; fB: FlaskRect; prod: FlaskRect;
  zone: { cx: number; cy: number; r: number };
}

function chemLayout(w: number, h: number): ChemLayout {
  const fW = Math.min(Math.max(w * 0.18, 90), 130);
  const fH = Math.min(Math.max(h * 0.32, 110), 150);
  const pW = Math.min(Math.max(w * 0.2, 100), 160);
  const pH = Math.min(Math.max(h * 0.7, 200), 340);
  return {
    fB: { cx: 20 + fW / 2, cy: 40 + fH / 2, w: fW, h: fH },              // top-left: O₂
    fA: { cx: 20 + fW / 2, cy: h - 20 - fH / 2, w: fW, h: fH },          // bottom-left: C
    zone: { cx: w * 0.5, cy: h * 0.5, r: Math.min(w, h) * 0.13 },
    prod: { cx: w - 20 - pW / 2, cy: h / 2, w: pW, h: pH },
  };
}

function initChem(w: number, h: number): ChemMol[] {
  const L = chemLayout(w, h);
  const arr: ChemMol[] = [];
  const spawn = (kind: ChemKind, f: FlaskRect) => {
    arr.push({
      kind, phase: "source",
      x: f.cx + (Math.random() - 0.5) * (f.w - 30),
      y: f.cy + (Math.random() - 0.5) * (f.h - 40),
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      rot: Math.random() * Math.PI * 2,
      fromX: 0, fromY: 0, toX: 0, toY: 0, ctrlX: 0, ctrlY: 0,
      t: 0, reacting: 0, alive: true,
    });
  };
  for (let i = 0; i < 8; i++) spawn("C", L.fA);
  for (let i = 0; i < 8; i++) spawn("O2", L.fB);
  return arr;
}

/* ── Canvas helpers (shared) ─────────────────────────────── */
function drawPipe(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  cx: number, cy: number,
  outer: string, inner: string,
) {
  ctx.lineCap = "round";
  ctx.strokeStyle = outer;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
  ctx.strokeStyle = inner;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
}

function drawFlask(
  ctx: CanvasRenderingContext2D,
  f: FlaskRect, label: string, tint: string, accent: string,
) {
  const x = f.cx - f.w / 2;
  const y = f.cy - f.h / 2;
  const r = 12;
  ctx.fillStyle = tint;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + f.w - r, y);
  ctx.quadraticCurveTo(x + f.w, y, x + f.w, y + r);
  ctx.lineTo(x + f.w, y + f.h - r);
  ctx.quadraticCurveTo(x + f.w, y + f.h, x + f.w - r, y + f.h);
  ctx.lineTo(x + r, y + f.h);
  ctx.quadraticCurveTo(x, y + f.h, x, y + f.h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // highlight
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(x + 5, y + 5, 5, f.h - 10);
  // label
  ctx.font = "600 10px ui-sans-serif, system-ui";
  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "center";
  ctx.fillText(label, f.cx, y - 6);
  ctx.textAlign = "left";
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
  const [quizAns, setQuizAns] = useState<(number | null)[]>([null, null]);
  const [co2Count, setCo2Count] = useState(0);

  // Live refs used inside the RAF loop so we don't rebind the loop on
  // every prop change (which was killing the animation between updates).
  const modeRef = useRef<Mode>(mode);
  const tempRef = useRef(temp);
  const playingRef = useRef(playing);
  const bondsRef = useRef(showBonds);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { tempRef.current = temp; }, [temp]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { bondsRef.current = showBonds; }, [showBonds]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Current CSS-pixel canvas size (updated by ResizeObserver).
  const sizeRef = useRef<{ w: number; h: number }>({ w: 720, h: 460 });

  const waterRef = useRef<WaterMol[]>([]);
  const chemRef = useRef<ChemMol[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const emitTimerRef = useRef(0);
  const co2CountRef = useRef(0);

  // Rebuild particles based on the current mode + size.
  const rebuild = useCallback(() => {
    const { w, h } = sizeRef.current;
    waterRef.current = initWater(w, h);
    chemRef.current = initChem(w, h);
    sparksRef.current = [];
    co2CountRef.current = 0;
    setCo2Count(0);
  }, []);

  const resetSim = useCallback(() => { rebuild(); }, [rebuild]);

  // Rebuild when mode changes so particles are freshly scattered.
  useEffect(() => { rebuild(); }, [mode, rebuild]);

  /* ── Canvas sizing (DPR + ResizeObserver) ───────────────── */
  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = containerRef.current;
    if (!cv || !wrap) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(280, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      cv.style.width = w + "px";
      cv.style.height = h + "px";
      const ctx = cv.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const prev = sizeRef.current;
      sizeRef.current = { w, h };
      // On first size OR big size change, rebuild positions.
      if (!waterRef.current.length || Math.abs(prev.w - w) > 40 || Math.abs(prev.h - h) > 40) {
        rebuild();
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener("resize", resize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [rebuild]);

  /* ── Animation loop — mounted ONCE ───────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const { w, h } = sizeRef.current;
      const m = modeRef.current;
      const t = tempRef.current;
      const p = playingRef.current;
      const b = bondsRef.current;

      // Clear (transform is DPR-scaled so use CSS px units)
      ctx.clearRect(0, 0, w, h);

      // Background
      const bgTop = m === "physical" ? "#0b1220" : "#1a0f0a";
      const bgBot = m === "physical" ? "#0f1e33" : "#291509";
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, bgTop);
      grad.addColorStop(1, bgBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Vessel frame
      ctx.strokeStyle = "rgba(148,163,184,0.28)";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      if (p) {
        if (m === "physical") stepPhysical(t, w, h);
        else stepChemical(t, w, h);
      }
      if (m === "physical") drawPhysical(ctx, b, t, w, h);
      else drawChemical(ctx, b, w, h);

      // HUD
      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.fillRect(18, 18, 240, 46);
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.strokeRect(18, 18, 240, 46);
      ctx.font = "600 12px ui-sans-serif, system-ui";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(
        m === "physical" ? "PHYSICAL · Bonds Intact" : "CHEMICAL · Bonds Breaking",
        28, 38,
      );
      ctx.font = "500 11px ui-sans-serif, system-ui";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`Temp: ${t}°  ·  ${p ? "▶ running" : "❚❚ paused"}`, 28, 55);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Physics: physical ─────────────────────────────────── */
  function stepPhysical(t: number, w: number, h: number) {
    const mols = waterRef.current;
    const melt = Math.max(0, Math.min(1, (t - 20) / 60));
    for (const mo of mols) {
      const jitter = 0.05 + melt * 0.9;
      mo.vx += (Math.random() - 0.5) * jitter;
      mo.vy += (Math.random() - 0.5) * jitter;
      const k = 0.06 * (1 - melt) + 0.002;
      mo.vx += (mo.hx - mo.x) * k;
      mo.vy += (mo.hy - mo.y) * k;
      mo.vx *= 0.92;
      mo.vy *= 0.92;
      mo.x += mo.vx;
      mo.y += mo.vy;
      mo.rot += mo.vrot + melt * 0.03;
      if (mo.x < 20) { mo.x = 20; mo.vx *= -0.6; }
      if (mo.x > w - 20) { mo.x = w - 20; mo.vx *= -0.6; }
      if (mo.y < 20) { mo.y = 20; mo.vy *= -0.6; }
      if (mo.y > h - 20) { mo.y = h - 20; mo.vy *= -0.6; }
    }
  }

  /* ── Physics: chemical ─────────────────────────────────── */
  function stepChemical(t: number, w: number, h: number) {
    const L = chemLayout(w, h);
    const mols = chemRef.current;
    const react = t > 45;

    // Per-particle physics
    for (const mo of mols) {
      if (!mo.alive) continue;
      if (mo.reacting > 0) mo.reacting = Math.max(0, mo.reacting - 0.04);

      if (mo.phase === "source") {
        const flask = mo.kind === "C" ? L.fA : L.fB;
        const minX = flask.cx - flask.w / 2 + 12;
        const maxX = flask.cx + flask.w / 2 - 12;
        const minY = flask.cy - flask.h / 2 + 16;
        const maxY = flask.cy + flask.h / 2 - 12;
        mo.vx += (Math.random() - 0.5) * 0.12;
        mo.vy += (Math.random() - 0.5) * 0.12;
        const cap = 0.9;
        const sp = Math.hypot(mo.vx, mo.vy);
        if (sp > cap) { mo.vx = (mo.vx / sp) * cap; mo.vy = (mo.vy / sp) * cap; }
        mo.x += mo.vx; mo.y += mo.vy;
        mo.rot += 0.02;
        if (mo.x < minX) { mo.x = minX; mo.vx *= -1; }
        if (mo.x > maxX) { mo.x = maxX; mo.vx *= -1; }
        if (mo.y < minY) { mo.y = minY; mo.vy *= -1; }
        if (mo.y > maxY) { mo.y = maxY; mo.vy *= -1; }
      } else if (mo.phase === "travelIn" || mo.phase === "travelOut") {
        mo.t += 0.014 + (t / 100) * 0.012;
        if (mo.t >= 1) {
          mo.t = 1;
          mo.x = mo.toX; mo.y = mo.toY;
          if (mo.phase === "travelIn") {
            mo.phase = "waiting";
          } else {
            mo.phase = "collected";
            const pf = L.prod;
            mo.x = pf.cx + (Math.random() - 0.5) * (pf.w - 30);
            mo.y = pf.cy + (Math.random() - 0.4) * (pf.h - 40);
          }
        } else {
          const u = mo.t, iu = 1 - u;
          mo.x = iu * iu * mo.fromX + 2 * iu * u * mo.ctrlX + u * u * mo.toX;
          mo.y = iu * iu * mo.fromY + 2 * iu * u * mo.ctrlY + u * u * mo.toY;
          mo.rot += 0.06;
        }
      } else if (mo.phase === "waiting") {
        mo.x += (Math.random() - 0.5) * 0.4;
        mo.y += (Math.random() - 0.5) * 0.4;
        mo.rot += 0.02;
      } else if (mo.phase === "collected") {
        mo.x += (Math.random() - 0.5) * 0.15;
        mo.y += (Math.random() - 0.5) * 0.15;
      }
    }

    // Emit pair toward zone
    if (react) {
      emitTimerRef.current += 1;
      const cadence = Math.max(28, 110 - t);
      if (emitTimerRef.current > cadence) {
        emitTimerRef.current = 0;
        const c = mols.find(m => m.alive && m.kind === "C" && m.phase === "source");
        const o = mols.find(m => m.alive && m.kind === "O2" && m.phase === "source");
        if (c && o) {
          const launch = (mo: ChemMol, ctrlOffY: number) => {
            const dx = L.zone.cx - mo.x, dy = L.zone.cy - mo.y;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const tx = L.zone.cx - (dx / dist) * (L.zone.r * 0.4);
            const ty = L.zone.cy - (dy / dist) * (L.zone.r * 0.4);
            mo.fromX = mo.x; mo.fromY = mo.y;
            mo.toX = tx; mo.toY = ty;
            mo.ctrlX = (mo.x + tx) / 2;
            mo.ctrlY = (mo.y + ty) / 2 + ctrlOffY;
            mo.t = 0;
            mo.phase = "travelIn";
          };
          launch(c, 30);
          launch(o, -30);
        }
      }

      // Pair up waiting C + O2 into CO2
      const waitC = mols.filter(m => m.alive && m.kind === "C" && m.phase === "waiting");
      const waitO = mols.filter(m => m.alive && m.kind === "O2" && m.phase === "waiting");
      const pairs = Math.min(waitC.length, waitO.length);
      for (let i = 0; i < pairs; i++) {
        const c = waitC[i], o = waitO[i];
        const zx = L.zone.cx, zy = L.zone.cy;
        for (let k = 0; k < 16; k++) {
          const ang = Math.random() * Math.PI * 2;
          const s = 1 + Math.random() * 2.5;
          sparksRef.current.push({
            x: zx, y: zy,
            vx: Math.cos(ang) * s, vy: Math.sin(ang) * s,
            life: 1,
          });
        }
        c.alive = false;
        o.kind = "CO2";
        o.reacting = 1;
        o.x = zx; o.y = zy;
        o.fromX = zx; o.fromY = zy;
        o.toX = L.prod.cx - L.prod.w / 2 + 20 + Math.random() * 20;
        o.toY = L.prod.cy + (Math.random() - 0.5) * 40;
        o.ctrlX = (zx + o.toX) / 2;
        o.ctrlY = zy - 50;
        o.t = 0;
        o.phase = "travelOut";
        co2CountRef.current += 1;
        setCo2Count(co2CountRef.current);
      }
    }

    // Sparks
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
    w: number, h: number,
  ) {
    const mols = waterRef.current;
    const melt = Math.max(0, Math.min(1, (t - 20) / 60));

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

    for (const mo of mols) {
      // O (red) — solid, highly visible
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(mo.x, mo.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(254,226,226,0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // H (light grey) atoms
      const ang1 = mo.rot - 0.9;
      const ang2 = mo.rot + 0.9;
      for (const a of [ang1, ang2]) {
        const hx = mo.x + Math.cos(a) * 11;
        const hy = mo.y + Math.sin(a) * 11;
        ctx.strokeStyle = "rgba(226,232,240,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mo.x, mo.y);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        ctx.fillStyle = "#e5e7eb";
        ctx.beginPath();
        ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.font = "600 12px ui-sans-serif";
    ctx.fillStyle = "#7dd3fc";
    ctx.fillText("H₂O", w - 60, h - 22);
    ctx.fillStyle = "#ef4444"; ctx.fillText("● O", w - 120, h - 22);
    ctx.fillStyle = "#e5e7eb"; ctx.fillText("● H", w - 160, h - 22);
  }

  function drawChemical(
    ctx: CanvasRenderingContext2D,
    bonds: boolean,
    w: number, h: number,
  ) {
    const mols = chemRef.current;
    for (const mo of mols) {
      if (!mo.alive) continue;
      if (mo.kind === "C") {
        ctx.fillStyle = "#374151";
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mo.x, mo.y, 10, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.font = "700 10px ui-sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("C", mo.x - 3, mo.y + 3);
      } else if (mo.kind === "O2") {
        const dx = Math.cos(mo.rot) * 8;
        const dy = Math.sin(mo.rot) * 8;
        if (bonds) {
          ctx.strokeStyle = "#f87171";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(mo.x - dx, mo.y - dy);
          ctx.lineTo(mo.x + dx, mo.y + dy);
          ctx.stroke();
        }
        for (const s of [-1, 1]) {
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(mo.x + dx * s, mo.y + dy * s, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const dx = Math.cos(mo.rot) * 11;
        const dy = Math.sin(mo.rot) * 11;
        if (bonds) {
          ctx.strokeStyle = "#34d399";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(mo.x - dx, mo.y - dy);
          ctx.lineTo(mo.x + dx, mo.y + dy);
          ctx.stroke();
        }
        ctx.fillStyle = "#111827";
        ctx.beginPath(); ctx.arc(mo.x, mo.y, 8, 0, Math.PI * 2); ctx.fill();
        for (const s of [-1, 1]) {
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(mo.x + dx * s, mo.y + dy * s, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        if (mo.reacting > 0) {
          ctx.strokeStyle = `rgba(52,211,153,${mo.reacting})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mo.x, mo.y, 18 + (1 - mo.reacting) * 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    for (const s of sparksRef.current) {
      ctx.fillStyle = `rgba(251,191,36,${s.life})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "600 11px ui-sans-serif";
    ctx.fillStyle = "#fbbf24"; ctx.fillText("● C", w - 150, h - 40);
    ctx.fillStyle = "#f87171"; ctx.fillText("● O₂", w - 110, h - 40);
    ctx.fillStyle = "#34d399"; ctx.fillText("● CO₂", w - 150, h - 22);
  }

  /* ── Derived status text ───────────────────────────────── */
  const status = useMemo(() => {
    if (mode === "physical") {
      if (temp < 20) return { bn: "কঠিন বরফ · Rigid lattice", en: "Bonds intact — solid ice" };
      if (temp < 60) return { bn: "গলছে · Melting", en: "Lattice loosening — bonds intact" };
      return { bn: "তরল পানি · Liquid", en: "Molecules sliding — H₂O unchanged" };
    }
    if (temp < 55) return { bn: "বিক্রিয়ার আগে · Below activation", en: "Bonds intact — no new substance" };
    return { bn: "বন্ধন ভাঙছে · Reacting", en: "Bonds breaking → CO₂ forming" };
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

      {/* Body — unified single-canvas responsive layout */}
      <main className="mx-auto max-w-7xl px-3 pb-8 pt-4 md:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,300px)]">
          <aside className="order-2 lg:order-1">{controls}</aside>

          <section className="order-1 lg:order-2">
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950 shadow-xl"
              style={{ height: "min(70vh, 460px)", minHeight: 300 }}
            >
              <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
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
            <AIBanner mode={mode} />
          </section>

          <aside className="order-3">{dataPanel}</aside>
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
