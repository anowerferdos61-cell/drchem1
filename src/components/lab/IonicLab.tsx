/**
 * Self-contained Lab for "Properties of Ionic & Covalent Compounds + Electrolysis of CuSO₄".
 * 4 stages: Solubility → Conductivity → Melting → Electrolysis.
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
  Zap,
  Flame,
  GraduationCap,
  Beaker as BeakerIcon,
  Pause,
} from "lucide-react";

import TeacherViva, { type VivaQuestion } from "@/components/viva/TeacherViva";
import StudentViva from "@/components/viva/StudentViva";

import EquipmentPanel, { IONIC_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import IonicWorkspace from "./workspaces/IonicWorkspace";
import type {
  EquipmentId,
  IonicPlaced,
  IonicSubstance,
  Mistake,
  Mode,
  Report,
  Step,
} from "./types";
import { setAIContext } from "@/lib/ai-context-store";
import {
  CONDUCTIVITY_TRUTH,
  LABELS,
  MELTING_TRUTH,
  SOLUBILITY_TRUTH,
  gradeIonic,
} from "@/lib/ionic";

const INITIAL: IonicPlaced = {
  beakersReady: false,
  waterAdded: false,
  solubility: { nacl: null, sugar: null, naphthalene: null, cuso4: null },
  circuitReady: false,
  conductivityTested: { nacl: null, sugar: null, naphthalene: null, cuso4: null },
  meltingReady: false,
  meltResult: { nacl: null, sugar: null, naphthalene: null, cuso4: null },
  cellReady: false,
  cuso4InCell: false,
  electrodesPlaced: false,
  batteryConnected: false,
  polarityCorrect: true,
  electrolysisRun: false,
  copperDeposit: 0,
};

function buildSteps(): Step[] {
  return [
    {
      id: "solubility",
      label:
        "Test solubility of NaCl, Sugar, Naphthalene, CuSO₄ in water · চারটি পদার্থের দ্রবণীয়তা পরীক্ষা করো।",
      done: false,
    },
    {
      id: "conductivity",
      label:
        "Set up a circuit and test which solutions light the bulb · সার্কিট সাজিয়ে তড়িৎ পরিবাহিতা পরীক্ষা করো।",
      done: false,
    },
    {
      id: "melting",
      label:
        "Heat each substance on a spatula and observe melting · প্রতিটি পদার্থকে তাপ দিয়ে গলনাঙ্ক পরীক্ষা করো।",
      done: false,
    },
    {
      id: "electrolysis",
      label:
        "Electrolyse CuSO₄ solution and observe copper deposit at cathode · CuSO₄ এর তড়িৎ বিশ্লেষণ করো।",
      done: false,
    },
  ];
}

const SUB_LIST: IonicSubstance[] = ["nacl", "sugar", "naphthalene", "cuso4"];

interface Props {
  onBack: () => void;
}

export default function IonicLab({ onBack }: Props) {
  const [mode, setMode] = useState<Mode>("guide");
  const [placed, setPlaced] = useState<IonicPlaced>(INITIAL);
  const [activeSubstance, setActiveSubstance] = useState<IonicSubstance | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [steps, setSteps] = useState<Step[]>(buildSteps);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showPanels, setShowPanels] = useState(true);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [showViva, setShowViva] = useState(false);
  const [electrolysisT, setElectrolysisT] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const guide = mode === "guide";

  // ── AI context ─────────────────────────────────────────────
  useEffect(() => {
    const stepIdx = steps.findIndex((s) => !s.done);
    const equipment: string[] = [];
    if (placed.beakersReady) equipment.push("Test beakers + water");
    if (placed.circuitReady) equipment.push("Battery + bulb + electrodes");
    if (placed.meltingReady) equipment.push("Spatula + Bunsen burner");
    if (placed.cellReady) equipment.push("Electrolysis cell");
    setAIContext({
      experimentId: "ionic_covalent",
      mode,
      currentStep: stepIdx < 0 ? steps.length : stepIdx,
      mistakesMade: mistakes.map((m) => m.message),
      currentChemicals: ["NaCl", "Sugar", "Naphthalene", "CuSO₄", "H₂O"],
      currentEquipment: equipment,
      goal:
        "Distinguish ionic vs covalent compounds via solubility, conductivity, melting point, and demonstrate electrolysis of CuSO₄.",
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

  // ── Equipment handlers ────────────────────────────────────
  const handleSelect = useCallback(
    (id: EquipmentId) => {
      if (submitted) return;
      if (!startedAtRef.current) startedAtRef.current = Date.now();

      switch (id) {
        case "test_beaker":
          if (placed.beakersReady) return;
          setPlaced((p) => ({ ...p, beakersReady: true }));
          toast.success("৪টি বিকার প্রস্তুত · 4 beakers ready");
          break;
        case "water_bottle":
          if (!placed.beakersReady) {
            toast.warning("Place test beakers first · প্রথমে বিকার বসাও");
            return;
          }
          setPlaced((p) => ({ ...p, waterAdded: true }));
          toast.success("পানি ঢালা হয়েছে · Water added to all beakers");
          break;
        case "battery":
        case "bulb":
        case "wires":
        case "carbon_electrode":
          setPlaced((p) => ({
            ...p,
            circuitReady: true,
            batteryConnected: true,
          }));
          toast.success("সার্কিট প্রস্তুত · Circuit assembled");
          break;
        case "spatula":
          setPlaced((p) => ({ ...p, meltingReady: true }));
          toast.success("Spatula ও bunsen burner প্রস্তুত");
          break;
        case "electrolysis_cell":
          setPlaced((p) => ({ ...p, cellReady: true }));
          break;
        case "cuso4_solid":
          if (placed.cellReady) {
            setPlaced((p) => ({ ...p, cuso4InCell: true }));
            toast.success("CuSO₄ দ্রবণ cell-এ ঢালা হয়েছে");
          } else {
            // Used as a sample for other tests
            toast.info("CuSO₄ test ribbon তৈরি — কোন stage-এ যোগ করবে নির্বাচন করো");
          }
          break;
        case "copper_electrode":
          if (placed.cellReady) {
            setPlaced((p) => ({ ...p, electrodesPlaced: true }));
            toast.success("Electrodes বসানো হয়েছে");
          }
          break;
        case "nacl_solid":
        case "sugar":
        case "naphthalene_solid":
          // simple hint — pick via the test buttons below
          toast.info(`Sample ready — নিচের stage buttons ব্যবহার করো.`);
          break;
      }
    },
    [placed, submitted],
  );

  // ── Stage actions ──────────────────────────────────────────
  const testSolubility = (sub: IonicSubstance) => {
    if (submitted) return;
    if (!placed.beakersReady || !placed.waterAdded) {
      toast.warning("বিকার ও পানি যোগ করো প্রথমে");
      return;
    }
    const result = SOLUBILITY_TRUTH[sub];
    setPlaced((p) => ({
      ...p,
      solubility: { ...p.solubility, [sub]: result },
    }));
    toast.success(
      `${LABELS[sub].en}: ${result === "dissolved" ? "দ্রবীভূত হয়েছে" : "অদ্রবণীয় — মেঘলা দেখাচ্ছে"}`,
    );
    const next = { ...placed.solubility, [sub]: result };
    if (SUB_LIST.every((s) => next[s] !== null)) completeStep("solubility");
  };

  const testConductivity = (sub: IonicSubstance, useWater: boolean) => {
    if (submitted) return;
    if (!placed.circuitReady) {
      toast.warning("Circuit assemble করো প্রথমে");
      return;
    }
    setActiveSubstance(sub);
    if (!useWater) {
      logMistake({
        type: "conductivity_solid_salt",
        severity: "med",
        message:
          "কঠিন অবস্থায় আয়নিক যৌগ বিদ্যুৎ পরিবহন করে না · Solid NaCl will not light the bulb. দ্রবণ তৈরি করতে হবে.",
      });
      setPlaced((p) => ({
        ...p,
        conductivityTested: { ...p.conductivityTested, [sub]: "off" },
      }));
      return;
    }
    const result = CONDUCTIVITY_TRUTH[sub];
    setPlaced((p) => ({
      ...p,
      conductivityTested: { ...p.conductivityTested, [sub]: result },
    }));
    toast.success(
      `${LABELS[sub].en} (aq): bulb ${result === "on" ? "জ্বলছে · ON" : "জ্বলছে না · OFF"}`,
    );
    const next = { ...placed.conductivityTested, [sub]: result };
    if (SUB_LIST.every((s) => next[s] !== null)) completeStep("conductivity");
  };

  const testMelting = (sub: IonicSubstance) => {
    if (submitted) return;
    if (!placed.meltingReady) {
      toast.warning("Spatula + burner বসাও প্রথমে");
      return;
    }
    setActiveSubstance(sub);
    const result = MELTING_TRUTH[sub];
    if (sub === "naphthalene") {
      logMistake({
        type: "naphthalene_overheated",
        severity: "high",
        message:
          "ন্যাপথালিন একটি উদ্বায়ী (volatile) পদার্থ — সাবধান! এটি সরাসরি গ্যাসে পরিণত হয়েছে।",
      });
    }
    setPlaced((p) => ({
      ...p,
      meltResult: { ...p.meltResult, [sub]: result },
    }));
    toast.success(
      `${LABELS[sub].en}: ${
        result === "melted"
          ? "দ্রুত গলে গেছে · low MP"
          : result === "vaporized"
            ? "বাষ্পীভূত · sublimed"
            : "কঠিন রয়ে গেছে · high MP"
      }`,
    );
    const next = { ...placed.meltResult, [sub]: result };
    if (SUB_LIST.every((s) => next[s] !== null)) completeStep("melting");
  };

  const togglePolarity = () => {
    if (submitted) return;
    if (!placed.cellReady) return;
    setPlaced((p) => {
      const reversed = !p.polarityCorrect ? true : false;
      if (!reversed) {
        logMistake({
          type: "reversed_electrodes",
          severity: "low",
          message: "অ্যানোড ও ক্যাথোড উল্টে গেছে · Polarity reversed.",
        });
      }
      return { ...p, polarityCorrect: reversed };
    });
  };

  const runElectrolysis = () => {
    if (submitted) return;
    if (!placed.cellReady || !placed.cuso4InCell || !placed.electrodesPlaced) {
      toast.warning("CuSO₄ ও electrodes প্রথমে যোগ করো");
      return;
    }
    setPlaced((p) => ({ ...p, electrolysisRun: true }));
    setActiveSubstance("cuso4");
  };

  const stopElectrolysis = () => {
    setPlaced((p) => ({ ...p, electrolysisRun: false }));
    if (placed.copperDeposit > 0.3 && placed.polarityCorrect) {
      completeStep("electrolysis");
    }
  };

  // Electrolysis loop
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    if (!placed.electrolysisRun) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      setElectrolysisT((t) => t + dt);
      if (placed.polarityCorrect) {
        setPlaced((p) => ({
          ...p,
          copperDeposit: Math.min(1, p.copperDeposit + 0.05 * dt + 0.005),
        }));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [placed.electrolysisRun, placed.polarityCorrect]);

  // Auto-complete electrolysis at full deposit
  useEffect(() => {
    if (placed.copperDeposit >= 0.95 && placed.electrolysisRun) {
      completeStep("electrolysis");
    }
  }, [placed.copperDeposit, placed.electrolysisRun, completeStep]);

  // ── Submit / reset ─────────────────────────────────────────
  const submit = () => {
    const high = mistakes.filter((m) => m.severity === "high").length;
    const med = mistakes.filter((m) => m.severity === "med").length;
    const low = mistakes.filter((m) => m.severity === "low").length;
    const g = gradeIonic({
      solubility: placed.solubility,
      conductivity: placed.conductivityTested,
      melting: placed.meltResult,
      copperDeposit: placed.copperDeposit,
      polarityCorrect: placed.polarityCorrect,
      electrolysisRun: placed.electrolysisRun || placed.copperDeposit > 0,
      highMistakes: high,
      medMistakes: med,
      lowMistakes: low,
    });
    const r: Report = {
      experiment: "ionic_covalent",
      accuracy: g.accuracy,
      grade: g.grade,
      solubilityScore: g.solubilityScore,
      conductivityScore: g.conductivityScore,
      meltingScore: g.meltingScore,
      electrolysisScore: g.electrolysisScore,
      copperDepositPct: Math.round(placed.copperDeposit * 100),
      durationSec: startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : 0,
      mistakes,
      steps,
    };
    setReport(r);
    setSubmitted(true);
    setPlaced((p) => ({ ...p, electrolysisRun: false }));
    toast.success(`Submitted! Grade: ${r.grade}`);
  };

  const reset = () => {
    setPlaced(INITIAL);
    setActiveSubstance(null);
    setMistakes([]);
    setSteps(buildSteps());
    setSubmitted(false);
    setReport(null);
    setElectrolysisT(0);
    startedAtRef.current = null;
  };

  // ── Guide hints ─────────────────────────────────────────────
  const nextHint = useMemo(() => {
    if (!placed.beakersReady) return "Stage 1: Test beakers বসিয়ে শুরু করো.";
    if (!placed.waterAdded) return "চারটি বিকারে পাতিত পানি যোগ করো.";
    if (SUB_LIST.some((s) => placed.solubility[s] === null))
      return "নিচের solubility buttons থেকে প্রতিটি পদার্থ পরীক্ষা করো.";
    if (!placed.circuitReady)
      return "Stage 2: Battery + bulb + wires + electrodes দিয়ে circuit বানাও.";
    if (SUB_LIST.some((s) => placed.conductivityTested[s] === null))
      return "প্রতিটি দ্রবণের তড়িৎ পরিবাহিতা পরীক্ষা করো.";
    if (!placed.meltingReady) return "Stage 3: Spatula + Bunsen burner বসাও.";
    if (SUB_LIST.some((s) => placed.meltResult[s] === null))
      return "প্রতিটি পদার্থকে তাপ দাও — কোনটি দ্রুত গলে?";
    if (!placed.cellReady)
      return "Stage 4: Electrolysis cell বসাও এবং CuSO₄ ঢালো.";
    if (!placed.cuso4InCell) return "Cell-এ CuSO₄ দ্রবণ যোগ করো.";
    if (!placed.electrodesPlaced) return "Cu electrodes (cathode/anode) যোগ করো.";
    if (!placed.electrolysisRun) return "▶ Run electrolysis চাপ দাও — Cu²⁺ → Cu at cathode.";
    if (placed.copperDeposit < 0.95) return "ক্যাথোডে copper জমা হচ্ছে — অপেক্ষা করো.";
    return "চারটি stage সম্পন্ন — Submit করো.";
  }, [placed]);

  const nextHighlight: EquipmentId | null = useMemo(() => {
    if (!placed.beakersReady) return "test_beaker";
    if (!placed.waterAdded) return "water_bottle";
    if (SUB_LIST.some((s) => placed.solubility[s] === null)) return null;
    if (!placed.circuitReady) return "battery";
    if (SUB_LIST.some((s) => placed.conductivityTested[s] === null)) return null;
    if (!placed.meltingReady) return "spatula";
    if (SUB_LIST.some((s) => placed.meltResult[s] === null)) return null;
    if (!placed.cellReady) return "electrolysis_cell";
    if (!placed.cuso4InCell) return "cuso4_solid";
    if (!placed.electrodesPlaced) return "copper_electrode";
    return null;
  }, [placed]);

  const stageActive = (stage: "sol" | "cond" | "melt") =>
    stage === "sol"
      ? placed.beakersReady && placed.waterAdded
      : stage === "cond"
        ? placed.circuitReady
        : placed.meltingReady;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen p-3 md:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Experiments
            </Button>
            <Zap className="h-6 w-6 text-amber-500" />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Ionic vs Covalent + Electrolysis · আয়নিক ও সমযোজী যৌগ + তড়িৎ বিশ্লেষণ
              </h1>
              <p className="text-xs text-muted-foreground">
                দ্রবণীয়তা → তড়িৎ পরিবাহিতা → গলনাঙ্ক → CuSO₄ এর তড়িৎ বিশ্লেষণ
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
                items={IONIC_ITEMS}
                onSelect={handleSelect}
                highlight={guide ? nextHighlight : null}
                disabled={() => submitted}
              />
            </div>
          )}

          <section
            className="relative rounded-2xl border bg-card/60 shadow-xl backdrop-blur"
            style={{ minHeight: 520 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/equipment") as EquipmentId;
              if (id) handleSelect(id);
            }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <IonicWorkspace
                placed={placed}
                activeSubstance={activeSubstance}
                electrolysisT={electrolysisT}
              />
            </div>

            {/* Stage action panel */}
            <div className="absolute bottom-3 left-1/2 z-10 flex max-w-[95%] -translate-x-1/2 flex-wrap justify-center gap-1.5 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
              {/* Solubility */}
              <div className="flex items-center gap-1 border-r pr-2">
                <BeakerIcon className="h-3.5 w-3.5 text-sky-600" />
                {SUB_LIST.map((s) => (
                  <Button
                    key={`sol-${s}`}
                    size="sm"
                    variant={placed.solubility[s] !== null ? "secondary" : "outline"}
                    disabled={!stageActive("sol") || submitted}
                    onClick={() => testSolubility(s)}
                    className="h-7 px-2 text-[10px]"
                  >
                    {LABELS[s].en}
                  </Button>
                ))}
              </div>
              {/* Conductivity */}
              <div className="flex items-center gap-1 border-r pr-2">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
                {SUB_LIST.map((s) => (
                  <Button
                    key={`con-${s}`}
                    size="sm"
                    variant={placed.conductivityTested[s] !== null ? "secondary" : "outline"}
                    disabled={!stageActive("cond") || submitted}
                    onClick={() => testConductivity(s, true)}
                    className="h-7 px-2 text-[10px]"
                  >
                    {LABELS[s].en}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!stageActive("cond") || submitted}
                  onClick={() => testConductivity("nacl", false)}
                  className="h-7 px-2 text-[10px] text-destructive"
                  title="Test solid NaCl (mistake)"
                >
                  Solid?
                </Button>
              </div>
              {/* Melting */}
              <div className="flex items-center gap-1 border-r pr-2">
                <Flame className="h-3.5 w-3.5 text-orange-600" />
                {SUB_LIST.map((s) => (
                  <Button
                    key={`melt-${s}`}
                    size="sm"
                    variant={placed.meltResult[s] !== null ? "secondary" : "outline"}
                    disabled={!stageActive("melt") || submitted}
                    onClick={() => testMelting(s)}
                    className="h-7 px-2 text-[10px]"
                  >
                    {LABELS[s].en}
                  </Button>
                ))}
              </div>
              {/* Electrolysis */}
              <div className="flex items-center gap-1">
                {!placed.electrolysisRun ? (
                  <Button
                    size="sm"
                    onClick={runElectrolysis}
                    disabled={
                      !placed.cellReady ||
                      !placed.cuso4InCell ||
                      !placed.electrodesPlaced ||
                      submitted
                    }
                    className="h-7 px-2 text-[10px]"
                  >
                    <Zap className="mr-1 h-3 w-3" /> Run
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={stopElectrolysis}
                    className="h-7 px-2 text-[10px]"
                  >
                    <Pause className="mr-1 h-3 w-3" /> Stop
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={togglePolarity}
                  disabled={!placed.cellReady || submitted}
                  className="h-7 px-2 text-[10px]"
                  title="Reverse anode/cathode"
                >
                  ± Flip
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
              <StatusCard placed={placed} />
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
              experiment="ionic_covalent"
              defaultTopic="আয়নিক ও সমযোজী যৌগের বৈশিষ্ট্য এবং CuSO₄ এর তড়িৎ বিশ্লেষণ"
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

function StatusCard({ placed }: { placed: IonicPlaced }) {
  const sub = (["nacl", "sugar", "naphthalene", "cuso4"] as IonicSubstance[]);
  const solDone = sub.filter((s) => placed.solubility[s] !== null).length;
  const conDone = sub.filter((s) => placed.conductivityTested[s] !== null).length;
  const meltDone = sub.filter((s) => placed.meltResult[s] !== null).length;
  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Stage Progress · ধাপ অগ্রগতি
      </h3>
      <div className="space-y-2 text-xs">
        <ProgressRow label="দ্রবণীয়তা" value={`${solDone}/4`} pct={(solDone / 4) * 100} />
        <ProgressRow label="তড়িৎ পরিবাহিতা" value={`${conDone}/4`} pct={(conDone / 4) * 100} />
        <ProgressRow label="গলনাঙ্ক" value={`${meltDone}/4`} pct={(meltDone / 4) * 100} />
        <ProgressRow
          label="Cu deposit"
          value={`${Math.round(placed.copperDeposit * 100)}%`}
          pct={placed.copperDeposit * 100}
        />
      </div>
      <div className="rounded-md border bg-muted/40 p-2 text-[10px] text-muted-foreground">
        Polarity: {placed.polarityCorrect ? "✓ Correct" : "✗ Reversed"} ·
        {placed.electrolysisRun ? " Running" : " Idle"}
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
