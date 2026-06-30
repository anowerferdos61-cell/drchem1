/**
 * Aufbau Principle & Electron Configuration Simulator
 * আউফবাউ নীতি ও ইলেকট্রন বিন্যাস সিমুলেটর — NCTB Ch 3
 *
 * Demonstrates: Aufbau order (1s<2s<2p<3s<3p<4s<3d…),
 * Pauli Exclusion, Hund's Rule, and Cr/Cu anomalies.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Atom, Minus, Plus, RotateCcw, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  onBack: () => void;
}

// ─────────── Aufbau order (n+l rule) ────────────────────────
type Subshell = {
  key: string;          // "1s", "2p"…
  n: number;
  l: 0 | 1 | 2 | 3;     // s p d f
  type: "s" | "p" | "d" | "f";
  orbitals: number;     // boxes
  capacity: number;     // 2 × orbitals
  nl: number;
  energy: number;       // visual y-rank (lower = bottom)
};

const SUBSHELLS: Subshell[] = [
  { key: "1s", n: 1, l: 0, type: "s", orbitals: 1, capacity: 2,  nl: 1, energy: 0 },
  { key: "2s", n: 2, l: 0, type: "s", orbitals: 1, capacity: 2,  nl: 2, energy: 1 },
  { key: "2p", n: 2, l: 1, type: "p", orbitals: 3, capacity: 6,  nl: 3, energy: 2 },
  { key: "3s", n: 3, l: 0, type: "s", orbitals: 1, capacity: 2,  nl: 3, energy: 3 },
  { key: "3p", n: 3, l: 1, type: "p", orbitals: 3, capacity: 6,  nl: 4, energy: 4 },
  { key: "4s", n: 4, l: 0, type: "s", orbitals: 1, capacity: 2,  nl: 4, energy: 5 },
  { key: "3d", n: 3, l: 2, type: "d", orbitals: 5, capacity: 10, nl: 5, energy: 6 },
  { key: "4p", n: 4, l: 1, type: "p", orbitals: 3, capacity: 6,  nl: 5, energy: 7 },
];

const FILL_ORDER = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p"];

const TYPE_COLOR: Record<Subshell["type"], { bg: string; ring: string; text: string; glow: string }> = {
  s: { bg: "from-sky-500/30 to-blue-600/20",      ring: "ring-sky-400/60",      text: "text-sky-300",      glow: "shadow-sky-500/40" },
  p: { bg: "from-violet-500/30 to-purple-600/20", ring: "ring-violet-400/60",   text: "text-violet-300",   glow: "shadow-violet-500/40" },
  d: { bg: "from-orange-500/30 to-amber-600/20",  ring: "ring-orange-400/60",   text: "text-orange-300",   glow: "shadow-orange-500/40" },
  f: { bg: "from-rose-500/30 to-pink-600/20",     ring: "ring-rose-400/60",     text: "text-rose-300",     glow: "shadow-rose-500/40" },
};

// ─────────── Elements with anomalies ────────────────────────
type ElementDef = {
  Z: number;
  symbol: string;
  name: string;
  nameBn: string;
  anomaly?: "Cr" | "Cu";
};

const ELEMENTS: ElementDef[] = [
  { Z: 19, symbol: "K",  name: "Potassium", nameBn: "পটাশিয়াম" },
  { Z: 21, symbol: "Sc", name: "Scandium",  nameBn: "স্ক্যান্ডিয়াম" },
  { Z: 24, symbol: "Cr", name: "Chromium",  nameBn: "ক্রোমিয়াম", anomaly: "Cr" },
  { Z: 29, symbol: "Cu", name: "Copper",    nameBn: "কপার",       anomaly: "Cu" },
];

// ─────────── Fill logic (Aufbau + Hund + Pauli) ─────────────
type OrbitalState = number[]; // length = orbitals, values 0/1/2
type Filling = Record<string, OrbitalState>;

function emptyFilling(): Filling {
  const f: Filling = {};
  for (const s of SUBSHELLS) f[s.key] = Array(s.orbitals).fill(0);
  return f;
}

/** Distribute `electrons` electrons into orbitals via Hund's rule. */
function fillSubshell(orbitals: number, electrons: number): OrbitalState {
  const arr: OrbitalState = Array(orbitals).fill(0);
  let e = Math.min(electrons, orbitals * 2);
  // Singly first
  for (let i = 0; i < orbitals && e > 0; i++) { arr[i] = 1; e--; }
  // Pair up
  for (let i = 0; i < orbitals && e > 0; i++) { arr[i] = 2; e--; }
  return arr;
}

