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
} from "lucide-react";

import TeacherViva, { type VivaQuestion } from "@/components/viva/TeacherViva";
import StudentViva from "@/components/viva/StudentViva";

import EquipmentPanel, { NA2CO3_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import Na2CO3Workspace from "./workspaces/Na2CO3Workspace";
import type {
  EquipmentId,
  Mistake,
  Mode,
  Na2CO3Placed,
  Report,
  Step,
} from "./types";
import { setAIContext } from "@/lib/ai-context-store";
import {
  TARGET_MASS_G,
  TARGET_VOLUME_ML,
  gradeNa2CO3,
  randomWatchGlassMass,
} from "@/lib/na2co3";

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
    { id: "tare", label: "Tare balance with watch glass · ব্যালান্স Tare করো (watch glass সহ)", done: false },
    { id: "weigh", label: "Weigh ~2.650 g Na₂CO₃ · ২.৬৫০ g সোডিয়াম কার্বনেট নাও", done: false },
    { id: "setup", label: "Place funnel on 250 mL volumetric flask · ফ্লাস্কে ফানেল বসাও", done: false },
    { id: "transfer", label: "Transfer solute into the flask · দ্রব্য ফ্লাস্কে স্থানান্তর করো", done: false },
    { id: "wash", label: "Wash watch glass & funnel with H₂O · ওয়াশ বটল দিয়ে ধুয়ে নাও", done: false },
    { id: "fill", label: "Add water close to 250 mL mark, then meniscus align · 250 mL দাগে meniscus মিলাও", done: false },
    { id: "homogenize", label: "Stopper and invert to homogenize · ছিপি লাগিয়ে মিশাও", done: false },
  ];
}

interface Props {
  onBack: () => void;
}

export default function Na2CO3Lab({ onBack }: Props) {
  const [mode, setMode] = useState<Mode>("guide");
  const [placed, setPlaced] = useState<Na2CO3Placed>(makeInitial);
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
    if (placed.actualAddedMass > 0) chemicals.push(`Na₂CO₃ (${placed.actualAddedMass.toFixed(3)} g)`);
    if (placed.addedWaterVolume > 0) chemicals.push(`H₂O (${placed.addedWaterVolume.toFixed(1)} mL)`);
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
      goal:
        "Prepare 250 mL of standard 0.1 M Na₂CO₃ solution by weighing 2.650 g (W = SMV/1000), transferring quantitatively through a funnel into a volumetric flask and diluting to the calibration mark.",
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
        message:
          "ফানেল ছাড়া পাউডার ঢালা হয়েছে · spillage হবে, analyte নষ্ট হবে!",
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
          message:
            "250 mL দাগ ছাড়িয়ে গেছে · over-diluted solution. পুনরায় শুরু করতে হবে।",
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
        message:
          "Watch glass / funnel ধোয়া হয়নি · low recovery, প্রকৃত concentration কম হবে।",
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
    if (!steps.find((s) => s.id === "weigh")?.done) return "Click 'Record mass' to lock the weight.";
    if (!placed.flaskReady) return "Place the 250 mL volumetric flask.";
    if (!placed.funnelOnFlask) return "Place the funnel on the flask mouth.";
    if (!placed.soluteTransferred) return "Click 'Transfer solute' to pour through the funnel.";
    if (!placed.washedDown) return "Use 'Wash down' to rinse watch glass & funnel.";
    if (placed.addedWaterVolume < 240) return "Add water until close to the 250 mL mark.";
    if (!placed.meniscusChecked) return "Use 'Check meniscus' to align the lower meniscus with the ring.";
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
      <div className="min-h-screen p-3 md:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Experiments
            </Button>
            <FlaskRound className="h-6 w-6 text-emerald-600" />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                0.1 M Na₂CO₃ Standard Solution · প্রমাণ দ্রবণ
              </h1>
              <p className="text-xs text-muted-foreground">
                W = (S × M × V) / 1000 = (0.1 × 106 × 250)/1000 = 2.650 g
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
                items={NA2CO3_ITEMS}
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
              <Na2CO3Workspace placed={placed} />
            </div>

            {/* Action panel */}
            <div className="absolute bottom-3 left-1/2 z-10 flex max-w-[96%] -translate-x-1/2 flex-wrap justify-center gap-1.5 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
              <Button
                size="sm"
                variant="outline"
                onClick={pressTare}
                disabled={submitted || !placed.watchGlassOnBalance || placed.tared}
                className="h-7 px-2 text-[10px]"
              >
                <Sparkles className="mr-1 h-3 w-3" /> Tare
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={finishWeighing}
                disabled={submitted || placed.actualAddedMass < 0.1}
                className="h-7 px-2 text-[10px]"
              >
                ✓ Record mass
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={transferSolute}
                disabled={submitted || placed.soluteTransferred || placed.actualAddedMass < 0.1}
                className="h-7 px-2 text-[10px]"
              >
                ↓ Transfer solute
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={washDown}
                disabled={submitted || placed.washedDown || !placed.soluteTransferred}
                className="h-7 px-2 text-[10px]"
              >
                <Droplet className="mr-1 h-3 w-3" /> Wash down
              </Button>
              <div className="flex items-center gap-1 border-l pl-2">
                <span className="text-[10px] font-semibold text-muted-foreground">+H₂O:</span>
                {[50, 25, 5, 1].map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant="ghost"
                    onClick={() => addWater(v)}
                    disabled={submitted || !placed.flaskReady}
                    className="h-7 px-1.5 text-[10px]"
                  >
                    +{v}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkMeniscus}
                  disabled={submitted || placed.addedWaterVolume < 240}
                  className="h-7 px-2 text-[10px]"
                >
                  Meniscus
                </Button>
              </div>
              <div className="flex items-center gap-1 border-l pl-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={shakeFlask}
                  disabled={submitted || !placed.stoppered}
                  className="h-7 px-2 text-[10px]"
                >
                  Shake
                </Button>
              </div>
              <div className="flex items-center gap-1 border-l pl-2">
                <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-[10px]">
                  <RotateCcw className="mr-1 h-3 w-3" /> Reset
                </Button>
                <Button size="sm" onClick={submit} disabled={submitted} className="h-7 px-2 text-[10px]">
                  <Trophy className="mr-1 h-3 w-3" /> Submit
                </Button>
              </div>
            </div>
          </section>

          {showPanels && (
            <div className="space-y-3">
              <StatusCard placed={placed} targetDelta={targetDelta} />
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
              experiment="na2co3_standard"
              defaultTopic="0.1 M Na₂CO₃ প্রমাণ দ্রবণ প্রস্তুতি ও primary standard substance"
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
  targetDelta,
}: {
  placed: Na2CO3Placed;
  targetDelta: number;
}) {
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
        <ProgressRow label="Mass progress" value={`${placed.actualAddedMass.toFixed(3)} g`} pct={massPct} />
        <ProgressRow label="Volume progress" value={`${placed.addedWaterVolume.toFixed(0)} mL`} pct={volPct} />
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
