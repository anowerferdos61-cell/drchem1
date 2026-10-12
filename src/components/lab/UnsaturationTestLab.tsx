/**
 * UnsaturationTestLab — Chapter 11 theory lab
 * Bromine water & Baeyer's (KMnO4) test to distinguish saturated
 * (Hexane) vs unsaturated (Ethene) hydrocarbons.
 */
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Droplet,
  FlaskConical,
  Zap,
  CheckCircle2,
  Circle,
  TriangleAlert,
  RotateCcw,
  Atom,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DraggableTheoryFab from "./DraggableTheoryFab";

type ReagentId = "br2" | "kmno4";
type TubeId = "hexane" | "ethene";

interface Props {
  onBack: () => void;
}

const REAGENT_COLORS: Record<
  ReagentId,
  { active: string; faded: string; name: string; nameBn: string }
> = {
  br2: {
    active: "#B63A1D",
    faded: "rgba(182,58,29,0)",
    name: "Br₂ / H₂O (Bromine Water)",
    nameBn: "ব্রোমিন পানি",
  },
  kmno4: {
    active: "#8E24AA",
    faded: "rgba(255,182,220,0.35)", // very light pink
    name: "KMnO₄ / OH⁻ (Baeyer's)",
    nameBn: "বেয়ার বিকারক",
  },
};

type TubeState = {
  drops: number; // total drops added
  reagent: ReagentId | null;
  reacted: boolean; // decolorized (unsaturated)
};

const INITIAL_TUBE: TubeState = { drops: 0, reagent: null, reacted: false };

