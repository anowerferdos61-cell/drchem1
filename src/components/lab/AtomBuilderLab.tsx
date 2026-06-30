/**
 * Build an Atom — Dual Atom Comparison Sandbox
 * পরমাণু গঠন, আইসোটোপ, আইসোবার, আইসোটোন ও আইসোমার নির্ণায়ক
 *
 * Chapter 3 (পদার্থের গঠন)
 */
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Minus,
  RotateCcw,
  Atom as AtomIcon,
  Info,
  Sparkles,
  Zap,
  GitCompare,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  onBack: () => void;
}

const ELEMENTS: { z: number; symbol: string; nameBn: string; nameEn: string }[] = [
  { z: 1, symbol: "H", nameBn: "হাইড্রোজেন", nameEn: "Hydrogen" },
  { z: 2, symbol: "He", nameBn: "হিলিয়াম", nameEn: "Helium" },
  { z: 3, symbol: "Li", nameBn: "লিথিয়াম", nameEn: "Lithium" },
  { z: 4, symbol: "Be", nameBn: "বেরিলিয়াম", nameEn: "Beryllium" },
  { z: 5, symbol: "B", nameBn: "বোরন", nameEn: "Boron" },
  { z: 6, symbol: "C", nameBn: "কার্বন", nameEn: "Carbon" },
  { z: 7, symbol: "N", nameBn: "নাইট্রোজেন", nameEn: "Nitrogen" },
  { z: 8, symbol: "O", nameBn: "অক্সিজেন", nameEn: "Oxygen" },
  { z: 9, symbol: "F", nameBn: "ফ্লোরিন", nameEn: "Fluorine" },
  { z: 10, symbol: "Ne", nameBn: "নিয়ন", nameEn: "Neon" },
  { z: 11, symbol: "Na", nameBn: "সোডিয়াম", nameEn: "Sodium" },
  { z: 12, symbol: "Mg", nameBn: "ম্যাগনেসিয়াম", nameEn: "Magnesium" },
  { z: 13, symbol: "Al", nameBn: "অ্যালুমিনিয়াম", nameEn: "Aluminium" },
  { z: 14, symbol: "Si", nameBn: "সিলিকন", nameEn: "Silicon" },
  { z: 15, symbol: "P", nameBn: "ফসফরাস", nameEn: "Phosphorus" },
  { z: 16, symbol: "S", nameBn: "সালফার", nameEn: "Sulfur" },
  { z: 17, symbol: "Cl", nameBn: "ক্লোরিন", nameEn: "Chlorine" },
  { z: 18, symbol: "Ar", nameBn: "আর্গন", nameEn: "Argon" },
  { z: 19, symbol: "K", nameBn: "পটাশিয়াম", nameEn: "Potassium" },
  { z: 20, symbol: "Ca", nameBn: "ক্যালসিয়াম", nameEn: "Calcium" },
];

const SHELL_CAP = [2, 8, 18, 32];
const SHELL_NAMES = ["K", "L", "M", "N"];

type AtomState = { p: number; n: number; e: number; excited: boolean };
type AtomKey = "A" | "B";

type PairPreset = {
  label: string;
  hint: string;
  A: AtomState;
  B: AtomState;
};

const PAIR_PRESETS: PairPreset[] = [
  {
    label: "আইসোটোপ ডেমো · C-12 vs C-14",
    hint: "Z সমান, ভর সংখ্যা ভিন্ন",
    A: { p: 6, n: 6, e: 6, excited: false },
    B: { p: 6, n: 8, e: 6, excited: false },
  },
  {
    label: "আইসোবার ডেমো · C-14 vs N-14",
    hint: "ভর সংখ্যা সমান, Z ভিন্ন",
    A: { p: 6, n: 8, e: 6, excited: false },
    B: { p: 7, n: 7, e: 7, excited: false },
  },
  {
    label: "আইসোটোন ডেমো · Si-30 vs P-31",
    hint: "নিউট্রন সমান, Z ভিন্ন",
    A: { p: 14, n: 16, e: 14, excited: false },
    B: { p: 15, n: 16, e: 15, excited: false },
  },
  {
    label: "আইসোমার ডেমো · Tc-99 vs Tc-99m",
    hint: "p, n, e সমান — শক্তিস্তর ভিন্ন",
    A: { p: 6, n: 6, e: 6, excited: false },
    B: { p: 6, n: 6, e: 6, excited: true },
  },
];

