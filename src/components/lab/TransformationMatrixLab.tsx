/**
 * TransformationMatrixLab — Chapter 11 theory lab (gamified)
 *
 * Mission: Convert Methane (CH₄) step-by-step into Ethanoic Acid via the
 * canonical organic roadmap:
 *   Alkane → Alkyl Halide → Alcohol → Aldehyde → Fatty Acid
 *
 * Students drag reagent cards onto the reactor. Correct reagents unlock
 * the next node; wrong reagents cost a star and log a failure.
 */
import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Sparkles,
  Star,
  Lock,
  RotateCcw,
  Beaker,
  TriangleAlert,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DraggableTheoryFab from "./DraggableTheoryFab";

interface Props {
  onBack: () => void;
}

type NodeId = "alkane" | "halide" | "alcohol" | "aldehyde" | "acid";
type ReagentId = "cl2_uv" | "naoh_aq" | "oxidizer" | "water_h3po4" | "naoh_alc";

interface NodeMeta {
  id: NodeId;
  nameBn: string;
  nameEn: string;
  family: string;
  formula: string;
  structure: string;
  funcGroup: string;
  color: string;
  requires: ReagentId | null;
  why: string;
  equation: string;
}

const NODES: NodeMeta[] = [
  {
    id: "alkane",
    nameBn: "মিথেন",
    nameEn: "Methane",
    family: "Alkane · অ্যালকেন",
    formula: "CH₄",
    structure: "H—C(H)(H)—H",
    funcGroup: "C—H",
    color: "#64748b",
    requires: null,
    why: "শুরুর যৌগ — সম্পৃক্ত হাইড্রোকার্বন।",
    equation: "CH₄ (শুরু)",
  },
  {
    id: "halide",
    nameBn: "মিথাইল ক্লোরাইড",
    nameEn: "Methyl Chloride",
    family: "Alkyl Halide · অ্যালকাইল হ্যালাইড",
    formula: "CH₃Cl",
    structure: "H—C(H)(H)—Cl",
    funcGroup: "—Cl",
    color: "#22c55e",
    requires: "cl2_uv",
    why: "সূর্যালোকের উপস্থিতিতে Cl₂ ফ্রি-র‍্যাডিক্যাল প্রতিস্থাপন বিক্রিয়ায় একটি H-কে Cl দ্বারা প্রতিস্থাপন করে।",
    equation: "CH₄ + Cl₂ —(UV)→ CH₃Cl + HCl",
  },
  {
    id: "alcohol",
    nameBn: "মিথানল",
    nameEn: "Methanol",
    family: "Alcohol · অ্যালকোহল",
    formula: "CH₃OH",
    structure: "H—C(H)(H)—OH",
    funcGroup: "—OH",
    color: "#0ea5e9",
    requires: "naoh_aq",
    why: "জলীয় NaOH নিউক্লিওফিলিক প্রতিস্থাপনে Cl-কে OH দ্বারা প্রতিস্থাপন করে (অ্যালকোহলিক NaOH হলে ইলিমিনেশন হতো)।",
    equation: "CH₃Cl + NaOH(aq) → CH₃OH + NaCl",
  },
  {
    id: "aldehyde",
    nameBn: "মিথান্যাল (ফরমালডিহাইড)",
    nameEn: "Methanal",
    family: "Aldehyde · অ্যালডিহাইড",
    formula: "HCHO",
    structure: "H—C(=O)—H",
    funcGroup: "—CHO",
    color: "#f59e0b",
    requires: "oxidizer",
    why: "জায়মান অক্সিজেন [O] (K₂Cr₂O₇/H₂SO₄) প্রাথমিক অ্যালকোহলকে জারিত করে অ্যালডিহাইড তৈরি করে।",
    equation: "CH₃OH + [O] → HCHO + H₂O",
  },
  {
    id: "acid",
    nameBn: "মিথানয়িক অ্যাসিড (ফরমিক অ্যাসিড)",
    nameEn: "Methanoic Acid",
    family: "Fatty Acid · কার্বক্সিলিক অ্যাসিড",
    formula: "HCOOH",
    structure: "H—C(=O)—O—H",
    funcGroup: "—COOH",
    color: "#ef4444",
    requires: "oxidizer",
    why: "অতিরিক্ত [O] অ্যালডিহাইডকে আরও জারিত করে কার্বক্সিলিক অ্যাসিডে রূপান্তরিত করে।",
    equation: "HCHO + [O] → HCOOH",
  },
];

