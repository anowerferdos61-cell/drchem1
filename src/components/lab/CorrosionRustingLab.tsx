import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Droplet,
  Info,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DraggableTheoryFab from "./DraggableTheoryFab";

interface Props {
  onBack: () => void;
}

type StepId = 0 | 1 | 2 | 3;

interface StepMeta {
  id: StepId;
  titleBn: string;
  titleEn: string;
  regionBn: string;
  equation: string;
  narrationBn: string;
  accent: "amber" | "sky" | "emerald" | "rose";
}

const STEPS: StepMeta[] = [
  {
    id: 0,
    titleBn: "১. অ্যানোড অঞ্চল",
    titleEn: "Anode Region",
    regionBn: "পানির ফোঁটার কেন্দ্র · কম O₂",
    equation: "Fe(s) → Fe²⁺(aq) + 2e⁻",
    narrationBn:
      "ফোঁটার কেন্দ্রে অক্সিজেন কম, তাই এখানে লোহার পরমাণু ইলেকট্রন ছেড়ে Fe²⁺ আয়ন হয়ে পানিতে দ্রবীভূত হয়। মুক্ত ইলেকট্রন ধাতুর ভেতর দিয়ে প্রান্তের দিকে ছুটে যায়।",
    accent: "amber",
  },
  {
    id: 1,
    titleBn: "২. ক্যাথোড অঞ্চল",
    titleEn: "Cathode Region",
    regionBn: "পানির ফোঁটার প্রান্ত · বেশি O₂",
    equation: "O₂(g) + 2H₂O(l) + 4e⁻ → 4OH⁻(aq)",
    narrationBn:
      "ফোঁটার প্রান্তে বাতাসের O₂ সহজলভ্য। এখানে দ্রবীভূত O₂ ও H₂O আগত ইলেকট্রন শোষণ করে OH⁻ আয়ন উৎপন্ন করে। এভাবে লোহার পৃষ্ঠেই একটি প্রাকৃতিক তড়িৎ-রাসায়নিক কোষ তৈরি হয়।",
    accent: "sky",
  },
  {
    id: 2,
    titleBn: "৩. Fe(OH)₂ গঠন",
    titleEn: "Ferrous Hydroxide",
    regionBn: "পানির ফোঁটার ভেতরে",
    equation: "Fe²⁺(aq) + 2OH⁻(aq) → Fe(OH)₂(s)",
    narrationBn:
      "পানির ফোঁটার ভেতর Fe²⁺ ও OH⁻ আয়ন পরস্পরের দিকে ছুটে এসে সংযুক্ত হয় এবং সবুজাভ Fe(OH)₂ অধঃক্ষেপ তৈরি হয়।",
    accent: "emerald",
  },
  {
    id: 3,
    titleBn: "৪. মরিচা সৃষ্টি",
    titleEn: "Rust Formation",
    regionBn: "লোহার পৃষ্ঠের উপরে",
    equation: "4Fe(OH)₂ + O₂ + xH₂O → 2Fe₂O₃·nH₂O",
    narrationBn:
      "সবুজ Fe(OH)₂ বাতাসের অক্সিজেনের সাথে বিক্রিয়া করে হাইড্রেটেড ফেরিক অক্সাইড (Fe₂O₃·nH₂O) — অর্থাৎ পরিচিত লালচে-বাদামি ঝুরঝুরে মরিচার আস্তরণে পরিণত হয়।",
    accent: "rose",
  },
];