const EMPTY: AtomState = { p: 0, n: 0, e: 0, excited: false };

function distributeElectrons(total: number): number[] {
  const shells: number[] = [];
  let remaining = total;
  for (let i = 0; i < SHELL_CAP.length && remaining > 0; i++) {
    const put = Math.min(SHELL_CAP[i], remaining);
    shells.push(put);
    remaining -= put;
  }
  return shells;
}

function relationLabel(a: AtomState, b: AtomState) {
  const aMass = a.p + a.n;
  const bMass = b.p + b.n;
  const empty = a.p + a.n + a.e === 0 || b.p + b.n + b.e === 0;
  if (empty) {
    return {
      key: "empty",
      title: "তুলনা শুরু করুন",
      desc: "Atom A ও Atom B-এ কণা যোগ করুন অথবা Pair Preset চাপুন — সম্পর্ক স্বয়ংক্রিয়ভাবে ধরা পড়বে।",
      cls: "bg-slate-500/15 text-slate-300 border-slate-400/30",
    };
  }
  if (a.p === b.p && a.n === b.n && (a.excited !== b.excited)) {
    return {
      key: "isomer",
      title: "আইসোমার (Isomer)!",
      desc: "পরমাণু দুটির প্রোটন ও নিউট্রন সংখ্যা হুবহু এক, কিন্তু তাদের নিউক্লিয়ার শক্তির স্তর ভিন্ন (যেমন: Technetium-99 এবং Technetium-99m)।",
      cls: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/40",
    };
  }
  if (a.p === b.p && aMass !== bMass) {
    return {
      key: "isotope",
      title: "আইসোটোপ (Isotope)!",
      desc: "উভয় পরমাণুর প্রোটন সংখ্যা সমান (Z_A = Z_B) কিন্তু ভর সংখ্যা ভিন্ন। তাই এরা একে অপরের আইসোটোপ।",
      cls: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40",
    };
  }
  if (aMass === bMass && a.p !== b.p) {
    return {
      key: "isobar",
      title: "আইসোবার (Isobar)!",
      desc: "উভয় পরমাণুর ভর সংখ্যা সমান (A_A = A_B) কিন্তু প্রোটন সংখ্যা ভিন্ন। তাই এরা একে অপরের আইসোবার (যেমন: Carbon-14 এবং Nitrogen-14)।",
      cls: "bg-sky-500/15 text-sky-200 border-sky-400/40",
    };
  }
  if (a.n === b.n && a.p !== b.p) {
    return {
      key: "isotone",
      title: "আইসোটোন (Isotone)!",
      desc: "উভয় পরমাণুর নিউট্রন সংখ্যা সমান (N_A = N_B) কিন্তু প্রোটন সংখ্যা ভিন্ন। তাই এরা একে অপরের আইসোটোন (যেমন: Silicon-30 এবং Phosphorus-31)।",
      cls: "bg-amber-500/15 text-amber-200 border-amber-400/40",
    };
  }
  if (a.p === b.p && a.n === b.n && a.e === b.e && !a.excited && !b.excited) {
    return {
      key: "identical",
      title: "একই পরমাণু",
      desc: "Atom A ও Atom B-এর কণা সম্পূর্ণ অভিন্ন। সম্পর্ক বুঝতে একটি কণা পরিবর্তন করুন অথবা একটিকে Excited State-এ দিন।",
      cls: "bg-slate-500/15 text-slate-200 border-slate-400/30",
    };
  }
  return {
    key: "none",
    title: "কোনো বিশেষ সম্পর্ক নেই",
    desc: "Atom A ও Atom B-এর মধ্যে আইসোটোপ / আইসোবার / আইসোটোন / আইসোমার কোনোটিই প্রযোজ্য নয়।",
    cls: "bg-slate-500/15 text-slate-300 border-slate-400/30",
  };
}

