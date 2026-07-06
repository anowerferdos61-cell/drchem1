import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  BatteryCharging,
  Activity,
  Play,
  Pause,
  RotateCcw,
  FlaskConical,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DraggableTheoryFab from "./DraggableTheoryFab";

interface Props {
  onBack: () => void;
}

export default function ElectrolyticRefiningLab({ onBack }: Props) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0); // 0 → 100
  const [tab, setTab] = useState<"cu" | "na" | "al">("cu");

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return Math.min(100, p + 0.6);
      });
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  const reset = () => {
    setRunning(false);
    setProgress(0);
  };

  // Anode shrinks from full → 40% width, Cathode grows from 30% → 100%
  const anodeWidth = 22 - (progress / 100) * 13; // px
  const cathodeWidth = 8 + (progress / 100) * 16; // px
  const mudHeight = (progress / 100) * 18;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_theme(colors.sky.950),_theme(colors.slate.950))] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-900/40">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold tracking-tight sm:text-lg">
              তড়িৎ বিশোধন · Electrolytic Refining
            </h1>
            <p className="truncate text-xs text-slate-400">
              Chapter 10 · Copper Purification (Cu 99.9% pure)
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              running
                ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
                : "border-slate-500/40 bg-slate-500/10 text-slate-300"
            }
          >
            <Activity className="mr-1 h-3 w-3" />
            {running ? "Running" : "Idle"}
          </Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ── LEFT: cell visual ── */}
        <section className="flex flex-col gap-3">
          <Card className="relative overflow-hidden border-white/10 bg-slate-900/60 p-4 backdrop-blur">
            <CellSVG
              running={running}
              progress={progress}
              anodeWidth={anodeWidth}
              cathodeWidth={cathodeWidth}
              mudHeight={mudHeight}
            />

            {/* Controls */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setRunning((r) => !r)}
                className={
                  running
                    ? "gap-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500"
                    : "gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
                }
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "থামাও" : "তড়িৎ বিশ্লেষণ শুরু করো"}
              </Button>
              <Button
                variant="outline"
                onClick={reset}
                className="gap-1 border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <div className="ml-auto flex min-w-[160px] items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">Deposition</span>
                <Progress value={progress} className="h-2 w-32" />
                <span className="w-8 text-right text-[11px] font-mono text-emerald-300">
                  {progress.toFixed(0)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Legend */}
          <Card className="border-white/10 bg-slate-900/60 p-3 backdrop-blur">
            <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              <LegendDot color="bg-amber-400" label="e⁻ ইলেকট্রন" />
              <LegendDot color="bg-sky-400" label="Cu²⁺ আয়ন" />
              <LegendDot color="bg-orange-700" label="অ্যানোড (অশুদ্ধ)" />
              <LegendDot color="bg-orange-400" label="ক্যাথোড (বিশুদ্ধ)" />
            </div>
          </Card>
        </section>

        {/* ── RIGHT: reactions + theory tabs ── */}
        <section className="flex flex-col gap-3">
          <Card className="relative overflow-hidden border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400" />
            <div className="mb-3 flex items-center gap-2">
              <Activity className={running ? "h-4 w-4 text-emerald-400" : "h-4 w-4 text-slate-500"} />
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
                Live Half-Reactions
              </h2>
            </div>

            <ReactionRow
              side="Anode (অ্যানোড) · +"
              tone="rose"
              equation="Cu(s) → Cu²⁺(aq) + 2e⁻"
              subBn="অক্সিডেশন — অ্যানোড ক্ষয় হচ্ছে"
              active={running}
            />
            <div className="my-3 h-px bg-white/10" />
            <ReactionRow
              side="Cathode (ক্যাথোড) · −"
              tone="emerald"
              equation="Cu²⁺(aq) + 2e⁻ → Cu(s)"
              subBn="বিজারণ — ক্যাথোড মোটা হচ্ছে"
              active={running}
            />

            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
              <Stat label="অ্যানোড ক্ষয়" value={`${progress.toFixed(0)}%`} tone="rose" />
              <Stat label="Cu জমা" value={`${progress.toFixed(0)}%`} tone="emerald" />
              <Stat label="অ্যানোড কাদা" value={`${(progress * 0.02).toFixed(2)} g`} tone="amber" />
            </div>
          </Card>

          {/* Theory tabs */}
          <Card className="border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <Info className="h-3.5 w-3.5" /> Related Extractions · সংশ্লিষ্ট নিষ্কাশন
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="grid w-full grid-cols-3 bg-white/5">
                <TabsTrigger value="cu">Cu · কপার</TabsTrigger>
                <TabsTrigger value="na">Na · Down's</TabsTrigger>
                <TabsTrigger value="al">Al · Hall-Héroult</TabsTrigger>
              </TabsList>

              <TabsContent value="cu" className="mt-3 space-y-2 text-sm text-slate-200">
                <p><strong className="text-orange-300">কপার বিশোধন:</strong> অশুদ্ধ Cu অ্যানোড, বিশুদ্ধ Cu ক্যাথোড, তড়িৎ-বিশ্লেষ্য হিসাবে অম্লীয় CuSO₄ দ্রবণ ব্যবহৃত হয়। ফলে <strong>৯৯.৯%</strong> বিশুদ্ধ Cu ক্যাথোডে জমা হয়।</p>
                <p className="rounded-md border border-amber-400/30 bg-amber-400/10 p-2 text-amber-100">
                  <strong>Anode Mud:</strong> Ag, Au, Pt অ্যানোডের নিচে জমা হয় → মূল্যবান উপজাত।
                </p>
              </TabsContent>

              <TabsContent value="na" className="mt-3 space-y-2 text-sm text-slate-200">
                <p><strong className="text-sky-300">Down's Process:</strong> সোডিয়াম অত্যন্ত সক্রিয় ধাতু, তাই জলীয় দ্রবণে নয় — <strong>গলিত NaCl</strong>-এর তড়িৎ বিশ্লেষণে Na পাওয়া যায়।</p>
                <div className="rounded-md border border-white/10 bg-white/5 p-2 font-mono text-xs text-sky-200">
                  Cathode: Na⁺ + e⁻ → Na<br />Anode: 2Cl⁻ → Cl₂ + 2e⁻
                </div>
                <p className="text-xs text-slate-400">CaCl₂ যোগ করা হয় গলনাঙ্ক কমাতে (~600°C)।</p>
              </TabsContent>

              <TabsContent value="al" className="mt-3 space-y-2 text-sm text-slate-200">
                <p><strong className="text-fuchsia-300">Hall-Héroult Process:</strong> <strong>বক্সাইট (Al₂O₃)</strong>-কে গলিত <strong>ক্রায়োলাইট (Na₃AlF₆)</strong>-এ দ্রবীভূত করে তড়িৎ বিশ্লেষণ করা হয়।</p>
                <div className="rounded-md border border-white/10 bg-white/5 p-2 font-mono text-xs text-fuchsia-200">
                  Cathode: Al³⁺ + 3e⁻ → Al<br />Anode: 2O²⁻ → O₂ + 4e⁻
                </div>
                <p className="text-xs text-slate-400">তাপমাত্রা ~950°C; কার্বন অ্যানোড ধীরে ধীরে ক্ষয় হয়।</p>
              </TabsContent>
            </Tabs>
          </Card>
        </section>
      </main>
    </div>
  );
}

