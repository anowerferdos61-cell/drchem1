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
} from "lucide-react";

import TeacherViva, { type VivaQuestion } from "@/components/viva/TeacherViva";
import StudentViva from "@/components/viva/StudentViva";

import EquipmentPanel, { CUSO4_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import CopperSulfateWorkspace from "./workspaces/CopperSulfateWorkspace";
import type {
  CuSO4Placed,
  EquipmentId,
  Mistake,
  Mode,
  Report,
  Step,
} from "./types";
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
    { id: "weigh_hydrated", label: "Add 3–5 g blue vitriol & weigh (y) · নীল তুঁতে যোগ করে ওজন", done: false },
    { id: "setup_heat", label: "Place on tripod + wire gauze · ত্রিপদীতে বসাও", done: false },
    { id: "heat", label: "Heat & stir until white · সাদা হওয়া পর্যন্ত উত্তপ্ত করো", done: false },
    { id: "cool", label: "Cool in desiccator · ডেসিকেটরে ঠান্ডা করো", done: false },
    { id: "weigh_anhydrous", label: "Weigh anhydrous mass (z) · শুষ্ক পদার্থের ওজন (z)", done: false },
  ];
}

interface Props {
  onBack: () => void;
}

export default function CopperSulfateLab({ onBack }: Props) {
  const [mode, setMode] = useState<Mode>("guide");
  const [placed, setPlaced] = useState<CuSO4Placed>(makeInitial);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [steps, setSteps] = useState<Step[]>(buildSteps);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showPanels, setShowPanels] = useState(true);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [showViva, setShowViva] = useState(false);

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
      goal:
        "Determine the percentage of crystallization water in CuSO₄·5H₂O by heating to constant mass and applying %H₂O = (y − z)/(y − x) × 100 (theoretical 36.07%).",
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
        message:
          "গরম অবস্থায় ওজন নেওয়া হয়েছে · convection currents-এর জন্য reading ভুল।",
      });
    }
    completeStep("cool");
    const frac = placed.dehydrationFraction;
    const zClean = computeAnhydrousMass(
      placed.emptyCrucibleMass,
      placed.hydratedSampleMass,
      frac,
    );
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
    if (placed.hydratedSampleMass < 2.5) return "Add ~3–5 g of CuSO₄·5H₂O (blue vitriol) to the crucible.";
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
    if (placed.inDesiccator && !placed.cooled)
      return `Wait for cooling… ${placed.cooledTime}/5 s`;
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
      <div className="min-h-screen p-3 md:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Experiments
            </Button>
            <Droplet className="h-6 w-6 text-sky-600" />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Crystallization Water in CuSO₄·5H₂O · কেলাস পানি নির্ণয়
              </h1>
              <p className="text-xs text-muted-foreground">
                %H₂O = (y − z)/(y − x) × 100 · theoretical 36.07 %
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ModeToggle mode={mode} setMode={setMode} />
            <Button variant="outline" size="sm" onClick={() => setShowPanels((v) => !v)}>
              {showPanels ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
              {showPanels ? "Hide" : "Show"} panels
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowViva((v) => !v)}>
              <GraduationCap className="mr-1 h-4 w-4" />
              {showViva ? "Hide Viva" : "AI Viva"}
            </Button>
          </div>
        </header>

        <div
          className={[
            "grid gap-4",
            showPanels ? "lg:grid-cols-[260px_1fr_280px]" : "grid-cols-1",
          ].join(" ")}
        >
          {showPanels && (
            <div className="space-y-3">
              <EquipmentPanel
                items={CUSO4_ITEMS}
                onSelect={handleSelect}
                highlight={guide ? nextHighlight : null}
                disabled={() => submitted}
              />
            </div>
          )}

          <section
            className="relative rounded-2xl border bg-card/60 shadow-xl backdrop-blur"
            style={{ minHeight: 540 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/equipment") as EquipmentId;
              if (id) handleSelect(id);
            }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <CopperSulfateWorkspace placed={placed} />
            </div>

            {/* Action panel */}
            <div className="absolute bottom-3 left-1/2 z-10 flex max-w-[96%] -translate-x-1/2 flex-wrap justify-center gap-1.5 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
              <Button
                size="sm"
                variant="outline"
                onClick={recordEmpty}
                disabled={submitted || !placed.crucibleOnBalance || placed.weighedEmpty || placed.hydratedSampleMass > 0}
                className="h-7 px-2 text-[10px]"
              >
                <Sparkles className="mr-1 h-3 w-3" /> Record x
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={recordHydrated}
                disabled={submitted || placed.weighedHydrated || placed.hydratedSampleMass < 2.5}
                className="h-7 px-2 text-[10px]"
              >
                ✓ Record y
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={moveToTripod}
                disabled={submitted || !placed.weighedHydrated || placed.crucibleOnTripod || placed.inDesiccator}
                className="h-7 px-2 text-[10px]"
              >
                → Tripod
              </Button>
              <Button
                size="sm"
                variant={placed.burnerOn ? "default" : "outline"}
                onClick={toggleBurner}
                disabled={submitted || !placed.crucibleOnTripod}
                className="h-7 px-2 text-[10px]"
              >
                <Flame className="mr-1 h-3 w-3" /> {placed.burnerOn ? "Stop" : "Light"} Burner
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={aggressiveStir}
                disabled={submitted || !placed.crucibleOnTripod || placed.spilled}
                className="h-7 px-2 text-[10px]"
                title="Stir aggressively (risk of spillage)"
              >
                ! Stir hard
              </Button>
              <div className="flex items-center gap-1 border-l pl-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={moveToDesiccator}
                  disabled={submitted || !placed.crucibleOnTripod || placed.burnerOn}
                  className="h-7 px-2 text-[10px]"
                >
                  <Snowflake className="mr-1 h-3 w-3" /> Desiccator
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={touchBare}
                  disabled={submitted || !placed.inDesiccator || placed.cooled}
                  className="h-7 px-2 text-[10px]"
                  title="Touch with bare hand (unsafe)"
                >
                  ✋ Bare touch
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveBackToBalance(false)}
                  disabled={submitted || !placed.inDesiccator || placed.weighedAnhydrous}
                  className="h-7 px-2 text-[10px]"
                >
                  → Balance (z)
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveBackToBalance(true)}
                  disabled={submitted || !placed.inDesiccator || placed.cooled || placed.weighedAnhydrous}
                  className="h-7 px-2 text-[10px]"
                  title="Weigh while still hot (unsafe)"
                >
                  ! Weigh hot
                </Button>
              </div>
              <div className="flex items-center gap-1 border-l pl-2">
                <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-[10px]">
                  <RotateCcw className="mr-1 h-3 w-3" /> Reset
                </Button>
                <Button size="sm" onClick={submit} disabled={submitted || !placed.weighedAnhydrous} className="h-7 px-2 text-[10px]">
                  <Trophy className="mr-1 h-3 w-3" /> Submit
                </Button>
              </div>
            </div>
          </section>

          {showPanels && (
            <div className="space-y-3">
              <StatusCard
                placed={placed}
                x={x}
                y={y}
                z={liveZ}
                pct={livePct}
              />
              {mode !== "student" && (
                <StepsPanel
                  steps={steps}
                  mistakes={mistakes}
                  guideMode={guide}
                  nextHint={guide ? nextHint : undefined}
                />
              )}
            </div>
          )}
        </div>

        {report && (
          <div className="mt-6">
            <LabReport report={report} onReset={reset} />
          </div>
        )}

        {showViva && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <TeacherViva
              onPublish={setVivaQuestions}
              experiment="cuso4_water"
              defaultTopic="CuSO₄·5H₂O এর কেলাস পানি নির্ণয় ও efflorescence"
            />
            <StudentViva />
            {vivaQuestions.length === 0 && (
              <p className="col-span-full text-center text-xs text-muted-foreground">
                শিক্ষক প্রশ্ন তৈরি করে Publish করবেন · ছাত্র উত্তর দিলে AI গ্রেড করবে।
              </p>
            )}
          </div>
        )}
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
