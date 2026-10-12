/**
 * Heating Curve of Water Simulator
 * Chapter 2 · পদার্থের অবস্থা · পানির তাপন বক্ররেখা
 *
 * 5 phases:
 *   1. Solid ice heating (-20 → 0 °C)
 *   2. Melting (0 °C constant — latent heat of fusion)
 *   3. Liquid water heating (0 → 100 °C)
 *   4. Boiling (100 °C constant — latent heat of vaporization)
 *   5. Steam heating (100 → 120 °C)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Thermometer,
  Snowflake,
  Droplets,
  Wind,
} from "lucide-react";

type Phase = 1 | 2 | 3 | 4 | 5;
type Point = { t: number; T: number; phase: Phase };

// Durations (seconds of simulated time) for each phase — picked so that
// the latent-heat plateaus are visibly long compared to the heating ramps.
const DUR: Record<Phase, number> = {
  1: 8, // ice -20 → 0
  2: 12, // melt
  3: 16, // water 0 → 100
  4: 20, // boil
  5: 6, // steam 100 → 120
};
const T_START = -20;
const T_END = 120;

// Convert a continuous simulated time t (s) to (T °C, phase).
function tempAt(t: number): { T: number; phase: Phase } {
  let c = 0;
  if (t <= (c += DUR[1])) {
    const f = (t - (c - DUR[1])) / DUR[1];
    return { T: -20 + f * 20, phase: 1 };
  }
  if (t <= (c += DUR[2])) return { T: 0, phase: 2 };
  if (t <= (c += DUR[3])) {
    const f = (t - (c - DUR[3])) / DUR[3];
    return { T: 0 + f * 100, phase: 3 };
  }
  if (t <= (c += DUR[4])) return { T: 100, phase: 4 };
  const last = c;
  const f = Math.min(1, (t - last) / DUR[5]);
  return { T: 100 + f * 20, phase: 5 };
}

const TOTAL = DUR[1] + DUR[2] + DUR[3] + DUR[4] + DUR[5];

const PHASE_INFO: Record<Phase, { bn: string; en: string; tint: string }> = {
  1: { bn: "কঠিন বরফ উত্তপ্ত হচ্ছে", en: "Solid ice heating", tint: "from-sky-500 to-cyan-500" },
  2: {
    bn: "গলন · লীনতাপ ব্যবহৃত হচ্ছে",
    en: "Melting · latent heat of fusion",
    tint: "from-blue-500 to-indigo-500",
  },
  3: {
    bn: "তরল পানি উত্তপ্ত হচ্ছে",
    en: "Liquid water heating",
    tint: "from-cyan-500 to-teal-500",
  },
  4: {
    bn: "স্ফুটন · বাষ্পীভবনের লীনতাপ",
    en: "Boiling · latent heat of vaporization",
    tint: "from-orange-500 to-rose-500",
  },
  5: { bn: "বাষ্প উত্তপ্ত হচ্ছে", en: "Steam heating", tint: "from-rose-500 to-pink-500" },
};

export default function HeatingCurveLab({ onBack }: { onBack: () => void }) {
  const [running, setRunning] = useState(false);
  const [simT, setSimT] = useState(0); // simulated time in seconds
  const [data, setData] = useState<Point[]>([{ t: 0, T: T_START, phase: 1 }]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  const { T, phase } = tempAt(simT);
  const done = simT >= TOTAL;

  // Animation loop
  useEffect(() => {
    if (!running || done) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setSimT((prev) => {
        const next = Math.min(TOTAL, prev + dt * 1.0); // 1× real-time
        const cur = tempAt(next);
        setData((d) => {
          const last = d[d.length - 1];
          // Sample every ~0.15 s simulated time to keep chart light
          if (next - last.t < 0.15 && next < TOTAL) return d;
          return [...d, { t: +next.toFixed(2), T: +cur.T.toFixed(2), phase: cur.phase }];
        });
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, done]);

  useEffect(() => {
    if (done) setRunning(false);
  }, [done]);

  const reset = useCallback(() => {
    setRunning(false);
    setSimT(0);
    setData([{ t: 0, T: T_START, phase: 1 }]);
  }, []);

  const toggle = useCallback(() => {
    if (done) return;
    setRunning((r) => !r);
  }, [done]);

  const info = PHASE_INFO[phase];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 dark:from-slate-950 dark:via-background dark:to-orange-950/20">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 shadow-md">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight">পানির তাপন বক্ররেখা</div>
              <div className="text-[11px] text-muted-foreground">
                Heating Curve of Water · Phase Changes
              </div>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex border border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300"
          >
            অধ্যায় ২ · পদার্থের অবস্থা
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid gap-4 lg:grid-cols-2">
        {/* Left: experiment */}
        <Card className="p-4 md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">পরীক্ষণ · The Experiment</div>
            <Badge className={`bg-gradient-to-r text-white border-0 ${info.tint}`}>
              Phase {phase}
            </Badge>
          </div>

          <BeakerScene phase={phase} T={T} running={running} />

          {/* Latent heat notices */}
          {(phase === 2 || phase === 4) && (
            <div
              className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed animate-pulse ${
                phase === 2
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-200"
                  : "border-orange-500/30 bg-orange-500/10 text-orange-800 dark:text-orange-200"
              }`}
            >
              <strong className="font-bold">
                {phase === 2 ? "লীনতাপ (গলন): " : "স্ফুটনাঙ্ক ও লীনতাপ: "}
              </strong>
              {phase === 2
                ? "তাপ অবস্থার পরিবর্তনে (বরফ → পানি) ব্যবহৃত হচ্ছে, তাই তাপমাত্রা বাড়ছে না।"
                : "পানি গ্যাসে রূপান্তরিত হচ্ছে — সমস্ত তাপ বাষ্পীভবনের লীনতাপ হিসেবে ব্যয় হচ্ছে।"}
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              onClick={toggle}
              disabled={done}
              className={`gap-1.5 ${running ? "bg-amber-600 hover:bg-amber-700" : "bg-rose-600 hover:bg-rose-700"}`}
            >
              {running ? (
                <>
                  <Pause className="h-4 w-4" /> থামান
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" /> {simT === 0 ? "বার্নার চালু করুন" : "চালিয়ে যান"}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={reset} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <Thermometer className="h-4 w-4 text-rose-500" />
              <span className="font-mono tabular-nums font-bold">{T.toFixed(1)} °C</span>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            <span
              className={`inline-block h-2 w-2 rounded-full mr-1.5 align-middle ${running ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`}
            />
            {info.bn} · <span className="text-foreground/60">{info.en}</span>
          </div>
        </Card>

        {/* Right: chart */}
        <Card className="p-4 md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">রিয়েল-টাইম গ্রাফ · T vs t</div>
            <div className="text-[11px] text-muted-foreground">
              {simT.toFixed(1)} s / {TOTAL.toFixed(0)} s
            </div>
          </div>
          <div className="h-[360px] md:h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="curveStroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  type="number"
                  dataKey="t"
                  domain={[0, TOTAL]}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "Time (s) →",
                    position: "insideBottom",
                    offset: -2,
                    fontSize: 11,
                  }}
                />
                <YAxis
                  domain={[-20, 120]}
                  ticks={[-20, 0, 20, 40, 60, 80, 100, 120]}
                  tick={{ fontSize: 11 }}
                  label={{ value: "T (°C)", angle: -90, position: "insideLeft", fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload as Point;
                    const inf = PHASE_INFO[p.phase];
                    const note =
                      p.phase === 2
                        ? "গলনাঙ্ক (0 °C) — লীনতাপ শোষিত হচ্ছে, তাপমাত্রা ধ্রুব।"
                        : p.phase === 4
                          ? "স্ফুটনাঙ্ক (100 °C) — বাষ্পীভবনের লীনতাপ, তাপমাত্রা ধ্রুব।"
                          : inf.bn;
                    return (
                      <div className="rounded-md border bg-background/95 px-2.5 py-1.5 text-xs shadow-lg">
                        <div className="font-mono font-semibold">
                          t = {p.t.toFixed(1)} s · T = {p.T.toFixed(1)} °C
                        </div>
                        <div className="text-muted-foreground mt-0.5 max-w-[220px]">{note}</div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  label={{
                    value: "গলনাঙ্ক 0°C",
                    fontSize: 10,
                    fill: "#3b82f6",
                    position: "insideTopLeft",
                  }}
                />
                <ReferenceLine
                  y={100}
                  stroke="#f97316"
                  strokeDasharray="4 4"
                  label={{
                    value: "স্ফুটনাঙ্ক 100°C",
                    fontSize: 10,
                    fill: "#f97316",
                    position: "insideTopLeft",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="T"
                  stroke="url(#curveStroke)"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Phase legend */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-[10px]">
            {([1, 2, 3, 4, 5] as Phase[]).map((p) => {
              const inf = PHASE_INFO[p];
              return (
                <div
                  key={p}
                  className={`rounded-md border px-2 py-1.5 leading-tight ${phase === p ? "ring-2 ring-rose-500/40 bg-muted" : "bg-background"}`}
                >
                  <div
                    className={`text-[9px] font-bold uppercase tracking-wide bg-gradient-to-r bg-clip-text text-transparent ${inf.tint}`}
                  >
                    Phase {p}
                  </div>
                  <div className="font-medium">{inf.bn}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beaker visualisation
// ─────────────────────────────────────────────────────────────

function BeakerScene({ phase, T, running }: { phase: Phase; T: number; running: boolean }) {
  // Liquid fill height grows as ice melts and shrinks as water boils away.
  const liquidH =
    phase === 1
      ? 0
      : phase === 2
        ? 50 + (T === 0 ? 0 : 0) // grows visually with melt fraction handled separately
        : phase === 3
          ? 100
          : phase === 4
            ? Math.max(20, 100 - ((T - 100) * 0 + simBoilOff(phase)))
            : 0;

  return (
    <div className="relative h-[300px] md:h-[340px] w-full rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Steam */}
      {(phase === 4 || phase === 5) && <SteamCloud heavy={phase === 5} />}

      {/* Thermometer */}
      <div className="absolute top-3 right-4 flex flex-col items-center">
        <div className="text-[10px] text-muted-foreground mb-1">🌡 Digital</div>
        <div className="rounded-md border bg-background px-2 py-1 font-mono text-xs font-bold tabular-nums shadow">
          {T.toFixed(1)} °C
        </div>
      </div>

      {/* Beaker */}
      <div className="absolute left-1/2 top-[20px] -translate-x-1/2 w-[170px] h-[200px]">
        <svg viewBox="0 0 170 200" className="w-full h-full">
          {/* Beaker outline */}
          <path
            d="M 25 10 L 25 175 Q 25 190 40 190 L 130 190 Q 145 190 145 175 L 145 10"
            fill="rgba(255,255,255,0.06)"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="2"
          />
          {/* Scale marks */}
          {[40, 70, 100, 130, 160].map((y) => (
            <line
              key={y}
              x1="30"
              y1={y}
              x2="40"
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1"
            />
          ))}

          {/* Phase 1: solid ice cubes */}
          {phase === 1 && <IceCubes />}

          {/* Phase 2: melting */}
          {phase === 2 && <MeltingIce simT={T} />}

          {/* Phase 3 & part of 4: liquid water */}
          {(phase === 3 || phase === 4) && (
            <LiquidWater
              level={phase === 3 ? Math.max(40, 170 - (T / 100) * 5) : 70}
              boiling={phase === 4}
            />
          )}

          {/* Thermometer probe */}
          <line
            x1="85"
            y1="0"
            x2="85"
            y2="170"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle
            cx="85"
            cy="172"
            r="6"
            fill={phase >= 4 ? "#f97316" : phase >= 3 ? "#06b6d4" : "#3b82f6"}
          />
        </svg>
      </div>

      {/* Tripod + Bunsen Burner */}
      <div className="absolute left-1/2 bottom-3 -translate-x-1/2 flex flex-col items-center">
        <div className="w-[130px] h-[2px] bg-slate-500/60" />
        <div className="flex gap-12 -mt-[2px]">
          <div className="w-[3px] h-[26px] bg-slate-500/60 rotate-[8deg] origin-top" />
          <div className="w-[3px] h-[26px] bg-slate-500/60 -rotate-[8deg] origin-top" />
        </div>
        {/* Flame */}
        <div className="relative mt-1 h-[40px] w-[26px]">
          {running ? (
            <>
              <div className="absolute inset-x-0 bottom-0 mx-auto h-[40px] w-[18px] rounded-full bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent animate-pulse" />
              <div className="absolute inset-x-0 bottom-0 mx-auto h-[28px] w-[10px] rounded-full bg-gradient-to-t from-blue-500 via-cyan-400 to-transparent opacity-80" />
            </>
          ) : (
            <div className="absolute inset-x-0 bottom-0 mx-auto h-[10px] w-[14px] rounded-sm bg-slate-600" />
          )}
        </div>
        <div className="mt-1 h-[10px] w-[40px] rounded-sm bg-slate-700" />
      </div>
    </div>
  );
}

function simBoilOff(phase: Phase) {
  return phase === 5 ? 100 : 30;
}

function IceCubes() {
  return (
    <g>
      {[
        { x: 40, y: 140 },
        { x: 70, y: 150 },
        { x: 100, y: 140 },
        { x: 55, y: 115 },
        { x: 95, y: 115 },
        { x: 75, y: 90 },
      ].map((c, i) => (
        <rect
          key={i}
          x={c.x}
          y={c.y}
          width="22"
          height="22"
          rx="3"
          fill="#bae6fd"
          stroke="#0ea5e9"
          strokeOpacity="0.6"
          strokeWidth="1.2"
          opacity="0.9"
        />
      ))}
    </g>
  );
}

function MeltingIce({ simT }: { simT: number }) {
  // simT here is T (=0); use a time-based shrink isn't trivial — keep some cubes + rising water.
  return (
    <g>
      <rect x="28" y="120" width="115" height="70" fill="#7dd3fc" opacity="0.55" />
      {/* meniscus */}
      <path
        d="M 28 120 Q 85 116 142 120"
        stroke="#0284c7"
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      {[
        { x: 50, y: 95 },
        { x: 85, y: 90 },
        { x: 110, y: 100 },
      ].map((c, i) => (
        <rect
          key={i}
          x={c.x}
          y={c.y}
          width="20"
          height="20"
          rx="3"
          fill="#bae6fd"
          stroke="#0ea5e9"
          strokeOpacity="0.6"
          strokeWidth="1.2"
          opacity={0.85}
        />
      ))}
    </g>
  );
}

function LiquidWater({ level, boiling }: { level: number; boiling: boolean }) {
  return (
    <g>
      <rect x="28" y={level} width="115" height={190 - level} fill="#67e8f9" opacity="0.55" />
      <path
        d={`M 28 ${level} Q 85 ${level - 3} 142 ${level}`}
        stroke="#0e7490"
        strokeWidth="1.2"
        fill="none"
        opacity="0.65"
      />
      {boiling && (
        <g>
          {Array.from({ length: 14 }).map((_, i) => {
            const x = 35 + ((i * 9) % 100);
            const baseY = 180 - (i % 5) * 10;
            return (
              <circle key={i} cx={x} cy={baseY} r={2 + (i % 3)} fill="white" opacity={0.85}>
                <animate
                  attributeName="cy"
                  values={`${baseY};${level + 5}`}
                  dur={`${0.8 + (i % 5) * 0.2}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.9;0"
                  dur={`${0.8 + (i % 5) * 0.2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}
        </g>
      )}
    </g>
  );
}

function SteamCloud({ heavy }: { heavy: boolean }) {
  const n = heavy ? 18 : 10;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[200px] overflow-hidden">
      {Array.from({ length: n }).map((_, i) => {
        const left = 30 + ((i * 37) % 240);
        const delay = (i * 0.3) % 4;
        const size = heavy ? 28 + (i % 4) * 6 : 18 + (i % 3) * 4;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-white/60 dark:bg-white/30 blur-[6px] animate-[steam_4s_ease-in_infinite]"
            style={{
              width: size,
              height: size,
              left,
              bottom: 0,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes steam {
          0%   { transform: translateY(0) scale(0.8); opacity: 0; }
          20%  { opacity: 0.9; }
          100% { transform: translateY(-200px) scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