/* ─────────────── UI helpers ─────────────── */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "rose" | "emerald" | "amber";
}) {
  const map = {
    rose: "from-rose-500/20 to-rose-500/5 border-rose-400/30 text-rose-200",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-400/30 text-emerald-200",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-400/30 text-amber-200",
  }[tone];
  return (
    <div className={`rounded-lg border bg-gradient-to-br p-2 ${map}`}>
      <div className="text-[10px] uppercase opacity-80">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  );
}

function ReactionRow({
  side,
  tone,
  equation,
  subBn,
  active,
}: {
  side: string;
  tone: "rose" | "emerald";
  equation: string;
  subBn: string;
  active: boolean;
}) {
  const border = tone === "rose" ? "border-rose-400/30" : "border-emerald-400/30";
  const bg = tone === "rose" ? "bg-rose-400/5" : "bg-emerald-400/5";
  const text = tone === "rose" ? "text-rose-100" : "text-emerald-100";
  const dot = tone === "rose" ? "bg-rose-400" : "bg-emerald-400";
  return (
    <div className={`rounded-lg border ${border} ${bg} p-3`}>
      <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
        <span className={`inline-block h-2 w-2 rounded-full ${dot} ${active ? "animate-pulse" : ""}`} />
        {side}
      </div>
      <div className={`font-mono text-sm ${text}`}>{equation}</div>
      <div className="mt-1 text-xs text-slate-400">{subBn}</div>
    </div>
  );
}

/* ─────────────── The animated electrolytic cell ─────────────── */

