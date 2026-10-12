/**
 * PetroleumDistillationLab — Chapter 11 theory lab
 * Interactive Fractional Distillation of Petroleum simulator.
 * Bengali-first with English technical terms in brackets.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Flame,
  Droplet,
  Wind,
  Fuel,
  Car,
  Truck,
  Cog,
  Layers,
  Sparkles,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DraggableTheoryFab from "./DraggableTheoryFab";

/* ────────────────── Fraction data ────────────────── */
type Fraction = {
  id: string;
  nameBn: string;
  nameEn: string;
  bpMin: number; // °C
  bpMax: number; // °C (Infinity for residue)
  cMin: number;
  cMax: number; // sentinel large number for residue
  usesBn: string[];
  color: string; // tailwind bg color for column band + chip
  ring: string;
  outletColor: string;
  icon: typeof Fuel;
};

const FRACTIONS: Fraction[] = [
  {
    id: "gas",
    nameBn: "পেট্রোলিয়াম গ্যাস",
    nameEn: "Petroleum Gas (LPG)",
    bpMin: -160,
    bpMax: 20,
    cMin: 1,
    cMax: 4,
    usesBn: ["রান্নার গ্যাস (LPG)", "গৃহস্থালি জ্বালানি"],
    color: "from-sky-400/70 to-cyan-400/50",
    ring: "ring-sky-400/60",
    outletColor: "bg-sky-400",
    icon: Wind,
  },
  {
    id: "petrol",
    nameBn: "পেট্রোল (গ্যাসোলিন)",
    nameEn: "Gasoline / Petrol",
    bpMin: 20,
    bpMax: 70,
    cMin: 5,
    cMax: 10,
    usesBn: ["গাড়ির জ্বালানি", "মোটরসাইকেল"],
    color: "from-yellow-300/70 to-amber-300/50",
    ring: "ring-amber-400/60",
    outletColor: "bg-amber-400",
    icon: Car,
  },
  {
    id: "naphtha",
    nameBn: "ন্যাপথা",
    nameEn: "Naphtha",
    bpMin: 70,
    bpMax: 120,
    cMin: 8,
    cMax: 12,
    usesBn: ["পেট্রোকেমিক্যাল কাঁচামাল", "প্লাস্টিক শিল্প"],
    color: "from-amber-400/70 to-orange-400/50",
    ring: "ring-orange-400/60",
    outletColor: "bg-orange-400",
    icon: Sparkles,
  },
  {
    id: "kerosene",
    nameBn: "কেরোসিন",
    nameEn: "Kerosene",
    bpMin: 120,
    bpMax: 170,
    cMin: 10,
    cMax: 16,
    usesBn: ["জেট ফুয়েল", "কুপি বাতি", "স্টোভ"],
    color: "from-orange-400/70 to-red-400/50",
    ring: "ring-orange-500/60",
    outletColor: "bg-orange-500",
    icon: Droplet,
  },
  {
    id: "diesel",
    nameBn: "ডিজেল তেল",
    nameEn: "Diesel Oil",
    bpMin: 170,
    bpMax: 250,
    cMin: 14,
    cMax: 20,
    usesBn: ["ট্রাক-বাস", "জেনারেটর", "ট্রেন"],
    color: "from-red-400/70 to-rose-500/50",
    ring: "ring-rose-500/60",
    outletColor: "bg-rose-500",
    icon: Truck,
  },
  {
    id: "fuel_oil",
    nameBn: "জ্বালানি তেল",
    nameEn: "Fuel Oil",
    bpMin: 250,
    bpMax: 300,
    cMin: 20,
    cMax: 30,
    usesBn: ["জাহাজের জ্বালানি", "ইন্ডাস্ট্রিয়াল বয়লার"],
    color: "from-rose-500/70 to-fuchsia-600/50",
    ring: "ring-fuchsia-500/60",
    outletColor: "bg-fuchsia-500",
    icon: Fuel,
  },
  {
    id: "lube",
    nameBn: "লুব্রিকেটিং তেল",
    nameEn: "Lubricating Oil",
    bpMin: 300,
    bpMax: 350,
    cMin: 30,
    cMax: 40,
    usesBn: ["ইঞ্জিন অয়েল", "মেশিন লুব্রিকেন্ট", "গ্রীজ"],
    color: "from-purple-500/70 to-violet-700/50",
    ring: "ring-violet-500/60",
    outletColor: "bg-violet-500",
    icon: Cog,
  },
  {
    id: "bitumen",
    nameBn: "বিটুমিন / আলকাতরা",
    nameEn: "Bitumen",
    bpMin: 350,
    bpMax: 999,
    cMin: 40,
    cMax: 70,
    usesBn: ["রাস্তার পিচ", "ছাদের জলরোধক"],
    color: "from-neutral-700/80 to-black/70",
    ring: "ring-neutral-500/60",
    outletColor: "bg-neutral-800",
    icon: Layers,
  },
];