export default function UnsaturationTestLab({ onBack }: Props) {
  const [reagent, setReagent] = useState<ReagentId>("br2");
  const [tubes, setTubes] = useState<Record<TubeId, TubeState>>({
    hexane: { ...INITIAL_TUBE },
    ethene: { ...INITIAL_TUBE },
  });
  const [zoomTube, setZoomTube] = useState<TubeId | null>(null);
  const [animKey, setAnimKey] = useState(0); // to replay bond-break

  const addDrop = useCallback(
    (t: TubeId) => {
      setTubes((prev) => {
        const next = { ...prev };
        const cur = { ...next[t] };
        cur.drops += 1;
        cur.reagent = reagent;
        // Ethene reacts (decolorizes); Hexane does not
        cur.reacted = t === "ethene";
        next[t] = cur;
        return next;
      });
      if (t === "ethene") {
        setZoomTube("ethene");
        setAnimKey((k) => k + 1);
      }
    },
    [reagent],
  );

  const reset = useCallback(() => {
    setTubes({ hexane: { ...INITIAL_TUBE }, ethene: { ...INITIAL_TUBE } });
    setZoomTube(null);
  }, []);

  // ── Derived ─────────────────────────────────────────
  const steps = useMemo(
    () => [
      { id: "s1", label: "টেস্টটিউব নির্বাচন করুন · Select test tubes", done: true },
      {
        id: "s2",
        label: "বিকারক ড্রপ যোগ করুন · Add reagent dropwise",
        done: tubes.hexane.drops + tubes.ethene.drops > 0,
      },
      {
        id: "s3",
        label: "রঙের পরিবর্তন পর্যবেক্ষণ · Observe color change",
        done: tubes.hexane.drops > 0 && tubes.ethene.drops > 0,
      },
      {
        id: "s4",
        label: "আণবিক মেকানিজম দেখুন · Check molecular mechanism",
        done: tubes.ethene.reacted,
      },
    ],
    [tubes],
  );

  const currentReagentColor = REAGENT_COLORS[reagent].active;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 py-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 h-8 gap-1 px-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Back</span>
          </Button>
          <div className="rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 p-1.5 text-white shadow">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-extrabold sm:text-base">
              অসম্পৃক্ততা পরীক্ষা · Unsaturation Test
            </div>
            <div className="truncate text-[10px] text-muted-foreground sm:text-xs">
              Chapter 11 · Br₂/H₂O ও Baeyer's (KMnO₄) পরীক্ষা
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {REAGENT_COLORS[reagent].nameBn}
            </Badge>
            <Button variant="outline" size="sm" onClick={reset} className="h-8 gap-1 text-xs">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Body — 3 columns on lg */}
      <main className="flex-1 p-2 pb-24 sm:p-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-3">
        {/* LEFT — Reagent control + observation */}
        <aside className="mb-3 space-y-3 lg:mb-0">
          <Card className="p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              বিকারক নির্বাচন · Reagent
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["br2", "kmno4"] as ReagentId[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setReagent(r)}
                  className={cn(
                    "rounded-lg border-2 p-2 text-left transition",
                    reagent === r
                      ? "border-primary bg-primary/10 shadow"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-black/20 shadow-inner"
                      style={{ background: REAGENT_COLORS[r].active }}
                    />
                    <span className="text-xs font-bold">{r === "br2" ? "Br₂ / H₂O" : "KMnO₄"}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {r === "br2" ? "ব্রোমিন পানি পরীক্ষা" : "বেয়ার পরীক্ষা"}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-md bg-muted/50 p-2 text-[11px]">
              <div className="font-semibold">
                {tubes.ethene.reacted
                  ? "অসম্পৃক্ত হাইড্রোকার্বনের সাথে বিক্রিয়া চলছে…"
                  : "বিকারক যোগ করে পরীক্ষা শুরু করুন"}
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
              <Zap className="h-3.5 w-3.5" /> পর্যবেক্ষণ · Observation
            </div>
            <table className="w-full text-[11px]">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-1 text-left font-medium">Tube</th>
                  <th className="py-1 text-left font-medium">Initial</th>
                  <th className="py-1 text-left font-medium">Final</th>
                  <th className="py-1 text-left font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                <ObsRow
                  label="A · হেক্সেন"
                  reagent={reagent}
                  drops={tubes.hexane.drops}
                  reacted={false}
                  isUnsat={false}
                />
                <ObsRow
                  label="B · ইথিন"
                  reagent={reagent}
                  drops={tubes.ethene.drops}
                  reacted={tubes.ethene.reacted}
                  isUnsat={true}
                />
              </tbody>
            </table>
          </Card>

          <Card className="p-3">
            <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">
              Steps · ধাপ
            </div>
            <ul className="space-y-1.5">
              {steps.map((s) => (
                <li key={s.id} className="flex items-start gap-2 text-xs">
                  {s.done ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className={s.done ? "text-muted-foreground line-through" : ""}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        {/* CENTER — Test tube rack */}
        <section className="mb-3 lg:mb-0">
          <Card className="relative h-full min-h-[420px] overflow-hidden bg-gradient-to-b from-white to-slate-50 p-4 dark:from-slate-900 dark:to-slate-950">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Test Tube Rack · টেস্টটিউব র‍্যাক
            </div>
            <div className="flex items-end justify-center gap-8 sm:gap-14">
              <TestTube
                id="hexane"
                labelBn="Tube A · হেক্সেন"
                labelEn="Hexane (C₆H₁₄)"
                state={tubes.hexane}
                reagentColor={currentReagentColor}
                onDrop={() => addDrop("hexane")}
                onClick={() => setZoomTube("hexane")}
              />
              <TestTube
                id="ethene"
                labelBn="Tube B · ইথিন"
                labelEn="Ethene (C₂H₄)"
                state={tubes.ethene}
                reagentColor={currentReagentColor}
                onDrop={() => addDrop("ethene")}
                onClick={() => setZoomTube("ethene")}
                highlight
              />
            </div>

            {/* Rack base */}
            <div className="mx-auto mt-2 h-3 w-4/5 rounded-md bg-gradient-to-b from-amber-800 to-amber-950 shadow-inner" />

            <div className="mt-4 flex justify-center gap-3">
              <Button
                size="sm"
                onClick={() => addDrop("hexane")}
                className="gap-1.5 text-xs"
                variant="outline"
              >
                <Droplet className="h-3.5 w-3.5" /> A এ ড্রপ
              </Button>
              <Button
                size="sm"
                onClick={() => addDrop("ethene")}
                className="gap-1.5 text-xs"
                style={{ background: currentReagentColor, color: "white" }}
              >
                <Droplet className="h-3.5 w-3.5" /> B তে ড্রপ
              </Button>
            </div>
          </Card>
        </section>

        {/* RIGHT — Zoom / mechanism */}
        <aside>
          <Card className="h-full min-h-[420px] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
              <Atom className="h-3.5 w-3.5" /> Molecular View · আণবিক দৃশ্য
            </div>
            <MechanismView
              tube={zoomTube}
              reagent={reagent}
              reacted={zoomTube === "ethene" && tubes.ethene.reacted}
              animKey={animKey}
            />
            <div className="mt-3 rounded-md border bg-muted/40 p-2 text-[11px]">
              {zoomTube === null ? (
                <span className="text-muted-foreground">
                  কোন টেস্টটিউবে ড্রপ যোগ করলে এখানে আণবিক মেকানিজম দেখাবে।
                </span>
              ) : zoomTube === "hexane" ? (
                <>
                  <b>Hexane (C₆H₁₄)</b> এ শুধুমাত্র <b>σ</b>-বন্ড আছে; π-বন্ড না থাকায় Br₂ বা KMnO₄
                  কোনটির সাথেই বিক্রিয়া করে না → রঙ অপরিবর্তিত।
                </>
              ) : reagent === "br2" ? (
                <>
                  <b>C₂H₄ + Br₂ → CH₂Br–CH₂Br</b> — π-বন্ড ভেঙে দুই কার্বনে Br যুক্ত হয়, ব্রোমিনের
                  বাদামী রঙ বর্ণহীন হয়ে যায়।
                </>
              ) : (
                <>
                  <b>3 C₂H₄ + 2 KMnO₄ + 4 H₂O → 3 CH₂(OH)–CH₂(OH) + 2 MnO₂ + 2 KOH</b>— বেগুনি রঙ
                  হালকা গোলাপি/বর্ণহীন হয়ে যায়।
                </>
              )}
            </div>
          </Card>
        </aside>
      </main>

      {/* Draggable Theory */}
      <DraggableTheoryFab storageKey="unsaturation_test" label="থিওরি ও বিস্তারিত">
        <TheoryContent />
      </DraggableTheoryFab>
    </div>
  );
}

/* ─────────────────── Test Tube ─────────────────── */

function TestTube({
  labelBn,
  labelEn,
  state,
  reagentColor,
  onDrop,
  onClick,
  highlight,
}: {
  id: TubeId;
  labelBn: string;
  labelEn: string;
  state: TubeState;
  reagentColor: string;
  onDrop: () => void;
  onClick: () => void;
  highlight?: boolean;
}) {
  // Liquid color logic
  let liquidColor = "rgba(200, 220, 255, 0.55)"; // clear-ish
  if (state.drops > 0 && state.reagent) {
    if (state.reacted) {
      // Ethene — reagent decolorizes
      liquidColor =
        state.reagent === "kmno4"
          ? "rgba(255,192,220,0.35)" // faint pink
          : "rgba(220,240,255,0.4)"; // colorless
    } else {
      // Hexane — reagent color stays
      liquidColor = state.reagent === "br2" ? "#B63A1D" : "#8E24AA";
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Dropper */}
      <button
        type="button"
        onClick={onDrop}
        title="Add drop"
        className={cn(
          "relative mb-1 flex flex-col items-center transition hover:scale-110",
          highlight && "drop-shadow-[0_0_8px_rgba(180,50,40,0.5)]",
        )}
      >
        <div className="h-4 w-6 rounded-t-md bg-slate-600" />
        <div
          className="h-8 w-3 rounded-b-full border border-black/30"
          style={{ background: reagentColor }}
        />
        {/* falling drop */}
        <AnimatePresence>
          {state.drops > 0 && (
            <motion.div
              key={state.drops}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: 90 }}
              transition={{ duration: 0.6, ease: "easeIn" }}
              className="absolute left-1/2 top-full h-3 w-2 -translate-x-1/2 rounded-full"
              style={{ background: reagentColor }}
            />
          )}
        </AnimatePresence>
      </button>

      {/* Tube */}
      <div
        className={cn(
          "relative h-40 w-14 overflow-hidden rounded-b-full border-2 border-slate-300 bg-white/40 shadow-inner cursor-pointer",
          highlight && "ring-2 ring-amber-400/60",
        )}
        onClick={onClick}
      >
        {/* liquid */}
        <motion.div
          className="absolute inset-x-0 bottom-0"
          animate={{ background: liquidColor, height: "55%" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{ background: liquidColor, height: "55%" }}
        />
        {/* meniscus shine */}
        <div className="absolute inset-x-1 top-2 h-6 rounded-full bg-white/20 blur-sm" />
      </div>
      <div className="mt-2 text-center text-[11px] font-semibold">{labelBn}</div>
      <div className="text-[10px] text-muted-foreground">{labelEn}</div>
      <div className="mt-0.5 text-[10px]">
        Drops: <span className="font-mono">{state.drops}</span>
      </div>
    </div>
  );
}

/* ─────────────────── Observation Row ─────────────────── */

function ObsRow({
  label,
  reagent,
  drops,
  reacted,
  isUnsat,
}: {
  label: string;
  reagent: ReagentId;
  drops: number;
  reacted: boolean;
  isUnsat: boolean;
}) {
  const initial = "বর্ণহীন";
  let final = "—";
  if (drops > 0) {
    if (reacted) {
      final = reagent === "kmno4" ? "হালকা গোলাপি/বর্ণহীন" : "বর্ণহীন";
    } else {
      final = reagent === "br2" ? "লাল-বাদামী" : "বেগুনি";
    }
  }
  return (
    <tr className="border-b last:border-0">
      <td className="py-1 font-medium">{label}</td>
      <td className="py-1 text-muted-foreground">{initial}</td>
      <td className="py-1">{final}</td>
      <td className="py-1">
        {drops === 0 ? (
          "—"
        ) : isUnsat ? (
          <Badge variant="default" className="bg-emerald-500 text-[10px]">
            অসম্পৃক্ত
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            সম্পৃক্ত
          </Badge>
        )}
      </td>
    </tr>
  );
}

/* ─────────────────── Mechanism View (SVG) ─────────────────── */

function MechanismView({
  tube,
  reagent,
  reacted,
  animKey,
}: {
  tube: TubeId | null;
  reagent: ReagentId;
  reacted: boolean;
  animKey: number;
}) {
  if (!tube) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-lg border border-dashed text-center text-xs text-muted-foreground">
        <TriangleAlert className="mb-2 h-6 w-6 opacity-60" />
        Molecular animation appears here after adding a drop.
      </div>
    );
  }

  if (tube === "hexane") {
    return (
      <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-white p-3 dark:from-slate-900 dark:to-slate-950">
        <svg viewBox="0 0 320 160" className="w-full">
          {/* Hexane simplified: 6 carbons with H's, single bonds only */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const x = 30 + i * 45;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={90}
                  x2={x + 45}
                  y2={90}
                  stroke="#334155"
                  strokeWidth={2}
                  opacity={i < 5 ? 1 : 0}
                />
                <circle cx={x} cy={90} r={12} fill="#1e293b" />
                <text x={x} y={94} textAnchor="middle" fill="white" fontSize={10} fontWeight={700}>
                  C
                </text>
              </g>
            );
          })}
          <text
            x={160}
            y={40}
            textAnchor="middle"
            fontSize={12}
            fill="currentColor"
            fontWeight={700}
          >
            Hexane · সব σ-বন্ড
          </text>
          <text x={160} y={140} textAnchor="middle" fontSize={10} fill="#64748b">
            π-বন্ড নেই → বিক্রিয়া হয় না
          </text>
        </svg>
      </div>
    );
  }

  // Ethene mechanism
  return (
    <div className="rounded-lg border bg-gradient-to-br from-amber-50 to-white p-3 dark:from-slate-900 dark:to-slate-950">
      <motion.svg key={animKey} viewBox="0 0 320 200" className="w-full">
        {/* C=C */}
        <motion.g
          initial={{ x: 0 }}
          animate={reacted ? { x: -20 } : { x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <circle cx="120" cy="100" r="18" fill="#1e293b" />
          <text x="120" y="105" textAnchor="middle" fill="white" fontWeight={700}>
            C
          </text>
        </motion.g>
        <motion.g
          initial={{ x: 0 }}
          animate={reacted ? { x: 20 } : { x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <circle cx="200" cy="100" r="18" fill="#1e293b" />
          <text x="200" y="105" textAnchor="middle" fill="white" fontWeight={700}>
            C
          </text>
        </motion.g>
        {/* σ-bond */}
        <line x1="138" y1="100" x2="182" y2="100" stroke="#334155" strokeWidth={3} />
        {/* π-bond (breaks) */}
        <motion.line
          x1="138"
          y1="88"
          x2="182"
          y2="88"
          stroke="#f59e0b"
          strokeWidth={2.5}
          strokeDasharray="4 3"
          initial={{ opacity: 1 }}
          animate={reacted ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        {/* Hydrogens */}
        {[
          [95, 70],
          [95, 130],
          [225, 70],
          [225, 130],
        ].map(([x, y], i) => (
          <g key={i}>
            <line
              x1={120 + (i > 1 ? 80 : 0)}
              y1="100"
              x2={x}
              y2={y}
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            <circle cx={x} cy={y} r="9" fill="#e2e8f0" stroke="#94a3b8" />
            <text x={x} y={y + 3} textAnchor="middle" fontSize={9} fontWeight={700}>
              H
            </text>
          </g>
        ))}
        {/* Incoming reagent atoms (Br or OH) */}
        {reacted && (
          <>
            <motion.g
              initial={{ x: -80, y: -60, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <circle cx="100" cy="100" r="11" fill={reagent === "br2" ? "#B63A1D" : "#059669"} />
              <text x="100" y="103" textAnchor="middle" fill="white" fontSize={9} fontWeight={700}>
                {reagent === "br2" ? "Br" : "OH"}
              </text>
            </motion.g>
            <motion.g
              initial={{ x: 80, y: -60, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <circle cx="220" cy="100" r="11" fill={reagent === "br2" ? "#B63A1D" : "#059669"} />
              <text x="220" y="103" textAnchor="middle" fill="white" fontSize={9} fontWeight={700}>
                {reagent === "br2" ? "Br" : "OH"}
              </text>
            </motion.g>
          </>
        )}
        <text
          x="160"
          y="180"
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="currentColor"
        >
          {reacted
            ? reagent === "br2"
              ? "CH₂Br–CH₂Br (বর্ণহীন)"
              : "CH₂(OH)–CH₂(OH) · Ethylene Glycol"
            : "C₂H₄ · π-বন্ড দুর্বল (সহজে ভাঙে)"}
        </text>
      </motion.svg>
    </div>
  );
}

/* ─────────────────── Theory Content ─────────────────── */

function TheoryContent() {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <h3 className="text-base font-bold">অসম্পৃক্ততা পরীক্ষা কী?</h3>
        <p className="mt-1 text-muted-foreground">
          হাইড্রোকার্বনে দ্বি-বন্ধন (C=C) বা ত্রি-বন্ধন (C≡C) অর্থাৎ π-বন্ধন আছে কিনা তা জানার জন্য
          ব্রোমিন পানি (Br₂/H₂O) ও বেয়ার বিকারক (Baeyer's, ক্ষারীয় KMnO₄) ব্যবহার করা হয়।
        </p>
      </section>

      <section>
        <h4 className="font-semibold">১. ব্রোমিন পানি পরীক্ষা (Bromine Water Test)</h4>
        <pre className="mt-1 whitespace-pre-wrap rounded bg-muted p-2 text-xs">
          CH₂=CH₂ + Br₂ → CH₂Br–CH₂Br (বর্ণহীন) CH≡CH + 2 Br₂ → CHBr₂–CHBr₂ Alkane (হেক্সেন): C₆H₁₄
          + Br₂ → কোনো বিক্রিয়া নেই (রঙ অপরিবর্তিত)
        </pre>
      </section>

      <section>
        <h4 className="font-semibold">২. বেয়ার পরীক্ষা (Baeyer's Test)</h4>
        <pre className="mt-1 whitespace-pre-wrap rounded bg-muted p-2 text-xs">
          3 CH₂=CH₂ + 2 KMnO₄ + 4 H₂O → 3 CH₂(OH)–CH₂(OH) + 2 MnO₂ + 2 KOH বেগুনি KMnO₄ → হালকা
          গোলাপি / বর্ণহীন (অসম্পৃক্ত) Hexane এ কোনো পরিবর্তন নেই।
        </pre>
      </section>

      <section>
        <h4 className="font-semibold">কেন Alkane বিক্রিয়া করে না?</h4>
        <p className="mt-1 text-muted-foreground">
          Alkane (সম্পৃক্ত) এ শুধুমাত্র শক্তিশালী σ-বন্ধন আছে। এই বন্ধন সাধারণ তাপমাত্রায় Br₂ বা
          KMnO₄ দ্বারা ভাঙা যায় না, তাই কোনো রঙ পরিবর্তন হয় না।
        </p>
      </section>

      <section>
        <h4 className="font-semibold">তুলনা টেবিল</h4>
        <div className="mt-1 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="p-1 text-left">Property</th>
                <th className="p-1 text-left">Hexane (Alkane)</th>
                <th className="p-1 text-left">Ethene (Alkene)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-1">π-বন্ড</td>
                <td className="p-1">নেই</td>
                <td className="p-1">আছে</td>
              </tr>
              <tr className="border-b">
                <td className="p-1">Br₂/H₂O</td>
                <td className="p-1">অপরিবর্তিত</td>
                <td className="p-1">বর্ণহীন</td>
              </tr>
              <tr>
                <td className="p-1">KMnO₄</td>
                <td className="p-1">অপরিবর্তিত</td>
                <td className="p-1">হালকা গোলাপি</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
