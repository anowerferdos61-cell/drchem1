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
} from "lucide-react";

import EquipmentPanel, { CO2_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import CO2Workspace, { type IdTool } from "./workspaces/CO2Workspace";
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
      label: "Secure two-hole cork with thistle funnel & delivery tube · কর্ক দিয়ে থিসল ফানেল ও ডেলিভারি টিউব আটকাও।",
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
      label: "Observe bubbles & collect CO₂ in the gas jar · বুদবুদ পর্যবেক্ষণ করো ও CO₂ সংগ্রহ করো।",
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
  // Identification-test interaction state
  const [activeIdTool, setActiveIdTool] = useState<IdTool>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [splintExtinguished, setSplintExtinguished] = useState(false);
  const [mgReacted, setMgReacted] = useState(false);
  const [litmusReacted, setLitmusReacted] = useState(false);
  const workspaceRef = useRef<HTMLElement>(null);
  const startedAtRef = useRef<number | null>(null);

  // Hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem("co2:config");
      if (raw) setCfg(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const targetMl = useMemo(
    () => Math.min(maxCO2VolumeMl(cfg), JAR_CAPACITY_ML),
    [cfg],
  );
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
              message:
                "Thistle funnel tip is not submerged — CO₂ will escape through the funnel.",
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
      <div className="min-h-screen p-3 md:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Experiments
            </Button>
            <FlaskRound className="h-6 w-6 text-emerald-600" />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Preparation of CO₂ · কার্বন ডাইঅক্সাইড প্রস্তুতি
              </h1>
              <p className="text-xs text-muted-foreground">
                CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂
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
            showPanels ? "lg:grid-cols-[260px_1fr_300px]" : "grid-cols-1",
          ].join(" ")}
        >
          {/* Left */}
          {showPanels && (
            <div className="space-y-3">
              <EquipmentPanel
                items={CO2_ITEMS}
                onSelect={handleSelect}
                highlight={guide ? nextHighlight : null}
                disabled={() => submitted}
              />
              <CO2ConfigPanel config={cfg} onChange={setCfg} />
            </div>
          )}

          {/* Center */}
          <section
            className="relative rounded-2xl border bg-card/60 shadow-xl backdrop-blur"
            style={{ minHeight: 480 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/equipment") as EquipmentId;
              if (id) handleSelect(id);
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
              />
            </div>

            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap justify-center gap-2 rounded-full border bg-background/90 p-1.5 shadow-lg backdrop-blur">
              <Button
                size="sm"
                variant="outline"
                onClick={addPrimingWater}
                disabled={waterAdded || !placed.thistle_funnel || submitted}
              >
                <Beaker className="mr-1 h-4 w-4" /> Add water
              </Button>
              <Button
                size="sm"
                variant={reacting ? "destructive" : "default"}
                onClick={() => setReacting((v) => !v)}
                disabled={!placed.acid_poured || submitted}
              >
                {reacting ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
                {reacting ? "Pause" : "Resume"}
              </Button>
              <Button size="sm" variant="outline" onClick={reset}>
                <RotateCcw className="mr-1 h-4 w-4" /> Reset
              </Button>
              <Button size="sm" onClick={submit} disabled={submitted}>
                <Trophy className="mr-1 h-4 w-4" /> Submit
              </Button>
            </div>
          </section>

          {/* Right */}
          {showPanels && (
            <div className="space-y-3">
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
              experiment="co2_prep"
              defaultTopic="Laboratory preparation of CO₂ from CaCO₃ and dilute HCl"
            />
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
        Theoretical CO₂ ={" "}
        <span className="font-mono">{maxCO2VolumeMl(draft).toFixed(0)}</span> mL at STP
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
