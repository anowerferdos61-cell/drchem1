/**
 * Personal Hero Strip — animated welcome for Dashboard home view.
 * - Time-aware greeting
 * - Animated streak flame (localStorage: drchem:streak)
 * - Today's XP with SVG circular progress + count-up (drchem:xp_today)
 * - "Continue where you left off" (drchem:last_lab)
 * - Ambient gradient mesh background
 */
import { useEffect, useMemo, useState } from "react";
import { Flame, Zap, PlayCircle, ArrowRight, Sparkles } from "lucide-react";
import type { ExperimentId } from "./types";

const LAST_LAB_KEY = "drchem:last_lab";
const STREAK_KEY = "drchem:streak";
const XP_KEY = "drchem:xp_today";
const XP_GOAL = 100;

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 5) return { text: "শুভ রাত্রি", emoji: "🌙" };
  if (h < 12) return { text: "সুপ্রভাত", emoji: "🌅" };
  if (h < 15) return { text: "শুভ দুপুর", emoji: "☀️" };
  if (h < 18) return { text: "শুভ অপরাহ্ন", emoji: "🌤️" };
  if (h < 21) return { text: "শুভ সন্ধ্যা", emoji: "🌆" };
  return { text: "শুভ রাত্রি", emoji: "🌙" };
}

function useCountUp(target: number, duration = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setN(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function readNumber(key: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const v = Number(localStorage.getItem(key));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export function PersonalHero({
  displayName,
  onResumeLab,
  onExplore,
}: {
  displayName: string;
  onResumeLab: (id: ExperimentId) => void;
  onExplore: () => void;
}) {
  const greeting = useMemo(getGreeting, []);
  const [mounted, setMounted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [lastLab, setLastLab] = useState<{ id: ExperimentId; title: string } | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
    // Seed reasonable defaults if empty (so hero feels alive on first open)
    setStreak(readNumber(STREAK_KEY, 1));
    setXp(readNumber(XP_KEY, 25));
    try {
      const raw = localStorage.getItem(LAST_LAB_KEY);
      if (raw) setLastLab(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const xpAnim = useCountUp(mounted ? xp : 0);
  const streakAnim = useCountUp(mounted ? streak : 0, 700);
  const pct = Math.min(100, Math.round((xp / XP_GOAL) * 100));

  // Ring geometry
  const R = 34;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl shadow-primary/5">
      {/* Ambient gradient mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-cyan-500/10" />
        <div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl"
          style={{ animation: "meshFloat1 9s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl"
          style={{ animation: "meshFloat2 11s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/3 right-1/3 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl"
          style={{ animation: "meshFloat3 13s ease-in-out infinite" }}
        />
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:p-8">
        {/* LEFT — greeting + streak + resume */}
        <div className="min-w-0 space-y-4">
          <div style={{ animation: "heroFadeUp 0.5s ease-out both" }}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {greeting.text} {greeting.emoji}
            </div>
            <h1 className="mt-1.5 text-2xl font-extrabold leading-tight tracking-tight md:text-4xl">
              স্বাগতম,{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                {displayName}
              </span>{" "}
              <span className="inline-block" style={{ animation: "wave 1.6s ease-in-out infinite", transformOrigin: "70% 70%" }}>
                👋
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
              আজকের লক্ষ্যের দিকে আরেকটু এগিয়ে যাও — প্রতিদিন একটু করেই তুমি expert হয়ে উঠবে।
            </p>
          </div>

          {/* Streak + XP pills */}
          <div
            className="flex flex-wrap items-center gap-2.5"
            style={{ animation: "heroFadeUp 0.6s ease-out 0.1s both" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-gradient-to-r from-orange-500/15 to-amber-500/10 px-3.5 py-1.5 text-sm font-semibold text-orange-700 shadow-sm dark:text-orange-300">
              <Flame
                className="h-4 w-4 fill-orange-500 text-orange-500 drop-shadow-[0_0_6px_rgba(251,146,60,0.6)]"
                style={{ animation: "flameFlicker 1.6s ease-in-out infinite" }}
              />
              <span>
                <span className="font-mono tabular-nums">{streakAnim}</span> দিন ধরে শিখছো
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Zap className="h-3.5 w-3.5 fill-primary" />
              Today · +<span className="font-mono tabular-nums">{xpAnim}</span> XP
            </div>
          </div>

          {/* Continue / Explore CTA */}
          <div style={{ animation: "heroFadeUp 0.7s ease-out 0.2s both" }}>
            {lastLab ? (
              <button
                onClick={() => onResumeLab(lastLab.id)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-primary/25 bg-background/60 p-3 text-left shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/15 md:p-4"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan-500 text-white shadow-lg shadow-primary/30 md:h-12 md:w-12">
                  <PlayCircle className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Continue where you left off
                  </div>
                  <div className="truncate text-sm font-bold md:text-base">
                    {lastLab.title}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                onClick={onExplore}
                className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-background/40 p-3 text-left backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 md:p-4"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary md:h-12 md:w-12">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    এখনই শুরু করো
                  </div>
                  <div className="truncate text-sm font-bold md:text-base">
                    আজই তোমার প্রথম ল্যাব চালু করো
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — XP progress ring */}
        <div
          className="flex items-center justify-center md:justify-end"
          style={{ animation: "heroFadeUp 0.8s ease-out 0.15s both" }}
        >
          <div className="relative">
            {/* Halo glow */}
            <div
              className="absolute inset-0 -m-2 rounded-full bg-gradient-to-br from-primary/30 to-cyan-500/30 blur-2xl"
              style={{ animation: "haloPulse 3s ease-in-out infinite" }}
            />
            <svg
              width="150"
              height="150"
              viewBox="0 0 80 80"
              className="relative -rotate-90 drop-shadow-md"
            >
              <defs>
                <linearGradient id="xpRingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" style={{ stopColor: "var(--primary)" }} />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle
                cx="40"
                cy="40"
                r={R}
                fill="none"
                strokeWidth="6"
                className="stroke-muted"
              />
              <circle
                cx="40"
                cy="40"
                r={R}
                fill="none"
                stroke="url(#xpRingGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                style={{
                  transition: "stroke-dasharray 1.1s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-gradient-to-br from-primary to-cyan-500 bg-clip-text text-4xl font-extrabold leading-none tracking-tight text-transparent">
                <span className="font-mono tabular-nums">{xpAnim}</span>
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                / {XP_GOAL} XP
              </div>
            </div>
            {/* Rotating sparkle marker */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ animation: "spinSlow 14s linear infinite" }}
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-primary p-1 shadow-lg shadow-primary/40">
                <Sparkles className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes flameFlicker {
          0%, 100% { transform: scale(1) rotate(-2deg); opacity: 1; }
          50% { transform: scale(1.15) rotate(3deg); opacity: 0.85; }
        }
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(18deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(14deg); }
        }
        @keyframes spinSlow { to { transform: rotate(360deg); } }
        @keyframes haloPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.06); }
        }
        @keyframes meshFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.08); }
        }
        @keyframes meshFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, -20px) scale(1.05); }
        }
        @keyframes meshFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(20px, -25px) scale(1.1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
