/**
 * Diffusion Race Lab — Graham's Law (NH₃ vs HCl) + KMnO₄ in water.
 * Chapter 2 · পদার্থের অবস্থা · ব্যাপন পরীক্ষা।
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  FlaskConical,
  Droplets,
  Sparkles,
  Wind,
  BookOpen,
  Sliders,
  BarChart3,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

type CottonId = "nh3" | "hcl";
type Slot = "left" | "right" | null;

// Graham's law: v(NH3)/v(HCl) = sqrt(36.5/17) ≈ 1.466
const V_NH3 = 1.466;
const V_HCL = 1.0;
const MEET_PCT = (100 * V_HCL) / (V_NH3 + V_HCL); // distance NH3 travels ≈ 40.55 from left
// Actually meeting from left = V_NH3 / (V_NH3 + V_HCL) ≈ 0.594 → 59.4% from left
const MEET_FROM_LEFT = (V_NH3 / (V_NH3 + V_HCL)) * 100;

const STEPS_BN = [
  "১. NH₃ তুলোটি নলের বাম মুখে বসান (ক্লিক বা ড্র্যাগ)।",
  "২. HCl তুলোটি নলের ডান মুখে বসান (ক্লিক বা ড্র্যাগ)।",
  "৩. 'পরীক্ষা শুরু' চাপুন — গ্যাস দুটি ব্যাপন শুরু করবে।",
  "৪. লক্ষ্য করুন কোথায় সাদা ধোঁয়ার রিং (NH₄Cl) তৈরি হয়।",
];

export default function DiffusionLab({ onBack }: { onBack: () => void }) {
  const [showTheory, setShowTheory] = useState(false);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-slate-100 select-none">
      {/* ── Compact Header (46px) ── */}
      <header className="z-20 h-11 shrink-0 border-b border-slate-800/80 bg-slate-950/90 px-3 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-1 h-8 shrink-0 gap-1 px-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden text-xs font-semibold sm:inline">Back</span>
            </Button>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Wind className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-xs font-black tracking-tight sm:text-sm text-slate-100">
                Diffusion Race · ব্যাপন প্রতিযোগিতা
              </div>
              <div className="hidden truncate text-[10px] text-cyan-400/80 sm:block font-mono">
                Graham's Law: r₁/r₂ = √(M₂/M₁)
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTheory(true)}
              className="h-7 gap-1 border-cyan-500/30 bg-cyan-500/10 px-2 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20"
            >
              <BookOpen className="h-3 w-3" />
              <span>অধ্যায় ২ থিওরি</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Tab View (100dvh viewport locked) ── */}
      <main className="flex flex-1 flex-col min-h-0 overflow-hidden p-2">
        <Tabs defaultValue="gas" className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <div className="shrink-0 flex justify-center pb-2">
            <TabsList className="grid w-full max-w-xs grid-cols-2 bg-slate-900 border border-slate-800 h-8">
              <TabsTrigger
                value="gas"
                className="gap-1.5 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              >
                <Wind className="h-3.5 w-3.5" /> গ্যাস ব্যাপন
              </TabsTrigger>
              <TabsTrigger
                value="liquid"
                className="gap-1.5 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              >
                <Droplets className="h-3.5 w-3.5" /> তরল ব্যাপন
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="gas" className="flex-1 min-h-0 overflow-hidden m-0">
            <GasDiffusion />
          </TabsContent>
          <TabsContent value="liquid" className="flex-1 min-h-0 overflow-hidden m-0">
            <LiquidDiffusion />
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Chapter 2 Theory Drawer ── */}
      <Drawer open={showTheory} onOpenChange={setShowTheory}>
        <DrawerContent className="max-h-[85dvh] bg-slate-900 text-slate-100 border-slate-800">
          <DrawerHeader className="pb-2 border-b border-slate-800">
            <DrawerTitle className="text-base font-bold flex items-center gap-2 text-cyan-400">
              <BookOpen className="h-4 w-4" /> অধ্যায় ২: পদার্থের অবস্থা ও গ্রাহামের ব্যাপন সূত্র
            </DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 py-4 max-h-[70dvh]">
            <div className="prose prose-invert prose-sm max-w-none space-y-4 text-slate-300">
              <div>
                <h4 className="text-cyan-400 font-bold mb-1">
                  ১. গ্রাহামের ব্যাপন সূত্র (Graham's Law)
                </h4>
                <p className="text-xs text-slate-400">
                  নির্দিষ্ট তাপমাত্রা ও চাপে কোনো গ্যাসের ব্যাপনের হার (r) তার আণবিক ভর (M) বা
                  ঘনত্বের (d) বর্গমূলের ব্যস্তানুপাতিক:
                </p>
                <p className="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-cyan-300 text-xs my-2">
                  r₁ / r₂ = √(M₂ / M₁)
                </p>
                <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300">
                  <li>অ্যামোনিয়া (NH₃) এর আণবিক ভর M₁ = ১৭ g/mol</li>
                  <li>হাইড্রোক্লোরিক এসিড (HCl) এর আণবিক ভর M₂ = ৩৬.৫ g/mol</li>
                  <li>গতিবেগের অনুপাত = √(৩৬.৫ / ১৭) ≈ ১.৪৬৬ গুণ</li>
                </ul>
                <p className="text-xs mt-1 text-slate-400">
                  যেহেতু NH₃ হালকা, তাই এটি একই সময়ে বেশি দূরত্ব অতিক্রম করে এবং ভারী HCl-এর তুলোর
                  মুখের কাছাকাছি এসে মিলিত হয়ে ঘন সাদা ধোঁয়ার বলয় (NH₄Cl) তৈরি করে।
                </p>
              </div>

              <div>
                <h4 className="text-cyan-400 font-bold mb-1">
                  ২. রাসায়নিক বিক্রিয়া (Chemical Equation)
                </h4>
                <p className="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-cyan-300 text-xs my-2">
                  NH₃ (g) + HCl (g) → NH₄Cl (s) [কঠিন সাদা ধোঁয়া]
                </p>
              </div>

              <div>
                <h4 className="text-cyan-400 font-bold mb-1">
                  ৩. ব্যাপনে তাপমাত্রার প্রভাব (Effect of Temperature)
                </h4>
                <p className="text-xs text-slate-400">
                  তাপমাত্রা বৃদ্ধি করলে কণার গতিশক্তি ($E_k = \frac{3}
                  {2}kT$) বৃদ্ধি পায়। ফলে তরলে বা গ্যাসে কণাগুলো দ্রুত গতিতে চতুর্দিকে ছড়িয়ে
                  পড়ে। গরম পানিতে KMnO₄-এর ব্যাপন ঠান্ডা পানির চেয়ে প্রায় ৩ গুণ দ্রুত ঘটে।
                </p>
              </div>
            </div>
          </ScrollArea>
          <DrawerClose asChild>
            <Button
              variant="outline"
              size="sm"
              className="mx-4 mb-3 border-slate-700 bg-slate-800 text-slate-200"
            >
              বন্ধ করুন
            </Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// GAS DIFFUSION (NH3 vs HCl tube race)
// ───────────────────────────────────────────────────────────────
function GasDiffusion() {
  const isMobile = useIsMobile();
  const [placed, setPlaced] = useState<Record<CottonId, Slot>>({ nh3: null, hcl: null });
  const [dragging, setDragging] = useState<CottonId | null>(null);
  const [hoverSlot, setHoverSlot] = useState<Slot>(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 of meeting time
  const [mobileTab, setMobileTab] = useState<"controls" | "info" | "guide">("controls");
  const tubeRef = useRef<HTMLDivElement | null>(null);

  const ready = placed.nh3 === "left" && placed.hcl === "right";

  const onDragStart = (id: CottonId) => (e: React.DragEvent) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handlePlaceCotton = (id: CottonId) => {
    if (running) return;
    const slot = id === "nh3" ? "left" : "right";
    setPlaced((p) => ({ ...p, [id]: slot }));
    toast.success(
      id === "nh3" ? "নলের বাম মুখে NH₃ তুলো রাখা হয়েছে" : "নলের ডান মুখে HCl তুলো রাখা হয়েছে",
    );
  };

  const onDrop = (slot: Exclude<Slot, null>) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragging || running) return;
    const expected: CottonId = slot === "left" ? "nh3" : "hcl";
    if (dragging !== expected) {
      toast.error(slot === "left" ? "বাম মুখে NH₃ রাখুন" : "ডান মুখে HCl রাখুন");
      setDragging(null);
      setHoverSlot(null);
      return;
    }
    setPlaced((p) => ({ ...p, [dragging]: slot }));
    setDragging(null);
    setHoverSlot(null);
  };

  const start = () => {
    if (!ready) {
      toast.warning("দুটো মুখে তুলো বসান আগে");
      return;
    }
    setRunning(true);
    setFinished(false);
    setProgress(0);
  };

  const reset = () => {
    setRunning(false);
    setFinished(false);
    setProgress(0);
    setPlaced({ nh3: null, hcl: null });
  };

  // Animation loop
  useEffect(() => {
    if (!running) return;
    const DURATION = 6000; // ms to meeting
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setRunning(false);
        setFinished(true);
        toast.success("সাদা ধোঁয়ার রিং তৈরি হয়েছে! (NH₄Cl)", { duration: 4000 });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // Front of NH3 wave position (% from left)
  const nh3Front = progress * MEET_FROM_LEFT;
  // Front of HCl wave position (% from left)
  const hclFront = 100 - progress * (100 - MEET_FROM_LEFT);

  // The glass tube element
  const TubeVisual = (
    <div className="w-full flex flex-col items-center justify-center p-2">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400">
          তুলো যোগ করো (ক্লিক বা ড্র্যাগ):
        </span>
        <CottonChip
          id="nh3"
          label="অ্যামোনিয়া (NH₃)"
          sub="M = 17"
          color="from-emerald-400 to-emerald-600"
          placed={!!placed.nh3}
          onDragStart={onDragStart("nh3")}
          onClick={() => handlePlaceCotton("nh3")}
        />
        <CottonChip
          id="hcl"
          label="HCl এসিড"
          sub="M = 36.5"
          color="from-amber-400 to-orange-500"
          placed={!!placed.hcl}
          onDragStart={onDragStart("hcl")}
          onClick={() => handlePlaceCotton("hcl")}
        />
      </div>

      <div ref={tubeRef} className="relative mx-auto my-6 h-36 w-full max-w-2xl px-12">
        {/* Glass tube body */}
        <div className="absolute inset-x-12 top-1/2 h-20 -translate-y-1/2 rounded-full border-2 border-slate-600/70 bg-gradient-to-b from-slate-800/60 via-slate-900/40 to-slate-800/60 shadow-[inset_0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          {/* Inside: gas waves */}
          <div className="relative h-full w-full overflow-hidden rounded-full">
            {/* NH3 wave (left → right, emerald) */}
            {(running || finished) && (
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400/70 via-emerald-300/40 to-transparent"
                style={{ width: `${nh3Front}%` }}
              />
            )}
            {/* HCl wave (right → left, amber) */}
            {(running || finished) && (
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-amber-400/70 via-amber-300/40 to-transparent"
                style={{ width: `${100 - hclFront}%` }}
              />
            )}
            {/* Smoke ring at meeting point */}
            {finished && (
              <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${MEET_FROM_LEFT}%` }}
              >
                <div className="relative">
                  <div className="h-16 w-16 animate-ping rounded-full bg-white/80 blur-sm" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="h-12 w-12 rounded-full border-4 border-white bg-white/95 shadow-[0_0_30px_rgba(255,255,255,0.9)]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Left snap zone */}
        <DropZone
          side="left"
          active={!placed.nh3 && !running}
          highlight={hoverSlot === "left"}
          placed={placed.nh3 === "left"}
          label="NH₃"
          tone="emerald"
          onDragEnter={() => setHoverSlot("left")}
          onDragLeave={() => setHoverSlot(null)}
          onDrop={onDrop("left")}
          onClick={() => handlePlaceCotton("nh3")}
        />
        {/* Right snap zone */}
        <DropZone
          side="right"
          active={!placed.hcl && !running}
          highlight={hoverSlot === "right"}
          placed={placed.hcl === "right"}
          label="HCl"
          tone="amber"
          onDragEnter={() => setHoverSlot("right")}
          onDragLeave={() => setHoverSlot(null)}
          onDrop={onDrop("right")}
          onClick={() => handlePlaceCotton("hcl")}
        />

        {/* Distance marker after finish */}
        {finished && (
          <div
            className="absolute -bottom-3 -translate-x-1/2 text-[11px] font-bold text-cyan-300 bg-slate-900/90 px-2 py-0.5 rounded border border-cyan-500/40 shadow"
            style={{ left: `${MEET_FROM_LEFT}%` }}
          >
            ≈ {MEET_FROM_LEFT.toFixed(1)}% (বাম প্রান্ত থেকে)
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          size="sm"
          onClick={start}
          disabled={!ready || running}
          className="h-8 gap-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold hover:from-cyan-500 hover:to-teal-500"
        >
          <Play className="h-3.5 w-3.5" /> পরীক্ষা শুরু
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={reset}
          className="h-8 gap-1.5 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5" /> রিসেট
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* ── Desktop Layout (2 columns, 100dvh locked) ── */}
      {!isMobile ? (
        <div className="grid md:grid-cols-[1fr_320px] h-full min-h-0 gap-3 overflow-hidden p-1">
          <Card className="relative flex flex-col items-center justify-center border-slate-800 bg-slate-950/70 p-4 shadow-inner overflow-hidden">
            {TubeVisual}

            {finished && (
              <div className="mx-auto mt-4 max-w-xl rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <div className="font-bold text-emerald-300">সাদা ধোঁয়ার বলয় গঠিত হয়েছে!</div>
                    <p className="mt-0.5 leading-relaxed text-slate-300 text-[11px]">
                      অ্যামোনিয়ার ভর কম (১৭) হওয়ায় এটি দ্রুত ব্যাপিত হয়েছে এবং ভারী HCl-এর
                      (৩৬.৫) কাছাকাছি সাদা ধোঁয়া (NH₄Cl) তৈরি করেছে:
                      <span className="font-mono text-cyan-300 ml-1">
                        v(NH₃)/v(HCl) = √(36.5/17) ≈ 1.466
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Side panel */}
          <aside className="lab-scroll flex flex-col gap-3 overflow-y-auto pr-1">
            <Card className="border-slate-800 bg-slate-900/80 p-4 space-y-3">
              <div className="text-xs font-bold uppercase text-slate-300">পরীক্ষার ধাপসমূহ</div>
              <ul className="space-y-1.5">
                {STEPS_BN.map((s, i) => {
                  const done =
                    (i === 0 && !!placed.nh3) ||
                    (i === 1 && !!placed.hcl) ||
                    (i === 2 && (running || finished)) ||
                    (i === 3 && finished);
                  return (
                    <li
                      key={i}
                      className={`rounded-lg border px-2.5 py-2 text-xs leading-relaxed transition ${
                        done
                          ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300 font-medium"
                          : "border-slate-800 bg-slate-950/40 text-slate-400"
                      }`}
                    >
                      {s}
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                <FlaskConical className="h-4 w-4" /> গ্রাহামের সূত্র হিসাব
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                r₁ / r₂ = √(M₂ / M₁) = √(৩৬.৫ / ১৭) ≈ ১.৪৬৬ গুণ।
              </p>
              <div className="rounded border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] text-emerald-300">
                NH₃ অতিক্রান্ত দূরত্ব: ~৫৯.৪%
                <br />
                HCl অতিক্রান্ত দূরত্ব: ~৪০.৬%
              </div>
            </Card>
          </aside>
        </div>
      ) : (
        /* ── Mobile Split Screen (< md) ── */
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          {/* Top 46% Viewport */}
          <div className="relative h-[46dvh] shrink-0 border-b border-slate-800/80 bg-slate-950/70 p-2 flex flex-col items-center justify-center overflow-hidden">
            {TubeVisual}
          </div>

          {/* Bottom 54% Tabbed Tray */}
          <div className="flex flex-1 flex-col min-h-0 bg-slate-900/95 backdrop-blur">
            <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 p-1 text-[11px] font-semibold gap-1">
              <button
                type="button"
                onClick={() => setMobileTab("controls")}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md py-1.5 transition",
                  mobileTab === "controls"
                    ? "bg-slate-800 text-cyan-400 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                <Sliders className="h-3 w-3" />
                <span>কন্ট্রোলস</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab("info")}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md py-1.5 transition",
                  mobileTab === "info"
                    ? "bg-slate-800 text-cyan-400 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                <BarChart3 className="h-3 w-3" />
                <span>হিসাব ও ফলাফল</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab("guide")}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md py-1.5 transition",
                  mobileTab === "guide"
                    ? "bg-slate-800 text-cyan-400 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                <CheckSquare className="h-3 w-3" />
                <span>গাইড</span>
              </button>
            </div>

            <div className="lab-scroll flex-1 min-h-0 overflow-y-auto p-3">
              {mobileTab === "controls" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <div className="text-xs font-bold text-slate-200">
                      তুলো প্লেসমেন্ট (ট্যাপ করুন)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePlaceCotton("nh3")}
                        disabled={!!placed.nh3 || running}
                        className="h-9 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      >
                        {placed.nh3 ? "✓ NH₃ বসানো হয়েছে" : "+ NH₃ তুলো বসাও"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePlaceCotton("hcl")}
                        disabled={!!placed.hcl || running}
                        className="h-9 text-xs border-amber-500/30 bg-amber-500/10 text-amber-300"
                      >
                        {placed.hcl ? "✓ HCl বসানো হয়েছে" : "+ HCl তুলো বসাও"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={start}
                      disabled={!ready || running}
                      className="h-9 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                      <Play className="mr-1.5 h-4 w-4" /> পরীক্ষা শুরু
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={reset}
                      className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-300"
                    >
                      <RotateCcw className="mr-1.5 h-4 w-4" /> রিসেট
                    </Button>
                  </div>
                </div>
              )}

              {mobileTab === "info" && (
                <div className="space-y-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <div className="font-bold text-cyan-400">গ্রাহামের সূত্র হিসাব</div>
                    <div className="rounded border border-slate-800 bg-slate-900 p-2 font-mono text-emerald-300">
                      r(NH₃) / r(HCl) = √(36.5 / 17) ≈ 1.466
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      NH₃ গ্যাস হালকা হওয়ায় এর ব্যাপন হার বেশি, তাই সাদা রিং তৈরি হয় ডান
                      প্রান্তের (HCl) কাছাকাছি।
                    </p>
                  </div>

                  {finished && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-emerald-300">
                      <span className="font-bold">ফলাফল:</span> প্রায় ৫৯.৪% দূরত্বে NH₄Cl-এর সাদা
                      ধোঁয়া প্রত্যক্ষ করা গেছে।
                    </div>
                  )}
                </div>
              )}

              {mobileTab === "guide" && (
                <ul className="space-y-2 text-xs">
                  {STEPS_BN.map((s, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-slate-300"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CottonChip({
  id,
  label,
  sub,
  color,
  placed,
  onDragStart,
  onClick,
}: {
  id: CottonId;
  label: string;
  sub: string;
  color: string;
  placed: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onClick?: () => void;
}) {
  return (
    <div
      draggable={!placed}
      onDragStart={onDragStart}
      onClick={!placed ? onClick : undefined}
      data-id={id}
      className={`flex items-center gap-2 rounded-xl border-2 border-dashed px-3 py-1.5 transition ${
        placed
          ? "opacity-40"
          : "cursor-pointer active:scale-95 hover:border-cyan-400 bg-slate-900/60"
      }`}
    >
      <div
        className={`h-7 w-7 rounded-full bg-gradient-to-br ${color} shadow-md ring-2 ring-slate-800`}
      />
      <div className="leading-tight">
        <div className="text-xs font-bold text-slate-200">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function DropZone({
  side,
  active,
  highlight,
  placed,
  label,
  tone,
  onDragEnter,
  onDragLeave,
  onDrop,
  onClick,
}: {
  side: "left" | "right";
  active: boolean;
  highlight: boolean;
  placed: boolean;
  label: string;
  tone: "emerald" | "amber";
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick?: () => void;
}) {
  const sideClass = side === "left" ? "left-0" : "right-0";
  const ring =
    tone === "emerald"
      ? "border-emerald-400 bg-emerald-500/20"
      : "border-amber-400 bg-amber-500/20";
  const dot =
    tone === "emerald" ? "from-emerald-400 to-emerald-600" : "from-amber-400 to-orange-500";
  return (
    <div
      onClick={active ? onClick : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`absolute top-1/2 ${sideClass} -translate-y-1/2 grid h-24 w-14 place-items-center rounded-2xl border-2 border-dashed transition cursor-pointer ${
        placed
          ? `${ring} border-solid`
          : active
            ? highlight
              ? `${ring} scale-110`
              : "border-slate-700 bg-slate-800/40 hover:border-cyan-500"
            : "border-transparent"
      }`}
    >
      {placed ? (
        <div
          className={`h-9 w-9 rounded-full bg-gradient-to-br ${dot} shadow-md ring-2 ring-slate-900`}
        />
      ) : (
        <div className="text-center text-[10px] font-semibold text-slate-400">
          {label}
          <div className="text-[8px] opacity-70">ট্যাপ করুন</div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// LIQUID DIFFUSION (KMnO4 in cold vs hot water)
// ───────────────────────────────────────────────────────────────
function LiquidDiffusion() {
  const [dropped, setDropped] = useState(false);
  const [t, setT] = useState(0); // 0..1 across longest fill
  const HOT_TIME = 4000; // ms
  const COLD_TIME = HOT_TIME * 3;

  useEffect(() => {
    if (!dropped) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - t0;
      setT(Math.min(1, elapsed / COLD_TIME));
      if (elapsed < COLD_TIME) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dropped]);

  const hotFill = Math.min(1, t * (COLD_TIME / HOT_TIME));
  const coldFill = t;

  const reset = () => {
    setDropped(false);
    setT(0);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden p-2">
      <Card className="flex flex-1 flex-col min-h-0 border-slate-800 bg-slate-950/70 p-4 shadow-inner overflow-hidden">
        <div className="shrink-0 mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">KMnO₄ + পানি · তাপমাত্রার প্রভাব</h3>
            <p className="text-xs text-muted-foreground">
              গরম পানিতে কণার গতিশক্তি বেশি — তাই ব্যাপন প্রায় ৩ গুণ দ্রুত হয়।
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setDropped(true)}
              disabled={dropped}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-8"
            >
              <Droplets className="h-3.5 w-3.5" /> KMnO₄ ফেলুন
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={reset}
              className="gap-1.5 border-slate-700 bg-slate-800 text-slate-300 text-xs h-8 hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" /> রিসেট
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center gap-6 overflow-hidden">
          <Beaker
            label="ঠান্ডা পানি (20°C)"
            temp="cold"
            fill={dropped ? coldFill : 0}
            dropped={dropped}
          />
          <Beaker
            label="গরম পানি (80°C)"
            temp="hot"
            fill={dropped ? hotFill : 0}
            dropped={dropped}
          />
        </div>

        {dropped && hotFill >= 1 && (
          <div className="shrink-0 mt-3 rounded-xl border border-purple-500/30 bg-purple-950/30 p-2.5 text-xs text-purple-200">
            <span className="font-bold text-purple-300">পর্যবেক্ষণ:</span> গরম পানিতে KMnO₄-এর
            বেগুনি রঙ ৩ গুণ দ্রুত ছড়িয়ে পড়েছে। তাপমাত্রা বাড়লে অণুর গতিশক্তি বৃদ্ধি পায় ও
            ব্যাপনের হার বাড়ে।
          </div>
        )}
      </Card>
    </div>
  );
}

function Beaker({
  label,
  temp,
  fill,
  dropped,
}: {
  label: string;
  temp: "cold" | "hot";
  fill: number;
  dropped: boolean;
}) {
  const tint =
    temp === "hot" ? "from-rose-950/30 to-orange-950/20" : "from-sky-950/30 to-cyan-950/20";
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-bold text-slate-200">{label}</div>
      <div
        className={`relative mt-2 h-52 w-36 rounded-b-3xl rounded-t-md border-2 border-slate-700 bg-gradient-to-b ${tint} shadow-inner`}
      >
        {/* water surface line */}
        <div className="absolute inset-x-2 top-4 h-px bg-slate-600/60" />

        {/* purple diffusion overlay */}
        <div
          className="absolute inset-x-2 bottom-2 rounded-b-2xl bg-gradient-to-t from-purple-700/80 via-purple-500/60 to-purple-400/20 transition-opacity"
          style={{
            opacity: fill,
            height: `${20 + fill * 75}%`,
          }}
        />

        {/* falling crystal */}
        {dropped && fill < 0.05 && (
          <div className="absolute left-1/2 top-4 h-2.5 w-2.5 -translate-x-1/2 animate-bounce rounded-sm bg-purple-400 shadow-[0_0_8px_#c084fc]" />
        )}

        {/* temp badge */}
        <div className="absolute right-2 top-2 rounded-full bg-slate-900/80 border border-slate-700 px-1.5 py-0.5 text-[9px] font-bold">
          {temp === "hot" ? "🔥 80°C" : "❄ 20°C"}
        </div>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground font-mono">
        ব্যাপন: {Math.round(fill * 100)}%
      </div>
    </div>
  );
}
