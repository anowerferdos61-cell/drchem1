import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowDown, Flame, RefreshCw, Dna, ChevronLeft, ChevronRight, Thermometer, Wind, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DraggableTheoryFab from "./DraggableTheoryFab";

interface Props {
  onBack: () => void;
}

type ZoneId = "reduction" | "slag" | "fusion" | "combustion";

interface Zone {
  id: ZoneId;
  index: number;
  titleBn: string;
  titleEn: string;
  temp: string;
  yTop: number; // percent from top of furnace body
  yBottom: number;
  gradient: string;
  ring: string;
  glow: string;
  icon: typeof Flame;
  summaryBn: string;
  reasonBn: string;
  equations: { lhs: string; rhs: string; note?: string }[];
  keyBn: string[];
}

const ZONES: Zone[] = [
  {
    id: "reduction",
    index: 1,
    titleBn: "বিজারণ অঞ্চল",
    titleEn: "Reduction Zone",
    temp: "400°C – 700°C",
    yTop: 8,
    yBottom: 30,
    gradient: "from-amber-300/70 via-amber-400/50 to-orange-500/40",
    ring: "ring-amber-400/80",
    glow: "shadow-[0_0_60px_-10px] shadow-amber-400/60",
    icon: RefreshCw,
    summaryBn: "উপরের তুলনামূলক ঠান্ডা অংশে CO গ্যাস উপরের দিকে উঠে হেমাটাইট আকরিককে ধাপে ধাপে বিজারিত করে।",
    reasonBn: "কেন এখানে সরাসরি Fe তৈরি হয় না? কারণ তাপমাত্রা কম, তাই বিজারণ ধাপে ধাপে ঘটে — প্রথমে Fe₂O₃ → Fe₃O₄, তারপর Fe₃O₄ → FeO।",
    equations: [
      { lhs: "3Fe₂O₃ + CO", rhs: "2Fe₃O₄ + CO₂" },
      { lhs: "Fe₃O₄ + CO", rhs: "3FeO + CO₂" },
    ],
    keyBn: [
      "বিজারক: কার্বন মনোক্সাইড (CO)",
      "আকরিক হেমাটাইট (Fe₂O₃) ধাপে ধাপে FeO-তে পরিণত হয়",
      "সম্পূর্ণ কঠিন অবস্থায় বিক্রিয়া চলে",
    ],
  },
  {
    id: "slag",
    index: 2,
    titleBn: "ধাতুমল গঠন অঞ্চল",
    titleEn: "Slag Formation Zone",
    temp: "800°C – 1000°C",
    yTop: 30,
    yBottom: 55,
    gradient: "from-orange-500/60 via-orange-600/60 to-red-600/50",
    ring: "ring-orange-500/80",
    glow: "shadow-[0_0_70px_-10px] shadow-orange-500/60",
    icon: Dna,
    summaryBn: "চুনাপাথর (CaCO₃) ভস্মীভূত হয়ে CaO দেয়, যা আকরিকের সিলিকা অপদ্রব্যের সাথে বিক্রিয়া করে গলিত ধাতুমল (slag) তৈরি করে।",
    reasonBn: "কেন এখানে চুনাপাথর ভেঙে ক্যালসিয়াম অক্সাইড তৈরি হচ্ছে? — কারণ CaO একটি ক্ষারীয় ফ্লাক্স, যা আম্লিক অপদ্রব্য SiO₂-কে দূর করতে সাহায্য করে।",
    equations: [
      { lhs: "CaCO₃", rhs: "CaO + CO₂", note: "ভস্মীকরণ" },
      { lhs: "CaO + SiO₂", rhs: "CaSiO₃", note: "ধাতুমল (slag)" },
    ],
    keyBn: [
      "চুনাপাথর = ফ্লাক্স (Flux)",
      "SiO₂ = আকরিকের প্রধান অপদ্রব্য",
      "CaSiO₃ হালকা, তাই গলিত লোহার উপরে ভেসে থাকে",
    ],
  },
  {
    id: "fusion",
    index: 3,
    titleBn: "ধাতু গলন অঞ্চল",
    titleEn: "Fusion / Absorption Zone",
    temp: "1100°C – 1200°C",
    yTop: 55,
    yBottom: 78,
    gradient: "from-red-600/70 via-rose-600/70 to-rose-700/60",
    ring: "ring-rose-500/80",
    glow: "shadow-[0_0_80px_-10px] shadow-rose-500/70",
    icon: ArrowDown,
    summaryBn: "FeO শেষবারের মতো CO দ্বারা বিজারিত হয়ে মুক্ত Fe দেয়। এই তাপমাত্রায় লোহা গলে ফোঁটা ফোঁটা হয়ে নিচের দিকে নামতে থাকে।",
    reasonBn: "লোহা গলে কেন নিচে পড়ে? — কারণ Fe-এর গলনাঙ্ক (~1538°C) এই অঞ্চলে ছুঁইছুঁই, এবং কার্বন শোষণ করে গলনাঙ্ক কমে যায় (~1200°C), ফলে গলিত অবস্থায় থাকে।",
    equations: [
      { lhs: "FeO + CO", rhs: "Fe + CO₂", note: "চূড়ান্ত বিজারণ" },
    ],
    keyBn: [
      "গলিত Fe কার্বন শোষণ করে → পিগ আয়রন",
      "ফোঁটা ফোঁটা লোহা নিচে জমা হয়",
      "উপরে গলিত slag পৃথক স্তরে ভেসে থাকে",
    ],
  },
  {
    id: "combustion",
    index: 4,
    titleBn: "দহন অঞ্চল",
    titleEn: "Combustion Zone",
    temp: "1300°C – 1500°C",
    yTop: 78,
    yBottom: 96,
    gradient: "from-rose-700/80 via-red-800/80 to-fuchsia-900/70",
    ring: "ring-fuchsia-500/80",
    glow: "shadow-[0_0_90px_-10px] shadow-fuchsia-500/70",
    icon: Flame,
    summaryBn: "টুয়ের (tuyeres) দিয়ে গরম বায়ু ঢুকে কোককে দহন করে CO₂ তৈরি করে, যা আরও কোকের সাথে বিক্রিয়া করে বিজারক CO গ্যাসে রূপান্তরিত হয়।",
    reasonBn: "এখানেই সমস্ত তাপ ও বিজারক CO তৈরি হয়। এই CO উপরের দিকে উঠে অন্য সব অঞ্চলে বিক্রিয়া চালায়।",
    equations: [
      { lhs: "C + O₂", rhs: "CO₂", note: "তাপ উৎপন্ন" },
      { lhs: "CO₂ + C", rhs: "2CO", note: "বিজারক গ্যাস" },
    ],
    keyBn: [
      "সর্বোচ্চ তাপমাত্রার অঞ্চল",
      "কোক = জ্বালানি + বিজারকের উৎস",
      "উৎপন্ন CO উপরের অঞ্চলে উঠে যায়",
    ],
  },
];

