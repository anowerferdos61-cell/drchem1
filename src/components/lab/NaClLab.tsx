/**
 * Self-contained Lab for "Preparation of Pure NaCl Crystals from Impure Salt".
 * Workflow: crush+dissolve → filter → heat to saturation → cool → seed → crystals.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Eye,
  EyeOff,
  Snowflake,
  Flame,
  Sparkles,
  GraduationCap,
  BookOpen,
  Sliders,
  BarChart3,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import TeacherViva, { type VivaQuestion } from "@/components/viva/TeacherViva";
import StudentViva from "@/components/viva/StudentViva";

import EquipmentPanel, { NACL_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import NaClWorkspace from "./workspaces/NaClWorkspace";
import type { EquipmentId, Mistake, Mode, NaClPlaced, Report, Step } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import { setAIContext } from "@/lib/ai-context-store";
import {
  BOIL_TEMP,
  OVER_EVAP_FRAC,
  ROOM_TEMP,
  SATURATION_FRAC,
  gradeNaCl,
  tickCooling,
  tickEvaporation,
} from "@/lib/nacl";

const INITIAL: NaClPlaced = {
  mortar: false,
  beaker_1: false,
  salt: false,
  water: false,
  dissolved: false,
  filter_setup: false,
  beaker_2: false,
  filtered: false,
  evaporating_dish: false,
  heat_setup: false,
  burning: false,
  cooling: false,
  seeded: false,
  crystallized: false,
};

function buildSteps(): Step[] {
  return [
    {
      id: "dissolve",
      label:
        "Crush impure salt and dissolve in 100 mL distilled water · অবিশুদ্ধ লবণ গুঁড়া করে পাতিত পানিতে দ্রবীভূত করো।",
      done: false,
    },
    {
      id: "filter",
      label: "Filter the solution into Beaker-2 · ফানেল ও ফিল্টার পেপার দিয়ে পরিশ্রবণ করো।",
      done: false,
    },
    {
      id: "setup",
      label:
        "Set up tripod, wire gauze and Bunsen burner with evaporating dish · তারজালি, বুনসেন বার্নার ও বাষ্পীভবন পাত্র বসাও।",
      done: false,
    },
    {
      id: "heat",
      label:
        "Heat until volume reduces to ~50% (saturation) · দ্রবণটি সম্পৃক্ত (~50%) হওয়া পর্যন্ত তাপ দাও।",
      done: false,
    },
    {
      id: "cool",
      label:
        "Turn off burner and let it cool naturally · বার্নার বন্ধ করে স্বাভাবিকভাবে ঠান্ডা হতে দাও।",
      done: false,
    },
    {
      id: "seed",
      label:
        "(Best practice) Add a seed crystal for cubic growth · বীজ কেলাস যোগ করো ঘনকীয় কেলাসনের জন্য।",
      done: false,
    },
  ];
}

interface Props {
  onBack: () => void;
}

export default function NaClLab({ onBack }: Props) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("guide");
  const [placed, setPlaced] = useState<NaClPlaced>(INITIAL);
  const [volumeFrac, setVolumeFrac] = useState(1);
  const [tempC, setTempC] = useState(ROOM_TEMP);
  const [crystalGrowth, setCrystalGrowth] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [steps, setSteps] = useState<Step[]>(buildSteps);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showPanels, setShowPanels] = useState(true);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [showViva, setShowViva] = useState(false);
  const [mobileTab, setMobileTab] = useState<"equipment" | "controls" | "info" | "guide">("equipment");
  const [showTheory, setShowTheory] = useState(false);

  const startedAtRef = useRef<number | null>(null);

  const guide = mode === "guide";

  // ── Publish AI context ─────────────────────────────────────
  useEffect(() => {
    const stepIdx = steps.findIndex((s) => !s.done);
    const chemicals: string[] = [];
    if (placed.salt) chemicals.push("Impure NaCl");
    if (placed.water) chemicals.push("H₂O (distilled)");
    const equipment: string[] = [];
    if (placed.beaker_1) equipment.push("Beaker-1");
    if (placed.beaker_2) equipment.push("Beaker-2");
    if (placed.filter_setup) equipment.push("Funnel + Filter paper");
    if (placed.heat_setup) equipment.push("Tripod + Wire gauze + Bunsen burner");
    if (placed.evaporating_dish) equipment.push("Evaporating dish");
    setAIContext({
      experimentId: "nacl_crystal",
      mode,
      currentStep: stepIdx < 0 ? steps.length : stepIdx,
      mistakesMade: mistakes.map((m) => m.message),
      currentChemicals: chemicals,
      currentEquipment: equipment,
      goal: "Prepare pure cubic NaCl crystals from impure salt via dissolution → filtration → evaporation to saturation → slow cooling crystallisation.",
    });
  }, [mode, steps, placed, mistakes]);

  const logMistake = useCallback((m: Omit<Mistake, "ts">) => {
    const entry: Mistake = { ...m, ts: Date.now() };
    setMistakes((prev) => [...prev, entry]);
    if (m.severity === "high") toast.error(m.message);
    else if (m.severity === "med") toast.warning(m.message);
    else toast(m.message);
  }, []);

  const completeStep = useCallback((id: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: true } : s)));
  }, []);

  // ── Equipment placement ────────────────────────────────────
  const handleSelect = useCallback(
    (id: EquipmentId) => {
      if (submitted) return;
      if (!startedAtRef.current) startedAtRef.current = Date.now();

      switch (id) {
        case "mortar_pestle":
          if (placed.mortar) return;
          setPlaced((p) => ({ ...p, mortar: true }));
          toast.success("Mortar & pestle ready — গুঁড়া করার জন্য প্রস্তুত");
          break;
        case "beaker_1":
          if (placed.beaker_1) return;
          setPlaced((p) => ({ ...p, beaker_1: true }));
          break;
        case "distilled_water":
          if (!placed.beaker_1) {
            toast.warning("Place Beaker-1 first · প্রথমে Beaker-1 বসাও");
            return;
          }
          setPlaced((p) => ({ ...p, water: true }));
          toast.success("100 mL distilled water poured");
          break;
        case "impure_salt":
          if (!placed.mortar) {
            logMistake({
              type: "no_distilled_water",
              severity: "low",
              message: "Use the mortar & pestle to crush salt first · প্রথমে গুঁড়া করো।",
            });
          }
          if (!placed.beaker_1) {
            toast.warning("Place Beaker-1 first");
            return;
          }
          setPlaced((p) => ({ ...p, salt: true }));
          if (placed.water) {
            // auto-dissolve after a short delay
            setTimeout(() => {
              setPlaced((p) => ({ ...p, dissolved: true }));
              completeStep("dissolve");
              toast.success("দ্রবণ প্রস্তুত · Solution ready");
            }, 800);
          } else {
            logMistake({
              type: "no_distilled_water",
              severity: "med",
              message: "পাতিত পানি ছাড়া লবণ দ্রবীভূত হবে না · Add distilled water first.",
            });
          }
          break;
        case "glass_rod":
          if (placed.salt && placed.water) {
            setPlaced((p) => ({ ...p, dissolved: true }));
            completeStep("dissolve");
            toast.success("Stirred — fully dissolved");
          } else {
            toast.info("Add salt and water to Beaker-1 first");
          }
          break;
        case "beaker_2":
          if (placed.beaker_2) return;
          setPlaced((p) => ({ ...p, beaker_2: true }));
          break;
        case "funnel":
        case "filter_paper":
          // Need both + beaker_2 to set up filtration
          setPlaced((p) => {
            const next = { ...p, filter_setup: true };
            return next;
          });
          if (!placed.beaker_2) {
            toast.warning("Beaker-2 যোগ করো filtrate ধরার জন্য");
          }
          if (placed.dissolved && placed.beaker_2) {
            setTimeout(() => {
              setPlaced((p) => ({ ...p, filtered: true }));
              completeStep("filter");
              toast.success("পরিশ্রবণ সম্পন্ন · Filtration complete");
            }, 1200);
          }
          break;
        case "tripod_stand":
        case "wire_gauze":
        case "bunsen_burner":
          setPlaced((p) => {
            const next = { ...p, heat_setup: true };
            return next;
          });
          if (placed.evaporating_dish) completeStep("setup");
          break;
        case "evaporating_dish":
          setPlaced((p) => ({ ...p, evaporating_dish: true }));
          if (placed.heat_setup) completeStep("setup");
          break;
        case "seed_crystal":
          if (tempC > 60) {
            logMistake({
              type: "rapid_cooling",
              severity: "low",
              message: "দ্রবণ এখনো গরম · seed crystal গলে যাবে। আগে ঠান্ডা হতে দাও।",
            });
            return;
          }
          if (!placed.cooling) {
            toast.info("First turn off the burner and let it cool a bit");
            return;
          }
          setPlaced((p) => ({ ...p, seeded: true }));
          completeStep("seed");
          toast.success("বীজ কেলাস যোগ করা হয়েছে");
          break;
      }
    },
    [placed, completeStep, logMistake, submitted, tempC],
  );

  // ── Burner control ─────────────────────────────────────────
  const lightBurner = useCallback(() => {
    if (submitted) return;
    if (!placed.heat_setup || !placed.evaporating_dish) {
      toast.warning("Setup heating apparatus first");
      return;
    }
    if (!placed.filtered) {
      logMistake({
        type: "heat_before_filter",
        severity: "high",
        message:
          "অশুদ্ধ লবণ ফিল্টার না করেই তাপ দেওয়া হয়েছে · Filter the solution before heating!",
      });
    }
    setPlaced((p) => ({ ...p, burning: true, cooling: false }));
  }, [placed.heat_setup, placed.evaporating_dish, placed.filtered, submitted, logMistake]);

  const stopBurner = useCallback(() => {
    if (!placed.burning) return;
    setPlaced((p) => ({ ...p, burning: false, cooling: true }));
    if (volumeFrac <= SATURATION_FRAC + 0.05) completeStep("heat");
    completeStep("cool");
    toast("Burner off · স্বাভাবিকভাবে ঠান্ডা হচ্ছে");
  }, [placed.burning, volumeFrac, completeStep]);

  const fastCool = useCallback(() => {
    if (!placed.cooling) return;
    logMistake({
      type: "rapid_cooling",
      severity: "low",
      message: "দ্রুত ঠান্ডা করা হয়েছে · ঘনকীয় lattice geometry নষ্ট হবে।",
    });
    // Crash tempC quickly via flag
    setTempC((t) => ROOM_TEMP + (t - ROOM_TEMP) * 0.1);
  }, [placed.cooling, logMistake]);

  // ── Heat / cool loop ───────────────────────────────────────
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    const animating = placed.burning || placed.cooling;
    if (!animating) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      if (placed.burning) {
        setTempC((t) => Math.min(BOIL_TEMP, t + 4 * dt));
        if (placed.filtered) {
          setVolumeFrac((v) => {
            const next = tickEvaporation(v, dt);
            if (next <= SATURATION_FRAC && v > SATURATION_FRAC) {
              completeStep("heat");
              toast.success("সম্পৃক্ত দ্রবণ · burner বন্ধ কর এখন!");
            }
            if (next < OVER_EVAP_FRAC && v >= OVER_EVAP_FRAC) {
              logMistake({
                type: "over_evaporation",
                severity: "med",
                message: "দ্রবণটিকে সম্পূর্ণ শুকিয়ে ফেলা হয়েছে · কেলাসনের সুযোগ দেওয়া হয়নি।",
              });
            }
            return next;
          });
        }
      } else if (placed.cooling) {
        setTempC((t) => tickCooling(t, dt, false));
        // Once cooled enough → start crystallisation animation
        if (tempC < 55 && volumeFrac <= SATURATION_FRAC + 0.05) {
          setCrystalGrowth((g) => Math.min(1, g + 0.05 * dt + 0.005));
          if (crystalGrowth > 0.95 && !placed.crystallized) {
            setPlaced((p) => ({ ...p, crystallized: true }));
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    placed.burning,
    placed.cooling,
    placed.filtered,
    placed.crystallized,
    tempC,
    volumeFrac,
    crystalGrowth,
    completeStep,
    logMistake,
  ]);

  // ── Submit / reset ─────────────────────────────────────────
  const submit = () => {
    const high = mistakes.filter((m) => m.severity === "high").length;
    const med = mistakes.filter((m) => m.severity === "med").length;
    const low = mistakes.filter((m) => m.severity === "low").length;
    const reachedSaturation = volumeFrac <= SATURATION_FRAC + 0.1;
    const overEvap = volumeFrac < OVER_EVAP_FRAC;
    const rapid = mistakes.some((m) => m.type === "rapid_cooling");
    const { accuracy, grade, crystalQuality } = gradeNaCl({
      filtered: placed.filtered,
      reachedSaturation,
      overEvaporated: overEvap,
      rapidCooled: rapid,
      seeded: placed.seeded,
      highMistakes: high,
      medMistakes: med,
      lowMistakes: low,
    });
    if (!placed.seeded) {
      logMistake({
        type: "no_seed_crystal",
        severity: "low",
        message: "বীজ কেলাস (seed crystal) যোগ করা হয়নি · কেলাসগুলো irregular হতে পারে।",
      });
    }
    const r: Report = {
      experiment: "nacl_crystal",
      volumeReductionPct: Math.round((1 - volumeFrac) * 100),
      crystalQuality,
      seedUsed: placed.seeded,
      accuracy,
      grade,
      durationSec: startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : 0,
      mistakes,
      steps,
    };
    setReport(r);
    setSubmitted(true);
    setPlaced((p) => ({ ...p, burning: false }));
    toast.success(`Submitted! Grade: ${r.grade}`);
  };

  const reset = () => {
    setPlaced(INITIAL);
    setVolumeFrac(1);
    setTempC(ROOM_TEMP);
    setCrystalGrowth(0);
    setMistakes([]);
    setSteps(buildSteps());
    setSubmitted(false);
    setReport(null);
    startedAtRef.current = null;
  };

  // ── Guide hints ────────────────────────────────────────────
  const nextHint = useMemo(() => {
    if (!placed.mortar) return "Click Mortar & Pestle to crush the impure salt.";
    if (!placed.beaker_1) return "Place Beaker-1 to start dissolving.";
    if (!placed.water) return "Pour distilled water (H₂O) into Beaker-1.";
    if (!placed.salt) return "Add the crushed impure salt to the water.";
    if (!placed.dissolved) return "Use the glass rod to stir until dissolved.";
    if (!placed.beaker_2) return "Place Beaker-2 to receive the filtrate.";
    if (!placed.filter_setup) return "Add Funnel and Filter Paper for filtration.";
    if (!placed.filtered) return "Wait for filtration to complete…";
    if (!placed.heat_setup) return "Set up Tripod + Wire Gauze + Bunsen Burner.";
    if (!placed.evaporating_dish) return "Place the evaporating dish on the gauze.";
    if (!placed.burning && volumeFrac > SATURATION_FRAC + 0.05)
      return "Light the burner to start evaporation.";
    if (placed.burning && volumeFrac > SATURATION_FRAC)
      return "Heat until volume reaches the dashed 50% line.";
    if (placed.burning && volumeFrac <= SATURATION_FRAC + 0.05)
      return "Saturation reached — stop heating now!";
    if (placed.cooling && tempC > 55) return "Let it cool naturally…";
    if (!placed.seeded && tempC < 55) return "Add a tiny seed crystal for perfect cubic geometry.";
    if (placed.crystallized) return "Crystals formed! Submit your report.";
    return "Continue the workflow…";
  }, [placed, volumeFrac, tempC]);

  const nextHighlight: EquipmentId | null = useMemo(() => {
    if (!placed.mortar) return "mortar_pestle";
    if (!placed.beaker_1) return "beaker_1";
    if (!placed.water) return "distilled_water";
    if (!placed.salt) return "impure_salt";
    if (!placed.dissolved) return "glass_rod";
    if (!placed.beaker_2) return "beaker_2";
    if (!placed.filter_setup) return "funnel";
    if (!placed.heat_setup) return "tripod_stand";
    if (!placed.evaporating_dish) return "evaporating_dish";
    if (placed.cooling && tempC < 55 && !placed.seeded) return "seed_crystal";
    return null;
  }, [placed, tempC]);

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-slate-100 select-none">
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
                <span className="hidden text-xs font-semibold sm:inline">Experiments</span>
              </Button>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-xs font-black tracking-tight sm:text-sm text-slate-100">
                  NaCl Crystallisation · NaCl কেলাস প্রস্তুতি
                </div>
                <div className="hidden truncate text-[10px] text-sky-400/80 sm:block font-mono">
                  Impure NaCl → দ্রবীভূত → পরিশ্রবণ → সম্পৃক্ত দ্রবণ → কেলাসন
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <ModeToggle mode={mode} setMode={setMode} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTheory(true)}
                className="hidden h-7 gap-1 border-sky-500/30 bg-sky-500/10 px-2 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20 sm:flex"
              >
                <BookOpen className="h-3 w-3" />
                <span>অধ্যায় ৫ থিওরি</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViva((v) => !v)}
                className="h-7 gap-1 border-slate-700 bg-slate-900/60 px-2 text-[11px] text-slate-300 hover:bg-slate-800"
              >
                <GraduationCap className="h-3 w-3" />
                <span className="hidden sm:inline">{showViva ? "Hide Viva" : "AI Viva"}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* ── Desktop Layout: 3-Column Fixed 100dvh (Zero outer scrollbar) ── */}
        {!isMobile ? (
          <main className="flex-1 min-h-0 overflow-hidden p-2.5 grid md:grid-cols-[minmax(250px,270px)_minmax(0,1fr)_minmax(270px,300px)] lg:grid-cols-[minmax(270px,290px)_minmax(0,1fr)_minmax(290px,320px)] md:gap-2.5">
          {/* LEFT: Equipment */}
          <aside className="lab-scroll flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto pr-1">
            <EquipmentPanel
              items={NACL_ITEMS}
              onSelect={handleSelect}
              highlight={guide ? nextHighlight : null}
              disabled={() => submitted}
            />
          </aside>

          {/* CENTER: Workspace & Action Bar */}
          <section
            className="relative flex h-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/equipment") as EquipmentId;
              if (id) handleSelect(id);
            }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <NaClWorkspace
                placed={placed}
                volumeFrac={volumeFrac}
                tempC={tempC}
                crystalGrowth={crystalGrowth}
              />
            </div>

            {/* Desktop Action Pill Bar */}
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur">
              {!placed.burning ? (
                <Button
                  size="sm"
                  onClick={lightBurner}
                  disabled={
                    !placed.heat_setup ||
                    !placed.evaporating_dish ||
                    submitted ||
                    placed.crystallized
                  }
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  <Flame className="mr-1 h-3.5 w-3.5" /> বার্নার চালু
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={stopBurner} className="h-7 text-xs font-semibold">
                  <Pause className="mr-1 h-3.5 w-3.5" /> বার্নার বন্ধ
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={fastCool}
                disabled={!placed.cooling || submitted}
                title="Forces rapid cooling (mistake)"
                className="h-7 text-xs border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
              >
                <Snowflake className="mr-1 h-3.5 w-3.5" /> Fast cool
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={reset}
                className="h-7 text-xs border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
              <Button
                size="sm"
                onClick={submit}
                disabled={submitted}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <Trophy className="mr-1 h-3.5 w-3.5" /> Submit
              </Button>
            </div>
          </section>

          {/* RIGHT: Status & Checklist */}
          <aside className="lab-scroll flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto pl-1">
            <StatusCard
              tempC={tempC}
              volumeFrac={volumeFrac}
              crystalGrowth={crystalGrowth}
              seeded={placed.seeded}
            />
            {mode !== "student" && (
              <StepsPanel
                steps={steps}
                mistakes={mistakes}
                guideMode={guide}
                nextHint={guide ? nextHint : undefined}
              />
            )}
          </aside>
        </main>
        ) : (
        /* ── Mobile Split View (< md) ── */
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          {/* Top 46%: Pinned Visual Workspace */}
          <div className="relative h-[46dvh] shrink-0 border-b border-slate-800/80 bg-slate-950/70 p-1 flex items-center justify-center overflow-hidden">
            <NaClWorkspace
              placed={placed}
              volumeFrac={volumeFrac}
              tempC={tempC}
              crystalGrowth={crystalGrowth}
            />
          </div>

          {/* Bottom 54%: Interactive Tabbed Tray */}
          <div className="flex flex-1 flex-col min-h-0 bg-slate-900/95 backdrop-blur">
            {/* Tab Selection */}
            <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 p-1 text-[11px] font-semibold gap-1">
              <button
                type="button"
                onClick={() => setMobileTab("equipment")}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md py-1.5 transition",
                  mobileTab === "equipment"
                    ? "bg-slate-800 text-sky-400 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Sliders className="h-3 w-3" />
                <span>যন্ত্রপাতি</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab("controls")}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md py-1.5 transition",
                  mobileTab === "controls"
                    ? "bg-slate-800 text-sky-400 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Flame className="h-3 w-3" />
                <span>কন্ট্রোলস</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab("info")}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md py-1.5 transition",
                  mobileTab === "info"
                    ? "bg-slate-800 text-sky-400 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <BarChart3 className="h-3 w-3" />
                <span>তথ্য ও গ্রোথ</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab("guide")}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md py-1.5 transition",
                  mobileTab === "guide"
                    ? "bg-slate-800 text-sky-400 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <CheckSquare className="h-3 w-3" />
                <span>গাইড</span>
              </button>
            </div>

            {/* Tab Panel Content */}
            <div className="lab-scroll flex-1 min-h-0 overflow-y-auto p-2.5">
              {mobileTab === "equipment" && (
                <div className="space-y-2.5">
                  <EquipmentPanel
                    items={NACL_ITEMS}
                    onSelect={handleSelect}
                    highlight={guide ? nextHighlight : null}
                    disabled={() => submitted}
                  />
                </div>
              )}

              {mobileTab === "controls" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <div className="text-xs font-bold text-slate-200">তাপ ও শীতলীকরণ কন্ট্রোল</div>
                    <div className="grid grid-cols-2 gap-2">
                      {!placed.burning ? (
                        <Button
                          size="sm"
                          onClick={lightBurner}
                          disabled={
                            !placed.heat_setup ||
                            !placed.evaporating_dish ||
                            submitted ||
                            placed.crystallized
                          }
                          className="h-9 text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                        >
                          <Flame className="mr-1.5 h-4 w-4" /> বার্নার চালু
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={stopBurner}
                          className="h-9 text-xs font-semibold"
                        >
                          <Pause className="mr-1.5 h-4 w-4" /> বার্নার বন্ধ
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={fastCool}
                        disabled={!placed.cooling || submitted}
                        className="h-9 text-xs border-sky-500/30 bg-sky-500/10 text-sky-300"
                      >
                        <Snowflake className="mr-1.5 h-4 w-4 text-sky-400" /> Fast cool (ভুল)
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={reset}
                      className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-300"
                    >
                      <RotateCcw className="mr-1.5 h-4 w-4" /> রিসেট
                    </Button>
                    <Button
                      size="sm"
                      onClick={submit}
                      disabled={submitted}
                      className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      <Trophy className="mr-1.5 h-4 w-4" /> রিপোর্ট জমা
                    </Button>
                  </div>
                </div>
              )}

              {mobileTab === "info" && (
                <StatusCard
                  tempC={tempC}
                  volumeFrac={volumeFrac}
                  crystalGrowth={crystalGrowth}
                  seeded={placed.seeded}
                />
              )}

              {mobileTab === "guide" && (
                <div className="space-y-3">
                  <StepsPanel
                    steps={steps}
                    mistakes={mistakes}
                    guideMode={guide}
                    nextHint={guide ? nextHint : undefined}
                  />
                  {showViva && (
                    <div className="space-y-3 pt-2">
                      <TeacherViva
                        onPublish={setVivaQuestions}
                        experiment="nacl_crystal"
                        defaultTopic="অবিশুদ্ধ লবণ থেকে বিশুদ্ধ NaCl কেলাস প্রস্তুতি · Crystallisation of pure NaCl"
                      />
                      <StudentViva />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* ── Report Modal Overlay ── */}
        {report && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
              <LabReport report={report} onReset={reset} />
            </div>
          </div>
        )}

        {/* ── Chapter 5 Theory Drawer ── */}
        <Drawer open={showTheory} onOpenChange={setShowTheory}>
          <DrawerContent className="max-h-[85dvh] bg-slate-900 text-slate-100 border-slate-800">
            <DrawerHeader className="pb-2 border-b border-slate-800">
              <DrawerTitle className="text-base font-bold flex items-center gap-2 text-sky-400">
                <BookOpen className="h-4 w-4" /> অধ্যায় ৫: সোডিয়াম ক্লোরাইড কেলাসন ও কেলাস কাঠামো
              </DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="px-4 py-4 max-h-[70dvh]">
              <div className="prose prose-invert prose-sm max-w-none space-y-4 text-slate-300">
                <div>
                  <h4 className="text-sky-400 font-bold mb-1">১. মূল নীতি (Principle of Crystallisation)</h4>
                  <p className="text-xs text-slate-400">
                    কেলাসন হলো কঠিন পদার্থ বিশুদ্ধ করার অন্যতম প্রধান ভৌত পদ্ধতি। অবিশুদ্ধ খাদ্য লবণে সাধারণত বালি, কাদা এবং অন্যান্য অদ্রবণীয় অপদ্রব্য মিশ্রিত থাকে। পানিতে দ্রবীভূত করে পরিশ্রাবণ করলে অদ্রবণীয় অপদ্রব্য ফিল্টার পেপারে অবশেষ হিসেবে থেকে যায়।
                  </p>
                </div>

                <div>
                  <h4 className="text-sky-400 font-bold mb-1">২. বাষ্পীভবন ও সম্পৃক্তকরণ (Evaporation to Saturation)</h4>
                  <p className="text-xs text-slate-400">
                    পরিশ্রুত দ্রবণকে বাষ্পীভবন পাত্রে নিয়ে উত্তপ্ত করে আয়তন প্রায় ৫০% এ কমিয়ে আনা হয়। একটি কাচদণ্ড দ্রবণে ডুবিয়ে ফুঁ দিলে যদি দণ্ডের মাথায় সূক্ষ্ম কেলাস দেখা যায়, তবে বুঝতে হবে দ্রবণটি কেলাসন বিন্দুতে পৌঁছেছে (সম্পৃক্ত হয়েছে)। অতিরিক্ত বাষ্পীভবন করলে লবণ শুকিয়ে পুড়ে যাবে।
                  </p>
                </div>

                <div>
                  <h4 className="text-sky-400 font-bold mb-1">৩. ধীর শীতলীকরণ ও বীজ কেলাস (Slow Cooling & Seeding)</h4>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-300">
                    <li><strong className="text-slate-100">ধীর শীতলীকরণ:</strong> দ্রবণটিকে না নাড়িয়ে ধীরে ধীরে স্বাভাবিক তাপমাত্রায় ঠান্ডা হতে দিলে সুনির্দিষ্ট আকারের বড় ও নিখুঁত কেলাস তৈরি হয়। দ্রুত ঠান্ডা করলে সূক্ষ্ম ও অনিয়মিত কেলাস গঠিত হয়।</li>
                    <li><strong className="text-slate-100">বীজ কেলাস (Seed Crystal):</strong> প্রায় ৫৫°C এর নিচে একটি ছোট বিশুদ্ধ কেলাস সুতা দিয়ে ঝুলিয়ে দিলে তা নিউক্লিয়েশন কেন্দ্র হিসেবে কাজ করে দ্রুত ও চমৎকার ঘনকীয় কেলাস বৃদ্ধি নিশ্চিত করে।</li>
                    <li><strong className="text-slate-100">ঘনকীয় ল্যাটিস:</strong> NaCl এর কেলাস কাঠামো ফেস-সেন্টার্ড কিউবিক (FCC), যেখানে প্রতিটি Na⁺ আয়ন ৬টি Cl⁻ আয়ন দ্বারা এবং প্রতিটি Cl⁻ আয়ন ৬টি Na⁺ আয়ন দ্বারা পরিবেষ্টিত থাকে (সমন্বয় সংখ্যা ৬:৬)।</li>
                  </ul>
                </div>
              </div>
            </ScrollArea>
            <DrawerClose asChild>
              <Button variant="outline" size="sm" className="mx-4 mb-3 border-slate-700 bg-slate-800 text-slate-200">
                বন্ধ করুন
              </Button>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const opts: Array<{ id: Mode; label: string }> = [
    { id: "guide", label: "Guide" },
    { id: "student", label: "Student" },
  ];
  return (
    <div className="flex rounded-md border bg-muted p-0.5 text-xs">
      {opts.map((o) => {
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setMode(o.id)}
            className={[
              "rounded px-2.5 py-1 transition",
              active ? "bg-background font-medium shadow-sm" : "text-muted-foreground",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusCard({
  tempC,
  volumeFrac,
  crystalGrowth,
  seeded,
}: {
  tempC: number;
  volumeFrac: number;
  crystalGrowth: number;
  seeded: boolean;
}) {
  const satPct = Math.round((1 - volumeFrac) * 100);
  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Live Data · সরাসরি তথ্য
      </h3>
      <div className="rounded-lg bg-[oklch(0.2_0.06_240)] p-3 text-[oklch(0.92_0.18_240)] shadow-inner">
        <div className="flex justify-between text-xs opacity-70">
          <span>Temp (°C)</span>
          <span>Volume left</span>
        </div>
        <div className="flex justify-between text-2xl font-bold">
          <span>{tempC.toFixed(0)}</span>
          <span>{(volumeFrac * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="বাষ্পীভবন" value={`${satPct}%`} />
        <Stat label="কেলাস" value={`${(crystalGrowth * 100).toFixed(0)}%`} />
        <Stat label="Seed" value={seeded ? "✓ Added" : "—"} />
        <Stat label="Phase" value={tempC > 60 ? "Hot" : "Cool"} />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-card p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