function Counter({
  label,
  count,
  color,
  onInc,
  onDec,
  max,
}: {
  label: string;
  count: number;
  color: string;
  onInc: () => void;
  onDec: () => void;
  max?: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-800/60 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white/20"
            style={{ background: color }}
          />
          <span className="text-[11px] font-semibold text-slate-100">{label}</span>
        </div>
        <span className="rounded bg-slate-900/70 px-1.5 py-0.5 font-mono text-xs text-white">
          {count}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 flex-1 px-2"
          onClick={onDec}
          disabled={count <= 0}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          className="h-7 flex-1 px-2"
          style={{ background: color, color: "#0b1220" }}
          onClick={onInc}
          disabled={max !== undefined && count >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AtomVisualizer({
  atom,
  focused,
  onFocus,
  label,
  accent,
}: {
  atom: AtomState;
  focused: boolean;
  onFocus: () => void;
  label: string;
  accent: string;
}) {
  const shells = useMemo(() => distributeElectrons(atom.e), [atom.e]);
  const total = atom.p + atom.n;
  const nucleusParticles = useMemo(() => {
    const list: { color: string; x: number; y: number }[] = [];
    const radius = Math.min(22, 5 + Math.sqrt(total) * 3.2);
    for (let i = 0; i < total; i++) {
      const angle = (i / Math.max(1, total)) * Math.PI * 2 + (i % 2) * 0.5;
      const r = radius * (0.3 + (0.7 * ((i * 37) % 100)) / 100);
      list.push({
        color: i < atom.p ? "#ef4444" : "#3b82f6",
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    return list;
  }, [total, atom.p]);

  return (
    <button
      onClick={onFocus}
      className={`group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 bg-slate-950/60 p-2 transition ${
        focused ? `${accent} shadow-[0_0_24px_rgba(99,102,241,0.25)]` : "border-white/10 hover:border-white/25"
      }`}
    >
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5">
        <Badge
          className={`border text-[10px] ${
            focused ? "bg-violet-500/20 text-violet-100 border-violet-400/50" : "bg-slate-800/70 text-slate-300 border-white/10"
          }`}
        >
          {label}
        </Badge>
        {atom.excited && (
          <Badge className="border border-fuchsia-400/50 bg-fuchsia-500/20 text-[10px] text-fuchsia-100">
            <Flame className="mr-0.5 h-2.5 w-2.5" /> Excited
          </Badge>
        )}
      </div>

      <div className="relative aspect-square w-full max-w-[320px]">
        {atom.e === 0 && total === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-500">
            কণা যোগ করুন
          </div>
        )}
        {[0, 1, 2, 3].map((i) => {
          const sizePct = 28 + i * 20;
          const hasElectrons = (shells[i] ?? 0) > 0;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{
                width: `${sizePct}%`,
                height: `${sizePct}%`,
                borderColor: hasElectrons ? "rgba(250,204,21,0.45)" : "rgba(148,163,184,0.18)",
                borderStyle: hasElectrons ? "solid" : "dashed",
              }}
            >
              {hasElectrons && (
                <div
                  className="absolute inset-0"
                  style={{ animation: `spin-${label.toLowerCase()}-${i} ${7 + i * 3}s linear infinite` }}
                >
                  {Array.from({ length: shells[i] }).map((_, k) => {
                    const angle = (k / shells[i]) * 360;
                    return (
                      <div
                        key={k}
                        className="absolute left-1/2 top-1/2"
                        style={{ transform: `rotate(${angle}deg) translate(50%) rotate(-${angle}deg)` }}
                      >
                        <div className="-ml-1.5 -mt-1.5 h-3 w-3 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.9)] ring-2 ring-yellow-200/60" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Nucleus */}
        <div
          className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/35 via-fuchsia-500/20 to-blue-500/30 ring-2 ring-white/15 ${
            atom.excited ? "shadow-[0_0_44px_rgba(217,70,239,0.55)] animate-pulse" : "shadow-[0_0_36px_rgba(244,63,94,0.4)]"
          }`}
        >
          <div className="relative h-full w-full">
            {nucleusParticles.slice(0, 50).map((p, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full ring-1 ring-white/40"
                style={{
                  background: p.color,
                  transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200 ring-1 ring-white/10">
        নিউক্লিয়াস: {atom.p}p + {atom.n}n
      </div>
    </button>
  );
}

function AtomControls({
  atom,
  setAtom,
  color,
}: {
  atom: AtomState;
  setAtom: (a: AtomState) => void;
  color: string;
}) {
  return (
    <Card className={`border bg-slate-900/70 p-2 backdrop-blur ${color}`}>
      <div className="space-y-2">
        <Counter
          label="Proton (+)"
          count={atom.p}
          color="#ef4444"
          onInc={() => setAtom({ ...atom, p: Math.min(20, atom.p + 1) })}
          onDec={() => setAtom({ ...atom, p: Math.max(0, atom.p - 1) })}
          max={20}
        />
        <Counter
          label="Neutron (0)"
          count={atom.n}
          color="#3b82f6"
          onInc={() => setAtom({ ...atom, n: Math.min(30, atom.n + 1) })}
          onDec={() => setAtom({ ...atom, n: Math.max(0, atom.n - 1) })}
          max={30}
        />
        <Counter
          label="Electron (−)"
          count={atom.e}
          color="#facc15"
          onInc={() => setAtom({ ...atom, e: Math.min(28, atom.e + 1) })}
          onDec={() => setAtom({ ...atom, e: Math.max(0, atom.e - 1) })}
          max={28}
        />
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-slate-800/60 px-2 py-1.5 text-[11px] text-slate-200">
          <span className="flex items-center gap-1.5">
            <Flame className="h-3 w-3 text-fuchsia-300" /> Excited State
          </span>
          <input
            type="checkbox"
            checked={atom.excited}
            onChange={(e) => setAtom({ ...atom, excited: e.target.checked })}
            className="h-3.5 w-3.5 accent-fuchsia-400"
          />
        </label>
      </div>
    </Card>
  );
}

export default function AtomBuilderLab({ onBack }: Props) {
  const [atomA, setAtomA] = useState<AtomState>({ p: 6, n: 6, e: 6, excited: false });
  const [atomB, setAtomB] = useState<AtomState>({ p: 6, n: 8, e: 6, excited: false });
  const [focus, setFocus] = useState<AtomKey>("A");

  const focused = focus === "A" ? atomA : atomB;
  const element = useMemo(
    () => ELEMENTS.find((e) => e.z === focused.p) ?? null,
    [focused.p],
  );
  const mass = focused.p + focused.n;
  const charge = focused.p - focused.e;
  const shells = useMemo(() => distributeElectrons(focused.e), [focused.e]);

  const chargeBadge = useMemo(() => {
    if (charge === 0)
      return { label: "নিরপেক্ষ পরমাণু (Neutral)", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" };
    if (charge > 0)
      return {
        label: `ধনাত্মক আয়ন (Cation) ${charge > 1 ? charge + "+" : "+"}`,
        cls: "bg-rose-500/20 text-rose-300 border-rose-400/40",
      };
    return {
      label: `ঋণাত্মক আয়ন (Anion) ${Math.abs(charge) > 1 ? Math.abs(charge) + "-" : "-"}`,
      cls: "bg-sky-500/20 text-sky-300 border-sky-400/40",
    };
  }, [charge]);

  const relation = relationLabel(atomA, atomB);

  const reset = () => {
    setAtomA(EMPTY);
    setAtomB(EMPTY);
  };

  const applyPair = (preset: PairPreset) => {
    setAtomA(preset.A);
    setAtomB(preset.B);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0f172a,_#020617)] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] p-3 md:p-5">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-200 hover:bg-white/10">
              <ArrowLeft className="mr-1 h-4 w-4" /> ফিরে যাই
            </Button>
            <div>
              <h1 className="text-lg font-bold md:text-2xl">
                <AtomIcon className="mr-2 inline h-5 w-5 text-violet-400" />
                পরমাণু গঠন ও দ্বৈত-পরমাণু তুলনা স্যান্ডবক্স
              </h1>
              <p className="text-xs text-slate-400 md:text-sm">
                Dual Atom Comparison · Isotope · Isobar · Isotone · Isomer · Chapter 3
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={reset} className="border-white/20 text-slate-200 hover:bg-white/10">
            <RotateCcw className="mr-1 h-4 w-4" /> Reset Lab
          </Button>
        </div>

        {/* Pair presets */}
        <Card className="mb-4 border-violet-400/30 bg-violet-500/10 p-3 backdrop-blur">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-violet-200">
            <Sparkles className="h-4 w-4" /> জোড়া প্রিসেট (এক ক্লিকে সম্পর্ক দেখুন)
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {PAIR_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPair(p)}
                className="rounded-lg border border-white/10 bg-slate-800/60 px-2 py-2 text-left text-xs text-slate-200 transition hover:border-violet-400/50 hover:bg-violet-500/15"
              >
                <div className="font-semibold text-slate-100">{p.label}</div>
                <div className="mt-0.5 text-[10px] text-slate-400">{p.hint}</div>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* CENTER — Dual atoms + Relation Analyzer */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Atom A column */}
              <Card className="border-white/10 bg-slate-900/50 p-3 backdrop-blur">
                <div className="mb-2 text-center text-sm font-bold text-slate-100">পরমাণু A (Atom A)</div>
                <AtomVisualizer
                  atom={atomA}
                  focused={focus === "A"}
                  onFocus={() => setFocus("A")}
                  label="A"
                  accent="border-emerald-400/60"
                />
                <div className="mt-3">
                  <AtomControls
                    atom={atomA}
                    setAtom={setAtomA}
                    color="border-emerald-400/30"
                  />
                </div>
              </Card>

              {/* Atom B column */}
              <Card className="border-white/10 bg-slate-900/50 p-3 backdrop-blur">
                <div className="mb-2 text-center text-sm font-bold text-slate-100">পরমাণু B (Atom B)</div>
                <AtomVisualizer
                  atom={atomB}
                  focused={focus === "B"}
                  onFocus={() => setFocus("B")}
                  label="B"
                  accent="border-sky-400/60"
                />
                <div className="mt-3">
                  <AtomControls
                    atom={atomB}
                    setAtom={setAtomB}
                    color="border-sky-400/30"
                  />
                </div>
              </Card>
            </div>

            {/* Relation Analyzer */}
            <Card className="border-cyan-400/40 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-4 backdrop-blur">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan-100">
                <GitCompare className="h-4 w-4" /> NCTB সম্পর্ক নির্ণায়ক (Relation Analyzer)
              </div>
              <div className={`rounded-lg border p-3 ${relation.cls}`}>
                <div className="text-base font-bold">{relation.title}</div>
                <div className="mt-1 text-xs leading-relaxed opacity-95">{relation.desc}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="rounded bg-slate-900/60 px-2 py-1 text-slate-200">
                    A: Z={atomA.p}, N={atomA.n}, A={atomA.p + atomA.n}{atomA.excited ? ", *" : ""}
                  </div>
                  <div className="rounded bg-slate-900/60 px-2 py-1 text-slate-200">
                    B: Z={atomB.p}, N={atomB.n}, A={atomB.p + atomB.n}{atomB.excited ? ", *" : ""}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                Tip: যেকোনো পরমাণুর কণা পরিবর্তন করলে এই কার্ডটি সাথে সাথে আপডেট হবে। Isomer বুঝতে একটি পরমাণুর “Excited State” টিক দিন।
              </p>
            </Card>
          </div>

          {/* RIGHT — Focused atom dashboard */}
          <div className="space-y-3">
            <Card className="border-white/10 bg-slate-900/70 p-3 backdrop-blur">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
                <span>সক্রিয় পরমাণু</span>
                <Badge className={`border ${focus === "A" ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200" : "border-sky-400/50 bg-sky-500/15 text-sky-200"}`}>
                  Atom {focus}
                </Badge>
              </div>
              {element ? (
                <div className="mt-2 flex items-baseline gap-3">
                  <div className="text-4xl font-black text-white">{element.symbol}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{element.nameBn}</div>
                    <div className="text-xs text-slate-400">{element.nameEn} · Z={element.z}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-400">
                  {focused.p === 0 ? "প্রোটন যোগ করুন" : "এই Z-এর মৌল NCTB সীমার বাইরে"}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-white/10 bg-slate-900/70 p-3 text-center backdrop-blur">
                <div className="text-[10px] uppercase text-slate-400">ভর সংখ্যা (A)</div>
                <div className="mt-1 font-mono text-2xl font-bold text-white">{mass}</div>
                <div className="text-[10px] text-slate-500">{focused.p}p + {focused.n}n</div>
              </Card>
              <Card className="border-white/10 bg-slate-900/70 p-3 text-center backdrop-blur">
                <div className="text-[10px] uppercase text-slate-400">পারমাণবিক সংখ্যা (Z)</div>
                <div className="mt-1 font-mono text-2xl font-bold text-white">{focused.p}</div>
                <div className="text-[10px] text-slate-500">= প্রোটন</div>
              </Card>
            </div>

            <Card className="border-white/10 bg-slate-900/70 p-3 backdrop-blur">
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <Zap className="h-3.5 w-3.5" /> নেট চার্জ
              </div>
              <Badge className={`w-full justify-center border ${chargeBadge.cls}`}>{chargeBadge.label}</Badge>
              <div className="mt-2 text-center font-mono text-xs text-slate-300">
                {focused.p}p − {focused.e}e = {charge >= 0 ? `+${charge}` : charge}
              </div>
            </Card>

            {shells.length > 0 && (
              <Card className="border-white/10 bg-slate-900/70 p-3 backdrop-blur">
                <div className="mb-1 text-xs text-slate-400">ইলেকট্রন বিন্যাস</div>
                <div className="font-mono text-sm text-yellow-300">
                  {shells.map((c, i) => `${SHELL_NAMES[i]}=${c}`).join(", ")}
                </div>
              </Card>
            )}

            <Card className="border-violet-400/30 bg-violet-500/10 p-3 backdrop-blur">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-violet-200">
                <Info className="h-3.5 w-3.5" /> সংজ্ঞা স্মরণিকা
              </div>
              <ul className="space-y-1 text-[11px] leading-relaxed text-slate-300">
                <li><b className="text-emerald-300">আইসোটোপ:</b> Z সমান, A ভিন্ন।</li>
                <li><b className="text-sky-300">আইসোবার:</b> A সমান, Z ভিন্ন।</li>
                <li><b className="text-amber-300">আইসোটোন:</b> N সমান, Z ভিন্ন।</li>
                <li><b className="text-fuchsia-300">আইসোমার:</b> p, n সমান — শক্তিস্তর ভিন্ন।</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-a-0 { from { transform: rotate(0) } to { transform: rotate(360deg) } }
        @keyframes spin-a-1 { from { transform: rotate(0) } to { transform: rotate(-360deg) } }
        @keyframes spin-a-2 { from { transform: rotate(0) } to { transform: rotate(360deg) } }
        @keyframes spin-a-3 { from { transform: rotate(0) } to { transform: rotate(-360deg) } }
        @keyframes spin-b-0 { from { transform: rotate(0) } to { transform: rotate(-360deg) } }
        @keyframes spin-b-1 { from { transform: rotate(0) } to { transform: rotate(360deg) } }
        @keyframes spin-b-2 { from { transform: rotate(0) } to { transform: rotate(-360deg) } }
        @keyframes spin-b-3 { from { transform: rotate(0) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
