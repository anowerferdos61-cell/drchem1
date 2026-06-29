/**
 * CH 4 — পর্যায় সারণির পটভূমি ও ত্রুটি অনুসন্ধানকারী
 * Interactive Periodic Table Anomalies & Debate Simulator
 *
 * Tab 1: The Hydrogen Debate — drag-and-drop H into Group 1 or Group 17.
 * Tab 2: Lanthanide & Actinide animated extraction from the main table.
 */
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Atom,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Gavel,
  RotateCcw,
  Zap,
} from "lucide-react";

type DropTarget = "group1" | "group17" | null;

interface PropItem {
  bn: string;
  en: string;
}

const G1_PROS: PropItem[] = [
  { bn: "যোজ্যতা ইলেকট্রন ১টি (1s¹)", en: "1 valence electron (1s¹)" },
  { bn: "ধনাত্মক আয়ন গঠন করে: H⁺", en: "Forms positive ions: H⁺" },
  { bn: "অধাতুর সাথে যৌগ গঠন করে (HCl, H₂O)", en: "Combines with non-metals (HCl, H₂O)" },
  { bn: "+১ যোজনী প্রদর্শন করে", en: "Shows +1 valency" },
];

const G1_WARN: PropItem = {
  bn: "কিন্তু হাইড্রোজেন একটি অধাতু ও গ্যাস — Group 1-এর চকচকে কঠিন ধাতুর মতো নয়!",
  en: "But Hydrogen is a non-metal gas — unlike Group 1's shiny solid metals!",
};

const G17_PROS: PropItem[] = [
  { bn: "শেল পূর্ণ করতে ১টি ইলেকট্রন প্রয়োজন", en: "Needs 1 electron to complete its shell" },
  { bn: "দ্বি-পরমাণুক অণু গঠন করে: H₂", en: "Forms a diatomic molecule: H₂" },
  { bn: "সমযোজী যৌগ গঠন করে (HCl, CH₄)", en: "Forms covalent compounds (HCl, CH₄)" },
  { bn: "ঋণাত্মক আয়ন গঠন করতে পারে: H⁻ (হাইড্রাইড)", en: "Can form a negative ion: H⁻ (hydride)" },
];

const G17_WARN: PropItem = {
  bn: "কিন্তু হ্যালোজেনের যোজ্যতা ইলেকট্রন ৭টি, হাইড্রোজেনের মাত্র ১টি!",
  en: "But Halogens have 7 valence electrons; Hydrogen has only 1!",
};

