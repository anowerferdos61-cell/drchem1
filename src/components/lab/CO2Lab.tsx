/**
 * Self-contained Lab for "Preparation of Carbon Dioxide" experiment.
 * CaCO3 + 2 HCl → CaCl2 + H2O + CO2.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Eye,
  EyeOff,
  GraduationCap,
  Beaker,
  FlaskRound,
  TestTube2,
  Flame,
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

import EquipmentPanel, { CO2_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import CO2Workspace, { type IdTool } from "./workspaces/CO2Workspace";
import { useIsMobile } from "@/hooks/use-mobile";
import TeacherViva, { type VivaQuestion } from "@/components/viva/TeacherViva";
import StudentViva from "@/components/viva/StudentViva";
import type {
  CO2Placed,
  EquipmentId,
  Mistake,
  Mode,
  Report,
  Step,
  TestId,
  TestResult,
} from "./types";
import { setAIContext } from "@/lib/ai-context-store";

import {
  co2Grade,
  collectionEfficiency,
  computeCO2Generation,
  limewaterPhase,
  maxCO2VolumeMl,
  type CO2Config,
} from "@/lib/co2";

const DEFAULT_CFG: CO2Config = { caco3MassG: 1.0, hclConcM: 2.0, hclVolumeMl: 25 };
const JAR_CAPACITY_ML = 250;

const INITIAL_PLACED: CO2Placed = {
  round_bottom_flask: false,
  calcium_carbonate: false,
  cork: false,
  thistle_funnel: false,
  delivery_tube: false,
  gas_jar: false,
  acid_poured: false,
};

function buildSteps(): Step[] {
  return [
    {
      id: "caco3",
      label: "Take CaCO₃ chips in round-bottom flask · গোলতলী ফ্লাস্কে ক্যালসিয়াম কার্বনেট নাও।",
      done: false,
    },
    {
      id: "cork",
      label:
        "Secure two-hole cork with thistle funnel & delivery tube · কর্ক দিয়ে থিসল ফানেল ও ডেলিভারি টিউব আটকাও।",
      done: false,
    },
    {
      id: "jar",
      label: "Place gas jar upright (upward displacement of air) · গ্যাস জার সোজা করে বসাও।",
      done: false,
    },
    {
      id: "water",
      label: "Pour a little water so the funnel tip submerges · ফানেলের মুখ ডোবা পর্যন্ত পানি দাও।",
      done: false,
    },
    {
      id: "acid",
      label: "Pour dilute HCl through the thistle funnel · থিসল ফানেল দিয়ে লঘু HCl ঢালো।",
      done: false,
    },
    {
      id: "collect",
      label:
        "Observe bubbles & collect CO₂ in the gas jar · বুদবুদ পর্যবেক্ষণ করো ও CO₂ সংগ্রহ করো।",
      done: false,
    },
    {
      id: "tests",
      label: "Perform identification tests · শনাক্তকরণ পরীক্ষাগুলো করো।",
      done: false,
    },
  ];
}

interface Props {
  onBack: () => void;
}

export default function CO2Lab({ onBack }: Props) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("guide");
  const [cfg, setCfg] = useState<CO2Config>(DEFAULT_CFG);
  const [placed, setPlaced] = useState<CO2Placed>(INITIAL_PLACED);
  const [waterAdded, setWaterAdded] = useState(false); // priming water so funnel tip submerges
  const [reacting, setReacting] = useState(false);
  const [generatedMl, setGeneratedMl] = useState(0); // gross gas evolved
  const [collectedMl, setCollectedMl] = useState(0); // captured in jar
  const [elapsed, setElapsed] = useState(0);
  const [jarUpright, setJarUpright] = useState(true);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [steps, setSteps] = useState<Step[]>(buildSteps);
  const [tests, setTests] = useState<Record<TestId, TestResult>>({
    limewater: "none",
    burning_splint: "none",
    litmus: "none",
    magnesium: "none",
  });
  const [showLimewater, setShowLimewater] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showPanels, setShowPanels] = useState(true);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [showViva, setShowViva] = useState(false);

  // Publish AI assistant context
  useEffect(() => {
    const stepIdx = steps.findIndex((s) => !s.done);
    const chemicals: string[] = [];
    if (placed.calcium_carbonate) chemicals.push("CaCO₃ chips");
    if (placed.acid_poured) chemicals.push("dilute HCl");
    const equipment: string[] = [];
    if (placed.round_bottom_flask) equipment.push("round-bottom flask");
    if (placed.thistle_funnel) equipment.push("thistle funnel");
    if (placed.cork) equipment.push("two-hole cork");
    if (placed.delivery_tube) equipment.push("bent delivery tube");
    if (placed.gas_jar) equipment.push("gas jar (upward displacement)");
    setAIContext({
      experimentId: "co2_prep",
      mode,
      currentStep: stepIdx < 0 ? steps.length : stepIdx,
      mistakesMade: mistakes.map((m) => m.message),
      currentChemicals: chemicals,
      currentEquipment: equipment,
      goal: "Prepare CO₂ via CaCO₃ + dilute HCl and identify with the four tests",
    });
  }, [mode, steps, placed, mistakes]);

  // Identification-test interaction state
  const [activeIdTool, setActiveIdTool] = useState<IdTool>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [splintExtinguished, setSplintExtinguished] = useState(false);
  const [mgReacted, setMgReacted] = useState(false);
  const [litmusReacted, setLitmusReacted] = useState(false);
  const [mobileTab, setMobileTab] = useState<"equipment" | "controls" | "info" | "guide">(
    "equipment",
  );
  const [showTheory, setShowTheory] = useState(false);
  const workspaceRef = useRef<HTMLElement>(null);
  const startedAtRef = useRef<number | null>(null);

  const runDirectTest = (test: "limewater" | "splint" | "mg" | "litmus") => {
    if (test === "limewater") {
      setShowLimewater((v) => {
        const next = !v;
        if (next) {
          setTests((t) => ({ ...t, limewater: "pass" }));
          completeStep("tests");
          toast.success("Limewater test active — CO₂ bubbled through Ca(OH)₂");
        }
        return next;
      });
      return;
    }
    if (!placed.gas_jar || !jarUpright) {
      toast.warning("Place the gas jar upright first · গ্যাস জার সোজা করে বসাও");
      return;
    }
    if (test === "splint") {
      setSplintExtinguished(true);
      setTests((t) => ({ ...t, burning_splint: "pass" }));
      toast.success("Splint extinguished — CO₂ does not support combustion");
    } else if (test === "mg") {
      setMgReacted(true);
      setTests((t) => ({ ...t, magnesium: "pass" }));
      toast.success("Mg burns in CO₂ — black carbon + white MgO");
    } else if (test === "litmus") {
      setLitmusReacted(true);
      setTests((t) => ({ ...t, litmus: "pass" }));
      toast.success("Blue litmus → faint red (H₂CO₃ is weakly acidic)");
    }
    completeStep("tests");
  };

  // Hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem("co2:config");
      if (raw) setCfg(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const targetMl = useMemo(() => Math.min(maxCO2VolumeMl(cfg), JAR_CAPACITY_ML), [cfg]);
  const guide = mode === "guide";

  // Funnel is submerged once water (or acid) covers the tip. The tip sits at
  // y≈340 in the workspace; we approximate "submerged" simply as waterAdded.
  const funnelSubmerged = waterAdded || placed.acid_poured;

  const logMistake = useCallback((m: Omit<Mistake, "ts">) => {
    const entry: Mistake = { ...m, ts: Date.now() };
    setMistakes((prev) => [...prev, entry]);
    if (m.severity === "high") toast.error(m.message);
    else toast.warning(m.message);
  }, []);

  const completeStep = useCallback((id: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: true } : s)));
  }, []);

  // ── Equipment placement ──────────────────────────────────────
  const handleSelect = useCallback(
    (id: EquipmentId) => {
      if (submitted) return;
      if (!startedAtRef.current) startedAtRef.current = Date.now();

      switch (id) {
        case "round_bottom_flask":
        case "clamp":
          if (placed.round_bottom_flask) return;
          setPlaced((p) => ({ ...p, round_bottom_flask: true }));
          toast.success("Round-bottom flask clamped");
          break;
        case "calcium_carbonate":
          if (!placed.round_bottom_flask) {
            toast.warning("Place the round-bottom flask first");
            return;
          }
          setPlaced((p) => ({ ...p, calcium_carbonate: true }));
          completeStep("caco3");
          toast.success("CaCO₃ chips added");
          break;
        case "two_hole_cork":
          if (!placed.round_bottom_flask) return;
          setPlaced((p) => ({ ...p, cork: true }));
          break;
        case "thistle_funnel":
          if (!placed.cork) {
            toast.warning("Fit the two-hole cork first");
            return;
          }
          setPlaced((p) => ({ ...p, thistle_funnel: true }));
          break;
        case "bent_delivery_tube":
          if (!placed.cork) {
            toast.warning("Fit the two-hole cork first");
            return;
          }
          setPlaced((p) => ({ ...p, delivery_tube: true }));
          if (placed.thistle_funnel) completeStep("cork");
          break;
        case "gas_jar":
          setPlaced((p) => ({ ...p, gas_jar: true }));
          if (jarUpright) completeStep("jar");
          break;
        case "dilute_hcl": {
          if (!placed.cork) {
            logMistake({
              type: "open_reaction_flask",
              severity: "high",
              message: "Flask is not corked — CO₂ will escape. Fit the cork first.",
            });
          }
          if (!placed.calcium_carbonate) {
            logMistake({
              type: "no_calcium_carbonate",
              severity: "high",
              message: "No CaCO₃ in the flask — nothing for HCl to react with.",
            });
          }
          if (placed.thistle_funnel && !funnelSubmerged) {
            logMistake({
              type: "funnel_not_submerged",
              severity: "high",
              message: "Thistle funnel tip is not submerged — CO₂ will escape through the funnel.",
            });
          }
          if (placed.gas_jar && !jarUpright) {
            logMistake({
              type: "wrong_gas_displacement",
              severity: "med",
              message:
                "CO₂ is denser than air — use upward displacement (jar upright), not inverted.",
            });
          }
          setPlaced((p) => ({ ...p, acid_poured: true }));
          setReacting(true);
          completeStep("acid");
          toast.success("Dilute HCl poured — reaction started");
          break;
        }
        case "limewater": {
          if (collectedMl <= 0) {
            toast.warning("Collect CO₂ first · আগে CO₂ সংগ্রহ কর");
            return;
          }
          setShowLimewater(true);
          toast.info("Limewater tube connected — bubbling started · চুনের পানিতে বুদবুদ");
          break;
        }
        case "burning_splint": {
          if (collectedMl <= 0) {
            toast.warning("Collect CO₂ first · আগে CO₂ সংগ্রহ কর");
            return;
          }
          setActiveIdTool("splint");
          toast.info("Move the burning splint to the jar mouth · গ্যাস জারের মুখে নাও");
          break;
        }
        case "moist_blue_litmus": {
          if (collectedMl <= 0) {
            toast.warning("Collect CO₂ first · আগে CO₂ সংগ্রহ কর");
            return;
          }
          setActiveIdTool("litmus");
          toast.info("Move the moist blue litmus to the jar mouth · জারের মুখে নাও");
          break;
        }
        case "magnesium_ribbon": {
          if (collectedMl <= 0) {
            toast.warning("Collect CO₂ first · আগে CO₂ সংগ্রহ কর");
            return;
          }
          setActiveIdTool("mg");
          toast.info("Move the burning Mg ribbon into the jar · জ্বলন্ত Mg জারে নাও");
          break;
        }
        default:
          break;
      }
    },
    [placed, completeStep, logMistake, submitted, funnelSubmerged, jarUpright, collectedMl],
  );

  // ── Add priming water ────────────────────────────────────────
  const addPrimingWater = () => {
    if (!placed.thistle_funnel) {
      toast.warning("Insert the thistle funnel first");
      return;
    }
    setWaterAdded(true);
    completeStep("water");
    toast.success("A little water added — funnel tip submerged");
  };

  // ── Kinetics loop ────────────────────────────────────────────
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    if (!reacting) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setElapsed((e) => {
        const next = e + dt;
        const { generatedMl: g } = computeCO2Generation({ cfg, timeElapsedSec: next });
        setGeneratedMl(g);
        const eff = collectionEfficiency({
          corkClosed: placed.cork,
          funnelSubmerged,
          usingUpwardDisplacement: jarUpright && placed.gas_jar,
        });
        const captured = Math.min(JAR_CAPACITY_ML, g * eff);
        setCollectedMl(captured);
        if (captured >= JAR_CAPACITY_ML * 0.95) {
          completeStep("collect");
        }
        // Limewater visual depends on cumulative CO2 passed
        if (showLimewater) {
          const phase = limewaterPhase(captured);
          if (phase === "milky" && tests.limewater !== "pass") {
            setTests((t) => ({ ...t, limewater: "pass" }));
            completeStep("tests");
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    reacting,
    cfg,
    placed.cork,
    placed.gas_jar,
    funnelSubmerged,
    jarUpright,
    completeStep,
    showLimewater,
    tests.limewater,
  ]);

  // ── Submit / reset ───────────────────────────────────────────
  const submit = () => {
    const highMistakes = mistakes.filter((m) => m.severity === "high").length;
    const { accuracy, grade } = co2Grade({
      collectedMl,
      targetMl,
      highMistakes,
      tests: {
        limewater: tests.limewater === "pass",
        burning_splint: tests.burning_splint === "pass",
        litmus: tests.litmus === "pass",
        magnesium: tests.magnesium === "pass",
      },
    });
    const r: Report = {
      experiment: "co2_prep",
      VCO2_final: collectedMl,
      VCO2_target: targetMl,
      tests,
      accuracy,
      grade,
      durationSec: startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : 0,
      mistakes,
      steps,
    };
    setReacting(false);
    setReport(r);
    setSubmitted(true);
    toast.success(`Submitted! Grade: ${r.grade}`);
  };

  const reset = () => {
    setPlaced(INITIAL_PLACED);
    setWaterAdded(false);
    setReacting(false);
    setGeneratedMl(0);
    setCollectedMl(0);
    setElapsed(0);
    setJarUpright(true);
    setMistakes([]);
    setSteps(buildSteps());
    setTests({ limewater: "none", burning_splint: "none", litmus: "none", magnesium: "none" });
    setShowLimewater(false);
    setSubmitted(false);
    setReport(null);
    setActiveIdTool(null);
    setCursor(null);
    setSplintExtinguished(false);
    setMgReacted(false);
    setLitmusReacted(false);
    startedAtRef.current = null;
  };

  const nextHint = useMemo(() => {
    if (!placed.round_bottom_flask) return "Clamp the round-bottom flask on the stand.";
    if (!placed.calcium_carbonate) return "Drop CaCO₃ chips into the flask.";
    if (!placed.cork) return "Fit the two-hole cork on the flask.";
    if (!placed.thistle_funnel) return "Insert the thistle funnel through one hole.";
    if (!placed.delivery_tube) return "Insert the bent delivery tube through the other hole.";
    if (!placed.gas_jar) return "Place the gas jar upright at the delivery exit.";
    if (!waterAdded) return "Add a little water so the funnel tip submerges.";
    if (!placed.acid_poured) return "Pour dilute HCl through the thistle funnel.";
    if (collectedMl < JAR_CAPACITY_ML * 0.5) return "Collecting CO₂ — wait…";
    if (tests.limewater !== "pass" && tests.burning_splint !== "pass")
      return "Perform identification tests (limewater / burning splint).";
    return "Done — submit your report!";
  }, [placed, waterAdded, collectedMl, tests]);

  const nextHighlight: EquipmentId | null = useMemo(() => {
    if (!placed.round_bottom_flask) return "round_bottom_flask";
    if (!placed.calcium_carbonate) return "calcium_carbonate";
    if (!placed.cork) return "two_hole_cork";
    if (!placed.thistle_funnel) return "thistle_funnel";
    if (!placed.delivery_tube) return "bent_delivery_tube";
    if (!placed.gas_jar) return "gas_jar";
    if (!placed.acid_poured) return "dilute_hcl";
    return null;
  }, [placed]);

  const pct = targetMl > 0 ? Math.min(100, (collectedMl / targetMl) * 100) : 0;
  const { rateMlPerSec } = computeCO2Generation({ cfg, timeElapsedSec: elapsed });

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
                  CO₂ Preparation · কার্বন ডাইঅক্সাইড প্রস্তুতি
                </div>
                <div className="hidden truncate text-[10px] text-emerald-400/80 sm:block font-mono">
                  CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂ ↑
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
                <span>অধ্যায় ৭ থিওরি</span>
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
            {/* LEFT: Equipment & Configuration */}
            <aside className="lab-scroll flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto pr-1">
              <EquipmentPanel
                items={CO2_ITEMS}
                onSelect={handleSelect}
                highlight={guide ? nextHighlight : null}
                disabled={() => submitted}
              />
              <CO2ConfigPanel config={cfg} onChange={setCfg} />
            </aside>

            {/* CENTER: Workspace & Action Bar */}
            <section
              ref={workspaceRef}
              className="relative flex h-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/equipment") as EquipmentId;
                if (id) handleSelect(id);
              }}
              onMouseMove={(e) => {
                if (!activeIdTool) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => setCursor(null)}
              onClick={(e) => {
                if (!activeIdTool) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const px = e.clientX - rect.left;
                const py = e.clientY - rect.top;
                const scale = Math.min(rect.width / 640, rect.height / 500);
                const offX = (rect.width - 640 * scale) / 2;
                const offY = (rect.height - 500 * scale) / 2;
                const left = offX + (470 - 55) * scale;
                const right = offX + (470 + 55) * scale;
                const top = offY + (200 - 40) * scale;
                const bottom = offY + (200 + 30) * scale;
                const overMouth = px >= left && px <= right && py >= top && py <= bottom;
                if (!overMouth) return;
                runDirectTest(activeIdTool);
                setActiveIdTool(null);
                setCursor(null);
              }}
            >
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <CO2Workspace
                  placed={placed}
                  collectedMl={collectedMl}
                  jarCapacityMl={JAR_CAPACITY_ML}
                  reacting={reacting}
                  funnelSubmerged={funnelSubmerged}
                  jarUpright={jarUpright}
                  limewaterActive={showLimewater}
                  limewaterPhase={limewaterPhase(collectedMl)}
                  activeIdTool={activeIdTool}
                  cursor={cursor}
                  splintExtinguished={splintExtinguished}
                  mgReacted={mgReacted}
                  litmusReacted={litmusReacted}
                />
              </div>

              {/* Desktop Action Pill Bar */}
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addPrimingWater}
                  disabled={waterAdded || !placed.thistle_funnel || submitted}
                  className="h-7 text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                >
                  <Beaker className="mr-1 h-3.5 w-3.5 text-sky-400" /> পানি দাও
                </Button>
                <Button
                  size="sm"
                  variant={reacting ? "destructive" : "default"}
                  onClick={() => setReacting((v) => !v)}
                  disabled={!placed.acid_poured || submitted}
                  className={cn(
                    "h-7 text-xs font-semibold",
                    !reacting && "bg-emerald-600 hover:bg-emerald-500 text-white",
                  )}
                >
                  {reacting ? (
                    <Pause className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <Play className="mr-1 h-3.5 w-3.5" />
                  )}
                  {reacting ? "Pause" : "বিক্রিয়া শুরু"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runDirectTest("splint")}
                  disabled={!placed.gas_jar || submitted}
                  className="h-7 text-xs border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                >
                  <Flame className="mr-1 h-3.5 w-3.5 text-amber-400" /> কাঠি পরীক্ষা
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runDirectTest("limewater")}
                  disabled={!placed.delivery_tube || submitted}
                  className="h-7 text-xs border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                >
                  <TestTube2 className="mr-1 h-3.5 w-3.5 text-sky-400" /> চুনের পানি
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
              <CO2StatusPanel
                rate={rateMlPerSec}
                generated={generatedMl}
                collected={collectedMl}
                target={targetMl}
                pct={pct}
                jarUpright={jarUpright}
                setJarUpright={setJarUpright}
                tests={tests}
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
              <CO2Workspace
                placed={placed}
                collectedMl={collectedMl}
                jarCapacityMl={JAR_CAPACITY_ML}
                reacting={reacting}
                funnelSubmerged={funnelSubmerged}
                jarUpright={jarUpright}
                limewaterActive={showLimewater}
                limewaterPhase={limewaterPhase(collectedMl)}
                activeIdTool={activeIdTool}
                cursor={cursor}
                splintExtinguished={splintExtinguished}
                mgReacted={mgReacted}
                litmusReacted={litmusReacted}
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
                  <Play className="h-3 w-3" />
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
                  <span>তথ্য ও টেস্ট</span>
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
                      items={CO2_ITEMS}
                      onSelect={handleSelect}
                      highlight={guide ? nextHighlight : null}
                      disabled={() => submitted}
                    />
                    <CO2ConfigPanel config={cfg} onChange={setCfg} />
                  </div>
                )}

                {mobileTab === "controls" && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                      <div className="text-xs font-bold text-slate-200">ল্যাব অ্যাকশন</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addPrimingWater}
                          disabled={waterAdded || !placed.thistle_funnel || submitted}
                          className="h-9 text-xs border-slate-700 bg-slate-800/80 text-slate-200"
                        >
                          <Beaker className="mr-1.5 h-4 w-4 text-sky-400" /> পানি যোগ করো
                        </Button>
                        <Button
                          size="sm"
                          variant={reacting ? "destructive" : "default"}
                          onClick={() => setReacting((v) => !v)}
                          disabled={!placed.acid_poured || submitted}
                          className={cn(
                            "h-9 text-xs font-semibold",
                            !reacting && "bg-emerald-600 hover:bg-emerald-500 text-white",
                          )}
                        >
                          {reacting ? (
                            <Pause className="mr-1.5 h-4 w-4" />
                          ) : (
                            <Play className="mr-1.5 h-4 w-4" />
                          )}
                          {reacting ? "Pause" : "বিক্রিয়া শুরু"}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                      <div className="text-xs font-bold text-slate-200">
                        শনাক্তকরণ পরীক্ষা (Direct Test Triggers)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runDirectTest("splint")}
                          disabled={!placed.gas_jar || submitted}
                          className="h-9 text-xs justify-start border-amber-500/30 bg-amber-500/10 text-amber-300"
                        >
                          <Flame className="mr-1.5 h-4 w-4 text-amber-400 shrink-0" /> জ্বলন্ত কাঠি
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runDirectTest("limewater")}
                          disabled={!placed.delivery_tube || submitted}
                          className="h-9 text-xs justify-start border-sky-500/30 bg-sky-500/10 text-sky-300"
                        >
                          <TestTube2 className="mr-1.5 h-4 w-4 text-sky-400 shrink-0" /> চুনের পানি
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runDirectTest("mg")}
                          disabled={!placed.gas_jar || submitted}
                          className="h-9 text-xs justify-start border-slate-600 bg-slate-800/80 text-slate-200"
                        >
                          <Sparkles className="mr-1.5 h-4 w-4 text-yellow-300 shrink-0" /> Mg ফিতা
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runDirectTest("litmus")}
                          disabled={!placed.gas_jar || submitted}
                          className="h-9 text-xs justify-start border-blue-500/30 bg-blue-500/10 text-blue-300"
                        >
                          <Beaker className="mr-1.5 h-4 w-4 text-blue-400 shrink-0" /> নীল লিটমাস
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
                  <CO2StatusPanel
                    rate={rateMlPerSec}
                    generated={generatedMl}
                    collected={collectedMl}
                    target={targetMl}
                    pct={pct}
                    jarUpright={jarUpright}
                    setJarUpright={setJarUpright}
                    tests={tests}
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
                          experiment="co2_prep"
                          defaultTopic="Laboratory preparation of CO₂ from CaCO₃ and dilute HCl"
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

        {/* ── Chapter 7 Theory Drawer ── */}
        <Drawer open={showTheory} onOpenChange={setShowTheory}>
          <DrawerContent className="max-h-[85dvh] bg-slate-900 text-slate-100 border-slate-800">
            <DrawerHeader className="pb-2 border-b border-slate-800">
              <DrawerTitle className="text-base font-bold flex items-center gap-2 text-emerald-400">
                <BookOpen className="h-4 w-4" /> অধ্যায় ৭: কার্বন ডাইঅক্সাইড প্রস্তুতি ও ধর্ম
              </DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="px-4 py-4 max-h-[70dvh]">
              <div className="prose prose-invert prose-sm max-w-none space-y-4 text-slate-300">
                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">
                    ১. মূল বিক্রিয়া (Chemical Equation)
                  </h4>
                  <p className="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-emerald-300 text-xs">
                    CaCO₃ (s) + 2 HCl (aq) → CaCl₂ (aq) + H₂O (l) + CO₂ (g) ↑
                  </p>
                  <p className="text-xs mt-1 text-slate-400">
                    গোলতলী ফ্লাস্কে মার্বেল কুচি (CaCO₃) নিয়ে থিসল ফানেল দিয়ে লঘু হাইড্রোক্লোরিক
                    এসিড যোগ করলে তীব্র বুদবুদসহ কার্বন ডাইঅক্সাইড গ্যাস উৎপন্ন হয়।
                  </p>
                </div>

                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">
                    ২. গ্যাস সংগ্রহ পদ্ধতি (Upward Displacement of Air)
                  </h4>
                  <p className="text-xs text-slate-400">
                    CO₂ বাতাসের চেয়ে ভারী (বাষ্প ঘনত্ব ২২, বাতাসের গড় ঘনত্ব প্রায় ১৪.৪)। তাই
                    গ্যাস জারকে সোজা মুখ উপরে রেখে বাতাসের ঊর্ধ্ব অপসারণ (Upward displacement of
                    air) দ্বারা গ্যাসটি জারের তলায় জমা করা হয়।
                  </p>
                </div>

                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">
                    ৩. শনাক্তকরণ পরীক্ষা (Identification Tests)
                  </h4>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-300">
                    <li>
                      <strong className="text-slate-100">জ্বলন্ত কাঠি:</strong> CO₂ নিজে জ্বলে না
                      এবং দহনে সহায়তা করে না, তাই জারের মুখে জ্বলন্ত কাঠি ধরলে সাথে সাথে নিভে যায়।
                    </li>
                    <li>
                      <strong className="text-slate-100">চুনের পানি:</strong> CO₂ চুনের পানিতে চালনা
                      করলে অদ্রবণীয় ক্যালসিয়াম কার্বনেট তৈরির কারণে পানি ঘোলা হয়। অতিরিক্ত চালনা
                      করলে দ্রবণীয় ক্যালসিয়াম বাইকার্বনেট গঠিত হয়ে আবার স্বচ্ছ হয়ে যায়:
                      <div className="font-mono text-[11px] text-emerald-300 my-1">
                        Ca(OH)₂ + CO₂ → CaCO₃ ↓ + H₂O (ঘোলা)
                      </div>
                      <div className="font-mono text-[11px] text-emerald-300">
                        CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂ (স্বচ্ছ)
                      </div>
                    </li>
                    <li>
                      <strong className="text-slate-100">ম্যাগনেসিয়াম ফিতা:</strong> জ্বলন্ত
                      ম্যাগনেসিয়াম ফিতা প্রবেশ করালে তা সাদা শিখায় জ্বলতে থাকে এবং কালো কার্বন ও
                      সাদা MgO অধঃক্ষেপ পড়ে।
                    </li>
                    <li>
                      <strong className="text-slate-100">নীল লিটমাস:</strong> আর্দ্র নীল লিটমাস
                      পেপার ধরলে তা মৃদু লাল বর্ণ ধারণ করে, কারণ CO₂ পানিতে দ্রবীভূত হয়ে মৃদু
                      কার্বনিক এসিড (H₂CO₃) তৈরি করে।
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

