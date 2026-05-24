/**
 * Virtual Chemistry Lab — Acid-Base Titration (HCl + NaOH).
 * Central brain: holds ALL state and orchestrates the lab + viva.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Trophy,
  GraduationCap,
} from "lucide-react";

import EquipmentPanel from "@/components/lab/EquipmentPanel";
import StatusPanel from "@/components/lab/StatusPanel";
import StepsPanel from "@/components/lab/StepsPanel";
import ConfigPanel from "@/components/lab/ConfigPanel";
import LabReport from "@/components/lab/LabReport";
import TeacherViva, { type VivaQuestion } from "@/components/viva/TeacherViva";
import StudentViva from "@/components/viva/StudentViva";

import {
  computePH,
  equivalenceVolume,
  grade as gradeFn,
  type TitrationConfig,
} from "@/lib/chemistry";
import type { ExperimentId, Mistake, Mode, Placed, Report, Step } from "@/components/lab/types";
import ExperimentPicker from "@/components/lab/ExperimentPicker";
import Dashboard from "@/components/lab/Dashboard";
import OxygenLab from "@/components/lab/OxygenLab";
import CO2Lab from "@/components/lab/CO2Lab";
import NaClLab from "@/components/lab/NaClLab";
import IonicLab from "@/components/lab/IonicLab";
import LabAIAssistant from "@/components/lab/LabAIAssistant";
import { setAIContext, useAIContext } from "@/lib/ai-context-store";


import { ArrowLeft } from "lucide-react";

// 3D scene is heavy — lazy load.
const LabWorkspace = lazy(() => import("@/components/lab/LabWorkspace"));

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Virtual Chemistry Lab · AI-Powered Portal" },
      {
        name: "description",
        content:
          "Virtual Chemistry Lab Portal — interactive experiments, AI tutoring, smart notes, video lessons & live support for Bangladeshi students.",
      },
    ],
  }),
});

const DEFAULT_CONFIG: TitrationConfig = { Ma: 0.1, Va: 25, Mb: 0.1 };

const INITIAL_PLACED: Placed = {
  flask: false,
  burette: false,
  clamp: false,
  hcl: false,
  naoh: false,
  indicator: false,
};

function buildSteps(): Step[] {
  return [
    { id: "clamp", label: "Set up stand & clamp · স্ট্যান্ড বসান", done: false },
    { id: "burette", label: "Mount burette · বিউরেট লাগান", done: false },
    { id: "flask", label: "Place conical flask · ফ্লাস্ক বসান", done: false },
    { id: "hcl", label: "Add HCl to flask · ফ্লাস্কে HCl ঢালুন", done: false },
    { id: "naoh", label: "Fill burette with NaOH · বিউরেটে NaOH ভরুন", done: false },
    {
      id: "indicator",
      label: "Add phenolphthalein · ফেনলফথ্যালিন যোগ করুন",
      done: false,
    },
    { id: "titrate", label: "Open stopcock and titrate · টাইট্রেট করুন", done: false },
    { id: "endpoint", label: "Stop at endpoint · এন্ডপয়েন্টে থামুন", done: false },
  ];
}

type EquipmentSelectId =
  | "flask"
  | "burette"
  | "beaker"
  | "pipette"
  | "hcl"
  | "naoh"
  | "phenolphthalein"
  | "clamp";

function Index() {
  const [activeExperiment, setActiveExperiment] = useState<ExperimentId | null>(null);
  const [showExperiments, setShowExperiments] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lab:activeExperiment");
      if (raw === "titration" || raw === "oxygen_prep" || raw === "co2_prep" || raw === "nacl_crystal" || raw === "ionic_covalent") {
        setActiveExperiment(raw);
        setShowExperiments(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const pick = useCallback((id: ExperimentId) => {
    setActiveExperiment(id);
    try {
      localStorage.setItem("lab:activeExperiment", id);
    } catch {
      /* ignore */
    }
  }, []);

  const back = useCallback(() => {
    setActiveExperiment(null);
    setShowExperiments(false);
    try {
      localStorage.removeItem("lab:activeExperiment");
    } catch {
      /* ignore */
    }
  }, []);

  let content: React.ReactNode;
  if (activeExperiment === null && !showExperiments) {
    content = (
      <Dashboard
        onEnterExperiments={() => setShowExperiments(true)}
        onPickExperiment={pick}
      />
    );
  } else if (activeExperiment === null && showExperiments) {
    content = <ExperimentPicker onPick={pick} />;
  } else if (activeExperiment === "oxygen_prep") {
    content = <OxygenLab onBack={back} />;
  } else if (activeExperiment === "co2_prep") {
    content = <CO2Lab onBack={back} />;
  } else if (activeExperiment === "nacl_crystal") {
    content = <NaClLab onBack={back} />;
  } else {
    content = <TitrationLab onBack={back} />;
  }

  // Reset assistant context when on dashboard
  useEffect(() => {
    if (activeExperiment === null && !showExperiments) {
      setAIContext({
        experimentId: "none",
        mode: "guide",
        currentStep: 0,
        mistakesMade: [],
        goal: "Choose an experiment to begin",
      });
    }
  }, [activeExperiment, showExperiments]);

  const aiCtx = useAIContext();
  // Floating AI assistant: ONLY inside an active experiment (not on dashboard / picker).
  const showFloatingAI = activeExperiment !== null;
  return (
    <>
      {content}
      {showFloatingAI && <LabAIAssistant context={aiCtx} />}
    </>
  );
}