function fractionAt(temp: number): Fraction {
  return (
    FRACTIONS.find((f) => temp >= f.bpMin && temp < f.bpMax) ?? FRACTIONS[FRACTIONS.length - 1]
  );
}

/* ────────────────── Main Component ────────────────── */
export default function PetroleumDistillationLab({ onBack }: { onBack: () => void }) {
  const [temp, setTemp] = useState(80);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const active = useMemo(() => fractionAt(temp), [temp]);

  // Auto-advance simple steps when running
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setStepIdx((s) => Math.min(3, s + 1));
    }, 1400);
    return () => clearInterval(t);
  }, [running]);

  const handleReset = () => {
    setRunning(false);
    setTemp(20);
    setStepIdx(0);
  };

  const handleRun = () => {
    setRunning(true);
    setStepIdx(1);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 h-8 shrink-0 gap-1 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">ফিরে যান</span>
            </Button>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow">
              <Flame className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-base font-extrabold tracking-tight">
                পেট্রোলিয়ামের আংশিক পাতন
              </div>
              <div className="truncate text-xs text-muted-foreground">
                Chapter 11 · Fractional Distillation of Petroleum
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
            {Math.round(temp)}°C · {active.nameEn}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 pb-24">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* LEFT: Column simulation (Panel 1) */}
          <FractionatingColumn temp={temp} running={running} active={active} />

          {/* RIGHT COLUMN: molecular + graph + control + steps */}
          <div className="grid gap-4">
            <MolecularPanel active={active} />
            <BoilingPointGraph active={active} temp={temp} />
            <ControlPanel
              temp={temp}
              setTemp={setTemp}
              running={running}
              onRun={handleRun}
              onReset={handleReset}
              active={active}
            />
            <StepsStatusPanel stepIdx={stepIdx} active={active} running={running} />
          </div>
        </div>
      </main>

      <DraggableTheoryFab storageKey="petroleum-distillation">
        <h3>আংশিক পাতন (Fractional Distillation) কী?</h3>
        <p>
          বিভিন্ন উপাদানের স্ফুটনাঙ্কের (Boiling Point) পার্থক্যকে কাজে লাগিয়ে অপরিশোধিত তেল (Crude
          Oil) থেকে বিভিন্ন উপযোগী উপাদান আলাদা করার পদ্ধতিকে
          <strong> আংশিক পাতন</strong> বলে। এটি একটি লম্বা <em>Fractionating Column</em> বা
          পাতন-স্তম্ভে সম্পন্ন হয়।
        </p>

        <h4>মূলনীতি (Principle)</h4>
        <ul>
          <li>কম কার্বন সংখ্যা (short chain) = কম আন্তঃআণবিক বল = কম স্ফুটনাঙ্ক।</li>
          <li>বেশি কার্বন সংখ্যা (long chain) = বেশি আন্তঃআণবিক বল = বেশি স্ফুটনাঙ্ক।</li>
          <li>স্তম্ভের নিচে তাপমাত্রা বেশি, উপরে ধীরে ধীরে কমে যায়।</li>
          <li>প্রতিটি হাইড্রোকার্বন তার নিজ স্ফুটনাঙ্কের স্তরে ঘনীভূত হয়ে বেরিয়ে আসে।</li>
        </ul>

        <h4>প্রধান অংশ (Fractions) ও ব্যবহার</h4>
        <table>
          <thead>
            <tr>
              <th>ভগ্নাংশ</th>
              <th>C-সংখ্যা</th>
              <th>স্ফুটনাঙ্ক (°C)</th>
              <th>ব্যবহার</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Petroleum Gas</td>
              <td>C₁–C₄</td>
              <td>&lt; 20</td>
              <td>LPG, রান্নার গ্যাস</td>
            </tr>
            <tr>
              <td>Petrol / Gasoline</td>
              <td>C₅–C₁₀</td>
              <td>20–70</td>
              <td>গাড়ির জ্বালানি</td>
            </tr>
            <tr>
              <td>Naphtha</td>
              <td>C₈–C₁₂</td>
              <td>70–120</td>
              <td>পেট্রোকেমিক্যাল কাঁচামাল</td>
            </tr>
            <tr>
              <td>Kerosene</td>
              <td>C₁₀–C₁₆</td>
              <td>120–170</td>
              <td>জেট ফুয়েল, স্টোভ</td>
            </tr>
            <tr>
              <td>Diesel</td>
              <td>C₁₄–C₂₀</td>
              <td>170–250</td>
              <td>ট্রাক-বাস, জেনারেটর</td>
            </tr>
            <tr>
              <td>Fuel Oil</td>
              <td>C₂₀–C₃₀</td>
              <td>250–300</td>
              <td>জাহাজ, বয়লার</td>
            </tr>
            <tr>
              <td>Lubricating Oil</td>
              <td>C₃₀–C₄₀</td>
              <td>300–350</td>
              <td>ইঞ্জিন অয়েল, গ্রীজ</td>
            </tr>
            <tr>
              <td>Bitumen</td>
              <td>C₄₀+</td>
              <td>&gt; 350</td>
              <td>রাস্তার পিচ</td>
            </tr>
          </tbody>
        </table>

        <h4>পরীক্ষায় মনে রাখো</h4>
        <ul>
          <li>Crude oil একটি hydrocarbon mixture — এতে alkane, cycloalkane ও aromatic থাকে।</li>
          <li>
            Fractionating column-এ থাকে <em>bubble caps</em> — যা vapour ও liquid-এর সংস্পর্শ
            বাড়ায়।
          </li>
          <li>উঁচু স্তরে হালকা (light) fraction, নিচু স্তরে ভারী (heavy) fraction পাওয়া যায়।</li>
          <li>Bitumen ও lubricating oil সরাসরি স্তম্ভের নিচে residue হিসেবে জমা হয়।</li>
        </ul>
      </DraggableTheoryFab>
    </div>
  );
}

