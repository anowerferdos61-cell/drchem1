/**
 * Rutherford vs. Bohr Atom Model Face-off
 * Chapter 3 — interactive comparison simulator.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, RotateCcw, AlertTriangle, Sparkles, Atom as AtomIcon } from "lucide-react";

type Props = { onBack: () => void };

const NUCLEUS = { cx: 200, cy: 200 };

export default function AtomModelsLab({ onBack }: Props) {
  // ── Rutherford: collapse animation ──────────────────────────
  const [collapseT, setCollapseT] = useState(0); // 0..1 progress
  const [collapsePlaying, setCollapsePlaying] = useState(true);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!collapsePlaying) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setCollapseT((t) => {
        const next = t + dt * 0.18;
        if (next >= 1) return 0; // loop
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [collapsePlaying]);

  // ── Bohr: electron level + photon animation ─────────────────
  const [electronLevel, setElectronLevel] = useState<1 | 2 | 3>(1);
  const [photonPhase, setPhotonPhase] = useState<"idle" | "absorb" | "emit">("idle");
  const [message, setMessage] = useState<string>(
    "নিম্ন শক্তিস্তরে (n=1) ইলেকট্রন স্থির — শক্তি দিন!",
  );

  const excite = useCallback(() => {
    if (electronLevel >= 3) {
      setMessage("ইলেকট্রন ইতোমধ্যে সর্বোচ্চ স্তরে — Relax চাপুন।");
      return;
    }
    setPhotonPhase("absorb");
    setMessage("⚡ ইলেকট্রন ফোটন শোষণ করছে! (Quantum Jump)");
    window.setTimeout(() => {
      setElectronLevel((lvl) => (lvl < 3 ? ((lvl + 1) as 1 | 2 | 3) : lvl));
      setPhotonPhase("idle");
      setMessage("উচ্চতর শক্তিস্তরে পৌঁছেছে — Relax চাপলে আলো নিঃসৃত হবে।");
    }, 900);
  }, [electronLevel]);

  const relax = useCallback(() => {
    if (electronLevel <= 1) {
      setMessage("ইলেকট্রন ইতিমধ্যে সর্বনিম্ন স্তরে — Energy চাপুন।");
      return;
    }
    setPhotonPhase("emit");
    setMessage("💡 ইলেকট্রন আলো (photon) নিঃসরণ করছে!");
    window.setTimeout(() => {
      setElectronLevel((lvl) => (lvl > 1 ? ((lvl - 1) as 1 | 2 | 3) : lvl));
      setPhotonPhase("idle");
      setMessage("নিম্নতর স্তরে ফিরেছে — আবার Energy দিন।");
    }, 900);
  }, [electronLevel]);

  const reset = useCallback(() => {
    setElectronLevel(1);
    setPhotonPhase("idle");
    setMessage("রিসেট সম্পন্ন। শক্তি দিয়ে quantum jump দেখুন।");
  }, []);

  // ── Rutherford spiral position ──────────────────────────────
  // Electron starts at r=140, ellipse, spirals into nucleus
  const collapseR = 140 * (1 - collapseT);
  const collapseAngle = collapseT * Math.PI * 8; // 4 full revolutions
  const collEx = NUCLEUS.cx + collapseR * Math.cos(collapseAngle);
  const collEy = NUCLEUS.cy + collapseR * 0.7 * Math.sin(collapseAngle);

  // Bohr shell radii
  const SHELLS = { 1: 60, 2: 100, 3: 145 } as const;
  const electronR = SHELLS[electronLevel];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-200 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" /> ড্যাশবোর্ড
            </Button>
            <div className="hidden md:block h-6 w-px bg-white/10" />
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight md:text-lg">
                Rutherford vs. Bohr — Atom Model Face-off
              </div>
              <div className="text-[11px] text-slate-400">
                রাদারফোর্ড বনাম বোর পরমাণু মডেল · NCTB Class 9-10
              </div>
            </div>
          </div>
          <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
            <AtomIcon className="mr-1 h-3.5 w-3.5" /> Chapter 3
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Split panels */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* RUTHERFORD */}
          <Card className="overflow-hidden border-rose-500/30 bg-gradient-to-br from-rose-950/60 to-slate-950/80 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-rose-300/80">Left Panel</div>
                <h2 className="text-lg font-bold text-rose-100">
                  রাদারফোর্ড মডেল{" "}
                  <span className="text-rose-300/70 text-sm">(Solar System Analogy)</span>
                </h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCollapsePlaying((p) => !p)}
                className="border-rose-400/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
              >
                {collapsePlaying ? "⏸ Pause" : "▶ Play"}
              </Button>
            </div>

            <div className="relative rounded-xl border border-rose-500/20 bg-slate-950/60 p-2">
              <svg viewBox="0 0 400 400" className="h-[340px] w-full">
                {/* grid bg */}
                <defs>
                  <radialGradient id="nucR" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="60%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </radialGradient>
                  <pattern id="gridR" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="400" height="400" fill="url(#gridR)" />

                {/* Random elliptical orbits (overlapping, arbitrary) */}
                <g fill="none" stroke="rgba(244,114,182,0.35)" strokeDasharray="3 3">
                  <ellipse cx="200" cy="200" rx="140" ry="90" transform="rotate(20 200 200)" />
                  <ellipse cx="200" cy="200" rx="120" ry="70" transform="rotate(-35 200 200)" />
                  <ellipse cx="200" cy="200" rx="155" ry="55" transform="rotate(70 200 200)" />
                  <ellipse cx="200" cy="200" rx="100" ry="100" transform="rotate(0 200 200)" />
                </g>

                {/* Static electrons on random orbits */}
                <Electron x={310} y={220} />
                <Electron x={120} y={140} />
                <Electron x={250} y={320} />

                {/* Spiraling electron (animation) */}
                <line
                  x1={collEx}
                  y1={collEy}
                  x2={NUCLEUS.cx}
                  y2={NUCLEUS.cy}
                  stroke="rgba(244,63,94,0.45)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <Electron x={collEx} y={collEy} glow="rose" />

                {/* Dense nucleus */}
                <circle cx={NUCLEUS.cx} cy={NUCLEUS.cy} r="22" fill="url(#nucR)" />
                <circle
                  cx={NUCLEUS.cx}
                  cy={NUCLEUS.cy}
                  r="22"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
                <text
                  x={NUCLEUS.cx}
                  y={NUCLEUS.cy + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#7c2d12"
                >
                  Nucleus
                </text>

                {/* Collapse warning at end */}
                {collapseT > 0.85 && (
                  <g>
                    <text
                      x="200"
                      y="50"
                      textAnchor="middle"
                      fontSize="22"
                      fontWeight="900"
                      fill="#fb7185"
                    >
                      ✕
                    </text>
                  </g>
                )}
              </svg>

              <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <div>
                  <div className="font-bold">LIMITATION: Instability</div>
                  <div className="opacity-90">
                    ত্বরিত ইলেকট্রন শক্তি বিকিরণ করে spiraling হয়ে নিউক্লিয়াসে collapse করার কথা —
                    কিন্তু বাস্তবে পরমাণু স্থিতিশীল! এটি রাদারফোর্ড মডেলের প্রধান সীমাবদ্ধতা।
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* BOHR */}
          <Card className="overflow-hidden border-cyan-500/30 bg-gradient-to-br from-cyan-950/60 to-slate-950/80 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-cyan-300/80">Right Panel</div>
                <h2 className="text-lg font-bold text-cyan-100">
                  বোর মডেল <span className="text-cyan-300/70 text-sm">(Discrete Orbits)</span>
                </h2>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={excite}
                  disabled={photonPhase !== "idle"}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  <Zap className="h-4 w-4" /> Energy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={relax}
                  disabled={photonPhase !== "idle"}
                  className="border-cyan-400/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                >
                  <Sparkles className="h-4 w-4" /> Relax
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={reset}
                  className="text-cyan-200 hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative rounded-xl border border-cyan-500/20 bg-slate-950/60 p-2">
              <svg viewBox="0 0 400 400" className="h-[340px] w-full">
                <defs>
                  <radialGradient id="nucB" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="60%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" />
                  </radialGradient>
                  <pattern id="gridB" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="400" height="400" fill="url(#gridB)" />

                {/* Discrete circular shells */}
                {([1, 2, 3] as const).map((n) => (
                  <g key={n}>
                    <circle
                      cx={NUCLEUS.cx}
                      cy={NUCLEUS.cy}
                      r={SHELLS[n]}
                      fill="none"
                      stroke="rgba(34,211,238,0.55)"
                      strokeWidth="1.5"
                    />
                    <text
                      x={NUCLEUS.cx + SHELLS[n] + 8}
                      y={NUCLEUS.cy + 4}
                      fontSize="11"
                      fontWeight="600"
                      fill="#67e8f9"
                    >
                      n={n} ({n === 1 ? "K" : n === 2 ? "L" : "M"})
                    </text>
                  </g>
                ))}

                {/* Stationary electron on n=2 */}
                <Electron x={NUCLEUS.cx - SHELLS[2]} y={NUCLEUS.cy} glow="cyan" />

                {/* Active animated electron */}
                <g
                  style={{
                    transition: "transform 0.7s cubic-bezier(.5,-0.2,.5,1.4)",
                  }}
                >
                  <Electron x={NUCLEUS.cx + electronR} y={NUCLEUS.cy} glow="yellow" big />
                </g>

                {/* Photon animation */}
                {photonPhase === "absorb" && <PhotonWave direction="in" />}
                {photonPhase === "emit" && <PhotonWave direction="out" />}

                {/* Nucleus */}
                <circle cx={NUCLEUS.cx} cy={NUCLEUS.cy} r="22" fill="url(#nucB)" />
                <text
                  x={NUCLEUS.cx}
                  y={NUCLEUS.cy + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#7c2d12"
                >
                  Nucleus
                </text>
              </svg>

              <div className="mt-2 space-y-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-100">
                <div className="font-semibold">{message}</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge className="bg-cyan-500/20 text-cyan-100 border-cyan-400/30">
                    Current: n={electronLevel} (
                    {electronLevel === 1 ? "K" : electronLevel === 2 ? "L" : "M"})
                  </Badge>
                  <Badge className="bg-amber-500/20 text-amber-100 border-amber-400/30">
                    Photon: hν = E_high − E_low
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Comparison Table */}
        <Card className="border-white/10 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-base font-bold text-slate-100">
            তুলনামূলক বিশ্লেষণ · Comparison Table
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="p-3 text-slate-400 font-semibold">বৈশিষ্ট্য / Feature</th>
                  <th className="p-3 text-rose-300 font-semibold">Rutherford (রাদারফোর্ড)</th>
                  <th className="p-3 text-cyan-300 font-semibold">Bohr (বোর)</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {[
                  {
                    f: "কক্ষপথ (Orbits)",
                    r: "যেকোনো আকারের, এলোমেলো, উপবৃত্তাকার — non-discrete।",
                    b: "নির্দিষ্ট বৃত্তাকার শক্তিস্তর (n=1, 2, 3…) — discrete & stationary।",
                  },
                  {
                    f: "স্থিতিশীলতা (Stability)",
                    r: "ত্বরিত ইলেকট্রন শক্তি হারিয়ে নিউক্লিয়াসে পড়ে যাওয়ার কথা — পরমাণু অস্থিতিশীল!",
                    b: "নির্দিষ্ট কক্ষপথে ঘূর্ণায়মান অবস্থায় ইলেকট্রন শক্তি হারায় না — পরমাণু স্থিতিশীল।",
                  },
                  {
                    f: "শক্তি নিঃসরণ (Energy Emission)",
                    r: "ধারাবাহিকভাবে শক্তি বিকিরণ — continuous spectrum হবার কথা।",
                    b: "শুধু কক্ষপথ পরিবর্তনের সময় নির্দিষ্ট ফোটন শোষণ/নিঃসরণ — line spectrum।",
                  },
                  {
                    f: "ব্যাখ্যা ক্ষমতা",
                    r: "Hydrogen spectrum ব্যাখ্যা করতে পারে না।",
                    b: "Hydrogen spectrum সফলভাবে ব্যাখ্যা করে।",
                  },
                ].map((row) => (
                  <tr key={row.f} className="border-b border-white/5 align-top">
                    <td className="p-3 font-semibold text-slate-300">{row.f}</td>
                    <td className="p-3 text-rose-100/90">{row.r}</td>
                    <td className="p-3 text-cyan-100/90">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
            <LegendDot color="bg-amber-400" label="Nucleus (Proton+Neutron)" />
            <LegendDot color="bg-yellow-300" label="Electron (e⁻)" />
            <LegendDot color="bg-cyan-300" label="Bohr Shell (n=1,2,3)" />
            <LegendDot color="bg-rose-400" label="Photon / Light Packet" />
          </div>
        </Card>
      </main>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────
function Electron({
  x,
  y,
  glow = "yellow",
  big = false,
}: {
  x: number;
  y: number;
  glow?: "yellow" | "rose" | "cyan";
  big?: boolean;
}) {
  const color = glow === "rose" ? "#fb7185" : glow === "cyan" ? "#67e8f9" : "#fde047";
  return (
    <g>
      <circle cx={x} cy={y} r={big ? 9 : 6} fill={color} opacity="0.25" />
      <circle cx={x} cy={y} r={big ? 6 : 4.5} fill={color} />
      <circle
        cx={x}
        cy={y}
        r={big ? 6 : 4.5}
        fill="none"
        stroke="#fff"
        strokeWidth="0.6"
        opacity="0.9"
      />
    </g>
  );
}

function PhotonWave({ direction }: { direction: "in" | "out" }) {
  // Simple wavy arrow from outside → nucleus area (in), or outward (out).
  const from = direction === "in" ? { x: 370, y: 60 } : { x: NUCLEUS.cx, y: NUCLEUS.cy };
  const to = direction === "in" ? { x: NUCLEUS.cx + 40, y: NUCLEUS.cy - 30 } : { x: 30, y: 60 };

  // Generate a wavy path between from and to
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const segs = 14;
  const nx = -dy / len;
  const ny = dx / len;
  let d = `M ${from.x} ${from.y}`;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const bx = from.x + dx * t;
    const by = from.y + dy * t;
    const amp = Math.sin(t * Math.PI * 4) * 6;
    d += ` L ${bx + nx * amp} ${by + ny * amp}`;
  }

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={direction === "in" ? "#fbbf24" : "#f9a8d4"}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{
          strokeDasharray: 6,
          animation: "photonDash 0.9s linear",
        }}
      />
      {/* Arrowhead */}
      <circle cx={to.x} cy={to.y} r="5" fill={direction === "in" ? "#fbbf24" : "#f9a8d4"} />
      <style>{`
        @keyframes photonDash {
          from { stroke-dashoffset: 80; opacity: 0.3; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
      `}</style>
    </g>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