function TitrationLab({ onBack }: { onBack: () => void }) {
  // ── Core state ──────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("guide");
  const [config, setConfig] = useState<TitrationConfig>(DEFAULT_CONFIG);
  const [placed, setPlaced] = useState<Placed>(INITIAL_PLACED);
  const [Vb, setVb] = useState(0);
  const [stopcockOpen, setStopcockOpen] = useState(false);
  const [stirring, setStirring] = useState(false);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [steps, setSteps] = useState<Step[]>(buildSteps);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [timer] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showPanels, setShowPanels] = useState(true);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [showViva, setShowViva] = useState(false);

  // Publish AI assistant context
  useEffect(() => {
    const stepIdx = steps.findIndex((s) => !s.done);
    const chemicals: string[] = [];
    if (placed.hcl) chemicals.push("HCl");
    if (placed.naoh) chemicals.push("NaOH");
    if (placed.indicator) chemicals.push("phenolphthalein");
    const equipment: string[] = [];
    if (placed.clamp) equipment.push("stand & clamp");
    if (placed.burette) equipment.push("burette");
    if (placed.flask) equipment.push("conical flask");
    setAIContext({
      experimentId: "titration",
      mode,
      currentStep: stepIdx < 0 ? steps.length : stepIdx,
      mistakesMade: mistakes.map((m) => m.message),
      currentChemicals: chemicals,
      currentEquipment: equipment,
      goal: "Acid-base titration of HCl with NaOH to find the endpoint",
    });
  }, [mode, steps, placed, mistakes]);


  // Hydrate config from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("titration:config");
      if (raw) setConfig(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // ── Derived ────────────────────────────────────────────────
  const Ve = useMemo(() => equivalenceVolume(config), [config]);
  const pH = useMemo(
    () => computePH({ ...config, Vb: placed.hcl ? Vb : 0 }),
    [config, Vb, placed.hcl],
  );

  // ── Mistake logger ─────────────────────────────────────────
  const logMistake = useCallback((m: Omit<Mistake, "ts">) => {
    const entry: Mistake = { ...m, ts: Date.now() };
    setMistakes((prev) => [...prev, entry]);
    if (m.severity === "high") toast.error(m.message);
    else toast.warning(m.message);
  }, []);

  const completeStep = useCallback((id: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: true } : s)));
  }, []);

  // ── Equipment placement handler (drag/click) ───────────────
  const handleSelect = useCallback(
    (rawId: import("@/components/lab/types").EquipmentId) => {
      if (submitted) return;
      if (!startedAt) setStartedAt(Date.now());
      const id = rawId as EquipmentSelectId;

      switch (id) {
        case "clamp":
          if (placed.clamp) return;
          setPlaced((p) => ({ ...p, clamp: true }));
          completeStep("clamp");
          toast.success("Stand & clamp ready");
          break;
        case "burette":
          if (!placed.clamp) {
            logMistake({
              type: "burette_before_clamp",
              severity: "med",
              message: "Mount the clamp first before placing the burette.",
            });
            return;
          }
          if (placed.burette) return;
          setPlaced((p) => ({ ...p, burette: true }));
          completeStep("burette");
          break;
        case "flask":
          if (placed.flask) return;
          setPlaced((p) => ({ ...p, flask: true }));
          completeStep("flask");
          break;
        case "hcl":
          if (!placed.flask) {
            logMistake({
              type: "no_flask",
              severity: "high",
              message: "Place the conical flask before pouring HCl.",
            });
            return;
          }
          setPlaced((p) => ({ ...p, hcl: true }));
          completeStep("hcl");
          toast.success(`Poured ${config.Va.toFixed(1)} mL of HCl`);
          break;
        case "naoh":
          if (!placed.burette) {
            logMistake({
              type: "burette_before_clamp",
              severity: "high",
              message: "Mount the burette before filling with NaOH.",
            });
            return;
          }
          setPlaced((p) => ({ ...p, naoh: true }));
          completeStep("naoh");
          break;
        case "phenolphthalein":
          if (!placed.hcl) {
            logMistake({
              type: "no_flask",
              severity: "med",
              message: "Add HCl to the flask before the indicator.",
            });
            return;
          }
          setPlaced((p) => ({ ...p, indicator: true }));
          completeStep("indicator");
          break;
        case "beaker":
        case "pipette":
          // Available for visual completeness; no state change.
          toast.info("Used as auxiliary glassware.");
          break;
      }
    },
    [placed, completeStep, logMistake, config.Va, startedAt, submitted],
  );

  // ── Stopcock + titration animation loop ────────────────────
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const toggleStopcock = () => {
    if (submitted) return;
    if (!placed.naoh) {
      logMistake({
        type: "stopcock_before_naoh",
        severity: "high",
        message: "Fill the burette with NaOH before opening the stopcock.",
      });
      return;
    }
    if (!placed.indicator) {
      logMistake({
        type: "stopcock_before_indicator",
        severity: "high",
        message: "Add phenolphthalein before titrating.",
      });
      return;
    }
    setStopcockOpen((v) => !v);
    setStirring(true);
    completeStep("titrate");
  };

  useEffect(() => {
    if (!stopcockOpen) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setVb((prev) => {
        const distance = Math.abs(Ve - prev);
        // Adaptive rate: 2.5 mL/s far from Ve, 0.2 mL/s near it.
        const rate = distance > 2 ? 2.5 : Math.max(0.2, distance * 0.4);
        const next = prev + rate * dt;
        // Over-titration mistake
        if (next > Ve + 1 && prev <= Ve + 1) {
          logMistake({
            type: "over_titration",
            severity: "high",
            message: `Over-titration: passed endpoint by > 1 mL (Ve = ${Ve.toFixed(2)} mL).`,
          });
        }
        return Math.min(next, 50);
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stopcockOpen, Ve, logMistake]);

  // Detect endpoint reached (within 0.05 mL)
  useEffect(() => {
    if (!stopcockOpen) return;
    if (Math.abs(Vb - Ve) < 0.05) {
      completeStep("endpoint");
    }
  }, [Vb, Ve, stopcockOpen, completeStep]);

  // ── Timer disabled per request ─────────────────────────────

  // ── Submit / reset ─────────────────────────────────────────
  const submit = () => {
    if (!placed.indicator || Vb === 0) {
      logMistake({
        type: "incomplete_submit",
        severity: "low",
        message: "Submitted without completing the titration.",
      });
    }
    setStopcockOpen(false);
    setStirring(false);
    const accuracy =
      Ve > 0 ? Math.max(0, 100 - (Math.abs(Vb - Ve) / Ve) * 100) : 0;
    const r: Report = {
      experiment: "titration",
      Vb_final: Vb,
      Ve,
      accuracy,
      grade: gradeFn(accuracy),
      durationSec: timer,
      mistakes,
      steps,
    };
    setReport(r);
    setSubmitted(true);
    toast.success(`Submitted! Grade: ${r.grade}`);
  };

  const resetLab = () => {
    setPlaced(INITIAL_PLACED);
    setVb(0);
    setStopcockOpen(false);
    setStirring(false);
    setMistakes([]);
    setSteps(buildSteps());
    setStartedAt(null);
    
    setSubmitted(false);
    setReport(null);
  };

  // ── Guide-mode hints ───────────────────────────────────────
  const nextHint = useMemo(() => {
    if (!placed.clamp) return "Place the stand & clamp first.";
    if (!placed.burette) return "Mount the burette on the clamp.";
    if (!placed.flask) return "Place the conical flask under the burette.";
    if (!placed.hcl) return `Pour ${config.Va} mL of HCl into the flask.`;
    if (!placed.naoh) return "Fill the burette with NaOH.";
    if (!placed.indicator) return "Add 2–3 drops of phenolphthalein.";
    if (!stopcockOpen) return "Open the stopcock to start titration.";
    if (Math.abs(Vb - Ve) > 0.3) return "Watch closely for the pink endpoint.";
    return "You've reached the endpoint — close the stopcock and submit!";
  }, [placed, stopcockOpen, Vb, Ve, config.Va]);

  const nextHighlight: EquipmentSelectId | null = useMemo(() => {
    if (!placed.clamp) return "clamp";
    if (!placed.burette) return "burette";
    if (!placed.flask) return "flask";
    if (!placed.hcl) return "hcl";
    if (!placed.naoh) return "naoh";
    if (!placed.indicator) return "phenolphthalein";
    return null;
  }, [placed]);

  // ── Render ─────────────────────────────────────────────────
  const classroom = false;
  const guide = mode === "guide";

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen p-3 md:p-6">
        {/* Top bar */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Experiments
            </Button>
            <FlaskConical className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Virtual Chemistry Lab · ভার্চুয়াল রসায়ন ল্যাব
              </h1>
              <p className="text-xs text-muted-foreground">
                Acid-Base Titration · HCl + NaOH
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
            showPanels && !classroom
              ? "lg:grid-cols-[260px_1fr_280px]"
              : "grid-cols-1",
          ].join(" ")}
        >
          {/* Left panel */}
          {showPanels && !classroom && (
            <div className="space-y-3">
              <EquipmentPanel
                onSelect={handleSelect}
                highlight={guide ? nextHighlight : null}
                disabled={() => submitted}
              />
              <ConfigPanel config={config} onChange={setConfig} />
            </div>
          )}

          {/* Center: 3D workspace */}
          <section
            className="relative rounded-2xl border bg-card/60 shadow-xl backdrop-blur"
            style={{ minHeight: classroom ? 640 : 480 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/equipment") as EquipmentSelectId;
              if (id) handleSelect(id);
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden rounded-2xl"
              style={{ transform: classroom ? "scale(1.18)" : undefined, transformOrigin: "center" }}
            >
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Loading 3D scene…
                  </div>
                }
              >
                <LabWorkspace
                  placed={placed}
                  Vb={Vb}
                  Ve={Ve}
                  pH={pH}
                  stopcockOpen={stopcockOpen}
                  stirring={stirring}
                  classroom={classroom}
                />
              </Suspense>
            </div>

            {/* Workspace controls */}
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full border bg-background/90 p-1.5 shadow-lg backdrop-blur">
              <Button
                size="sm"
                variant={stopcockOpen ? "destructive" : "default"}
                onClick={toggleStopcock}
                disabled={submitted}
              >
                {stopcockOpen ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
                {stopcockOpen ? "Close" : "Open"} stopcock
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setStirring((v) => !v)}
                disabled={!placed.hcl || submitted}
              >
                {stirring ? "Stop stir" : "Stir"}
              </Button>
              <Button size="sm" variant="outline" onClick={resetLab}>
                <RotateCcw className="mr-1 h-4 w-4" /> Reset · পুনরায়
              </Button>
              <Button size="sm" onClick={submit} disabled={submitted}>
                <Trophy className="mr-1 h-4 w-4" /> Submit · জমা
              </Button>
            </div>
          </section>

          {/* Right panel */}
          {showPanels && !classroom && (
            <div className="space-y-3">
              <StatusPanel
                Vb={Vb}
                Ve={Ve}
                pH={pH}
                Ma={config.Ma}
                Va={config.Va}
                Mb={config.Mb}
                
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

        {/* Report */}
        {report && (
          <div className="mt-6">
            <LabReport report={report} onReset={resetLab} />
          </div>
        )}

        {/* Viva drawer */}
        {showViva && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <TeacherViva onPublish={setVivaQuestions} />
            <StudentViva />
            {vivaQuestions.length === 0 && (
              <p className="col-span-full text-center text-xs text-muted-foreground">
                Teacher generates and publishes questions. Students answer them and get AI grading.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const opts: Array<{ id: Mode; label: string; icon: typeof Play }> = [
    { id: "guide", label: "Guide", icon: Eye },
    { id: "student", label: "Student", icon: GraduationCap },
  ];
  return (
    <div className="flex rounded-md border bg-muted p-0.5 text-xs">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setMode(o.id)}
            className={[
              "flex items-center gap-1 rounded px-2.5 py-1 transition",
              active ? "bg-background shadow-sm font-medium" : "text-muted-foreground",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5" /> {o.label}
          </button>
        );
      })}
    </div>
  );
}
