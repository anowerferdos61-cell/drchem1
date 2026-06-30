/**
 * Virtual Chemistry Lab — Acid-Base Titration (HCl + NaOH).
 * Central brain: holds ALL state and orchestrates the lab + viva.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ErrorInfo, type LazyExoticComponent, type ReactNode } from "react";
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

import LabAIAssistant from "@/components/lab/LabAIAssistant";
import LandscapeWrapper from "@/components/lab/LandscapeGate";


import { setAIContext, useAIContext } from "@/lib/ai-context-store";


import { ArrowLeft } from "lucide-react";

// 3D scene is heavy — lazy load.
const LabWorkspace = lazy(() => import("@/components/lab/LabWorkspace"));

type LabComponent = ComponentType<{ onBack: () => void }>;

const LAB_COMPONENTS: Partial<Record<ExperimentId, LazyExoticComponent<LabComponent>>> = {
  oxygen_prep: lazy(() => import("@/components/lab/OxygenLab")),
  co2_prep: lazy(() => import("@/components/lab/CO2Lab")),
  nacl_crystal: lazy(() => import("@/components/lab/NaClLab")),
  ionic_covalent: lazy(() => import("@/components/lab/IonicLab")),
  na2co3_standard: lazy(() => import("@/components/lab/Na2CO3Lab")),
  cuso4_water: lazy(() => import("@/components/lab/CopperSulfateLab")),
  ph_scale: lazy(() => import("@/components/lab/PHScaleLab")),
  indicator_compare: lazy(() => import("@/components/lab/IndicatorLab")),
  solubility_rules: lazy(() => import("@/components/lab/SolubilityLab")),
  electrochemical_series: lazy(() => import("@/components/lab/ElectrochemicalSeriesLab")),
  bonding_basics: lazy(() => import("@/components/lab/BondingLab")),
  electron_config: lazy(() => import("@/components/lab/ElectronConfigLab")),
  periodic_trends: lazy(() => import("@/components/lab/PeriodicTrendsLab")),
  group_reactivity: lazy(() => import("@/components/lab/GroupReactivityLab")),
  periodic_anomalies: lazy(() => import("@/components/lab/PeriodicAnomaliesLab")),
  kinetic_theory: lazy(() => import("@/components/lab/KineticTheoryLab")),
  diffusion_race: lazy(() => import("@/components/lab/DiffusionLab")),
  heating_curve: lazy(() => import("@/components/lab/HeatingCurveLab")),
  atom_builder: lazy(() => import("@/components/lab/AtomBuilderLab")),
  atom_models: lazy(() => import("@/components/lab/AtomModelsLab")),
};

function LabLoadingFallback({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        <p className="text-sm text-slate-300">ল্যাব প্রস্তুত হচ্ছে…</p>
        <Button variant="outline" size="sm" onClick={onBack} className="mt-4 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800">
          ড্যাশবোর্ডে ফিরুন
        </Button>
      </div>
    </div>
  );
}

class LabErrorBoundary extends Component<
  { children: ReactNode; onBack: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Lab render failed", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="max-w-md text-center">
          <FlaskConical className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
          <h2 className="text-lg font-bold">এই ল্যাবটি লোড হয়নি</h2>
          <p className="mt-2 text-sm text-slate-400">
            ড্যাশবোর্ডে ফিরে আবার চেষ্টা করুন—অ্যাপ আর অসীম “লোড হচ্ছে” অবস্থায় আটকে থাকবে না।
          </p>
          <Button onClick={this.props.onBack} className="mt-5">
            ড্যাশবোর্ডে ফিরুন
          </Button>
        </div>
      </div>
    );
  }
}

export const Route = createFileRoute("/app/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Virtual Lab · Dr. Chem" },
      {
        name: "description",
        content:
          "Dr. Chem Virtual Lab — interactive chemistry experiments, AI tutoring and viva practice for Class 9-10 students and teachers, in Bangla and English.",
      },
      { property: "og:title", content: "Virtual Lab · Dr. Chem" },
      {
        property: "og:description",
        content:
          "Interactive chemistry experiments with an AI tutor and viva practice for Class 9-10.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchem.lovable.app/app" },
    ],
    links: [{ rel: "canonical", href: "https://drchem.lovable.app/app" }],
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
  // Auth guard — redirect to /login if not signed in
  const { isAuthenticated, loading, profile, roles, rolesLoaded } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes("admin");
  // Roles load asynchronously after the session — wait for them before rendering
  // so admins never see a flash of the student dashboard.
  const rolesReady = rolesLoaded;
  const [rolesWaitExpired, setRolesWaitExpired] = useState(false);

  useEffect(() => {
    if (loading || !isAuthenticated || rolesReady) {
      setRolesWaitExpired(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setRolesWaitExpired(true), 6_000);
    return () => window.clearTimeout(timeoutId);
  }, [loading, isAuthenticated, rolesReady]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/app" }, replace: true });
      return;
    }
    // Admins go straight to admin dashboard
    if (isAdmin) {
      void navigate({ to: "/admin", replace: true });
      return;
    }
    // Fallback for older accounts that missed signup role setup.
    if (profile && !profile.role_selected) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, isAuthenticated, isAdmin, profile, navigate]);


  const [activeExperiment, setActiveExperiment] = useState<ExperimentId | null>(null);
  const [showExperiments, setShowExperiments] = useState(false);

  // Do not auto-restore a previous lab. A stale saved lab state can trap the
  // user in the lab/loading screen after auth refreshes or a failed attempt.
  useEffect(() => {
    try {
      localStorage.removeItem("lab:activeExperiment");
    } catch {
      /* ignore */
    }
  }, []);

  const pick = useCallback((id: ExperimentId) => {
    setActiveExperiment(id);
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
  } else if (activeExperiment && LAB_COMPONENTS[activeExperiment]) {
    const ActiveLab = LAB_COMPONENTS[activeExperiment];
    content = ActiveLab ? (
      <LabErrorBoundary key={activeExperiment} onBack={back}>
        <Suspense fallback={<LabLoadingFallback onBack={back} />}>
          <ActiveLab onBack={back} />
        </Suspense>
      </LabErrorBoundary>
    ) : null;
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
  // Block any render until we're sure the user isn't an admin (avoids
  // flashing the student dashboard while role rows are still loading).
  const waitingForRoles = isAuthenticated && !rolesReady && !rolesWaitExpired;
  if (loading || !isAuthenticated || waitingForRoles || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        লোড হচ্ছে…
      </div>
    );
  }

  return (
    <>
      {showFloatingAI ? <LandscapeWrapper>{content}</LandscapeWrapper> : content}
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
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50">
        {/* ── Top bar (compact, always visible) ─────────────── */}
        <header className="flex shrink-0 items-center justify-between gap-1.5 border-b bg-card/80 px-2 py-1.5 backdrop-blur md:px-4 md:py-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-7 shrink-0 px-1.5 md:h-8 md:px-2">
              <ArrowLeft className="h-3.5 w-3.5 md:mr-1" />
              <span className="hidden md:inline">Experiments</span>
            </Button>
            <FlaskConical className="h-4 w-4 shrink-0 text-primary md:h-6 md:w-6" />
            <div className="min-w-0">
              <h1 className="truncate text-[11px] font-bold leading-tight md:text-lg">
                <span className="md:hidden">Virtual Lab · ভার্চুয়াল ল্যাব</span>
                <span className="hidden md:inline">
                  Virtual Chemistry Lab · ভার্চুয়াল রসায়ন ল্যাব
                </span>
              </h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                Acid-Base Titration · HCl + NaOH
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 md:gap-2">
            <ModeToggle mode={mode} setMode={setMode} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPanels((v) => !v)}
              className="hidden h-8 px-2 md:inline-flex"
            >
              {showPanels ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
              {showPanels ? "Hide" : "Show"} panels
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowViva((v) => !v)}
              className="h-7 px-1.5 text-[11px] md:h-8 md:px-3 md:text-sm"
            >
              <GraduationCap className="h-3.5 w-3.5 md:mr-1 md:h-4 md:w-4" />
              <span className="hidden md:inline">{showViva ? "Hide Viva" : "AI Viva"}</span>
              <span className="ml-0.5 md:hidden">Viva</span>
            </Button>
          </div>
        </header>

        {/* ── Main 3-column layout (fits in single screen on landscape) ── */}
        <div className="flex min-h-0 flex-1 gap-1.5 p-1.5 md:gap-3 md:p-4">
          {/* Left: equipment + config */}
          {showPanels && (
            <aside className="flex w-[140px] shrink-0 flex-col gap-1.5 overflow-y-auto pr-0.5 sm:w-[180px] md:w-[240px] lg:w-[260px] [&_h3]:text-[10px] md:[&_h3]:text-sm">
              <EquipmentPanel
                onSelect={handleSelect}
                highlight={guide ? nextHighlight : null}
                disabled={() => submitted}
              />
              <ConfigPanel config={config} onChange={setConfig} />
            </aside>
          )}

          {/* Center: workspace */}
          <section
            className="relative min-w-0 flex-1 overflow-hidden rounded-xl border bg-card/60 shadow-xl backdrop-blur md:rounded-2xl"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/equipment") as EquipmentSelectId;
              if (id) handleSelect(id);
            }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-xl md:rounded-2xl">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Loading scene…
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

            {/* Mobile panel toggle (top-left of workspace) */}
            <button
              onClick={() => setShowPanels((v) => !v)}
              className="absolute left-2 top-2 z-10 rounded-full border bg-background/90 p-1.5 shadow-md backdrop-blur transition-transform active:scale-95 md:hidden"
              aria-label="Toggle panels"
            >
              {showPanels ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>

            {/* Bottom action bar */}
            <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur md:bottom-3 md:gap-2 md:p-1.5">
              <Button
                size="sm"
                variant={stopcockOpen ? "destructive" : "default"}
                onClick={toggleStopcock}
                disabled={submitted}
                className="h-7 px-2 text-[11px] md:h-8 md:px-3 md:text-sm"
              >
                {stopcockOpen ? <Pause className="h-3.5 w-3.5 md:mr-1" /> : <Play className="h-3.5 w-3.5 md:mr-1" />}
                <span className="hidden md:inline">{stopcockOpen ? "Close" : "Open"} stopcock</span>
                <span className="ml-1 md:hidden">{stopcockOpen ? "Close" : "Open"}</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setStirring((v) => !v)}
                disabled={!placed.hcl || submitted}
                className="h-7 px-2 text-[11px] md:h-8 md:px-3 md:text-sm"
              >
                {stirring ? "Stop" : "Stir"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetLab}
                className="h-7 px-2 text-[11px] md:h-8 md:px-3 md:text-sm"
              >
                <RotateCcw className="h-3.5 w-3.5 md:mr-1" />
                <span className="hidden md:inline">Reset</span>
              </Button>
              <Button
                size="sm"
                onClick={submit}
                disabled={submitted}
                className="h-7 px-2 text-[11px] md:h-8 md:px-3 md:text-sm"
              >
                <Trophy className="h-3.5 w-3.5 md:mr-1" />
                <span className="hidden md:inline">Submit</span>
                <span className="ml-1 md:hidden">Submit</span>
              </Button>
            </div>
          </section>

          {/* Right: live data + steps */}
          {showPanels && (
            <aside className="flex w-[140px] shrink-0 flex-col gap-1.5 overflow-y-auto pl-0.5 sm:w-[190px] md:w-[260px] lg:w-[280px] [&_h3]:text-[10px] md:[&_h3]:text-sm">
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
            </aside>
          )}
        </div>

        {/* Report overlay */}
        {report && (
          <div className="absolute inset-0 z-20 overflow-auto bg-background/95 p-4 backdrop-blur">
            <LabReport report={report} onReset={resetLab} />
          </div>
        )}

        {/* Viva drawer */}
        {showViva && (
          <div className="absolute inset-0 z-20 overflow-auto bg-background/95 p-4 backdrop-blur">
            <div className="mb-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowViva(false)}>
                Close
              </Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <TeacherViva onPublish={setVivaQuestions} />
              <StudentViva />
              {vivaQuestions.length === 0 && (
                <p className="col-span-full text-center text-xs text-muted-foreground">
                  Teacher generates and publishes questions. Students answer them and get AI grading.
                </p>
              )}
            </div>
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