/* ═════════════ Panel 1: Fractionating Column ═════════════ */
function FractionatingColumn({
  temp,
  running,
  active,
}: {
  temp: number;
  running: boolean;
  active: Fraction;
}) {
  // Draw fractions top→bottom: top = coldest (gas) → bottom = bitumen
  const bands = FRACTIONS; // already ordered coldest→hottest
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fractionating Column · পাতন-স্তম্ভ
        </div>
        <Badge variant="outline" className="text-[10px]">
          Live · সরাসরি
        </Badge>
      </div>

      <div className="relative mx-auto flex h-[520px] w-full max-w-md flex-col">
        {/* Column body */}
        <div className="relative flex-1 overflow-hidden rounded-t-2xl border-2 border-neutral-400/70 bg-gradient-to-b from-sky-50 via-amber-50 to-rose-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 shadow-inner">
          {bands.map((f, i) => {
            const isActive = f.id === active.id;
            return (
              <div
                key={f.id}
                className={cn(
                  "relative flex items-center justify-between border-b border-white/30 px-3 text-[10px] font-semibold text-slate-800 dark:text-slate-100 transition-all",
                  "bg-gradient-to-r",
                  f.color,
                  isActive && `ring-2 ${f.ring} z-10 shadow-lg`,
                )}
                style={{ height: `${100 / bands.length}%` }}
              >
                {/* Bubble caps */}
                <div className="flex items-center gap-1">
                  <BubbleCap />
                  <BubbleCap />
                  <BubbleCap />
                </div>

                <div className="flex flex-col items-end leading-tight">
                  <span className="whitespace-nowrap">{f.nameBn}</span>
                  <span className="text-[9px] font-normal opacity-80">
                    {f.bpMin < 0 ? "<20" : f.bpMin}°C · C{f.cMin}–C{f.cMax}
                  </span>
                </div>

                {/* Outlet pipe + glow when active */}
                <div className="absolute right-0 top-1/2 flex -translate-y-1/2 translate-x-full items-center">
                  <div className={cn("h-1.5 w-8", f.outletColor)} />
                  <div
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-white shadow",
                      f.outletColor,
                      isActive && "animate-pulse ring-4 ring-white/40",
                    )}
                  >
                    <f.icon className="h-3 w-3" />
                  </div>
                </div>

                {/* Outflow droplets when active */}
                {isActive && running && (
                  <motion.div
                    className="absolute right-[-64px] top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                    animate={{ x: [0, 8, 0], opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </motion.div>
                )}

                {/* Rising vapor when running */}
                {running && (
                  <motion.div
                    className="pointer-events-none absolute left-1/2 top-full h-6 w-8 -translate-x-1/2 rounded-full bg-white/25 blur-md"
                    animate={{ y: [0, -220], opacity: [0.7, 0] }}
                    transition={{ repeat: Infinity, duration: 3, delay: i * 0.25 }}
                  />
                )}
              </div>
            );
          })}

          {/* Vertical temperature ruler */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-8 flex-col justify-between border-r border-neutral-500/40 bg-white/40 py-1 text-[8px] font-mono text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
            <span className="pl-1">&lt;20°</span>
            <span className="pl-1">120°</span>
            <span className="pl-1">250°</span>
            <span className="pl-1">&gt;350°</span>
          </div>
        </div>

        {/* Furnace + Crude Oil inlet */}
        <div className="relative -mt-1 h-24 rounded-b-2xl border-2 border-t-0 border-neutral-500/70 bg-gradient-to-b from-orange-500 via-red-600 to-neutral-900 shadow-xl">
          <div className="absolute inset-x-0 top-1 text-center text-[10px] font-bold text-white">
            Crude Oil In · অপরিশোধিত তেল
          </div>
          <div className="absolute left-1/2 top-6 -translate-x-1/2 text-[10px] font-bold text-white">
            Furnace · চুল্লি
          </div>
          {/* Animated flames */}
          <div className="absolute inset-x-0 bottom-1 flex justify-around">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="text-yellow-300"
                animate={{ scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ repeat: Infinity, duration: 0.9 + i * 0.1 }}
              >
                <Flame className="h-5 w-5 drop-shadow" />
              </motion.div>
            ))}
          </div>
          {/* Furnace glow when running */}
          {running && (
            <motion.div
              className="absolute inset-0 rounded-b-2xl bg-orange-400/40 mix-blend-screen"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
            />
          )}
        </div>

        <div className="mt-3 rounded-lg border bg-muted/40 p-2 text-[11px] leading-snug">
          <strong>স্তম্ভের নিয়ম:</strong> নিচে সর্বোচ্চ তাপ ({">"}340°C) — উপরে সর্বনিম্ন তাপ (
          {"<"}20°C)। প্রতিটি হাইড্রোকার্বন নিজের স্ফুটনাঙ্কের স্তরে ঘনীভূত হয়ে পার্শ্ব-নালী দিয়ে
          বেরিয়ে আসে।
        </div>
      </div>
    </Card>
  );
}

