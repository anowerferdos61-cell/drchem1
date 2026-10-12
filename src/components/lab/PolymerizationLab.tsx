/**
 * PolymerizationLab — Chapter 11 theory lab
 * Addition polymerisation of Ethene → Polyethene and Vinyl Chloride → PVC.
 * Students tune pressure / temperature / catalyst until conditions are
 * optimum, then trigger the reaction and watch monomers chain up.
 */
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Flame,
  Gauge,
  Zap,
  Sparkles,
  CheckCircle2,
  Circle,
  RotateCcw,
  ShoppingBag,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DraggableTheoryFab from "./DraggableTheoryFab";

interface Props {
  onBack: () => void;
}

type MonomerId = "ethene" | "vinyl_chloride";

interface MonomerMeta {
  id: MonomerId;
  nameBn: string;
  nameEn: string;
  monomerFormula: string;
  polymerFormula: string;
  polymerNameBn: string;
  polymerNameEn: string;
  productBn: string;
  productIcon: typeof ShoppingBag;
  productColor: string;
  // Optimum window
  pressureMin: number;
  pressureMax: number;
  tempMin: number;
  tempMax: number;
  catalystBn: string;
  colorAccent: string;
  hasChlorine: boolean;
}

const MONOMERS: Record<MonomerId, MonomerMeta> = {
  ethene: {
    id: "ethene",
    nameBn: "ইথিন",
    nameEn: "Ethene",
    monomerFormula: "CH₂=CH₂",
    polymerFormula: "[—CH₂—CH₂—]ₙ",
    polymerNameBn: "পলিথিন",
    polymerNameEn: "Polyethene",
    productBn: "প্লাস্টিক ব্যাগ",
    productIcon: ShoppingBag,
    productColor: "#38bdf8",
    pressureMin: 1000,
    pressureMax: 1200,
    tempMin: 180,
    tempMax: 220,
    catalystBn: "O₂ / পারঅক্সাইড",
    colorAccent: "from-sky-500 to-cyan-500",
    hasChlorine: false,
  },
  vinyl_chloride: {
    id: "vinyl_chloride",
    nameBn: "ভিনাইল ক্লোরাইড",
    nameEn: "Vinyl Chloride",
    monomerFormula: "CH₂=CHCl",
    polymerFormula: "[—CH₂—CHCl—]ₙ",
    polymerNameBn: "পিভিসি",
    polymerNameEn: "PVC",
    productBn: "পিভিসি পাইপ",
    productIcon: Wrench,
    productColor: "#a3a3a3",
    pressureMin: 800,
    pressureMax: 1100,
    tempMin: 40,
    tempMax: 70,
    catalystBn: "পারঅক্সাইড ইনিশিয়েটর",
    colorAccent: "from-emerald-500 to-teal-500",
    hasChlorine: true,
  },
};

type Phase = "idle" | "running" | "linking" | "done";

const MONOMER_COUNT = 8;

