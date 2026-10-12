/**
 * NeutralizationReactionLab — Chapter 9 (Acids, Bases & Salts)
 * Simulates neutralization: Acid + Base → Salt + Water via animated
 * ion exchange (H⁺ + OH⁻ → H₂O; spectator Na⁺/Cl⁻ → ionic lattice).
 * Bilingual (Bangla + English). Fully client-side, SVG + rAF driven.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FlaskConical,
  Languages,
  Play,
  RotateCcw,
  Thermometer,
  Sparkles,
  Beaker,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Lang = "bn" | "en";
type ReactionPhase = "unmixed" | "dissociated" | "colliding" | "neutralized";
type ReactionKey = "hcl_naoh" | "hno3_koh";

interface Reactant {
  key: ReactionKey;
  acid: string;
  base: string;
  cationLabel: string; // e.g. Na⁺ or K⁺
  anionLabel: string; // e.g. Cl⁻ or NO₃⁻
  cationColor: string;
  anionColor: string;
  saltFormula: string;
  saltNameBn: string;
  saltNameEn: string;
  totalIonicEq: string;
  netIonicEq: string;
  saltEq: string;
}

interface Ion {
  id: number;
  kind: "H" | "OH" | "cation" | "anion" | "H2O";
  x: number;
  y: number;
  vx: number;
  vy: number;
  partnerId?: number; // for H+/OH- pairing
  settled?: boolean; // for spectator ions locking into lattice
}

// ─────────────────────────────────────────────────────────────
// Localization
// ─────────────────────────────────────────────────────────────
const L = {
  title: { bn: "প্রশমন বিক্রিয়া ও লবণের গঠন", en: "Neutralization Reaction & Salt Formation" },
  subtitle: {
    bn: "আয়নের অদল-বদল · Acid + Base → Salt + Water",
    en: "Ion Exchange · Acid + Base → Salt + Water",
  },
  back: { bn: "ফিরে যান", en: "Back" },
  reactantSelect: { bn: "বিক্রিয়ক নির্বাচন", en: "Reactant Selection" },
  step: { bn: "ধাপ", en: "Step" },
  stepControl: { bn: "মাইক্রো-অ্যানিমেশন টাইমলাইন", en: "Micro-Animation Timeline" },
  mixButton: { bn: "মিশ্রিত করুন", en: "Mix Solutions" },
  reset: { bn: "রিসেট", en: "Reset" },
  heatMonitor: { bn: "প্রশমন তাপ মনিটর", en: "Exothermic Heat Monitor" },
  temperature: { bn: "তাপমাত্রা", en: "Temperature" },
  deltaH: { bn: "ΔH = −৫৭.৩ kJ/mol", en: "ΔH = −57.3 kJ/mol" },
  exothermic: { bn: "বহিঃতাপীয় (তাপ নির্গত)", en: "Exothermic (heat released)" },
  totalIonic: { bn: "সম্পূর্ণ আয়নিক সমীকরণ", en: "Total Ionic Equation" },
  netIonic: { bn: "নেট আয়নিক প্রশমন", en: "Net Ionic Neutralization" },
  saltResidue: { bn: "লবণ কণা (স্ফটিক)", en: "Salt Residue (Crystal)" },
  conceptCheck: { bn: "ধারণা যাচাই", en: "Concept Check" },
  phaseUnmixed: {
    bn: "মিশ্রণের পূর্বে · দুটি আলাদা দ্রবণ",
    en: "Before mixing · two separate solutions",
  },
  phaseDissociated: {
    bn: "আয়ন বিয়োজন · Free H⁺, OH⁻, স্পেক্টেটর আয়ন",
    en: "Dissociation · free H⁺, OH⁻ and spectator ions",
  },
  phaseColliding: {
    bn: "H⁺ + OH⁻ চৌম্বকীয় আকর্ষণে ছুটছে",
    en: "H⁺ + OH⁻ pulled together by attraction",
  },
  phaseNeutralized: { bn: "H₂O + লবণ কেলাস গঠিত", en: "H₂O + ionic salt lattice formed" },
  legend: { bn: "লেজেন্ড", en: "Legend" },
  ionH: { bn: "H⁺ (হাইড্রোজেন)", en: "H⁺ (hydrogen)" },
  ionOH: { bn: "OH⁻ (হাইড্রক্সাইড)", en: "OH⁻ (hydroxide)" },
  ionH2O: { bn: "H₂O (পানি)", en: "H₂O (water)" },
  playStep: { bn: "ধাপে ধাপে চালান", en: "Play step-by-step" },
  acidLabel: { bn: "এসিড", en: "Acid" },
  baseLabel: { bn: "ক্ষারক", en: "Base" },
  saltLabel: { bn: "লবণ", en: "Salt" },
  waterLabel: { bn: "পানি", en: "Water" },
} as const;

const PHASE_ORDER: ReactionPhase[] = ["unmixed", "dissociated", "colliding", "neutralized"];

const REACTIONS: Record<ReactionKey, Reactant> = {
  hcl_naoh: {
    key: "hcl_naoh",
    acid: "HCl",
    base: "NaOH",
    cationLabel: "Na⁺",
    anionLabel: "Cl⁻",
    cationColor: "#c084fc", // purple
    anionColor: "#4ade80", // green
    saltFormula: "NaCl",
    saltNameBn: "সোডিয়াম ক্লোরাইড (খাবার লবণ)",
    saltNameEn: "Sodium Chloride (table salt)",
    totalIonicEq: "H⁺(aq) + Cl⁻(aq) + Na⁺(aq) + OH⁻(aq) → Na⁺(aq) + Cl⁻(aq) + H₂O(l)",
    netIonicEq: "H⁺(aq) + OH⁻(aq) → H₂O(l)",
    saltEq: "Na⁺(aq) + Cl⁻(aq) → NaCl(s)",
  },
  hno3_koh: {
    key: "hno3_koh",
    acid: "HNO₃",
    base: "KOH",
    cationLabel: "K⁺",
    anionLabel: "NO₃⁻",
    cationColor: "#f472b6", // pink
    anionColor: "#38bdf8", // sky
    saltFormula: "KNO₃",
    saltNameBn: "পটাশিয়াম নাইট্রেট (সল্টপিটার)",
    saltNameEn: "Potassium Nitrate (saltpeter)",
    totalIonicEq: "H⁺(aq) + NO₃⁻(aq) + K⁺(aq) + OH⁻(aq) → K⁺(aq) + NO₃⁻(aq) + H₂O(l)",
    netIonicEq: "H⁺(aq) + OH⁻(aq) → H₂O(l)",
    saltEq: "K⁺(aq) + NO₃⁻(aq) → KNO₃(s)",
  },
};

// ─────────────────────────────────────────────────────────────
// Canvas dims
// ─────────────────────────────────────────────────────────────
const CANVAS_W = 640;
const CANVAS_H = 460;
const BEAKER_X = 80;
const BEAKER_Y = 90;
const BEAKER_W = 480;
const BEAKER_H = 320;
const LATTICE_Y = BEAKER_Y + BEAKER_H - 60;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
}

export default function NeutralizationReactionLab({ onBack }: Props) {
  const [lang, setLang] = useState<Lang>("bn");
  const [reactionKey, setReactionKey] = useState<ReactionKey>("hcl_naoh");
  const [phase, setPhase] = useState<ReactionPhase>("unmixed");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [temperature, setTemperature] = useState(25);
  const [ions, setIons] = useState<Ion[]>([]);
  const rafRef = useRef<number | null>(null);
  const nextIdRef = useRef(1);

  const t = useCallback(<K extends keyof typeof L>(k: K): string => L[k][lang], [lang]);
  const reaction = REACTIONS[reactionKey];

  // ── Phase sync from slider index ─────────────────────────
  useEffect(() => {
    setPhase(PHASE_ORDER[phaseIndex]);
  }, [phaseIndex]);

  // ── Build ion set per phase ──────────────────────────────
  useEffect(() => {
    if (phase === "unmixed") {
      setIons([]);
      setTemperature(25);
      return;
    }

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    if (phase === "dissociated") {
      const arr: Ion[] = [];
      const N = 8;
      for (let i = 0; i < N; i++) {
        arr.push({
          id: nextIdRef.current++,
          kind: "H",
          x: rand(BEAKER_X + 40, BEAKER_X + BEAKER_W - 40),
          y: rand(BEAKER_Y + 40, BEAKER_Y + BEAKER_H - 80),
          vx: rand(-0.4, 0.4),
          vy: rand(-0.4, 0.4),
        });
        arr.push({
          id: nextIdRef.current++,
          kind: "OH",
          x: rand(BEAKER_X + 40, BEAKER_X + BEAKER_W - 40),
          y: rand(BEAKER_Y + 40, BEAKER_Y + BEAKER_H - 80),
          vx: rand(-0.4, 0.4),
          vy: rand(-0.4, 0.4),
        });
        arr.push({
          id: nextIdRef.current++,
          kind: "cation",
          x: rand(BEAKER_X + 40, BEAKER_X + BEAKER_W - 40),
          y: rand(BEAKER_Y + 40, BEAKER_Y + BEAKER_H - 80),
          vx: rand(-0.3, 0.3),
          vy: rand(-0.3, 0.3),
        });
        arr.push({
          id: nextIdRef.current++,
          kind: "anion",
          x: rand(BEAKER_X + 40, BEAKER_X + BEAKER_W - 40),
          y: rand(BEAKER_Y + 40, BEAKER_Y + BEAKER_H - 80),
          vx: rand(-0.3, 0.3),
          vy: rand(-0.3, 0.3),
        });
      }
      setIons(arr);
      setTemperature(26);
    } else if (phase === "colliding") {
      // Pair up H+ with nearest OH-; give them velocity toward each other
      setIons((prev) => {
        const source = prev.length > 0 ? prev : createFreshIons();
        const next = source.map((io) => ({ ...io }));
        const hs = next.filter((i) => i.kind === "H");
        const ohs = next.filter((i) => i.kind === "OH");
        hs.forEach((h) => {
          let best: Ion | null = null;
          let bestD = Infinity;
          for (const oh of ohs) {
            if (oh.partnerId) continue;
            const d = (h.x - oh.x) ** 2 + (h.y - oh.y) ** 2;
            if (d < bestD) {
              bestD = d;
              best = oh;
            }
          }
          if (best) {
            h.partnerId = best.id;
            best.partnerId = h.id;
          }
        });
        return next;
      });
      setTemperature(30);
    } else if (phase === "neutralized") {
      // Collapse H+/OH- into H2O; snap spectator ions into lattice
      setIons((prev) => {
        const source = prev.length > 0 ? prev : createFreshIons();
        const water: Ion[] = [];
        const seen = new Set<number>();
        source
          .filter((i) => i.kind === "H")
          .forEach((h) => {
            const oh = source.find((o) => o.id === h.partnerId);
            if (oh && !seen.has(h.id) && !seen.has(oh.id)) {
              seen.add(h.id);
              seen.add(oh.id);
              water.push({
                id: nextIdRef.current++,
                kind: "H2O",
                x: (h.x + oh.x) / 2,
                y: (h.y + oh.y) / 2 - 40,
                vx: 0,
                vy: -0.15,
              });
            }
          });
        // Lattice grid: alternating cation/anion
        const cations = source.filter((i) => i.kind === "cation");
        const anions = source.filter((i) => i.kind === "anion");
        const total = cations.length + anions.length;
        const cols = 8;
        const cellW = 34;
        const cellH = 22;
        const startX = BEAKER_X + BEAKER_W / 2 - (cols * cellW) / 2 + cellW / 2;
        const lattice: Ion[] = [];
        let idx = 0;
        const merged = [...cations, ...anions];
        merged.sort(() => 0);
        // arrange alternating checkerboard
        for (let r = 0; r < Math.ceil(total / cols); r++) {
          for (let c = 0; c < cols; c++) {
            if (idx >= merged.length) break;
            const wantCation = (r + c) % 2 === 0;
            const pool = wantCation ? cations : anions;
            const other = wantCation ? anions : cations;
            const ion = pool.pop() || other.pop();
            if (!ion) continue;
            lattice.push({
              ...ion,
              id: nextIdRef.current++,
              x: startX + c * cellW,
              y: LATTICE_Y - r * cellH,
              vx: 0,
              vy: 0,
              settled: true,
            });
            idx++;
          }
        }
        return [...water, ...lattice];
      });
      setTemperature(33);
    }
  }, [phase]);

  // ── Fresh ion set generator ──────────────────────────────
  const createFreshIons = useCallback((): Ion[] => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const arr: Ion[] = [];
    const N = 8;
    for (let i = 0; i < N; i++) {
      arr.push({
        id: nextIdRef.current++,
        kind: "H",
        x: rand(BEAKER_X + 40, BEAKER_X + BEAKER_W - 40),
        y: rand(BEAKER_Y + 40, BEAKER_Y + BEAKER_H - 80),
        vx: 0,
        vy: 0,
      });
      arr.push({
        id: nextIdRef.current++,
        kind: "OH",
        x: rand(BEAKER_X + 40, BEAKER_X + BEAKER_W - 40),
        y: rand(BEAKER_Y + 40, BEAKER_Y + BEAKER_H - 80),
        vx: 0,
        vy: 0,
      });
      arr.push({
        id: nextIdRef.current++,
        kind: "cation",
        x: rand(BEAKER_X + 40, BEAKER_X + BEAKER_W - 40),
        y: rand(BEAKER_Y + 40, BEAKER_Y + BEAKER_H - 80),
        vx: 0,
        vy: 0,
      });
      arr.push({
        id: nextIdRef.current++,
        kind: "anion",
        x: rand(BEAKER_X + 40, BEAKER_X + BEAKER_W - 40),
        y: rand(BEAKER_Y + 40, BEAKER_Y + BEAKER_H - 80),
        vx: 0,
        vy: 0,
      });
    }
    return arr;
  }, []);

  // ── rAF loop: update ion positions per phase ─────────────
  useEffect(() => {
    if (phase === "unmixed") return;
    const tick = () => {
      setIons((prev) =>
        prev.map((ion) => {
          if (ion.settled) return ion;
          let { x, y, vx, vy } = ion;

          if (phase === "colliding" && (ion.kind === "H" || ion.kind === "OH") && ion.partnerId) {
            const partner = prev.find((p) => p.id === ion.partnerId);
            if (partner) {
              const dx = partner.x - x;
              const dy = partner.y - y;
              const d = Math.sqrt(dx * dx + dy * dy) || 1;
              vx += (dx / d) * 0.25;
              vy += (dy / d) * 0.25;
              vx *= 0.92;
              vy *= 0.92;
            }
          } else if (phase === "neutralized" && ion.kind === "H2O") {
            // gentle drift upward
            vy = -0.15 + Math.sin((x + Date.now() / 400) * 0.05) * 0.05;
            vx = Math.sin((y + Date.now() / 500) * 0.04) * 0.15;
          } else {
            // brownian jitter
            vx += (Math.random() - 0.5) * 0.15;
            vy += (Math.random() - 0.5) * 0.15;
            vx = Math.max(-0.8, Math.min(0.8, vx));
            vy = Math.max(-0.8, Math.min(0.8, vy));
          }

          x += vx;
          y += vy;

          // bounds
          const minX = BEAKER_X + 20;
          const maxX = BEAKER_X + BEAKER_W - 20;
          const minY = BEAKER_Y + 20;
          const maxY = BEAKER_Y + BEAKER_H - 30;
          if (x < minX) {
            x = minX;
            vx = Math.abs(vx);
          }
          if (x > maxX) {
            x = maxX;
            vx = -Math.abs(vx);
          }
          if (y < minY) {
            y = minY;
            vy = Math.abs(vy);
          }
          if (y > maxY) {
            y = maxY;
            vy = -Math.abs(vy);
          }
          return { ...ion, x, y, vx, vy };
        }),
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  // ── Temperature ease ─────────────────────────────────────
  const tempTargetRef = useRef(25);
  useEffect(() => {
    const targets: Record<ReactionPhase, number> = {
      unmixed: 25,
      dissociated: 26,
      colliding: 30,
      neutralized: 33,
    };
    tempTargetRef.current = targets[phase];
  }, [phase]);

  useEffect(() => {
    const id = setInterval(() => {
      setTemperature((t) => {
        const target = tempTargetRef.current;
        if (Math.abs(t - target) < 0.1) return target;
        return t + (target - t) * 0.15;
      });
    }, 60);
    return () => clearInterval(id);
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  const handleMix = useCallback(() => {
    setPhaseIndex(1);
    setTimeout(() => setPhaseIndex(2), 1800);
    setTimeout(() => setPhaseIndex(3), 3800);
  }, []);

  const handleReset = useCallback(() => {
    setPhaseIndex(0);
    setPhase("unmixed");
    setIons([]);
    setTemperature(25);
  }, []);

  // ── Concept line per phase ───────────────────────────────
  const conceptLine = useMemo(() => {
    const map: Record<ReactionPhase, string> = {
      unmixed: t("phaseUnmixed"),
      dissociated: t("phaseDissociated"),
      colliding: t("phaseColliding"),
      neutralized: t("phaseNeutralized"),
    };
    return map[phase];
  }, [phase, t]);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("back")}
            </Button>
            <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 p-2 shadow-lg shadow-rose-500/30">
                <FlaskConical className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 md:text-base">{t("title")}</h1>
                <p className="text-xs text-slate-400">{t("subtitle")}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-200">
              Chapter 9 · অধ্যায় ৯
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang((l) => (l === "bn" ? "en" : "bn"))}
              className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            >
              <Languages className="mr-1 h-4 w-4" />
              {lang === "bn" ? "English" : "বাংলা"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[280px_1fr_320px]">
        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">{t("reactantSelect")}</h2>
            <div className="space-y-2">
              {(Object.keys(REACTIONS) as ReactionKey[]).map((key) => {
                const r = REACTIONS[key];
                const active = reactionKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setReactionKey(key);
                      handleReset();
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      active
                        ? "border-rose-500/60 bg-rose-500/10 shadow-md shadow-rose-500/10"
                        : "border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <span className="text-rose-300">{r.acid}</span>
                      <span className="text-slate-500">+</span>
                      <span className="text-sky-300">{r.base}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <span>→</span>
                      <span className="font-mono text-emerald-300">{r.saltFormula}</span>
                      <span>+ H₂O</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">
                      {lang === "bn" ? r.saltNameBn : r.saltNameEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">{t("stepControl")}</h2>
              <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                {t("step")} {phaseIndex + 1}/4
              </Badge>
            </div>
            <Slider
              value={[phaseIndex]}
              min={0}
              max={3}
              step={1}
              onValueChange={(v) => setPhaseIndex(v[0] ?? 0)}
              className="my-3"
            />
            <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-400">
              {PHASE_ORDER.map((p, i) => (
                <div
                  key={p}
                  className={`text-center ${i === phaseIndex ? "font-bold text-rose-300" : ""}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <Button
                onClick={handleMix}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md hover:from-rose-600 hover:to-pink-700"
              >
                <Play className="mr-1 h-4 w-4" />
                {t("mixButton")}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                {t("reset")}
              </Button>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("legend")}
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <LegendDot color="#f87171" glow label={t("ionH")} />
              <LegendDot color="#60a5fa" glow label={t("ionOH")} />
              <LegendDot color={reaction.cationColor} label={reaction.cationLabel} />
              <LegendDot color={reaction.anionColor} label={reaction.anionLabel} />
              <LegendDot color="#e0e7ff" label={t("ionH2O")} />
            </ul>
          </Card>
        </aside>

        {/* ─── CENTER CANVAS ─── */}
        <section>
          <Card className="border-slate-700/50 bg-slate-900/60 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Beaker className="h-4 w-4 text-rose-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  {lang === "bn" ? "আয়নিক নাচ · অণু-পরমাণুর ভাঙা-গড়া" : "The Ionic Dance"}
                </h2>
              </div>
              <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-200">
                {conceptLine}
              </Badge>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-inner">
              <svg
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                className="h-auto w-full"
                role="img"
                aria-label="Neutralization ion exchange animation"
              >
                <defs>
                  <radialGradient id="hGlow" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#fca5a5" stopOpacity="1" />
                    <stop offset="60%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="ohGlow" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#bfdbfe" stopOpacity="1" />
                    <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#1e293b" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {/* Two separate beakers before mixing */}
                {phase === "unmixed" && (
                  <>
                    <BeakerShape
                      x={140}
                      y={140}
                      w={140}
                      h={220}
                      label={reaction.acid}
                      labelColor="#fca5a5"
                      tint="rgba(239,68,68,0.15)"
                    />
                    <BeakerShape
                      x={360}
                      y={140}
                      w={140}
                      h={220}
                      label={reaction.base}
                      labelColor="#93c5fd"
                      tint="rgba(59,130,246,0.15)"
                    />
                    <text
                      x={CANVAS_W / 2}
                      y={CANVAS_H - 30}
                      textAnchor="middle"
                      className="fill-slate-500"
                      fontSize="14"
                    >
                      {lang === "bn" ? "মিশ্রণের আগে" : "Before mixing"}
                    </text>
                  </>
                )}

                {/* Merged beaker for all mixed phases */}
                {phase !== "unmixed" && (
                  <>
                    {/* Beaker outline */}
                    <path
                      d={`M ${BEAKER_X} ${BEAKER_Y}
                          L ${BEAKER_X} ${BEAKER_Y + BEAKER_H}
                          L ${BEAKER_X + BEAKER_W} ${BEAKER_Y + BEAKER_H}
                          L ${BEAKER_X + BEAKER_W} ${BEAKER_Y}`}
                      fill="url(#liquid)"
                      stroke="#475569"
                      strokeWidth="2.5"
                    />
                    {/* Meniscus */}
                    <line
                      x1={BEAKER_X}
                      y1={BEAKER_Y + 20}
                      x2={BEAKER_X + BEAKER_W}
                      y2={BEAKER_Y + 20}
                      stroke="#64748b"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    {/* Lattice guide (subtle) */}
                    {phase === "neutralized" && (
                      <line
                        x1={BEAKER_X + 20}
                        y1={LATTICE_Y + 10}
                        x2={BEAKER_X + BEAKER_W - 20}
                        y2={LATTICE_Y + 10}
                        stroke="#334155"
                        strokeWidth="1"
                      />
                    )}

                    {/* Ions */}
                    {ions.map((ion) => (
                      <IonSphere key={ion.id} ion={ion} reaction={reaction} />
                    ))}

                    {/* Salt residue caption */}
                    {phase === "neutralized" && (
                      <text
                        x={CANVAS_W / 2}
                        y={BEAKER_Y + BEAKER_H + 30}
                        textAnchor="middle"
                        className="fill-emerald-300"
                        fontSize="13"
                        fontWeight="600"
                      >
                        {reaction.saltFormula} ({lang === "bn" ? "স্ফটিক জালি" : "crystal lattice"})
                      </text>
                    )}
                  </>
                )}
              </svg>
            </div>

            {/* Phase pills */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {PHASE_ORDER.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setPhaseIndex(i)}
                  className={`rounded-lg border p-2 text-[11px] font-medium transition-all ${
                    phase === p
                      ? "border-rose-500/60 bg-rose-500/15 text-rose-200"
                      : "border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {i + 1}. {L[phaseKey(p)][lang]}
                </button>
              ))}
            </div>
          </Card>
        </section>

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside className="space-y-4">
          {/* Heat monitor */}
          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-400" />
              <h2 className="text-sm font-semibold text-slate-200">{t("heatMonitor")}</h2>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 text-center font-mono">
              <div className="text-3xl font-bold text-orange-300 tabular-nums">
                {temperature.toFixed(1)}°C
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{t("temperature")}</div>
            </div>
            <div className="mt-3">
              <Progress value={Math.min(100, ((temperature - 25) / 10) * 100)} className="h-2" />
              <div className="mt-2 text-[11px] text-slate-400">
                <div className="font-mono text-orange-300">{t("deltaH")}</div>
                <div>{t("exothermic")}</div>
              </div>
            </div>
          </Card>

          {/* Equations */}
          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                {lang === "bn" ? "আয়নিক সমীকরণ" : "Ionic Equations"}
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <EqBlock
                title={t("totalIonic")}
                eq={reaction.totalIonicEq}
                active={phase !== "unmixed"}
                color="fuchsia"
              />
              <EqBlock
                title={t("netIonic")}
                eq={reaction.netIonicEq}
                active={phase === "colliding" || phase === "neutralized"}
                color="rose"
              />
              <EqBlock
                title={t("saltResidue")}
                eq={reaction.saltEq}
                active={phase === "neutralized"}
                color="emerald"
              />
            </div>
          </Card>

          {/* Concept check */}
          <Card className="border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-pink-500/5 p-4">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-200">
              {t("conceptCheck")}
            </h2>
            <p className="text-sm text-slate-100">
              <span className="font-mono text-rose-300">{t("acidLabel")}</span> +{" "}
              <span className="font-mono text-sky-300">{t("baseLabel")}</span> ={" "}
              <span className="font-mono text-emerald-300">{t("saltLabel")}</span> +{" "}
              <span className="font-mono text-slate-300">{t("waterLabel")}</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{conceptLine}</p>
          </Card>
        </aside>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────
function phaseKey(
  p: ReactionPhase,
): "phaseUnmixed" | "phaseDissociated" | "phaseColliding" | "phaseNeutralized" {
  switch (p) {
    case "unmixed":
      return "phaseUnmixed";
    case "dissociated":
      return "phaseDissociated";
    case "colliding":
      return "phaseColliding";
    case "neutralized":
      return "phaseNeutralized";
  }
}

function LegendDot({ color, label, glow }: { color: string; label: string; glow?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{
          background: color,
          boxShadow: glow ? `0 0 8px ${color}` : undefined,
        }}
      />
      <span>{label}</span>
    </li>
  );
}

function BeakerShape({
  x,
  y,
  w,
  h,
  label,
  labelColor,
  tint,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  labelColor: string;
  tint: string;
}) {
  return (
    <g>
      <path
        d={`M ${x} ${y} L ${x} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y}`}
        fill={tint}
        stroke="#475569"
        strokeWidth="2"
      />
      <text
        x={x + w / 2}
        y={y + h / 2}
        textAnchor="middle"
        fontSize="24"
        fontWeight="700"
        fill={labelColor}
      >
        {label}
      </text>
    </g>
  );
}

function IonSphere({ ion, reaction }: { ion: Ion; reaction: Reactant }) {
  if (ion.kind === "H") {
    return (
      <g>
        <circle cx={ion.x} cy={ion.y} r={14} fill="url(#hGlow)" opacity={0.55} />
        <circle cx={ion.x} cy={ion.y} r={7} fill="#ef4444" stroke="#fca5a5" strokeWidth={1} />
        <text
          x={ion.x}
          y={ion.y + 3}
          textAnchor="middle"
          fontSize="8"
          fill="white"
          fontWeight="700"
        >
          H⁺
        </text>
      </g>
    );
  }
  if (ion.kind === "OH") {
    return (
      <g>
        <circle cx={ion.x} cy={ion.y} r={14} fill="url(#ohGlow)" opacity={0.55} />
        <circle cx={ion.x} cy={ion.y} r={8} fill="#3b82f6" stroke="#bfdbfe" strokeWidth={1} />
        <text
          x={ion.x}
          y={ion.y + 3}
          textAnchor="middle"
          fontSize="7"
          fill="white"
          fontWeight="700"
        >
          OH⁻
        </text>
      </g>
    );
  }
  if (ion.kind === "cation") {
    return (
      <g>
        <circle
          cx={ion.x}
          cy={ion.y}
          r={8}
          fill={reaction.cationColor}
          stroke="#1e293b"
          strokeWidth={1}
        />
        <text
          x={ion.x}
          y={ion.y + 3}
          textAnchor="middle"
          fontSize="7"
          fill="white"
          fontWeight="700"
        >
          {reaction.cationLabel.slice(0, 2)}
        </text>
      </g>
    );
  }
  if (ion.kind === "anion") {
    return (
      <g>
        <circle
          cx={ion.x}
          cy={ion.y}
          r={8}
          fill={reaction.anionColor}
          stroke="#1e293b"
          strokeWidth={1}
        />
        <text
          x={ion.x}
          y={ion.y + 3}
          textAnchor="middle"
          fontSize="7"
          fill="white"
          fontWeight="700"
        >
          {reaction.anionLabel.slice(0, 2)}
        </text>
      </g>
    );
  }
  // H2O
  return (
    <g>
      <circle
        cx={ion.x}
        cy={ion.y}
        r={9}
        fill="#e0e7ff"
        opacity={0.9}
        stroke="#94a3b8"
        strokeWidth={1}
      />
      <circle cx={ion.x - 5} cy={ion.y - 5} r={3} fill="#fca5a5" />
      <circle cx={ion.x + 5} cy={ion.y - 5} r={3} fill="#fca5a5" />
      <text
        x={ion.x}
        y={ion.y + 3}
        textAnchor="middle"
        fontSize="6"
        fill="#0f172a"
        fontWeight="700"
      >
        H₂O
      </text>
    </g>
  );
}

function EqBlock({
  title,
  eq,
  active,
  color,
}: {
  title: string;
  eq: string;
  active: boolean;
  color: "rose" | "fuchsia" | "emerald";
}) {
  const border = active
    ? {
        rose: "border-rose-500/50 bg-rose-500/10",
        fuchsia: "border-fuchsia-500/50 bg-fuchsia-500/10",
        emerald: "border-emerald-500/50 bg-emerald-500/10",
      }[color]
    : "border-slate-800 bg-slate-950/40 opacity-60";
  const titleColor = {
    rose: "text-rose-300",
    fuchsia: "text-fuchsia-300",
    emerald: "text-emerald-300",
  }[color];
  return (
    <div className={`rounded-lg border p-2 transition-all ${border}`}>
      <div className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${titleColor}`}>
        {title}
      </div>
      <div className="break-words font-mono text-[11px] leading-relaxed text-slate-100">{eq}</div>
    </div>
  );
}