interface ReagentMeta {
  id: ReagentId;
  nameBn: string;
  formula: string;
  hint: string;
  tint: string;
  ring: string;
}

const REAGENTS: ReagentMeta[] = [
  {
    id: "cl2_uv",
    nameBn: "ক্লোরিন + সূর্যালোক",
    formula: "Cl₂ / UV",
    hint: "Free-radical substitution",
    tint: "from-emerald-400/30 to-lime-500/20",
    ring: "ring-emerald-400/60",
  },
  {
    id: "naoh_aq",
    nameBn: "জলীয় সোডিয়াম হাইড্রোক্সাইড",
    formula: "NaOH (aq)",
    hint: "Nucleophilic substitution — OH⁻",
    tint: "from-sky-400/30 to-cyan-500/20",
    ring: "ring-sky-400/60",
  },
  {
    id: "oxidizer",
    nameBn: "জায়মান অক্সিজেন",
    formula: "K₂Cr₂O₇ / H₂SO₄  [O]",
    hint: "Strong oxidizer — alcohol → aldehyde → acid",
    tint: "from-amber-400/30 to-orange-500/20",
    ring: "ring-amber-400/60",
  },
  {
    id: "naoh_alc",
    nameBn: "অ্যালকোহলিক সোডিয়াম হাইড্রোক্সাইড",
    formula: "NaOH (alc.)",
    hint: "Elimination — alkene তৈরি করে",
    tint: "from-fuchsia-400/30 to-purple-500/20",
    ring: "ring-fuchsia-400/60",
  },
  {
    id: "water_h3po4",
    nameBn: "পানি + ফসফরিক অ্যাসিড",
    formula: "H₂O / H₃PO₄",
    hint: "Hydration of alkene → alcohol",
    tint: "from-blue-400/30 to-indigo-500/20",
    ring: "ring-blue-400/60",
  },
];

type LogEntry = { id: number; ts: number; text: string; ok: boolean };