function CellSVG({
  running,
  progress,
  anodeWidth,
  cathodeWidth,
  mudHeight,
}: {
  running: boolean;
  progress: number;
  anodeWidth: number;
  cathodeWidth: number;
  mudHeight: number;
}) {
  // viewBox: 500 x 380
  const beakerX = 60,
    beakerY = 90,
    beakerW = 380,
    beakerH = 240;
  const solutionY = beakerY + 40;
  const solutionH = beakerH - 45;

  const anodeX = beakerX + 90; // center
  const cathodeX = beakerX + beakerW - 90;

  const anodeTop = solutionY - 30;
  const anodeBottom = beakerY + beakerH - 30;

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <svg viewBox="0 0 500 380" className="h-auto w-full">
        <defs>
          <linearGradient id="cuso4" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="glass" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="anodeGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="cathodeGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="50%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <filter id="cellGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Battery */}
        <g transform="translate(190,10)">
          <rect x="0" y="0" width="120" height="46" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <rect x="-6" y="14" width="6" height="18" fill="#475569" />
          <rect x="120" y="14" width="6" height="18" fill="#475569" />
          <text x="15" y="30" fontSize="18" fontWeight="800" fill="#f87171">−</text>
          <text x="98" y="30" fontSize="18" fontWeight="800" fill="#4ade80">+</text>
          <foreignObject x="45" y="12" width="34" height="24">
            <div className="flex h-full w-full items-center justify-center">
              <BatteryCharging
                className={
                  running
                    ? "h-5 w-5 text-amber-400 [filter:drop-shadow(0_0_6px_currentColor)]"
                    : "h-5 w-5 text-slate-500"
                }
              />
            </div>
          </foreignObject>
        </g>

        {/* Wires: battery(+) → anode, cathode → battery(−) */}
        {/* + wire (right side of battery to anode top) — but anode is on LEFT
             We follow the problem: Left Anode(+), Right Cathode(-).
             So: battery + terminal (right) sweeps left over the top to anode.
             battery − terminal (left) sweeps to cathode on the right.
             We'll route both wires up and over the beaker rim. */}
        <path
          d={`M 316 30 L 430 30 L 430 ${anodeTop - 20} L ${cathodeX} ${anodeTop - 20} L ${cathodeX} ${anodeTop}`}
          stroke="#4ade80"
          strokeWidth="3"
          fill="none"
        />
        <path
          d={`M 184 30 L 70 30 L 70 ${anodeTop - 20} L ${anodeX} ${anodeTop - 20} L ${anodeX} ${anodeTop}`}
          stroke="#f87171"
          strokeWidth="3"
          fill="none"
        />

        {/* Beaker outline */}
        <path
          d={`M ${beakerX - 10} ${beakerY} L ${beakerX} ${beakerY + 15} L ${beakerX} ${beakerY + beakerH} Q ${beakerX} ${beakerY + beakerH + 12} ${beakerX + 12} ${beakerY + beakerH + 12} L ${beakerX + beakerW - 12} ${beakerY + beakerH + 12} Q ${beakerX + beakerW} ${beakerY + beakerH + 12} ${beakerX + beakerW} ${beakerY + beakerH} L ${beakerX + beakerW} ${beakerY + 15} L ${beakerX + beakerW + 10} ${beakerY}`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2.5"
        />

        {/* Solution (CuSO4) */}
        <rect
          x={beakerX + 2}
          y={solutionY}
          width={beakerW - 4}
          height={solutionH - 12}
          fill="url(#cuso4)"
          rx="2"
        />
        {/* Glass sheen */}
        <rect
          x={beakerX + 2}
          y={beakerY + 15}
          width={beakerW - 4}
          height={beakerH - 15}
          fill="url(#glass)"
          rx="2"
        />

        {/* Cu²⁺ ions swimming from anode → cathode */}
        {running &&
          [...Array(8)].map((_, i) => {
            const y = solutionY + 30 + (i * (solutionH - 60)) / 8;
            return (
              <motion.g key={`ion-${i}`}>
                <motion.circle
                  r="5"
                  fill="#38bdf8"
                  stroke="#e0f2fe"
                  strokeWidth="1"
                  animate={{
                    cx: [anodeX + 12, cathodeX - 12],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut",
                  }}
                  cy={y}
                />
                <motion.text
                  fontSize="7"
                  fontWeight="700"
                  fill="#0c4a6e"
                  textAnchor="middle"
                  animate={{
                    x: [anodeX + 12, cathodeX - 12],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut",
                  }}
                  y={y + 2.5}
                >
                  2+
                </motion.text>
              </motion.g>
            );
          })}

        {/* Anode (impure Cu) — shrinks */}
        <g filter={running ? "url(#cellGlow)" : undefined}>
          <rect
            x={anodeX - anodeWidth / 2}
            y={anodeTop}
            width={anodeWidth}
            height={anodeBottom - anodeTop}
            fill="url(#anodeGrad)"
            rx="2"
          />
          {/* pitted texture dots */}
          {[...Array(6)].map((_, i) => (
            <circle
              key={`pit-${i}`}
              cx={anodeX + (i % 2 === 0 ? -2 : 2)}
              cy={anodeTop + 20 + i * 22}
              r={1.4}
              fill="#1c1917"
              opacity={0.7}
            />
          ))}
        </g>

        {/* Cathode (pure Cu) — grows */}
        <g filter={running ? "url(#cellGlow)" : undefined}>
          <rect
            x={cathodeX - cathodeWidth / 2}
            y={anodeTop}
            width={cathodeWidth}
            height={anodeBottom - anodeTop}
            fill="url(#cathodeGrad)"
            rx="2"
          />
          {/* shiny highlight */}
          <rect
            x={cathodeX - cathodeWidth / 2 + 1}
            y={anodeTop + 2}
            width={Math.max(1, cathodeWidth * 0.25)}
            height={anodeBottom - anodeTop - 4}
            fill="#fed7aa"
            opacity={0.7}
            rx="1"
          />
        </g>

        {/* Anode mud (grows) */}
        <rect
          x={anodeX - 22}
          y={anodeBottom - mudHeight}
          width={44}
          height={mudHeight}
          fill="#292524"
          rx="2"
          opacity={0.85}
        />
        {mudHeight > 4 &&
          [...Array(4)].map((_, i) => (
            <circle
              key={`mud-${i}`}
              cx={anodeX - 16 + i * 10}
              cy={anodeBottom - mudHeight + 3}
              r={2}
              fill={i % 2 ? "#fbbf24" : "#e5e7eb"}
              opacity={0.9}
            />
          ))}

        {/* Electron flow along the wires */}
        {running &&
          [...Array(5)].map((_, i) => (
            <motion.circle
              key={`eR-${i}`}
              r="3"
              fill="#fbbf24"
              animate={{
                offsetDistance: ["0%", "100%"],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35 }}
              style={{
                offsetPath: `path('M ${cathodeX} ${anodeTop} L ${cathodeX} ${anodeTop - 20} L 430 ${anodeTop - 20} L 430 30 L 316 30')`,
              }}
            />
          ))}
        {running &&
          [...Array(5)].map((_, i) => (
            <motion.circle
              key={`eL-${i}`}
              r="3"
              fill="#fbbf24"
              animate={{
                offsetDistance: ["0%", "100%"],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35 }}
              style={{
                offsetPath: `path('M ${anodeX} ${anodeTop} L ${anodeX} ${anodeTop - 20} L 70 ${anodeTop - 20} L 70 30 L 184 30')`,
              }}
            />
          ))}

        {/* Labels */}
        <g fontSize="11" fontWeight="700" fill="#f8fafc">
          <text x={anodeX} y={anodeTop - 30} textAnchor="middle" fill="#fda4af">
            Anode (+)
          </text>
          <text x={anodeX} y={anodeBottom + 26} textAnchor="middle" fill="#fecaca" fontSize="10">
            অশুদ্ধ Cu
          </text>
          <text x={cathodeX} y={anodeTop - 30} textAnchor="middle" fill="#86efac">
            Cathode (−)
          </text>
          <text x={cathodeX} y={anodeBottom + 26} textAnchor="middle" fill="#bbf7d0" fontSize="10">
            বিশুদ্ধ Cu
          </text>
          <text x={250} y={solutionY + 20} textAnchor="middle" fill="#e0f2fe" fontSize="11" opacity={0.9}>
            CuSO₄ (aq) · কপার সালফেট দ্রবণ
          </text>
        </g>
      </svg>

      {/* Status chip on visual */}
      <AnimatePresence>
        {running && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 backdrop-blur"
          >
            <FlaskConical className="h-3 w-3" /> Electrolysis in progress
          </motion.div>
        )}
      </AnimatePresence>

      {progress >= 100 && (
        <div className="absolute right-3 top-3 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-200 backdrop-blur">
          ✓ ক্যাথোডে বিশুদ্ধ Cu প্রস্তুত
        </div>
      )}
    </div>
  );
}
