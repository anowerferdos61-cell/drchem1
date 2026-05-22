/**
 * Self-contained Lab for "Preparation of Oxygen" experiment.
 * Owns its config, equipment, steps, mistakes, kinetics loop, viva, and report.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Eye,
  EyeOff,
  GraduationCap,
  Wind,
} from "lucide-react";

import EquipmentPanel, { OXYGEN_ITEMS } from "./EquipmentPanel";
import StepsPanel from "./StepsPanel";
import LabReport from "./LabReport";
import OxygenWorkspace from "./workspaces/OxygenWorkspace";
import TeacherViva, { type VivaQuestion } from "@/components/viva/TeacherViva";
import StudentViva from "@/components/viva/StudentViva";
import type {
  EquipmentId,
  Mistake,
  Mode,
  OxygenPlaced,
  Report,
  Step,
} from "./types";
import { setAIContext } from "@/lib/ai-context-store";

import {
  computeOxygenGeneration,
  maxOxygenVolumeMl,
  oxygenGrade,
  waterLevelPercent,
  type OxygenConfig,
} from "@/lib/oxygen";

const DEFAULT_CFG: OxygenConfig = { h2o2ConcPct: 6, h2o2VolumeMl: 20, mno2MassG: 0.5 };
const TUBE_CAPACITY_ML = 100;

const INITIAL_PLACED: OxygenPlaced = {
  reaction_tube: false,
  manganese_dioxide: false,
  delivery_tube: false,
  water_trough: false,
  collection_tube: false,
  hydrogen_peroxide: false,
};

function buildSteps(): Step[] {
  return [
    {
      id: "reaction_tube",
      label:
        "Place the reaction flask containing MnO₂ · ম্যাঙ্গানিজ ডাইঅক্সাইড সমৃদ্ধ বিক্রিয়া টেস্ট টিউবটি স্থাপন করো।",
      done: false,
    },
    {
      id: "delivery",
      label:
        "Connect delivery tube to water trough & inverted collection tube · ডেলিভারি টিউবটি ওয়াটার ট্রাফ এবং উল্টানো কালেকশন টিউবের সাথে যুক্ত করো।",
      done: false,
    },
    {
      id: "h2o2",
      label:
        "Pour H₂O₂ solution to start the reaction · বিক্রিয়া শুরু করতে হাইড্রোজেন পারঅক্সাইড দ্রবণ যোগ করো।",
      done: false,
    },
    {
      id: "collect",
      label:
        "Wait for the tube to fill by downward displacement of water · পানির নিম্নমুখী অপসারণের মাধ্যমে কালেকশন টিউবটি পূর্ণ হওয়া পর্যন্ত অপেক্ষা করো।",
      done: false,
    },
    {
      id: "splint",
      label:
        "Drag the glowing splint into the gas-filled tube · অক্সিজেন পরীক্ষার জন্য আধা-জ্বলা কাঠিটি গ্যাসপূর্ণ টিউবে প্রবেশ করাও।",
      done: false,
    },
  ];
}

interface Props {
  onBack: () => void;
}

export default function OxygenLab({ onBack }: Props) {
  const [mode, setMode] = useState<Mode>("guide");
  const [cfg, setCfg] = useState<OxygenConfig>(DEFAULT_CFG);
  const [placed, setPlaced] = useState<OxygenPlaced>(INITIAL_PLACED);
  const [reacting, setReacting] = useState(false);
  const [collectedMl, setCollectedMl] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [steps, setSteps] = useState<Step[]>(buildSteps);
  const [splintResult, setSplintResult] = useState<"pass" | "early" | "none">("none");
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showPanels, setShowPanels] = useState(true);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [showViva, setShowViva] = useState(false);

  // Publish AI assistant context
  useEffect(() => {
    const stepIdx = steps.findIndex((s) => !s.done);
    const chemicals: string[] = [];
    if (placed.hydrogen_peroxide) chemicals.push("H₂O₂");
    if (placed.manganese_dioxide) chemicals.push("MnO₂ (catalyst)");
    const equipment: string[] = [];
    if (placed.reaction_tube) equipment.push("reaction test tube");
    if (placed.delivery_tube) equipment.push("delivery tube");
    if (placed.water_trough) equipment.push("water trough");
    if (placed.collection_tube) equipment.push("collection tube");
    setAIContext({
      experimentId: "oxygen_prep",
      mode,
      currentStep: stepIdx < 0 ? steps.length : stepIdx,
      mistakesMade: mistakes.map((m) => m.message),
      currentChemicals: chemicals,
      currentEquipment: equipment,
      goal: "Prepare O₂ via H₂O₂ + MnO₂ and confirm with glowing-splint test",
    });
  }, [mode, steps, placed, mistakes]);

  const startedAtRef = useRef<number | null>(null);

  // Hydrate config
  useEffect(() => {
    try {
      const raw = localStorage.getItem("oxygen:config");
      if (raw) setCfg(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const targetMl = useMemo(() => maxOxygenVolumeMl(cfg), [cfg]);
  const waterPct = waterLevelPercent(collectedMl, TUBE_CAPACITY_ML);
  const guide = mode === "guide";

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
        case "clamp":
        case "test_tube_reaction":
          if (placed.reaction_tube) return;
          setPlaced((p) => ({ ...p, reaction_tube: true }));
          completeStep("reaction_tube");
          toast.success("Reaction flask placed on stand");
          break;
        case "manganese_dioxide":
          if (!placed.reaction_tube) {
            toast.warning("Place the reaction flask first");
            return;
          }
          setPlaced((p) => ({ ...p, manganese_dioxide: true }));
          toast.success("MnO₂ catalyst added");
          break;
        case "water_trough":
          if (placed.water_trough) return;
          setPlaced((p) => ({ ...p, water_trough: true }));
          break;
        case "test_tube_collection":
          if (!placed.water_trough) {
            toast.warning("Set up the water trough first");
            return;
          }
          setPlaced((p) => ({ ...p, collection_tube: true }));
          break;
        case "delivery_tube":
          if (!placed.reaction_tube || !placed.collection_tube) {
            toast.warning("Place the reaction flask and collection tube first");
            return;
          }
          setPlaced((p) => ({ ...p, delivery_tube: true }));
          completeStep("delivery");
          break;
        case "hydrogen_peroxide":
          if (!placed.manganese_dioxide) {
            logMistake({
              type: "no_manganese_dioxide",
              severity: "high",
              message: "Added H₂O₂ without the MnO₂ catalyst — reaction will be far too slow.",
            });
          }
          if (!placed.delivery_tube) {
            logMistake({
              type: "missing_delivery_tube",
              severity: "high",
              message: "Delivery tube not connected — O₂ gas will escape into the air.",
            });
          }
          setPlaced((p) => ({ ...p, hydrogen_peroxide: true }));
          setReacting(true);
          completeStep("h2o2");
          toast.success("H₂O₂ poured — reaction started");
          break;
        case "glowing_splint":
          // Handled via drag on workspace
          toast.info("Drag the splint to the mouth of the collection tube");
          break;
      }
    },
    [placed, completeStep, logMistake, submitted],
  );

  // ── Reaction kinetics loop ───────────────────────────────────
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
        // If delivery tube missing, no gas is collected (vents to air).
        if (placed.delivery_tube) {
          const { collectedMl: c } = computeOxygenGeneration({
            cfg,
            timeElapsedSec: next,
          });
          // Cap by tube capacity for the collected display
          const capped = Math.min(c, TUBE_CAPACITY_ML);
          setCollectedMl(capped);
          if (capped >= TUBE_CAPACITY_ML * 0.99) {
            completeStep("collect");
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
  }, [reacting, cfg, placed.delivery_tube, completeStep]);

  // ── Splint drop ──────────────────────────────────────────────
  const handleSplintDrop = useCallback(
    (hit: boolean) => {
      if (!hit) return;
      const filledFrac = collectedMl / TUBE_CAPACITY_ML;
      if (filledFrac < 0.6) {
        logMistake({
          type: "early_splint_test",
          severity: "med",
          message: "Splint tested too early — not enough O₂ collected to relight it.",
        });
        setSplintResult("early");
      } else {
        setSplintResult("pass");
        completeStep("splint");
        toast.success("Splint burst into flame — Oxygen confirmed!");
      }
    },
    [collectedMl, logMistake, completeStep],
  );

  // ── Rate display ─────────────────────────────────────────────
  const { rateMlPerSec } = useMemo(
    () => computeOxygenGeneration({ cfg, timeElapsedSec: elapsed }),
    [cfg, elapsed],
  );

  // ── Submit / reset ───────────────────────────────────────────
  const submit = () => {
    const highMistakes = mistakes.filter((m) => m.severity === "high").length;
    const { accuracy, grade } = oxygenGrade({
      collectedMl,
      targetMl: Math.min(targetMl, TUBE_CAPACITY_ML),
      highMistakes,
      splint: splintResult,
    });
    const r: Report = {
      experiment: "oxygen_prep",
      VO2_final: collectedMl,
      VO2_target: Math.min(targetMl, TUBE_CAPACITY_ML),
      splintResult,
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
    setReacting(false);
    setCollectedMl(0);
    setElapsed(0);
    setMistakes([]);
    setSteps(buildSteps());
    setSplintResult("none");
    setSubmitted(false);
    setReport(null);
    startedAtRef.current = null;
  };

  const nextHint = useMemo(() => {
    if (!placed.reaction_tube) return "Place the reaction flask on the stand.";
    if (!placed.manganese_dioxide) return "Add MnO₂ catalyst into the flask.";
    if (!placed.water_trough) return "Set up the water trough.";
    if (!placed.collection_tube) return "Invert the collection tube inside the trough.";
    if (!placed.delivery_tube) return "Connect the delivery tube.";
    if (!placed.hydrogen_peroxide) return "Pour H₂O₂ to start the reaction.";
    if (collectedMl < TUBE_CAPACITY_ML * 0.6) return "Wait — collecting oxygen…";
    if (splintResult === "none") return "Drag the glowing splint to the tube mouth.";
    return "Done — submit your report!";
  }, [placed, collectedMl, splintResult]);

  const nextHighlight: EquipmentId | null = useMemo(() => {
    if (!placed.reaction_tube) return "test_tube_reaction";
    if (!placed.manganese_dioxide) return "manganese_dioxide";
    if (!placed.water_trough) return "water_trough";
    if (!placed.collection_tube) return "test_tube_collection";
    if (!placed.delivery_tube) return "delivery_tube";
    if (!placed.hydrogen_peroxide) return "hydrogen_peroxide";
    return null;
  }, [placed]);

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen p-3 md:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Experiments
            </Button>
            <Wind className="h-6 w-6 text-sky-500" />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Preparation of Oxygen · অক্সিজেন প্রস্তুতি
              </h1>
              <p className="text-xs text-muted-foreground">
                2 H₂O₂ →[MnO₂] 2 H₂O + O₂
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
          {/* Left */}
          {showPanels && (
            <div className="space-y-3">
              <EquipmentPanel
                items={OXYGEN_ITEMS}
                onSelect={handleSelect}
                highlight={guide ? nextHighlight : null}
                disabled={() => submitted}
              />
              <OxygenConfigPanel config={cfg} onChange={setCfg} />
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
              <OxygenWorkspace
                placed={placed}
                collectedMl={collectedMl}
                tubeCapacityMl={TUBE_CAPACITY_ML}
                reacting={reacting && placed.delivery_tube}
                splintResult={splintResult}
                onSplintDrop={handleSplintDrop}
                disabled={submitted}
              />
            </div>

            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-wrap justify-center gap-2 rounded-full border bg-background/90 p-1.5 shadow-lg backdrop-blur">
              <Button
                size="sm"
                variant={reacting ? "destructive" : "default"}
                onClick={() => setReacting((v) => !v)}
                disabled={!placed.hydrogen_peroxide || submitted}
              >
                {reacting ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
                {reacting ? "Pause" : "Resume"} reaction
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
              <OxygenStatusPanel
                rate={rateMlPerSec}
                collected={collectedMl}
                target={Math.min(targetMl, TUBE_CAPACITY_ML)}
                waterPct={waterPct}
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
              experiment="oxygen_prep"
              defaultTopic="Laboratory preparation of oxygen: H₂O₂ decomposition with MnO₂ catalyst"
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

function OxygenConfigPanel({
  config,
  onChange,
}: {
  config: OxygenConfig;
  onChange: (c: OxygenConfig) => void;
}) {
  const [draft, setDraft] = useState(config);
  useEffect(() => setDraft(config), [config]);
  const apply = () => {
    if (draft.h2o2ConcPct <= 0 || draft.h2o2VolumeMl <= 0 || draft.mno2MassG <= 0) {
      toast.error("Values must be positive");
      return;
    }
    onChange(draft);
    try {
      localStorage.setItem("oxygen:config", JSON.stringify(draft));
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
        label="H₂O₂ concentration (%) · ঘনমাত্রা"
        value={draft.h2o2ConcPct}
        onChange={(h2o2ConcPct) => setDraft({ ...draft, h2o2ConcPct })}
      />
      <Field
        label="H₂O₂ volume (mL) · আয়তন"
        value={draft.h2o2VolumeMl}
        onChange={(h2o2VolumeMl) => setDraft({ ...draft, h2o2VolumeMl })}
      />
      <Field
        label="MnO₂ mass (g) · ভর"
        value={draft.mno2MassG}
        onChange={(mno2MassG) => setDraft({ ...draft, mno2MassG })}
      />
      <div className="text-xs text-muted-foreground">
        Theoretical O₂ ={" "}
        <span className="font-mono">{maxOxygenVolumeMl(draft).toFixed(0)}</span> mL at STP
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

function OxygenStatusPanel({
  rate,
  collected,
  target,
  waterPct,
}: {
  rate: number;
  collected: number;
  target: number;
  waterPct: number;
}) {
  const pct = target > 0 ? Math.min(100, (collected / target) * 100) : 0;
  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Live Data · সরাসরি তথ্য
      </h3>
      <div className="rounded-lg bg-[oklch(0.2_0.06_220)] p-3 text-[oklch(0.92_0.18_220)] shadow-inner">
        <div className="flex justify-between text-xs opacity-70">
          <span>O₂ (mL)</span>
          <span>Rate (mL/s)</span>
        </div>
        <div className="flex justify-between text-2xl font-bold">
          <span>{collected.toFixed(1)}</span>
          <span>{rate.toFixed(2)}</span>
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Collection progress</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <Progress value={pct} />
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Water level · পানির স্তর</span>
          <span>{waterPct.toFixed(0)}%</span>
        </div>
        <Progress value={waterPct} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Target" value={`${target.toFixed(0)} mL`} />
        <Stat label="Collected" value={`${collected.toFixed(1)} mL`} />
      </div>
    </Card>
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