// ──────────────────────────────────────────────────────────────
// Tab 1: Hydrogen Debate
// ──────────────────────────────────────────────────────────────
function HydrogenDebate() {
  const [dropped, setDropped] = useState<DropTarget>(null);
  const [showJudgment, setShowJudgment] = useState(false);
  const [hoverTarget, setHoverTarget] = useState<DropTarget>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", "H");
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (target: Exclude<DropTarget, null>) => {
    setDropped(target);
    setHoverTarget(null);
  };

  // Touch support — tap a group to "drop" H there
  const tapDrop = (target: Exclude<DropTarget, null>) => handleDrop(target);

  const reset = () => {
    setDropped(null);
    setShowJudgment(false);
  };

  return (
    <div className="space-y-4">
      {/* Arena */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Group 1 */}
        <DropZone
          accent="from-blue-500/15 to-sky-500/10 border-blue-500/30"
          activeAccent="from-blue-500/30 to-sky-500/20 border-blue-500 ring-2 ring-blue-400"
          titleBn="Group 1 — ক্ষার ধাতু"
          titleEn="Alkali Metals"
          icon="🔋"
          color="text-blue-700 dark:text-blue-300"
          isActive={hoverTarget === "group1"}
          isFilled={dropped === "group1"}
          onDragOver={(e) => {
            e.preventDefault();
            setHoverTarget("group1");
          }}
          onDragLeave={() => setHoverTarget(null)}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop("group1");
          }}
          onTap={() => tapDrop("group1")}
          examples={["Li", "Na", "K", "Rb", "Cs"]}
        />

        {/* Center: H atom */}
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          {dropped === null ? (
            <div
              ref={dragRef}
              draggable
              onDragStart={onDragStart}
              className="group cursor-grab active:cursor-grabbing select-none touch-none"
              role="button"
              tabIndex={0}
              aria-label="Hydrogen atom — drag to a group"
            >
              <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 shadow-2xl shadow-orange-500/40 grid place-items-center transition-transform group-hover:scale-105 animate-pulse">
                <div className="absolute inset-2 rounded-full border-2 border-white/30" />
                <div className="text-center text-white drop-shadow">
                  <div className="text-4xl md:text-5xl font-black leading-none">H</div>
                  <div className="text-[10px] md:text-xs font-bold opacity-90">1 · Hydrogen</div>
                </div>
              </div>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                ⇆ টেনে আনুন / Drag me
                <br />
                <span className="text-[10px]">(মোবাইলে ট্যাপ করুন)</span>
              </div>
            </div>
          ) : (
            <Card className="p-4 w-full max-w-xs text-center bg-gradient-to-br from-muted/50 to-background">
              <Badge variant="secondary" className="mb-2">
                {dropped === "group1" ? "Group 1-এ রাখা হলো" : "Group 17-এ রাখা হলো"}
              </Badge>
              <div className="text-3xl">{dropped === "group1" ? "🔋" : "🧪"}</div>
              <Button size="sm" variant="outline" onClick={reset} className="mt-3 gap-1">
                <RotateCcw className="h-3.5 w-3.5" /> পুনরায় চেষ্টা
              </Button>
            </Card>
          )}
        </div>

        {/* Group 17 */}
        <DropZone
          accent="from-emerald-500/15 to-teal-500/10 border-emerald-500/30"
          activeAccent="from-emerald-500/30 to-teal-500/20 border-emerald-500 ring-2 ring-emerald-400"
          titleBn="Group 17 — হ্যালোজেন"
          titleEn="Halogens"
          icon="🧪"
          color="text-emerald-700 dark:text-emerald-300"
          isActive={hoverTarget === "group17"}
          isFilled={dropped === "group17"}
          onDragOver={(e) => {
            e.preventDefault();
            setHoverTarget("group17");
          }}
          onDragLeave={() => setHoverTarget(null)}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop("group17");
          }}
          onTap={() => tapDrop("group17")}
          examples={["F", "Cl", "Br", "I", "At"]}
        />
      </div>

      {/* Outcome card */}
      {dropped && (
        <Card
          className={`p-5 border-2 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            dropped === "group1"
              ? "border-blue-500/40 bg-gradient-to-br from-blue-500/5 to-sky-500/5"
              : "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2
              className={`h-5 w-5 ${dropped === "group1" ? "text-blue-600" : "text-emerald-600"}`}
            />
            <h3 className="font-bold text-base md:text-lg">
              {dropped === "group1"
                ? "Group 1 (ক্ষার ধাতু)-এর সাথে মিল"
                : "Group 17 (হ্যালোজেন)-এর সাথে মিল"}
            </h3>
          </div>
          <ul className="space-y-2 mb-4">
            {(dropped === "group1" ? G1_PROS : G17_PROS).map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Sparkles
                  className={`h-4 w-4 mt-0.5 shrink-0 ${dropped === "group1" ? "text-blue-500" : "text-emerald-500"}`}
                />
                <div>
                  <div className="font-medium">{p.bn}</div>
                  <div className="text-xs text-muted-foreground">{p.en}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="rounded-lg border-2 border-amber-500/40 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  সতর্কতা / Anomaly
                </div>
                <div className="mt-1 text-sm font-medium">
                  {(dropped === "group1" ? G1_WARN : G17_WARN).bn}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(dropped === "group1" ? G1_WARN : G17_WARN).en}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowJudgment(true)}
            className="mt-4 w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white gap-2"
          >
            <Gavel className="h-4 w-4" /> Final Judgment · চূড়ান্ত সিদ্ধান্ত
          </Button>
        </Card>
      )}

      {showJudgment && (
        <Card className="p-5 border-2 border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-500/5 via-pink-500/5 to-purple-500/5 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-2">
            <Gavel className="h-5 w-5 text-fuchsia-600" />
            <h3 className="font-bold text-base md:text-lg">চূড়ান্ত সিদ্ধান্ত — Mendeleev ও আধুনিক রসায়ন</h3>
          </div>
          <p className="text-sm leading-relaxed">
            যদিও হাইড্রোজেনের ধর্ম <span className="font-semibold text-emerald-700 dark:text-emerald-400">হ্যালোজেন</span>{" "}
            ও <span className="font-semibold text-blue-700 dark:text-blue-400">ক্ষার ধাতু</span> — দুই গ্রুপের
            সাথেই কিছু মিল রাখে, তবুও Mendeleev এবং আধুনিক পর্যায় সারণিতে একে{" "}
            <Badge className="mx-1 bg-blue-600">Group 1</Badge>-এ রাখা হয়েছে, কারণ এর ইলেকট্রন বিন্যাস{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-xs">1s¹</code> — ঠিক যেমন Li (2,1) বা Na (2,8,1)-এর
            সর্বশেষ শেলে ১টি ইলেকট্রন থাকে। তাই <span className="font-bold">ইলেকট্রন বিন্যাসের ভিত্তিতে</span> এটি
            Group 1-এ স্থান পেয়েছে, যদিও ভৌত ধর্মে অসামঞ্জস্য রয়েছে।
          </p>
          <p className="mt-2 text-xs text-muted-foreground italic">
            Despite the anomalies, modern chemistry places H in Group 1 primarily based on its electron configuration
            (1s¹), matching the valence pattern of the alkali metals.
          </p>
        </Card>
      )}
    </div>
  );
}

function DropZone({
  accent,
  activeAccent,
  titleBn,
  titleEn,
  icon,
  color,
  isActive,
  isFilled,
  onDragOver,
  onDragLeave,
  onDrop,
  onTap,
  examples,
}: {
  accent: string;
  activeAccent: string;
  titleBn: string;
  titleEn: string;
  icon: string;
  color: string;
  isActive: boolean;
  isFilled: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onTap: () => void;
  examples: string[];
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-br p-4 md:p-5 min-h-[180px] md:min-h-[220px] text-left transition-all ${
        isActive ? activeAccent : accent
      } ${isFilled ? "ring-2 ring-offset-2 ring-offset-background" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-3xl md:text-4xl">{icon}</div>
        {isFilled && (
          <Badge className="bg-foreground/80 text-background text-[10px]">H রাখা হয়েছে</Badge>
        )}
      </div>
      <div className={`mt-2 text-base md:text-lg font-extrabold ${color}`}>{titleBn}</div>
      <div className="text-xs text-muted-foreground">{titleEn}</div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {examples.map((e) => (
          <Badge key={e} variant="outline" className="font-mono text-xs bg-background/60">
            {e}
          </Badge>
        ))}
      </div>
      <div className="absolute bottom-2 right-3 text-[10px] text-muted-foreground opacity-70">
        এখানে ফেলুন / Drop here
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Tab 2: Lanthanide & Actinide Separation
// ──────────────────────────────────────────────────────────────
const LANTHANIDES = [
  ["57", "La"], ["58", "Ce"], ["59", "Pr"], ["60", "Nd"], ["61", "Pm"],
  ["62", "Sm"], ["63", "Eu"], ["64", "Gd"], ["65", "Tb"], ["66", "Dy"],
  ["67", "Ho"], ["68", "Er"], ["69", "Tm"], ["70", "Yb"], ["71", "Lu"],
];

const ACTINIDES = [
  ["89", "Ac"], ["90", "Th"], ["91", "Pa"], ["92", "U"], ["93", "Np"],
  ["94", "Pu"], ["95", "Am"], ["96", "Cm"], ["97", "Bk"], ["98", "Cf"],
  ["99", "Es"], ["100", "Fm"], ["101", "Md"], ["102", "No"], ["103", "Lr"],
];

function LanthanideActinide() {
  const [extracted, setExtracted] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold">পর্যায় ৬ ও ৭ — La (৫৭) এবং Ac (৮৯)</h3>
          <p className="text-xs text-muted-foreground">
            ৩০টি অভ্যন্তরীণ রূপান্তর ধাতু সারণির বাইরে কেন রাখা হয়?
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setExtracted(true)}
            disabled={extracted}
            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white gap-2"
          >
            <Zap className="h-4 w-4" /> Extract · সারণি থেকে বের করুন
          </Button>
          <Button variant="outline" onClick={() => setExtracted(false)} disabled={!extracted} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Mini periodic table representation */}
      <Card className="p-3 md:p-4 overflow-x-auto">
        <div className="min-w-[640px]">
          <MiniPeriodicTable extracted={extracted} />
        </div>
      </Card>

      {/* Extracted rows */}
      <div className="space-y-3">
        <ExtractedRow
          label="ল্যান্থানাইড সারি · Lanthanide Series (৫৭–৭১)"
          items={LANTHANIDES}
          accent="from-pink-500/20 to-rose-500/20 border-pink-500/40"
          color="text-pink-700 dark:text-pink-300"
          visible={extracted}
          delay={0}
        />
        <ExtractedRow
          label="অ্যাক্টিনাইড সারি · Actinide Series (৮৯–১০৩)"
          items={ACTINIDES}
          accent="from-amber-500/20 to-orange-500/20 border-amber-500/40"
          color="text-amber-700 dark:text-amber-300"
          visible={extracted}
          delay={300}
        />
      </div>

      {extracted && (
        <Card className="p-5 border-2 border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-500/5 to-pink-500/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-fuchsia-600" />
            <h3 className="font-bold text-base md:text-lg">কেন আলাদা রাখা হয়?</h3>
          </div>
          <p className="text-sm leading-relaxed">
            এই <span className="font-bold">৩০টি মৌল</span> (১৫টি ল্যান্থানাইড + ১৫টি অ্যাক্টিনাইড)-এর সর্বশেষ
            ইলেকট্রন <code className="px-1.5 py-0.5 rounded bg-muted text-xs">4f</code> বা{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-xs">5f</code> উপশক্তিস্তরে প্রবেশ করে, তাই
            এদের ধর্ম প্রায় একই রকম। যদি এই ৩০টি মৌল মূল সারণির ভেতরেই রাখা হতো, তবে সারণিটি অস্বাভাবিকভাবে চওড়া
            হয়ে যেত এবং এর <span className="font-semibold">সিমেট্রি ও সৌন্দর্য নষ্ট হয়ে যেত</span>। তাই এদেরকে
            সুন্দরভাবে সারণির নিচে আলাদা দুটি সারিতে স্থান দেওয়া হয়েছে।
          </p>
          <p className="mt-2 text-xs text-muted-foreground italic">
            If these 30 elements were kept inside the main table, the symmetry and aesthetic structure of the
            Periodic Table would be ruined. Hence, they are placed beautifully at the bottom.
          </p>
        </Card>
      )}
    </div>
  );
}

function MiniPeriodicTable({ extracted }: { extracted: boolean }) {
  // 7 rows x 18 cols schematic. We mark a couple of cells for La/Ac.
  // Simplified: render a 7×18 grid using CSS, highlight P6G3 & P7G3.
  return (
    <div className="grid grid-cols-18 gap-0.5" style={{ gridTemplateColumns: "repeat(18, minmax(0,1fr))" }}>
      {Array.from({ length: 7 * 18 }).map((_, idx) => {
        const row = Math.floor(idx / 18) + 1;
        const col = (idx % 18) + 1;
        const isLa = row === 6 && col === 3;
        const isAc = row === 7 && col === 3;
        const isEmpty =
          (row === 1 && col > 1 && col < 18) ||
          ((row === 2 || row === 3) && col > 2 && col < 13);
        if (isEmpty) return <div key={idx} className="aspect-square" />;
        const base =
          "aspect-square rounded-[2px] text-[7px] md:text-[9px] grid place-items-center font-mono transition-all";
        if (isLa) {
          return (
            <div
              key={idx}
              className={`${base} bg-pink-500 text-white font-bold relative ${
                extracted ? "animate-pulse ring-2 ring-pink-300" : ""
              }`}
              title="Lanthanum (La) — extracts elements 57–71"
            >
              La
              {extracted && <ChevronDown className="absolute -bottom-3 h-3 w-3 text-pink-500 animate-bounce" />}
            </div>
          );
        }
        if (isAc) {
          return (
            <div
              key={idx}
              className={`${base} bg-amber-500 text-white font-bold relative ${
                extracted ? "animate-pulse ring-2 ring-amber-300" : ""
              }`}
              title="Actinium (Ac) — extracts elements 89–103"
            >
              Ac
              {extracted && <ChevronDown className="absolute -bottom-3 h-3 w-3 text-amber-500 animate-bounce" />}
            </div>
          );
        }
        return <div key={idx} className={`${base} bg-muted/50 text-muted-foreground`} />;
      })}
    </div>
  );
}

function ExtractedRow({
  label,
  items,
  accent,
  color,
  visible,
  delay,
}: {
  label: string;
  items: string[][];
  accent: string;
  color: string;
  visible: boolean;
  delay: number;
}) {
  return (
    <div
      className={`rounded-xl border-2 bg-gradient-to-r p-3 transition-all duration-700 ${accent} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      <div className={`text-xs md:text-sm font-bold mb-2 ${color}`}>{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(([z, sym], i) => (
          <div
            key={sym}
            className="rounded-md bg-background/80 border px-2 py-1 text-center min-w-[44px] transition-all"
            style={{
              transitionDelay: visible ? `${delay + i * 40}ms` : "0ms",
              transform: visible ? "scale(1)" : "scale(0.5)",
              opacity: visible ? 1 : 0,
            }}
          >
            <div className="text-[9px] text-muted-foreground leading-none">{z}</div>
            <div className="text-xs md:text-sm font-bold leading-tight">{sym}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main shell
// ──────────────────────────────────────────────────────────────
export default function PeriodicAnomaliesLab({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"hydrogen" | "lanthanide">("hydrogen");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-500/20">
              <Atom className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm md:text-base font-extrabold tracking-tight truncate">
                পর্যায় সারণির পটভূমি ও ত্রুটি অনুসন্ধানকারী
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground">
                Periodic Table Anomalies & Debate · CH 4
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
            <TabsTrigger value="hydrogen" className="gap-2 text-xs md:text-sm">
              🔬 হাইড্রোজেনের অবস্থান বিতর্ক
            </TabsTrigger>
            <TabsTrigger value="lanthanide" className="gap-2 text-xs md:text-sm">
              ✨ ল্যান্থানাইড ও অ্যাক্টিনাইড সারি
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hydrogen" className="mt-4">
            <HydrogenDebate />
          </TabsContent>
          <TabsContent value="lanthanide" className="mt-4">
            <LanthanideActinide />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
