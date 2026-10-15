/**
 * Self-contained Lab for "Properties of Ionic & Covalent Compounds + Electrolysis of CuSO₄".
 * 4 stages: Solubility → Conductivity → Melting → Electrolysis.
 * Upgraded to 100dvh Viewport-Locked & Mobile Split-Screen Architecture.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Zap,
  Flame,
  GraduationCap,
  Beaker as BeakerIcon,
  Pause,
  BookOpen,
  Sliders,
  BarChart3,
  CheckSquare,
  Sparkles,
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

import EquipmentPanel, { IONIC_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import IonicWorkspace from "./workspaces/IonicWorkspace";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("guide");
  const [placed, setPlaced] = useState<IonicPlaced>(INITIAL);
  const [activeSubstance, setActiveSubstance] = useState<IonicSubstance | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [steps, setSteps] = useState<Step[]>(buildSteps);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [showViva, setShowViva] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [mobileTab, setMobileTab] = useState<"tools" | "controls" | "data" | "guide">("controls");
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
      goal: "Distinguish ionic vs covalent compounds via solubility, conductivity, melting point, and demonstrate electrolysis of CuSO₄.",
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
          toast.success("তড়িৎ বিশ্লেষণ সেল প্রস্তুত");
          break;
        case "cuso4_solid":
          if (placed.cellReady) {
            setPlaced((p) => ({ ...p, cuso4InCell: true }));
            toast.success("CuSO₄ দ্রবণ cell-এ ঢালা হয়েছে");
          } else {
            toast.info("CuSO₄ test ribbon তৈরি — নিচে স্টেজ বাটনে পরীক্ষা করো");
          }
          break;
        case "copper_electrode":
          if (placed.cellReady) {
            setPlaced((p) => ({ ...p, electrodesPlaced: true }));
            toast.success("Electrodes বসানো হয়েছে");
          }
          break;
        case "nacl_solid":
        case "sugar_solid":
        case "naphthalene_solid":
          toast.info(`Sample ready — নিচের স্টেজ বাটন দিয়ে পরীক্ষা সম্পন্ন করো।`);
          break;
      }
    },
    [placed, submitted],
  );

  // Quick 1-tap setup for all stages
  const setupAllStations = () => {
    if (submitted) return;
    setPlaced((p) => ({
      ...p,
      beakersReady: true,
      waterAdded: true,
      circuitReady: true,
      batteryConnected: true,
      meltingReady: true,
      cellReady: true,
      cuso4InCell: true,
      electrodesPlaced: true,
    }));
    toast.success("সকল যন্ত্রপাতি ও ৪টি স্টেশনের সেটআপ সম্পন্ন!");
  };

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
      const reversed = !p.polarityCorrect;
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
    if (!placed.cellReady) return "Stage 4: Electrolysis cell বসাও এবং CuSO₄ ঢালো.";
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
      <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden select-none">
        {/* COMPACT 46px UNIFIED HEADER */}
        <header className="h-[46px] min-h-[46px] border-b px-2 md:px-3 flex items-center justify-between gap-1.5 bg-card/80 backdrop-blur z-20 shrink-0">
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onBack}
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1.5 truncate">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 font-bold text-xs">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <div className="truncate">
                <h1 className="text-xs md:text-sm font-bold leading-tight truncate">
                  Ionic vs Covalent + Electrolysis
                </h1>
                <p className="hidden sm:block text-[10px] text-muted-foreground leading-none truncate">
                  দ্রবণীয়তা → তড়িৎ পরিবাহিতা → গলনাঙ্ক → CuSO₄ তড়িৎ বিশ্লেষণ
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
            <ModeToggle mode={mode} setMode={setMode} />

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setShowTheory(true)}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">অধ্যায় ৫ থিওরি</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setShowViva(true)}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Viva</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={reset}
              title="Reset Lab"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              className="h-7 px-2.5 text-xs gap-1 font-semibold shadow-sm"
              onClick={submit}
              disabled={submitted}
            >
              <Trophy className="h-3.5 w-3.5 text-amber-300" />
              <span>Submit</span>
            </Button>
          </div>
        </header>

        {/* DESKTOP 3-COLUMN VIEWPORT (100dvh Locked) */}
        {!isMobile ? (
          <div className="grid md:grid-cols-[280px_1fr_290px] flex-1 min-h-0 gap-3 p-3 overflow-hidden">
          {/* LEFT COLUMN: Equipment & Quick Setup */}
          <div className="flex flex-col h-full min-h-0 gap-3">
            <Card className="flex flex-col h-full min-h-0 p-3 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  🛠️ যন্ত্রপাতি ও নমুনা
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={setupAllStations}
                  className="h-6 text-[10px] px-2 gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                >
                  <Sparkles className="h-3 w-3" />
                  ১-ক্লিকে সাজাও
                </Button>
              </div>
              <ScrollArea className="flex-1 pr-2 pt-2">
                <EquipmentPanel
                  items={IONIC_ITEMS}
                  onSelect={handleSelect}
                  highlight={guide ? nextHighlight : null}
                  disabled={() => submitted}
                />
              </ScrollArea>
            </Card>
          </div>

          {/* CENTER COLUMN: SVG Workspace + Docked Stage Action Tray */}
          <section
            className="relative flex flex-col h-full min-h-0 rounded-xl border bg-card/60 shadow-inner overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/equipment") as EquipmentId;
              if (id) handleSelect(id);
            }}
          >
            <div className="relative flex-1 min-h-0 w-full overflow-hidden">
              <IonicWorkspace
                placed={placed}
                activeSubstance={activeSubstance}
                electrolysisT={electrolysisT}
              />
            </div>

            {/* DOCKED STAGE ACTION TRAY */}
            <div className="shrink-0 border-t bg-background/95 p-2 shadow-lg backdrop-blur flex flex-wrap items-center justify-between gap-2">
              {/* Solubility Stage */}
              <div className="flex items-center gap-1 border-r pr-2">
                <span className="text-[10px] font-bold text-sky-600 flex items-center gap-0.5 mr-1">
                  <BeakerIcon className="h-3 w-3" /> দ্রবণ:
                </span>
                {SUB_LIST.map((s) => (
                  <Button
                    key={`sol-${s}`}
                    size="sm"
                    variant={placed.solubility[s] !== null ? "secondary" : "outline"}
                    disabled={!stageActive("sol") || submitted}
                    onClick={() => testSolubility(s)}
                    className="h-6 px-1.5 text-[10px]"
                  >
                    {LABELS[s].en}
                  </Button>
                ))}
              </div>

              {/* Conductivity Stage */}
              <div className="flex items-center gap-1 border-r pr-2">
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 mr-1">
                  <Zap className="h-3 w-3" /> পরিবাহিতা:
                </span>
                {SUB_LIST.map((s) => (
                  <Button
                    key={`con-${s}`}
                    size="sm"
                    variant={placed.conductivityTested[s] !== null ? "secondary" : "outline"}
                    disabled={!stageActive("cond") || submitted}
                    onClick={() => testConductivity(s, true)}
                    className="h-6 px-1.5 text-[10px]"
                  >
                    {LABELS[s].en}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!stageActive("cond") || submitted}
                  onClick={() => testConductivity("nacl", false)}
                  className="h-6 px-1 text-[10px] text-destructive hover:bg-destructive/10"
                  title="Test solid NaCl (mistake test)"
                >
                  Solid?
                </Button>
              </div>

              {/* Melting Stage */}
              <div className="flex items-center gap-1 border-r pr-2">
                <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5 mr-1">
                  <Flame className="h-3 w-3" /> গলনাঙ্ক:
                </span>
                {SUB_LIST.map((s) => (
                  <Button
                    key={`melt-${s}`}
                    size="sm"
                    variant={placed.meltResult[s] !== null ? "secondary" : "outline"}
                    disabled={!stageActive("melt") || submitted}
                    onClick={() => testMelting(s)}
                    className="h-6 px-1.5 text-[10px]"
                  >
                    {LABELS[s].en}
                  </Button>
                ))}
              </div>

              {/* Electrolysis Stage */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 mr-0.5">
                  <Zap className="h-3 w-3" /> তড়িৎ বিশ্লেষণ:
                </span>
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
                    className="h-6 px-2 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    ▶ Run
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={stopElectrolysis}
                    className="h-6 px-2 text-[10px]"
                  >
                    <Pause className="mr-1 h-3 w-3" /> Stop
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={togglePolarity}
                  disabled={!placed.cellReady || submitted}
                  className="h-6 px-1.5 text-[10px]"
                  title="Reverse anode/cathode"
                >
                  ± Flip
                </Button>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Status & Steps */}
          <div className="flex flex-col h-full min-h-0 gap-3 overflow-hidden">
            <StatusCard placed={placed} />
            <div className="flex-1 min-h-0 overflow-y-auto">
              <StepsPanel
                steps={steps}
                mistakes={mistakes}
                guideMode={guide}
                nextHint={guide ? nextHint : undefined}
              />
            </div>
          </div>
        </div>
        ) : (
        /* MOBILE SPLIT VIEW (Top 46% Live SVG + Bottom 54% 4-Tab Tray) */
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {/* TOP 46%: Pinned Live Reaction Workspace */}
          <div className="h-[46%] min-h-[200px] relative border-b bg-card/60 shrink-0 overflow-hidden">
            <IonicWorkspace
              placed={placed}
              activeSubstance={activeSubstance}
              electrolysisT={electrolysisT}
            />
            {/* Overlay indicators on mobile */}
            <div className="absolute top-1.5 left-2 z-10 flex items-center gap-1 bg-background/85 px-2 py-0.5 rounded-full border text-[9px] shadow-sm backdrop-blur">
              <span className="font-semibold text-muted-foreground">Cu Deposit:</span>
              <span className="font-mono text-primary font-bold">
                {Math.round(placed.copperDeposit * 100)}%
              </span>
              <span className="mx-0.5 text-muted-foreground/40">|</span>
              <span
                className={
                  placed.polarityCorrect ? "text-emerald-600 font-bold" : "text-destructive font-bold"
                }
              >
                {placed.polarityCorrect ? "Polarity OK" : "Reversed"}
              </span>
            </div>
          </div>

          {/* BOTTOM 54%: Tabbed Control Tray */}
          <div className="flex-1 min-h-0 flex flex-col bg-background/95">
            {/* Mobile Tab Bar */}
            <div className="grid grid-cols-4 border-b bg-muted/40 p-1 gap-1 shrink-0">
              <button
                onClick={() => setMobileTab("controls")}
                className={cn(
                  "py-1.5 text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition",
                  mobileTab === "controls"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sliders className="h-3 w-3" />
                <span>টেস্ট ও ধাপ</span>
              </button>
              <button
                onClick={() => setMobileTab("tools")}
                className={cn(
                  "py-1.5 text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition",
                  mobileTab === "tools"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sparkles className="h-3 w-3" />
                <span>যন্ত্রপাতি</span>
              </button>
              <button
                onClick={() => setMobileTab("data")}
                className={cn(
                  "py-1.5 text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition",
                  mobileTab === "data"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BarChart3 className="h-3 w-3" />
                <span>তথ্য ও প্রগ্রেস</span>
              </button>
              <button
                onClick={() => setMobileTab("guide")}
                className={cn(
                  "py-1.5 text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition",
                  mobileTab === "guide"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <CheckSquare className="h-3 w-3" />
                <span>গাইড</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 min-h-0 p-2.5 overflow-y-auto">
              {mobileTab === "controls" && (
                <div className="space-y-3">
                  {/* Solubility */}
                  <div className="rounded-lg border p-2.5 bg-card/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-600 flex items-center gap-1">
                        <BeakerIcon className="h-3.5 w-3.5" /> ১. দ্রবণীয়তা পরীক্ষা
                      </span>
                      <span className="text-[10px] text-muted-foreground">বিকার ও পানিতে পরীক্ষা</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {SUB_LIST.map((s) => (
                        <Button
                          key={`m-sol-${s}`}
                          size="sm"
                          variant={placed.solubility[s] !== null ? "secondary" : "outline"}
                          disabled={!stageActive("sol") || submitted}
                          onClick={() => testSolubility(s)}
                          className="h-8 text-[11px] font-medium"
                        >
                          {LABELS[s].en}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Conductivity */}
                  <div className="rounded-lg border p-2.5 bg-card/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" /> ২. তড়িৎ পরিবাহিতা পরীক্ষা
                      </span>
                      <span className="text-[10px] text-muted-foreground">বাল্ব জ্বলে কি না</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {SUB_LIST.map((s) => (
                        <Button
                          key={`m-con-${s}`}
                          size="sm"
                          variant={placed.conductivityTested[s] !== null ? "secondary" : "outline"}
                          disabled={!stageActive("cond") || submitted}
                          onClick={() => testConductivity(s, true)}
                          className="h-8 text-[11px] font-medium"
                        >
                          {LABELS[s].en}
                        </Button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!stageActive("cond") || submitted}
                      onClick={() => testConductivity("nacl", false)}
                      className="w-full h-7 text-[10px] text-destructive hover:bg-destructive/10"
                    >
                      কঠিন NaCl দিয়ে ভুল পরীক্ষা করো (Solid Test)
                    </Button>
                  </div>

                  {/* Melting */}
                  <div className="rounded-lg border p-2.5 bg-card/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5" /> ৩. গলনাঙ্ক পরীক্ষা
                      </span>
                      <span className="text-[10px] text-muted-foreground">Spatula ও তাপ</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {SUB_LIST.map((s) => (
                        <Button
                          key={`m-melt-${s}`}
                          size="sm"
                          variant={placed.meltResult[s] !== null ? "secondary" : "outline"}
                          disabled={!stageActive("melt") || submitted}
                          onClick={() => testMelting(s)}
                          className="h-8 text-[11px] font-medium"
                        >
                          {LABELS[s].en}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Electrolysis */}
                  <div className="rounded-lg border p-2.5 bg-card/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" /> ৪. CuSO₄ তড়িৎ বিশ্লেষণ
                      </span>
                      <span className="text-[10px] font-mono text-primary font-bold">
                        Deposit: {Math.round(placed.copperDeposit * 100)}%
                      </span>
                    </div>
                    <div className="flex gap-2">
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
                          className="flex-1 h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          ▶ Run Electrolysis
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={stopElectrolysis}
                          className="flex-1 h-8 text-xs font-semibold"
                        >
                          <Pause className="mr-1 h-3.5 w-3.5" /> Stop
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={togglePolarity}
                        disabled={!placed.cellReady || submitted}
                        className="h-8 px-3 text-xs"
                      >
                        ± Flip
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {mobileTab === "tools" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-muted/40 p-2 rounded-lg border">
                    <span className="text-xs font-medium">ঝটপট সব প্রস্তুত করতে চাও?</span>
                    <Button
                      size="sm"
                      onClick={setupAllStations}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      সব সাজাও
                    </Button>
                  </div>
                  <EquipmentPanel
                    items={IONIC_ITEMS}
                    onSelect={handleSelect}
                    highlight={guide ? nextHighlight : null}
                    disabled={() => submitted}
                  />
                </div>
              )}

              {mobileTab === "data" && (
                <div className="space-y-3">
                  <StatusCard placed={placed} />
                </div>
              )}

              {mobileTab === "guide" && (
                <div className="space-y-3">
                  <StepsPanel
                    steps={steps}
                    mistakes={mistakes}
                    guideMode={guide}
                    nextHint={guide ? nextHint : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* MODAL LAB REPORT OVERLAY */}
        {report && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl p-4 md:p-6 shadow-2xl border">
              <LabReport report={report} onReset={reset} />
            </div>
          </div>
        )}

        {/* AI VIVA DRAWER */}
        <Drawer open={showViva} onOpenChange={setShowViva}>
          <DrawerContent className="max-h-[85vh] p-4">
            <DrawerHeader className="p-0 pb-3 flex items-center justify-between">
              <DrawerTitle className="text-sm font-bold flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-primary" />
                AI মৌখিক পরীক্ষা (Viva Voce)
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  ✕ বন্ধ করুন
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <div className="grid gap-4 md:grid-cols-2 max-h-[65vh] overflow-y-auto pr-1">
              <TeacherViva
                onPublish={setVivaQuestions}
                experiment="ionic_covalent"
                defaultTopic="আয়নিক ও সমযোজী যৌগের বৈশিষ্ট্য এবং CuSO₄ এর তড়িৎ বিশ্লেষণ"
              />
              <StudentViva />
            </div>
          </DrawerContent>
        </Drawer>

        {/* CHAPTER 5 THEORY DRAWER */}
        <Drawer open={showTheory} onOpenChange={setShowTheory}>
          <DrawerContent className="max-h-[85vh] p-4">
            <DrawerHeader className="p-0 pb-3 flex items-center justify-between border-b">
              <DrawerTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
                <BookOpen className="h-4 w-4" />
                অধ্যায় ৫: রাসায়নিক বন্ধন ও আয়নিক/সমযোজী যৌগের ধর্ম
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  ✕ বন্ধ করুন
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <ScrollArea className="max-h-[65vh] pr-3 pt-3 text-xs leading-relaxed space-y-3">
              <div className="rounded-lg border bg-amber-500/10 p-3 border-amber-500/20">
                <h4 className="font-bold text-amber-700 dark:text-amber-400 mb-1">
                  🧪 মূল মূলনীতি (Core Principles)
                </h4>
                <p className="text-muted-foreground">
                  ধাতু ও অধাতুর মধ্যে ইলেকট্রন আদান-প্রদানের মাধ্যমে গঠিত হয় <b>আয়নিক বন্ধন</b> এবং অধাতু-অধাতু পরমাণুর মধ্যে ইলেকট্রন শেয়ারের মাধ্যমে গঠিত হয় <b>সমযোজী বন্ধন</b>।
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-2.5">
                <div className="rounded-lg border p-2.5 bg-card/60">
                  <h5 className="font-bold text-sky-600 mb-1">১. দ্রবণীয়তা (Solubility):</h5>
                  <p className="text-muted-foreground text-[11px]">
                    পোলার দ্রাবক হিসেবে পানি আয়নিক যৌগকে (NaCl, CuSO₄) সহজে দ্রবীভূত করে, কারণ পানির ধনাত্মক ও ঋণাত্মক প্রান্ত ল্যাটিসের বিপরীত আধানযুক্ত আয়নগুলোকে ঘিরে ফেলে হাইড্রেটেড করে। সমযোজী চিনিতে পোলার -OH মূলক থাকায় দ্রবীভূত হয়, কিন্তু সম্পূর্ণ অপোলার ন্যাপথালিন পানিতে অদ্রবণীয় থাকে।
                  </p>
                </div>

                <div className="rounded-lg border p-2.5 bg-card/60">
                  <h5 className="font-bold text-amber-600 mb-1">২. তড়িৎ পরিবাহিতা (Conductivity):</h5>
                  <p className="text-muted-foreground text-[11px]">
                    বিদ্যুৎ পরিবহনের জন্য মুক্ত সঞ্চারণশীল আয়ন বা ইলেকট্রন থাকা আবশ্যক। কঠিন লবণে আয়নগুলি কেলাস জ্বালকে (Crystal Lattice) স্থিরভাবে আবদ্ধ থাকে বলে বিদ্যুৎ পরিবহন করতে পারে না। কিন্তু জলীয় দ্রবণে বা গলিত অবস্থায় আয়নগুলি মুক্ত হয়ে বিদ্যুৎ পরিবহন করে এবং বাল্ব জ্বলে ওঠে। সমযোজী চিনি বা ন্যাপথালিন কোনো মুক্ত আয়ন সৃষ্টি করে না, তাই বাল্ব জ্বলে না।
                  </p>
                </div>

                <div className="rounded-lg border p-2.5 bg-card/60">
                  <h5 className="font-bold text-orange-600 mb-1">৩. গলনাঙ্ক ও উদ্বায়ী ধর্ম (Melting Point & Volatility):</h5>
                  <p className="text-muted-foreground text-[11px]">
                    আয়নিক যৌগে শক্তিশালী স্থির-বৈদ্যুতিক আকর্ষণ বল বিদ্যমান থাকায় এদের গলনাঙ্ক ও স্ফুটনাঙ্ক অনেক বেশি (যেমন NaCl এর গলনাঙ্ক ৮০১°C)। বিপরীতে সমযোজী অণুগুলোর মাঝে দুর্বল ভ্যান ডার ওয়ালস বল থাকায় কম তাপে গলে যায়। ন্যাপথালিন উদ্বায়ী হওয়ায় তাপ দিলে তা সরাসরি বাষ্পীভূত (Sublimation) হয়।
                  </p>
                </div>

                <div className="rounded-lg border p-2.5 bg-card/60">
                  <h5 className="font-bold text-indigo-600 mb-1">৪. কপার সালফেটের তড়িৎ বিশ্লেষণ (Electrolysis of CuSO₄):</h5>
                  <p className="text-muted-foreground text-[11px]">
                    ক্যাথোডে বিজারণ: Cu²⁺ + 2e⁻ → Cu (ধাতব কপার জমা হয়)।<br />
                    অ্যানোডে কপার ইলেক্ট্রোড ব্যবহৃত হলে জারণ: Cu → Cu²⁺ + 2e⁻ (অ্যানোড ক্ষয়প্রাপ্ত হয়)।
                  </p>
                </div>
              </div>
            </ScrollArea>
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
            className={cn(
              "rounded px-2 py-0.5 text-[11px] transition font-medium",
              active ? "bg-background font-semibold shadow-sm text-foreground" : "text-muted-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusCard({ placed }: { placed: IonicPlaced }) {
  const sub = ["nacl", "sugar", "naphthalene", "cuso4"] as IonicSubstance[];
  const solDone = sub.filter((s) => placed.solubility[s] !== null).length;
  const conDone = sub.filter((s) => placed.conductivityTested[s] !== null).length;
  const meltDone = sub.filter((s) => placed.meltResult[s] !== null).length;
  return (
    <Card className="space-y-2 p-3 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        📊 Stage Progress · ধাপ অগ্রগতি
      </h3>
      <div className="space-y-2 text-xs">
        <ProgressRow label="১. দ্রবণীয়তা" value={`${solDone}/4`} pct={(solDone / 4) * 100} />
        <ProgressRow label="২. তড়িৎ পরিবাহিতা" value={`${conDone}/4`} pct={(conDone / 4) * 100} />
        <ProgressRow label="৩. গলনাঙ্ক" value={`${meltDone}/4`} pct={(meltDone / 4) * 100} />
        <ProgressRow
          label="৪. Cu ডিপোজিট"
          value={`${Math.round(placed.copperDeposit * 100)}%`}
          pct={placed.copperDeposit * 100}
        />
      </div>
      <div className="rounded-md border bg-muted/40 px-2 py-1.5 text-[10px] text-muted-foreground flex items-center justify-between">
        <span>
          Polarity:{" "}
          <strong className={placed.polarityCorrect ? "text-emerald-600" : "text-destructive"}>
            {placed.polarityCorrect ? "✓ Correct" : "✗ Reversed"}
          </strong>
        </span>
        <span className="font-mono">
          Cell: <strong>{placed.electrolysisRun ? "⚡ Running" : "Idle"}</strong>
        </span>
      </div>
    </Card>
  );
}

function ProgressRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[11px]">
        <span>{label}</span>
        <span className="font-mono font-medium">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-muted">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
