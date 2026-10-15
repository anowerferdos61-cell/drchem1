/**
 * Self-contained lab for "Determination of Crystallization Water in CuSO4·5H2O".
 * Workflow: weigh empty crucible (x) → add 3-5 g hydrated salt & weigh (y) →
 *           heat on tripod with stirring → cool in desiccator → reweigh (z).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Eye,
  EyeOff,
  Droplet,
  Flame,
  GraduationCap,
  Sparkles,
  Snowflake,
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

import EquipmentPanel, { CUSO4_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import CopperSulfateWorkspace from "./workspaces/CopperSulfateWorkspace";
import type { CuSO4Placed, EquipmentId, Mistake, Mode, Report, Step } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import { setAIContext } from "@/lib/ai-context-store";
import {
  ANHYDROUS_FRACTION,
  HEATING_TIME_FOR_FULL_DEHYDRATION,
  THEORETICAL_WATER_PCT,
  colorFromFraction,
  computeAnhydrousMass,
  computeWaterPct,
  dehydrationFromHeating,
  gradeCuSO4,
  randomCrucibleMass,
} from "@/lib/copper-sulfate";

function makeInitial(): CuSO4Placed {
  return {
    balanceOn: false,
    crucibleOnBalance: false,
    emptyCrucibleMass: randomCrucibleMass(),
    weighedEmpty: false,
    tared: false,
    hydratedSampleMass: 0,
    weighedHydrated: false,
    tripodReady: false,
    crucibleOnTripod: false,
    burnerOn: false,
    heatingTime: 0,
    dehydrationFraction: 0,
    stirred: 0,
    spilled: false,
    inDesiccator: false,
    cooled: false,
    cooledTime: 0,
    touchedBare: false,
    weighedAnhydrous: false,
    finalCrucibleMass: 0,
  };
}

function buildSteps(): Step[] {
  return [
    { id: "weigh_empty", label: "Weigh empty crucible (x) · খালি ক্রুসিবল ওজন করো", done: false },
    {
      id: "weigh_hydrated",
      label: "Add 3–5 g blue vitriol & weigh (y) · নীল তুঁতে যোগ করে ওজন",
      done: false,
    },
    { id: "setup_heat", label: "Place on tripod + wire gauze · ত্রিপদীতে বসাও", done: false },
    { id: "heat", label: "Heat & stir until white · সাদা হওয়া পর্যন্ত উত্তপ্ত করো", done: false },
    { id: "cool", label: "Cool in desiccator · ডেসিকেটরে ঠান্ডা করো", done: false },
    {
      id: "weigh_anhydrous",
      label: "Weigh anhydrous mass (z) · শুষ্ক পদার্থের ওজন (z)",
      done: false,
    },
  ];
}

interface Props {
  onBack: () => void;
}

export default function CopperSulfateLab({ onBack }: Props) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("guide");
  const [placed, setPlaced] = useState<CuSO4Placed>(makeInitial);
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

  // ── AI context ─────────────────────────────────────────────
  useEffect(() => {
    const stepIdx = steps.findIndex((s) => !s.done);
    const chemicals: string[] = [];
    if (placed.hydratedSampleMass > 0) {
      const color = colorFromFraction(placed.dehydrationFraction);
      chemicals.push(`CuSO₄·5H₂O (${placed.hydratedSampleMass.toFixed(3)} g, ${color})`);
    }
    const equipment: string[] = [];
    if (placed.balanceOn) equipment.push("Analytical balance");
    if (placed.crucibleOnBalance || placed.crucibleOnTripod || placed.inDesiccator)
      equipment.push("Porcelain crucible");
    if (placed.tripodReady) equipment.push("Tripod + wire gauze + burner");
    if (placed.inDesiccator) equipment.push("Desiccator");
    setAIContext({
      experimentId: "cuso4_water",
      mode,
      currentStep: stepIdx < 0 ? steps.length : stepIdx,
      mistakesMade: mistakes.map((m) => m.message),
      currentChemicals: chemicals,
      currentEquipment: equipment,
      goal: "Determine the percentage of crystallization water in CuSO₄·5H₂O by heating to constant mass and applying %H₂O = (y − z)/(y − x) × 100 (theoretical 36.07%).",
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

  // ── Heating loop ───────────────────────────────────────────
  useEffect(() => {
    if (!placed.burnerOn) return;
    const t = setInterval(() => {
      setPlaced((p) => {
        if (!p.burnerOn) return p;
        const nextTime = p.heatingTime + 1;
        const nextFrac = dehydrationFromHeating(nextTime);
        return { ...p, heatingTime: nextTime, dehydrationFraction: nextFrac };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [placed.burnerOn]);

  // ── Cooling loop in desiccator ─────────────────────────────
  useEffect(() => {
    if (!placed.inDesiccator || placed.cooled) return;
    const t = setInterval(() => {
      setPlaced((p) => {
        if (!p.inDesiccator || p.cooled) return p;
        const nt = p.cooledTime + 1;
        return { ...p, cooledTime: nt, cooled: nt >= 5 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [placed.inDesiccator, placed.cooled]);

  // ── Equipment placement ────────────────────────────────────
  const handleSelect = useCallback(
    (id: EquipmentId) => {
      if (submitted) return;
      if (!startedAtRef.current) startedAtRef.current = Date.now();

      switch (id) {
        case "balance":
          if (placed.balanceOn) return;
          setPlaced((p) => ({ ...p, balanceOn: true }));
          toast.success("Balance ON · 0.000 g");
          break;
        case "crucible":
          if (placed.burnerOn) {
            toast.warning("Turn off the burner first");
            return;
          }
          // Toggle location based on current state: balance ↔ tripod ↔ desiccator
          if (!placed.crucibleOnBalance && !placed.crucibleOnTripod && !placed.inDesiccator) {
            if (!placed.balanceOn) {
              toast.warning("Turn on the balance first");
              return;
            }
            setPlaced((p) => ({ ...p, crucibleOnBalance: true }));
            toast(`Crucible placed · reads ${placed.emptyCrucibleMass.toFixed(3)} g`);
          } else {
            toast.info("Use the action buttons to move the crucible between stations.");
          }
          break;
        case "cuso4_hydrated":
          if (!placed.crucibleOnBalance) {
            toast.warning("Place the crucible on the balance first");
            return;
          }
          if (!placed.weighedEmpty) {
            logMistake({
              type: "not_weighed_empty",
              severity: "med",
              message: "খালি ক্রুসিবলের ভর (x) আগে রেকর্ড করো",
            });
          }
          setPlaced((p) => {
            if (p.hydratedSampleMass >= 5.2) return p;
            const delta = 0.6 + Math.random() * 0.3;
            const next = Math.min(5.2, p.hydratedSampleMass + delta);
            return { ...p, hydratedSampleMass: next };
          });
          break;
        case "tripod_stand":
        case "wire_gauze":
        case "bunsen_burner":
          if (placed.tripodReady) return;
          setPlaced((p) => ({ ...p, tripodReady: true }));
          toast.success("Tripod + wire gauze + burner ready");
          break;
        case "glass_rod":
          if (!placed.crucibleOnTripod || !placed.burnerOn) {
            toast.warning("Glass rod is used during heating to stir.");
            return;
          }
          // gentle stir
          setPlaced((p) => ({ ...p, stirred: p.stirred + 1 }));
          toast("Stirred · uniform dehydration");
          break;
        case "desiccator":
          if (!placed.weighedAnhydrous && placed.heatingTime > 0) {
            // OK — moving to cool
            toast.info("Use the 'Move to Desiccator' button after stopping the burner.");
          } else {
            toast.info("Desiccator ready (use action button to transfer crucible).");
          }
          break;
        case "tongs":
          toast.info("Tongs are used automatically when you move the hot crucible.");
          break;
      }
    },
    [placed, logMistake, submitted],
  );

  // ── Custom actions ────────────────────────────────────────
  const recordEmpty = () => {
    if (!placed.crucibleOnBalance || placed.hydratedSampleMass > 0) {
      toast.warning("Place empty crucible on the balance");
      return;
    }
    setPlaced((p) => ({ ...p, weighedEmpty: true, tared: false }));
    completeStep("weigh_empty");
    toast.success(`x = ${placed.emptyCrucibleMass.toFixed(3)} g recorded`);
  };

  const recordHydrated = () => {
    if (placed.hydratedSampleMass < 2.5) {
      toast.warning("Add at least ~3 g of blue vitriol");
      return;
    }
    setPlaced((p) => ({ ...p, weighedHydrated: true }));
    completeStep("weigh_hydrated");
    const y = placed.emptyCrucibleMass + placed.hydratedSampleMass;
    toast.success(`y = ${y.toFixed(3)} g recorded`);
  };

  const moveToTripod = () => {
    if (!placed.weighedHydrated) {
      toast.warning("Record y first");
      return;
    }
    if (!placed.tripodReady) {
      toast.warning("Set up tripod + wire gauze + burner first");
      return;
    }
    setPlaced((p) => ({ ...p, crucibleOnBalance: false, crucibleOnTripod: true }));
    completeStep("setup_heat");
    toast.success("Crucible on wire gauze");
  };

  const toggleBurner = () => {
    if (!placed.crucibleOnTripod) {
      toast.warning("Place the crucible on the tripod first");
      return;
    }
    setPlaced((p) => ({ ...p, burnerOn: !p.burnerOn }));
  };

  const aggressiveStir = () => {
    if (!placed.crucibleOnTripod) return;
    if (placed.spilled) return;
    setPlaced((p) => ({
      ...p,
      spilled: true,
      hydratedSampleMass: p.hydratedSampleMass * 0.8,
    }));
    logMistake({
      type: "spilled_crystals",
      severity: "high",
      message: "আক্রমণাত্মক নাড়াচাড়ায় কেলাস পড়ে গেছে · ভর কমে গেছে।",
    });
  };

  const moveToDesiccator = () => {
    if (!placed.crucibleOnTripod) {
      toast.warning("Crucible is not on the tripod");
      return;
    }
    if (placed.burnerOn) {
      toast.warning("Turn off the burner first");
      return;
    }
    if (placed.dehydrationFraction < 0.85) {
      logMistake({
        type: "under_heated",
        severity: "med",
        message: "পদার্থ পুরোপুরি সাদা হয়নি · incomplete dehydration · কম জলের শতকরা পাবে।",
      });
      completeStep("heat");
    } else {
      completeStep("heat");
    }
    setPlaced((p) => ({
      ...p,
      crucibleOnTripod: false,
      inDesiccator: true,
      cooledTime: 0,
      cooled: false,
    }));
    toast.success("Crucible transferred with tongs → desiccator");
  };

  const touchBare = () => {
    if (placed.cooled) {
      toast.info("Already cool — safe to handle.");
      return;
    }
    setPlaced((p) => ({ ...p, touchedBare: true }));
    logMistake({
      type: "touched_hot_crucible",
      severity: "low",
      message: "⚠️ Bare hand দিয়ে গরম ক্রুসিবল ধরা যাবে না · tongs use করো!",
    });
  };

  const moveBackToBalance = (forceHot = false) => {
    if (!placed.inDesiccator) {
      toast.warning("Crucible is not in the desiccator");
      return;
    }
    if (!placed.cooled && !forceHot) {
      toast.warning("Wait until the crucible cools to 25 °C");
      return;
    }
    if (forceHot && !placed.cooled) {
      logMistake({
        type: "weighed_hot",
        severity: "high",
        message: "গরম অবস্থায় ওজন নেওয়া হয়েছে · convection currents-এর জন্য reading ভুল।",
      });
    }
    completeStep("cool");
    const frac = placed.dehydrationFraction;
    const zClean = computeAnhydrousMass(placed.emptyCrucibleMass, placed.hydratedSampleMass, frac);
    const z = !placed.cooled ? zClean - 0.05 : zClean; // hot-weigh artifact
    setPlaced((p) => ({
      ...p,
      inDesiccator: false,
      crucibleOnBalance: true,
      weighedAnhydrous: true,
      finalCrucibleMass: z,
    }));
    completeStep("weigh_anhydrous");
    toast.success(`z = ${z.toFixed(3)} g recorded`);
  };

  // ── Submit / reset ─────────────────────────────────────────
  const submit = () => {
    if (!placed.weighedAnhydrous) {
      toast.warning("Complete the final weighing before submitting");
      return;
    }
    const x = placed.emptyCrucibleMass;
    const y = x + placed.hydratedSampleMass;
    const z = placed.finalCrucibleMass;
    const high = mistakes.filter((m) => m.severity === "high").length;
    const med = mistakes.filter((m) => m.severity === "med").length;
    const low = mistakes.filter((m) => m.severity === "low").length;
    const g = gradeCuSO4({
      x,
      y,
      z,
      weighedHot: mistakes.some((m) => m.type === "weighed_hot"),
      spilled: placed.spilled,
      highMistakes: high,
      medMistakes: med,
      lowMistakes: low,
    });
    const r: Report = {
      experiment: "cuso4_water",
      cuEmptyMass: x,
      cuHydratedMass: y,
      cuAnhydrousMass: z,
      cuWaterPct: g.waterPct,
      cuTheoreticalPct: THEORETICAL_WATER_PCT,
      accuracy: g.accuracy,
      grade: g.grade,
      durationSec: startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : 0,
      mistakes,
      steps,
    };
    setReport(r);
    setSubmitted(true);
    toast.success(`Submitted! Grade: ${r.grade} · ${g.waterPct.toFixed(2)} % H₂O`);
  };

  const reset = () => {
    setPlaced(makeInitial());
    setMistakes([]);
    setSteps(buildSteps());
    setSubmitted(false);
    setReport(null);
    startedAtRef.current = null;
  };

  // ── Guide hints ────────────────────────────────────────────
  const nextHint = useMemo(() => {
    if (!placed.balanceOn) return "Click Balance to turn it on.";
    if (!placed.crucibleOnBalance && !placed.crucibleOnTripod && !placed.inDesiccator)
      return "Place the porcelain crucible on the balance pan.";
    if (!placed.weighedEmpty && placed.crucibleOnBalance && placed.hydratedSampleMass === 0)
      return "Click 'Record x' to log the empty crucible mass.";
    if (placed.hydratedSampleMass < 2.5)
      return "Add ~3–5 g of CuSO₄·5H₂O (blue vitriol) to the crucible.";
    if (!placed.weighedHydrated) return "Click 'Record y' to log the total mass.";
    if (!placed.tripodReady) return "Set up the tripod + wire gauze + burner.";
    if (!placed.crucibleOnTripod && !placed.inDesiccator)
      return "Click 'Move to Tripod' to transfer the crucible.";
    if (!placed.burnerOn && placed.dehydrationFraction < 0.85 && !placed.inDesiccator)
      return "Light the burner and stir gently until the powder turns white.";
    if (placed.burnerOn && placed.dehydrationFraction < 0.85)
      return `Keep heating · color: ${colorFromFraction(placed.dehydrationFraction)} (${(placed.dehydrationFraction * 100).toFixed(0)}% dehydrated)`;
    if (placed.burnerOn && placed.dehydrationFraction >= 0.85)
      return "Powder is white — turn off the burner.";
    if (!placed.inDesiccator && !placed.weighedAnhydrous)
      return "Use tongs · move the crucible into the desiccator to cool.";
    if (placed.inDesiccator && !placed.cooled) return `Wait for cooling… ${placed.cooledTime}/5 s`;
    if (placed.inDesiccator && placed.cooled) return "Move back to the balance and record z.";
    if (placed.weighedAnhydrous) return "Submit your report.";
    return "";
  }, [placed]);

  const nextHighlight: EquipmentId | null = useMemo(() => {
    if (!placed.balanceOn) return "balance";
    if (!placed.crucibleOnBalance && !placed.crucibleOnTripod && !placed.inDesiccator)
      return "crucible";
    if (placed.weighedEmpty && placed.hydratedSampleMass < 2.5) return "cuso4_hydrated";
    if (placed.weighedHydrated && !placed.tripodReady) return "tripod_stand";
    if (placed.crucibleOnTripod && placed.burnerOn && placed.stirred === 0) return "glass_rod";
    return null;
  }, [placed]);

  // Live readouts
  const x = placed.emptyCrucibleMass;
  const y = x + placed.hydratedSampleMass;
  const liveZ = placed.weighedAnhydrous
    ? placed.finalCrucibleMass
    : computeAnhydrousMass(x, placed.hydratedSampleMass, placed.dehydrationFraction);
  const livePct = y > x ? computeWaterPct(x, y, liveZ) : 0;

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
                <Droplet className="h-4 w-4" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-xs font-black tracking-tight sm:text-sm text-slate-100">
                  CuSO₄·5H₂O Water · কেলাস পানি নির্ণয়
                </div>
                <div className="hidden truncate text-[10px] text-sky-400/80 sm:block font-mono">
                  %H₂O = (y − z)/(y − x) × 100 · তাত্ত্বিক ৩৬.০৭%
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
                <span>অধ্যায় ৮ থিওরি</span>
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
              items={CUSO4_ITEMS}
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
              <CopperSulfateWorkspace placed={placed} />
            </div>

            {/* Desktop Action Pill Bar */}
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur">
              <Button
                size="sm"
                variant="outline"
                onClick={recordEmpty}
                disabled={
                  submitted ||
                  !placed.crucibleOnBalance ||
                  placed.weighedEmpty ||
                  placed.hydratedSampleMass > 0
                }
                className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
              >
                <Sparkles className="mr-1 h-3 w-3 text-sky-400" /> Record x
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={recordHydrated}
                disabled={submitted || placed.weighedHydrated || placed.hydratedSampleMass < 2.5}
                className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
              >
                Record y
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={moveToTripod}
                disabled={
                  submitted ||
                  !placed.weighedHydrated ||
                  placed.crucibleOnTripod ||
                  placed.inDesiccator
                }
                className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
              >
                → Tripod
              </Button>
              <Button
                size="sm"
                variant={placed.burnerOn ? "destructive" : "default"}
                onClick={toggleBurner}
                disabled={submitted || !placed.crucibleOnTripod}
                className={cn(
                  "h-7 px-2 text-xs font-semibold",
                  !placed.burnerOn && "bg-amber-600 hover:bg-amber-500 text-white"
                )}
              >
                <Flame className="mr-1 h-3 w-3" /> {placed.burnerOn ? "বার্নার বন্ধ" : "বার্নার চালু"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={moveToDesiccator}
                disabled={submitted || !placed.crucibleOnTripod || placed.burnerOn}
                className="h-7 px-2 text-xs border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
              >
                <Snowflake className="mr-1 h-3 w-3" /> Desiccator
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => moveBackToBalance(false)}
                disabled={submitted || !placed.inDesiccator || placed.weighedAnhydrous}
                className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
              >
                → Record z
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={reset}
                className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
              >
                <RotateCcw className="mr-1 h-3 w-3" /> Reset
              </Button>
              <Button
                size="sm"
                onClick={submit}
                disabled={submitted || !placed.weighedAnhydrous}
                className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <Trophy className="mr-1 h-3 w-3" /> Submit
              </Button>
            </div>
          </section>

          {/* RIGHT: Status & Checklist */}
          <aside className="lab-scroll flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto pl-1">
            <StatusCard placed={placed} x={x} y={y} z={liveZ} pct={livePct} />
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
            <CopperSulfateWorkspace placed={placed} />
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
                <span>ভর ও ফলাফল</span>
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
                    items={CUSO4_ITEMS}
                    onSelect={handleSelect}
                    highlight={guide ? nextHighlight : null}
                    disabled={() => submitted}
                  />
                </div>
              )}

              {mobileTab === "controls" && (
                <div className="space-y-3">
                  {/* Phase 1: Weighing */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <div className="text-xs font-bold text-slate-200">১. ভর রেকর্ড (Weighing)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={recordEmpty}
                        disabled={
                          submitted ||
                          !placed.crucibleOnBalance ||
                          placed.weighedEmpty ||
                          placed.hydratedSampleMass > 0
                        }
                        className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-200"
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-sky-400" /> Record x (খালি)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={recordHydrated}
                        disabled={submitted || placed.weighedHydrated || placed.hydratedSampleMass < 2.5}
                        className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-200"
                      >
                        Record y (লবণসহ)
                      </Button>
                    </div>
                  </div>

                  {/* Phase 2: Heating */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <div className="text-xs font-bold text-slate-200">২. তাপ দেওয়া (Heating on Tripod)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={moveToTripod}
                        disabled={
                          submitted ||
                          !placed.weighedHydrated ||
                          placed.crucibleOnTripod ||
                          placed.inDesiccator
                        }
                        className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-200"
                      >
                        → ত্রিপদী স্ট্যান্ডে নাও
                      </Button>
                      <Button
                        size="sm"
                        variant={placed.burnerOn ? "destructive" : "default"}
                        onClick={toggleBurner}
                        disabled={submitted || !placed.crucibleOnTripod}
                        className={cn(
                          "h-9 text-xs font-semibold",
                          !placed.burnerOn && "bg-amber-600 hover:bg-amber-500 text-white"
                        )}
                      >
                        <Flame className="mr-1.5 h-3.5 w-3.5" /> {placed.burnerOn ? "বার্নার বন্ধ" : "বার্নার চালু"}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={aggressiveStir}
                      disabled={submitted || !placed.crucibleOnTripod || placed.spilled}
                      className="w-full h-8 text-xs text-amber-300 hover:bg-amber-500/10"
                    >
                      ! জোরে নাড়াচাড়া (ঝুঁকিপূর্ণ)
                    </Button>
                  </div>

                  {/* Phase 3: Desiccator & Final mass */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <div className="text-xs font-bold text-slate-200">৩. শীতলীকরণ ও শুষ্ক ভর (z)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={moveToDesiccator}
                        disabled={submitted || !placed.crucibleOnTripod || placed.burnerOn}
                        className="h-9 text-xs border-sky-500/30 bg-sky-500/10 text-sky-300"
                      >
                        <Snowflake className="mr-1.5 h-3.5 w-3.5 text-sky-400" /> ডেসিকেটরে নাও
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveBackToBalance(false)}
                        disabled={submitted || !placed.inDesiccator || placed.weighedAnhydrous}
                        className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-200"
                      >
                        → ব্যালান্সে নাও (Record z)
                      </Button>
                    </div>
                  </div>

                  {/* Submission */}
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
                      disabled={submitted || !placed.weighedAnhydrous}
                      className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      <Trophy className="mr-1.5 h-4 w-4" /> রিপোর্ট জমা
                    </Button>
                  </div>
                </div>
              )}

              {mobileTab === "info" && (
                <StatusCard placed={placed} x={x} y={y} z={liveZ} pct={livePct} />
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
                        experiment="cuso4_water"
                        defaultTopic="CuSO₄·5H₂O এর কেলাস পানি নির্ণয় ও efflorescence"
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

        {/* ── Chapter 8 Theory Drawer ── */}
        <Drawer open={showTheory} onOpenChange={setShowTheory}>
          <DrawerContent className="max-h-[85dvh] bg-slate-900 text-slate-100 border-slate-800">
            <DrawerHeader className="pb-2 border-b border-slate-800">
              <DrawerTitle className="text-base font-bold flex items-center gap-2 text-sky-400">
                <BookOpen className="h-4 w-4" /> অধ্যায় ৮: তুঁতের (CuSO₄·5H₂O) কেলাস পানি নির্ণয়
              </DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="px-4 py-4 max-h-[70dvh]">
              <div className="prose prose-invert prose-sm max-w-none space-y-4 text-slate-300">
                <div>
                  <h4 className="text-sky-400 font-bold mb-1">১. মূল নীতি (Principle)</h4>
                  <p className="text-xs text-slate-400">
                    নীল বর্ণের তুঁত বা কপার সালফেট পেন্টাহাইড্রেটকে উত্তপ্ত করলে এর কেলাস পানি বাষ্পীভূত হয়ে নির্গত হয় এবং এটি বর্ণহীন/সাদা অনার্দ্র কপার সালফেটে পরিণত হয়:
                  </p>
                  <p className="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-sky-300 text-xs my-2">
                    CuSO₄·5H₂O (s) [নীল] → CuSO₄ (s) [সাদা গুঁড়া] + 5 H₂O (g) ↑
                  </p>
                </div>

                <div>
                  <h4 className="text-sky-400 font-bold mb-1">২. গণনার সূত্র (Calculation Formula)</h4>
                  <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300">
                    <li>খালি ক্রুসিবলের ভর = <span className="font-mono text-sky-300">x</span> g</li>
                    <li>তুঁতসহ ক্রুসিবলের ভর = <span className="font-mono text-sky-300">y</span> g  (নমুনার ভর = y − x)</li>
                    <li>উত্তপ্ত ও ঠান্ডা করার পর অনার্দ্র লবণের ভর = <span className="font-mono text-sky-300">z</span> g  (কেলাস পানির ভর = y − z)</li>
                  </ul>
                  <div className="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-sky-300 text-xs my-2">
                    কেলাস পানির শতকরা হার = [(y − z) / (y − x)] × ১০০ %
                  </div>
                  <p className="text-xs text-slate-400">
                    তাত্ত্বিক আণবিক ভর = ৬৩.৫ + ৩২ + ৬৪ + (৫ × ১৮) = ২৪৯.৫ g/mol। ৫ অণু পানির ভর = ৯০ g।
                    তাত্ত্বিক হার = (৯০ / ২৪৯.৫) × ১০০ = ৩৬.০৭%।
                  </p>
                </div>

                <div>
                  <h4 className="text-sky-400 font-bold mb-1">৩. সতর্কতাসমূহ (Lab Precautions)</h4>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-300">
                    <li><strong className="text-slate-100">ডেসিকেটরে শীতলীকরণ:</strong> গরম ক্রুসিবল বাতাসে ঠান্ডা করলে বায়ুমণ্ডলের জলীয় বাষ্প দ্রুত শোষণ করে ভরের ত্রুটি ঘটবে। তাই সিলিকা জেলযুক্ত ডেসিকেটরে ঠান্ডা করতে হয়।</li>
                    <li><strong className="text-slate-100">ধীর ও সুষম উত্তাপন:</strong> তীব্র তাপে লবণ ছিটকে বাইরে পড়ে গেলে (spillage) ভরের মারাত্মক ঘাটতি দেখা দেয়।</li>
                    <li><strong className="text-slate-100">ধ্রুব ভর নিশ্চিতকরণ:</strong> সম্পূর্ণ সাদা গুঁড়ায় রূপান্তর না হওয়া পর্যন্ত এবং পরপর দুটি পরিমাপে ভর অপরিবর্তিত না থাকা পর্যন্ত উত্তাপন চালিয়ে যেতে হয়।</li>
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
  placed,
  x,
  y,
  z,
  pct,
}: {
  placed: CuSO4Placed;
  x: number;
  y: number;
  z: number;
  pct: number;
}) {
  const color = colorFromFraction(placed.dehydrationFraction);
  const fullDehyd = placed.dehydrationFraction >= 0.99;
  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Live Data · সরাসরি তথ্য
      </h3>
      <div className="rounded-lg bg-[oklch(0.18_0.05_245)] p-3 text-[oklch(0.92_0.18_245)] shadow-inner">
        <div className="grid grid-cols-3 gap-1 text-[9px] opacity-70">
          <span>x (empty)</span>
          <span>y (hydrated)</span>
          <span>z (anhydr.)</span>
        </div>
        <div className="grid grid-cols-3 gap-1 font-mono text-[15px] font-bold">
          <span>{x.toFixed(3)}</span>
          <span>{placed.weighedHydrated ? y.toFixed(3) : "—"}</span>
          <span>{placed.weighedAnhydrous ? z.toFixed(3) : "—"}</span>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1 text-[9px] opacity-60">
          <span>g</span>
          <span>g</span>
          <span>g</span>
        </div>
      </div>

      <div className="rounded-md border bg-muted/40 p-2 text-[11px]">
        <div className="flex justify-between">
          <span>Color</span>
          <span
            className={
              color === "blue"
                ? "font-mono text-blue-700"
                : color === "paleblue"
                  ? "font-mono text-sky-500"
                  : "font-mono text-slate-500"
            }
          >
            {color}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Heating</span>
          <span className="font-mono">
            {placed.heatingTime}s / {HEATING_TIME_FOR_FULL_DEHYDRATION}s
          </span>
        </div>
        <div className="flex justify-between">
          <span>Dehydration</span>
          <span className={fullDehyd ? "font-mono text-emerald-600" : "font-mono text-amber-600"}>
            {(placed.dehydrationFraction * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Cooled (25 °C)</span>
          <span>{placed.cooled ? "✓" : placed.inDesiccator ? `${placed.cooledTime}/5s` : "—"}</span>
        </div>
        <div className="mt-1 flex justify-between border-t pt-1">
          <span>Live %H₂O</span>
          <span
            className={
              Math.abs(pct - THEORETICAL_WATER_PCT) < 1.5
                ? "font-mono font-bold text-emerald-600"
                : "font-mono text-amber-600"
            }
          >
            {pct.toFixed(2)}% / {THEORETICAL_WATER_PCT.toFixed(2)}%
          </span>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>Anhydrous fraction</span>
          <span className="font-mono">{ANHYDROUS_FRACTION.toFixed(4)}</span>
        </div>
      </div>
    </Card>
  );
}
