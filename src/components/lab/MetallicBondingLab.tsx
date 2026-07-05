/**
 * Metallic Bonding & Electron Sea Model — Cu lattice simulator
 * NCTB Class 9-10 · Chapter 5 · রাসায়নিক বন্ধন (ধাতব বন্ধন)
 *
 * Interactive Canvas simulation demonstrating:
 *  1. Delocalized "sea" of electrons around fixed Cu²⁺ cores
 *  2. Coordinated drift when a battery is connected (current flows, bulb lights)
 *  3. Malleability — hammer strikes top row, lattice deforms without fracturing
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Atom,
  BatteryCharging,
  Hammer,
  Lightbulb,
  RotateCcw,
  Info,
  Zap,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import TheoryLabShell from "./TheoryLabShell";

interface Props {
  onBack: () => void;
}

// ── canvas geometry ────────────────────────────────────────
const W = 380;
const H = 340;
const COLS = 6;
const ROWS = 4;
const MARGIN_X = 46;
const MARGIN_Y = 46;
const COL_STEP = (W - MARGIN_X * 2) / (COLS - 1);
const ROW_STEP = (H - MARGIN_Y * 2) / (ROWS - 1);
const CORE_R = 15;
const ELECTRON_R = 2.6;
const ELECTRONS_PER_CORE = 3;

interface Core {
  ox: number; oy: number; // original lattice position
  x: number; y: number;   // rendered position (shift + vibration)
  shiftX: number;         // permanent horizontal shift from hammer
}

interface Electron {
  x: number; y: number;
  vx: number; vy: number;
  phase: number;
}

export default function MetallicBondingLab({ onBack }: Props) {
  const [battery, setBattery] = useState(false);
  const [voltage, setVoltage] = useState(3); // 1..9 V
  const [deformed, setDeformed] = useState(false);
  const [hammerAnim, setHammerAnim] = useState(0); // >0 while animating
  const [tick, setTick] = useState(0); // forces metric re-render

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const coresRef = useRef<Core[]>([]);
  const electronsRef = useRef<Electron[]>([]);

  const batteryRef = useRef(battery);
  const voltageRef = useRef(voltage);
  const hammerRef = useRef(0);
  const deformRef = useRef(deformed);
  batteryRef.current = battery;
  voltageRef.current = voltage;
  hammerRef.current = hammerAnim;
  deformRef.current = deformed;

  // ── init cores & electrons once ──
  useEffect(() => {
    const cores: Core[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = MARGIN_X + c * COL_STEP;
        const y = MARGIN_Y + r * ROW_STEP;
        cores.push({ ox: x, oy: y, x, y, shiftX: 0 });
      }
    }
    coresRef.current = cores;

    const electrons: Electron[] = [];
    for (let i = 0; i < cores.length * ELECTRONS_PER_CORE; i++) {
      electrons.push({
        x: MARGIN_X + Math.random() * (W - MARGIN_X * 2),
        y: MARGIN_Y + Math.random() * (H - MARGIN_Y * 2),
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
    electronsRef.current = electrons;
  }, []);

  // ── animation loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let last = performance.now();
    let frame = 0;

    const tickFn = (now: number) => {
      const dt = Math.min(32, now - last) / 16.67;
      last = now;
      frame++;

      const bat = batteryRef.current;
      const V = voltageRef.current;
      const cores = coresRef.current;
      const electrons = electronsRef.current;

      // ── update cores: thermal vibration + optional hammer settling ──
      let hammer = hammerRef.current;
      const hammerActive = hammer > 0;
      if (hammerActive) {
        hammerRef.current = Math.max(0, hammer - dt * 0.02);
        setHammerAnim(hammerRef.current);
      }
      for (let i = 0; i < cores.length; i++) {
        const core = cores[i];
        const jx = (Math.random() - 0.5) * 0.9;
        const jy = (Math.random() - 0.5) * 0.9;
        // rendered pos = original + permanent shift + jitter
        core.x = core.ox + core.shiftX + jx;
        core.y = core.oy + jy;
      }

      // ── update electrons ──
      const drift = bat ? 0.35 + V * 0.25 : 0;
      for (const e of electrons) {
        // wave-like organic drift when random
        e.phase += 0.05 * dt;
        if (!bat) {
          const wx = Math.cos(e.phase) * 0.15;
          const wy = Math.sin(e.phase * 1.3) * 0.15;
          e.vx += (Math.random() - 0.5) * 0.35 + wx;
          e.vy += (Math.random() - 0.5) * 0.35 + wy;
        } else {
          // coordinated drift left → right (electrons carry current)
          e.vx += drift * 0.15 + (Math.random() - 0.5) * 0.2;
          e.vy += (Math.random() - 0.5) * 0.2;
        }
        // damping — keep speed sensible
        const maxSp = bat ? 1.6 + V * 0.15 : 1.4;
        const sp = Math.hypot(e.vx, e.vy);
        if (sp > maxSp) { e.vx = (e.vx / sp) * maxSp; e.vy = (e.vy / sp) * maxSp; }
        e.vx *= 0.94; e.vy *= 0.94;
        if (bat) e.vx += drift * 0.06;

        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // wrap horizontally (electrons appear to circulate the circuit)
        if (e.x < MARGIN_X - 10) e.x = W - MARGIN_X + 10;
        if (e.x > W - MARGIN_X + 10) e.x = MARGIN_X - 10;
        if (e.y < MARGIN_Y - 8) { e.y = MARGIN_Y - 8; e.vy = Math.abs(e.vy); }
        if (e.y > H - MARGIN_Y + 8) { e.y = H - MARGIN_Y + 8; e.vy = -Math.abs(e.vy); }
      }

      // ── render ──
      ctx.clearRect(0, 0, W, H);

      // subtle lattice frame
      ctx.strokeStyle = "rgba(148,163,184,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(MARGIN_X - 20, MARGIN_Y - 20, W - (MARGIN_X - 20) * 2, H - (MARGIN_Y - 20) * 2);

      // battery leads (if on)
      if (bat) {
        // left = negative terminal, right = positive
        ctx.lineWidth = 2.5;
        // left wire
        ctx.strokeStyle = "#60a5fa";
        ctx.beginPath();
        ctx.moveTo(0, H / 2); ctx.lineTo(MARGIN_X - 22, H / 2);
        ctx.stroke();
        // right wire
        ctx.strokeStyle = "#f87171";
        ctx.beginPath();
        ctx.moveTo(W - MARGIN_X + 22, H / 2); ctx.lineTo(W, H / 2);
        ctx.stroke();
        // terminal glyphs
        ctx.fillStyle = "#3b82f6";
        ctx.font = "bold 14px system-ui";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("−", 12, H / 2 - 12);
        ctx.fillStyle = "#ef4444";
        ctx.fillText("+", W - 12, H / 2 - 12);
      }

      // draw cores
      for (const core of cores) {
        // glow
        const glow = ctx.createRadialGradient(core.x, core.y, 2, core.x, core.y, CORE_R + 8);
        glow.addColorStop(0, "rgba(251,146,60,0.55)");
        glow.addColorStop(1, "rgba(251,146,60,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(core.x, core.y, CORE_R + 8, 0, Math.PI * 2);
        ctx.fill();

        // body
        const body = ctx.createRadialGradient(core.x - 4, core.y - 4, 2, core.x, core.y, CORE_R);
        body.addColorStop(0, "#fed7aa");
        body.addColorStop(0.6, "#f97316");
        body.addColorStop(1, "#9a3412");
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(core.x, core.y, CORE_R, 0, Math.PI * 2);
        ctx.fill();

        // label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px system-ui";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Cu²⁺", core.x, core.y);
      }

      // draw electrons
      for (const e of electrons) {
        // trail glow
        const g = ctx.createRadialGradient(e.x, e.y, 0.5, e.x, e.y, ELECTRON_R + 5);
        g.addColorStop(0, "rgba(96,165,250,0.95)");
        g.addColorStop(0.4, "rgba(59,130,246,0.6)");
        g.addColorStop(1, "rgba(59,130,246,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(e.x, e.y, ELECTRON_R + 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#dbeafe";
        ctx.beginPath();
        ctx.arc(e.x, e.y, ELECTRON_R, 0, Math.PI * 2);
        ctx.fill();
      }

      // hammer visual when animating
      if (hammerActive) {
        const t = 1 - hammerRef.current; // 0..1
        const y = -20 + t * (MARGIN_Y - 32);
        ctx.save();
        ctx.translate(W / 2, y);
        ctx.rotate(-0.15);
        ctx.fillStyle = "#71717a";
        ctx.fillRect(-4, 0, 8, 40);
        ctx.fillStyle = "#3f3f46";
        ctx.fillRect(-24, -14, 48, 22);
        ctx.restore();
      }

      // trigger metric update every ~10 frames
      if (frame % 10 === 0) setTick((n) => (n + 1) % 1000);

      rafRef.current = requestAnimationFrame(tickFn);
    };
    rafRef.current = requestAnimationFrame(tickFn);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── hammer action: shift top row rightward permanently ──
  const applyHammer = useCallback(() => {
    const cores = coresRef.current;
    const shift = 14; // px shift per strike
    for (const core of cores) {
      // top row = smallest oy
      if (core.oy < MARGIN_Y + ROW_STEP * 0.5) {
        core.shiftX += shift;
      }
    }
    setDeformed(true);
    setHammerAnim(1); // 1 → 0 over ~1s
  }, []);

  // ── reset ──
  const reset = useCallback(() => {
    const cores = coresRef.current;
    for (const c of cores) c.shiftX = 0;
    setDeformed(false);
    setBattery(false);
    setHammerAnim(0);
  }, []);

  // ── live metrics ──
  const driftVelocity = useMemo(() => {
    if (!battery) return 0;
    return Number((0.15 + voltage * 0.11).toFixed(3));
  }, [battery, voltage, tick]);

  const current = useMemo(() => {
    if (!battery) return 0;
    return Math.round(voltage * 12.5);
  }, [battery, voltage, tick]);

  const stability = deformed ? "Deformed" : "Stable";

  return (
    <TheoryLabShell
      onBack={onBack}
      titleBn="ধাতব বন্ধন — ইলেকট্রন সাগর মডেল"
      subtitleEn="Chapter 5 · Metallic Bonding & Electron Sea"
      headerIcon={
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow shadow-orange-500/20">
          <Atom className="h-4 w-4 text-white" />
        </div>
      }
      badge={
        <Badge
          variant="secondary"
          className={`gap-1.5 border text-white border-white/10 bg-gradient-to-r ${
            deformed
              ? "from-rose-500 to-orange-600"
              : battery
                ? "from-sky-500 to-blue-600"
                : "from-slate-500 to-slate-700"
          }`}
        >
          {deformed ? <Hammer className="h-3.5 w-3.5" /> : battery ? <Zap className="h-3.5 w-3.5" /> : <Waves className="h-3.5 w-3.5" />}
          <span className="text-lab-xs font-semibold">
            {deformed ? "Deformed · আকৃতি বদলেছে" : battery ? "Current Flowing · তড়িৎ প্রবাহ" : "Electron Sea · ইলেকট্রন সাগর"}
          </span>
        </Badge>
      }

      /* ── LEFT — info & metrics ── */
      info={
        <>
          <Card className="overflow-hidden border-0 shadow ring-2 ring-orange-400/30">
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 px-3 py-2 text-white">
              <div className="flex items-center gap-1.5 text-lab-xs font-medium opacity-90">
                <Atom className="h-3 w-3" /> কপার ল্যাটিস
              </div>
              <div className="mt-0.5 font-extrabold leading-tight text-lab-lg">
                Cu²⁺ Cores + e⁻ Sea
              </div>
            </div>
            <p className="px-3 py-2 text-lab-sm text-foreground/90">
              ধাতুর ধনাত্মক আয়নগুলো নির্দিষ্ট জায়গায় থাকে, আর যোজ্যতা ইলেকট্রনগুলো
              সমগ্র ল্যাটিসে অবাধে চলাচল করে — এটাই "ইলেকট্রন সাগর"।
            </p>
          </Card>

          <Card className="p-3 space-y-2">
            <div className="text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Live Metrics · সরাসরি তথ্য
            </div>
            <Metric
              label="Drift Velocity"
              value={`${driftVelocity.toFixed(3)}`}
              unit="m/s"
              gradient="from-sky-500 to-blue-600"
              icon={Waves}
            />
            <Metric
              label="Current"
              value={`${current}`}
              unit="mA"
              gradient="from-emerald-500 to-teal-600"
              icon={Zap}
            />
            <Metric
              label="Lattice Stability"
              value={stability}
              unit=""
              gradient={deformed ? "from-rose-500 to-orange-600" : "from-slate-500 to-slate-700"}
              icon={Atom}
            />
          </Card>

          <Card className="p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Info className="h-3 w-3" /> Legend · সংকেত
            </div>
            <div className="space-y-1.5 text-lab-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 shadow" />
                <span><b>Cu²⁺</b> — Atomic Cores (Kernel)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-300 shadow-[0_0_6px_2px_rgba(59,130,246,0.6)]" />
                <span><b>e⁻</b> — Delocalized Electrons</span>
              </div>
            </div>
          </Card>
        </>
      }

      /* ── CENTER — canvas + circuit UI ── */
      visual={
        <div
          className="relative w-full rounded-xl bg-gradient-to-b from-slate-100/60 to-slate-200/40 ring-1 ring-slate-300/40 dark:from-slate-800/40 dark:to-slate-900/60 dark:ring-slate-700/40"
          style={{
            aspectRatio: `${W} / ${H + 70}`,
            maxHeight: "100%",
            maxWidth: "100%",
            height: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="absolute inset-x-0 top-0 h-[calc(100%-70px)] w-full"
          />

          {/* Circuit strip under the canvas */}
          <div className="absolute inset-x-2 bottom-2 flex h-[62px] items-center justify-between rounded-lg border bg-background/80 px-2 shadow-sm backdrop-blur">
            {/* Battery */}
            <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-lab-xs font-semibold transition ${battery ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "text-muted-foreground"}`}>
              <BatteryCharging className="h-3.5 w-3.5" />
              {battery ? `${voltage}V ON` : "Battery OFF"}
            </div>

            {/* Wire indicator */}
            <div className="mx-2 flex flex-1 items-center gap-1">
              <div className={`h-[3px] flex-1 rounded ${battery ? "bg-gradient-to-r from-blue-400 via-blue-500 to-red-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`} />
            </div>

            {/* LED bulb */}
            <div className="flex flex-col items-center gap-0.5">
              <div className={`grid h-8 w-8 place-items-center rounded-full border-2 transition ${battery ? "border-amber-400 bg-amber-300 text-amber-900 shadow-[0_0_18px_4px_rgba(251,191,36,0.65)]" : "border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800"}`}>
                <Lightbulb className="h-4 w-4" />
              </div>
              <span className="text-[9px] text-muted-foreground">{battery ? "ON" : "OFF"}</span>
            </div>
          </div>
        </div>
      }

      /* ── RIGHT — controls ── */
      controls={
        <>
          <Card className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BatteryCharging className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-lab-sm font-semibold">Connect Battery</div>
                  <div className="text-[10px] text-muted-foreground">ব্যাটারি সংযোগ</div>
                </div>
              </div>
              <Switch checked={battery} onCheckedChange={setBattery} />
            </div>

            <div className={`transition-opacity ${battery ? "opacity-100" : "opacity-50"}`}>
              <div className="mb-1 flex items-center justify-between text-lab-xs">
                <span className="text-muted-foreground">Voltage</span>
                <span className="font-bold tabular-nums">{voltage} V</span>
              </div>
              <Slider
                value={[voltage]}
                onValueChange={(v) => setVoltage(v[0])}
                min={1}
                max={9}
                step={1}
                disabled={!battery}
              />
            </div>
          </Card>

          <Card className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Hammer className="h-4 w-4 text-rose-500" />
              <div>
                <div className="text-lab-sm font-semibold">Malleability Test</div>
                <div className="text-[10px] text-muted-foreground">নমনীয়তা পরীক্ষা</div>
              </div>
            </div>
            <p className="text-lab-xs text-muted-foreground">
              হাতুড়ি দিয়ে আঘাত করলে উপরের সারি সরে যাবে — কিন্তু ইলেকট্রন সাগর ল্যাটিসকে ভাঙতে দেবে না।
            </p>
            <Button
              onClick={applyHammer}
              className="h-9 w-full gap-1.5 bg-gradient-to-r from-rose-500 to-orange-600 text-white hover:opacity-90"
              size="sm"
            >
              <Hammer className="h-4 w-4" /> Strike Hammer
            </Button>
          </Card>

          <Button variant="outline" size="sm" onClick={reset} className="h-8 w-full gap-1.5 text-lab-sm">
            <RotateCcw className="h-3.5 w-3.5" /> Reset Lattice
          </Button>
        </>
      }

      /* ── Deep theory drawer ── */
      theory={
        <div className="space-y-3">
          <p>
            <b>ধাতব বন্ধন (Metallic Bond):</b> ধাতুর পরমাণুগুলো তাদের যোজ্যতা ইলেকট্রন
            মুক্ত করে ধনাত্মক আয়নে (kernel) পরিণত হয়। এই মুক্ত ইলেকট্রনগুলো একটি
            "সাগর" তৈরি করে যেখানে সব ধনাত্মক আয়ন ডুবে থাকে। ধনাত্মক আয়ন ও
            ইলেকট্রন সাগরের মধ্যে স্থির-বৈদ্যুতিক আকর্ষণই ধাতব বন্ধন।
          </p>
          <p><b>Electron Sea Model ব্যাখ্যা করে —</b></p>
          <ul>
            <li>• <b>তড়িৎ পরিবাহিতা:</b> ব্যাটারি সংযোগ দিলে delocalized e⁻ একদিকে drift করে → বিদ্যুৎ প্রবাহ।</li>
            <li>• <b>নমনীয়তা (Malleability):</b> স্তর সরে গেলেও ইলেকট্রন সাগর "আঠা" হিসেবে কাজ করে — ধাতু ভাঙে না, পিটিয়ে পাত করা যায়।</li>
            <li>• <b>Ductility:</b> একই কারণে ধাতু টেনে তার তৈরি করা যায়।</li>
            <li>• <b>ধাতব দ্যুতি:</b> মুক্ত ইলেকট্রন আলো শোষণ করে পুনরায় বিকিরণ করে।</li>
            <li>• <b>তাপ পরিবাহিতা:</b> শক্তি দ্রুত ইলেকট্রনের মাধ্যমে সঞ্চারিত হয়।</li>
          </ul>
          <p>
            <b>উদাহরণ:</b> Cu, Fe, Al, Au — সবাই এই মডেল মেনে চলে। যত বেশি মুক্ত
            ইলেকট্রন, তত শক্তিশালী ধাতব বন্ধন।
          </p>
        </div>
      }
    />
  );
}

function Metric({
  label, value, unit, gradient, icon: Icon,
}: {
  label: string; value: string; unit: string; gradient: string;
  icon: typeof Zap;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-card p-2">
      <div className="flex items-center gap-2">
        <div className={`grid h-6 w-6 place-items-center rounded bg-gradient-to-br ${gradient} text-white shadow-sm`}>
          <Icon className="h-3 w-3" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        </div>
      </div>
      <div className="text-right">
        <span className="font-mono text-lab-sm font-bold tabular-nums">{value}</span>
        {unit && <span className="ml-1 text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