export default function BlastFurnaceLab({ onBack }: Props) {
  const [activeId, setActiveId] = useState<ZoneId>("combustion");
  const active = ZONES.find((z) => z.id === activeId)!;

  const go = (dir: 1 | -1) => {
    const i = ZONES.findIndex((z) => z.id === activeId);
    const next = ZONES[(i + dir + ZONES.length) % ZONES.length];
    setActiveId(next.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-slate-200 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-600 shadow-lg shadow-rose-900/40">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold tracking-tight sm:text-lg">
              বাতচুল্লী · Blast Furnace
            </h1>
            <p className="truncate text-xs text-slate-400">
              Chapter 10 · লোহা নিষ্কাশন (Fe extraction from Hematite)
            </p>
          </div>
          <Badge variant="outline" className="border-amber-400/40 bg-amber-400/10 text-amber-200">
            <Thermometer className="mr-1 h-3 w-3" /> {active.temp}
          </Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ── LEFT: Furnace visual ── */}
        <section className="flex flex-col gap-3">
          <Card className="relative overflow-hidden border-white/10 bg-slate-900/60 p-4 backdrop-blur">
            {/* Top charge banner */}
            <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <ArrowDown className="h-4 w-4 text-emerald-400" />
                কাঁচামাল চার্জ
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-rose-200">হেমাটাইট Fe₂O₃</span>
                <span className="rounded-full bg-zinc-500/30 px-2 py-0.5 text-zinc-200">কোক C</span>
                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-sky-200">চুনাপাথর CaCO₃</span>
              </div>
            </div>

            <FurnaceSVG activeId={activeId} onPick={setActiveId} />

            {/* Bottom outputs */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-orange-400/30 bg-gradient-to-r from-orange-500/20 to-orange-600/10 px-3 py-2">
                <div className="font-semibold text-orange-200">গলিত ধাতুমল (Slag)</div>
                <div className="text-orange-300/80">হালকা · উপরে ভাসমান · Tap out ↗</div>
              </div>
              <div className="rounded-lg border border-rose-400/30 bg-gradient-to-r from-rose-500/20 to-rose-600/10 px-3 py-2">
                <div className="font-semibold text-rose-200">গলিত লোহা (Molten Fe)</div>
                <div className="text-rose-300/80">ভারী · নিচে জমা · Tap out ↘</div>
              </div>
            </div>
          </Card>

          {/* Zone selector chips */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ZONES.map((z) => {
              const Icon = z.icon;
              const isActive = z.id === activeId;
              return (
                <button
                  key={z.id}
                  onClick={() => setActiveId(z.id)}
                  className={[
                    "group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all",
                    isActive
                      ? `border-transparent bg-gradient-to-br ${z.gradient} ring-2 ${z.ring} ${z.glow}`
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
                    <Icon className="h-3 w-3" /> Zone {z.index}
                  </div>
                  <div className="mt-1 text-[13px] font-bold leading-tight text-white">
                    {z.titleBn}
                  </div>
                  <div className="text-[10px] text-white/70">{z.temp}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── RIGHT: Teacher slide panel ── */}
        <section>
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Card className={`relative overflow-hidden border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl ${active.glow}`}>
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${active.gradient}`} />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Teacher's Slide · Zone {active.index}
                    </div>
                    <h2 className="mt-1 text-2xl font-extrabold leading-tight text-white">
                      {active.titleBn}
                    </h2>
                    <p className="text-sm text-slate-400">{active.titleEn}</p>
                  </div>
                  <Badge className="shrink-0 bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-lg shadow-rose-900/40">
                    <Thermometer className="mr-1 h-3 w-3" /> {active.temp}
                  </Badge>
                </div>

                <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-slate-200">
                  {active.summaryBn}
                </p>

                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    <Dna className="h-3.5 w-3.5" /> রাসায়নিক সমীকরণ
                  </div>
                  <div className="space-y-2">
                    {active.equations.map((eq, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 font-mono text-sm text-emerald-100"
                      >
                        <span>{eq.lhs}</span>
                        <span className="text-emerald-400">→</span>
                        <span>{eq.rhs}</span>
                        {eq.note && (
                          <span className="ml-auto rounded-full bg-emerald-400/15 px-2 py-0.5 font-sans text-[10px] text-emerald-200">
                            {eq.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    কেন এটি ঘটছে?
                  </div>
                  {active.reasonBn}
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    মূল পয়েন্ট
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-200">
                    {active.keyBn.map((k, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-rose-500" />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <Button variant="outline" size="sm" onClick={() => go(-1)} className="gap-1 border-white/20 bg-white/5 text-slate-100 hover:bg-white/10">
                    <ChevronLeft className="h-4 w-4" /> পূর্ববর্তী
                  </Button>
                  <div className="text-xs text-slate-400">
                    {active.index} / {ZONES.length}
                  </div>
                  <Button size="sm" onClick={() => go(1)} className="gap-1 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-500 hover:to-rose-500">
                    পরবর্তী <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Furnace SVG — cross-section with clickable thermal zones
 * ───────────────────────────────────────────────────────── */
function FurnaceSVG({ activeId, onPick }: { activeId: ZoneId; onPick: (id: ZoneId) => void }) {
  // Furnace body: classic pear / double-cone silhouette
  // Coordinate space 400 x 520
  const bodyPath =
    "M 130 40 L 270 40 L 270 90 L 340 210 L 340 340 L 300 430 L 260 470 L 140 470 L 100 430 L 60 340 L 60 210 L 130 90 Z";

  return (
    <div className="relative mx-auto w-full max-w-md">
      <svg viewBox="0 0 400 520" className="h-auto w-full">
        <defs>
          {ZONES.map((z) => (
            <linearGradient key={z.id} id={`grad-${z.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={zoneStops(z.id)[0]} />
              <stop offset="100%" stopColor={zoneStops(z.id)[1]} />
            </linearGradient>
          ))}
          <linearGradient id="shell" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <clipPath id="furnace-clip">
            <path d={bodyPath} />
          </clipPath>
          <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shell */}
        <path d={bodyPath} fill="url(#shell)" stroke="#334155" strokeWidth="2" />

        {/* Thermal zones (clipped inside the shell) */}
        <g clipPath="url(#furnace-clip)">
          {ZONES.map((z) => {
            const y = 40 + (z.yTop / 100) * 430;
            const h = ((z.yBottom - z.yTop) / 100) * 430;
            const isActive = z.id === activeId;
            return (
              <g key={z.id} onClick={() => onPick(z.id)} className="cursor-pointer">
                <rect
                  x={0}
                  y={y}
                  width={400}
                  height={h}
                  fill={`url(#grad-${z.id})`}
                  opacity={isActive ? 1 : 0.75}
                />
                {isActive && (
                  <rect
                    x={0}
                    y={y}
                    width={400}
                    height={h}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    opacity={0.9}
                    filter="url(#soft-glow)"
                  />
                )}
                {/* Temp label inside zone */}
                <text
                  x={200}
                  y={y + h / 2 + 4}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="#ffffff"
                  opacity={0.9}
                  style={{ pointerEvents: "none" }}
                >
                  Zone {z.index} · {z.temp}
                </text>
              </g>
            );
          })}

          {/* Rising CO gas particles */}
          {[...Array(6)].map((_, i) => (
            <motion.circle
              key={i}
              cx={140 + (i * 30) % 120}
              cy={460}
              r={3}
              fill="#e0f2fe"
              opacity={0.6}
              animate={{ cy: [460, 60], opacity: [0.7, 0] }}
              transition={{ duration: 4 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
            />
          ))}

          {/* Descending charge dots */}
          {[...Array(4)].map((_, i) => (
            <motion.circle
              key={`d-${i}`}
              cx={170 + i * 20}
              cy={50}
              r={2.5}
              fill="#fbbf24"
              animate={{ cy: [50, 400] }}
              transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.7, ease: "easeIn" }}
            />
          ))}
        </g>

        {/* Charge chute at top */}
        <rect x={175} y={10} width={50} height={30} fill="#475569" rx="4" />
        <text x={200} y={30} textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="700">Charge</text>

        {/* Tuyeres (hot air blasts) — left & right */}
        <g>
          <rect x={0} y={420} width={65} height={14} fill="#64748b" rx="3" />
          <rect x={335} y={420} width={65} height={14} fill="#64748b" rx="3" />
          <text x={4} y={415} fontSize="9" fill="#93c5fd" fontWeight="700">Hot Air →</text>
          <text x={340} y={415} fontSize="9" fill="#93c5fd" fontWeight="700">← Hot Air</text>
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={`lb-${i}`}
              cx={70 + i * 8}
              cy={427}
              r={2}
              fill="#38bdf8"
              animate={{ cx: [70, 140], opacity: [0.9, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={`rb-${i}`}
              cx={330 - i * 8}
              cy={427}
              r={2}
              fill="#38bdf8"
              animate={{ cx: [330, 260], opacity: [0.9, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </g>

        {/* Slag & Molten iron separation at very bottom */}
        <g>
          <rect x={100} y={455} width={200} height={10} fill="#f97316" opacity={0.9} />
          <rect x={100} y={465} width={200} height={12} fill="#7f1d1d" />
          <text x={105} y={463} fontSize="8" fill="#fff7ed" fontWeight="700">Slag ↑</text>
          <text x={105} y={475} fontSize="8" fill="#fecaca" fontWeight="700">Molten Fe ↓</text>
          {/* Tap-out spouts */}
          <path d="M 300 460 L 335 455 L 335 462 L 300 467 Z" fill="#f97316" />
          <path d="M 300 470 L 335 476 L 335 483 L 300 477 Z" fill="#7f1d1d" />
        </g>

        {/* Wind icon on tuyere */}
        <foreignObject x={12} y={434} width={20} height={20}>
          <Wind className="h-4 w-4 text-sky-300" />
        </foreignObject>
        <foreignObject x={368} y={434} width={20} height={20}>
          <Wind className="h-4 w-4 text-sky-300" />
        </foreignObject>
      </svg>

      {/* Hint chip */}
      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-slate-200 backdrop-blur">
        <Layers className="h-3 w-3" /> Zone-এ ক্লিক করুন
      </div>
    </div>
  );
}

function zoneStops(id: ZoneId): [string, string] {
  switch (id) {
    case "reduction":
      return ["#fcd34d", "#fb923c"]; // amber → orange
    case "slag":
      return ["#fb923c", "#dc2626"]; // orange → red
    case "fusion":
      return ["#e11d48", "#9f1239"]; // rose → dark rose
    case "combustion":
      return ["#b91c1c", "#701a75"]; // red → magma magenta
  }
}
