/**
 * Group-wise Special Elements & Water Reactivity Simulator
 * গ্রুপ ভিত্তিক বিশেষ মৌল ও পানির সাথে বিক্রিয়ার তীব্রতা সিমুলেটর
 *
 * Showcases visual appearance + reactivity-with-water animation for
 * Group 1 (alkali), Group 2 (alkaline earth), Group 17 (halogens),
 * Group 18 (noble gases).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Droplets, Flame, AlertTriangle, Thermometer, Play, RotateCcw, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  onBack: () => void;
}

type GroupId = "g1" | "g2" | "g17" | "g18";

interface ElementSpec {
  Z: number;
  symbol: string;
  nameEn: string;
  nameBn: string;
  state: "Solid" | "Liquid" | "Gas";
  stateBn: string;
  color: string;        // visual color of the substance
  swatch: string;       // tailwind gradient classes for "real-world" card
  hazard: "Low" | "Medium" | "High" | "Extreme";
  hazardBn: string;
  appearanceBn: string;
  // reactivity-with-water profile
  reactivity: "none" | "slow" | "mild" | "vigorous" | "violent" | "explosive" | "na";
  flameColor?: string;  // hex
  flameLabel?: string;  // e.g. "Yellow / Orange"
  tempRise: number;     // delta °C produced (visual gauge)
  equation?: string;
  equationBn?: string;
  note?: string;        // for non-reactive groups
  needsHeat?: boolean;  // Mg requires hot water
}

const ELEMENTS: Record<GroupId, ElementSpec[]> = {
  g1: [
    {
      Z: 3, symbol: "Li", nameEn: "Lithium", nameBn: "লিথিয়াম",
      state: "Solid", stateBn: "কঠিন", color: "#c0c8d0",
      swatch: "from-slate-300 via-slate-200 to-slate-400",
      hazard: "High", hazardBn: "উচ্চ",
      appearanceBn: "নরম, রুপালি-ধূসর ধাতু — কেরোসিনের নিচে সংরক্ষিত।",
      reactivity: "mild", flameColor: "#dc2626", flameLabel: "Crimson Red", tempRise: 25,
      equation: "2Li(s) + 2H₂O(l) → 2LiOH(aq) + H₂(g)↑",
      equationBn: "ধীরে বুদবুদ ছাড়ে, পানিতে ভাসে।",
    },
    {
      Z: 11, symbol: "Na", nameEn: "Sodium", nameBn: "সোডিয়াম",
      state: "Solid", stateBn: "কঠিন", color: "#b8c0c8",
      swatch: "from-zinc-200 via-slate-300 to-zinc-400",
      hazard: "Extreme", hazardBn: "অতি বিপজ্জনক",
      appearanceBn: "চকচকে রুপালি; ছুরিতে কাটা যায়; কেরোসিনে রাখা হয়।",
      reactivity: "violent", flameColor: "#f59e0b", flameLabel: "Yellow / Orange", tempRise: 55,
      equation: "2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂(g)↑ + Heat",
      equationBn: "গোলাকার গলে পানির উপর দ্রুত ছুটে বেড়ায়, হলুদ শিখা ও শেষে 'পপ'!",
    },
    {
      Z: 19, symbol: "K", nameEn: "Potassium", nameBn: "পটাশিয়াম",
      state: "Solid", stateBn: "কঠিন", color: "#aab2bd",
      swatch: "from-slate-300 via-zinc-300 to-slate-500",
      hazard: "Extreme", hazardBn: "অতি বিপজ্জনক",
      appearanceBn: "নরম রুপালি ধাতু; বাতাসে দ্রুত বিবর্ণ; তেলে সংরক্ষিত।",
      reactivity: "explosive", flameColor: "#a855f7", flameLabel: "Lilac / Purple", tempRise: 90,
      equation: "2K(s) + 2H₂O(l) → 2KOH(aq) + H₂(g)↑ + অনেক তাপ",
      equationBn: "পানিতে ফেলামাত্রই বেগুনি শিখা ও বিস্ফোরণ!",
    },
  ],
  g2: [
    {
      Z: 12, symbol: "Mg", nameEn: "Magnesium", nameBn: "ম্যাগনেসিয়াম",
      state: "Solid", stateBn: "কঠিন", color: "#d4d4d8",
      swatch: "from-zinc-100 via-slate-200 to-zinc-300",
      hazard: "Medium", hazardBn: "মাঝারি",
      appearanceBn: "রুপালি-সাদা ধাতব ফিতা (ribbon); উজ্জ্বল সাদা শিখায় জ্বলে।",
      reactivity: "slow", flameColor: "#fef3c7", flameLabel: "Bright White (burn)", tempRise: 15,
      equation: "Mg(s) + 2H₂O(g) → Mg(OH)₂ + H₂↑  (গরম পানি/বাষ্প)",
      equationBn: "ঠান্ডা পানিতে প্রায় কিছুই হয় না; গরম পানিতে ধীরে বুদবুদ।",
      needsHeat: true,
    },
    {
      Z: 20, symbol: "Ca", nameEn: "Calcium", nameBn: "ক্যালসিয়াম",
      state: "Solid", stateBn: "কঠিন", color: "#cbd5e1",
      swatch: "from-slate-200 via-zinc-200 to-slate-400",
      hazard: "Medium", hazardBn: "মাঝারি",
      appearanceBn: "রুপালি-সাদা ধাতু; পানিতে ডুবে যায়।",
      reactivity: "mild", flameColor: "#fb923c", flameLabel: "Orange-Red", tempRise: 20,
      equation: "Ca(s) + 2H₂O(l) → Ca(OH)₂(aq) + H₂(g)↑",
      equationBn: "তলায় বসে স্থির হারে বুদবুদ ছাড়ে; পানি ঘোলা চুনের পানি হয়।",
    },
  ],
  g17: [
    {
      Z: 9, symbol: "F", nameEn: "Fluorine", nameBn: "ফ্লোরিন",
      state: "Gas", stateBn: "গ্যাস", color: "#fde68a",
      swatch: "from-yellow-100 via-yellow-200 to-amber-300",
      hazard: "Extreme", hazardBn: "অতি বিপজ্জনক",
      appearanceBn: "ফ্যাকাশে হলুদ গ্যাস; অত্যন্ত বিষাক্ত।",
      reactivity: "violent", tempRise: 70,
      equation: "2F₂(g) + 2H₂O(l) → 4HF(aq) + O₂(g)",
      equationBn: "পানির সাথে তীব্র বিক্রিয়ায় O₂ মুক্ত করে — ল্যাবে কখনোই দেখানো হয় না।",
      note: "⚠️ অত্যন্ত প্রতিক্রিয়াশীল হ্যালোজেন; প্রদর্শন নিরাপদ নয়।",
    },
    {
      Z: 17, symbol: "Cl", nameEn: "Chlorine", nameBn: "ক্লোরিন",
      state: "Gas", stateBn: "গ্যাস", color: "#bef264",
      swatch: "from-lime-200 via-green-200 to-yellow-200",
      hazard: "High", hazardBn: "উচ্চ",
      appearanceBn: "হলদে-সবুজ (greenish-yellow) গ্যাস; ঝাঁঝালো গন্ধ।",
      reactivity: "slow", tempRise: 5,
      equation: "Cl₂(g) + H₂O(l) ⇌ HCl(aq) + HOCl(aq)",
      equationBn: "পানিতে কিছুটা দ্রবীভূত হয়ে ক্লোরিন-পানি (bleach) তৈরি করে।",
    },
    {
      Z: 35, symbol: "Br", nameEn: "Bromine", nameBn: "ব্রোমিন",
      state: "Liquid", stateBn: "তরল", color: "#7c2d12",
      swatch: "from-orange-900 via-red-800 to-amber-900",
      hazard: "High", hazardBn: "উচ্চ",
      appearanceBn: "গাঢ় লালচে-বাদামি তরল; ঘন বাদামি বাষ্প ছাড়ে।",
      reactivity: "slow", tempRise: 3,
      equation: "Br₂(l) + H₂O(l) ⇌ HBr(aq) + HOBr(aq)",
      equationBn: "অল্প পরিমাণ দ্রবীভূত হয়; ক্লোরিনের চেয়ে কম প্রতিক্রিয়াশীল।",
    },
    {
      Z: 53, symbol: "I", nameEn: "Iodine", nameBn: "আয়োডিন",
      state: "Solid", stateBn: "কঠিন", color: "#581c87",
      swatch: "from-purple-900 via-violet-800 to-slate-900",
      hazard: "Medium", hazardBn: "মাঝারি",
      appearanceBn: "চকচকে কালো-বেগুনি কঠিন; ঊর্ধ্বপাতিত হয়ে বেগুনি বাষ্প দেয়।",
      reactivity: "none", tempRise: 0,
      equation: "I₂(s) + H₂O(l) → প্রায় অদ্রবণীয়",
      equationBn: "পানিতে প্রায় দ্রবীভূত হয় না; KI দ্রবণে দ্রবণীয়।",
    },
  ],
  g18: [
    {
      Z: 2, symbol: "He", nameEn: "Helium", nameBn: "হিলিয়াম",
      state: "Gas", stateBn: "গ্যাস", color: "#e0f2fe",
      swatch: "from-sky-50 via-blue-100 to-cyan-100",
      hazard: "Low", hazardBn: "নিম্ন",
      appearanceBn: "বর্ণহীন, গন্ধহীন গ্যাস — বেলুনে ব্যবহৃত।",
      reactivity: "na", tempRise: 0,
      note: "নিষ্ক্রিয় গ্যাস — পানির সাথে কোনো বিক্রিয়া করে না।",
    },
    {
      Z: 10, symbol: "Ne", nameEn: "Neon", nameBn: "নিয়ন",
      state: "Gas", stateBn: "গ্যাস", color: "#fecaca",
      swatch: "from-rose-100 via-orange-100 to-red-100",
      hazard: "Low", hazardBn: "নিম্ন",
      appearanceBn: "বর্ণহীন গ্যাস; বিদ্যুৎ-নিঃসরণে কমলা-লাল আলো দেয় (নিয়ন সাইন)।",
      reactivity: "na", tempRise: 0,
      note: "নিষ্ক্রিয় গ্যাস — পানির সাথে কোনো বিক্রিয়া নেই।",
    },
    {
      Z: 18, symbol: "Ar", nameEn: "Argon", nameBn: "আর্গন",
      state: "Gas", stateBn: "গ্যাস", color: "#ddd6fe",
      swatch: "from-violet-100 via-indigo-100 to-purple-100",
      hazard: "Low", hazardBn: "নিম্ন",
      appearanceBn: "বর্ণহীন, গন্ধহীন গ্যাস; বৈদ্যুতিক বাল্বে নিষ্ক্রিয় পরিবেশ তৈরিতে ব্যবহৃত।",
      reactivity: "na", tempRise: 0,
      note: "নিষ্ক্রিয় গ্যাস — সম্পূর্ণ অপ্রতিক্রিয়াশীল।",
    },
  ],
};

const GROUPS: { id: GroupId; labelBn: string; labelEn: string; accent: string }[] = [
  { id: "g1",  labelBn: "ক্ষার ধাতু",       labelEn: "Group 1 · Alkali Metals",         accent: "from-amber-500 to-orange-600" },
  { id: "g2",  labelBn: "মৃৎক্ষার ধাতু",     labelEn: "Group 2 · Alkaline Earth",        accent: "from-emerald-500 to-teal-600" },
  { id: "g17", labelBn: "হ্যালোজেন",         labelEn: "Group 17 · Halogens",             accent: "from-lime-500 to-yellow-600" },
  { id: "g18", labelBn: "নিষ্ক্রিয় গ্যাস",  labelEn: "Group 18 · Noble Gases",          accent: "from-violet-500 to-fuchsia-600" },
];

// Visual intensity profile per reactivity level
const PROFILE: Record<ElementSpec["reactivity"], {
  duration: number; bubbles: number; ripple: number; flame: number; explosion: boolean;
  sounds: string[]; phEnd: number;
}> = {
  none:      { duration: 2500, bubbles: 0,  ripple: 0, flame: 0, explosion: false, sounds: [], phEnd: 7 },
  na:        { duration: 1500, bubbles: 0,  ripple: 0, flame: 0, explosion: false, sounds: [], phEnd: 7 },
  slow:      { duration: 4000, bubbles: 12, ripple: 1, flame: 0, explosion: false, sounds: ["[fizz...]"], phEnd: 8 },
  mild:      { duration: 4500, bubbles: 22, ripple: 2, flame: 0, explosion: false, sounds: ["[Fizz!]", "[bubble bubble]"], phEnd: 12 },
  vigorous:  { duration: 5000, bubbles: 40, ripple: 3, flame: 1, explosion: true,  sounds: ["[Fizz!!]", "[Whoosh!]", "[Pop!]"], phEnd: 13 },
  violent:   { duration: 5500, bubbles: 55, ripple: 4, flame: 1, explosion: true,  sounds: ["[FIZZ!]", "[CRACKLE!]", "[BANG!]"], phEnd: 14 },
  explosive: { duration: 6000, bubbles: 80, ripple: 5, flame: 2, explosion: true,  sounds: ["[BOOM!]", "[EXPLOSION!]", "[Sizzle!]"], phEnd: 14 },
};

// ─────────────────────────────────────────────────────────────

export default function GroupReactivityLab({ onBack }: Props) {
  const [group, setGroup] = useState<GroupId>("g1");
  const [selectedZ, setSelectedZ] = useState<number>(ELEMENTS.g1[1].Z); // Na default
  const [phenol, setPhenol] = useState(true);
  const [hotWater, setHotWater] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [reactionDone, setReactionDone] = useState(false);
  const tickRef = useRef<number | null>(null);

  // When group changes, reset selection to first member
  useEffect(() => {
    setSelectedZ(ELEMENTS[group][0].Z);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  const element = useMemo(
    () => ELEMENTS[group].find((e) => e.Z === selectedZ) ?? ELEMENTS[group][0],
    [group, selectedZ]
  );

  // Effective reactivity (Mg needs hot water)
  const effectiveReactivity = useMemo<ElementSpec["reactivity"]>(() => {
    if (element.needsHeat && !hotWater) return "none";
    return element.reactivity;
  }, [element, hotWater]);

  const profile = PROFILE[effectiveReactivity];
  const currentTemp = 25 + (running || reactionDone ? element.tempRise * (reactionDone ? 1 : progress) : 0);
  const currentPH = (() => {
    if (effectiveReactivity === "na" || effectiveReactivity === "none") return 7;
    const start = 7;
    const end = profile.phEnd;
    return start + (end - start) * (reactionDone ? 1 : progress);
  })();

  function reset() {
    if (tickRef.current) {
      cancelAnimationFrame(tickRef.current);
      tickRef.current = null;
    }
    setRunning(false);
    setProgress(0);
    setReactionDone(false);
  }

  function drop() {
    if (running) return;
    reset();
    setRunning(true);
    const start = performance.now();
    const dur = profile.duration;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setProgress(t);
      if (t >= 1) {
        setRunning(false);
        setReactionDone(true);
        tickRef.current = null;
        return;
      }
      tickRef.current = requestAnimationFrame(step);
    };
    tickRef.current = requestAnimationFrame(step);
  }

  useEffect(() => () => { if (tickRef.current) cancelAnimationFrame(tickRef.current); }, []);

  const isInert = effectiveReactivity === "na";
  const noWaterRxn = effectiveReactivity === "none";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}
              className="-ml-2 gap-1 text-slate-200 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight md:text-base">গ্রুপ ভিত্তিক বিশেষ মৌল ও পানির সাথে বিক্রিয়া</div>
              <div className="text-[10px] text-slate-400 md:text-xs">Special Groups & Water Reactivity Simulator · CH 4</div>
            </div>
          </div>
          <Badge variant="outline" className="hidden border-white/20 bg-white/5 text-slate-200 sm:inline-flex">
            ⚠️ Safe Virtual Lab
          </Badge>
        </div>

        {/* Group tabs */}
        <div className="mx-auto max-w-7xl px-4 pb-3">
          <Tabs value={group} onValueChange={(v) => setGroup(v as GroupId)}>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-white/5 p-1 md:grid-cols-4">
              {GROUPS.map((g) => (
                <TabsTrigger
                  key={g.id}
                  value={g.id}
                  className={`flex-col gap-0.5 py-2 text-xs data-[state=active]:bg-gradient-to-br data-[state=active]:text-white ${
                    group === g.id ? g.accent.replace(/from-/g, "data-[state=active]:from-").replace(/to-/g, "data-[state=active]:to-") : ""
                  }`}
                >
                  <span className="font-bold">{g.labelBn}</span>
                  <span className="text-[10px] opacity-80">{g.labelEn}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Element chips for the active group */}
          <div className="mt-3 flex flex-wrap gap-2">
            {ELEMENTS[group].map((el) => (
              <button
                key={el.Z}
                onClick={() => { setSelectedZ(el.Z); reset(); }}
                className={`group relative flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-all ${
                  selectedZ === el.Z
                    ? "border-white/40 bg-white/15 text-white shadow-lg shadow-black/30"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10"
                }`}
              >
                <span className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold"
                  style={{ background: el.color, color: "#0f172a" }}>
                  {el.symbol}
                </span>
                <span className="font-semibold">{el.nameBn}</span>
                <span className="text-[10px] opacity-60">{el.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-12">
          {/* LEFT — Real World Appearance */}
          <Card className="border-white/10 bg-white/[0.03] p-4 text-slate-100 lg:col-span-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Beaker className="h-3.5 w-3.5" /> বাস্তব রূপ · Real Appearance
            </div>

            {/* Appearance visual card */}
            <div className={`relative h-44 overflow-hidden rounded-2xl bg-gradient-to-br ${element.swatch} shadow-inner`}>
              <AppearanceVisual element={element} />
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <div className="text-xl font-extrabold">{element.nameBn}</div>
                <div className="text-sm font-semibold opacity-70">{element.symbol} · Z={element.Z}</div>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">{element.appearanceBn}</p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Spec label="অবস্থা" value={`${element.stateBn}`} sub={element.state} />
              <Spec label="বর্ণ" value="রঙ" sub={element.flameLabel ?? "—"}
                colorDot={element.color} />
              <Spec label="ঝুঁকি" value={element.hazardBn} sub={element.hazard}
                tone={hazardTone(element.hazard)} />
            </div>
          </Card>

          {/* CENTER — Reaction Beaker */}
          <Card className="relative overflow-hidden border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-0 lg:col-span-6">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Droplets className="h-3.5 w-3.5 text-sky-400" /> ভার্চুয়াল এক্সপেরিমেন্ট · Reaction Beaker
              </div>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-1.5 text-slate-300">
                  <Switch checked={phenol} onCheckedChange={setPhenol} />
                  Phenolphthalein
                </label>
                {element.needsHeat && (
                  <label className="flex cursor-pointer items-center gap-1.5 text-slate-300">
                    <Switch checked={hotWater} onCheckedChange={setHotWater} />
                    <Flame className="h-3.5 w-3.5 text-orange-400" /> Heat Water
                  </label>
                )}
              </div>
            </div>

            <div className="relative h-[420px] w-full">
              <BeakerScene
                element={element}
                running={running}
                progress={progress}
                done={reactionDone}
                phenol={phenol}
                hotWater={hotWater}
                profile={profile}
                effectiveReactivity={effectiveReactivity}
              />
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-black/40 px-4 py-3">
              <Button
                onClick={drop}
                disabled={running || isInert}
                size="lg"
                className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {isInert ? "নিষ্ক্রিয় — বিক্রিয়া হবে না" : "পানিতে ফেলুন · Drop into Water"}
              </Button>
              <Button onClick={reset} variant="outline" size="lg"
                className="gap-1 border-white/20 bg-white/5 text-slate-100 hover:bg-white/10">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </Card>

          {/* RIGHT — Live Data & Equation */}
          <Card className="border-white/10 bg-white/[0.03] p-4 text-slate-100 lg:col-span-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Thermometer className="h-3.5 w-3.5" /> Live Data · বিক্রিয়ার তথ্য
            </div>

            {/* Equation board */}
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                রাসায়নিক সমীকরণ
              </div>
              {isInert ? (
                <div className="mt-1 text-sm text-slate-300">
                  <Badge variant="outline" className="border-violet-400/40 text-violet-300">No Reaction</Badge>
                  <p className="mt-2 text-xs leading-relaxed">{element.note}</p>
                </div>
              ) : noWaterRxn ? (
                <div className="mt-1 text-sm text-slate-300">
                  <Badge variant="outline" className="border-slate-400/40 text-slate-300">Practically Inert</Badge>
                  <p className="mt-2 text-xs leading-relaxed">
                    {element.needsHeat
                      ? "ঠান্ডা পানিতে বিক্রিয়া করে না। Heat Water চালু করুন।"
                      : element.equationBn}
                  </p>
                </div>
              ) : (
                <>
                  <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[12px] leading-snug text-emerald-300">
                    {element.equation}
                  </pre>
                  {element.equationBn && (
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                      {element.equationBn}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Temperature gauge */}
            <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">তাপমাত্রা · Temperature</span>
                <span className="font-mono font-bold text-orange-300">{currentTemp.toFixed(0)}°C</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 transition-all duration-200"
                  style={{ width: `${Math.min(100, ((currentTemp - 25) / 100) * 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-slate-500">
                <span>25°C</span><span>125°C+</span>
              </div>
            </div>

            {/* pH strip */}
            <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">pH (দ্রবণ)</span>
                <span className="font-mono font-bold" style={{ color: phColor(currentPH) }}>
                  {currentPH.toFixed(1)}
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full"
                style={{ background: "linear-gradient(to right, #ef4444, #f59e0b, #eab308, #84cc16, #10b981, #22d3ee, #3b82f6, #8b5cf6, #d946ef)" }}>
                <div className="h-full w-px bg-white shadow-[0_0_8px_white]"
                  style={{ marginLeft: `${(currentPH / 14) * 100}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-slate-500">
                <span>0</span><span>7</span><span>14</span>
              </div>
              {phenol && currentPH > 8.3 && (
                <div className="mt-2 rounded-md bg-pink-500/15 px-2 py-1 text-[11px] text-pink-300">
                  নির্দেশক: গাঢ় গোলাপি — দ্রবণ ক্ষারীয়।
                </div>
              )}
            </div>

            {/* Sound FX */}
            {(running || reactionDone) && profile.sounds.length > 0 && (
              <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">শব্দ · Sound FX</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.sounds.map((s, i) => (
                    <span key={i}
                      className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[11px] text-amber-300"
                      style={{ animation: running ? `pulse 1.${i}s infinite` : undefined }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {element.hazard === "Extreme" && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[11px] text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>বাস্তব ল্যাবে এই বিক্রিয়া অত্যন্ত বিপজ্জনক — শুধু ভার্চুয়াল প্রদর্শনের জন্য।</span>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function Spec({ label, value, sub, tone, colorDot }: {
  label: string; value: string; sub?: string; tone?: string; colorDot?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 flex items-center justify-center gap-1 text-[11px] font-bold ${tone ?? "text-slate-100"}`}>
        {colorDot && <span className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white/40" style={{ background: colorDot }} />}
        {value}
      </div>
      {sub && <div className="text-[9px] text-slate-500">{sub}</div>}
    </div>
  );
}

function hazardTone(h: ElementSpec["hazard"]) {
  switch (h) {
    case "Low": return "text-emerald-300";
    case "Medium": return "text-amber-300";
    case "High": return "text-orange-300";
    case "Extreme": return "text-red-400";
  }
}

function phColor(ph: number) {
  if (ph < 3) return "#ef4444";
  if (ph < 6) return "#f59e0b";
  if (ph < 8) return "#22c55e";
  if (ph < 11) return "#3b82f6";
  return "#d946ef";
}

// Real-world appearance illustration per element (pure SVG/CSS)
function AppearanceVisual({ element }: { element: ElementSpec }) {
  // Reusable pieces
  if (element.state === "Gas") {
    return (
      <div className="relative h-full w-full">
        {/* Sealed flask */}
        <svg viewBox="0 0 200 180" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id={`gas-${element.symbol}`} cx="50%" cy="55%" r="60%">
              <stop offset="0%" stopColor={element.color} stopOpacity="0.95" />
              <stop offset="100%" stopColor={element.color} stopOpacity="0.4" />
            </radialGradient>
          </defs>
          {/* Stopper */}
          <rect x="88" y="14" width="24" height="14" rx="3" fill="#1f2937" />
          {/* Neck */}
          <rect x="92" y="28" width="16" height="22" fill="rgba(255,255,255,0.5)" stroke="rgba(0,0,0,0.15)" />
          {/* Round flask body */}
          <ellipse cx="100" cy="105" rx="62" ry="55" fill={`url(#gas-${element.symbol})`} stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          {/* Highlight */}
          <ellipse cx="78" cy="80" rx="14" ry="22" fill="rgba(255,255,255,0.35)" />
          {/* Wisps */}
          {[...Array(5)].map((_, i) => (
            <circle key={i} cx={70 + i * 14} cy={120 - (i % 2) * 14} r={3 + (i % 3)}
              fill="rgba(255,255,255,0.3)">
              <animate attributeName="cy" values={`${120};${100};${120}`} dur={`${3 + i}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    );
  }
  if (element.state === "Liquid") {
    // Bromine bottle with brown liquid + vapor
    return (
      <div className="relative h-full w-full">
        <svg viewBox="0 0 200 180" className="absolute inset-0 h-full w-full">
          <rect x="86" y="10" width="28" height="14" rx="3" fill="#1f2937" />
          <path d="M70 30 L130 30 L130 50 L150 160 L50 160 L70 50 Z"
            fill="rgba(255,255,255,0.25)" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          {/* Liquid */}
          <path d="M58 100 L142 100 L150 160 L50 160 Z" fill={element.color} opacity="0.92" />
          {/* Vapor */}
          {[...Array(6)].map((_, i) => (
            <circle key={i} cx={75 + i * 11} cy={85 - (i % 2) * 8} r={4 + (i % 3)}
              fill="#92400e" opacity="0.55">
              <animate attributeName="cy" values={`${85};${45};${85}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.55;0.1;0.55" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    );
  }
  // Solid — metal chunk under "kerosene" for Na/K/Li, ribbon for Mg, chunk for Ca, dark crystals for I
  if (element.symbol === "I") {
    return (
      <div className="relative h-full w-full">
        <svg viewBox="0 0 200 180" className="absolute inset-0 h-full w-full">
          <rect x="40" y="120" width="120" height="30" rx="4" fill="#0f172a" />
          {[
            [70, 110, 18], [95, 100, 22], [125, 112, 16], [110, 122, 14], [80, 122, 12],
          ].map(([x, y, s], i) => (
            <polygon key={i}
              points={`${x},${y} ${x + s},${y - s / 2} ${x + s + 4},${y + s / 2} ${x + s / 2},${y + s} ${x - 2},${y + s / 2}`}
              fill="#581c87" stroke="#312e81" strokeWidth="1.2" />
          ))}
          {/* purple vapor wisps */}
          {[...Array(4)].map((_, i) => (
            <circle key={i} cx={80 + i * 15} cy={80} r="5" fill="#a855f7" opacity="0.5">
              <animate attributeName="cy" values="80;40;80" dur={`${3 + i}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.05;0.5" dur={`${3 + i}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    );
  }
  if (element.symbol === "Mg") {
    // Ribbon
    return (
      <div className="relative h-full w-full">
        <svg viewBox="0 0 200 180" className="absolute inset-0 h-full w-full">
          <path d="M30 90 Q 80 60, 120 100 T 180 95"
            stroke="#e5e7eb" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M30 90 Q 80 60, 120 100 T 180 95"
            stroke="#9ca3af" strokeWidth="2" fill="none" strokeDasharray="4 8" strokeLinecap="round" />
          <text x="100" y="155" textAnchor="middle" className="fill-slate-700 text-[10px]" fontSize="10">
            Magnesium Ribbon
          </text>
        </svg>
      </div>
    );
  }
  // Alkali metal in kerosene jar (Li, Na, K) or Ca chunk
  const isAlkali = ["Li", "Na", "K"].includes(element.symbol);
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 200 180" className="absolute inset-0 h-full w-full">
        {/* Jar */}
        <rect x="40" y="30" width="120" height="130" rx="8" fill="rgba(255,255,255,0.4)" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
        {isAlkali && (
          <>
            {/* Kerosene liquid */}
            <rect x="42" y="60" width="116" height="98" rx="6" fill="#fde68a" opacity="0.55" />
            <text x="100" y="50" textAnchor="middle" className="fill-slate-700 text-[9px]" fontSize="9">Kerosene · কেরোসিন</text>
          </>
        )}
        {/* Metal chunk (cut surface highlight) */}
        <polygon points="70,100 130,95 135,135 65,140" fill={element.color} stroke="#475569" strokeWidth="1" />
        <polygon points="70,100 95,90 105,95 80,108" fill="#f8fafc" opacity="0.9" />
        {/* Knife (Na/K only) */}
        {(element.symbol === "Na" || element.symbol === "K") && (
          <>
            <rect x="120" y="70" width="40" height="4" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" transform="rotate(-15 140 72)" />
            <rect x="155" y="68" width="14" height="8" fill="#78350f" transform="rotate(-15 162 72)" />
          </>
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beaker scene — water + reaction animation
// ─────────────────────────────────────────────────────────────

function BeakerScene({
  element, running, progress, done, phenol, hotWater, profile, effectiveReactivity,
}: {
  element: ElementSpec; running: boolean; progress: number; done: boolean;
  phenol: boolean; hotWater: boolean;
  profile: typeof PROFILE[ElementSpec["reactivity"]];
  effectiveReactivity: ElementSpec["reactivity"];
}) {
  // Water color: clear normally; if pH > 8.3 and phenol on, fade to pink
  const showPink = phenol && (running || done) && effectiveReactivity !== "na" && effectiveReactivity !== "none";
  const pinkAmt = showPink ? (done ? 1 : Math.min(1, progress * 1.5)) : 0;
  const waterColor = blendHex("#dbeafe", "#ec4899", pinkAmt);

  // Sodium darting: x position oscillates
  const darting = effectiveReactivity === "violent" || effectiveReactivity === "vigorous";
  const dartX = darting && running
    ? 200 + Math.sin(progress * 24) * 90
    : 200;
  const dartY = effectiveReactivity === "mild" ? 180 // floats top
    : effectiveReactivity === "slow" || effectiveReactivity === "none"
      ? element.state === "Solid" ? 280 : 180
      : 175; // alkali metals dart on surface

  // For Ca — sink to bottom
  const sinkY = effectiveReactivity === "mild" && element.symbol === "Ca" ? 300 : dartY;

  // Explosion trigger near end
  const showExplosion = profile.explosion && running && progress > 0.85;

  // Bubbles: spawn count based on profile
  const bubbleCount = running || done ? profile.bubbles : 0;

  return (
    <svg viewBox="0 0 400 420" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="beakerGlass" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.15)" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={waterColor} stopOpacity="0.85" />
          <stop offset="1" stopColor={waterColor} stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="flameGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={element.flameColor ?? "#f59e0b"} stopOpacity="1" />
          <stop offset="60%" stopColor={element.flameColor ?? "#f59e0b"} stopOpacity="0.6" />
          <stop offset="100%" stopColor={element.flameColor ?? "#f59e0b"} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Lab bench shadow */}
      <ellipse cx="200" cy="395" rx="160" ry="8" fill="rgba(0,0,0,0.35)" />

      {/* Heat coil (if hot water) */}
      {hotWater && (
        <g>
          {[...Array(5)].map((_, i) => (
            <path key={i} d={`M${120 + i * 40} 395 Q ${130 + i * 40} 410, ${140 + i * 40} 395`}
              stroke="#f97316" strokeWidth="3" fill="none" opacity="0.9">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
            </path>
          ))}
        </g>
      )}

      {/* Beaker */}
      <path d="M90 80 L90 380 Q 90 395, 105 395 L295 395 Q 310 395, 310 380 L310 80"
        fill="url(#beakerGlass)" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      {/* Spout */}
      <path d="M85 90 L75 75 L95 85 Z" fill="rgba(255,255,255,0.2)" />

      {/* Water */}
      <path d="M95 170 L305 170 L305 380 Q 305 392, 293 392 L107 392 Q 95 392, 95 380 Z"
        fill="url(#waterGrad)" />

      {/* Water surface wave */}
      <path d={`M95 170 Q 150 ${168 - profile.ripple * 2} 200 170 T 305 170`}
        stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />

      {/* Tick marks */}
      {[200, 250, 300, 350].map((y, i) => (
        <g key={i}>
          <line x1="100" y1={y} x2="115" y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <text x="120" y={y + 3} fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="ui-monospace,monospace">
            {(400 - y) * 2}mL
          </text>
        </g>
      ))}

      {/* Bubbles rising from reaction */}
      {[...Array(bubbleCount)].map((_, i) => {
        const cx = 110 + ((i * 37) % 180);
        const dur = 1.2 + ((i * 0.13) % 2);
        const delay = -(i * 0.1) % 3;
        const r = 2 + ((i * 7) % 4);
        return (
          <circle key={i} cx={cx} cy="380" r={r} fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.5)">
            <animate attributeName="cy" values="380;175" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.9;0" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
          </circle>
        );
      })}

      {/* Reactant chunk on surface */}
      {(running || (!done && !running)) && effectiveReactivity !== "na" && (
        <g style={{ transition: "transform 0.1s linear" }}
          transform={`translate(${dartX - 200}, ${sinkY - 180})`}>
          {element.state === "Gas" ? (
            // gas: small cloud descending into water
            <g opacity={running ? 0.9 : 0.6}>
              <circle cx="200" cy="180" r="14" fill={element.color} opacity="0.6" />
              <circle cx="210" cy="172" r="10" fill={element.color} opacity="0.5" />
              <circle cx="190" cy="175" r="9" fill={element.color} opacity="0.5" />
            </g>
          ) : element.symbol === "Ca" ? (
            <rect x="190" y="175" width="20" height="14" rx="2" fill={element.color} stroke="#475569" />
          ) : (
            // shiny metal ball (melted alkali) or ribbon piece
            <g>
              <circle cx="200" cy="178" r="11" fill={element.color} stroke="#475569" strokeWidth="0.5" />
              <circle cx="196" cy="174" r="3" fill="white" opacity="0.7" />
            </g>
          )}
        </g>
      )}

      {/* Flame above reactant */}
      {profile.flame > 0 && running && progress > 0.15 && (
        <g transform={`translate(${dartX - 200}, ${sinkY - 180})`}>
          <ellipse cx="200" cy="155" rx={18 + profile.flame * 6} ry={28 + profile.flame * 10} fill="url(#flameGrad)">
            <animate attributeName="ry" values={`${28 + profile.flame * 10};${36 + profile.flame * 10};${28 + profile.flame * 10}`}
              dur="0.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;1;0.7" dur="0.3s" repeatCount="indefinite" />
          </ellipse>
          <circle cx="200" cy="150" r="6" fill="white" opacity="0.9">
            <animate attributeName="r" values="6;9;6" dur="0.25s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Smoke for hot reactions */}
      {(effectiveReactivity === "violent" || effectiveReactivity === "explosive") && running && progress > 0.3 && (
        <g>
          {[...Array(6)].map((_, i) => (
            <circle key={i} cx={170 + i * 12} cy="120" r={6 + (i % 3) * 2} fill="rgba(120,120,120,0.5)">
              <animate attributeName="cy" values="120;40;120" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}

      {/* Explosion flash */}
      {showExplosion && (
        <g>
          <circle cx={dartX} cy={sinkY - 5} r="60" fill={element.flameColor ?? "#facc15"} opacity="0.4">
            <animate attributeName="r" values="20;80;20" dur="0.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.1;0.8" dur="0.5s" repeatCount="indefinite" />
          </circle>
          {[...Array(10)].map((_, i) => {
            const ang = (i / 10) * Math.PI * 2;
            const ex = dartX + Math.cos(ang) * 55;
            const ey = sinkY - 5 + Math.sin(ang) * 55;
            return (
              <line key={i} x1={dartX} y1={sinkY - 5} x2={ex} y2={ey}
                stroke={element.flameColor ?? "#facc15"} strokeWidth="2" opacity="0.8">
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="0.4s" repeatCount="indefinite" />
              </line>
            );
          })}
          <text x={dartX} y={sinkY - 70} textAnchor="middle" fontSize="22" fontWeight="bold"
            fill={element.flameColor ?? "#facc15"}>
            {effectiveReactivity === "explosive" ? "💥 BOOM!" : "💥 POP!"}
          </text>
        </g>
      )}

      {/* Surface ripples */}
      {profile.ripple > 0 && (running || done) && (
        <g>
          {[...Array(profile.ripple)].map((_, i) => (
            <ellipse key={i} cx={dartX} cy="170" rx={20 + i * 15} ry={3 + i}
              fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" opacity={0.6 - i * 0.1}>
              <animate attributeName="rx" values={`${20 + i * 15};${50 + i * 25};${20 + i * 15}`}
                dur={`${1 + i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur={`${1 + i * 0.3}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
        </g>
      )}

      {/* Inert prompt */}
      {effectiveReactivity === "na" && (
        <g>
          <text x="200" y="270" textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.85)" fontWeight="bold">
            ⚛️ নিষ্ক্রিয় গ্যাস
          </text>
          <text x="200" y="290" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.6)">
            পানির সাথে কোনো বিক্রিয়া নেই
          </text>
        </g>
      )}

      {/* Cold-water Mg hint */}
      {element.needsHeat && !hotWater && (
        <g>
          <text x="200" y="270" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.85)" fontWeight="bold">
            ❄️ ঠান্ডা পানিতে বিক্রিয়া নেই
          </text>
          <text x="200" y="288" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.6)">
            উপরে "Heat Water" সুইচ চালু করুন
          </text>
        </g>
      )}

      {/* Label */}
      <text x="200" y="412" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.5)" fontFamily="ui-monospace,monospace">
        Beaker · H₂O (l)
      </text>
    </svg>
  );
}

// hex blend helper
function blendHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}
