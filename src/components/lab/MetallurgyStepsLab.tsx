/**
 * MetallurgyStepsLab — Chapter 10 theory lab
 * Interactive 6-step pipeline flowchart for "ধাতু নিষ্কাশনের ধাপসমূহ"
 * (Steps of Metallurgy). Bengali-first with English subtitles.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Sparkles,
  Layers, Waves, Flame, Atom, FlaskConical, Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  n: number;
  titleBn: string;
  titleEn: string;
  tag: string;
  icon: LucideIcon;
  accent: string;      // tailwind text
  ring: string;        // tailwind ring
  chipBg: string;      // tailwind bg for chip
  descBn: string;
  descEn: string;
  equation?: string;
  bullets: string[];
  graphic: "crusher" | "froth" | "roast" | "oxide" | "reduce" | "refine";
};

const STEPS: Step[] = [
  {
    id: "crush", n: 1,
    titleBn: "আকরিক চূর্ণন", titleEn: "Crushing of Ore",
    tag: "Jaw Crusher · চোয়াল ক্রাশার",
    icon: Layers,
    accent: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/60 shadow-amber-500/30",
    chipBg: "from-amber-500/20 to-orange-500/10",
    descBn:
      "খনি থেকে প্রাপ্ত বড় আকরিক-খণ্ডগুলোকে চোয়াল ক্রাশার (Jaw Crusher) বা বল-মিলে ভেঙে ছোট গুঁড়ো করা হয়। এতে পরবর্তী ধাপে বিক্রিয়ার পৃষ্ঠতল বেড়ে যায়।",
    descEn:
      "Large lumps of ore are broken down into fine powder using jaw crushers and ball mills, dramatically increasing the surface area for later reactions.",
    bullets: [
      "লক্ষ্য: পৃষ্ঠতল বৃদ্ধি (surface area ↑)",
      "যন্ত্র: Jaw Crusher, Ball Mill",
      "ফল: সূক্ষ্ম চূর্ণিত আকরিক",
    ],
    graphic: "crusher",
  },
  {
    id: "concentrate", n: 2,
    titleBn: "আকরিক ঘনীকরণ", titleEn: "Concentration of Ore",
    tag: "Froth Floatation · ফেনা ভাসমান",
    icon: Waves,
    accent: "text-sky-600 dark:text-sky-400",
    ring: "ring-sky-500/60 shadow-sky-500/30",
    chipBg: "from-sky-500/20 to-cyan-500/10",
    descBn:
      "অপদ্রব্য (gangue) সরানোর জন্য ফেনা ভাসমান (Froth Floatation), চৌম্বকীয় পৃথকীকরণ বা রাসায়নিক পদ্ধতি ব্যবহার করা হয়। সালফাইড আকরিকের জন্য froth floatation সবচেয়ে কার্যকর।",
    descEn:
      "Impurities (gangue) are removed via froth floatation, magnetic separation, or chemical leaching. Froth floatation is the go-to method for sulphide ores.",
    bullets: [
      "সালফাইড আকরিক → Froth Floatation",
      "চৌম্বকীয় আকরিক → Magnetic Separation",
      "বিক্রিয়াশীল আকরিক → Chemical Leaching",
    ],
    graphic: "froth",
  },
  {
    id: "roast", n: 3,
    titleBn: "ভস্মীকরণ ও তাপজারণ", titleEn: "Calcination & Roasting",
    tag: "Furnace · উচ্চ তাপ চুল্লি",
    icon: Flame,
    accent: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-500/60 shadow-orange-500/30",
    chipBg: "from-orange-500/20 to-red-500/10",
    descBn:
      "বায়ুর অনুপস্থিতিতে উত্তপ্ত করাকে ভস্মীকরণ (Calcination) এবং বায়ুর উপস্থিতিতে উত্তপ্ত করাকে তাপজারণ (Roasting) বলে। এতে জলীয়বাষ্প, CO₂, SO₂ ইত্যাদি অপসারিত হয়।",
    descEn:
      "Calcination heats the ore in absence of air; roasting heats it in presence of air. Both drive off volatile impurities like H₂O, CO₂ and SO₂.",
    equation:
      "2 ZnS + 3 O₂ → 2 ZnO + 2 SO₂   |   CaCO₃ → CaO + CO₂",
    bullets: [
      "Calcination (ভস্মীকরণ): O₂ ছাড়া উত্তাপ",
      "Roasting (তাপজারণ): O₂ সহ উত্তাপ",
      "উদ্দেশ্য: উদ্বায়ী অপদ্রব্য অপসারণ",
    ],
    graphic: "roast",
  },
  {
    id: "oxide", n: 4,
    titleBn: "ধাতব অক্সাইডে রূপান্তর", titleEn: "Conversion to Metal Oxide",
    tag: "Ore → Metal Oxide",
    icon: Atom,
    accent: "text-fuchsia-600 dark:text-fuchsia-400",
    ring: "ring-fuchsia-500/60 shadow-fuchsia-500/30",
    chipBg: "from-fuchsia-500/20 to-pink-500/10",
    descBn:
      "সালফাইড ও কার্বনেট আকরিকগুলো এই ধাপে বিশুদ্ধ ধাতব অক্সাইডে (MO) রূপান্তরিত হয়। বিজারণের জন্য অক্সাইড রূপ সবচেয়ে সুবিধাজনক।",
    descEn:
      "Sulphide and carbonate ores are now fully converted to a pure metal oxide (MO). Oxides are the easiest form to reduce in the next step.",
    equation:
      "ZnCO₃ → ZnO + CO₂   |   2 PbS + 3 O₂ → 2 PbO + 2 SO₂",
    bullets: [
      "মধ্যবর্তী পণ্য: বিশুদ্ধ MO",
      "পরের ধাপ সহজ হয়",
      "SO₂ / CO₂ উপজাত হিসেবে বের হয়",
    ],
    graphic: "oxide",
  },
  {
    id: "reduce", n: 5,
    titleBn: "ধাতু বিজারণ", titleEn: "Reduction to Free Metal",
    tag: "Carbon Reduction · কার্বন বিজারণ",
    icon: FlaskConical,
    accent: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/60 shadow-emerald-500/30",
    chipBg: "from-emerald-500/20 to-teal-500/10",
    descBn:
      "ধাতব অক্সাইডকে কোক (C) দিয়ে উচ্চ তাপে বিজারিত করে মুক্ত ধাতু পাওয়া যায়। কিছু ধাতু (Al, Na) কার্বনে বিজারিত হয় না — এদের জন্য তড়িৎ-বিজারণ প্রয়োজন।",
    descEn:
      "The metal oxide is reduced by coke (C) at high temperature to free the metal. Reactive metals like Al, Na cannot be carbon-reduced — they need electrolytic reduction.",
    equation:
      "ZnO + C → Zn + CO   |   Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂",
    bullets: [
      "মূল বিক্রিয়া: MO + C → M + CO",
      "Blast Furnace-এ Fe নিষ্কাশন",
      "সক্রিয় ধাতু → তড়িৎ-বিজারণ",
    ],
    graphic: "reduce",
  },
  {
    id: "refine", n: 6,
    titleBn: "ধাতু বিশোধন", titleEn: "Refining of Metal",
    tag: "Electrolytic Refining · তড়িৎবিশ্লেষণ",
    icon: Zap,
    accent: "text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/60 shadow-indigo-500/30",
    chipBg: "from-indigo-500/20 to-violet-500/10",
    descBn:
      "মুক্ত ধাতুতে থাকা অবশিষ্ট অপদ্রব্য দূর করার জন্য তড়িৎবিশ্লেষণ পদ্ধতি (Electrolytic Refining) ব্যবহৃত হয়। অ্যানোডে অবিশুদ্ধ ধাতু, ক্যাথোডে বিশুদ্ধ ধাতু জমা হয় — বিশুদ্ধতা প্রায় ৯৯.৯%।",
    descEn:
      "Any leftover impurities are removed by electrolytic refining. The impure metal acts as the anode, pure metal deposits on the cathode — reaching ~99.9% purity.",
    equation:
      "Anode (impure Cu): Cu → Cu²⁺ + 2e⁻   |   Cathode (pure Cu): Cu²⁺ + 2e⁻ → Cu",
    bullets: [
      "অ্যানোড: অবিশুদ্ধ ধাতু",
      "ক্যাথোড: বিশুদ্ধ ধাতুর পাত",
      "তড়িৎ-বিশ্লেষ্য: ধাতুর লবণ দ্রবণ",
    ],
    graphic: "refine",
  },
];

export default function MetallurgyStepsLab({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  const Icon = step.icon;

  const goPrev = () => setActive((i) => Math.max(0, i - 1));
  const goNext = () => setActive((i) => Math.min(STEPS.length - 1, i + 1));

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 h-8 shrink-0 gap-1 px-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">ফিরে যান</span>
            </Button>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-base font-extrabold tracking-tight">
                ধাতু নিষ্কাশনের ধাপসমূহ
              </div>
              <div className="truncate text-xs text-muted-foreground">
                Chapter 10 · Steps of Metallurgy
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
            Step {active + 1} / {STEPS.length}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 pb-16">
        {/* Pipeline strip */}
        <PipelineStrip active={active} onPick={setActive} />

        {/* Spotlight */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Card className={cn("relative overflow-hidden p-5 shadow-sm ring-2 transition-all", step.ring)}>
            <div className="mb-3 flex items-center gap-3">
              <div className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br shadow-inner", step.chipBg)}>
                <Icon className={cn("h-5 w-5", step.accent)} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">Step {step.n}</Badge>
                  <span className="truncate text-xs font-medium text-muted-foreground">{step.tag}</span>
                </div>
                <h2 className="mt-0.5 truncate text-lg font-extrabold tracking-tight">
                  {step.titleBn}
                  <span className="ml-2 text-sm font-semibold text-muted-foreground">({step.titleEn})</span>
                </h2>
              </div>
            </div>

            <p className="text-sm leading-relaxed">{step.descBn}</p>
            <p className="mt-2 text-xs italic text-muted-foreground">{step.descEn}</p>

            {step.equation && (
              <div className="mt-3 rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs">
                {step.equation}
              </div>
            )}

            <ul className="mt-4 grid gap-1.5 text-sm">
              {step.bullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", step.accent.replace("text-", "bg-"))} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {/* Nav */}
            <div className="mt-5 flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={active === 0} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> পূর্ববর্তী
              </Button>
              <div className="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === active ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                    )}
                  />
                ))}
              </div>
              <Button size="sm" onClick={goNext} disabled={active === STEPS.length - 1} className="gap-1">
                পরবর্তী <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Concept Graphic · ধারণা-চিত্র
            </div>
            <StepGraphic kind={step.graphic} />
          </Card>
        </div>
      </main>
    </div>
  );
}