function BubbleCap() {
  return <div className="h-2 w-2 rounded-full border border-white/60 bg-white/30 shadow-inner" />;
}

/* ═════════════ Panel 2: Molecular View ═════════════ */
function MolecularPanel({ active }: { active: Fraction }) {
  const chainLen = Math.min(12, Math.max(2, Math.round((active.cMin + active.cMax) / 2 / 2)));
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Molecular View · আণবিক দৃশ্য
        </div>
        <Badge variant="outline" className="text-[10px]">
          C{active.cMin}–C{active.cMax}
        </Badge>
      </div>

      <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex min-h-[80px] flex-wrap items-center justify-center gap-1"
          >
            {Array.from({ length: chainLen }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white shadow",
                  "bg-gradient-to-br",
                  active.color,
                )}
                animate={{ y: [0, -2, 0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 1.6 + i * 0.05, delay: i * 0.05 }}
              >
                C
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 grid gap-1 text-[11px] leading-snug">
        <div>
          <strong>{active.nameBn}</strong>{" "}
          <span className="text-muted-foreground">({active.nameEn})</span>
        </div>
        <div className="text-muted-foreground">
          স্ফুটনাঙ্ক: {active.bpMin < 0 ? "<20" : active.bpMin}–
          {active.bpMax === 999 ? "∞" : active.bpMax}°C
        </div>
        <div className="mt-1 rounded-md bg-muted/50 px-2 py-1.5 text-[11px]">
          💡 ছোট শিকল = কম আন্তঃআণবিক বল = <strong>কম স্ফুটনাঙ্ক</strong>। বড় শিকল = বেশি বল ={" "}
          <strong>বেশি স্ফুটনাঙ্ক</strong>।
        </div>
      </div>
    </Card>
  );
}