export default function TransformationMatrixLab({ onBack }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0); // index into NODES (starts at 0 = alkane)
  const [stars, setStars] = useState(3);
  const [mistakes, setMistakes] = useState(0);
  const [failFlash, setFailFlash] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 0, ts: Date.now(), text: "মিশন শুরু · রিয়েক্টরে মিথেন (CH₄) প্রস্তুত।", ok: true },
  ]);
  const [dragging, setDragging] = useState<ReagentId | null>(null);
  const [hovering, setHovering] = useState(false);

  const currentNode = NODES[currentIdx];
  const nextNode = NODES[currentIdx + 1] ?? null;
  const completed = currentIdx >= NODES.length - 1;
  const progressPct = ((currentIdx) / (NODES.length - 1)) * 100;

  const pushLog = useCallback((text: string, ok: boolean) => {
    setLogs((prev) => [{ id: prev.length + 1, ts: Date.now(), text, ok }, ...prev].slice(0, 40));
  }, []);

  const applyReagent = useCallback(
    (rid: ReagentId) => {
      if (completed) return;
      const target = nextNode;
      if (!target) return;

      if (target.requires === rid) {
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 700);
        setCurrentIdx((i) => i + 1);
        pushLog(
          `সঠিক বিকারক! ${currentNode.nameBn} → ${target.nameBn} (${target.formula})`,
          true,
        );
      } else {
        setFailFlash(true);
        setTimeout(() => setFailFlash(false), 500);
        setMistakes((m) => m + 1);
        setStars((s) => Math.max(0, s - 1));
        const rname = REAGENTS.find((r) => r.id === rid)?.nameBn ?? rid;
        pushLog(
          `ভুল বিকারক! "${rname}" ${currentNode.nameBn}-এ কাজ করবে না।`,
          false,
        );
      }
    },
    [completed, nextNode, currentNode, pushLog],
  );

  const reset = useCallback(() => {
    setCurrentIdx(0);
    setStars(3);
    setMistakes(0);
    setLogs([{ id: 0, ts: Date.now(), text: "মিশন রিসেট · মিথেন (CH₄) দিয়ে আবার শুরু।", ok: true }]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setHovering(false);
      const rid = (e.dataTransfer.getData("text/plain") || dragging) as ReagentId | "";
      setDragging(null);
      if (rid) applyReagent(rid);
    },
    [dragging, applyReagent],
  );

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-emerald-500/20 bg-slate-950/80 px-3 py-2 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 gap-1 px-2 text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-extrabold text-emerald-300">
              Functional Group Transformation Matrix
            </div>
            <div className="truncate text-[11px] text-slate-400">
              জৈব যৌগ রূপান্তর মিশন · Ch 11
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
            ধাপ {currentIdx}/{NODES.length - 1}
          </Badge>
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < stars ? "fill-amber-400 text-amber-400" : "text-slate-600",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Mission bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/60 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-300">
            <span className="text-emerald-300">মিশন:</span> মিথেন (CH₄) থেকে{" "}
            <span className="text-rose-300">মিথানয়িক অ্যাসিড (HCOOH)</span> পর্যন্ত পৌঁছাও —
            সঠিক বিকারক প্রয়োগ করে।
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="h-7 gap-1 border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>
        <Progress value={progressPct} className="mt-2 h-1.5 bg-slate-800" />
      </div>

      {/* Body */}
      <main className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* ── Left: Reactor + Pathway ── */}
        <section className="flex flex-col gap-3">
          {/* Pathway map */}
          <Card className="border-slate-800 bg-slate-900/60 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Reaction Pathway · রূপান্তর ম্যাপ
            </div>
            <div className="flex flex-nowrap items-stretch gap-1 overflow-x-auto pb-1">
              {NODES.map((n, i) => {
                const unlocked = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={n.id} className="flex items-center gap-1">
                    <motion.div
                      layout
                      animate={{
                        scale: isCurrent ? 1.05 : 1,
                        opacity: unlocked ? 1 : 0.45,
                      }}
                      className={cn(
                        "min-w-[110px] rounded-xl border p-2 text-center transition-colors",
                        unlocked
                          ? "border-emerald-400/50 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10"
                          : "border-slate-700 bg-slate-800/50",
                        isCurrent && "ring-2 ring-emerald-400/70",
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {!unlocked && <Lock className="h-3 w-3 text-slate-500" />}
                        <div
                          className="text-[10px] font-semibold uppercase tracking-wide"
                          style={{ color: unlocked ? n.color : "#64748b" }}
                        >
                          {n.family.split("·")[0].trim()}
                        </div>
                      </div>
                      <div className="mt-1 font-mono text-sm font-bold">{n.formula}</div>
                      <div className="text-[10px] text-slate-400">{n.nameBn}</div>
                    </motion.div>
                    {i < NODES.length - 1 && (
                      <ArrowRight
                        className={cn(
                          "h-4 w-4 shrink-0",
                          i < currentIdx ? "text-emerald-400" : "text-slate-600",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Reactor chamber */}
          <Card
            onDragOver={(e) => {
              e.preventDefault();
              setHovering(true);
            }}
            onDragLeave={() => setHovering(false)}
            onDrop={handleDrop}
            className={cn(
              "relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden border-2 border-dashed p-4 transition-colors",
              hovering
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-slate-700 bg-slate-900/60",
              failFlash && "border-red-500 bg-red-500/10",
              successFlash && "border-emerald-400 bg-emerald-500/20",
            )}
          >
            {/* flash overlays */}
            <AnimatePresence>
              {successFlash && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 bg-emerald-400/20"
                />
              )}
              {failFlash && (
                <motion.div
                  key="bad"
                  initial={{ x: 0 }}
                  animate={{ x: [-8, 8, -6, 6, 0] }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-none absolute inset-0 bg-red-500/10"
                />
              )}
            </AnimatePresence>

            <div className="mb-2 text-[11px] uppercase tracking-widest text-slate-400">
              Reactor Chamber · রিয়েক্টর
            </div>

            {/* Glass vessel */}
            <div className="relative flex h-40 w-40 items-end justify-center">
              <div className="absolute inset-x-6 top-0 h-3 rounded-t-md border-x-2 border-t-2 border-slate-500/60" />
              <div className="relative h-32 w-full overflow-hidden rounded-b-3xl border-2 border-slate-500/60 bg-slate-800/40 backdrop-blur">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentNode.id}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18 }}
                    className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-2"
                    style={{
                      background: `linear-gradient(180deg, transparent, ${currentNode.color}55 60%, ${currentNode.color}aa)`,
                      height: "70%",
                    }}
                  >
                    <div className="font-mono text-lg font-extrabold text-white drop-shadow">
                      {currentNode.formula}
                    </div>
                  </motion.div>
                </AnimatePresence>
                {/* bubbles on success */}
                <AnimatePresence>
                  {successFlash &&
                    [0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ y: 80, opacity: 0, x: 10 + i * 20 }}
                        animate={{ y: -20, opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="absolute bottom-0 h-2 w-2 rounded-full bg-white/70"
                      />
                    ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-3 text-center">
              <div className="text-xs text-slate-400">বর্তমান যৌগ</div>
              <div className="text-sm font-bold text-slate-100">
                {currentNode.nameBn} <span className="text-slate-500">· {currentNode.nameEn}</span>
              </div>
            </div>

            {!completed ? (
              <div className="mt-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                লক্ষ্য: {nextNode?.nameBn} ({nextNode?.formula}) — বিকারক ড্র্যাগ করে ছাড়ুন
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] text-amber-300">
                <CheckCircle2 className="h-3 w-3" /> মিশন সম্পন্ন! ⭐ {stars}/3
              </div>
            )}
          </Card>

          {/* Reagent inventory */}
          <Card className="border-slate-800 bg-slate-900/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Reagent Inventory · বিকারক
              </div>
              <span className="text-[10px] text-slate-500">টেনে রিয়েক্টরে ছাড়ুন / ক্লিক করুন</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {REAGENTS.map((r) => (
                <motion.button
                  key={r.id}
                  type="button"
                  draggable
                  onDragStart={(e: React.DragEvent<HTMLButtonElement>) => {
                    e.dataTransfer.setData("text/plain", r.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragging(r.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => applyReagent(r.id)}
                  whileHover={{ y: -3, rotate: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "group rounded-xl border border-slate-700/70 bg-gradient-to-br p-2 text-left ring-1 ring-transparent transition-shadow hover:shadow-lg",
                    r.tint,
                    dragging === r.id && `${r.ring} shadow-xl`,
                  )}
                >
                  <div className="font-mono text-xs font-bold text-slate-100">{r.formula}</div>
                  <div className="mt-0.5 text-[11px] text-slate-200">{r.nameBn}</div>
                  <div className="mt-1 text-[10px] italic text-slate-300/80">{r.hint}</div>
                </motion.button>
              ))}
            </div>
          </Card>
        </section>

        {/* ── Right: Molecular + Status ── */}
        <section className="flex flex-col gap-3">
          {/* Molecular view */}
          <Card className="border-slate-800 bg-slate-900/60 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Structural Change · গঠন পরিবর্তন
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <MolCard node={currentNode} label="বর্তমান" />
              <ArrowRight className="h-5 w-5 text-emerald-400" />
              <MolCard node={nextNode ?? currentNode} label={nextNode ? "লক্ষ্য" : "সম্পন্ন"} dim={!nextNode} />
            </div>
            <div className="mt-3 rounded-lg border border-slate-700/60 bg-slate-950/40 p-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                কেন এটি কাজ করে
              </div>
              <div className="mt-1 text-xs text-slate-200">
                {nextNode ? nextNode.why : "সব ধাপ সঠিকভাবে সম্পন্ন হয়েছে।"}
              </div>
              {nextNode && (
                <div className="mt-2 rounded bg-slate-800/60 p-1.5 text-center font-mono text-[11px] text-emerald-300">
                  {nextNode.equation}
                </div>
              )}
            </div>
          </Card>

          {/* Log */}
          <Card className="border-slate-800 bg-slate-900/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Mission Log · কার্যক্রম
              </div>
              <span className="text-[10px] text-slate-500">ভুল: {mistakes}</span>
            </div>
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {logs.map((l) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "flex items-start gap-2 rounded-md border px-2 py-1.5 text-[11px]",
                      l.ok
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                        : "border-red-500/30 bg-red-500/10 text-red-100",
                    )}
                  >
                    {l.ok ? (
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
                    ) : (
                      <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-red-300" />
                    )}
                    <span className="min-w-0">{l.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-300">
            <div className="mb-1 flex items-center gap-1 font-semibold text-emerald-300">
              <Beaker className="h-3 w-3" /> Tip
            </div>
            জলীয় NaOH দেয় অ্যালকোহল, কিন্তু অ্যালকোহলিক NaOH দেয় অ্যালকিন (এলিমিনেশন)।
            মাধ্যম পাল্টালেই বিক্রিয়া পাল্টায়।
          </Card>
        </section>
      </main>

      {/* Theory FAB */}
      <DraggableTheoryFab storageKey="transformation_matrix" label="থিওরি ও বিস্তারিত">
        <h3>জৈব রূপান্তরের মাস্টার রোডম্যাপ</h3>
        <p>
          অ্যালকেন → অ্যালকাইল হ্যালাইড → অ্যালকোহল → অ্যালডিহাইড → কার্বক্সিলিক অ্যাসিড।
          প্রতিটি ধাপ ফাংশনাল গ্রুপ পরিবর্তনের মাধ্যমে ঘটে।
        </p>

        <h4>মূল বিক্রিয়াসমূহ</h4>
        <ul>
          <li>
            <strong>Alkane → Alkyl Halide:</strong> CH₄ + Cl₂ —(UV)→ CH₃Cl + HCl (free radical
            substitution)
          </li>
          <li>
            <strong>Alkyl Halide → Alcohol:</strong> CH₃Cl + NaOH(aq) → CH₃OH + NaCl (nucleophilic
            substitution)
          </li>
          <li>
            <strong>Alkyl Halide → Alkene:</strong> CH₃CH₂Cl + NaOH(alc.) → CH₂=CH₂ + NaCl + H₂O
            (elimination)
          </li>
          <li>
            <strong>Alkene → Alcohol:</strong> CH₂=CH₂ + H₂O —(H₃PO₄)→ CH₃CH₂OH (hydration)
          </li>
          <li>
            <strong>Alcohol → Aldehyde:</strong> CH₃OH + [O] → HCHO + H₂O (mild oxidation,
            K₂Cr₂O₇/H₂SO₄)
          </li>
          <li>
            <strong>Aldehyde → Carboxylic Acid:</strong> HCHO + [O] → HCOOH (further oxidation)
          </li>
        </ul>

        <h4>শর্ত মনে রাখো</h4>
        <ul>
          <li>UV আলো → free radical → substitution</li>
          <li>জলীয় (aqueous) মাধ্যম → substitution (—OH যোগ)</li>
          <li>অ্যালকোহলিক মাধ্যম → elimination (দ্বিবন্ধন তৈরি)</li>
          <li>[O] জায়মান অক্সিজেন → জারণ (—OH → —CHO → —COOH)</li>
        </ul>

        <h4>ফাংশনাল গ্রুপ চিহ্নিতকরণ</h4>
        <p>
          —Cl (হ্যালাইড) → —OH (অ্যালকোহল) → —CHO (অ্যালডিহাইড) → —COOH (কার্বক্সিলিক অ্যাসিড):
          প্রতিটি ধাপে অক্সিজেন সংখ্যা বাড়ে বা হ্যালোজেন OH-এ পরিবর্তিত হয়।
        </p>
      </DraggableTheoryFab>
    </div>
  );
}

function MolCard({ node, label, dim = false }: { node: NodeMeta; label: string; dim?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2 text-center transition",
        dim ? "border-slate-800 opacity-70" : "border-slate-700 bg-slate-950/40",
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="font-mono text-lg font-extrabold" style={{ color: node.color }}>
        {node.formula}
      </div>
      <div className="text-[11px] text-slate-300">{node.nameBn}</div>
      <div
        className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ background: `${node.color}22`, color: node.color }}
      >
        {node.funcGroup}
      </div>
    </div>
  );
}