/** Standard Aufbau filling for `totalE` electrons. */
function aufbauFill(totalE: number): { filling: Filling; subshellElectrons: Record<string, number> } {
  const filling = emptyFilling();
  const counts: Record<string, number> = {};
  let remaining = totalE;
  for (const key of FILL_ORDER) {
    const sub = SUBSHELLS.find((s) => s.key === key)!;
    const take = Math.min(sub.capacity, remaining);
    counts[key] = take;
    filling[key] = fillSubshell(sub.orbitals, take);
    remaining -= take;
    if (remaining <= 0) break;
  }
  return { filling, subshellElectrons: counts };
}

/** Apply Cr/Cu anomaly when the right number of electrons is present. */
function applyAnomaly(
  totalE: number,
  anomaly: "Cr" | "Cu" | undefined,
  filling: Filling,
  counts: Record<string, number>,
): { filling: Filling; counts: Record<string, number>; triggered: boolean } {
  if (!anomaly) return { filling, counts, triggered: false };
  if (anomaly === "Cr" && totalE === 24) {
    // 3d⁴ 4s² → 3d⁵ 4s¹
    counts["3d"] = 5; counts["4s"] = 1;
    filling["3d"] = fillSubshell(5, 5);
    filling["4s"] = fillSubshell(1, 1);
    return { filling, counts, triggered: true };
  }
  if (anomaly === "Cu" && totalE === 29) {
    // 3d⁹ 4s² → 3d¹⁰ 4s¹
    counts["3d"] = 10; counts["4s"] = 1;
    filling["3d"] = fillSubshell(5, 10);
    filling["4s"] = fillSubshell(1, 1);
    return { filling, counts, triggered: true };
  }
  return { filling, counts, triggered: false };
}

function configString(counts: Record<string, number>): string {
  return FILL_ORDER
    .filter((k) => counts[k] > 0)
    .map((k) => `${k}${superscript(counts[k])}`)
    .join(" ");
}

function superscript(n: number): string {
  const map: Record<string, string> = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
  return String(n).split("").map((d) => map[d] ?? d).join("");
}

// ─────────── Insight generator ──────────────────────────────
function buildInsight(totalE: number, anomalyTriggered: boolean, lastFilled: string | null) {
  if (anomalyTriggered) {
    return {
      title: "ব্যতিক্রম! অর্ধপূর্ণ/পূর্ণ অরবিটালের অধিক স্থায়িত্ব",
      titleEn: "Exceptional Stability of Half/Fully-filled Orbitals",
      body:
        "৪s থেকে একটি ইলেকট্রন ৩d-তে স্থানান্তরিত হয়েছে — কারণ অর্ধপূর্ণ (d⁵) বা পূর্ণপূর্ণ (d¹⁰) অরবিটাল অতিরিক্ত প্রতিসাম্য ও বিনিময় শক্তির কারণে বেশি স্থিতিশীল।",
      bodyEn:
        "One electron jumps from 4s → 3d because half-filled (d⁵) or fully-filled (d¹⁰) sub-shells gain extra exchange-energy stability.",
    };
  }
  if (!lastFilled || totalE === 0) {
    return {
      title: "আউফবাউ নীতি (Aufbau Principle)",
      titleEn: "Aufbau Principle",
      body: "ইলেকট্রন সর্বনিম্ন শক্তির অরবিটাল থেকে ক্রমান্বয়ে উচ্চতর শক্তির অরবিটালে প্রবেশ করে।",
      bodyEn: "Electrons fill the lowest-energy orbital first, then move upward (n+l rule).",
    };
  }
  const sub = SUBSHELLS.find((s) => s.key === lastFilled)!;
  if (sub.key === "4s") {
    return {
      title: "৪s কেন ৩d এর আগে?",
      titleEn: "Why 4s before 3d?",
      body: `n+l নিয়ম: 4s = 4+0 = 4, কিন্তু 3d = 3+2 = 5। তাই 4s-এর শক্তি কম, আগে ভরাট হয়।`,
      bodyEn: `n+l rule: 4s = 4, 3d = 5 → 4s has lower energy and fills first.`,
    };
  }
  if (sub.orbitals > 1) {
    return {
      title: "হুন্ডের নিয়ম (Hund's Rule)",
      titleEn: "Hund's Rule",
      body: `${sub.key} অরবিটালের প্রতিটি বাক্সে আগে একটি করে ইলেকট্রন (সমান্তরাল স্পিন ↑↑↑) বসবে, তারপর জোড়া হবে।`,
      bodyEn: `Each ${sub.key} box gets one electron with parallel spin first, then they pair up.`,
    };
  }
  return {
    title: "পাউলির বর্জন নীতি (Pauli Exclusion)",
    titleEn: "Pauli Exclusion Principle",
    body: `${sub.key} অরবিটালে সর্বোচ্চ ২টি ইলেকট্রন থাকতে পারে — বিপরীত স্পিন (↑↓) সহ।`,
    bodyEn: `${sub.key} holds at most 2 electrons with opposite spins (↑↓).`,
  };
}