/* ═════════════ Boiling Point Graph ═════════════ */
function BoilingPointGraph({ active, temp }: { active: Fraction; temp: number }) {
  const W = 320,
    H = 140,
    PAD = 28;
  const maxC = 60,
    maxBp = 400;
  const points = FRACTIONS.map((f) => {
    const c = (f.cMin + f.cMax) / 2;
    const bp = (Math.max(0, f.bpMin) + Math.min(400, f.bpMax === 999 ? 380 : f.bpMax)) / 2;
    const x = PAD + (c / maxC) * (W - PAD * 2);
    const y = H - PAD - (bp / maxBp) * (H - PAD * 2);
    return { x, y, id: f.id };
  });
  const path = points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const activePt = points.find((p) => p.id === active.id)!;

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          BP vs Carbon # · স্ফুটনাঙ্ক বনাম কার্বন সংখ্যা
        </div>
        <Badge variant="outline" className="text-[10px]">
          {Math.round(temp)}°C
        </Badge>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* axes */}
        <line
          x1={PAD}
          y1={H - PAD}
          x2={W - PAD / 2}
          y2={H - PAD}
          className="stroke-muted-foreground/60"
          strokeWidth={1}
        />
        <line
          x1={PAD}
          y1={PAD / 2}
          x2={PAD}
          y2={H - PAD}
          className="stroke-muted-foreground/60"
          strokeWidth={1}
        />
        <text
          x={W / 2}
          y={H - 4}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="9"
        >
          Carbon Number (C)
        </text>
        <text
          x={8}
          y={H / 2}
          textAnchor="middle"
          fontSize="9"
          transform={`rotate(-90 8 ${H / 2})`}
          className="fill-muted-foreground"
        >
          Boiling Point (°C)
        </text>
        {/* line */}
        <path d={path} fill="none" strokeWidth={2} className="stroke-orange-500" />
        {points.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.id === active.id ? 5 : 2.5}
            className={p.id === active.id ? "fill-rose-500" : "fill-orange-400"}
          />
        ))}
        {/* active label */}
        <text
          x={activePt.x}
          y={activePt.y - 8}
          textAnchor="middle"
          fontSize="9"
          className="fill-rose-600 font-bold"
        >
          {active.nameEn}
        </text>
      </svg>
    </Card>
  );
}

