/**
 * Self-contained Lab for "Preparation of 0.1 M Na2CO3 Standard Solution (250 mL)".
 * Workflow: tare balance → weigh 2.650 g → transfer via funnel → wash down →
 *           fill to 250 mL meniscus → stopper & invert to homogenize.
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
  FlaskRound,
  GraduationCap,
  Droplet,
  Sparkles,
  BookOpen,
  Sliders,
  BarChart3,
  CheckSquare,
  Plus,
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

import EquipmentPanel, { NA2CO3_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import Na2CO3Workspace from "./workspaces/Na2CO3Workspace";
import type { EquipmentId, Mistake, Mode, Na2CO3Placed, Report, Step } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import { setAIContext } from "@/lib/ai-context-store";
import { TARGET_MASS_G, TARGET_VOLUME_ML, gradeNa2CO3, randomWatchGlassMass } from "@/lib/na2co3";

function makeInitial(): Na2CO3Placed {
  return {
    balanceOn: false,
    watchGlassOnBalance: false,
    watchGlassMass: randomWatchGlassMass(),
    tared: false,
    actualAddedMass: 0,
    flaskReady: false,
    funnelOnFlask: false,
    soluteTransferred: false,
    washedDown: false,
    initialDissolved: false,
    addedWaterVolume: 0,
    meniscusChecked: false,
    stoppered: false,
    shaken: false,
  };
}

function buildSteps(): Step[] {
  return [
    {
      id: "tare",
      label: "Tare balance with watch glass · ব্যালান্স Tare করো (watch glass সহ)",
      done: false,
    },
    { id: "weigh", label: "Weigh ~2.650 g Na₂CO₃ · ২.৬৫০ g সোডিয়াম কার্বনেট নাও", done: false },
    {
      id: "setup",
      label: "Place funnel on 250 mL volumetric flask · ফ্লাস্কে ফানেল বসাও",
      done: false,
    },
    {
      id: "transfer",
      label: "Transfer solute into the flask · দ্রব্য ফ্লাস্কে স্থানান্তর করো",
      done: false,
    },
    {
      id: "wash",
      label: "Wash watch glass & funnel with H₂O · ওয়াশ বটল দিয়ে ধুয়ে নাও",
      done: false,
    },
    {
      id: "fill",
      label: "Add water close to 250 mL mark, then meniscus align · 250 mL দাগে meniscus মিলাও",
      done: false,
    },
    {
      id: "homogenize",
      label: "Stopper and invert to homogenize · ছিপি লাগিয়ে মিশাও",
      done: false,
    },
  ];
}

interface Props {
  onBack: () => void;
}

export default function Na2CO3Lab({ onBack }: Props) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("guide");
  const [placed, setPlaced] = useState<Na2CO3Placed>(makeInitial);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [steps, setSteps] = useState<Step[]>(buildSteps);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showPanels, setShowPanels] = useState(true);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [showViva, setShowViva] = useState(false);
  const [mobileTab, setMobileTab] = useState<"equipment" | "controls" | "info" | "guide">(
    "equipment",
  );
  const [showTheory, setShowTheory] = useState(false);

  const startedAtRef = useRef<number | null>(null);
  const guide = mode === "guide";

  // ── AI context ─────────────────────────────────────────────
  useEffect(() => {
    const stepIdx = steps.findIndex((s) => !s.done);
    const chemicals: string[] = [];
    if (placed.actualAddedMass > 0)
      chemicals.push(`Na₂CO₃ (${placed.actualAddedMass.toFixed(3)} g)`);
    if (placed.addedWaterVolume > 0)
      chemicals.push(`H₂O (${placed.addedWaterVolume.toFixed(1)} mL)`);
    const equipment: string[] = [];
    if (placed.balanceOn) equipment.push("Digital balance");
    if (placed.watchGlassOnBalance) equipment.push("Watch glass");
    if (placed.flaskReady) equipment.push("250 mL volumetric flask");
    if (placed.funnelOnFlask) equipment.push("Funnel");
    setAIContext({
      experimentId: "na2co3_standard",
      mode,
      currentStep: stepIdx < 0 ? steps.length : stepIdx,
      mistakesMade: mistakes.map((m) => m.message),
      currentChemicals: chemicals,
      currentEquipment: equipment,
      goal: "Prepare 250 mL of standard 0.1 M Na₂CO₃ solution by weighing 2.650 g (W = SMV/1000), transferring quantitatively through a funnel into a volumetric flask and diluting to the calibration mark.",
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
        case "balance":
          if (placed.balanceOn) return;
          setPlaced((p) => ({ ...p, balanceOn: true }));
          toast.success("Balance ON · 0.000 g");
          break;
        case "watch_glass":
          if (!placed.balanceOn) {
            toast.warning("Turn on the balance first · প্রথমে ব্যালান্স on করো");
            return;
          }
          setPlaced((p) => ({ ...p, watchGlassOnBalance: true }));
          toast(`Watch glass placed · reads ${placed.watchGlassMass.toFixed(3)} g`);
          break;
        case "na2co3_solid":
          if (!placed.watchGlassOnBalance) {
            toast.warning("Place the watch glass on the balance first");
            return;
          }
          if (!placed.tared) {
            logMistake({
              type: "not_tared",
              severity: "med",
              message: "Watch glass tare করা হয়নি · weight Na₂CO₃ + watch glass একসাথে গণ্য হবে।",
            });
          }
          // Add ~0.5 g per click with slight randomness; capped at ~3.2 g
          setPlaced((p) => {
            if (p.actualAddedMass >= 3.2) return p;
            const delta = 0.45 + Math.random() * 0.12;
            const next = Math.min(3.2, p.actualAddedMass + delta);
            return { ...p, actualAddedMass: next };
          });
          break;
        case "volumetric_flask_250":
          if (placed.flaskReady) return;
          setPlaced((p) => ({ ...p, flaskReady: true }));
          completeStep("setup");
          toast.success("250 mL volumetric flask ready");
          break;
        case "funnel":
          if (!placed.flaskReady) {
            toast.warning("Place the volumetric flask first");
            return;
          }
          setPlaced((p) => ({ ...p, funnelOnFlask: true }));
          completeStep("setup");
          toast.success("Funnel on flask");
          break;
        case "wash_bottle":
          if (!placed.flaskReady) {
            toast.warning("Place the volumetric flask first");
            return;
          }
          // Adds water — fine-control via dedicated buttons below
          setPlaced((p) => ({
            ...p,
            addedWaterVolume: Math.min(260, p.addedWaterVolume + 25),
          }));
          break;
        case "stopper":
          if (!placed.flaskReady || placed.addedWaterVolume < 245) {
            toast.warning("Fill to ~250 mL first");
            return;
          }
          setPlaced((p) => ({ ...p, stoppered: true }));
          break;
        case "spatula":
          toast.info("Use Na₂CO₃ button to scoop powder onto the watch glass.");
          break;
      }
    },
    [placed, completeStep, logMistake, submitted],
  );

  // ── Custom actions ────────────────────────────────────────
  const pressTare = () => {
    if (!placed.balanceOn || !placed.watchGlassOnBalance) {
      toast.warning("Place watch glass on the powered balance first");
      return;
    }
    if (placed.actualAddedMass > 0) {
      toast.warning("Tare BEFORE adding chemical · দ্রব্য যোগের আগে Tare করো");
      return;
    }
    setPlaced((p) => ({ ...p, tared: true }));
    completeStep("tare");
    toast.success("Tared · display reset to 0.000 g");
  };

  const finishWeighing = () => {
    if (placed.actualAddedMass < 0.1) {
      toast.warning("Add some Na₂CO₃ first");
      return;
    }
    completeStep("weigh");
    const err = Math.abs(placed.actualAddedMass - TARGET_MASS_G);
    if (err < 0.05) toast.success(`✓ ${placed.actualAddedMass.toFixed(3)} g (target 2.650 g)`);
    else toast(`Recorded: ${placed.actualAddedMass.toFixed(3)} g`);
  };

  const transferSolute = () => {
    if (placed.actualAddedMass < 0.1) {
      toast.warning("Weigh the Na₂CO₃ first");
      return;
    }
    if (!placed.flaskReady) {
      toast.warning("Place the volumetric flask first");
      return;
    }
    if (!placed.funnelOnFlask) {
      logMistake({
        type: "no_funnel_pour",
        severity: "high",
        message: "ফানেল ছাড়া পাউডার ঢালা হয়েছে · spillage হবে, analyte নষ্ট হবে!",
      });
      // simulate ~30% loss
      setPlaced((p) => ({
        ...p,
        soluteTransferred: true,
        actualAddedMass: p.actualAddedMass * 0.7,
      }));
      completeStep("transfer");
      return;
    }
    setPlaced((p) => ({ ...p, soluteTransferred: true }));
    completeStep("transfer");
    toast.success("Solute transferred through funnel");
  };

  const washDown = () => {
    if (!placed.soluteTransferred) {
      toast.warning("Transfer the solute first");
      return;
    }
    setPlaced((p) => ({
      ...p,
      washedDown: true,
      initialDissolved: true,
      addedWaterVolume: Math.max(p.addedWaterVolume, 50),
    }));
    completeStep("wash");
    toast.success("Watch glass & funnel rinsed · all particles in flask");
  };

  const addWater = (mL: number) => {
    if (!placed.flaskReady) {
      toast.warning("Place the volumetric flask first");
      return;
    }
    setPlaced((p) => {
      const next = Math.min(260, p.addedWaterVolume + mL);
      if (p.addedWaterVolume <= 252 && next > 252) {
        logMistake({
          type: "overfill_meniscus",
          severity: "high",
          message: "250 mL দাগ ছাড়িয়ে গেছে · over-diluted solution. পুনরায় শুরু করতে হবে।",
        });
      }
      return { ...p, addedWaterVolume: next };
    });
  };

  const checkMeniscus = () => {
    if (Math.abs(placed.addedWaterVolume - 250) > 2) {
      toast.warning(`Off by ${(placed.addedWaterVolume - 250).toFixed(1)} mL · adjust first`);
      return;
    }
    // snap to exactly 250 if within 1.5 mL
    setPlaced((p) => ({
      ...p,
      meniscusChecked: true,
      addedWaterVolume: Math.abs(p.addedWaterVolume - 250) < 1.5 ? 250 : p.addedWaterVolume,
    }));
    completeStep("fill");
    toast.success("✓ Lower meniscus aligned with 250 mL ring");
  };

  const shakeFlask = () => {
    if (!placed.meniscusChecked || placed.addedWaterVolume < 249) {
      logMistake({
        type: "shaken_early",
        severity: "low",
        message: "Mark পর্যন্ত পানি না দিয়েই shake করা হয়েছে · meniscus alignment ভুল হবে।",
      });
      return;
    }
    if (!placed.stoppered) {
      toast.warning("Stopper the flask before inverting");
      return;
    }
    setPlaced((p) => ({ ...p, shaken: true }));
    completeStep("homogenize");
    toast.success("Solution homogenized · standard 0.1 M ready");
  };

  // ── Submit / reset ─────────────────────────────────────────
  const submit = () => {
    if (!placed.washedDown) {
      logMistake({
        type: "not_washed_down",
        severity: "med",
        message: "Watch glass / funnel ধোয়া হয়নি · low recovery, প্রকৃত concentration কম হবে।",
      });
    }
    const high = mistakes.filter((m) => m.severity === "high").length;
    const med = mistakes.filter((m) => m.severity === "med").length;
    const low = mistakes.filter((m) => m.severity === "low").length;
    const actualVol = placed.addedWaterVolume || TARGET_VOLUME_ML;
    const g = gradeNa2CO3({
      actualMassG: placed.actualAddedMass,
      actualVolumeMl: actualVol,
      tared: placed.tared,
      funnelUsed: placed.funnelOnFlask,
      washedDown: placed.washedDown,
      shakenEarly: mistakes.some((m) => m.type === "shaken_early"),
      overFilled: actualVol > 252,
      highMistakes: high,
      medMistakes: med,
      lowMistakes: low,
    });
    const r: Report = {
      experiment: "na2co3_standard",
      actualMassG: placed.actualAddedMass,
      actualVolumeMl: actualVol,
      finalMolarity: g.finalMolarity,
      massError: g.massError,
      volumeError: g.volumeError,
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
    toast.success(`Submitted! Grade: ${r.grade} · ${g.finalMolarity.toFixed(3)} M`);
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
    if (!placed.balanceOn) return "Click Balance to power it on.";
    if (!placed.watchGlassOnBalance) return "Place the watch glass on the balance pan.";
    if (!placed.tared) return "Press TARE to zero out the watch-glass mass.";
    if (placed.actualAddedMass < 2.6 || placed.actualAddedMass > 2.7)
      return `Add Na₂CO₃ until display ≈ 2.650 g (currently ${placed.actualAddedMass.toFixed(3)} g).`;
    if (!steps.find((s) => s.id === "weigh")?.done)
      return "Click 'Record mass' to lock the weight.";
    if (!placed.flaskReady) return "Place the 250 mL volumetric flask.";
    if (!placed.funnelOnFlask) return "Place the funnel on the flask mouth.";
    if (!placed.soluteTransferred) return "Click 'Transfer solute' to pour through the funnel.";
    if (!placed.washedDown) return "Use 'Wash down' to rinse watch glass & funnel.";
    if (placed.addedWaterVolume < 240) return "Add water until close to the 250 mL mark.";
    if (!placed.meniscusChecked)
      return "Use 'Check meniscus' to align the lower meniscus with the ring.";
    if (!placed.stoppered) return "Place the stopper on the flask.";
    if (!placed.shaken) return "Invert/shake to homogenize the solution.";
    return "Done — Submit your report.";
  }, [placed, steps]);

  const nextHighlight: EquipmentId | null = useMemo(() => {
    if (!placed.balanceOn) return "balance";
    if (!placed.watchGlassOnBalance) return "watch_glass";
    if (placed.actualAddedMass < 2.6) return "na2co3_solid";
    if (!placed.flaskReady) return "volumetric_flask_250";
    if (!placed.funnelOnFlask) return "funnel";
    if (placed.washedDown && placed.addedWaterVolume < 240) return "wash_bottle";
    if (placed.meniscusChecked && !placed.stoppered) return "stopper";
    return null;
  }, [placed]);

  const targetDelta = placed.actualAddedMass - TARGET_MASS_G;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100 select-none">
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
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <FlaskRound className="h-4 w-4" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-xs font-black tracking-tight sm:text-sm text-slate-100">
                  0.1 M Na₂CO₃ Standard · প্রমাণ দ্রবণ প্রস্তুতি
                </div>
                <div className="hidden truncate text-[10px] text-emerald-400/80 sm:block font-mono">
                  W = (S × M × V)/1000 = (0.1 × 106 × 250)/1000 = 2.650 g
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <ModeToggle mode={mode} setMode={setMode} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTheory(true)}
                className="hidden h-7 gap-1 border-emerald-500/30 bg-emerald-500/10 px-2 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 sm:flex"
              >
                <BookOpen className="h-3 w-3" />
                <span>অধ্যায় ৬ থিওরি</span>
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
                items={NA2CO3_ITEMS}
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
                <Na2CO3Workspace placed={placed} />
              </div>

              {/* Desktop Action Pill Bar */}
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={pressTare}
                  disabled={submitted || !placed.watchGlassOnBalance || placed.tared}
                  className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                >
                  <Sparkles className="mr-1 h-3 w-3 text-sky-400" /> Tare
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={finishWeighing}
                  disabled={submitted || placed.actualAddedMass < 0.1}
                  className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                >
                  Record mass
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={transferSolute}
                  disabled={submitted || placed.soluteTransferred || placed.actualAddedMass < 0.1}
                  className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                >
                  ↓ ফ্লাস্কে ঢালো
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={washDown}
                  disabled={submitted || placed.washedDown || !placed.soluteTransferred}
                  className="h-7 px-2 text-xs border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                >
                  <Droplet className="mr-1 h-3 w-3" /> ধৌত করো
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addWater(25)}
                  disabled={submitted || !placed.flaskReady || placed.addedWaterVolume >= 250}
                  className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                >
                  +২৫ mL পানি
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkMeniscus}
                  disabled={submitted || placed.addedWaterVolume < 240}
                  className="h-7 px-2 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                >
                  Meniscus দাগ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={shakeFlask}
                  disabled={submitted || !placed.stoppered}
                  className="h-7 px-2 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                >
                  Shake
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
                  disabled={submitted}
                  className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  <Trophy className="mr-1 h-3 w-3" /> Submit
                </Button>
              </div>
            </section>

            {/* RIGHT: Status & Checklist */}
            <aside className="lab-scroll flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto pl-1">
              <StatusCard placed={placed} targetDelta={targetDelta} />
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
              <Na2CO3Workspace placed={placed} />
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
                      ? "bg-slate-800 text-emerald-400 shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200",
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
                      ? "bg-slate-800 text-emerald-400 shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  <Plus className="h-3 w-3" />
                  <span>কন্ট্রোলস</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab("info")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md py-1.5 transition",
                    mobileTab === "info"
                      ? "bg-slate-800 text-emerald-400 shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  <BarChart3 className="h-3 w-3" />
                  <span>ঘনমাত্রা ও ভর</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab("guide")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md py-1.5 transition",
                    mobileTab === "guide"
                      ? "bg-slate-800 text-emerald-400 shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200",
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
                      items={NA2CO3_ITEMS}
                      onSelect={handleSelect}
                      highlight={guide ? nextHighlight : null}
                      disabled={() => submitted}
                    />
                  </div>
                )}

                {mobileTab === "controls" && (
                  <div className="space-y-3">
                    {/* Phase 1: Tare & Mass */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                      <div className="text-xs font-bold text-slate-200">
                        ১. ব্যালান্স ও ওজন (Weighing)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={pressTare}
                          disabled={submitted || !placed.watchGlassOnBalance || placed.tared}
                          className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-200"
                        >
                          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-sky-400" /> Tare (শূন্য করো)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={finishWeighing}
                          disabled={submitted || placed.actualAddedMass < 0.1}
                          className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-200"
                        >
                          ভর রেকর্ড করো
                        </Button>
                      </div>
                    </div>

                    {/* Phase 2: Transfer & Washing */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                      <div className="text-xs font-bold text-slate-200">২. ফ্লাস্কে দ্রবণ তৈরি</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={transferSolute}
                          disabled={
                            submitted || placed.soluteTransferred || placed.actualAddedMass < 0.1
                          }
                          className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-200"
                        >
                          ↓ দ্রাব স্থানান্তর
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={washDown}
                          disabled={submitted || placed.washedDown || !placed.soluteTransferred}
                          className="h-9 text-xs border-sky-500/30 bg-sky-500/10 text-sky-300"
                        >
                          <Droplet className="mr-1.5 h-3.5 w-3.5 text-sky-400" /> ফানেল ধৌত করো
                        </Button>
                      </div>
                    </div>

                    {/* Phase 3: Water addition */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                      <div className="text-xs font-bold text-slate-200">
                        ৩. ২৫০ mL দাগ পর্যন্ত পানি যোগ
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[50, 25, 5, 1].map((v) => (
                          <Button
                            key={v}
                            size="sm"
                            variant="outline"
                            onClick={() => addWater(v)}
                            disabled={
                              submitted || !placed.flaskReady || placed.addedWaterVolume >= 260
                            }
                            className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-200"
                          >
                            +{v} mL
                          </Button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={checkMeniscus}
                          disabled={submitted || placed.addedWaterVolume < 240}
                          className="h-9 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        >
                          Meniscus দাগ যাচাই
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={shakeFlask}
                          disabled={submitted || !placed.stoppered}
                          className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-200"
                        >
                          ছিপি লাগিয়ে ঝাঁকাও
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
                        disabled={submitted}
                        className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        <Trophy className="mr-1.5 h-4 w-4" /> রিপোর্ট জমা
                      </Button>
                    </div>
                  </div>
                )}

                {mobileTab === "info" && <StatusCard placed={placed} targetDelta={targetDelta} />}

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
                          experiment="na2co3_standard"
                          defaultTopic="0.1 M Na₂CO₃ প্রমাণ দ্রবণ প্রস্তুতি ও primary standard substance"
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

        {/* ── Chapter 6 Theory Drawer ── */}
        <Drawer open={showTheory} onOpenChange={setShowTheory}>
          <DrawerContent className="max-h-[85dvh] bg-slate-900 text-slate-100 border-slate-800">
            <DrawerHeader className="pb-2 border-b border-slate-800">
              <DrawerTitle className="text-base font-bold flex items-center gap-2 text-emerald-400">
                <BookOpen className="h-4 w-4" /> অধ্যায় ৬: ০.১ M Na₂CO₃ প্রমাণ দ্রবণ প্রস্তুতি
              </DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="px-4 py-4 max-h-[70dvh]">
              <div className="prose prose-invert prose-sm max-w-none space-y-4 text-slate-300">
                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">
                    ১. প্রমাণ দ্রবণ ও প্রাথমিক স্ট্যান্ডার্ড (Primary Standard)
                  </h4>
                  <p className="text-xs text-slate-400">
                    যে দ্রবণের ঘনমাত্রা সঠিকভাবে জানা থাকে তাকে{" "}
                    <strong>প্রমাণ দ্রবণ (Standard Solution)</strong> বলে। সোডিয়াম কার্বনেট
                    (Na₂CO₃) একটি প্রাইমারি স্ট্যান্ডার্ড পদার্থ কারণ এটি বিশুদ্ব অবস্থায় পাওয়া
                    যায়, বায়ুমণ্ডলের জলীয় বাষ্প বা অক্সিজেন দ্বারা সহজে পরিবর্তিত হয় না এবং এর
                    প্রস্তুতকৃত দ্রবণের ঘনমাত্রা দীর্ঘকাল অপরিবর্তিত থাকে।
                  </p>
                </div>

                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">
                    ২. প্রয়োজনীয় ভরের গণনা (Stoichiometry)
                  </h4>
                  <p className="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-emerald-300 text-xs my-2">
                    W = (S × M × V) / ১০০০ গ্রাম
                  </p>
                  <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300">
                    <li>কাঙ্ক্ষিত মোলারিটি (S) = ০.১ M (mol/L)</li>
                    <li>Na₂CO₃ এর মোলার ভর (M) = (২৩ × ২) + ১২ + (১৬ × ৩) = ১০৬ g/mol</li>
                    <li>আয়তনমিতিক ফ্লাস্কের আয়তন (V) = ২৫০ mL</li>
                    <li>
                      প্রয়োজনীয় ভর W = (০.১ × ১০৬ × ২৫০) / ১০০০ ={" "}
                      <span className="font-bold text-emerald-300">২.৬৫০ গ্রাম</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">
                    ৩. মেনিসকাস ও সমসত্ত্বকরণ (Meniscus & Homogenization)
                  </h4>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-300">
                    <li>
                      <strong className="text-slate-100">নিম্ন মেনিসকাস:</strong> বর্ণহীন দ্রবণের
                      ক্ষেত্রে অবতল মেনিসকাসের নিম্নতল (Lower Meniscus) ২৫০ mL এর রিং-চিহ্নের
                      সমান্তরাল হতে হবে।
                    </li>
                    <li>
                      <strong className="text-slate-100">ওয়াশ বোতল দিয়ে ধৌতকরণ:</strong> ফানেল ও
                      ওয়াচ গ্লাসে লেগে থাকা দ্রাব ওয়াশ বোতলের পাতিত পানি দিয়ে সম্পূর্ণরূপে
                      ফ্লাস্কে নামাতে হবে।
                    </li>
                    <li>
                      <strong className="text-slate-100">উলট-পালট করে ঝাঁকানো:</strong> ছিপি ভালো
                      করে এঁটে ফ্লাস্কটিকে উল্টে-পাল্টে কয়েকবার ঝাঁকাতে হবে যাতে সম্পূর্ণ দ্রবণ
                      সুষম ও সমসত্ত্ব হয়।
                    </li>
                  </ul>
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

function StatusCard({ placed, targetDelta }: { placed: Na2CO3Placed; targetDelta: number }) {
  const massPct = Math.min(100, (placed.actualAddedMass / TARGET_MASS_G) * 100);
  const volPct = Math.min(100, (placed.addedWaterVolume / TARGET_VOLUME_ML) * 100);
  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Live Data · সরাসরি তথ্য
      </h3>
      <div className="rounded-lg bg-[oklch(0.18_0.05_145)] p-3 text-[oklch(0.92_0.18_145)] shadow-inner">
        <div className="flex justify-between text-[10px] opacity-70">
          <span>MASS (g)</span>
          <span>VOLUME (mL)</span>
        </div>
        <div className="flex justify-between font-mono text-xl font-bold">
          <span>{placed.actualAddedMass.toFixed(3)}</span>
          <span>{placed.addedWaterVolume.toFixed(1)}</span>
        </div>
        <div className="mt-1 flex justify-between text-[9px] opacity-60">
          <span>target 2.650</span>
          <span>target 250.0</span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <ProgressRow
          label="Mass progress"
          value={`${placed.actualAddedMass.toFixed(3)} g`}
          pct={massPct}
        />
        <ProgressRow
          label="Volume progress"
          value={`${placed.addedWaterVolume.toFixed(0)} mL`}
          pct={volPct}
        />
      </div>

      <div className="rounded-md border bg-muted/40 p-2 text-[10px]">
        <div className="flex justify-between">
          <span>Δ mass</span>
          <span
            className={
              Math.abs(targetDelta) < 0.05
                ? "text-emerald-600 font-mono"
                : "text-amber-600 font-mono"
            }
          >
            {targetDelta >= 0 ? "+" : ""}
            {targetDelta.toFixed(3)} g
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tared</span>
          <span>{placed.tared ? "✓" : "✗"}</span>
        </div>
        <div className="flex justify-between">
          <span>Funnel used</span>
          <span>{placed.funnelOnFlask ? "✓" : "✗"}</span>
        </div>
        <div className="flex justify-between">
          <span>Washed down</span>
          <span>{placed.washedDown ? "✓" : "✗"}</span>
        </div>
        <div className="flex justify-between">
          <span>Meniscus aligned</span>
          <span>{placed.meniscusChecked ? "✓" : "✗"}</span>
        </div>
      </div>
    </Card>
  );
}

function ProgressRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
