/**
 * Build an Atom & Isotope Simulator — Upgraded
 * পরমাণু গঠন, আইসোটোপ ও NCTB সম্পর্ক নির্ণায়ক
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
  AlertTriangle,
  CheckCircle2,
  Zap,
  Bookmark,
  GitCompare,
  Trash2,
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

type Preset = { label: string; p: number; n: number; e: number };
const PRESETS: Preset[] = [
  { label: "Hydrogen-1 (¹H)", p: 1, n: 0, e: 1 },
  { label: "Deuterium (²H)", p: 1, n: 1, e: 1 },
  { label: "Carbon-12 (¹²C)", p: 6, n: 6, e: 6 },
  { label: "Carbon-14 (¹⁴C)", p: 6, n: 8, e: 6 },
  { label: "Nitrogen-14 (¹⁴N)", p: 7, n: 7, e: 7 },
  { label: "Oxygen-16 (¹⁶O)", p: 8, n: 8, e: 8 },
  { label: "Sodium-23 (²³Na)", p: 11, n: 12, e: 11 },
];

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
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full ring-2 ring-white/20"
            style={{ background: color }}
          />
          <span className="text-sm font-semibold text-slate-100">{label}</span>
        </div>
        <span className="rounded-md bg-slate-900/70 px-2 py-0.5 font-mono text-sm text-white">
          {count}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={onDec}
          disabled={count <= 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          className="flex-1"
          style={{ background: color, color: "#0b1220" }}
          onClick={onInc}
          disabled={max !== undefined && count >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type Snap = { p: number; n: number; e: number };

function relationLabel(a: Snap, b: Snap) {
  const aMass = a.p + a.n;
  const bMass = b.p + b.n;
  if (a.p === b.p && a.n === b.n && aMass === bMass) {
    return {
      key: "isomer",
      title: "আইসোমার (Isomer)",
      desc: "প্রোটন, নিউট্রন ও ভর সংখ্যা সমান কিন্তু নিউক্লিয় শক্তিস্তর ভিন্ন। যেমন: Tc-99m (Metastable)।",
      cls: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/40",
    };
  }
  if (a.p === b.p && aMass !== bMass) {
    return {
      key: "isotope",
      title: "আইসোটোপ (Isotope)",
      desc: "প্রোটন সংখ্যা সমান কিন্তু ভর সংখ্যা ভিন্ন।",
      cls: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40",
    };
  }
  if (aMass === bMass && a.p !== b.p) {
    return {
      key: "isobar",
      title: "আইসোবার (Isobar)",
      desc: "ভর সংখ্যা (A) সমান কিন্তু প্রোটন সংখ্যা ভিন্ন।",
      cls: "bg-sky-500/15 text-sky-200 border-sky-400/40",
    };
  }
  if (a.n === b.n && a.p !== b.p) {
    return {
      key: "isotone",
      title: "আইসোটোন (Isotone)",
      desc: "নিউট্রন সংখ্যা সমান কিন্তু প্রোটন সংখ্যা ভিন্ন।",
      cls: "bg-amber-500/15 text-amber-200 border-amber-400/40",
    };
  }
  return {
    key: "none",
    title: "কোনো বিশেষ সম্পর্ক নেই",
    desc: "Atom A ও Atom B-এর মধ্যে আইসোটোপ/আইসোবার/আইসোটোন সম্পর্ক প্রযোজ্য নয়।",
    cls: "bg-slate-500/15 text-slate-300 border-slate-400/30",
  };
}

function snapLabel(s: Snap) {
  const el = ELEMENTS.find((e) => e.z === s.p);
  const sym = el?.symbol ?? "?";
  const mass = s.p + s.n;
  return `${sym}-${mass} · ${s.p}p ${s.n}n ${s.e}e`;
}

export default function AtomBuilderLab({ onBack }: Props) {
  const [protons, setProtons] = useState(1);
  const [neutrons, setNeutrons] = useState(0);
  const [electrons, setElectrons] = useState(1);
  const [atomA, setAtomA] = useState<Snap | null>(null);
  const [atomB, setAtomB] = useState<Snap | null>(null);

  const element = useMemo(
    () => ELEMENTS.find((e) => e.z === protons) ?? null,
    [protons],
  );
  const mass = protons + neutrons;
  const charge = protons - electrons;
  const shells = useMemo(() => distributeElectrons(electrons), [electrons]);

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

  const isotopeAlert = useMemo(() => {
    if (protons === 6) {
      if (neutrons === 6)
        return { icon: CheckCircle2, text: "Carbon-12 — স্থিতিশীল, প্রকৃতিতে ৯৮.৯% প্রাচুর্য", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40" };
      if (neutrons === 7)
        return { icon: Info, text: "Carbon-13 — স্থিতিশীল, ১.১% প্রাচুর্য", cls: "bg-sky-500/15 text-sky-300 border-sky-400/40" };
      if (neutrons === 8)
        return { icon: AlertTriangle, text: "Carbon-14 — তেজস্ক্রিয়! কার্বন-ডেটিং-এ ব্যবহৃত হয়।", cls: "bg-amber-500/15 text-amber-300 border-amber-400/40" };
      return { icon: AlertTriangle, text: "কার্বনের অস্থিতিশীল আইসোটোপ", cls: "bg-rose-500/15 text-rose-300 border-rose-400/40" };
    }
    return null;
  }, [protons, neutrons]);

  const reset = () => {
    setProtons(0);
    setNeutrons(0);
    setElectrons(0);
  };

  const applyPreset = (p: Preset) => {
    setProtons(p.p);
    setNeutrons(p.n);
    setElectrons(p.e);
  };

  const current: Snap = { p: protons, n: neutrons, e: electrons };
  const relation = atomA && atomB ? relationLabel(atomA, atomB) : null;

  // Nucleus particles
  const nucleusParticles = useMemo(() => {
    const list: { color: string; x: number; y: number }[] = [];
    const total = protons + neutrons;
    const radius = Math.min(28, 6 + Math.sqrt(total) * 4);
    for (let i = 0; i < total; i++) {
      const angle = (i / Math.max(1, total)) * Math.PI * 2 + (i % 2) * 0.5;
      const r = radius * (0.3 + (0.7 * ((i * 37) % 100)) / 100);
      list.push({
        color: i < protons ? "#ef4444" : "#3b82f6",
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    return list;
  }, [protons, neutrons]);

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

      <div className="relative mx-auto max-w-7xl p-3 md:p-6">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-200 hover:bg-white/10">
              <ArrowLeft className="mr-1 h-4 w-4" /> ফিরে যাই
            </Button>
            <div>
              <h1 className="text-lg font-bold md:text-2xl">
                <AtomIcon className="mr-2 inline h-5 w-5 text-violet-400" />
                পরমাণু গঠন, আইসোটোপ ও সম্পর্ক নির্ণায়ক
              </h1>
              <p className="text-xs text-slate-400 md:text-sm">
                Build an Atom · Chapter 3 · পদার্থের গঠন
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={reset} className="border-white/20 text-slate-200 hover:bg-white/10">
            <RotateCcw className="mr-1 h-4 w-4" /> Reset Lab
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
          {/* LEFT — Particle inventory + presets */}
          <div className="space-y-3">
            <Card className="border-white/10 bg-slate-900/70 p-3 backdrop-blur">
              <h3 className="mb-3 text-sm font-bold text-slate-200">কণা যোগ করুন</h3>
              <div className="space-y-3">
                <Counter label="প্রোটন (Proton, +)" count={protons} color="#ef4444"
                  onInc={() => setProtons((v) => Math.min(20, v + 1))}
                  onDec={() => setProtons((v) => Math.max(0, v - 1))} max={20} />
                <Counter label="নিউট্রন (Neutron, 0)" count={neutrons} color="#3b82f6"
                  onInc={() => setNeutrons((v) => Math.min(30, v + 1))}
                  onDec={() => setNeutrons((v) => Math.max(0, v - 1))} max={30} />
                <Counter label="ইলেকট্রন (Electron, −)" count={electrons} color="#facc15"
                  onInc={() => setElectrons((v) => Math.min(28, v + 1))}
                  onDec={() => setElectrons((v) => Math.max(0, v - 1))} max={28} />
              </div>
            </Card>

            <Card className="border-violet-400/30 bg-violet-500/10 p-3 backdrop-blur">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-violet-200">
                <Sparkles className="h-4 w-4" /> দ্রুত প্রিসেট
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => applyPreset(p)}
                    className="rounded-md border border-white/10 bg-slate-800/60 px-2 py-1.5 text-left text-xs text-slate-200 transition hover:border-violet-400/50 hover:bg-violet-500/15">
                    {p.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Comparison Sandbox */}
            <Card className="border-cyan-400/30 bg-cyan-500/5 p-3 backdrop-blur">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan-200">
                <GitCompare className="h-4 w-4" /> তুলনা স্যান্ডবক্স
              </div>
              <div className="space-y-2">
                <div className="rounded-md border border-white/10 bg-slate-900/60 p-2">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Atom A</span>
                    {atomA && (
                      <button onClick={() => setAtomA(null)} className="text-rose-300 hover:text-rose-200">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="font-mono text-xs text-slate-100">
                    {atomA ? snapLabel(atomA) : "— খালি —"}
                  </div>
                </div>
                <div className="rounded-md border border-white/10 bg-slate-900/60 p-2">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Atom B</span>
                    {atomB && (
                      <button onClick={() => setAtomB(null)} className="text-rose-300 hover:text-rose-200">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="font-mono text-xs text-slate-100">
                    {atomB ? snapLabel(atomB) : "— খালি —"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={() => setAtomA(current)}>
                    <Bookmark className="mr-1 h-3.5 w-3.5" /> Save A
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setAtomB(current)}>
                    <Bookmark className="mr-1 h-3.5 w-3.5" /> Save B
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* CENTER — Atom visualizer */}
          <Card className="relative flex min-h-[420px] items-center justify-center overflow-hidden border-white/10 bg-slate-900/50 p-4 backdrop-blur md:min-h-[560px]">
            <div className="relative aspect-square w-full max-w-[520px]">
              {shells.length === 0 && electrons === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                  ইলেকট্রন যোগ করুন কক্ষপথ দেখার জন্য
                </div>
              )}
              {[0, 1, 2, 3].map((i) => {
                const sizePct = 30 + i * 22;
                const hasElectrons = (shells[i] ?? 0) > 0;
                return (
                  <div key={i}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{
                      width: `${sizePct}%`,
                      height: `${sizePct}%`,
                      borderColor: hasElectrons ? "rgba(250,204,21,0.45)" : "rgba(148,163,184,0.18)",
                      borderStyle: hasElectrons ? "solid" : "dashed",
                    }}>
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-slate-900/80 px-1.5 text-[10px] text-slate-300">
                      {SHELL_NAMES[i]} {hasElectrons ? `(${shells[i]})` : ""}
                    </span>
                    {hasElectrons && (
                      <div className="absolute inset-0"
                        style={{ animation: `spin-atom-${i} ${8 + i * 4}s linear infinite` }}>
                        {Array.from({ length: shells[i] }).map((_, k) => {
                          const angle = (k / shells[i]) * 360;
                          return (
                            <div key={k} className="absolute left-1/2 top-1/2"
                              style={{ transform: `rotate(${angle}deg) translate(50%) rotate(-${angle}deg)` }}>
                              <div className="-ml-2 -mt-2 h-3.5 w-3.5 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)] ring-2 ring-yellow-200/60" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Nucleus */}
              <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/30 via-fuchsia-500/20 to-blue-500/30 shadow-[0_0_60px_rgba(244,63,94,0.35)] ring-2 ring-white/15">
                <div className="relative h-full w-full animate-pulse">
                  {nucleusParticles.slice(0, 60).map((p, i) => (
                    <div key={i}
                      className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
                      style={{
                        background: p.color,
                        transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`,
                      }} />
                  ))}
                </div>
              </div>

              <div className="absolute left-1/2 top-[calc(50%+60px)] -translate-x-1/2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-200 ring-1 ring-white/10">
                পার্থিব নিউক্লিয়াস: {protons}p + {neutrons}n
              </div>
            </div>

            <style>{`
              @keyframes spin-atom-0 { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
              @keyframes spin-atom-1 { from { transform: rotate(0deg) } to { transform: rotate(-360deg) } }
              @keyframes spin-atom-2 { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
              @keyframes spin-atom-3 { from { transform: rotate(0deg) } to { transform: rotate(-360deg) } }
            `}</style>
          </Card>

          {/* RIGHT — Dashboard */}
          <div className="space-y-3">
            <Card className="border-white/10 bg-slate-900/70 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-wide text-slate-400">মৌল</div>
              {element ? (
                <div className="mt-1 flex items-baseline gap-3">
                  <div className="text-4xl font-black text-white">{element.symbol}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{element.nameBn}</div>
                    <div className="text-xs text-slate-400">{element.nameEn} · Z={element.z}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-sm text-slate-400">
                  {protons === 0 ? "প্রোটন যোগ করুন" : "এই Z-এর মৌল NCTB সীমার বাইরে"}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-white/10 bg-slate-900/70 p-3 text-center backdrop-blur">
                <div className="text-[10px] uppercase text-slate-400">ভর সংখ্যা (A)</div>
                <div className="mt-1 font-mono text-2xl font-bold text-white">{mass}</div>
                <div className="text-[10px] text-slate-500">{protons}p + {neutrons}n</div>
              </Card>
              <Card className="border-white/10 bg-slate-900/70 p-3 text-center backdrop-blur">
                <div className="text-[10px] uppercase text-slate-400">পারমাণবিক সংখ্যা (Z)</div>
                <div className="mt-1 font-mono text-2xl font-bold text-white">{protons}</div>
                <div className="text-[10px] text-slate-500">= প্রোটন</div>
              </Card>
            </div>

            <Card className="border-white/10 bg-slate-900/70 p-3 backdrop-blur">
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <Zap className="h-3.5 w-3.5" /> নেট চার্জ
              </div>
              <Badge className={`w-full justify-center border ${chargeBadge.cls}`}>{chargeBadge.label}</Badge>
              <div className="mt-2 text-center font-mono text-xs text-slate-300">
                {protons}p − {electrons}e = {charge >= 0 ? `+${charge}` : charge}
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

            {isotopeAlert && (
              <Card className={`border p-3 backdrop-blur ${isotopeAlert.cls}`}>
                <div className="flex items-start gap-2">
                  <isotopeAlert.icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="text-xs font-semibold leading-snug">{isotopeAlert.text}</div>
                </div>
              </Card>
            )}

            {/* Relation Detector */}
            <Card className="border-cyan-400/30 bg-cyan-500/5 p-3 backdrop-blur">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-cyan-200">
                <GitCompare className="h-3.5 w-3.5" /> NCTB সম্পর্ক নির্ণায়ক
              </div>
              {relation ? (
                <div className={`rounded-md border p-2 ${relation.cls}`}>
                  <div className="text-sm font-bold">{relation.title}</div>
                  <div className="mt-1 text-[11px] leading-snug opacity-90">{relation.desc}</div>
                  <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[10px] text-slate-200/80">
                    <div>A: {snapLabel(atomA!)}</div>
                    <div>B: {snapLabel(atomB!)}</div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-slate-400">
                  বাম পাশের সান্ডবক্সে <b className="text-slate-200">Save A</b> ও <b className="text-slate-200">Save B</b> চাপ দিয়ে দুটি পরমাণু সংরক্ষণ করুন — আইসোটোপ / আইসোবার / আইসোটোন / আইসোমার সম্পর্ক স্বয়ংক্রিয়ভাবে নির্ণীত হবে।
                </p>
              )}
            </Card>

            <Card className="border-violet-400/30 bg-violet-500/10 p-3 backdrop-blur">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-violet-200">
                <Info className="h-3.5 w-3.5" /> আইসোটোপ কী?
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                যে সকল পরমাণুর প্রোটন সংখ্যা সমান কিন্তু ভর সংখ্যা ভিন্ন,
                তাদেরকে একে অপরের আইসোটোপ বলে। যেমন — ¹²C, ¹³C, ¹⁴C সবই কার্বনের আইসোটোপ।
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
