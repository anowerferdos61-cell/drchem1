/**
 * Personal Hero Strip — animated welcome for Dashboard home view.
 *
 * Flow:
 *  1. On mount: show a big cheerful welcome illustration + confetti for ~5s (once per session).
 *  2. Then fade to the main hero: greeting + name + "Continue where you left off"
 *     + a 21-day challenge tracker (1 dot per day, animated fill for today's check-in).
 */
import { useEffect, useMemo, useState } from "react";
import { Flame, PlayCircle, ArrowRight, Sparkles, Trophy, CalendarCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { streakCheckin } from "@/lib/progress.functions";
import { useAuth } from "@/lib/auth-store";
import type { ExperimentId } from "./types";
import welcomeHero from "@/assets/welcome-hero.png.asset.json";


const LAST_LAB_KEY = "drchem:last_lab";
const CHALLENGE_KEY = "drchem:challenge_v1"; // { days: number, lastDate: 'YYYY-MM-DD', startDate: 'YYYY-MM-DD' }
const WELCOME_SHOWN_KEY = "drchem:welcome_shown_session";
const CHALLENGE_TOTAL = 21;
const WELCOME_MS = 5000;

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 5) return { text: "শুভ রাত্রি", emoji: "🌙" };
  if (h < 12) return { text: "সুপ্রভাত", emoji: "🌅" };
  if (h < 15) return { text: "শুভ দুপুর", emoji: "☀️" };
  if (h < 18) return { text: "শুভ অপরাহ্ন", emoji: "🌤️" };
  if (h < 21) return { text: "শুভ সন্ধ্যা", emoji: "🌆" };
  return { text: "শুভ রাত্রি", emoji: "🌙" };
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

type ChallengeState = { days: number; lastDate: string | null; startDate: string; justChecked: boolean };