export default function PolymerizationLab({ onBack }: Props) {
  const [monomerId, setMonomerId] = useState<MonomerId>("ethene");
  const [pressure, setPressure] = useState(1);
  const [temperature, setTemperature] = useState(25);
  const [catalyst, setCatalyst] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showProduct, setShowProduct] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const meta = MONOMERS[monomerId];

  const pressureOk = pressure >= meta.pressureMin && pressure <= meta.pressureMax;
  const tempOk = temperature >= meta.tempMin && temperature <= meta.tempMax;
  const optimum = pressureOk && tempOk && catalyst;

  const statusMessage = useMemo(() => {
    if (phase === "linking") return "বন্ধন ভাঙছে এবং চেইন তৈরি হচ্ছে…";
    if (phase === "done") return `${meta.polymerNameBn} সফলভাবে তৈরি হয়েছে!`;
    if (phase === "running") return "মনোমারগুলো সক্রিয় হচ্ছে…";
    if (!pressureOk && !tempOk) return "চাপ ও তাপমাত্রা অপর্যাপ্ত — উচ্চতর মান দিন।";
    if (!pressureOk) return "চাপ বাড়ান (Optimum window এ আনুন)।";
    if (!tempOk) return "তাপমাত্রা সঠিক পরিসরে আনুন।";
    if (!catalyst) return "প্রভাবক যোগ করুন।";
    return "শর্ত ঠিক আছে — পলিমারকরণ শুরু করুন।";
  }, [phase, pressureOk, tempOk, catalyst, meta.polymerNameBn]);

  const steps = [
    { id: "monomer", label: "মনোমার নির্বাচন করুন", done: true },
    {
      id: "conditions",
      label: "সঠিক উচ্চ চাপ ও তাপমাত্রা সেট করুন",
      done: pressureOk && tempOk,
    },
    {
      id: "catalyst",
      label: "প্রভাবক যোগ করে বিক্রিয়া ট্রিগার করুন",
      done: catalyst && phase !== "idle",
    },
    {
      id: "chain",
      label: "চেইন গঠন এবং বাস্তব ব্যবহার দেখুন",
      done: phase === "done",
    },
  ];

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => () => clearTimeouts(), []);

  const start = () => {
    if (!optimum || phase !== "idle") return;
    setPhase("running");
    setShowProduct(false);
    const t1 = window.setTimeout(() => setPhase("linking"), 900);
    const t2 = window.setTimeout(() => {
      setPhase("done");
      setShowProduct(true);
    }, 3600);
    timeoutsRef.current.push(t1, t2);
  };

  const reset = () => {
    clearTimeouts();
    setPhase("idle");
    setShowProduct(false);
  };

  const switchMonomer = (id: MonomerId) => {
    if (id === monomerId) return;
    reset();
    setMonomerId(id);
    setPressure(1);
    setTemperature(25);
    setCatalyst(false);
  };

  const ProductIcon = meta.productIcon;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-200 hover:bg-white/10"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> ফিরুন
            </Button>
            <div>
              <h1 className="text-lg font-bold md:text-2xl">
                পলিমারকরণ ল্যাব · Polymerization Lab
              </h1>
              <p className="text-xs text-slate-400">
                যুত পলিমারকরণ (Addition Polymerization) — অধ্যায় ১১
              </p>
            </div>
          </div>
          <Badge className={cn("bg-gradient-to-r text-white", meta.colorAccent)}>
            {meta.nameBn} → {meta.polymerNameBn}
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Panel 1: Reaction Chamber */}
          <Card className="relative overflow-hidden border-white/10 bg-slate-900/60 p-4 lg:col-span-8">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-wider">
                বিক্রিয়া প্রকোষ্ঠ · Reaction Chamber
              </span>
              <span className={cn("font-mono", optimum ? "text-emerald-400" : "text-amber-400")}>
                {optimum ? "OPTIMUM" : "SUB-OPTIMAL"}
              </span>
            </div>

            <div
              className={cn(
                "relative h-[360px] w-full overflow-hidden rounded-xl border transition-all",
                phase === "running" || phase === "linking"
                  ? "border-orange-400/60 shadow-[0_0_60px_-10px_rgba(251,146,60,0.5)]"
                  : "border-white/10",
              )}
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(59,130,246,0.12), rgba(15,23,42,0.9))",
              }}
            >
              {/* Chamber glow */}
              <AnimatePresence>
                {(phase === "running" || phase === "linking") && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 bg-orange-500/10"
                  />
                )}
              </AnimatePresence>

              {/* Idle / running: floating monomers */}
              {phase !== "done" && (
                <div className="absolute inset-0">
                  {Array.from({ length: MONOMER_COUNT }).map((_, i) => (
                    <Monomer
                      key={`m-${i}`}
                      index={i}
                      hasChlorine={meta.hasChlorine}
                      linking={phase === "linking"}
                    />
                  ))}
                </div>
              )}

              {/* Chain formation */}
              <AnimatePresence>
                {phase === "done" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <PolymerChain hasChlorine={meta.hasChlorine} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chamber label */}
              <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 font-mono text-[10px] text-slate-300 backdrop-blur">
                P: {pressure} atm · T: {temperature}°C
              </div>
            </div>

            {/* Status */}
            <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm">
              <span className="text-slate-400">Status: </span>
              <span
                className={cn(
                  phase === "done"
                    ? "text-emerald-300"
                    : phase !== "idle"
                      ? "text-orange-300"
                      : optimum
                        ? "text-sky-300"
                        : "text-amber-300",
                )}
              >
                {statusMessage}
              </span>
            </div>

            {/* Equation */}
            <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-center font-mono text-sm md:text-base">
              <span className="text-slate-300">n</span> ({meta.monomerFormula}){" "}
              <span className="mx-2 text-orange-300">
                →
                <span className="ml-1 text-[10px] text-slate-400">তাপ, চাপ, {meta.catalystBn}</span>
              </span>{" "}
              <span className="text-emerald-300">{meta.polymerFormula}</span>
            </div>
          </Card>

          {/* Panel 2: Config */}
          <div className="space-y-4 lg:col-span-4">
            <Card className="border-white/10 bg-slate-900/60 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
                কনফিগারেশন
              </div>

              {/* Monomer selector */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(Object.keys(MONOMERS) as MonomerId[]).map((id) => {
                  const m = MONOMERS[id];
                  const active = monomerId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => switchMonomer(id)}
                      className={cn(
                        "rounded-lg border p-2 text-left text-xs transition-all",
                        active
                          ? "border-primary bg-primary/20 text-white"
                          : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/30",
                      )}
                    >
                      <div className="font-semibold">{m.nameBn}</div>
                      <div className="text-[10px] opacity-70">→ {m.polymerNameBn}</div>
                    </button>
                  );
                })}
              </div>

              {/* Pressure */}
              <ConfigSlider
                icon={Gauge}
                label="চাপ (Pressure)"
                value={pressure}
                min={1}
                max={1500}
                step={10}
                unit="atm"
                targetMin={meta.pressureMin}
                targetMax={meta.pressureMax}
                ok={pressureOk}
                onChange={setPressure}
                disabled={phase !== "idle"}
              />

              {/* Temperature */}
              <ConfigSlider
                icon={Flame}
                label="তাপমাত্রা (Temperature)"
                value={temperature}
                min={25}
                max={300}
                step={5}
                unit="°C"
                targetMin={meta.tempMin}
                targetMax={meta.tempMax}
                ok={tempOk}
                onChange={setTemperature}
                disabled={phase !== "idle"}
              />

              {/* Catalyst */}
              <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className={cn("h-4 w-4", catalyst ? "text-amber-300" : "text-slate-500")} />
                  <div>
                    <div className="font-medium">প্রভাবক</div>
                    <div className="text-[10px] text-slate-400">{meta.catalystBn}</div>
                  </div>
                </div>
                <Switch
                  checked={catalyst}
                  onCheckedChange={(v) => phase === "idle" && setCatalyst(v)}
                  disabled={phase !== "idle"}
                />
              </div>

              {/* Trigger */}
              <Button
                onClick={start}
                disabled={!optimum || phase !== "idle"}
                className={cn(
                  "mt-4 w-full font-semibold",
                  optimum && phase === "idle"
                    ? "bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-90"
                    : "",
                )}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                পলিমারকরণ শুরু করুন
              </Button>

              {phase !== "idle" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="mt-2 w-full border-white/20 bg-transparent text-slate-200 hover:bg-white/10"
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" /> রিসেট
                </Button>
              )}
            </Card>

            {/* Panel 4: Steps */}
            <Card className="border-white/10 bg-slate-900/60 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                Lab Milestones
              </div>
              <ul className="space-y-1.5 text-sm">
                {steps.map((s, i) => (
                  <li key={s.id} className="flex items-start gap-2">
                    {s.done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    )}
                    <span className={s.done ? "text-slate-300 line-through" : "text-slate-200"}>
                      {i + 1}. {s.label}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Panel 3: Microscopic explanation */}
        <Card className="border-white/10 bg-slate-900/60 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            মাইক্রোস্কোপিক ব্যাখ্যা · π-Bond Breaking
          </div>
          <p className="text-sm text-slate-300">
            উচ্চ চাপ, তাপ এবং প্রভাবক (যেমন O₂ / পারঅক্সাইড) মনোমারের{" "}
            <span className="text-amber-300">π-বন্ড</span> ভেঙে দুইপাশে দুটি "free hand" (free
            valency) তৈরি করে। একের পর এক মনোমার এই মুক্ত হাতে যুক্ত হয়ে দীর্ঘ পলিমার চেইন{" "}
            <span className="font-mono text-emerald-300">{meta.polymerFormula}</span> গঠন করে।
            কার্বন = গাঢ় ধূসর, হাইড্রোজেন = হালকা, ক্লোরিন = সবুজ।
          </p>
        </Card>
      </div>

      {/* Real-life product overlay */}
      <AnimatePresence>
        {showProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
            onClick={() => setShowProduct(false)}
          >
            <motion.div
              initial={{ scale: 0.6, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center text-slate-100 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Confetti burst */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {Array.from({ length: 18 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: "50%", y: "50%", opacity: 1, scale: 0 }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 180}%`,
                      y: `${50 + (Math.random() - 0.5) * 180}%`,
                      opacity: 0,
                      scale: 1,
                    }}
                    transition={{ duration: 1.2, delay: i * 0.03 }}
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                      background: ["#f97316", "#22d3ee", "#a3e635", "#f472b6"][i % 4],
                    }}
                  />
                ))}
              </div>
              <div
                className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full"
                style={{ background: `${meta.productColor}22` }}
              >
                <ProductIcon className="h-12 w-12" style={{ color: meta.productColor }} />
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-400">
                Real-life Application
              </div>
              <h2 className="mt-1 text-2xl font-extrabold">{meta.productBn}</h2>
              <p className="mt-2 text-sm text-slate-300">
                {meta.polymerNameBn} ({meta.polymerNameEn}) দিয়ে প্রতিদিন ব্যবহৃত {meta.productBn}{" "}
                তৈরি হয়।
              </p>
              <Button onClick={() => setShowProduct(false)} className="mt-4 w-full">
                দারুণ! Continue
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable theory FAB */}
      <DraggableTheoryFab storageKey="polymerization" label="থিওরি ও বিস্তারিত">
        <h3>যুত পলিমারকরণ (Addition Polymerization)</h3>
        <p>
          অসম্পৃক্ত মনোমারের π-বন্ধন ভেঙে একই ধরনের অসংখ্য মনোমার একে অপরের সাথে যুক্ত হয়ে দীর্ঘ
          শৃঙ্খল বা <em>পলিমার</em> গঠন করে — এই প্রক্রিয়াকে যুত পলিমারকরণ বলা হয়। কোনো উপজাত
          (by-product) তৈরি হয় না।
        </p>

        <h4>মনোমার ↔ পলিমার</h4>
        <table>
          <thead>
            <tr>
              <th>মনোমার (Monomer)</th>
              <th>পলিমার (Polymer)</th>
              <th>শর্ত</th>
              <th>ব্যবহার</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ইথিন (CH₂=CH₂)</td>
              <td>পলিথিন [—CH₂—CH₂—]ₙ</td>
              <td>≈ 1000–1200 atm, ≈ 200°C, O₂</td>
              <td>প্লাস্টিক ব্যাগ, বোতল, ফিল্ম</td>
            </tr>
            <tr>
              <td>ভিনাইল ক্লোরাইড (CH₂=CHCl)</td>
              <td>পিভিসি [—CH₂—CHCl—]ₙ</td>
              <td>মাঝারি চাপ, পারঅক্সাইড</td>
              <td>পিভিসি পাইপ, ইনসুলেশন, ফ্লোরিং</td>
            </tr>
            <tr>
              <td>প্রোপিন (CH₂=CH—CH₃)</td>
              <td>পলিপ্রোপিন</td>
              <td>Ziegler-Natta catalyst</td>
              <td>প্যাকেজিং, দড়ি, কার্পেট</td>
            </tr>
            <tr>
              <td>টেট্রাফ্লুরোইথিন (CF₂=CF₂)</td>
              <td>টেফলন (PTFE)</td>
              <td>উচ্চ চাপ, পারঅক্সাইড</td>
              <td>Non-stick রান্নার পাত্র</td>
            </tr>
          </tbody>
        </table>

        <h4>সাধারণ সমীকরণ</h4>
        <p style={{ fontFamily: "monospace" }}>n CH₂=CH₂ →[তাপ, চাপ, O₂] [—CH₂—CH₂—]ₙ</p>

        <h4>মূল ধারণা</h4>
        <ul>
          <li>
            শুধুমাত্র <strong>অসম্পৃক্ত</strong> যৌগ (π-বন্ধনযুক্ত) যুত পলিমারকরণে অংশ নেয়।
          </li>
          <li>উচ্চ চাপ ও তাপমাত্রা মনোমারকে সক্রিয় করে; প্রভাবক শৃঙ্খল শুরু করে।</li>
          <li>কোনো উপজাত তৈরি হয় না — তাই মনোমার + পলিমারের আণবিক ভর সমান।</li>
          <li>দৈনন্দিন প্লাস্টিক দ্রব্য মূলত এভাবে তৈরি হওয়া দীর্ঘ পলিমার শৃঙ্খল।</li>
        </ul>
      </DraggableTheoryFab>
    </div>
  );
}

/* ────────── Sub-components ────────── */

function ConfigSlider({
  icon: Icon,
  label,
  value,
  min,
  max,
  step,
  unit,
  targetMin,
  targetMax,
  ok,
  onChange,
  disabled,
}: {
  icon: typeof Gauge;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  targetMin: number;
  targetMax: number;
  ok: boolean;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
        <span className={cn("font-mono", ok ? "text-emerald-300" : "text-amber-300")}>
          {value} {unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? min)}
        disabled={disabled}
      />
      <div className="mt-1 text-[10px] text-slate-500">
        Target: {targetMin}–{targetMax} {unit}
      </div>
    </div>
  );
}

/** A single floating (or linking) monomer molecule. */
function Monomer({
  index,
  hasChlorine,
  linking,
}: {
  index: number;
  hasChlorine: boolean;
  linking: boolean;
}) {
  // Random-but-stable float positions per index
  const seed = (index * 97) % 100;
  const x = 10 + ((seed * 7) % 80);
  const y = 10 + ((seed * 13) % 70);

  if (linking) {
    // Snap to a horizontal line
    const targetX = 8 + index * 10;
    return (
      <motion.div
        initial={{ left: `${x}%`, top: `${y}%` }}
        animate={{ left: `${targetX}%`, top: "50%" }}
        transition={{ type: "spring", stiffness: 100, damping: 14, delay: index * 0.1 }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <MonomerSvg hasChlorine={hasChlorine} bonded />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        left: [`${x}%`, `${(x + 6) % 90}%`, `${x}%`],
        top: [`${y}%`, `${(y + 8) % 80}%`, `${y}%`],
      }}
      transition={{ duration: 4 + (seed % 3), repeat: Infinity, ease: "easeInOut" }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
    >
      <MonomerSvg hasChlorine={hasChlorine} bonded={false} />
    </motion.div>
  );
}

function MonomerSvg({ hasChlorine, bonded }: { hasChlorine: boolean; bonded: boolean }) {
  // Two carbons with hydrogens; if bonded=true show single bond, else double bond.
  return (
    <svg width="70" height="34" viewBox="0 0 70 34">
      {/* Bond(s) between C-C */}
      {bonded ? (
        <line x1="24" y1="17" x2="46" y2="17" stroke="#e2e8f0" strokeWidth="2" />
      ) : (
        <>
          <line x1="24" y1="14" x2="46" y2="14" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="24" y1="20" x2="46" y2="20" stroke="#e2e8f0" strokeWidth="2" />
        </>
      )}
      {/* Free-hand bonds when bonded (chain extension) */}
      {bonded && (
        <>
          <line x1="6" y1="17" x2="18" y2="17" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="52" y1="17" x2="64" y2="17" stroke="#e2e8f0" strokeWidth="2" />
        </>
      )}
      {/* H atoms on left C */}
      <line x1="18" y1="17" x2="12" y2="6" stroke="#94a3b8" strokeWidth="1.2" />
      <line x1="18" y1="17" x2="12" y2="28" stroke="#94a3b8" strokeWidth="1.2" />
      <circle cx="12" cy="6" r="3" fill="#f1f5f9" />
      <circle cx="12" cy="28" r="3" fill="#f1f5f9" />
      {/* Left C */}
      <circle cx="18" cy="17" r="6" fill="#334155" stroke="#0f172a" strokeWidth="1" />
      {/* Right C */}
      <circle cx="52" cy="17" r="6" fill="#334155" stroke="#0f172a" strokeWidth="1" />
      {/* H or Cl on right C */}
      <line x1="52" y1="17" x2="58" y2="6" stroke="#94a3b8" strokeWidth="1.2" />
      <line x1="52" y1="17" x2="58" y2="28" stroke="#94a3b8" strokeWidth="1.2" />
      <circle cx="58" cy="6" r="3" fill={hasChlorine ? "#22c55e" : "#f1f5f9"} />
      <circle cx="58" cy="28" r="3" fill="#f1f5f9" />
    </svg>
  );
}

/** Final polymer chain that scrolls horizontally. */
function PolymerChain({ hasChlorine }: { hasChlorine: boolean }) {
  const units = Array.from({ length: 8 });
  return (
    <motion.div
      initial={{ x: 40 }}
      animate={{ x: -40 }}
      transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      className="flex items-center"
    >
      <span className="mr-2 text-2xl font-mono text-emerald-300">[</span>
      {units.map((_, i) => (
        <MonomerSvg key={i} hasChlorine={hasChlorine} bonded />
      ))}
      <span className="ml-2 text-2xl font-mono text-emerald-300">]ₙ</span>
    </motion.div>
  );
}