export default function CorrosionRustingLab({ onBack }: Props) {
  const [step, setStep] = useState<StepId>(0);
  const active = STEPS[step];

  const go = (dir: 1 | -1) => {
    const next = Math.min(3, Math.max(0, step + dir)) as StepId;
    setStep(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 text-slate-100">
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-700 to-rose-800 shadow-lg shadow-rose-950/50">
            <Droplet className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold tracking-tight sm:text-lg">
              ধাতুর ক্ষয় ও মরিচা · Corrosion & Rusting
            </h1>
            <p className="truncate text-xs text-slate-400">
              Chapter 10 · Electrochemical mechanism of iron corrosion
            </p>
          </div>
          <Badge variant="outline" className={accentBadge(active.accent)}>
            Step {step + 1}/4
          </Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ── LEFT: microscopic scene ── */}
        <section className="flex flex-col gap-3">
          <Card className="relative overflow-hidden border-white/10 bg-slate-900/60 p-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-semibold text-slate-300">
                🔬 Microscopic View · ম্যাগনিফাইড দৃশ্য
              </span>
              <span className="text-slate-400">{active.regionBn}</span>
            </div>
            <RustSceneSVG step={step} />
          </Card>

          {/* Stepper controls */}
          <Card className="border-white/10 bg-slate-900/60 p-3 backdrop-blur">
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const done = i < step;
                const isActive = i === step;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(i as StepId)}
                    className={[
                      "group relative flex-1 rounded-lg border p-2 text-left transition-all",
                      isActive
                        ? `${accentBorder(s.accent)} ${accentBg(s.accent)} shadow-lg`
                        : done
                          ? "border-emerald-400/30 bg-emerald-400/5"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {s.titleBn}
                    </div>
                    <div className="truncate text-[10px] text-slate-400">{s.titleEn}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => go(-1)}
                disabled={step === 0}
                className="gap-1 border-white/20 bg-white/5 text-slate-100 hover:bg-white/10 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> পূর্ববর্তী
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(0)}
                className="gap-1 border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button
                size="sm"
                onClick={() => go(1)}
                disabled={step === 3}
                className="gap-1 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 disabled:opacity-40"
              >
                পরবর্তী <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </section>

        {/* ── RIGHT: teacher's notes + equations ── */}
        <section className="flex flex-col gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <Card className={`relative overflow-hidden border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl ${accentGlow(active.accent)}`}>
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentGradient(active.accent)}`} />
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Teacher's Slide · ধাপ {step + 1}
                </div>
                <h2 className="mt-1 text-2xl font-extrabold leading-tight text-white">
                  {active.titleBn}
                </h2>
                <p className="text-sm text-slate-400">{active.titleEn}</p>

                <div className={`mt-4 rounded-lg border px-3 py-3 font-mono text-sm ${accentEqBox(active.accent)}`}>
                  {active.equation}
                </div>

                <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-slate-200">
                  {active.narrationBn}
                </p>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Teacher notes — always visible */}
          <Card className="border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-50">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-300">
              <Info className="h-3.5 w-3.5" /> Teacher's Note · শ্রেণিকক্ষের প্রশ্ন
            </div>
            <p>
              <strong>লবণ পানি কেন দ্রুত মরিচা ধরায়?</strong> — লবণ পানিতে Na⁺, Cl⁻ আয়নের উপস্থিতি দ্রবণের তড়িৎ পরিবাহিতা বাড়ায়, ফলে অ্যানোড ↔ ক্যাথোড অঞ্চলের মাঝে ইলেকট্রন-আয়ন প্রবাহ দ্রুত হয়। এজন্য উপকূলীয় এলাকায় ও সমুদ্রগামী জাহাজে মরিচা দ্রুত পড়ে।
            </p>
          </Card>

          <Card className="border-sky-400/20 bg-sky-400/5 p-4 text-sm text-sky-50">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-sky-300">
              <Shield className="h-3.5 w-3.5" /> প্রতিরোধ পদ্ধতি · Protection
            </div>
            <ul className="space-y-1.5">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span><strong>গ্যালভানাইজিং:</strong> Zn আবরণ Fe-এর তুলনায় বেশি সক্রিয়, তাই নিজে ক্ষয় হয়ে Fe রক্ষা করে (sacrificial protection)।</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span><strong>ইলেকট্রোপ্লেটিং:</strong> Cr / Ni-এর পাতলা প্রলেপ ধাতু ও বাতাস-পানির মধ্যে বাধা তৈরি করে।</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span><strong>পেইন্ট/তেল প্রলেপ:</strong> O₂ ও H₂O-এর সাথে সরাসরি সংস্পর্শ বন্ধ করে।</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span><strong>সংকর ধাতু:</strong> স্টেইনলেস স্টিলে Cr, Ni মিশিয়ে মরিচারোধী পৃষ্ঠ তৈরি হয়।</span>
              </li>
            </ul>
          </Card>
        </section>
      </main>

      <DraggableTheoryFab storageKey="corrosion-rusting">
        <h3>ধাতুর ক্ষয় (Corrosion) ও মরিচা ধরা (Rusting)</h3>
        <p>বায়ুমণ্ডলের অক্সিজেন, জলীয়বাষ্প ও অন্যান্য গ্যাসের সঙ্গে ধাতুর ধীর রাসায়নিক বিক্রিয়ায় ধাতু ধীরে ধীরে ক্ষয়প্রাপ্ত হওয়াকে <strong>ধাতুর ক্ষয়</strong> বলে। লোহার ক্ষেত্রে এই ক্ষয়কে <strong>মরিচা ধরা (Rusting)</strong> বলা হয়। মরিচার সংকেত: <strong>Fe₂O₃·nH₂O</strong> (জলযুক্ত ফেরিক অক্সাইড)।</p>
        <h4>বৈদ্যুতিক-রাসায়নিক ব্যাখ্যা</h4>
        <p>লোহার পৃষ্ঠে জলের ফোঁটা প্রাকৃতিক বিদ্যুৎ কোষ তৈরি করে —</p>
        <ul>
          <li><strong>অ্যানোড (কেন্দ্রে):</strong> Fe → Fe²⁺ + 2e⁻</li>
          <li><strong>ক্যাথোড (কিনারায়):</strong> O₂ + 2H₂O + 4e⁻ → 4OH⁻</li>
          <li>Fe²⁺ + 2OH⁻ → Fe(OH)₂ (সবুজাভ)</li>
          <li>4Fe(OH)₂ + O₂ → 2Fe₂O₃·H₂O (বাদামি মরিচা)</li>
        </ul>
        <h4>মরিচা ধরার শর্ত</h4>
        <ul>
          <li>বাতাস (O₂) থাকতে হবে</li>
          <li>জলীয়বাষ্প বা পানি থাকতে হবে</li>
          <li>লবণাক্ত/অম্লীয় পরিবেশ — বিক্রিয়ার হার বাড়ায় (আয়ন পরিবাহিতা বেশি)।</li>
        </ul>
        <h4>প্রতিরোধ পদ্ধতি (Prevention)</h4>
        <ul>
          <li><strong>রং/গ্রীজ প্রলেপ:</strong> বাতাস ও জল ঠেকায়।</li>
          <li><strong>গ্যালভানাইজেশন:</strong> লোহার উপর দস্তার প্রলেপ। Zn বেশি সক্রিয়, তাই আগে ক্ষয়প্রাপ্ত হয়ে লোহাকে রক্ষা করে (sacrificial protection)।</li>
          <li><strong>ইলেকট্রোপ্লেটিং:</strong> Cr/Ni-এর পাতলা স্তর চড়ানো হয় — দেখতে সুন্দর ও ক্ষয়রোধী।</li>
          <li><strong>Alloying:</strong> Cr, Ni মিশিয়ে Stainless Steel তৈরি — জং ধরে না।</li>
        </ul>
        <p><em>মূল ধারণা: মরিচা আসলে একটি অক্সিডেশন-রিডাকশন প্রক্রিয়া — লোহাকে বাতাস, পানি ও আয়ন থেকে বিচ্ছিন্ন রাখলেই ক্ষয় রোধ সম্ভব।</em></p>
      </DraggableTheoryFab>
    </div>
  );
}

/* ─────────────── Accent utilities ─────────────── */
function accentGradient(a: StepMeta["accent"]) {
  return {
    amber: "from-amber-400 to-orange-500",
    sky: "from-sky-400 to-cyan-500",
    emerald: "from-emerald-400 to-teal-500",
    rose: "from-rose-500 to-orange-700",
  }[a];
}
function accentBorder(a: StepMeta["accent"]) {
  return {
    amber: "border-amber-400/60",
    sky: "border-sky-400/60",
    emerald: "border-emerald-400/60",
    rose: "border-rose-400/60",
  }[a];
}
function accentBg(a: StepMeta["accent"]) {
  return {
    amber: "bg-amber-400/10",
    sky: "bg-sky-400/10",
    emerald: "bg-emerald-400/10",
    rose: "bg-rose-400/10",
  }[a];
}
function accentGlow(a: StepMeta["accent"]) {
  return {
    amber: "shadow-[0_0_60px_-15px] shadow-amber-400/40",
    sky: "shadow-[0_0_60px_-15px] shadow-sky-400/40",
    emerald: "shadow-[0_0_60px_-15px] shadow-emerald-400/40",
    rose: "shadow-[0_0_60px_-15px] shadow-rose-400/40",
  }[a];
}
function accentBadge(a: StepMeta["accent"]) {
  return {
    amber: "border-amber-400/50 bg-amber-400/10 text-amber-200",
    sky: "border-sky-400/50 bg-sky-400/10 text-sky-200",
    emerald: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
    rose: "border-rose-400/50 bg-rose-400/10 text-rose-200",
  }[a];
}
function accentEqBox(a: StepMeta["accent"]) {
  return {
    amber: "border-amber-400/30 bg-amber-400/5 text-amber-100",
    sky: "border-sky-400/30 bg-sky-400/5 text-sky-100",
    emerald: "border-emerald-400/30 bg-emerald-400/5 text-emerald-100",
    rose: "border-rose-400/30 bg-rose-400/5 text-rose-100",
  }[a];
}

/* ─────────────── Microscopic SVG scene ─────────────── */
function RustSceneSVG({ step }: { step: StepId }) {
  // ViewBox 600 x 340
  // Iron slab: y = 200 → 320
  // Water droplet: hemispherical dome over slab centered at (300, 200)
  const showAnode = step >= 0;
  const showElectrons = step >= 0;
  const showCathode = step >= 1;
  const showFeOH2 = step >= 2;
  const showRust = step >= 3;

  // Droplet path — a wide flat hemisphere on the surface
  const dropletPath = "M 130 200 Q 130 100 300 90 Q 470 100 470 200 Z";

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <svg viewBox="0 0 600 340" className="h-auto w-full">
        <defs>
          <linearGradient id="ironGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="skyGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="rustGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
          <radialGradient id="feohGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#166534" stopOpacity="0" />
          </radialGradient>
          <clipPath id="dropClip">
            <path d={dropletPath} />
          </clipPath>
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Air background */}
        <rect x="0" y="0" width="600" height="200" fill="url(#skyGrad)" />

        {/* Drifting O2 molecules in the air */}
        {[...Array(9)].map((_, i) => {
          const cx = 40 + i * 65;
          const cy = 30 + (i % 3) * 40;
          return (
            <motion.g
              key={`o2-${i}`}
              animate={{ y: [0, 8, 0], x: [0, 6, 0] }}
              transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
            >
              <circle cx={cx} cy={cy} r="5" fill="#f43f5e" opacity={0.85} />
              <circle cx={cx + 8} cy={cy} r="5" fill="#f43f5e" opacity={0.85} />
              <text x={cx + 4} y={cy + 20} fontSize="8" fill="#fecaca" textAnchor="middle" fontWeight="700">
                O₂
              </text>
            </motion.g>
          );
        })}

        {/* Iron slab (base metal) */}
        <rect x="0" y="200" width="600" height="140" fill="url(#ironGrad)" />
        {/* metallic texture streaks */}
        {[...Array(28)].map((_, i) => (
          <line
            key={`tex-${i}`}
            x1={i * 22}
            y1="200"
            x2={i * 22 + 12}
            y2="340"
            stroke="#334155"
            strokeWidth="0.6"
            opacity="0.6"
          />
        ))}
        {/* subtle atom grid */}
        {[...Array(20)].map((_, col) =>
          [...Array(5)].map((_, row) => (
            <circle
              key={`fe-${col}-${row}`}
              cx={15 + col * 30}
              cy={215 + row * 25}
              r="2"
              fill="#94a3b8"
              opacity="0.45"
            />
          )),
        )}
        <text x="10" y="335" fontSize="10" fill="#cbd5e1" fontWeight="700" opacity="0.8">
          Iron surface · Fe(s)
        </text>

        {/* Rust crust — appears in step 4 */}
        <AnimatePresence>
          {showRust && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9 }}
            >
              {/* flaky rust patch under & around droplet */}
              <path
                d="M 110 200 Q 200 175 300 178 Q 400 180 490 200 L 490 210 Q 400 195 300 195 Q 200 195 110 210 Z"
                fill="url(#rustGrad)"
              />
              {[...Array(14)].map((_, i) => (
                <circle
                  key={`flake-${i}`}
                  cx={130 + i * 25}
                  cy={190 + (i % 3) * 4}
                  r={2 + (i % 3)}
                  fill="#9a3412"
                  opacity={0.85}
                />
              ))}
              <text x="300" y="175" textAnchor="middle" fontSize="11" fill="#fdba74" fontWeight="800">
                Rust · মরিচা (Fe₂O₃·nH₂O)
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        {/* Water droplet */}
        <path d={dropletPath} fill="url(#waterGrad)" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.9" />
        {/* highlight */}
        <path d="M 200 130 Q 260 105 320 108" stroke="#f0f9ff" strokeWidth="2" opacity="0.7" fill="none" />

        {/* Droplet label */}
        <text x="300" y="80" textAnchor="middle" fontSize="10" fill="#bae6fd" fontWeight="700">
          H₂O droplet · পানির ফোঁটা (electrolyte)
        </text>

        <g clipPath="url(#dropClip)">
          {/* ── STEP 1: Anode — center of droplet ── */}
          {showAnode && (
            <>
              {/* glowing Fe atoms at center of surface */}
              {[...Array(5)].map((_, i) => (
                <motion.circle
                  key={`fe-anode-${i}`}
                  cx={270 + i * 15}
                  cy={200}
                  r="4"
                  fill="#fbbf24"
                  filter="url(#softGlow)"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
              {/* Fe²⁺ ions rising into the droplet */}
              {[...Array(6)].map((_, i) => (
                <motion.g key={`fe2-${i}`}>
                  <motion.circle
                    r="5"
                    fill="#fb923c"
                    stroke="#fef3c7"
                    strokeWidth="1"
                    animate={{
                      cy: [200, 130],
                      cx: [285 + i * 6, 270 + i * 12],
                      opacity: [0, 1, 1, 0.7],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  />
                  <motion.text
                    fontSize="6"
                    fontWeight="800"
                    fill="#7c2d12"
                    textAnchor="middle"
                    animate={{
                      y: [200, 130],
                      x: [285 + i * 6, 270 + i * 12],
                      opacity: [0, 1, 1, 0.7],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  >
                    Fe²⁺
                  </motion.text>
                </motion.g>
              ))}
              <text
                x="300"
                y="215"
                textAnchor="middle"
                fontSize="9"
                fill="#fef3c7"
                fontWeight="800"
                opacity={0.9}
              >
                ANODE (কেন্দ্র)
              </text>
            </>
          )}

          {/* ── STEP 3: Fe(OH)₂ cloud inside droplet ── */}
          <AnimatePresence>
            {showFeOH2 && (
              <motion.g
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              >
                <ellipse cx="270" cy="155" rx="55" ry="30" fill="url(#feohGrad)" />
                <ellipse cx="330" cy="160" rx="45" ry="25" fill="url(#feohGrad)" opacity="0.8" />
                <text x="300" y="160" textAnchor="middle" fontSize="10" fill="#166534" fontWeight="800">
                  Fe(OH)₂
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </g>

        {/* ── STEP 2: Cathode — droplet edges (outside clip so labels sit at rim) ── */}
        {showCathode && (
          <>
            {/* Left edge cathode */}
            {[...Array(3)].map((_, i) => (
              <motion.circle
                key={`ohL-${i}`}
                cx={150}
                cy={185 - i * 15}
                r="4"
                fill="#4ade80"
                stroke="#dcfce7"
                strokeWidth="1"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
            <text x="145" y="230" textAnchor="middle" fontSize="9" fill="#bbf7d0" fontWeight="800">
              OH⁻ (CATHODE)
            </text>
            {/* Right edge cathode */}
            {[...Array(3)].map((_, i) => (
              <motion.circle
                key={`ohR-${i}`}
                cx={450}
                cy={185 - i * 15}
                r="4"
                fill="#4ade80"
                stroke="#dcfce7"
                strokeWidth="1"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 + 0.2 }}
              />
            ))}
            <text x="455" y="230" textAnchor="middle" fontSize="9" fill="#bbf7d0" fontWeight="800">
              OH⁻ (CATHODE)
            </text>
          </>
        )}

        {/* Electron flow inside iron: from center outward to both edges */}
        {showElectrons &&
          [...Array(4)].map((_, i) => (
            <motion.circle
              key={`eL-${i}`}
              r="3"
              fill="#fbbf24"
              stroke="#fde68a"
              strokeWidth="0.5"
              animate={{
                cx: [300, 150],
                cy: [225, 225],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35 }}
            />
          ))}
        {showElectrons &&
          [...Array(4)].map((_, i) => (
            <motion.circle
              key={`eR-${i}`}
              r="3"
              fill="#fbbf24"
              stroke="#fde68a"
              strokeWidth="0.5"
              animate={{
                cx: [300, 450],
                cy: [225, 225],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35 + 0.15 }}
            />
          ))}
        {showElectrons && (
          <text x="300" y="260" textAnchor="middle" fontSize="9" fill="#fde68a" fontWeight="700">
            e⁻ ইলেকট্রন প্রবাহ (ধাতুর ভেতর)
          </text>
        )}

        {/* Zoom crosshair */}
        <g stroke="#475569" strokeWidth="0.8" opacity="0.4">
          <line x1="0" y1="200" x2="600" y2="200" strokeDasharray="4 4" />
        </g>
      </svg>

      {/* Status chip */}
      <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-slate-200 backdrop-blur">
        {STEPS[step].titleBn}
      </div>
    </div>
  );
}
