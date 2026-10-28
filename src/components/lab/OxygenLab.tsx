/**
 * OxygenLab.tsx — Hyper-realistic, Viewport-Locked, Mobile-Responsive Laboratory
 * Experiment: Preparation of Oxygen (2 H₂O₂ → 2 H₂O + O₂ via MnO₂)
 *
 * Key Architecture Highlights:
 * 1. 100dvh Viewport Locking: Fits laptop screens without any page/window scrolling.
 * 2. Mobile Split-Screen UX: Top 46% pinned live simulation + Bottom 54% interactive tabbed tray.
 * 3. Realistic Visuals & Sound/Toast feedback.
 * 4. Deep Theory Integration with quick-access drawer & chapter links.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Toaster, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  GraduationCap,
  Wind,
  BookOpen,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  ChevronRight,
  FlaskConical,
  Beaker,
  Droplet,
  ExternalLink,
  Sliders,
  Check,
} from "lucide-react";

import OxygenWorkspace from "./workspaces/OxygenWorkspace";
import LabReport from "./LabReport";
import TeacherViva, { type VivaQuestion } from "@/components/viva/TeacherViva";
import StudentViva from "@/components/viva/StudentViva";
import type { EquipmentId, Mistake, Mode, OxygenPlaced, Report, Step } from "./types";
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
      label: "স্ট্যান্ডে কনিক্যাল ফ্লাস্ক স্থাপন করো",
      done: false,
    },
    {
      id: "manganese_dioxide",
      label: "ফ্লাস্কে MnO₂ প্রভাবক যোগ করো",
      done: false,
    },
    {
      id: "water_trough",
      label: "পানিভর্তি ওয়াটার ট্রাফ বসাও",
      done: false,
    },
    {
      id: "collection_tube",
      label: "ট্রাফে উল্টানো সংগ্রহ টিউব বসাও",
      done: false,
    },
    {
      id: "delivery_tube",
      label: "গ্যাস ডেলিভারি টিউব যুক্ত করো",
      done: false,
    },
    {
      id: "hydrogen_peroxide",
      label: "H₂O₂ ঢেলে বিক্রিয়া শুরু করো",
      done: false,
    },
    {
      id: "collect",
      label: "পানির নিম্নমুখী অপসারণে গ্যাস জমা হওয়া",
      done: false,
    },
    {
      id: "splint",
      label: "আধা-জ্বলা কাঠি দিয়ে অক্সিজেন নিশ্চিত করো",
      done: false,
    },
  ];
}

interface EquipmentItemMeta {
  id: EquipmentId;
  nameBn: string;
  nameEn: string;
  icon: typeof FlaskConical;
  stepKey: keyof OxygenPlaced | "glowing_splint";
}

const APPARATUS_ITEMS: EquipmentItemMeta[] = [
  {
    id: "clamp",
    nameBn: "রেটর্ট স্ট্যান্ড",
    nameEn: "Retort Stand",
    icon: FlaskConical,
    stepKey: "reaction_tube",
  },
  {
    id: "test_tube_reaction",
    nameBn: "বিক্রিয়া ফ্লাস্ক",
    nameEn: "Reaction Flask",
    icon: FlaskConical,
    stepKey: "reaction_tube",
  },
  {
    id: "manganese_dioxide",
    nameBn: "MnO₂ প্রভাবক",
    nameEn: "MnO₂ Catalyst",
    icon: Sparkles,
    stepKey: "manganese_dioxide",
  },
  {
    id: "water_trough",
    nameBn: "ওয়াটার ট্রাফ",
    nameEn: "Water Trough",
    icon: Beaker,
    stepKey: "water_trough",
  },
  {
    id: "test_tube_collection",
    nameBn: "সংগ্রহ টিউব",
    nameEn: "Collection Tube",
    icon: Beaker,
    stepKey: "collection_tube",
  },
  {
    id: "delivery_tube",
    nameBn: "ডেলিভারি টিউব",
    nameEn: "Delivery Tube",
    icon: Wind,
    stepKey: "delivery_tube",
  },
  {
    id: "hydrogen_peroxide",
    nameBn: "H₂O₂ দ্রবণ",
    nameEn: "H₂O₂ Solution",
    icon: Droplet,
    stepKey: "hydrogen_peroxide",
  },
  {
    id: "glowing_splint",
    nameBn: "আধা-জ্বলা কাঠি",
    nameEn: "Glowing Splint",
    icon: Flame,
    stepKey: "glowing_splint",
  },
];

export default function OxygenLab({ onBack }: { onBack: () => void }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("guide");
  const [cfg, setCfg] = useState<OxygenConfig>(DEFAULT_CFG);
  const [placed, setPlaced] = useState<OxygenPlaced>(INITIAL_PLACED);
  const [reacting, setReacting] = useState(false);
  const [collectedMl, setCollectedMl] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [steps, setSteps] = useState<Step[]>(buildSteps);
  const [splintResult, setSplintResult] = useState<"pass" | "early" | "none">("none");
  const [isTestingSplint, setIsTestingSplint] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showViva, setShowViva] = useState(false);
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"equipment" | "data" | "steps" | "theory">(
    "equipment",
  );
  const [desktopLeftTab, setDesktopLeftTab] = useState<"equipment" | "config">("equipment");

  const startedAtRef = useRef<number | null>(null);

  // Sync AI context
  useEffect(() => {
    const stepIdx = steps.findIndex((s) => !s.done);
    const chemicals: string[] = [];
    if (placed.hydrogen_peroxide) chemicals.push("H₂O₂");
    if (placed.manganese_dioxide) chemicals.push("MnO₂ (catalyst)");
    const equipment: string[] = [];
    if (placed.reaction_tube) equipment.push("reaction flask");
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
      goal: "Prepare Oxygen gas via H₂O₂ decomposition with MnO₂ and test using a glowing splint.",
    });
  }, [mode, steps, placed, mistakes]);

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

  // Handle Equipment Placement
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
          toast.success("স্ট্যান্ডে বিক্রিয়া ফ্লাস্ক বসানো হয়েছে");
          break;
        case "manganese_dioxide":
          if (!placed.reaction_tube) {
            toast.warning("আগে বিক্রিয়া ফ্লাস্ক স্থাপন করো");
            return;
          }
          if (placed.manganese_dioxide) return;
          setPlaced((p) => ({ ...p, manganese_dioxide: true }));
          completeStep("manganese_dioxide");
          toast.success("MnO₂ প্রভাবক যোগ করা হয়েছে");
          break;
        case "water_trough":
          if (placed.water_trough) return;
          setPlaced((p) => ({ ...p, water_trough: true }));
          completeStep("water_trough");
          toast.success("পানিভর্তি ওয়াটার ট্রাফ স্থাপন করা হয়েছে");
          break;
        case "test_tube_collection":
          if (!placed.water_trough) {
            toast.warning("আগে ওয়াটার ট্রাফ স্থাপন করো");
            return;
          }
          if (placed.collection_tube) return;
          setPlaced((p) => ({ ...p, collection_tube: true }));
          completeStep("collection_tube");
          toast.success("ট্রাফে উল্টানো গ্যাস সংগ্রহ টিউব বসানো হয়েছে");
          break;
        case "delivery_tube":
          if (!placed.reaction_tube || !placed.collection_tube) {
            toast.warning("আগে বিক্রিয়া ফ্লাস্ক ও সংগ্রহ টিউব স্থাপন করো");
            return;
          }
          if (placed.delivery_tube) return;
          setPlaced((p) => ({ ...p, delivery_tube: true }));
          completeStep("delivery_tube");
          toast.success("গ্যাস ডেলিভারি টিউব যুক্ত করা হয়েছে");
          break;
        case "hydrogen_peroxide":
          if (!placed.manganese_dioxide) {
            logMistake({
              type: "no_manganese_dioxide",
              severity: "high",
              message: "MnO₂ প্রভাবক ছাড়া H₂O₂ যোগ করা হয়েছে — বিক্রিয়া অত্যন্ত ধীর হবে!",
            });
          }
          if (!placed.delivery_tube) {
            logMistake({
              type: "missing_delivery_tube",
              severity: "high",
              message: "ডেলিভারি টিউব ছাড়া H₂O₂ ঢালায় অক্সিজেন গ্যাস বাতাসে উড়ে যাচ্ছে!",
            });
          }
          setPlaced((p) => ({ ...p, hydrogen_peroxide: true }));
          setReacting(true);
          completeStep("hydrogen_peroxide");
          toast.success("H₂O₂ দ্রবণ ঢালা হলো — তীব্র বুদবুদে অক্সিজেন তৈরি শুরু হয়েছে!");
          break;
        case "glowing_splint":
          handleSplintDrop(true);
          break;
      }
    },
    [placed, completeStep, logMistake, submitted],
  );

  // Reaction kinetics loop
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
        if (placed.delivery_tube) {
          const { collectedMl: c } = computeOxygenGeneration({
            cfg,
            timeElapsedSec: next,
          });
          const capped = Math.min(c, TUBE_CAPACITY_ML);
          setCollectedMl(capped);
          if (capped >= TUBE_CAPACITY_ML * 0.98) {
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

  // Splint test logic
  const handleSplintDrop = useCallback(
    (hit: boolean) => {
      if (!hit) return;
      if (!placed.collection_tube || !placed.hydrogen_peroxide) {
        toast.warning("আগে বিক্রিয়া ঘটিয়ে গ্যাস সংগ্রহ করো!");
        return;
      }
      const filledFrac = collectedMl / TUBE_CAPACITY_ML;
      if (filledFrac < 0.45) {
        logMistake({
          type: "early_splint_test",
          severity: "med",
          message:
            "খুব দ্রুত কাঠি প্রবেশ করানো হয়েছে — পর্যাপ্ত অক্সিজেন না থাকায় কাঠিটি নিভে গেল!",
        });
        setSplintResult("early");
        toast.error("পর্যাপ্ত অক্সিজেন নেই! কাঠিটি নিভে গেল (আরেকটু গ্যাস জমতে দাও)");
        setTimeout(() => setSplintResult("none"), 2400);
      } else {
        setSplintResult("pass");
        completeStep("splint");
        toast.success("✨ কাঠিটি তীব্র শিখায় জ্বলে উঠল — অক্সিজেন গ্যাস প্রমাণিত!");
      }
    },
    [collectedMl, logMistake, completeStep, placed],
  );

  const triggerSplintTest = useCallback(() => {
    if (!placed.collection_tube || !placed.hydrogen_peroxide) {
      toast.warning("আগে বিক্রিয়া ঘটিয়ে গ্যাস সংগ্রহ করো!");
      return;
    }
    setIsTestingSplint(true);
    setTimeout(() => {
      handleSplintDrop(true);
      setIsTestingSplint(false);
    }, 700);
  }, [placed, handleSplintDrop]);

  const { rateMlPerSec } = useMemo(
    () => computeOxygenGeneration({ cfg, timeElapsedSec: elapsed }),
    [cfg, elapsed],
  );

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
    toast.success(`ল্যাব রিপোর্ট প্রস্তুত! স্কোর গ্রেড: ${r.grade}`);
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
    toast.info("ল্যাব রিসেট করা হয়েছে");
  };

  const nextStepPrompt = useMemo(() => {
    if (!placed.reaction_tube)
      return { text: "স্ট্যান্ডে কনিক্যাল ফ্লাস্কটি স্থাপন করো", id: "test_tube_reaction" };
    if (!placed.manganese_dioxide)
      return { text: "ফ্লাস্কে কালো MnO₂ প্রভাবক যোগ করো", id: "manganese_dioxide" };
    if (!placed.water_trough)
      return { text: "ডান পাশে পানিভর্তি ওয়াটার ট্রাফ বসাও", id: "water_trough" };
    if (!placed.collection_tube)
      return { text: "ট্রাফে উল্টানো গ্যাস সংগ্রহ টিউবটি স্থাপন করো", id: "test_tube_collection" };
    if (!placed.delivery_tube)
      return { text: "ফ্লাস্ক ও ট্রাফের মাঝে ডেলিভারি টিউব যুক্ত করো", id: "delivery_tube" };
    if (!placed.hydrogen_peroxide)
      return { text: "H₂O₂ দ্রবণ ঢেলে দ্রুত বিক্রিয়া শুরু করো", id: "hydrogen_peroxide" };
    if (collectedMl < TUBE_CAPACITY_ML * 0.5)
      return { text: "অপেক্ষা করো — পানির নিম্নমুখী অপসারণে অক্সিজেন জমছে…", id: null };
    if (splintResult !== "pass")
      return { text: "আধা-জ্বলা কাঠি টিউবের মুখে ধরে অক্সিজেন পরীক্ষা করো!", id: "glowing_splint" };
    return { text: "সব ধাপ সফল! রিপোর্ট জমা দিয়ে গ্রেড দেখো।", id: null };
  }, [placed, collectedMl, splintResult]);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground select-none">
      <Toaster position="top-center" richColors />

      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT TOP HEADER (48px)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b bg-card/85 px-3 backdrop-blur-md sm:px-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-1.5 h-8 gap-1 px-2 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ল্যাব তালিকা</span>
          </Button>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sm">
            <Wind className="h-4 w-4" />
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate text-xs sm:text-sm font-bold">অক্সিজেন প্রস্তুতি</span>
              <Badge
                variant="outline"
                className="hidden lg:inline-flex text-[10px] font-mono py-0 px-1.5 border-sky-500/30 text-sky-600 dark:text-sky-400"
              >
                2H₂O₂ → 2H₂O + O₂ ↑
              </Badge>
            </div>
            <span className="hidden sm:inline text-[10px] text-muted-foreground">
              Preparation of Oxygen Gas · NCTB Chapter 7
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mode Switch */}
          <div className="flex items-center rounded-lg border bg-muted p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => setMode("guide")}
              className={`rounded px-2 py-0.5 transition ${
                mode === "guide"
                  ? "bg-background shadow-xs text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              গাইড
            </button>
            <button
              onClick={() => setMode("student")}
              className={`rounded px-2 py-0.5 transition ${
                mode === "student"
                  ? "bg-background shadow-xs text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              পরীক্ষা
            </button>
          </div>

          {/* Theory Drawer Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheoryOpen(true)}
            className="h-8 gap-1 px-2.5 text-xs font-semibold text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/10"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">থিওরি ও নোটস</span>
          </Button>

          {/* AI Viva Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowViva(true)}
            className="h-8 gap-1 px-2 text-xs font-semibold"
          >
            <GraduationCap className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">ভাইভা</span>
          </Button>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Reset Lab"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. DESKTOP & LAPTOP 3-COLUMN VIEW (100dvh, No Screen Scrolling)
      ───────────────────────────────────────────────────────────── */}
      {!isMobile ? (
        <main className="flex-1 min-h-0 w-full grid grid-cols-[260px_1fr_270px] lg:grid-cols-[280px_1fr_290px] gap-2.5 p-2.5 overflow-hidden">
          {/* ── LEFT COLUMN: Apparatus & Configuration ── */}
          <aside className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
            <Card className="flex flex-1 min-h-0 flex-col overflow-hidden p-2.5 border-border/80 shadow-xs">
              {/* Left Column Tabs Header */}
              <div className="flex shrink-0 items-center justify-between border-b pb-2 mb-2">
                <div className="flex gap-1 rounded-lg bg-muted p-0.5 text-xs font-semibold w-full">
                  <button
                    onClick={() => setDesktopLeftTab("equipment")}
                    className={`flex-1 py-1 text-center rounded transition ${
                      desktopLeftTab === "equipment"
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    যন্ত্রপাতি (
                    {
                      APPARATUS_ITEMS.filter(
                        (i) =>
                          i.stepKey !== "glowing_splint" && placed[i.stepKey as keyof OxygenPlaced],
                      ).length
                    }
                    /6)
                  </button>
                  <button
                    onClick={() => setDesktopLeftTab("config")}
                    className={`flex-1 py-1 text-center rounded transition ${
                      desktopLeftTab === "config"
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    সেটিংস
                  </button>
                </div>
              </div>

              {/* Tab: Apparatus List */}
              {desktopLeftTab === "equipment" && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {/* Next Step Guide Callout */}
                  {guide && nextStepPrompt.text && (
                    <div className="mb-2 shrink-0 rounded-lg bg-sky-500/10 border border-sky-500/25 p-2 text-[11px] leading-snug text-sky-800 dark:text-sky-300 flex items-start gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0 mt-0.5 animate-pulse" />
                      <span>{nextStepPrompt.text}</span>
                    </div>
                  )}

                  {/* Equipment Item Chips Grid */}
                  <ScrollArea className="flex-1 pr-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {APPARATUS_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isPlaced =
                          item.stepKey === "glowing_splint"
                            ? splintResult === "pass"
                            : placed[item.stepKey as keyof OxygenPlaced];
                        const isNext = guide && nextStepPrompt.id === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            draggable={!isPlaced}
                            onDragStart={(e) => e.dataTransfer.setData("text/equipment", item.id)}
                            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition-all ${
                              isPlaced
                                ? "border-emerald-500/40 bg-emerald-500/5 text-muted-foreground opacity-75"
                                : isNext
                                  ? "border-sky-500 bg-sky-500/15 shadow-[0_0_12px_rgba(56,189,248,0.3)] ring-1 ring-sky-400 font-bold animate-pulse text-foreground"
                                  : "border-border/80 bg-card hover:border-primary hover:bg-accent text-foreground"
                            }`}
                          >
                            {isPlaced && (
                              <span className="absolute right-1.5 top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-500 text-[9px] text-white">
                                ✓
                              </span>
                            )}
                            <Icon
                              className={`h-5 w-5 ${isNext ? "text-sky-500" : "text-muted-foreground"}`}
                            />
                            <span className="text-[11px] leading-tight font-semibold">
                              {item.nameBn}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {item.nameEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Tab: Chemical Config */}
              {desktopLeftTab === "config" && (
                <ScrollArea className="flex-1 pr-1.5">
                  <div className="space-y-3 p-1">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span>H₂O₂ ঘনমাত্রা (Conc.)</span>
                        <span className="font-mono font-bold text-primary">{cfg.h2o2ConcPct}%</span>
                      </div>
                      <Slider
                        value={[cfg.h2o2ConcPct]}
                        min={3}
                        max={30}
                        step={1}
                        onValueChange={([v]) => setCfg((c) => ({ ...c, h2o2ConcPct: v }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span>H₂O₂ আয়তন (Volume)</span>
                        <span className="font-mono font-bold text-primary">
                          {cfg.h2o2VolumeMl} mL
                        </span>
                      </div>
                      <Slider
                        value={[cfg.h2o2VolumeMl]}
                        min={10}
                        max={50}
                        step={2}
                        onValueChange={([v]) => setCfg((c) => ({ ...c, h2o2VolumeMl: v }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span>MnO₂ ভর (Catalyst)</span>
                        <span className="font-mono font-bold text-primary">{cfg.mno2MassG} g</span>
                      </div>
                      <Slider
                        value={[cfg.mno2MassG]}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        onValueChange={([v]) => setCfg((c) => ({ ...c, mno2MassG: v }))}
                      />
                    </div>

                    <div className="rounded-lg bg-muted/60 p-2 text-[11px] text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>তাত্ত্বিক O₂ ফলন (STP):</span>
                        <span className="font-bold text-foreground font-mono">
                          {targetMl.toFixed(0)} mL
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>টিউব ধারণক্ষমতা:</span>
                        <span className="font-bold text-foreground font-mono">
                          {TUBE_CAPACITY_ML} mL
                        </span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </Card>
          </aside>

          {/* ── CENTER COLUMN: Realistic Simulation Workspace ── */}
          <section
            className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-md backdrop-blur-md"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/equipment") as EquipmentId;
              if (id) handleSelect(id);
            }}
          >
            {/* SVG Workspace fills 100% */}
            <div className="relative flex-1 min-h-0 w-full overflow-hidden">
              <OxygenWorkspace
                placed={placed}
                collectedMl={collectedMl}
                tubeCapacityMl={TUBE_CAPACITY_ML}
                reacting={reacting && placed.delivery_tube}
                splintResult={splintResult}
                onSplintDrop={handleSplintDrop}
                isTestingSplint={isTestingSplint}
                disabled={submitted}
              />
            </div>

            {/* Floating Workbench Control Bar (Bottom Center) */}
            <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border/80 bg-background/95 px-3 py-1.5 shadow-xl backdrop-blur-md">
              {/* Play/Pause Button */}
              <Button
                size="sm"
                variant={reacting ? "destructive" : "default"}
                onClick={() => setReacting((v) => !v)}
                disabled={!placed.hydrogen_peroxide || submitted}
                className="h-8 gap-1 px-3 text-xs font-bold"
              >
                {reacting ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{reacting ? "থামাও" : "চালু করো"}</span>
              </Button>

              {/* Quick Splint Test Trigger */}
              <Button
                size="sm"
                variant="outline"
                onClick={triggerSplintTest}
                disabled={!placed.collection_tube || submitted}
                className="h-8 gap-1 px-3 text-xs font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                title="কাঠি দিয়ে অক্সিজেন পরীক্ষা করো"
              >
                <Flame className="h-3.5 w-3.5" />
                <span>কাঠি পরীক্ষা</span>
              </Button>

              {/* Submit / Grade Report Button */}
              <Button
                size="sm"
                onClick={submit}
                disabled={submitted || collectedMl < 10}
                className="h-8 gap-1 px-3 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm"
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>রিপোর্ট জমা</span>
              </Button>
            </div>
          </section>

          {/* ── RIGHT COLUMN: Live Data & Step Checklist ── */}
          <aside className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
            {/* Live Data Card */}
            <Card className="shrink-0 p-3 border-border/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  লাইভ রিডিং (Live Data)
                </span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {elapsed.toFixed(0)}s
                </Badge>
              </div>

              {/* LCD Digital Gauge */}
              <div className="rounded-xl border border-sky-500/30 bg-slate-950 p-2.5 text-sky-400 shadow-inner">
                <div className="flex justify-between text-[10px] text-sky-400/70 font-mono uppercase">
                  <span>O₂ সংগৃহীত</span>
                  <span>উৎপাদন হার</span>
                </div>
                <div className="mt-0.5 flex justify-between font-mono font-bold tracking-tight">
                  <span className="text-2xl text-cyan-300">
                    {collectedMl.toFixed(1)} <span className="text-xs text-sky-400">mL</span>
                  </span>
                  <span className="text-xl text-emerald-400">
                    {rateMlPerSec.toFixed(2)} <span className="text-xs text-emerald-500">mL/s</span>
                  </span>
                </div>
              </div>

              {/* Collection Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>টিউব পূর্ণতা (O₂ Gas)</span>
                  <span className="font-mono font-semibold text-foreground">
                    {((collectedMl / TUBE_CAPACITY_ML) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={(collectedMl / TUBE_CAPACITY_ML) * 100} className="h-2" />
              </div>

              {/* Water Displacement Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>পানির অবশিষ্টাংশ</span>
                  <span className="font-mono font-semibold text-foreground">
                    {waterPct.toFixed(0)}%
                  </span>
                </div>
                <Progress value={waterPct} className="h-1.5 opacity-80" />
              </div>
            </Card>

            {/* Steps Checklist Card */}
            <Card className="flex flex-1 min-h-0 flex-col overflow-hidden p-3 border-border/80 shadow-xs">
              <span className="mb-2 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                কার্যপ্রণালী ধাপসমূহ
              </span>
              <ScrollArea className="flex-1 pr-1.5">
                <div className="space-y-1.5">
                  {steps.map((st, idx) => (
                    <div
                      key={st.id}
                      className={`flex items-start gap-2 rounded-lg p-2 text-xs transition ${
                        st.done
                          ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                          : "bg-muted/40 text-muted-foreground border border-border/40"
                      }`}
                    >
                      <div
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold mt-0.5 ${
                          st.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {st.done ? "✓" : idx + 1}
                      </div>
                      <span className="leading-snug">{st.label}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </aside>
        </main>
      ) : (
        /* ─────────────────────────────────────────────────────────────
          3. MOBILE DUAL-MODE LAYOUT (< md: SCREEN)
      ───────────────────────────────────────────────────────────── */
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {/* Top 46%: Pinned Live Simulation Viewport */}
          <section className="relative h-[46dvh] shrink-0 w-full overflow-hidden border-b bg-card/60 shadow-inner">
            <OxygenWorkspace
              placed={placed}
              collectedMl={collectedMl}
              tubeCapacityMl={TUBE_CAPACITY_ML}
              reacting={reacting && placed.delivery_tube}
              splintResult={splintResult}
              onSplintDrop={handleSplintDrop}
              isTestingSplint={isTestingSplint}
              disabled={submitted}
            />

            {/* Floating Mobile Mini Dock */}
            <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border/80 bg-background/95 px-2.5 py-1 shadow-lg backdrop-blur-md">
              <Button
                size="sm"
                variant={reacting ? "destructive" : "default"}
                onClick={() => setReacting((v) => !v)}
                disabled={!placed.hydrogen_peroxide || submitted}
                className="h-7 px-2.5 text-xs font-bold"
              >
                {reacting ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                <span>{reacting ? "Pause" : "Start"}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={triggerSplintTest}
                disabled={!placed.collection_tube || submitted}
                className="h-7 px-2 text-xs font-semibold text-amber-500 cursor-pointer"
              >
                <Flame className="h-3 w-3 mr-1" />
                <span>কাঠি পরীক্ষা</span>
              </Button>
              <Button
                size="sm"
                onClick={submit}
                disabled={submitted || collectedMl < 10}
                className="h-7 px-2.5 text-xs font-bold bg-emerald-600 text-white"
              >
                <Trophy className="h-3 w-3 mr-1" />
                <span>জমা</span>
              </Button>
            </div>
          </section>

          {/* Bottom 54%: Interactive Tabbed Tray */}
          <section className="flex flex-1 min-h-0 flex-col bg-card overflow-hidden">
            {/* Mobile Bottom Sheet Tabs */}
            <Tabs
              value={mobileTab}
              onValueChange={(v) => setMobileTab(v as typeof mobileTab)}
              className="flex h-full min-h-0 flex-col"
            >
              <TabsList className="grid h-10 w-full grid-cols-4 rounded-none border-b bg-muted/60 p-0 text-xs">
                <TabsTrigger
                  value="equipment"
                  className="rounded-none px-1 py-1.5 text-[10px] sm:text-xs data-[state=active]:font-bold truncate"
                >
                  🛠️ <span className="truncate">যন্ত্রপাতি</span>
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="rounded-none px-1 py-1.5 text-[10px] sm:text-xs data-[state=active]:font-bold truncate"
                >
                  📊 <span className="truncate">তথ্য</span>
                </TabsTrigger>
                <TabsTrigger
                  value="steps"
                  className="rounded-none px-1 py-1.5 text-[10px] sm:text-xs data-[state=active]:font-bold truncate"
                >
                  📋 <span className="truncate">গাইড</span>
                </TabsTrigger>
                <TabsTrigger
                  value="theory"
                  className="rounded-none px-1 py-1.5 text-[10px] sm:text-xs data-[state=active]:font-bold truncate"
                >
                  📖 <span className="truncate">থিওরি</span>
                </TabsTrigger>
              </TabsList>

              {/* Mobile Tab 1: Equipment */}
              <TabsContent value="equipment" className="flex-1 min-h-0 p-3 overflow-y-auto m-0">
                {guide && nextStepPrompt.text && (
                  <div className="mb-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 p-2 text-xs font-medium text-sky-800 dark:text-sky-300">
                    👉 <strong>পরবর্তী ধাপ:</strong> {nextStepPrompt.text}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {APPARATUS_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isPlaced =
                      item.stepKey === "glowing_splint"
                        ? splintResult === "pass"
                        : placed[item.stepKey as keyof OxygenPlaced];
                    const isNext = guide && nextStepPrompt.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`relative flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                          isPlaced
                            ? "border-emerald-500/40 bg-emerald-500/5 text-muted-foreground"
                            : isNext
                              ? "border-sky-500 bg-sky-500/15 ring-2 ring-sky-400 font-bold"
                              : "border-border bg-card"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0 text-sky-500" />
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="text-xs font-semibold truncate">{item.nameBn}</div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            {item.nameEn}
                          </div>
                        </div>
                        {isPlaced && <span className="text-xs font-bold text-emerald-500">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Mobile Tab 2: Data */}
              <TabsContent
                value="data"
                className="flex-1 min-h-0 p-3 overflow-y-auto m-0 space-y-3"
              >
                <div className="rounded-xl border border-sky-500/30 bg-slate-950 p-3 text-sky-400 font-mono">
                  <div className="flex justify-between text-xs text-sky-400/70">
                    <span>O₂ সংগৃহীত</span>
                    <span>উৎপাদন হার</span>
                  </div>
                  <div className="mt-1 flex justify-between font-bold text-2xl">
                    <span>{collectedMl.toFixed(1)} mL</span>
                    <span className="text-emerald-400">{rateMlPerSec.toFixed(2)} mL/s</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>টিউব পূর্ণতা</span>
                    <span className="font-mono font-bold">
                      {((collectedMl / TUBE_CAPACITY_ML) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={(collectedMl / TUBE_CAPACITY_ML) * 100} />
                </div>
              </TabsContent>

              {/* Mobile Tab 3: Steps */}
              <TabsContent
                value="steps"
                className="flex-1 min-h-0 p-3 overflow-y-auto m-0 space-y-2"
              >
                {steps.map((st, i) => (
                  <div
                    key={st.id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                      st.done
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <span className="font-bold">{st.done ? "✓" : `${i + 1}.`}</span>
                    <span>{st.label}</span>
                  </div>
                ))}
              </TabsContent>

              {/* Mobile Tab 4: Theory */}
              <TabsContent
                value="theory"
                className="flex-1 min-h-0 p-3 overflow-y-auto m-0 space-y-2 text-xs leading-relaxed"
              >
                <div className="rounded-lg bg-sky-500/10 p-2.5 font-mono text-center font-bold text-sky-700 dark:text-sky-300">
                  2 H₂O₂ (aq) → 2 H₂O (l) + O₂ (g) ↑ [MnO₂ প্রভাবক]
                </div>
                <p>
                  <strong>মূলতত্ত্ব:</strong> হাইড্রোজেন পারঅক্সাইড সাধারণ তাপমাত্রায় ধীরে বিয়োজিত
                  হয়। কিন্তু কালো ম্যাঙ্গানিজ ডাইঅক্সাইড (MnO₂) যোগ করলে এটি তীব্র গতিতে অক্সিজেন
                  গ্যাস ও পানিতে পরিণত হয়।
                </p>
                <p>
                  <strong>পানির নিম্নমুখী অপসারণ:</strong> অক্সিজেন পানিতে অতি সামান্য দ্রবণীয় এবং
                  বাতাসের চেয়ে সামান্য ভারী, তাই পানির নিচে এটিকে সংগ্রহ করা হয়।
                </p>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. COMPREHENSIVE THEORY DRAWER (Slide-up Sheet)
      ───────────────────────────────────────────────────────────── */}
      <Drawer open={theoryOpen} onOpenChange={setTheoryOpen}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="border-b pb-3">
            <DrawerTitle className="flex items-center gap-2 text-base md:text-lg">
              <BookOpen className="h-5 w-5 text-sky-500" />
              অক্সিজেন প্রস্তুতি: বৈজ্ঞানিক তত্ত্ব ও মূল ধারণা
            </DrawerTitle>
          </DrawerHeader>

          <ScrollArea className="px-4 py-4 max-h-[65dvh]">
            <div className="max-w-3xl mx-auto space-y-4 text-xs md:text-sm leading-relaxed text-muted-foreground">
              {/* Formula Card */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-center">
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block mb-1">
                  রাসায়নিক সমীকরণ (Reaction Equation)
                </span>
                <div className="text-lg md:text-xl font-mono font-bold text-foreground">
                  2 H₂O₂ (aq) <span className="text-sky-500">→ [MnO₂]</span> 2 H₂O (l) + O₂ (g) ↑
                </div>
              </div>

              {/* Principle */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-foreground text-sm">
                  ১. মূল বৈজ্ঞানিক তত্ত্ব (Principle):
                </h4>
                <p>
                  হাইড্রোজেন পারঅক্সাইড ($H_2O_2$) একটি অস্থায়ী যৌগ। সাধারণ তাপমাত্রায় এটি অতি ধীর
                  গতিতে বিয়োজিত হয়ে পানি ও অক্সিজেন উৎপন্ন করে। কিন্তু এতে সামান্য পরিমাণ
                  ম্যাঙ্গানিজ ডাইঅক্সাইড ($MnO_2$) গুঁড়া যোগ করলে এটি{" "}
                  <strong>ধনাত্মক প্রভাবক (Positive Catalyst)</strong> হিসেবে কাজ করে বিক্রিয়াটিকে
                  অত্যন্ত দ্রুত সম্পন্ন করে।
                </p>
              </div>

              {/* Water displacement */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-foreground text-sm">
                  ২. পানির নিম্নমুখী অপসারণের কারণ:
                </h4>
                <p>
                  অক্সিজেন গ্যাস পানিতে প্রায় অদ্রবণীয় (অতি সামান্য দ্রবণীয়) এবং বাতাসের ঘনত্বের
                  কাছাকাছি (সামান্য ভারী)। তাই গ্যাস জারে আগে থেকে পূর্ণ থাকা পানিকে নিচে ঠেলে দিয়ে
                  গ্যাসটি সিলিন্ডারের শীর্ষে জমা হয়।
                </p>
              </div>

              {/* Splint test */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-foreground text-sm">
                  ৩. অক্সিজেন গ্যাস শনাক্তকরণ (Glowing Splint Test):
                </h4>
                <p>
                  অক্সিজেন নিজে জ্বলে না, তবে অন্যকে জ্বলতে পূর্ণ সাহায্য করে। একটি আধা-জ্বলা কাঠির
                  লাল স্ফুলিঙ্গ গ্যাসপূর্ণ কালেকশন জারের মুখে ধরলে তা তৎক্ষণাৎ দপ করে{" "}
                  <strong>উজ্জ্বল শিখাসহ জ্বলে ওঠে</strong>। এটি প্রমাণ করে উৎপাদিত গ্যাসটি
                  অক্সিজেন।
                </p>
              </div>

              {/* External Links */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <Link
                  to="/chapters/$chapterNumber"
                  params={{ chapterNumber: "7" }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> অধ্যায় ৭ (রাসায়নিক বিক্রিয়া) সম্পূর্ণ
                  নোট পড়ুন
                </Link>
                <span className="text-muted-foreground/40">•</span>
                <Link
                  to="/labs/$labId"
                  params={{ labId: "oxygen_prep" }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> পাবলিক ল্যাব গাইড ও ভাইভা প্রশ্নাবলি
                </Link>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t p-3 flex justify-end">
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                বন্ধ করুন
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────
          5. AI VIVA DIALOG
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={showViva} onOpenChange={setShowViva}>
        <DialogContent className="max-w-2xl max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-amber-500" />
              অক্সিজেন প্রস্তুতি: AI ভাইভা ও প্রশ্নোত্তর
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <TeacherViva
              onPublish={() => {}}
              experiment="oxygen_prep"
              defaultTopic="Laboratory preparation of oxygen: H₂O₂ decomposition with MnO₂ catalyst"
            />
            <StudentViva />
          </div>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          6. LAB REPORT OVERLAY DIALOG
      ───────────────────────────────────────────────────────────── */}
      {report && (
        <Dialog open={!!report} onOpenChange={(open) => !open && setReport(null)}>
          <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
            <LabReport report={report} onReset={reset} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