// ─────────── Visual: Orbital Box ────────────────────────────
function OrbitalBox({
  state,
  type,
  highlight,
  glow,
}: {
  state: number;
  type: Subshell["type"];
  highlight: boolean;
  glow: boolean;
}) {
  const c = TYPE_COLOR[type];
  return (
    <div
      className={`relative h-10 w-9 rounded-md border bg-gradient-to-br ${c.bg} ${
        highlight ? `ring-2 ${c.ring}` : "ring-1 ring-white/5"
      } ${glow ? `shadow-lg ${c.glow} animate-pulse` : ""} border-white/10 transition-all`}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-0.5 text-base font-bold leading-none">
        {state >= 1 && <span className={`${c.text} drop-shadow`} style={{ animation: "fade-in 0.3s ease-out" }}>↑</span>}
        {state >= 2 && <span className={`${c.text} drop-shadow`} style={{ animation: "fade-in 0.3s ease-out" }}>↓</span>}
      </div>
    </div>
  );
}

// ─────────── Main component ─────────────────────────────────
export default function AufbauLab({ onBack }: Props) {
  const [elementZ, setElementZ] = useState<number>(19);
  const element = useMemo(() => ELEMENTS.find((e) => e.Z === elementZ)!, [elementZ]);
  const [electrons, setElectrons] = useState<number>(0);
  const [lastFilled, setLastFilled] = useState<string | null>(null);
  const prevE = useRef<number>(0);

  // Reset electrons when element changes
  useEffect(() => {
    setElectrons(0);
    setLastFilled(null);
    prevE.current = 0;
  }, [elementZ]);

  const max = element.Z;

  const { filling, counts, anomalyTriggered } = useMemo(() => {
    const base = aufbauFill(electrons);
    const applied = applyAnomaly(electrons, element.anomaly, base.filling, base.subshellElectrons);
    return { filling: applied.filling, counts: applied.counts, anomalyTriggered: applied.triggered };
  }, [electrons, element.anomaly]);

  const configText = configString(counts);
  const insight = buildInsight(electrons, anomalyTriggered, lastFilled);

  const addElectron = () => {
    if (electrons >= max) return;
    const next = electrons + 1;
    // figure out which subshell the new electron enters (pre-anomaly view)
    const { subshellElectrons } = aufbauFill(next);
    let target: string | null = null;
    for (const k of FILL_ORDER) {
      if ((subshellElectrons[k] ?? 0) > (counts[k] ?? 0)) { target = k; break; }
    }
    setLastFilled(target);
    setElectrons(next);
    prevE.current = next;
  };

  const removeElectron = () => {
    if (electrons <= 0) return;
    setElectrons((n) => n - 1);
    setLastFilled(null);
  };

  const fillAll = () => {
    setElectrons(max);
    setLastFilled(null);
  };

  const reset = () => {
    setElectrons(0);
    setLastFilled(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1 text-slate-200 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 text-white shadow-lg shadow-violet-500/30">
              <Atom className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight">
                আউফবাউ নীতি ও ইলেকট্রন বিন্যাস
              </div>
              <div className="text-[11px] text-slate-400">
                Aufbau Principle & Electron Configuration · NCTB CH 3
              </div>
            </div>
          </div>

          {/* Element + add controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(elementZ)} onValueChange={(v) => setElementZ(parseInt(v, 10))}>
              <SelectTrigger className="w-[220px] border-white/15 bg-white/5 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ELEMENTS.map((e) => (
                  <SelectItem key={e.Z} value={String(e.Z)}>
                    {e.name} ({e.symbol}) — Z={e.Z}{e.anomaly ? " ⚡" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge className="border border-violet-400/30 bg-violet-500/15 text-violet-200">
              {element.symbol} · Z = {element.Z}
            </Badge>
          </div>
        </div>

        {/* Electron pool */}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ইলেকট্রন পুল · Electron Pool
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(max - electrons, 10) }).map((_, i) => (
                <span
                  key={i}
                  className="h-3 w-3 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-md shadow-amber-500/40"
                  style={{ animation: `pulse 1.4s ease-in-out ${i * 0.08}s infinite` }}
                />
              ))}
              {max - electrons > 10 && (
                <span className="ml-1 text-xs font-mono text-slate-400">+{max - electrons - 10}</span>
              )}
              {max - electrons === 0 && (
                <span className="text-xs text-emerald-300">✓ পূর্ণ · complete</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              <span className="font-mono text-base font-bold text-emerald-300">{electrons}</span>
              <span className="text-slate-500"> / {max} e⁻</span>
            </span>
            <Button size="sm" variant="outline" onClick={removeElectron} disabled={electrons === 0}
              className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
              <Minus className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={addElectron} disabled={electrons === max}
              className="bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:from-emerald-400 hover:to-sky-400">
              <Plus className="h-4 w-4" /> Add Electron
            </Button>
            <Button size="sm" variant="outline" onClick={fillAll}
              className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
              <Zap className="h-4 w-4 mr-1" /> Fill All
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} className="text-slate-300 hover:bg-white/10">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[1fr_360px]">
        {/* Energy ladder */}
        <Card className="border-white/10 bg-slate-900/60 p-5 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                শক্তি স্তর · Energy Ladder
              </div>
              <div className="text-sm text-slate-200">
                n+l নিয়ম অনুসারে সাজানো · ordered by n+l rule
              </div>
            </div>
            <div className="text-[10px] text-slate-500">⬆ higher energy</div>
          </div>

          <div className="relative">
            {/* Y axis */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-violet-400/60 via-sky-400/30 to-transparent" />
            <div className="flex flex-col-reverse gap-2 pl-6">
              {SUBSHELLS.map((sub) => {
                const state = filling[sub.key] ?? [];
                const filled = counts[sub.key] ?? 0;
                const isLast = lastFilled === sub.key;
                const isAnomalyBox =
                  anomalyTriggered && (sub.key === "3d" || sub.key === "4s");
                const c = TYPE_COLOR[sub.type];
                return (
                  <div
                    key={sub.key}
                    className={`group relative flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 transition-all ${
                      isLast ? "ring-1 ring-emerald-400/40" : ""
                    }`}
                  >
                    {/* Label */}
                    <div className="w-20 shrink-0">
                      <div className={`text-lg font-extrabold ${c.text}`}>{sub.key}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        n+l = {sub.nl}
                      </div>
                    </div>

                    {/* Boxes */}
                    <div className="flex flex-1 items-center gap-1.5">
                      {state.map((s, i) => (
                        <OrbitalBox
                          key={i}
                          state={s}
                          type={sub.type}
                          highlight={isLast}
                          glow={isAnomalyBox && filled === sub.capacity || (isAnomalyBox && sub.key === "3d" && filled === 5)}
                        />
                      ))}
                    </div>

                    {/* Count */}
                    <div className="w-16 shrink-0 text-right">
                      <div className={`font-mono text-sm font-bold ${filled > 0 ? c.text : "text-slate-600"}`}>
                        {filled}/{sub.capacity}
                      </div>
                      <div className="text-[9px] uppercase text-slate-500">{sub.type}-orbital</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3 text-[11px] text-slate-400">
            <LegendDot c="sky"     label="s-orbital" />
            <LegendDot c="violet"  label="p-orbital" />
            <LegendDot c="orange"  label="d-orbital" />
            <span className="ml-auto rounded bg-white/5 px-2 py-0.5 font-mono">
              4s (n+l=4) &lt; 3d (n+l=5)
            </span>
          </div>
        </Card>

        {/* Right column: config + insights */}
        <div className="space-y-4">
          <Card className="border-white/10 bg-gradient-to-br from-slate-900/80 to-indigo-950/60 p-5 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ইলেকট্রন বিন্যাস · Configuration
            </div>
            <div className="mt-2 min-h-[3rem] font-mono text-lg font-bold leading-snug text-emerald-300">
              {configText || <span className="text-slate-600">কোন ইলেকট্রন নেই · empty</span>}
            </div>
            {anomalyTriggered && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2.5 text-amber-200">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="text-xs leading-snug">
                  <b>{element.symbol}</b>: 4s → 3d ইলেকট্রন স্থানান্তর সম্পন্ন।
                </div>
              </div>
            )}
          </Card>

          <Card className="border-white/10 bg-slate-900/60 p-5 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-300">
              <Sparkles className="h-3.5 w-3.5" /> শিক্ষাগত ব্যাখ্যা · Educational Insight
            </div>
            <div className="text-sm font-bold text-slate-100">{insight.title}</div>
            <div className="text-[11px] text-slate-400">{insight.titleEn}</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{insight.body}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{insight.bodyEn}</p>
          </Card>

          <Card className="border-white/10 bg-slate-900/60 p-4 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              নিয়মসমূহ · Rules
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
              <li><b className="text-sky-300">Aufbau:</b> সর্বনিম্ন শক্তি আগে পূর্ণ।</li>
              <li><b className="text-violet-300">Hund:</b> degenerate orbital আগে এককভাবে পূর্ণ, পরে জোড়া।</li>
              <li><b className="text-orange-300">Pauli:</b> এক অরবিটালে ↑↓ বিপরীত স্পিন।</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}

function LegendDot({ c, label }: { c: "sky" | "violet" | "orange"; label: string }) {
  const cls = c === "sky" ? "bg-sky-400" : c === "violet" ? "bg-violet-400" : "bg-orange-400";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
      {label}
    </span>
  );
}
