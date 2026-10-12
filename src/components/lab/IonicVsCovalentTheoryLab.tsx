/**
 * Ionic vs Covalent Properties Lab (Theory · Chapter 5)
 *
 * Split-screen high-fidelity comparison:
 *   • Left  — Sodium Chloride (NaCl) · ionic
 *   • Right — Sucrose (Sugar C₁₂H₂₂O₁₁) · covalent
 *
 * Two modes controlled from a floating bottom hub:
 *   1. Melting Point Test  — Bunsen burner, thermometer, NaCl stays solid at 801°C,
 *      sugar melts (~186°C), then browns and chars.
 *   2. Conductivity Test — Beaker of water, dissolving animation, circuit + LED.
 *      NaCl → dissociated Na⁺/Cl⁻ ions light bulb; sugar molecules keep bulb OFF.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Atom,
  Beaker,
  Flame,
  Info,
  Lightbulb,
  Play,
  Power,
  RotateCcw,
  Thermometer,
  Waves,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TheoryLabShell from "./TheoryLabShell";

interface Props {
  onBack: () => void;
}

type Mode = "melting" | "conductivity";

const NACL_MP = 801;
const SUGAR_MP = 186;
const SUGAR_CHAR = 200;

export default function IonicVsCovalentTheoryLab({ onBack }: Props) {
  const [mode, setMode] = useState<Mode>("melting");

  // Melting test
  const [heating, setHeating] = useState(false);
  const [tempNaCl, setTempNaCl] = useState(25);
  const [tempSugar, setTempSugar] = useState(25);

  // Conductivity test
  const [dissolving, setDissolving] = useState(false); // pouring animation running
  const [dissolved, setDissolved] = useState(false);
  const [switchOn, setSwitchOn] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());

  // ── Melting temperature ramp ───────────────────────────────
  useEffect(() => {
    if (mode !== "melting" || !heating) return;
    const step = (now: number) => {
      const dt = Math.min(64, now - lastRef.current) / 1000;
      lastRef.current = now;
      setTempNaCl((t) => Math.min(NACL_MP + 20, t + dt * 60)); // slow, reaches ~800°C
      setTempSugar((t) => Math.min(SUGAR_CHAR + 40, t + dt * 22)); // faster relative to its low MP
      rafRef.current = requestAnimationFrame(step);
    };
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [heating, mode]);

  // Sugar visual state derived from its temperature
  const sugarState: "solid" | "melting" | "molten" | "browning" | "charred" =
    tempSugar < SUGAR_MP - 30
      ? "solid"
      : tempSugar < SUGAR_MP
        ? "melting"
        : tempSugar < SUGAR_CHAR
          ? "molten"
          : tempSugar < SUGAR_CHAR + 20
            ? "browning"
            : "charred";

  const sugarStateLabelBn: Record<typeof sugarState, string> = {
    solid: "কঠিন",
    melting: "গলছে",
    molten: "গলিত তরল",
    browning: "বাদামি হচ্ছে",
    charred: "কালো ছাই",
  };
  const sugarStateLabelEn: Record<typeof sugarState, string> = {
    solid: "Solid",
    melting: "Melting",
    molten: "Molten",
    browning: "Browning",
    charred: "Charred",
  };

  // ── Dissolving animation ───────────────────────────────────
  useEffect(() => {
    if (mode !== "conductivity" || !dissolving) return;
    const to = setTimeout(() => {
      setDissolved(true);
      setDissolving(false);
    }, 1800);
    return () => clearTimeout(to);
  }, [dissolving, mode]);

  const reset = () => {
    setHeating(false);
    setTempNaCl(25);
    setTempSugar(25);
    setDissolving(false);
    setDissolved(false);
    setSwitchOn(false);
  };

  const bulbNaCl = mode === "conductivity" && dissolved && switchOn;
  const bulbSugar = false; // sugar never conducts

  const badge = useMemo(() => {
    if (mode === "melting") {
      return (
        <Badge
          variant="secondary"
          className="gap-1.5 border border-white/10 bg-gradient-to-r from-orange-500 to-rose-600 text-white"
        >
          <Flame className="h-3.5 w-3.5" />
          <span className="text-lab-xs font-semibold">Melting Point Test</span>
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="gap-1.5 border border-white/10 bg-gradient-to-r from-sky-500 to-blue-600 text-white"
      >
        <Zap className="h-3.5 w-3.5" />
        <span className="text-lab-xs font-semibold">Conductivity Test</span>
      </Badge>
    );
  }, [mode]);

  return (
    <TheoryLabShell
      onBack={onBack}
      titleBn="আয়নিক বনাম সমযোজী — ধর্মের তুলনা"
      subtitleEn="Chapter 5 · Ionic vs Covalent Properties Lab"
      headerIcon={
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow shadow-violet-500/20">
          <Atom className="h-4 w-4 text-white" />
        </div>
      }
      badge={badge}
      /* ── LEFT — concept + live metrics ── */
      info={
        <>
          <Card className="overflow-hidden border-0 shadow ring-2 ring-violet-400/30">
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 px-3 py-2 text-white">
              <div className="flex items-center gap-1.5 text-lab-xs font-medium opacity-90">
                <Info className="h-3 w-3" /> মূল ধারণা
              </div>
              <div className="mt-0.5 font-extrabold leading-tight text-lab-lg">
                Ionic vs Covalent
              </div>
            </div>
            <p className="px-3 py-2 text-lab-sm text-foreground/90">
              আয়নিক যৌগে (NaCl) শক্তিশালী ল্যাটিস আকর্ষণ থাকায় গলনাঙ্ক অনেক বেশি এবং পানিতে
              দ্রবীভূত হয়ে আয়নে বিয়োজিত হয়ে তড়িৎ পরিবহন করে। সমযোজী যৌগে (চিনি) দুর্বল
              আন্তঃআণবিক বল, দ্রুত গলে বা পুড়ে যায় এবং দ্রবণে আয়ন সৃষ্টি করে না।
            </p>
          </Card>

          <Card className="p-3 space-y-2">
            <div className="text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Live Metrics · সরাসরি তথ্য
            </div>

            {mode === "melting" ? (
              <>
                <Metric
                  label="NaCl Temp"
                  value={`${Math.round(tempNaCl)}`}
                  unit="°C"
                  gradient="from-rose-500 to-orange-600"
                  icon={Thermometer}
                />
                <Metric
                  label="Sugar Temp"
                  value={`${Math.round(tempSugar)}`}
                  unit="°C"
                  gradient="from-amber-500 to-yellow-600"
                  icon={Thermometer}
                />
                <div className="rounded-md bg-muted/50 px-2 py-1.5 text-lab-xs">
                  <b>NaCl:</b>{" "}
                  {tempNaCl >= NACL_MP ? "গলনাঙ্কে পৌঁছেছে (801°C)" : "কঠিন — উচ্চ ল্যাটিস শক্তি"}
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5 text-lab-xs">
                  <b>Sugar:</b> {sugarStateLabelBn[sugarState]} · {sugarStateLabelEn[sugarState]}
                </div>
              </>
            ) : (
              <>
                <Metric
                  label="NaCl Bulb"
                  value={bulbNaCl ? "ON" : "OFF"}
                  unit=""
                  gradient={
                    bulbNaCl ? "from-amber-400 to-orange-500" : "from-slate-500 to-slate-700"
                  }
                  icon={Lightbulb}
                />
                <Metric
                  label="Sugar Bulb"
                  value="OFF"
                  unit=""
                  gradient="from-slate-500 to-slate-700"
                  icon={Lightbulb}
                />
                <div className="rounded-md bg-muted/50 px-2 py-1.5 text-lab-xs">
                  <b>NaCl:</b> Electrolyte — Na⁺ ও Cl⁻ আয়ন তড়িৎ বহন করে।
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5 text-lab-xs">
                  <b>Sugar:</b> Non-electrolyte — আণবিক, মুক্ত আয়ন নেই।
                </div>
              </>
            )}
          </Card>

          <Card className="p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Info className="h-3 w-3" /> Legend · সংকেত
            </div>
            <div className="space-y-1.5 text-lab-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-rose-500" />
                <span>
                  <b>Na⁺</b> · Cation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                <span>
                  <b>Cl⁻</b> · Anion
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-amber-400" />
                <span>
                  <b>C₁₂H₂₂O₁₁</b> · Sugar molecule
                </span>
              </div>
            </div>
          </Card>
        </>
      }
      /* ── CENTER — split screen visual ── */
      visual={
        <div
          className="relative w-full rounded-xl bg-gradient-to-b from-slate-100/60 to-slate-200/40 ring-1 ring-slate-300/40 dark:from-slate-800/40 dark:to-slate-900/60 dark:ring-slate-700/40"
          style={{ aspectRatio: "5 / 4", maxHeight: "100%", height: "100%" }}
        >
          <div className="absolute inset-0 grid grid-cols-2 gap-1 p-2 pb-16">
            {/* LEFT — NaCl */}
            <SamplePanel
              side="left"
              titleEn="Sodium Chloride"
              formula="NaCl"
              titleBn="আয়নিক যৌগ"
              accent="from-rose-500 to-fuchsia-600"
              iconSlot={<LatticeIcon />}
              mode={mode}
              temp={tempNaCl}
              heating={heating}
              melted={false /* NaCl won't melt in our animated range */}
              sugarState={undefined}
              dissolving={dissolving}
              dissolved={dissolved}
              switchOn={switchOn}
              bulbOn={bulbNaCl}
              isIonic
            />
            {/* RIGHT — Sugar */}
            <SamplePanel
              side="right"
              titleEn="Sucrose (Sugar)"
              formula="C₁₂H₂₂O₁₁"
              titleBn="সমযোজী যৌগ"
              accent="from-amber-500 to-orange-600"
              iconSlot={<MoleculeIcon />}
              mode={mode}
              temp={tempSugar}
              heating={heating}
              melted={tempSugar >= SUGAR_MP}
              sugarState={sugarState}
              dissolving={dissolving}
              dissolved={dissolved}
              switchOn={switchOn}
              bulbOn={bulbSugar}
              isIonic={false}
            />
          </div>

          {/* Floating bottom control hub */}
          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-xl border bg-background/90 px-2 py-1.5 shadow-lg backdrop-blur">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
              <button
                onClick={() => setMode("melting")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-lab-xs font-semibold transition ${
                  mode === "melting"
                    ? "bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Flame className="h-3.5 w-3.5" /> Melting
              </button>
              <button
                onClick={() => setMode("conductivity")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-lab-xs font-semibold transition ${
                  mode === "conductivity"
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> Conductivity
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {mode === "melting" ? (
                <Button
                  size="sm"
                  variant={heating ? "secondary" : "default"}
                  onClick={() => setHeating((h) => !h)}
                  className="h-8 gap-1.5"
                >
                  {heating ? (
                    <>
                      <Power className="h-3.5 w-3.5" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Start Heating
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant={dissolved || dissolving ? "secondary" : "default"}
                    disabled={dissolved || dissolving}
                    onClick={() => setDissolving(true)}
                    className="h-8 gap-1.5"
                  >
                    <Beaker className="h-3.5 w-3.5" />
                    {dissolved ? "Dissolved" : dissolving ? "Pouring…" : "Add Water"}
                  </Button>
                  <Button
                    size="sm"
                    variant={switchOn ? "secondary" : "default"}
                    disabled={!dissolved}
                    onClick={() => setSwitchOn((s) => !s)}
                    className="h-8 gap-1.5"
                  >
                    <Power className="h-3.5 w-3.5" />
                    {switchOn ? "Switch OFF" : "Switch ON"}
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={reset} className="h-8 gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </div>
        </div>
      }
      /* ── RIGHT — mode-aware guidance ── */
      controls={
        <>
          <Card className="p-3 space-y-2">
            <div className="text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {mode === "melting" ? "Melting Point Test" : "Conductivity Test"}
            </div>
            {mode === "melting" ? (
              <ul className="space-y-1.5 text-lab-sm">
                <li className="flex gap-2">
                  <span className="font-bold text-rose-500">1.</span> দুইটি ওয়াচ-গ্লাসে সমান পরিমাণ
                  NaCl ও চিনি নিন।
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-rose-500">2.</span> নিচের বার্নার জ্বালিয়ে{" "}
                  <b>Start Heating</b> চাপুন।
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-rose-500">3.</span> লক্ষ্য করুন — চিনি ~186°C তে
                  গলে, বাদামি হয়, তারপর কালো হয়ে যায়।
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-rose-500">4.</span> NaCl অপরিবর্তিত — 801°C
                  প্রয়োজন হয়।
                </li>
              </ul>
            ) : (
              <ul className="space-y-1.5 text-lab-sm">
                <li className="flex gap-2">
                  <span className="font-bold text-sky-500">1.</span> <b>Add Water</b> চাপুন — উভয়
                  নমুনা পানিতে দ্রবীভূত হবে।
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-sky-500">2.</span> ব্যাটারি + LED সার্কিট সংযুক্ত
                  — <b>Switch ON</b> চাপুন।
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-sky-500">3.</span> NaCl পাশে Na⁺/Cl⁻ ভাসছে — LED
                  জ্বলছে ✅
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-sky-500">4.</span> চিনি পাশে অক্ষত অণু — LED বন্ধ
                  ❌
                </li>
              </ul>
            )}
          </Card>

          <Card className="p-3">
            <div className="mb-1.5 text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Comparison Table
            </div>
            <div className="overflow-hidden rounded-md border text-lab-xs">
              <div className="grid grid-cols-3 bg-muted/60 font-semibold">
                <div className="px-2 py-1.5">Property</div>
                <div className="px-2 py-1.5 text-rose-600">NaCl</div>
                <div className="px-2 py-1.5 text-amber-600">Sugar</div>
              </div>
              <Row a="Bonding" b="Ionic" c="Covalent" />
              <Row a="M.P." b="801°C" c="186°C" />
              <Row a="In water" b="Ions" c="Molecules" />
              <Row a="Conducts?" b="Yes" c="No" />
            </div>
          </Card>
        </>
      }
    />
  );
}

/* ─────────────────────────────────────────────────────────── */

function Row({ a, b, c }: { a: string; b: string; c: string }) {
  return (
    <div className="grid grid-cols-3 border-t">
      <div className="px-2 py-1.5 text-muted-foreground">{a}</div>
      <div className="px-2 py-1.5 font-semibold">{b}</div>
      <div className="px-2 py-1.5 font-semibold">{c}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  gradient,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md bg-gradient-to-r ${gradient} px-2.5 py-1.5 text-white shadow-sm`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-90">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-lab-sm font-extrabold tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-[10px] opacity-80">{unit}</span>}
      </div>
    </div>
  );
}

/* ─── Sample panel (left NaCl / right Sugar) ─── */

function SamplePanel({
  titleEn,
  formula,
  titleBn,
  accent,
  iconSlot,
  mode,
  temp,
  heating,
  melted,
  sugarState,
  dissolving,
  dissolved,
  switchOn,
  bulbOn,
  isIonic,
}: {
  side: "left" | "right";
  titleEn: string;
  formula: string;
  titleBn: string;
  accent: string;
  iconSlot: React.ReactNode;
  mode: Mode;
  temp: number;
  heating: boolean;
  melted: boolean;
  sugarState?: "solid" | "melting" | "molten" | "browning" | "charred";
  dissolving: boolean;
  dissolved: boolean;
  switchOn: boolean;
  bulbOn: boolean;
  isIonic: boolean;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border bg-background/70 shadow-inner">
      {/* Header */}
      <div className={`flex items-center gap-2 bg-gradient-to-r ${accent} px-2 py-1.5 text-white`}>
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/20">
          {iconSlot}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[11px] font-extrabold">{titleEn}</div>
          <div className="truncate text-[9px] opacity-90">
            {formula} · {titleBn}
          </div>
        </div>
      </div>

      {/* Visual */}
      <div className="relative flex-1">
        {mode === "melting" ? (
          <MeltingScene
            temp={temp}
            heating={heating}
            melted={melted}
            sugarState={sugarState}
            isIonic={isIonic}
          />
        ) : (
          <ConductivityScene
            dissolving={dissolving}
            dissolved={dissolved}
            switchOn={switchOn}
            bulbOn={bulbOn}
            isIonic={isIonic}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Icons ─── */

function LatticeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4">
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <circle
            key={`${r}-${c}`}
            cx={4 + c * 6}
            cy={4 + r * 6}
            r={1.6}
            fill={(r + c) % 2 === 0 ? "#fff" : "#fecdd3"}
          />
        )),
      )}
    </svg>
  );
}

function MoleculeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4">
      <circle cx="10" cy="10" r="3" fill="#fff" />
      <circle cx="4" cy="6" r="2" fill="#fed7aa" />
      <circle cx="16" cy="6" r="2" fill="#fed7aa" />
      <circle cx="10" cy="16" r="2" fill="#fed7aa" />
      <line x1="10" y1="10" x2="4" y2="6" stroke="#fff" strokeWidth="1" />
      <line x1="10" y1="10" x2="16" y2="6" stroke="#fff" strokeWidth="1" />
      <line x1="10" y1="10" x2="10" y2="16" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

/* ─── Melting scene — pseudo-3D glassmorphism apparatus ─── */

function MeltingScene({
  temp,
  heating,
  sugarState,
  isIonic,
}: {
  temp: number;
  heating: boolean;
  melted: boolean;
  sugarState?: "solid" | "melting" | "molten" | "browning" | "charred";
  isIonic: boolean;
}) {
  const maxT = isIonic ? 900 : 240;
  const thermFrac = Math.min(1, Math.max(0.06, (temp - 20) / (maxT - 20)));
  const reachedNaCl = isIonic && temp >= NACL_MP;
  const reachedSugar = !isIonic && (sugarState === "charred" || sugarState === "browning");

  const gradId = isIonic ? "flameBlue" : "flameOrange";

  return (
    <svg viewBox="0 0 220 260" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* Tabletop */}
        <linearGradient id={`table-${isIonic ? "i" : "c"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={isIonic ? "#1e293b" : "#292524"} />
          <stop offset="1" stopColor={isIonic ? "#0f172a" : "#1c1917"} />
        </linearGradient>
        {/* Metal tripod / gauze / stand */}
        <linearGradient id="metal" x1="0" x2="1">
          <stop offset="0" stopColor="#334155" />
          <stop offset="0.5" stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
        {/* Crucible ceramic */}
        <radialGradient id="crucible" cx="0.5" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="0.6" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#64748b" />
        </radialGradient>
        {/* Glass beaker */}
        <linearGradient id="beakerG" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="0.4" stopColor="rgba(186,230,253,0.25)" />
          <stop offset="0.6" stopColor="rgba(186,230,253,0.15)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.7)" />
        </linearGradient>
        {/* Clay triangle */}
        <linearGradient id="clay" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c2410c" />
          <stop offset="1" stopColor="#7c2d12" />
        </linearGradient>
        {/* Flames */}
        <radialGradient id="flameOrange" cx="0.5" cy="0.9" r="0.7">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset="0.35" stopColor="#fbbf24" />
          <stop offset="0.75" stopColor="#ea580c" />
          <stop offset="1" stopColor="#7f1d1d" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id="flameBlue" cx="0.5" cy="0.9" r="0.75">
          <stop offset="0" stopColor="#f5d0fe" />
          <stop offset="0.25" stopColor="#c4b5fd" />
          <stop offset="0.55" stopColor="#4f46e5" />
          <stop offset="0.85" stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* Crystal sparkle */}
        <linearGradient id="crystal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        {/* Molten pool */}
        <radialGradient id="molten" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#fef08a" />
          <stop offset="1" stopColor="#ca8a04" />
        </radialGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Ambient backdrop glow when heating */}
      {heating && (
        <rect
          x="0"
          y="0"
          width="220"
          height="260"
          fill={isIonic ? "#6366f1" : "#f97316"}
          opacity={reachedNaCl || reachedSugar ? 0.12 : 0.06}
        />
      )}

      {/* Tabletop (isometric slab) */}
      <g>
        <polygon
          points="10,220 210,220 200,238 20,238"
          fill={`url(#table-${isIonic ? "i" : "c"})`}
        />
        <polygon points="10,220 20,238 20,244 10,226" fill="#000" opacity="0.35" />
        <polygon points="210,220 200,238 200,244 210,226" fill="#000" opacity="0.35" />
      </g>

      {/* Thermometer (glass tube, floating right) */}
      <g transform="translate(188 20)">
        <rect
          x="0"
          y="0"
          width="12"
          height="150"
          rx="6"
          fill="rgba(255,255,255,0.55)"
          stroke="#94a3b8"
          strokeWidth="0.8"
        />
        <rect
          x="3"
          y={150 - thermFrac * 142}
          width="6"
          height={thermFrac * 142}
          rx="3"
          fill={isIonic ? "url(#thermIon)" : "url(#thermCov)"}
        />
        <circle cx="6" cy="158" r="8" fill="#ef4444" />
        <circle cx="4" cy="156" r="2" fill="#fecaca" opacity="0.8" />
        <defs>
          <linearGradient id="thermIon" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0" stopColor="#fb7185" />
            <stop offset="1" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="thermCov" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <rect x="-30" y="0" width="26" height="14" rx="3" fill="rgba(15,23,42,0.85)" />
        <text
          x="-17"
          y="10"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill="#fef3c7"
          fontFamily="ui-monospace, monospace"
        >
          {Math.round(temp)}°C
        </text>
      </g>

      {/* Retort stand upright */}
      <g>
        <rect x="24" y="90" width="4" height="140" fill="url(#metal)" />
        <rect x="14" y="228" width="24" height="6" rx="1" fill="#475569" />
      </g>

      {/* ── Apparatus: NaCl (crucible + clay triangle) or Sugar (beaker + gauze) ── */}
      {isIonic ? (
        <g>
          {/* Tripod legs (perspective) */}
          <line x1="70" y1="140" x2="55" y2="222" stroke="url(#metal)" strokeWidth="3.5" />
          <line x1="150" y1="140" x2="165" y2="222" stroke="url(#metal)" strokeWidth="3.5" />
          <line
            x1="110"
            y1="145"
            x2="110"
            y2="222"
            stroke="url(#metal)"
            strokeWidth="3.5"
            opacity="0.55"
          />
          {/* Tripod ring */}
          <ellipse
            cx="110"
            cy="140"
            rx="46"
            ry="8"
            fill="none"
            stroke="url(#metal)"
            strokeWidth="3"
          />
          {/* Clay triangle */}
          <polygon
            points="72,138 148,138 110,120"
            fill="url(#clay)"
            stroke="#431407"
            strokeWidth="0.6"
          />
          <polygon points="78,136 142,136 110,122" fill="#ea580c" opacity="0.55" />

          {/* Porcelain crucible */}
          <ellipse
            cx="110"
            cy="238"
            rx="42"
            ry="6"
            fill="#000"
            opacity="0.35"
            filter="url(#softShadow)"
          />
          <path
            d="M76 100 L144 100 L134 138 Q134 148 110 148 Q86 148 86 138 Z"
            fill="url(#crucible)"
            stroke="#475569"
            strokeWidth="1"
          />
          {/* Crucible rim highlight */}
          <ellipse cx="110" cy="100" rx="34" ry="5" fill="#0f172a" opacity="0.75" />
          <ellipse cx="110" cy="99" rx="34" ry="4" fill="none" stroke="#f8fafc" strokeWidth="0.6" />

          {/* NaCl 3D crystal cubes — multi-layer sparkle pile */}
          <g clipPath="url(#crucibleClip)">
            <defs>
              <clipPath id="crucibleClip">
                <path d="M78 100 L142 100 L132 138 Q132 146 110 146 Q88 146 88 138 Z" />
              </clipPath>
            </defs>
            {[
              // layer 1 (back)
              { x: 92, y: 118, s: 9 },
              { x: 104, y: 116, s: 10 },
              { x: 117, y: 118, s: 9 },
              { x: 127, y: 120, s: 8 },
              // layer 2
              { x: 88, y: 126, s: 10 },
              { x: 100, y: 124, s: 11 },
              { x: 113, y: 125, s: 10 },
              { x: 124, y: 128, s: 9 },
              // layer 3 (front)
              { x: 95, y: 134, s: 11 },
              { x: 108, y: 133, s: 12 },
              { x: 121, y: 135, s: 10 },
            ].map((c, i) => (
              <g key={i} transform={`translate(${c.x} ${c.y})`}>
                {/* cube: top / left / right faces */}
                <polygon
                  points={`0,0 ${c.s},-3 ${c.s * 2},0 ${c.s},3`}
                  fill="#f1f5f9"
                  stroke="#94a3b8"
                  strokeWidth="0.4"
                />
                <polygon
                  points={`0,0 ${c.s},3 ${c.s},${c.s + 3} 0,${c.s}`}
                  fill="url(#crystal)"
                  stroke="#64748b"
                  strokeWidth="0.4"
                />
                <polygon
                  points={`${c.s * 2},0 ${c.s},3 ${c.s},${c.s + 3} ${c.s * 2},${c.s}`}
                  fill="#cbd5e1"
                  stroke="#64748b"
                  strokeWidth="0.4"
                />
                {/* sparkle */}
                <circle cx={c.s * 0.5} cy={c.s * 0.35} r="0.7" fill="#fff">
                  <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur={`${1.4 + (i % 4) * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            ))}
          </g>
        </g>
      ) : (
        <g>
          {/* Tripod */}
          <line x1="70" y1="170" x2="55" y2="222" stroke="url(#metal)" strokeWidth="3.5" />
          <line x1="150" y1="170" x2="165" y2="222" stroke="url(#metal)" strokeWidth="3.5" />
          <line
            x1="110"
            y1="175"
            x2="110"
            y2="222"
            stroke="url(#metal)"
            strokeWidth="3.5"
            opacity="0.55"
          />
          <ellipse
            cx="110"
            cy="170"
            rx="46"
            ry="7"
            fill="none"
            stroke="url(#metal)"
            strokeWidth="3"
          />
          {/* Wire gauze */}
          <ellipse
            cx="110"
            cy="168"
            rx="42"
            ry="6"
            fill="#94a3b8"
            stroke="#334155"
            strokeWidth="0.7"
          />
          <g stroke="#334155" strokeWidth="0.4" opacity="0.6">
            {[-30, -20, -10, 0, 10, 20, 30].map((dx) => (
              <line key={`v${dx}`} x1={110 + dx} y1={163} x2={110 + dx} y2={173} />
            ))}
            {[-4, -2, 0, 2, 4].map((dy) => (
              <ellipse
                key={`h${dy}`}
                cx="110"
                cy={168 + dy}
                rx={42 - Math.abs(dy) * 2}
                ry="0.4"
                fill="none"
              />
            ))}
          </g>
          {/* Ceramic pad center */}
          <rect x="98" y="164" width="24" height="4" rx="1" fill="#fef3c7" opacity="0.7" />

          {/* Glass beaker */}
          <ellipse
            cx="110"
            cy="238"
            rx="42"
            ry="5"
            fill="#000"
            opacity="0.3"
            filter="url(#softShadow)"
          />
          <path
            d="M78 110 L142 110 L138 158 Q138 168 122 168 L98 168 Q82 168 82 158 Z"
            fill="url(#beakerG)"
            stroke="#475569"
            strokeWidth="1"
          />
          {/* Beaker highlights */}
          <path d="M85 116 L85 156" stroke="#fff" strokeWidth="1.2" opacity="0.7" />
          <path d="M132 118 L134 150" stroke="#fff" strokeWidth="0.8" opacity="0.4" />
          <ellipse
            cx="110"
            cy="110"
            rx="32"
            ry="3.5"
            fill="none"
            stroke="#475569"
            strokeWidth="0.8"
          />

          {/* Sample contents */}
          <g clipPath="url(#beakerClip)">
            <defs>
              <clipPath id="beakerClip">
                <path d="M80 112 L140 112 L136 156 Q136 166 122 166 L98 166 Q84 166 84 156 Z" />
              </clipPath>
            </defs>
            {sugarState === "solid" || sugarState === "melting" ? (
              <g>
                {/* Granular sugar (translucent) */}
                {[...Array(22)].map((_, i) => {
                  const x = 88 + (i % 8) * 6 + ((i / 8) | 0) * 2;
                  const y = 158 - ((i / 8) | 0) * 4;
                  const op = sugarState === "melting" ? 0.55 : 0.9;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="#fef9c3"
                      stroke="#fde68a"
                      strokeWidth="0.4"
                      opacity={op}
                    />
                  );
                })}
              </g>
            ) : sugarState === "molten" ? (
              <g>
                <path
                  d="M84 148 Q110 142 136 148 L136 166 L84 166 Z"
                  fill="url(#molten)"
                  opacity="0.95"
                />
                <ellipse cx="110" cy="148" rx="24" ry="2.5" fill="#fef9c3" opacity="0.7" />
              </g>
            ) : sugarState === "browning" ? (
              <g>
                <path d="M84 146 Q110 140 136 146 L136 166 L84 166 Z" fill="#92400e" />
                <ellipse cx="110" cy="146" rx="24" ry="2.5" fill="#b45309" opacity="0.8" />
                {[0, 1, 2, 3].map((i) => (
                  <circle key={i} cx={92 + i * 12} cy={152 + (i % 2) * 4} r="1.8" fill="#78350f">
                    <animate
                      attributeName="cy"
                      values={`${152};${148};${152}`}
                      dur="0.9s"
                      begin={`${i * 0.2}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </g>
            ) : (
              <g>
                {/* Charred black carbon */}
                <path d="M84 144 Q110 138 136 144 L136 166 L84 166 Z" fill="#0c0a09" />
                <path
                  d="M88 148 Q100 142 112 146 Q124 150 134 145"
                  stroke="#292524"
                  strokeWidth="1.5"
                  fill="none"
                />
                {[0, 1, 2, 3, 4].map((i) => (
                  <circle key={i} cx={90 + i * 11} cy={150} r={1.5 + (i % 2)} fill="#1c1917">
                    <animate
                      attributeName="cy"
                      values="150;146;150"
                      dur={`${0.7 + i * 0.1}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </g>
            )}
          </g>

          {/* Smoke rising from beaker */}
          {(sugarState === "browning" || sugarState === "charred") && (
            <g opacity="0.75">
              {[0, 1, 2, 3].map((i) => (
                <circle key={i} cx={95 + i * 11} cy="105" r={4 + (i % 2)} fill="#57534e">
                  <animate
                    attributeName="cy"
                    values="105;40"
                    dur="2.6s"
                    begin={`${i * 0.5}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.7;0"
                    dur="2.6s"
                    begin={`${i * 0.5}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="r"
                    values={`${3 + i};${8 + i}`}
                    dur="2.6s"
                    begin={`${i * 0.5}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          )}
        </g>
      )}

      {/* ── Bunsen burner ── */}
      <g transform="translate(110 200)">
        {/* Flame first (behind barrel) */}
        {heating && (
          <g>
            {/* Outer flame */}
            <path
              d={
                isIonic
                  ? "M0 22 Q-22 -6 -10 -40 Q-4 -14 0 -30 Q4 -14 10 -40 Q22 -6 0 22 Z"
                  : "M0 22 Q-16 4 -6 -18 Q0 -4 0 -12 Q0 -4 6 -18 Q16 4 0 22 Z"
              }
              fill={`url(#${gradId})`}
            >
              <animate
                attributeName="d"
                values={
                  isIonic
                    ? "M0 22 Q-22 -6 -10 -40 Q-4 -14 0 -30 Q4 -14 10 -40 Q22 -6 0 22 Z;M0 22 Q-24 -8 -10 -48 Q-4 -18 0 -34 Q4 -18 10 -48 Q24 -8 0 22 Z;M0 22 Q-22 -6 -10 -40 Q-4 -14 0 -30 Q4 -14 10 -40 Q22 -6 0 22 Z"
                    : "M0 22 Q-16 4 -6 -18 Q0 -4 0 -12 Q0 -4 6 -18 Q16 4 0 22 Z;M0 22 Q-18 2 -6 -24 Q0 -6 0 -16 Q0 -6 6 -24 Q18 2 0 22 Z;M0 22 Q-16 4 -6 -18 Q0 -4 0 -12 Q0 -4 6 -18 Q16 4 0 22 Z"
                }
                dur={isIonic ? "0.28s" : "0.4s"}
                repeatCount="indefinite"
              />
            </path>
            {/* Inner cone */}
            <path
              d={isIonic ? "M0 20 Q-4 4 0 -14 Q4 4 0 20 Z" : "M0 20 Q-3 8 0 -4 Q3 8 0 20 Z"}
              fill={isIonic ? "#1e1b4b" : "#f59e0b"}
              opacity="0.85"
            />
            {/* Roaring glow for NaCl */}
            {isIonic && (
              <circle cx="0" cy="-10" r="26" fill="#818cf8" opacity="0.25">
                <animate
                  attributeName="opacity"
                  values="0.15;0.4;0.15"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        )}
        {/* Barrel */}
        <rect
          x="-5"
          y="20"
          width="10"
          height="26"
          rx="1"
          fill="url(#metal)"
          stroke="#0f172a"
          strokeWidth="0.5"
        />
        <rect x="-6" y="18" width="12" height="4" rx="1" fill="#0f172a" />
        {/* Base */}
        <polygon points="-18,46 18,46 14,58 -14,58" fill="#334155" />
        <ellipse cx="0" cy="58" rx="16" ry="3" fill="#0f172a" opacity="0.55" />
        {/* Gas line */}
        <path d="M14 52 Q30 54 34 58" stroke="#334155" strokeWidth="1.5" fill="none" />
      </g>

      {/* ── Alert badges when phase reached ── */}
      {reachedSugar && (
        <foreignObject x="6" y="6" width="176" height="34">
          <div className="rounded-lg border border-amber-300/60 bg-gradient-to-r from-amber-500/95 to-orange-600/95 px-2 py-1 text-[9px] font-semibold leading-tight text-white shadow-lg backdrop-blur">
            ⚠ Sucrose melted &amp; decomposed — weak intermolecular forces.
          </div>
        </foreignObject>
      )}
      {reachedNaCl && (
        <foreignObject x="6" y="6" width="176" height="34">
          <div className="rounded-lg border border-indigo-300/60 bg-gradient-to-r from-indigo-600/95 to-violet-700/95 px-2 py-1 text-[9px] font-semibold leading-tight text-white shadow-lg backdrop-blur">
            🔒 NaCl solid at {Math.round(temp)}°C — ionic lattice needs &gt;801°C.
          </div>
        </foreignObject>
      )}

      {/* Bottom caption */}
      <foreignObject x="4" y="242" width="212" height="18">
        <div className="truncate rounded-md bg-background/85 px-2 py-0.5 text-center text-[9px] font-medium leading-tight text-foreground shadow-sm ring-1 ring-border/60">
          {isIonic
            ? "Porcelain crucible · roaring blue flame (>801°C required)"
            : "Glass beaker · gentle orange flame (~186°C melts sugar)"}
        </div>
      </foreignObject>
    </svg>
  );
}

/* ─── Conductivity scene ─── */

function ConductivityScene({
  dissolving,
  dissolved,
  switchOn,
  bulbOn,
  isIonic,
}: {
  dissolving: boolean;
  dissolved: boolean;
  switchOn: boolean;
  bulbOn: boolean;
  isIonic: boolean;
}) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full">
      {/* Battery */}
      <g transform="translate(10 10)">
        <rect width="40" height="18" rx="3" fill="#1e293b" />
        <rect x="4" y="4" width="32" height="10" fill="#f59e0b" />
        <text x="20" y="12" textAnchor="middle" fontSize="7" fontWeight="700" fill="#1e293b">
          9V
        </text>
      </g>

      {/* Bulb */}
      <g transform="translate(150 22)">
        <circle
          cx="0"
          cy="0"
          r="14"
          fill={bulbOn ? "url(#bulbGrad)" : "#e5e7eb"}
          stroke="#475569"
          strokeWidth="1"
        />
        {bulbOn && (
          <circle cx="0" cy="0" r="22" fill="#fde68a" opacity="0.55">
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        <rect x="-5" y="12" width="10" height="4" fill="#9ca3af" />
        <defs>
          <radialGradient id="bulbGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fef9c3" />
            <stop offset="0.6" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0.2" />
          </radialGradient>
        </defs>
      </g>

      {/* Wires */}
      <path
        d="M50 19 L100 19 L100 40"
        stroke={switchOn ? "#dc2626" : "#94a3b8"}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M150 36 L150 60 L110 60"
        stroke={switchOn ? "#1e293b" : "#94a3b8"}
        strokeWidth="2"
        fill="none"
      />

      {/* Beaker */}
      <g transform="translate(30 70)">
        <path
          d="M0 0 L140 0 L134 140 Q134 150 122 150 L18 150 Q6 150 6 140 Z"
          fill="url(#beakerGrad)"
          stroke="#64748b"
          strokeWidth="1.5"
        />
        <defs>
          <linearGradient id="beakerGrad" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="0.5" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.75)" />
          </linearGradient>
        </defs>
        {/* Water */}
        {(dissolving || dissolved) && (
          <path
            d="M8 45 L132 45 L134 140 Q134 150 122 150 L18 150 Q6 150 6 140 Z"
            fill="#93c5fd"
            opacity="0.55"
          />
        )}
        {/* Pouring animation */}
        {dissolving && (
          <rect x="66" y="-30" width="6" height="70" fill="#60a5fa" opacity="0.65">
            <animate attributeName="opacity" values="0;0.8;0" dur="0.6s" repeatCount="indefinite" />
          </rect>
        )}
        {/* Electrodes */}
        <rect x="30" y="30" width="4" height="100" fill="url(#eleGrad)" />
        <rect x="106" y="30" width="4" height="100" fill="url(#eleGrad)" />
        <defs>
          <linearGradient id="eleGrad" x1="0" x2="1">
            <stop offset="0" stopColor="#475569" />
            <stop offset="0.5" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Solid pile before dissolving */}
        {!dissolving && !dissolved && (
          <g>
            {[...Array(10)].map((_, i) => {
              const x = 40 + (i % 5) * 12 + (i > 4 ? 6 : 0);
              const y = 138 - (i > 4 ? 4 : 0);
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width="6"
                  height="6"
                  rx="1"
                  fill={isIonic ? "#ffffff" : "#fef3c7"}
                  stroke="#cbd5e1"
                  strokeWidth="0.5"
                />
              );
            })}
          </g>
        )}

        {/* Dissolved contents — ions vs molecules */}
        {dissolved && (
          <g>
            {isIonic ? (
              <g fontSize="8" fontWeight="700" textAnchor="middle">
                {[...Array(6)].map((_, i) => {
                  const x = 20 + ((i * 18) % 100);
                  const y = 70 + ((i * 27) % 60);
                  return (
                    <g key={`na-${i}`}>
                      <circle cx={x} cy={y} r="6" fill="#f43f5e" opacity="0.85" />
                      <text x={x} y={y + 3} fill="#fff">
                        Na⁺
                      </text>
                      {switchOn && (
                        <animate
                          attributeName="opacity"
                          values="0.6;1;0.6"
                          dur="0.9s"
                          repeatCount="indefinite"
                        />
                      )}
                    </g>
                  );
                })}
                {[...Array(6)].map((_, i) => {
                  const x = 30 + ((i * 21) % 90);
                  const y = 88 + ((i * 19) % 50);
                  return (
                    <g key={`cl-${i}`}>
                      <circle cx={x} cy={y} r="7" fill="#10b981" opacity="0.85" />
                      <text x={x} y={y + 3} fill="#fff">
                        Cl⁻
                      </text>
                    </g>
                  );
                })}
                {/* Motion when switch on */}
                {switchOn && (
                  <g stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.6">
                    <path d="M30 100 Q70 90 110 100">
                      <animate
                        attributeName="opacity"
                        values="0;0.9;0"
                        dur="0.7s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
                )}
              </g>
            ) : (
              <g>
                {[...Array(8)].map((_, i) => {
                  const x = 25 + ((i * 17) % 100);
                  const y = 70 + ((i * 23) % 70);
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r="7"
                        fill="#fde68a"
                        stroke="#d97706"
                        strokeWidth="0.8"
                      />
                      <text
                        x={x}
                        y={y + 2.5}
                        textAnchor="middle"
                        fontSize="4.5"
                        fontWeight="700"
                        fill="#78350f"
                      >
                        C₁₂H₂₂O₁₁
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        )}
      </g>

      {/* Label */}
      <foreignObject x="4" y="210" width="192" height="28">
        <div className="rounded-md bg-background/85 px-2 py-1 text-center text-[9.5px] font-medium leading-tight text-foreground shadow-sm ring-1 ring-border/60">
          {isIonic
            ? "Electrolyte: Dissociated ions carry electric current."
            : "Non-electrolyte: No free ions present to conduct electricity."}
        </div>
      </foreignObject>
    </svg>
  );
}