function loadOrAdvanceChallenge(): ChallengeState {
  const today = todayISO();
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY);
    if (!raw) {
      const fresh = { days: 1, lastDate: today, startDate: today };
      localStorage.setItem(CHALLENGE_KEY, JSON.stringify(fresh));
      return { ...fresh, justChecked: true };
    }
    const parsed = JSON.parse(raw) as { days: number; lastDate: string | null; startDate: string };
    if (parsed.lastDate === today) {
      return { ...parsed, justChecked: false };
    }
    const gap = parsed.lastDate ? daysBetween(parsed.lastDate, today) : 999;
    let nextDays = parsed.days;
    let startDate = parsed.startDate;
    if (gap === 1) {
      nextDays = Math.min(CHALLENGE_TOTAL, parsed.days + 1);
    } else {
      // Missed a day → reset the 21-day challenge
      nextDays = 1;
      startDate = today;
    }
    const next = { days: nextDays, lastDate: today, startDate };
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(next));
    return { ...next, justChecked: true };
  } catch {
    return { days: 1, lastDate: today, startDate: today, justChecked: true };
  }
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
  const [phase, setPhase] = useState<"welcome" | "main">("main");
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [lastLab, setLastLab] = useState<{ id: ExperimentId; title: string } | null>(null);
  const [checkPop, setCheckPop] = useState(false);

  // Mount: decide whether to show welcome splash + advance challenge
  useEffect(() => {
    const shownThisSession = sessionStorage.getItem(WELCOME_SHOWN_KEY);
    if (!shownThisSession) {
      setPhase("welcome");
      sessionStorage.setItem(WELCOME_SHOWN_KEY, "1");
      const t = window.setTimeout(() => setPhase("main"), WELCOME_MS);
      return () => window.clearTimeout(t);
    }
  }, []);

  // Challenge + last lab load (once)
  useEffect(() => {
    const c = loadOrAdvanceChallenge();
    setChallenge(c);
    if (c.justChecked) {
      // Trigger a subtle celebration when we've just marked today
      const t = window.setTimeout(() => setCheckPop(true), 300);
      return () => window.clearTimeout(t);
    }
    try {
      const raw = localStorage.getItem(LAST_LAB_KEY);
      if (raw) setLastLab(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_LAB_KEY);
      if (raw) setLastLab(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const days = challenge?.days ?? 0;
  const pct = Math.round((days / CHALLENGE_TOTAL) * 100);
  const remaining = Math.max(0, CHALLENGE_TOTAL - days);

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

      {/* PHASE 1 — Welcome splash */}
      {phase === "welcome" && (
        <div
          className="relative flex min-h-[360px] flex-col items-center justify-center gap-4 px-5 py-10 text-center md:min-h-[420px] md:py-14"
          style={{ animation: "welcomeIn 0.5s ease-out both" }}
        >
          {/* Confetti burst */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => {
              const colors = ["#10b981", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444"];
              const color = colors[i % colors.length];
              const left = (i * 37) % 100;
              const delay = (i % 10) * 0.12;
              const duration = 2.2 + ((i * 13) % 15) / 10;
              const size = 6 + (i % 4) * 2;
              return (
                <span
                  key={i}
                  className="absolute top-0 rounded-sm"
                  style={{
                    left: `${left}%`,
                    width: size,
                    height: size * 1.6,
                    backgroundColor: color,
                    animation: `confettiFall ${duration}s ${delay}s ease-in infinite`,
                    opacity: 0.9,
                  }}
                />
              );
            })}
          </div>

          <div className="relative" style={{ animation: "heroPop 0.7s cubic-bezier(.34,1.56,.64,1) both" }}>
            {/* Halo pulse behind character */}
            <div
              className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-emerald-400/40 via-cyan-400/40 to-violet-400/30 blur-2xl"
              style={{ animation: "haloPulse 2.2s ease-in-out infinite" }}
            />
            <img
              src={welcomeHero.url}
              alt="Welcome"
              width={220}
              height={220}
              className="relative h-40 w-40 object-contain drop-shadow-xl md:h-52 md:w-52"
              style={{ animation: "heroBounce 1.6s ease-in-out infinite" }}
            />
          </div>

          <div
            className="relative text-2xl font-extrabold tracking-tight md:text-3xl"
            style={{ animation: "welcomeIn 0.6s 0.15s ease-out both" }}
          >
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              Yay! তুমি এসেছো! 🎉
            </span>
          </div>
          <div
            className="relative max-w-md text-sm text-muted-foreground md:text-base"
            style={{ animation: "welcomeIn 0.6s 0.25s ease-out both" }}
          >
            আজকের দিনটাও তোমার সাথে কাটাতে পেরে আমরা খুশি...
          </div>

          {/* Skip pill */}
          <button
            onClick={() => setPhase("main")}
            className="absolute right-3 top-3 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur transition hover:text-foreground"
          >
            skip →
          </button>
        </div>
      )}

      {/* PHASE 2 — Main hero */}
      {phase === "main" && (
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
                <span
                  className="inline-block"
                  style={{ animation: "wave 1.6s ease-in-out infinite", transformOrigin: "70% 70%" }}
                >
                  👋
                </span>
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
                {challenge?.justChecked
                  ? `আজকের দিনটাও চেক-ইন হয়ে গেছে! ২১ দিনের চ্যালেঞ্জে আরেক ধাপ এগিয়ে।`
                  : `২১ দিনের চ্যালেঞ্জ চালু আছে — প্রতিদিন একবার এসে অভ্যাসটা গড়ে তোলো।`}
              </p>
            </div>

            {/* Streak + Day pills */}
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
                  Day <span className="font-mono tabular-nums">{days}</span> / {CHALLENGE_TOTAL}
                </span>
              </div>
              {remaining > 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  আরও <span className="font-mono tabular-nums">{remaining}</span> দিন বাকি
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Trophy className="h-3.5 w-3.5" />
                  ২১ দিন কমপ্লিট! 🏆
                </div>
              )}
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
                    <div className="truncate text-sm font-bold md:text-base">{lastLab.title}</div>
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

          {/* RIGHT — 21-day challenge tracker */}
          <div
            className="w-full md:w-[300px]"
            style={{ animation: "heroFadeUp 0.8s ease-out 0.15s both" }}
          >
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    21-Day Challenge
                  </div>
                  <div className="text-sm font-bold">অভ্যাস গড়ে তোলো</div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-primary/15 to-cyan-500/15 px-2.5 py-1 text-xs font-bold text-primary">
                  {pct}%
                </div>
              </div>

              {/* 21 dots — 7 per row */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: CHALLENGE_TOTAL }).map((_, i) => {
                  const dayIdx = i + 1;
                  const done = dayIdx < days;
                  const today = dayIdx === days;
                  return (
                    <div
                      key={i}
                      className={
                        "relative aspect-square rounded-md border text-[10px] font-bold flex items-center justify-center transition-all " +
                        (done
                          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30"
                          : today
                          ? "border-primary bg-gradient-to-br from-primary/90 to-cyan-500 text-primary-foreground shadow-md shadow-primary/40"
                          : "border-border/60 bg-muted/40 text-muted-foreground/60")
                      }
                      style={{
                        animation: done || today ? `dotFill 0.4s ${i * 0.03}s ease-out both` : undefined,
                      }}
                    >
                      {today && checkPop && (
                        <span
                          className="absolute inset-0 rounded-md"
                          style={{
                            boxShadow: "0 0 0 0 hsl(var(--primary) / 0.5)",
                            animation: "todayPing 1.6s ease-out 2",
                          }}
                        />
                      )}
                      {dayIdx}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                  style={{
                    width: `${pct}%`,
                    transition: "width 1.1s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                প্রতিদিন একবার এসে চেক-ইন করলেই ২১ দিনে অভ্যাস পাকা হয়ে যাবে।
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes welcomeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroPop {
          0% { opacity: 0; transform: scale(0.4) rotate(-10deg); }
          60% { opacity: 1; transform: scale(1.1) rotate(4deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes heroBounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(420px) rotate(540deg); opacity: 0.2; }
        }
        @keyframes dotFill {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes todayPing {
          0% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.5); }
          100% { box-shadow: 0 0 0 10px hsl(var(--primary) / 0); }
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
        @keyframes haloPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
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