/* ═════════════ Panel 3: Control Panel ═════════════ */
function ControlPanel({
  temp,
  setTemp,
  running,
  onRun,
  onReset,
  active,
}: {
  temp: number;
  setTemp: (n: number) => void;
  running: boolean;
  onRun: () => void;
  onReset: () => void;
  active: Fraction;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Control Panel · নিয়ন্ত্রণ প্যানেল
      </div>

      <div className="mb-1 flex items-center justify-between text-xs">
        <span>তাপমাত্রা (Temperature)</span>
        <span className="font-mono font-bold text-orange-600">{Math.round(temp)}°C</span>
      </div>
      <Slider
        value={[temp]}
        min={0}
        max={400}
        step={5}
        onValueChange={(v) => setTemp(v[0])}
        className="my-2"
      />
      <div className="mb-3 flex justify-between text-[9px] text-muted-foreground">
        <span>0°</span>
        <span>70°</span>
        <span>170°</span>
        <span>250°</span>
        <span>350°</span>
        <span>400°</span>
      </div>

      <div
        className={cn(
          "mb-3 rounded-xl border-2 p-3 transition-all",
          `bg-gradient-to-r ${active.color}`,
          active.ring,
          "ring-2",
        )}
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <active.icon className="h-4 w-4" />
          {active.nameBn} <span className="text-xs font-normal opacity-80">({active.nameEn})</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-800 dark:text-slate-100">
          C{active.cMin}–C{active.cMax} · BP {active.bpMin < 0 ? "<20" : active.bpMin}–
          {active.bpMax === 999 ? "∞" : active.bpMax}°C
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {active.usesBn.map((u) => (
            <span
              key={u}
              className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-slate-800 dark:bg-black/40 dark:text-white"
            >
              {u}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onRun} disabled={running} size="sm" className="gap-1">
          <Play className="h-4 w-4" /> চালু করুন
        </Button>
        <Button onClick={onReset} variant="outline" size="sm" className="gap-1">
          <RotateCcw className="h-4 w-4" /> রিসেট
        </Button>
      </div>
    </Card>
  );
}

/* ═════════════ Panel 4: Steps & Status ═════════════ */
function StepsStatusPanel({
  stepIdx,
  active,
  running,
}: {
  stepIdx: number;
  active: Fraction;
  running: boolean;
}) {
  const steps = [
    "অপরিশোধিত তেল প্রবেশ করান (Feed Crude Oil)",
    "তাপমাত্রা বৃদ্ধি করুন (Increase Temperature)",
    "বিভিন্ন স্তরে উপাদান সংগ্রহ করুন (Collect Fractions)",
    "আণবিক চিত্র ও গ্রাফ পর্যবেক্ষণ করুন (Observe Molecules & Graph)",
  ];
  const statusText = !running
    ? "প্রস্তুত (Idle) — Run চাপুন"
    : stepIdx < 2
      ? "হিট দেওয়া হচ্ছে (Heating)…"
      : `${active.nameBn} বের হচ্ছে (${active.nameEn} outflowing)…`;

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Steps & Status · ধাপ ও অবস্থা
        </div>
        <Badge variant={running ? "default" : "secondary"} className="text-[10px]">
          {running ? "Running" : "Idle"}
        </Badge>
      </div>
      <div className="mb-2 rounded-md bg-orange-50 dark:bg-orange-950/30 px-2 py-1.5 text-[11px] font-medium text-orange-800 dark:text-orange-200">
        {statusText}
      </div>
      <ol className="space-y-1.5 text-[12px]">
        {steps.map((s, i) => {
          const done = i < stepIdx;
          const current = i === stepIdx && running;
          return (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-md border px-2 py-1.5",
                done && "border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-950/20",
                current &&
                  "border-orange-400/60 bg-orange-50/50 dark:bg-orange-950/20 ring-1 ring-orange-400/40",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white",
                  done ? "bg-emerald-500" : current ? "bg-orange-500" : "bg-muted-foreground/40",
                )}
              >
                {i + 1}
              </span>
              <span className={cn(done && "text-muted-foreground line-through")}>{s}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
