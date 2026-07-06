/**
 * AntacidActionLab — Chapter 9 (Acids, Bases & Salts)
 * Simulates stomach acidity and antacid neutralization action.
 * Bilingual (Bangla + English). Client-side SVG + rAF driven.
 *
 * Real-world neutralisation context:
 *   Mg(OH)₂ + 2 HCl → MgCl₂ + 2 H₂O
 *   Al(OH)₃ + 3 HCl → AlCl₃ + 3 H₂O
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Languages,
  Pill,
  Utensils,
  RotateCcw,
  Activity,
  Flame,
  Droplets,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Lang = "bn" | "en";
type Meal = "none" | "healthy" | "oily";
type Antacid = "mgoh2" | "aloh3";

interface Ion {
  id: number;
  kind: "H" | "Cl" | "OH" | "M" | "H2O";
  x: number;
  y: number;
  vx: number;
  vy: number;
  gone?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Localization
// ─────────────────────────────────────────────────────────────
const L = {
  title: { bn: "পাকস্থলীর এসিডিটি ও এন্টাসিডের ভূমিকা", en: "Stomach Acidity & Antacid Action" },
  subtitle: {
    bn: "প্রশমন বিক্রিয়ার বাস্তব প্রয়োগ · Mg(OH)₂ / Al(OH)₃ + HCl",
    en: "Real-world neutralization · Mg(OH)₂ / Al(OH)₃ + HCl",
  },
  back: { bn: "ফিরে যান", en: "Back" },
  reset: { bn: "রিসেট", en: "Reset" },
  diet: { bn: "খাবার নির্বাচন", en: "Diet Trigger" },
  medicine: { bn: "এন্টাসিড ডোজ", en: "Antacid Dose" },
  takeMed: { bn: "ওষুধ খান", en: "Take Medicine" },
  healthy: { bn: "স্বাভাবিক খাবার", en: "Healthy Balanced Meal" },
  oily: { bn: "তেল-চর্বিযুক্ত/ফাস্টফুড", en: "Rich / Oily Food" },
  mgoh2: { bn: "মিল্ক অব ম্যাগনেসিয়া", en: "Milk of Magnesia" },
  aloh3: { bn: "অ্যালুমিনিয়াম হাইড্রক্সাইড", en: "Aluminum Hydroxide" },
  stomach: { bn: "পাকস্থলী", en: "Stomach" },
  micro: { bn: "মাইক্রোস্কোপিক দৃশ্য", en: "Microscopic View" },
  ph: { bn: "pH", en: "pH" },
  comfort: { bn: "আরাম মিটার", en: "Comfort Meter" },
  discomfort: { bn: "অস্বস্তি / জ্বালাপোড়া", en: "Heartburn / Discomfort" },
  neutral: { bn: "প্রশমিত · স্বস্তি ফিরে এসেছে", en: "Neutralized · relief restored" },
  baseline: { bn: "স্বাভাবিক অবস্থা", en: "Baseline resting state" },
  reaction: { bn: "সংঘটিত বিক্রিয়া", en: "Reaction Occurring" },
  legend: { bn: "লেজেন্ড", en: "Legend" },
  ionH: { bn: "H⁺ (হাইড্রোজেন)", en: "H⁺ (hydrogen)" },
  ionCl: { bn: "Cl⁻ (ক্লোরাইড)", en: "Cl⁻ (chloride)" },
  ionOH: { bn: "OH⁻ (হাইড্রক্সাইড)", en: "OH⁻ (hydroxide)" },
  ionM: { bn: "Mg²⁺ / Al³⁺ ধাতু আয়ন", en: "Mg²⁺ / Al³⁺ metal ion" },
  ionH2O: { bn: "H₂O (পানি)", en: "H₂O (water)" },
  observations: { bn: "পর্যবেক্ষণ", en: "Observations" },
  obsHealthy: {
    bn: "স্বাভাবিক পাচক রস · pH ≈ ২ · কোনো অস্বস্তি নেই।",
    en: "Normal digestive juice · pH ≈ 2 · no discomfort.",
  },
  obsOily: {
    bn: "অতিরিক্ত HCl নিঃসরণ · pH ≈ ১ · জ্বালাপোড়া, অ্যাসিডিটি।",
    en: "Excess HCl secreted · pH ≈ 1 · burning, heartburn.",
  },
  obsMed: {
    bn: "OH⁻ আয়ন H⁺ কে ধরে H₂O বানাচ্ছে · pH বাড়ছে · আরাম ফিরছে।",
    en: "OH⁻ ions capture H⁺ forming H₂O · pH rises · relief returning.",
  },
  concept: { bn: "মূল ধারণা", en: "Key Concept" },
  keyIdea: {
    bn: "এন্টাসিড হলো দুর্বল ক্ষারক যা পাকস্থলীর অতিরিক্ত HCl প্রশমিত করে নিরাপদ লবণ ও পানি তৈরি করে।",
    en: "Antacids are mild bases that neutralize excess stomach HCl to produce a harmless salt and water.",
  },
  chooseFirst: { bn: "প্রথমে একটি খাবার নির্বাচন করুন", en: "Select a meal first" },
  takeAdvice: { bn: "অ্যাসিডিটি চললে এন্টাসিড দিন", en: "Give antacid while acidity persists" },
} as const;

// Reaction meta per antacid
const ANTACIDS = {
  mgoh2: {
    formula: "Mg(OH)₂",
    metal: "Mg²⁺",
    salt: "MgCl₂",
    color: "#f5f5f4",
    eqBn: "Mg(OH)₂ + 2 HCl → MgCl₂ + 2 H₂O",
    eqEn: "Mg(OH)₂ + 2 HCl → MgCl₂ + 2 H₂O",
  },
  aloh3: {
    formula: "Al(OH)₃",
    metal: "Al³⁺",
    salt: "AlCl₃",
    color: "#e0e7ff",
    eqBn: "Al(OH)₃ + 3 HCl → AlCl₃ + 3 H₂O",
    eqEn: "Al(OH)₃ + 3 HCl → AlCl₃ + 3 H₂O",
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
}

const MICRO_W = 360;
const MICRO_H = 300;

export default function AntacidActionLab({ onBack }: Props) {
  const [lang, setLang] = useState<Lang>("bn");
  const [meal, setMeal] = useState<Meal>("none");
  const [antacid, setAntacid] = useState<Antacid>("mgoh2");
  const [medTaken, setMedTaken] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 neutralization progress
  const [ions, setIons] = useState<Ion[]>([]);
  const rafRef = useRef<number | null>(null);
  const nextIdRef = useRef(1);

  const t = useCallback(<K extends keyof typeof L>(k: K): string => L[k][lang], [lang]);

  // Derived acid intensity 0..1
  const acidLoad = meal === "oily" ? 1 : meal === "healthy" ? 0.3 : 0;
  // pH: baseline 2, oily 1, healed rises back
  const pH = useMemo(() => {
    if (meal === "none") return 6.5;
    const base = meal === "oily" ? 1.2 : 2.2;
    return Math.min(6.5, base + progress * 4.5);
  }, [meal, progress]);

  // Fluid tint (angry red-orange when acidic, cool blue when neutral)
  const fluidColor = useMemo(() => {
    if (meal === "none") return "rgba(120,180,220,0.55)";
    const acidity = Math.max(0, 1 - (pH - 1.2) / 5);
    const r = Math.round(80 + 190 * acidity);
    const g = Math.round(180 - 130 * acidity);
    const b = Math.round(220 - 180 * acidity);
    return `rgba(${r},${g},${b},0.6)`;
  }, [meal, pH]);

  const fluidLevel = meal === "oily" ? 0.85 : meal === "healthy" ? 0.55 : 0.35;

  // Rebuild ions on meal/antacid change
  useEffect(() => {
    if (meal === "none") {
      setIons([]);
      setMedTaken(false);
      setProgress(0);
      return;
    }
    const arr: Ion[] = [];
    const nH = meal === "oily" ? 22 : 10;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < nH; i++) {
      arr.push({
        id: nextIdRef.current++, kind: "H",
        x: rand(30, MICRO_W - 30), y: rand(30, MICRO_H - 30),
        vx: rand(-0.7, 0.7), vy: rand(-0.7, 0.7),
      });
      arr.push({
        id: nextIdRef.current++, kind: "Cl",
        x: rand(30, MICRO_W - 30), y: rand(30, MICRO_H - 30),
        vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5),
      });
    }
    setIons(arr);
    setMedTaken(false);
    setProgress(0);
  }, [meal]);

  // Take medicine — inject OH⁻ and metal cations
  const takeMedicine = useCallback(() => {
    if (meal === "none") return;
    const nHpresent = ions.filter((i) => i.kind === "H" && !i.gone).length;
    const nOH = Math.max(nHpresent + 4, 14);
    const nM = antacid === "mgoh2" ? Math.ceil(nOH / 2) : Math.ceil(nOH / 3);
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const additions: Ion[] = [];
    for (let i = 0; i < nOH; i++) {
      additions.push({
        id: nextIdRef.current++, kind: "OH",
        x: rand(30, MICRO_W - 30), y: rand(10, 40),
        vx: rand(-0.5, 0.5), vy: rand(0.3, 0.9),
      });
    }
    for (let i = 0; i < nM; i++) {
      additions.push({
        id: nextIdRef.current++, kind: "M",
        x: rand(30, MICRO_W - 30), y: rand(10, 40),
        vx: rand(-0.4, 0.4), vy: rand(0.3, 0.7),
      });
    }
    setIons((prev) => [...prev, ...additions]);
    setMedTaken(true);
  }, [meal, ions, antacid]);

  // rAF loop: move ions, resolve H⁺+OH⁻ → H₂O
  useEffect(() => {
    if (meal === "none") return;
    const step = () => {
      setIons((prev) => {
        if (prev.length === 0) return prev;
        const next = prev.map((io) => {
          if (io.gone) return io;
          let x = io.x + io.vx;
          let y = io.y + io.vy;
          let vx = io.vx;
          let vy = io.vy;
          if (x < 20 || x > MICRO_W - 20) { vx = -vx; x = Math.max(20, Math.min(MICRO_W - 20, x)); }
          if (y < 20 || y > MICRO_H - 20) { vy = -vy; y = Math.max(20, Math.min(MICRO_H - 20, y)); }
          return { ...io, x, y, vx, vy };
        });

        // Pair H+ with nearest OH- if close enough → H2O
        const hs = next.filter((i) => i.kind === "H" && !i.gone);
        const ohs = next.filter((i) => i.kind === "OH" && !i.gone);
        const used = new Set<number>();
        for (const h of hs) {
          let best: Ion | null = null;
          let bestD = 40 * 40;
          for (const oh of ohs) {
            if (used.has(oh.id)) continue;
            const d = (h.x - oh.x) ** 2 + (h.y - oh.y) ** 2;
            if (d < bestD) { bestD = d; best = oh; }
          }
          if (best) {
            used.add(best.id);
            used.add(h.id);
            h.gone = true;
            best.gone = true;
            next.push({
              id: nextIdRef.current++, kind: "H2O",
              x: (h.x + best.x) / 2, y: (h.y + best.y) / 2,
              vx: (h.vx + best.vx) / 2 * 0.6, vy: (h.vy + best.vy) / 2 * 0.6,
            });
          } else {
            // Also attract slightly toward nearest OH even if not close yet
            let near: Ion | null = null;
            let nd = Infinity;
            for (const oh of ohs) {
              if (used.has(oh.id)) continue;
              const d = (h.x - oh.x) ** 2 + (h.y - oh.y) ** 2;
              if (d < nd) { nd = d; near = oh; }
            }
            if (near) {
              const dx = near.x - h.x, dy = near.y - h.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              h.vx += (dx / dist) * 0.05;
              h.vy += (dy / dist) * 0.05;
              near.vx -= (dx / dist) * 0.04;
              near.vy -= (dy / dist) * 0.04;
            }
          }
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [meal]);

  // Track progress from H⁺ consumption
  useEffect(() => {
    if (!medTaken) return;
    const total = ions.filter((i) => i.kind === "H").length;
    const gone = ions.filter((i) => i.kind === "H" && i.gone).length;
    if (total > 0) setProgress(Math.min(1, gone / total));
  }, [ions, medTaken]);

  const reset = () => {
    setMeal("none");
    setMedTaken(false);
    setProgress(0);
    setIons([]);
  };

  const visibleIons = ions.filter((i) => !i.gone || i.kind === "H2O");
  const acidActive = meal !== "none" && progress < 0.9;

  const meta = ANTACIDS[antacid];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Top bar */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-300 hover:text-white">
              <ArrowLeft className="mr-1 h-4 w-4" /> {t("back")}
            </Button>
            <div>
              <h1 className="text-base font-bold md:text-lg">{t("title")}</h1>
              <p className="text-xs text-slate-400">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            >
              <Languages className="mr-1 h-4 w-4" />
              {lang === "bn" ? "English" : "বাংলা"}
            </Button>
            <Button variant="outline" size="sm" onClick={reset}
              className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800">
              <RotateCcw className="mr-1 h-4 w-4" /> {t("reset")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[280px_1fr_300px]">
        {/* ── LEFT: Diet & Medicine ────────────────────── */}
        <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Utensils className="h-4 w-4 text-amber-400" />
              {t("diet")}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setMeal("healthy")}
                className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                  meal === "healthy"
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-100"
                    : "border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-500"
                }`}
              >
                <div className="font-semibold">{t("healthy")}</div>
                <div className="mt-1 text-xs opacity-80">pH ≈ 2 · baseline</div>
              </button>
              <button
                onClick={() => setMeal("oily")}
                className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                  meal === "oily"
                    ? "border-rose-500 bg-rose-500/15 text-rose-100"
                    : "border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-500"
                }`}
              >
                <div className="font-semibold">{t("oily")}</div>
                <div className="mt-1 text-xs opacity-80">Excess HCl · pH ≈ 1</div>
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Pill className="h-4 w-4 text-sky-400" />
              {t("medicine")}
            </div>
            <Tabs value={antacid} onValueChange={(v) => setAntacid(v as Antacid)}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="mgoh2" className="text-xs">Mg(OH)₂</TabsTrigger>
                <TabsTrigger value="aloh3" className="text-xs">Al(OH)₃</TabsTrigger>
              </TabsList>
              <TabsContent value="mgoh2" className="mt-2 text-xs text-slate-300">
                {t("mgoh2")} — {ANTACIDS.mgoh2.eqEn}
              </TabsContent>
              <TabsContent value="aloh3" className="mt-2 text-xs text-slate-300">
                {t("aloh3")} — {ANTACIDS.aloh3.eqEn}
              </TabsContent>
            </Tabs>
          </div>

          <Button
            onClick={takeMedicine}
            disabled={meal === "none" || medTaken}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40"
          >
            <Pill className="mr-1 h-4 w-4" /> {t("takeMed")}
          </Button>

          <div className="rounded-md border border-slate-700 bg-slate-800/50 p-3 text-xs text-slate-300">
            <div className="mb-1 font-semibold text-slate-100">{t("concept")}</div>
            {t("keyIdea")}
          </div>
        </Card>

        {/* ── CENTER: Stomach + Microscopic ────────────── */}
        <Card className="border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Stomach */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">{t("stomach")}</div>
                <Badge variant="outline" className="border-slate-600 bg-slate-800 text-xs text-slate-200">
                  pH {pH.toFixed(1)}
                </Badge>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950/70 p-2">
                <svg viewBox="0 0 260 300" className="mx-auto h-64 w-full">
                  <defs>
                    <radialGradient id="stomachTissue" cx="50%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#fca5a5" />
                      <stop offset="60%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#881337" />
                    </radialGradient>
                    <clipPath id="stomachClip">
                      <path d="M80 30 Q60 40 55 90 Q40 130 60 200 Q80 270 150 275 Q220 265 210 200 Q225 140 200 100 Q195 55 155 40 Q120 25 100 40 Q88 20 80 30 Z" />
                    </clipPath>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="b" />
                      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  {/* tissue */}
                  <path
                    d="M80 30 Q60 40 55 90 Q40 130 60 200 Q80 270 150 275 Q220 265 210 200 Q225 140 200 100 Q195 55 155 40 Q120 25 100 40 Q88 20 80 30 Z"
                    fill="url(#stomachTissue)" stroke="#7f1d1d" strokeWidth="2"
                    filter={acidActive && meal === "oily" ? "url(#glow)" : undefined}
                  />
                  {/* esophagus */}
                  <rect x="115" y="10" width="20" height="30" fill="#be123c" />
                  {/* fluid */}
                  <g clipPath="url(#stomachClip)">
                    <rect
                      x="0" y={300 - fluidLevel * 240}
                      width="260" height={fluidLevel * 240}
                      fill={fluidColor}
                    >
                      <animate attributeName="y" values={`${300 - fluidLevel * 240};${298 - fluidLevel * 240};${300 - fluidLevel * 240}`} dur="2s" repeatCount="indefinite" />
                    </rect>
                    {/* bubbles when acidic */}
                    {acidActive && meal === "oily" &&
                      Array.from({ length: 6 }).map((_, i) => (
                        <circle key={i} cx={70 + i * 25} cy={260 - (i % 3) * 20}
                          r="4" fill="rgba(255,200,120,0.7)">
                          <animate attributeName="cy" from="260" to="80" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.9;0.9;0" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                        </circle>
                      ))
                    }
                  </g>
                  {/* pain sparks */}
                  {acidActive && meal === "oily" && (
                    <g>
                      {[[70, 90], [190, 100], [60, 180], [200, 190], [100, 60]].map(([x, y], i) => (
                        <text key={i} x={x} y={y} fontSize="16" fill="#fde047">
                          <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />⚡
                        </text>
                      ))}
                    </g>
                  )}
                </svg>

                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-rose-400" />
                      {t("comfort")}
                    </span>
                    <span>{Math.round(progress * 100)}%</span>
                  </div>
                  <Progress value={medTaken ? progress * 100 : (meal === "oily" ? 5 : meal === "healthy" ? 55 : 80)} />
                </div>
              </div>
            </div>

            {/* Microscopic zoom */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">{t("micro")}</div>
                <Badge variant="outline" className="border-slate-600 bg-slate-800 text-xs text-slate-200">
                  <Activity className="mr-1 h-3 w-3" />
                  {medTaken ? t("reaction") : meal !== "none" ? t("obsOily") : t("baseline")}
                </Badge>
              </div>
              <div className="relative overflow-hidden rounded-full border-4 border-slate-700 bg-slate-950">
                <svg viewBox={`0 0 ${MICRO_W} ${MICRO_H}`} className="aspect-square w-full">
                  <defs>
                    <radialGradient id="microBg" cx="50%" cy="50%" r="55%">
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#020617" />
                    </radialGradient>
                  </defs>
                  <rect x="0" y="0" width={MICRO_W} height={MICRO_H} fill="url(#microBg)" />
                  {/* stomach lining hint */}
                  <path d={`M0 ${MICRO_H - 10} Q${MICRO_W / 2} ${MICRO_H - 30} ${MICRO_W} ${MICRO_H - 10} L${MICRO_W} ${MICRO_H} L0 ${MICRO_H} Z`}
                    fill="#7f1d1d" opacity="0.35" />
                  {visibleIons.map((io) => {
                    if (io.kind === "H")
                      return <g key={io.id}>
                        <circle cx={io.x} cy={io.y} r="9" fill="#fb7185" />
                        <text x={io.x} y={io.y + 3.5} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">H⁺</text>
                      </g>;
                    if (io.kind === "Cl")
                      return <g key={io.id}>
                        <circle cx={io.x} cy={io.y} r="9" fill="#4ade80" />
                        <text x={io.x} y={io.y + 3.5} textAnchor="middle" fontSize="9" fill="#052e16" fontWeight="bold">Cl⁻</text>
                      </g>;
                    if (io.kind === "OH")
                      return <g key={io.id}>
                        <circle cx={io.x} cy={io.y} r="9" fill="#38bdf8" />
                        <text x={io.x} y={io.y + 3.5} textAnchor="middle" fontSize="8" fill="#082f49" fontWeight="bold">OH⁻</text>
                      </g>;
                    if (io.kind === "M")
                      return <g key={io.id}>
                        <circle cx={io.x} cy={io.y} r="10" fill="#a78bfa" />
                        <text x={io.x} y={io.y + 3.5} textAnchor="middle" fontSize="8" fill="#1e1b4b" fontWeight="bold">{meta.metal}</text>
                      </g>;
                    return <g key={io.id}>
                      <circle cx={io.x} cy={io.y} r="7" fill="#e0f2fe" opacity="0.85" />
                      <text x={io.x} y={io.y + 3} textAnchor="middle" fontSize="7" fill="#0c4a6e" fontWeight="bold">H₂O</text>
                    </g>;
                  })}
                  {meal === "none" && (
                    <text x={MICRO_W / 2} y={MICRO_H / 2} textAnchor="middle" fill="#64748b" fontSize="12">
                      {t("chooseFirst")}
                    </text>
                  )}
                </svg>
              </div>
              <div className="mt-2 rounded-md border border-slate-700 bg-slate-800/40 p-2 text-xs text-slate-300">
                {meal === "none"
                  ? t("chooseFirst")
                  : !medTaken
                  ? meal === "oily" ? t("obsOily") : t("obsHealthy")
                  : progress > 0.9 ? t("neutral") : t("obsMed")}
              </div>
            </div>
          </div>

          {/* Equation strip */}
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3 font-mono text-sm text-emerald-300">
            <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
              {lang === "bn" ? "প্রশমন সমীকরণ" : "Neutralization Equation"}
            </div>
            {lang === "bn" ? meta.eqBn : meta.eqEn}
            <div className="mt-1 text-xs text-sky-300">
              H⁺ + OH⁻ → H₂O · {lang === "bn" ? "লবণ" : "salt"}: {meta.salt}
            </div>
          </div>
        </Card>

        {/* ── RIGHT: Legend & Observations ────────────── */}
        <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-amber-400" />
              {t("legend")}
            </div>
            <div className="space-y-2 text-xs">
              <LegendRow color="#fb7185" text={t("ionH")} />
              <LegendRow color="#4ade80" text={t("ionCl")} />
              <LegendRow color="#38bdf8" text={t("ionOH")} />
              <LegendRow color="#a78bfa" text={t("ionM")} />
              <LegendRow color="#e0f2fe" text={t("ionH2O")} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Droplets className="h-4 w-4 text-sky-400" />
              {t("observations")}
            </div>
            <div className="space-y-2 text-xs">
              <ObsCard active={meal === "healthy"} color="emerald" text={t("obsHealthy")} />
              <ObsCard active={meal === "oily" && !medTaken} color="rose" text={t("obsOily")} />
              <ObsCard active={medTaken && progress < 0.9} color="sky" text={t("obsMed")} />
              <ObsCard active={medTaken && progress >= 0.9} color="teal" text={t("neutral")} />
            </div>
          </div>

          {meal === "oily" && !medTaken && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">
              {t("takeAdvice")}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function LegendRow({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800/50 px-2 py-1">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      <span className="text-slate-200">{text}</span>
    </div>
  );
}

function ObsCard({ active, color, text }: { active: boolean; color: "emerald" | "rose" | "sky" | "teal"; text: string }) {
  const map = {
    emerald: "border-emerald-500 bg-emerald-500/15 text-emerald-100",
    rose: "border-rose-500 bg-rose-500/15 text-rose-100",
    sky: "border-sky-500 bg-sky-500/15 text-sky-100",
    teal: "border-teal-500 bg-teal-500/15 text-teal-100",
  };
  return (
    <div
      className={`rounded-md border p-2 transition ${
        active ? map[color] : "border-slate-700 bg-slate-800/40 text-slate-400 opacity-60"
      }`}
    >
      {text}
    </div>
  );
}
