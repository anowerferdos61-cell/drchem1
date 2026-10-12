/**
 * Periodic Properties & Trends Simulator
 * পর্যায়বৃত্ত ধর্ম ও ট্রেন্ড সিমুলেটর
 *
 * Interactive heatmap grid (elements 1–20) + zoom-in atomic structure
 * comparison panel demonstrating WHY periodic trends arise.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TREND_ELEMENTS,
  TREND_META,
  GRID_GROUPS,
  GRID_PERIODS,
  elementAt,
  normalised,
  type TrendElement,
  type TrendKey,
} from "@/lib/periodic-trends";

interface Props {
  onBack: () => void;
}

const TREND_KEYS: TrendKey[] = ["radius", "ie", "ea", "en"];

// Default comparison pair = Na vs Cl (left-to-right trend)
const DEFAULTS = { a: 11, b: 17 };

export default function PeriodicTrendsLab({ onBack }: Props) {
  const [trend, setTrend] = useState<TrendKey>("radius");
  const [aZ, setAZ] = useState<number>(DEFAULTS.a);
  const [bZ, setBZ] = useState<number>(DEFAULTS.b);
  const [pickSlot, setPickSlot] = useState<"a" | "b">("b");

  const meta = TREND_META[trend];
  const elA = TREND_ELEMENTS.find((e) => e.Z === aZ)!;
  const elB = TREND_ELEMENTS.find((e) => e.Z === bZ)!;

  const handlePick = (el: TrendElement) => {
    if (pickSlot === "a") {
      setAZ(el.Z);
      setPickSlot("b");
    } else {
      setBZ(el.Z);
      setPickSlot("a");
    }
  };

  // Trend direction between A and B
  const direction = useMemo<"row" | "col" | "diag">(() => {
    if (elA.period === elB.period) return "row";
    if (elA.group === elB.group) return "col";
    return "diag";
  }, [elA, elB]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 gap-1 text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight md:text-base">
                পর্যায়বৃত্ত ধর্ম ও ট্রেন্ড
              </div>
              <div className="text-[10px] text-slate-400 md:text-xs">
                Periodic Properties &amp; Trends Simulator
              </div>
            </div>
          </div>
          <Badge className="border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200">
            CH 04 · Periodic Table
          </Badge>
        </div>

        {/* Property selector */}
        <div className="border-t border-white/5">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <Tabs value={trend} onValueChange={(v) => setTrend(v as TrendKey)}>
              <TabsList className="grid w-full grid-cols-2 gap-1 bg-white/5 md:grid-cols-4">
                {TREND_KEYS.map((k) => (
                  <TabsTrigger
                    key={k}
                    value={k}
                    className="text-xs data-[state=active]:bg-fuchsia-500/90 data-[state=active]:text-white md:text-sm"
                  >
                    <span className="hidden md:inline">{TREND_META[k].labelBn} · </span>
                    {TREND_META[k].labelEn}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">{meta.labelBn}</h1>
              <span className="text-sm text-slate-400">
                {meta.labelEn} ({meta.unit})
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400 md:text-sm">{meta.desc}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 md:py-7">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* LEFT: heatmap grid */}
          <Card className="border-white/10 bg-white/[0.03] p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-100">ট্রেন্ড হিটম্যাপ</div>
                <div className="text-xs text-slate-400">Elements 1–20 · Click to compare</div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>Low</span>
                <span className="h-2 w-20 rounded-full bg-gradient-to-r from-slate-700 via-fuchsia-500 to-yellow-300" />
                <span>High</span>
              </div>
            </div>

            <TrendGrid trend={trend} aZ={aZ} bZ={bZ} onPick={handlePick} />

            {/* Slot picker */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setPickSlot("a")}
                className={`rounded-lg border p-2 text-left transition-colors ${
                  pickSlot === "a"
                    ? "border-sky-400/50 bg-sky-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wide text-sky-300">Slot A</div>
                <div className="font-bold text-slate-100">
                  {elA.symbol} · {elA.nameBn}
                </div>
              </button>
              <button
                onClick={() => setPickSlot("b")}
                className={`rounded-lg border p-2 text-left transition-colors ${
                  pickSlot === "b"
                    ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wide text-fuchsia-300">Slot B</div>
                <div className="font-bold text-slate-100">
                  {elB.symbol} · {elB.nameBn}
                </div>
              </button>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              পরের ক্লিকটি{" "}
              <span className="font-semibold text-slate-200">Slot {pickSlot.toUpperCase()}</span>-এ
              যাবে।
            </div>

            {/* Quick presets */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { a: 11, b: 17, label: "Na ↔ Cl (Row)" },
                { a: 3, b: 11, label: "Li ↔ Na (Col)" },
                { a: 9, b: 17, label: "F ↔ Cl (Col)" },
                { a: 3, b: 9, label: "Li ↔ F (Row)" },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setAZ(p.a);
                    setBZ(p.b);
                  }}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300 hover:bg-white/[0.08]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Card>

          {/* RIGHT: zoom-in lab view */}
          <Card className="border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-100">Zoom-In Lab · পরমাণু গঠন</div>
              <Badge className="border border-white/10 bg-white/5 text-[10px] text-slate-300">
                {direction === "row" && (
                  <>
                    বাম → ডান <ArrowRight className="ml-1 h-3 w-3" />
                  </>
                )}
                {direction === "col" && (
                  <>
                    উপর → নিচ <ArrowDown className="ml-1 h-3 w-3" />
                  </>
                )}
                {direction === "diag" && "তির্যক তুলনা"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <AtomCard el={elA} trend={trend} accent="sky" />
              <AtomCard el={elB} trend={trend} accent="fuchsia" />
            </div>

            {/* Trend explanation */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-fuchsia-300">
                <Sparkles className="h-3.5 w-3.5" />
                {direction === "row"
                  ? "একই পর্যায়, ভিন্ন গ্রুপ"
                  : direction === "col"
                    ? "একই গ্রুপ, ভিন্ন পর্যায়"
                    : "তির্যক"}{" "}
                ট্রেন্ড
              </div>
              <div className="mt-1.5 text-xs text-slate-200 md:text-sm">
                {direction === "col" ? meta.colBn : meta.rowBn}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                {direction === "col" ? meta.colEn : meta.rowEn}
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom cause/effect card */}
        <Card className="mt-4 border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-sky-500/10 p-4 md:p-5">
          <div className="mb-2 text-sm font-semibold text-slate-100">
            কারণ ও প্রভাব · Cause &amp; Effect
          </div>
          <div className="grid gap-3 text-xs leading-relaxed text-slate-300 md:grid-cols-2 md:text-sm">
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-slate-100">আকার ছোট</span> ⟹ বাইরের ইলেকট্রন
                নিউক্লিয়াসের কাছাকাছি ⟹
                <span className="font-semibold text-slate-100"> আয়নীকরণ শক্তি বেশি</span> ⟹ নতুন
                ইলেকট্রনকে টানার ক্ষমতাও বেশি ⟹{" "}
                <span className="font-semibold text-slate-100">
                  তড়িৎ ঋণাত্মকতা ও ইলেকট্রন আসক্তি বৃদ্ধি
                </span>
                ।
              </p>
              <p className="text-slate-400">
                একই পর্যায়ে বাম থেকে ডানে প্রোটন বাড়ে কিন্তু শেল একই থাকে — ফলে নিউক্লিয়াসের টান
                বাড়ে এবং আকার কমে।
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-slate-100">Smaller Size</span> ⟹ outer electrons
                closer to nucleus ⟹
                <span className="font-semibold text-slate-100"> Higher Ionization Energy</span> ⟹
                stronger pull on new electrons ⟹{" "}
                <span className="font-semibold text-slate-100">
                  Higher Electronegativity &amp; Electron Affinity
                </span>
                .
              </p>
              <p className="text-slate-400">
                Down a group a new shell is added each period — outer electron is farther from the
                nucleus, so size grows and pull weakens.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Grid
// ─────────────────────────────────────────────────────────────

function TrendGrid({
  trend,
  aZ,
  bZ,
  onPick,
}: {
  trend: TrendKey;
  aZ: number;
  bZ: number;
  onPick: (el: TrendElement) => void;
}) {
  const norm = useMemo(() => normalised(trend), [trend]);

  return (
    <div className="grid grid-cols-8 gap-1.5">
      {GRID_PERIODS.flatMap((p) =>
        GRID_GROUPS.map((g) => {
          const el = elementAt(p, g);
          if (!el) {
            return <div key={`${p}-${g}`} className="aspect-square" />;
          }
          const n = norm(el[trend]);
          const selected = el.Z === aZ || el.Z === bZ;
          const slot = el.Z === aZ ? "A" : el.Z === bZ ? "B" : null;

          // For atomic-size trend, scale the inner dot.
          const sizeScale = trend === "radius" ? 0.5 + n * 0.5 : 1;

          return (
            <button
              key={el.Z}
              onClick={() => onPick(el)}
              className={`group relative aspect-square rounded-md border text-center transition-all ${
                selected
                  ? slot === "A"
                    ? "border-sky-400 ring-2 ring-sky-400/40"
                    : "border-fuchsia-400 ring-2 ring-fuchsia-400/40"
                  : "border-white/10 hover:border-white/30"
              }`}
              style={{ backgroundColor: heatColor(n) }}
              title={`${el.symbol} · ${el.name} — ${el[trend]} ${TREND_META[trend].unit}`}
            >
              <div
                className="absolute inset-0 m-auto rounded-full bg-white/15 transition-transform"
                style={{
                  width: `${sizeScale * 80}%`,
                  height: `${sizeScale * 80}%`,
                }}
              />
              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center leading-tight">
                <div className="text-[9px] opacity-80">{el.Z}</div>
                <div className="text-xs font-extrabold md:text-sm">{el.symbol}</div>
                <div className="text-[8px] opacity-80 md:text-[9px]">{Math.round(el[trend])}</div>
              </div>
              {slot && (
                <div
                  className={`absolute -top-1 -right-1 h-4 w-4 rounded-full text-[9px] font-bold leading-4 text-white ${
                    slot === "A" ? "bg-sky-500" : "bg-fuchsia-500"
                  }`}
                >
                  {slot}
                </div>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}

// Heat color from 0 (cool slate) → 1 (bright yellow), via fuchsia.
function heatColor(t: number): string {
  // Clamp
  const x = Math.max(0, Math.min(1, t));
  // Stops: 0 → slate-800, 0.5 → fuchsia-600, 1 → yellow-300
  if (x < 0.5) {
    const k = x / 0.5;
    return mix("#1e293b", "#c026d3", k);
  }
  const k = (x - 0.5) / 0.5;
  return mix("#c026d3", "#fde047", k);
}

function mix(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r} ${g} ${bl})`;
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.substring(0, 2), 16),
    g: parseInt(m.substring(2, 4), 16),
    b: parseInt(m.substring(4, 6), 16),
  };
}

// ─────────────────────────────────────────────────────────────
// Atom card with animated shells + pull-arrow
// ─────────────────────────────────────────────────────────────

function AtomCard({
  el,
  trend,
  accent,
}: {
  el: TrendElement;
  trend: TrendKey;
  accent: "sky" | "fuchsia";
}) {
  const ringColor = accent === "sky" ? "stroke-sky-400/40" : "stroke-fuchsia-400/40";
  const glowColor = accent === "sky" ? "#38bdf8" : "#e879f9";
  const meta = TREND_META[trend];

  // Outermost shell radius shrinks for higher Z within the same period
  // (visualises “stronger pull → smaller atom”).
  const shellRadii = computeShellRadii(el);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 p-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
            Z = {el.Z} · Period {el.period} · Group {el.group}
          </div>
          <div className="text-lg font-extrabold text-slate-100">
            {el.symbol} <span className="text-xs font-medium text-slate-400">{el.nameBn}</span>
          </div>
        </div>
        <Badge
          className={`border-0 text-[10px] ${
            accent === "sky" ? "bg-sky-500/20 text-sky-200" : "bg-fuchsia-500/20 text-fuchsia-200"
          }`}
        >
          {meta.labelEn}: {el[trend]} {meta.unit}
        </Badge>
      </div>

      {/* SVG zoom-in */}
      <div className="relative mt-2 aspect-square w-full">
        <svg viewBox="0 0 240 240" className="h-full w-full">
          <defs>
            <radialGradient id={`nuc-${el.Z}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={glowColor} stopOpacity="1" />
              <stop offset="60%" stopColor={glowColor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Shells */}
          {el.shells.map((count, i) => {
            const r = shellRadii[i];
            const isOuter = i === el.shells.length - 1;
            return (
              <g key={i}>
                <circle
                  cx={120}
                  cy={120}
                  r={r}
                  fill="none"
                  strokeDasharray="3 4"
                  strokeWidth={isOuter ? 1.6 : 1}
                  className={isOuter ? ringColor : "stroke-white/15"}
                />
                {/* Pulling-force arrow on the outermost shell */}
                {isOuter && (
                  <line
                    x1={120 + r * 0.92}
                    y1={120}
                    x2={120 + 18}
                    y2={120}
                    stroke={glowColor}
                    strokeWidth={1.5}
                    strokeDasharray="2 3"
                    markerEnd="url(#arrow)"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.2;1;0.2"
                      dur="1.6s"
                      repeatCount="indefinite"
                    />
                  </line>
                )}
                {/* Electrons distributed around the shell */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 120 120`}
                    to={`${i % 2 === 0 ? 360 : -360} 120 120`}
                    dur={`${8 + i * 3}s`}
                    repeatCount="indefinite"
                  />
                  {Array.from({ length: count }).map((_, k) => {
                    const angle = (2 * Math.PI * k) / count;
                    const x = 120 + r * Math.cos(angle);
                    const y = 120 + r * Math.sin(angle);
                    return (
                      <circle
                        key={k}
                        cx={x}
                        cy={y}
                        r={isOuter ? 4 : 3}
                        fill={isOuter ? "#facc15" : "#fde68a"}
                        stroke={isOuter ? "#ef4444" : "transparent"}
                        strokeWidth={isOuter ? 1.2 : 0}
                      />
                    );
                  })}
                </g>
              </g>
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={glowColor} />
            </marker>
          </defs>

          {/* Nucleus */}
          <circle cx="120" cy="120" r="28" fill={`url(#nuc-${el.Z})`}>
            <animate attributeName="r" values="26;30;26" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="120" cy="120" r="18" fill={glowColor} opacity="0.9" />
          <text
            x="120"
            y="124"
            textAnchor="middle"
            className="fill-white font-bold"
            style={{ fontSize: 13 }}
          >
            +{el.Z}
          </text>
        </svg>
      </div>

      <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[10px] text-slate-400">
        <div>
          <div className="font-semibold text-slate-200">{el.shells.length}</div>
          <div>shells</div>
        </div>
        <div>
          <div className="font-semibold text-slate-200">{el.shells[el.shells.length - 1]}</div>
          <div>valence</div>
        </div>
        <div>
          <div className="font-semibold text-slate-200">{el.radius}</div>
          <div>radius (pm)</div>
        </div>
      </div>
    </div>
  );
}

// Map element to visual shell radii. Outer shell shrinks as Z grows within
// a period (mirrors the real "more protons → tighter pull" effect), and the
// number of rings reflects the actual shell count.
function computeShellRadii(el: TrendElement): number[] {
  // Base outer radius depending on period (more periods → larger atom canvas)
  const periodBase = [0, 50, 70, 90, 105][el.period] ?? 95;
  // Position within row (1=leftmost, 8=rightmost) → shrink factor
  const colIndex = GRID_GROUPS.indexOf(el.group);
  const shrink = 1 - colIndex * 0.045; // up to ~32% shrink on the right
  const outer = Math.max(40, periodBase * shrink);

  const count = el.shells.length;
  if (count === 1) return [outer];
  const inner = 28; // just outside nucleus
  const step = (outer - inner) / Math.max(1, count - 1);
  return Array.from({ length: count }, (_, i) => inner + step * i);
}
