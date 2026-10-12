/**
 * Diffusion Race Lab — Graham's Law (NH₃ vs HCl) + KMnO₄ in water.
 * Chapter 2 · পদার্থের অবস্থা · ব্যাপন পরীক্ষা।
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Play, RotateCcw, FlaskConical, Droplets, Sparkles, Wind } from "lucide-react";
import { toast } from "sonner";

type CottonId = "nh3" | "hcl";
type Slot = "left" | "right" | null;

// Graham's law: v(NH3)/v(HCl) = sqrt(36.5/17) ≈ 1.466
const V_NH3 = 1.466;
const V_HCL = 1.0;
const MEET_PCT = (100 * V_HCL) / (V_NH3 + V_HCL); // distance NH3 travels ≈ 40.55 from left
// Actually meeting from left = V_NH3 / (V_NH3 + V_HCL) ≈ 0.594 → 59.4% from left
const MEET_FROM_LEFT = (V_NH3 / (V_NH3 + V_HCL)) * 100;

const STEPS_BN = [
  "১. বাম দিক থেকে NH₃ তুলোটি টেনে নলের বাম মুখে রাখুন।",
  "২. HCl তুলোটি টেনে নলের ডান মুখে রাখুন।",
  "৩. 'পরীক্ষা শুরু' চাপুন — গ্যাস দুটি ব্যাপন শুরু করবে।",
  "৪. লক্ষ্য করুন কোথায় সাদা ধোঁয়ার রিং (NH₄Cl) তৈরি হয়।",
];

export default function DiffusionLab({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 dark:from-slate-950 dark:via-background dark:to-cyan-950/20">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md">
              <Wind className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight">ব্যাপন প্রতিযোগিতা</div>
              <div className="text-[11px] text-muted-foreground">Diffusion Race · Graham's Law</div>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
          >
            অধ্যায় ২ · পদার্থের অবস্থা
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="gas" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="gas" className="gap-1.5">
              <Wind className="h-4 w-4" /> গ্যাস ব্যাপন
            </TabsTrigger>
            <TabsTrigger value="liquid" className="gap-1.5">
              <Droplets className="h-4 w-4" /> তরল ব্যাপন
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gas" className="mt-6">
            <GasDiffusion />
          </TabsContent>
          <TabsContent value="liquid" className="mt-6">
            <LiquidDiffusion />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// GAS DIFFUSION (NH3 vs HCl tube race)
// ───────────────────────────────────────────────────────────────
function GasDiffusion() {
  const [placed, setPlaced] = useState<Record<CottonId, Slot>>({ nh3: null, hcl: null });
  const [dragging, setDragging] = useState<CottonId | null>(null);
  const [hoverSlot, setHoverSlot] = useState<Slot>(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 of meeting time
  const tubeRef = useRef<HTMLDivElement | null>(null);

  const ready = placed.nh3 === "left" && placed.hcl === "right";

  const onDragStart = (id: CottonId) => (e: React.DragEvent) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (slot: Exclude<Slot, null>) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragging || running) return;
    const expected: CottonId = slot === "left" ? "nh3" : "hcl";
    if (dragging !== expected) {
      toast.error(slot === "left" ? "বাম মুখে NH₃ রাখুন" : "ডান মুখে HCl রাখুন");
      setDragging(null);
      setHoverSlot(null);
      return;
    }
    setPlaced((p) => ({ ...p, [dragging]: slot }));
    setDragging(null);
    setHoverSlot(null);
  };

  const start = () => {
    if (!ready) return;
    setRunning(true);
    setFinished(false);
    setProgress(0);
  };

  const reset = () => {
    setRunning(false);
    setFinished(false);
    setProgress(0);
    setPlaced({ nh3: null, hcl: null });
  };

  // Animation loop
  useEffect(() => {
    if (!running) return;
    const DURATION = 6000; // ms to meeting
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setRunning(false);
        setFinished(true);
        toast.success("সাদা ধোঁয়ার রিং তৈরি হয়েছে! (NH₄Cl)", { duration: 4000 });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // Front of NH3 wave position (% from left)
  const nh3Front = progress * MEET_FROM_LEFT;
  // Front of HCl wave position (% from left), starts at 100, ends at MEET_FROM_LEFT
  const hclFront = 100 - progress * (100 - MEET_FROM_LEFT);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Workspace */}
      <Card className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 p-6 dark:from-slate-900 dark:to-slate-950">
        {/* Cotton tray */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            তুলো নির্বাচন:
          </div>
          <CottonChip
            id="nh3"
            label="অ্যামোনিয়া (NH₃)"
            sub="M = 17"
            color="from-emerald-400 to-emerald-600"
            placed={!!placed.nh3}
            onDragStart={onDragStart("nh3")}
          />
          <CottonChip
            id="hcl"
            label="হাইড্রোক্লোরিক এসিড (HCl)"
            sub="M = 36.5"
            color="from-amber-400 to-orange-500"
            placed={!!placed.hcl}
            onDragStart={onDragStart("hcl")}
          />
        </div>

        {/* Tube */}
        <div ref={tubeRef} className="relative mx-auto mt-8 h-40 w-full max-w-3xl">
          {/* Glass tube body */}
          <div className="absolute inset-x-16 top-1/2 h-24 -translate-y-1/2 rounded-full border-2 border-slate-300 bg-gradient-to-b from-white/80 via-sky-50/40 to-white/80 shadow-[inset_0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-slate-700 dark:from-slate-800/60 dark:via-slate-900/40 dark:to-slate-800/60">
            {/* Inside: gas waves */}
            <div className="relative h-full w-full overflow-hidden rounded-full">
              {/* NH3 wave (left → right, emerald) */}
              {(running || finished) && (
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400/60 via-emerald-300/40 to-transparent transition-none"
                  style={{ width: `${nh3Front}%` }}
                />
              )}
              {/* HCl wave (right → left, amber) */}
              {(running || finished) && (
                <div
                  className="absolute inset-y-0 right-0 bg-gradient-to-l from-amber-400/60 via-amber-300/40 to-transparent"
                  style={{ width: `${100 - hclFront}%` }}
                />
              )}
              {/* Smoke ring at meeting point */}
              {finished && (
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${MEET_FROM_LEFT}%` }}
                >
                  <div className="relative">
                    <div className="h-16 w-16 animate-ping rounded-full bg-white/80 blur-sm" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="h-14 w-14 rounded-full border-4 border-white bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.9)]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Left snap zone */}
          <DropZone
            side="left"
            active={!placed.nh3 && !running}
            highlight={hoverSlot === "left"}
            placed={placed.nh3 === "left"}
            label="NH₃"
            tone="emerald"
            onDragEnter={() => setHoverSlot("left")}
            onDragLeave={() => setHoverSlot(null)}
            onDrop={onDrop("left")}
          />
          {/* Right snap zone */}
          <DropZone
            side="right"
            active={!placed.hcl && !running}
            highlight={hoverSlot === "right"}
            placed={placed.hcl === "right"}
            label="HCl"
            tone="amber"
            onDragEnter={() => setHoverSlot("right")}
            onDragLeave={() => setHoverSlot(null)}
            onDrop={onDrop("right")}
          />

          {/* Distance marker after finish */}
          {finished && (
            <div
              className="absolute -bottom-2 -translate-x-1/2 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
              style={{ left: `${MEET_FROM_LEFT}%` }}
            >
              ≈ {MEET_FROM_LEFT.toFixed(1)}% (বাম থেকে)
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={start}
            disabled={!ready || running}
            className="gap-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
          >
            <Play className="h-4 w-4" /> পরীক্ষা শুরু
          </Button>
          <Button variant="outline" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> রিসেট
          </Button>
        </div>

        {finished && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-emerald-500/30 bg-emerald-50/70 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-bold">পরীক্ষা সফল!</div>
                <p className="mt-1 leading-relaxed">
                  অ্যামোনিয়ার ভর কম হওয়ায় এটি দ্রুত ব্যাপিত হয়েছে এবং HCl-এর কাছাকাছি সাদা
                  ধোঁয়া (NH₄Cl) তৈরি করেছে। গ্রাহামের সূত্র অনুযায়ী{" "}
                  <span className="font-mono">v(NH₃)/v(HCl) = √(36.5/17) ≈ 1.46</span>।
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Side panel */}
      <Card className="space-y-4 p-5">
        <div>
          <div className="text-xs font-semibold uppercase text-muted-foreground">ধাপসমূহ</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {STEPS_BN.map((s, i) => {
              const done =
                (i === 0 && !!placed.nh3) ||
                (i === 1 && !!placed.hcl) ||
                (i === 2 && (running || finished)) ||
                (i === 3 && finished);
              return (
                <li
                  key={i}
                  className={`rounded-md border px-2 py-1.5 text-xs leading-relaxed ${
                    done
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                      : "border-border bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {s}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed">
          <div className="mb-1 flex items-center gap-1 font-bold">
            <FlaskConical className="h-3.5 w-3.5" /> গ্রাহামের সূত্র
          </div>
          <p className="text-muted-foreground">
            r₁ / r₂ = √(M₂ / M₁) — কম ভরের গ্যাস বেশি ভরের গ্যাসের চেয়ে দ্রুত ব্যাপিত হয়।
          </p>
        </div>
      </Card>
    </div>
  );
}

function CottonChip({
  id,
  label,
  sub,
  color,
  placed,
  onDragStart,
}: {
  id: CottonId;
  label: string;
  sub: string;
  color: string;
  placed: boolean;
  onDragStart: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable={!placed}
      onDragStart={onDragStart}
      data-id={id}
      className={`flex items-center gap-2 rounded-xl border-2 border-dashed px-3 py-2 transition ${
        placed ? "opacity-40" : "cursor-grab active:cursor-grabbing hover:scale-105"
      }`}
    >
      <div
        className={`h-8 w-8 rounded-full bg-gradient-to-br ${color} shadow-md ring-2 ring-white dark:ring-slate-900`}
      />
      <div className="leading-tight">
        <div className="text-xs font-bold">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function DropZone({
  side,
  active,
  highlight,
  placed,
  label,
  tone,
  onDragEnter,
  onDragLeave,
  onDrop,
}: {
  side: "left" | "right";
  active: boolean;
  highlight: boolean;
  placed: boolean;
  label: string;
  tone: "emerald" | "amber";
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const sideClass = side === "left" ? "left-0" : "right-0";
  const ring =
    tone === "emerald"
      ? "border-emerald-400 bg-emerald-500/20"
      : "border-amber-400 bg-amber-500/20";
  const dot =
    tone === "emerald" ? "from-emerald-400 to-emerald-600" : "from-amber-400 to-orange-500";
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`absolute top-1/2 ${sideClass} -translate-y-1/2 grid h-28 w-16 place-items-center rounded-2xl border-2 border-dashed transition ${
        placed
          ? `${ring} border-solid`
          : active
            ? highlight
              ? `${ring} scale-110`
              : "border-slate-300 bg-slate-100/60 dark:border-slate-700 dark:bg-slate-800/40"
            : "border-transparent"
      }`}
    >
      {placed ? (
        <div
          className={`h-10 w-10 rounded-full bg-gradient-to-br ${dot} shadow-md ring-2 ring-white dark:ring-slate-900`}
        />
      ) : (
        <div className="text-center text-[10px] font-semibold text-muted-foreground">
          {label}
          <div className="text-[9px] opacity-70">এখানে রাখুন</div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// LIQUID DIFFUSION (KMnO4 in cold vs hot water)
// ───────────────────────────────────────────────────────────────
function LiquidDiffusion() {
  const [dropped, setDropped] = useState(false);
  const [t, setT] = useState(0); // 0..1 across longest fill
  const HOT_TIME = 4000; // ms
  const COLD_TIME = HOT_TIME * 3;

  useEffect(() => {
    if (!dropped) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - t0;
      setT(Math.min(1, elapsed / COLD_TIME));
      if (elapsed < COLD_TIME) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dropped]);

  const hotFill = Math.min(1, t * (COLD_TIME / HOT_TIME));
  const coldFill = t;

  const reset = () => {
    setDropped(false);
    setT(0);
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">KMnO₄ + পানি · তাপমাত্রার প্রভাব</h3>
          <p className="text-xs text-muted-foreground">
            গরম পানিতে কণার গতিশক্তি বেশি — তাই ব্যাপন প্রায় ৩ গুণ দ্রুত হয়।
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setDropped(true)}
            disabled={dropped}
            className="gap-1.5 bg-purple-600 hover:bg-purple-700"
          >
            <Droplets className="h-4 w-4" /> KMnO₄ ফেলুন
          </Button>
          <Button variant="outline" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> রিসেট
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Beaker
          label="ঠান্ডা পানি (20°C)"
          temp="cold"
          fill={dropped ? coldFill : 0}
          dropped={dropped}
        />
        <Beaker label="গরম পানি (80°C)" temp="hot" fill={dropped ? hotFill : 0} dropped={dropped} />
      </div>

      {dropped && hotFill >= 1 && (
        <div className="mt-6 rounded-xl border border-purple-500/30 bg-purple-50/70 p-4 text-sm leading-relaxed text-purple-900 dark:bg-purple-950/30 dark:text-purple-200">
          <span className="font-bold">পর্যবেক্ষণ:</span> গরম পানিতে KMnO₄-এর বেগুনি রঙ অনেক দ্রুত
          পুরো বিকারে ছড়িয়ে পড়েছে। এটি প্রমাণ করে — তাপমাত্রা বাড়লে অণুর গতিশক্তি বৃদ্ধি পায়
          এবং ব্যাপনের হার বেড়ে যায়।
        </div>
      )}
    </Card>
  );
}

function Beaker({
  label,
  temp,
  fill,
  dropped,
}: {
  label: string;
  temp: "cold" | "hot";
  fill: number;
  dropped: boolean;
}) {
  const tint =
    temp === "hot"
      ? "from-rose-100 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20"
      : "from-sky-100 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20";
  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-semibold">{label}</div>
      <div
        className={`relative mt-3 h-64 w-44 rounded-b-3xl rounded-t-md border-2 border-slate-300 bg-gradient-to-b ${tint} shadow-inner dark:border-slate-700`}
      >
        {/* water surface line */}
        <div className="absolute inset-x-2 top-4 h-px bg-slate-300/60" />

        {/* purple diffusion overlay */}
        <div
          className="absolute inset-x-2 bottom-2 rounded-b-2xl bg-gradient-to-t from-purple-700/80 via-purple-500/60 to-purple-400/20 transition-opacity"
          style={{
            opacity: fill,
            height: `${20 + fill * 75}%`,
          }}
        />

        {/* falling crystal */}
        {dropped && fill < 0.05 && (
          <div className="absolute left-1/2 top-4 h-2 w-2 -translate-x-1/2 animate-bounce rounded-sm bg-purple-900" />
        )}

        {/* temp badge */}
        <div className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold dark:bg-slate-800/80">
          {temp === "hot" ? "🔥 80°C" : "❄ 20°C"}
        </div>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        ব্যাপন: {Math.round(fill * 100)}%
      </div>
    </div>
  );
}