/* ─────────── Pipeline strip ─────────── */
function PipelineStrip({ active, onPick }: { active: number; onPick: (i: number) => void }) {
  return (
    <ScrollArea className="w-full">
      <ol className="flex min-w-max items-stretch gap-2 py-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === active;
          const isDone = i < active;
          return (
            <li key={s.id} className="flex items-center">
              <button
                onClick={() => onPick(i)}
                className={cn(
                  "group flex w-[160px] shrink-0 flex-col items-start gap-1 rounded-xl border bg-card p-3 text-left shadow-sm transition-all sm:w-[180px]",
                  isActive
                    ? cn("ring-2 shadow-lg -translate-y-0.5", s.ring)
                    : "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
                  isDone && "opacity-90",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <div className={cn("grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br", s.chipBg)}>
                    <Icon className={cn("h-4 w-4", s.accent)} />
                  </div>
                  <span className={cn("text-[10px] font-bold", s.accent)}>#{s.n}</span>
                </div>
                <div className="mt-1 text-sm font-bold leading-tight">{s.titleBn}</div>
                <div className="text-[10.5px] leading-tight text-muted-foreground">{s.titleEn}</div>
              </button>
              {i < STEPS.length - 1 && (
                <div className="mx-1 flex items-center" aria-hidden>
                  <svg width="26" height="14" viewBox="0 0 26 14" className="text-muted-foreground/50">
                    <defs>
                      <linearGradient id={`ln-${i}`} x1="0" x2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    <path d="M0 7 H20" stroke={`url(#ln-${i})`} strokeWidth="2" strokeDasharray="3 3" />
                    <path d="M18 2 L25 7 L18 12 Z" fill="currentColor" />
                  </svg>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

/* ─────────── Per-step SVG graphics ─────────── */
function StepGraphic({ kind }: { kind: Step["graphic"] }) {
  const common = "block h-auto w-full max-w-md mx-auto";
  switch (kind) {
    case "crusher":
      return (
        <svg viewBox="0 0 320 200" className={common}>
          <defs>
            <linearGradient id="cr-body" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="hsl(35 90% 60%)" />
              <stop offset="1" stopColor="hsl(25 90% 45%)" />
            </linearGradient>
          </defs>
          <rect x="20" y="140" width="280" height="14" fill="hsl(220 15% 30%)" rx="2" />
          {/* jaw plates */}
          <polygon points="90,40 150,40 170,120 130,140 90,120" fill="url(#cr-body)" stroke="hsl(25 60% 30%)" />
          <polygon points="170,40 230,40 230,120 190,140 150,120" fill="url(#cr-body)" stroke="hsl(25 60% 30%)">
            <animateTransform attributeName="transform" type="rotate" values="0 200 60; 5 200 60; 0 200 60" dur="1.4s" repeatCount="indefinite" />
          </polygon>
          {/* falling rocks */}
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={140 + i * 15} cy={30 + i * 5} r={5 + i} fill="hsl(30 20% 45%)">
              <animate attributeName="cy" values={`10;170;10`} dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
              <animate attributeName="opacity" values="1;1;0" dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
            </circle>
          ))}
          {/* powder */}
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={130 + i * 12} cy={168} r={1.5} fill="hsl(30 30% 55%)" />
          ))}
          <text x="160" y="185" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">Jaw Crusher</text>
        </svg>
      );
    case "froth":
      return (
        <svg viewBox="0 0 320 200" className={common}>
          <rect x="40" y="50" width="240" height="120" rx="6" fill="hsl(210 60% 20%)" opacity="0.15" stroke="hsl(210 40% 50%)" />
          <rect x="40" y="90" width="240" height="80" fill="hsl(210 70% 45%)" opacity="0.35" />
          {/* froth */}
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={i} cx={55 + i * 17} cy={78 + (i % 2) * 5} r={7 + (i % 3)} fill="hsl(190 80% 90%)" opacity="0.9">
              <animate attributeName="cy" values={`${80 + i};${65 + i};${80 + i}`} dur={`${2 + (i % 3) * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* ore particles clinging to bubbles */}
          {[70, 120, 180, 230].map((x, i) => (
            <circle key={i} cx={x} cy={82} r="3" fill="hsl(30 60% 35%)">
              <animate attributeName="cy" values="82;66;82" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* sinking gangue */}
          {[100, 160, 220].map((x, i) => (
            <circle key={i} cx={x} cy="130" r="4" fill="hsl(0 0% 30%)">
              <animate attributeName="cy" values="110;160;110" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* air bubbler */}
          <rect x="150" y="170" width="20" height="10" fill="hsl(220 15% 40%)" />
          <text x="160" y="45" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">Froth Floatation Cell</text>
        </svg>
      );
    case "roast":
      return (
        <svg viewBox="0 0 320 200" className={common}>
          <rect x="60" y="70" width="200" height="100" rx="8" fill="hsl(15 70% 25%)" stroke="hsl(15 50% 15%)" />
          <rect x="80" y="90" width="160" height="65" fill="hsl(20 100% 55%)" opacity="0.85" />
          {/* flames */}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M ${100 + i * 25} 155 Q ${105 + i * 25} 120 ${100 + i * 25} 100 Q ${95 + i * 25} 125 ${100 + i * 25} 155`} fill="hsl(45 100% 60%)" opacity="0.9">
              <animate attributeName="opacity" values="0.6;1;0.6" dur={`${0.6 + i * 0.15}s`} repeatCount="indefinite" />
            </path>
          ))}
          {/* smoke */}
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={140 + i * 25} cy={55} r={8 + i * 2} fill="hsl(0 0% 60%)" opacity="0.5">
              <animate attributeName="cy" values="65;20;65" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <text x="160" y="185" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">Roasting Furnace</text>
        </svg>
      );
    case "oxide":
      return (
        <svg viewBox="0 0 320 200" className={common}>
          {/* Left: impure ore */}
          <g>
            <circle cx="70" cy="100" r="40" fill="hsl(30 30% 40%)" opacity="0.35" stroke="hsl(30 30% 30%)" />
            <text x="70" y="105" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">ZnCO₃</text>
            <text x="70" y="160" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">Carbonate</text>
          </g>
          {/* Arrow with Δ */}
          <g>
            <path d="M 120 100 L 200 100" stroke="hsl(280 60% 55%)" strokeWidth="2.5" markerEnd="url(#oxArr)" />
            <defs>
              <marker id="oxArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0 0 L10 5 L0 10 z" fill="hsl(280 60% 55%)" />
              </marker>
            </defs>
            <text x="160" y="90" textAnchor="middle" fontSize="12" fontWeight="700" fill="hsl(280 60% 55%)">Δ / heat</text>
            <text x="160" y="118" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">− CO₂</text>
          </g>
          {/* Right: pure oxide */}
          <g>
            <circle cx="250" cy="100" r="40" fill="hsl(300 70% 55%)" opacity="0.35" stroke="hsl(300 60% 40%)" />
            <text x="250" y="105" textAnchor="middle" fontSize="14" fontWeight="800" fill="hsl(300 60% 35%)">ZnO</text>
            <text x="250" y="160" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">Metal Oxide</text>
          </g>
        </svg>
      );
    case "reduce":
      return (
        <svg viewBox="0 0 320 200" className={common}>
          {/* Blast furnace outline */}
          <path d="M 100 30 L 220 30 L 240 90 L 240 170 L 80 170 L 80 90 Z" fill="hsl(15 40% 20%)" stroke="hsl(15 30% 10%)" />
          <path d="M 100 30 L 220 30 L 220 60 L 100 60 Z" fill="hsl(15 30% 30%)" />
          {/* fire zone */}
          <ellipse cx="160" cy="130" rx="55" ry="25" fill="hsl(20 100% 55%)" opacity="0.85">
            <animate attributeName="opacity" values="0.65;1;0.65" dur="1.2s" repeatCount="indefinite" />
          </ellipse>
          <text x="160" y="135" textAnchor="middle" fontSize="12" fontWeight="800" fill="hsl(0 0% 15%)">ZnO + C</text>
          {/* molten metal */}
          <rect x="90" y="160" width="140" height="10" fill="hsl(200 100% 65%)" opacity="0.85" />
          <text x="160" y="185" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.75">Molten Zn → CO ↑</text>
          {/* CO up */}
          {[130, 160, 190].map((x, i) => (
            <circle key={i} cx={x} cy="50" r="5" fill="hsl(0 0% 55%)" opacity="0.7">
              <animate attributeName="cy" values="90;15;90" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );
    case "refine":
      return (
        <svg viewBox="0 0 320 200" className={common}>
          {/* electrolyte tank */}
          <rect x="40" y="55" width="240" height="115" rx="6" fill="hsl(200 70% 50%)" opacity="0.25" stroke="hsl(200 40% 40%)" />
          {/* anode (impure) */}
          <rect x="90" y="35" width="18" height="130" fill="hsl(20 60% 35%)" stroke="hsl(20 50% 20%)" />
          <text x="99" y="28" textAnchor="middle" fontSize="10" fontWeight="700" fill="hsl(0 70% 45%)">+ Anode</text>
          <text x="99" y="185" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.75">impure Cu</text>
          {/* cathode (pure) */}
          <rect x="212" y="35" width="18" height="130" fill="hsl(20 90% 60%)" stroke="hsl(20 80% 40%)" />
          <text x="221" y="28" textAnchor="middle" fontSize="10" fontWeight="700" fill="hsl(215 70% 45%)">− Cathode</text>
          <text x="221" y="185" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.75">pure Cu</text>
          {/* ion flow */}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle cx={115 + i * 30} cy={100} r="4" fill="hsl(20 90% 55%)">
                <animate attributeName="cx" values={`115;210`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
                <animate attributeName="cy" values={`${90 + i * 8};${90 + i * 8}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
              </circle>
            </g>
          ))}
          {/* sludge */}
          <rect x="50" y="160" width="80" height="8" fill="hsl(30 30% 25%)" opacity="0.7" />
          <text x="90" y="155" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.7">anode mud</text>
          {/* wires + battery */}
          <path d="M 99 35 L 99 15 L 221 15 L 221 35" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="150" y="6" width="20" height="16" fill="hsl(45 90% 55%)" stroke="hsl(45 60% 35%)" />
          <text x="160" y="18" textAnchor="middle" fontSize="10" fontWeight="700" fill="hsl(0 0% 15%)">⎓</text>
        </svg>
      );
  }
}