function CO2ConfigPanel({
  config,
  onChange,
}: {
  config: CO2Config;
  onChange: (c: CO2Config) => void;
}) {
  const [draft, setDraft] = useState(config);
  useEffect(() => setDraft(config), [config]);
  const apply = () => {
    if (draft.caco3MassG <= 0 || draft.hclConcM <= 0 || draft.hclVolumeMl <= 0) {
      toast.error("Values must be positive");
      return;
    }
    onChange(draft);
    try {
      localStorage.setItem("co2:config", JSON.stringify(draft));
    } catch {
      /* ignore */
    }
    toast.success("Configuration saved");
  };
  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Teacher Config · শিক্ষকের সেটিংস
      </h3>
      <Field
        label="CaCO₃ mass (g) · ভর"
        value={draft.caco3MassG}
        onChange={(caco3MassG) => setDraft({ ...draft, caco3MassG })}
      />
      <Field
        label="HCl conc. (mol/L) · ঘনমাত্রা"
        value={draft.hclConcM}
        onChange={(hclConcM) => setDraft({ ...draft, hclConcM })}
      />
      <Field
        label="HCl volume (mL) · আয়তন"
        value={draft.hclVolumeMl}
        onChange={(hclVolumeMl) => setDraft({ ...draft, hclVolumeMl })}
      />
      <div className="text-xs text-muted-foreground">
        Theoretical CO₂ = <span className="font-mono">{maxCO2VolumeMl(draft).toFixed(0)}</span> mL
        at STP
      </div>
      <Button onClick={apply} size="sm" className="w-full">
        Apply · প্রয়োগ
      </Button>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step="0.1"
        min="0"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

function CO2StatusPanel({
  rate,
  generated,
  collected,
  target,
  pct,
  jarUpright,
  setJarUpright,
  tests,
}: {
  rate: number;
  generated: number;
  collected: number;
  target: number;
  pct: number;
  jarUpright: boolean;
  setJarUpright: (v: boolean) => void;
  tests: Record<TestId, TestResult>;
}) {
  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Live Data · সরাসরি তথ্য
      </h3>
      <div className="rounded-lg bg-[oklch(0.2_0.06_220)] p-3 text-[oklch(0.92_0.18_220)] shadow-inner">
        <div className="flex justify-between text-xs opacity-70">
          <span>CO₂ collected (mL)</span>
          <span>Rate (mL/s)</span>
        </div>
        <div className="flex justify-between text-2xl font-bold">
          <span>{collected.toFixed(1)}</span>
          <span>{rate.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Jar fill · জারের ভর্তি</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <Progress value={pct} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Target" value={`${target.toFixed(0)} mL`} />
        <Stat label="Generated" value={`${generated.toFixed(0)} mL`} />
      </div>

      <div className="flex items-center justify-between rounded-md border bg-card p-2">
        <div className="text-xs">
          <div className="font-medium">Jar upright (upward displacement)</div>
          <div className="text-[10px] text-muted-foreground">
            CO₂ heavier than air · CO₂ বাতাসের চেয়ে ভারী
          </div>
        </div>
        <Switch checked={jarUpright} onCheckedChange={setJarUpright} />
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
          Identification tests
        </div>
        <ul className="space-y-1 text-xs">
          <TestRow
            icon={<TestTube2 className="h-3.5 w-3.5" />}
            label="Limewater · চুনের পানি ঘোলা"
            result={tests.limewater}
          />
          <TestRow
            icon={<Flame className="h-3.5 w-3.5" />}
            label="Burning splint extinguishes · জ্বলন্ত কাঠি নিভে যায়"
            result={tests.burning_splint}
          />
          <TestRow
            icon={<TestTube2 className="h-3.5 w-3.5" />}
            label="Moist blue litmus → faint red"
            result={tests.litmus}
          />
          <TestRow
            icon={<Flame className="h-3.5 w-3.5" />}
            label="Mg ribbon burns → black C"
            result={tests.magnesium}
          />
        </ul>
      </div>
    </Card>
  );
}

function TestRow({
  icon,
  label,
  result,
}: {
  icon: React.ReactNode;
  label: string;
  result: TestResult;
}) {
  const color =
    result === "pass"
      ? "text-emerald-600"
      : result === "fail"
        ? "text-destructive"
        : "text-muted-foreground";
  const mark = result === "pass" ? "✓" : result === "fail" ? "✗" : "—";
  return (
    <li className={`flex items-center justify-between gap-2 ${color}`}>
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="font-mono">{mark}</span>
    </li>
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
