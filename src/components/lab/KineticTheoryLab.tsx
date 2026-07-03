/**
 * Kinetic Theory of Matter — Particle Simulator
 * পদার্থের গতিতত্ত্ব — কণা সিমুলেটর
 *
 * Uses TheoryLabShell → same UX pattern as every other theory lab.
 */
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Thermometer,
  Snowflake,
  Droplets,
  Wind,
  Flame,
  RotateCcw,
  Activity,
  Magnet,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TheoryLabShell from "./TheoryLabShell";

interface Props {
  onBack: () => void;
}

type Phase = "solid" | "liquid" | "gas";

interface Substance {
  id: string; bn: string; en: string; formula: string;
  melt: number; boil: number; tempMin: number; tempMax: number; emoji: string;
}

const SUBSTANCES: Substance[] = [
  { id: "water",   bn: "পানি",      en: "Water",    formula: "H₂O", melt: 0,    boil: 100,  tempMin: -20,  tempMax: 200,  emoji: "💧" },
  { id: "iron",    bn: "লোহা",      en: "Iron",     formula: "Fe",  melt: 1538, boil: 2862, tempMin: 25,   tempMax: 3200, emoji: "⚙️" },
  { id: "copper",  bn: "তামা",      en: "Copper",   formula: "Cu",  melt: 1085, boil: 2562, tempMin: 25,   tempMax: 2800, emoji: "🟧" },
  { id: "aluminum",bn: "অ্যালুমিনিয়াম", en: "Aluminum", formula: "Al",  melt: 660,  boil: 2470, tempMin: 25,   tempMax: 2700, emoji: "🪙" },
  { id: "gold",    bn: "স্বর্ণ",     en: "Gold",     formula: "Au",  melt: 1064, boil: 2856, tempMin: 25,   tempMax: 3100, emoji: "🥇" },
  { id: "mercury", bn: "পারদ",      en: "Mercury",  formula: "Hg",  melt: -39,  boil: 357,  tempMin: -80,  tempMax: 500,  emoji: "🌡️" },
  { id: "ice_n2",  bn: "নাইট্রোজেন", en: "Nitrogen", formula: "N₂",  melt: -210, boil: -196, tempMin: -250, tempMax: -100, emoji: "❄️" },
  { id: "salt",    bn: "লবণ",       en: "Salt",     formula: "NaCl",melt: 801,  boil: 1465, tempMin: 25,   tempMax: 1800, emoji: "🧂" },
];

function phaseFromTemp(t: number, s: Substance): Phase {
  if (t < s.melt) return "solid";
  if (t < s.boil) return "liquid";
  return "gas";
}

const PHASE_META: Record<
  Phase,
  { bn: string; en: string; color: string; ring: string; icon: typeof Snowflake; tip: string }
> = {
  solid:  { bn: "কঠিন", en: "Solid",  color: "from-sky-500 to-blue-600",  ring: "ring-sky-400/40",  icon: Snowflake, tip: "কণাগুলো নির্দিষ্ট অবস্থানে কম্পিত হচ্ছে — আন্তঃআণবিক আকর্ষণ সবচেয়ে বেশি।" },
  liquid: { bn: "তরল",  en: "Liquid", color: "from-cyan-500 to-teal-600", ring: "ring-cyan-400/40", icon: Droplets,  tip: "কণাগুলো গড়িয়ে চলছে কিন্তু একসাথে থাকছে — মাঝারি আকর্ষণ।" },
  gas:    { bn: "গ্যাস", en: "Gas",    color: "from-amber-500 to-orange-600", ring: "ring-amber-400/40", icon: Wind, tip: "কণাগুলো মুক্তভাবে ছুটছে — আন্তঃআণবিক আকর্ষণ প্রায় শূন্য।" },
};

const PARTICLE_COUNT = 90;
const PARTICLE_R = 7;

interface Particle { x: number; y: number; vx: number; vy: number; ax: number; ay: number; }

export default function KineticTheoryLab({ onBack }: Props) {
  const [substanceId, setSubstanceId] = useState<string>("water");
  const substance = useMemo(
    () => SUBSTANCES.find((s) => s.id === substanceId) ?? SUBSTANCES[0],
    [substanceId],
  );

  const [temp, setTemp] = useState<number>(20);

  useEffect(() => {
    const def = Math.max(
      substance.tempMin,
      Math.min(substance.tempMax, Math.round(substance.melt - (substance.boil - substance.melt) * 0.3)),
    );
    setTemp(def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [substanceId]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const tempRef = useRef(temp);
  tempRef.current = temp;
  const substanceRef = useRef(substance);
  substanceRef.current = substance;

  const phase = phaseFromTemp(temp, substance);
  const meta = PHASE_META[phase];
  const PhaseIcon = meta.icon;

  const range = Math.max(1, substance.tempMax - substance.tempMin);
  const norm = Math.max(0, Math.min(1, (temp - substance.tempMin) / range));
  const kineticEnergy = Math.round(8 + norm * 92);
  const attraction = Math.round(Math.max(2, 100 - norm * 98));

  useEffect(() => {
    const W = 360, H = 420;
    const cols = 10, rows = 9, spacingX = 26, spacingY = 26;
    const startX = (W - (cols - 1) * spacingX) / 2;
    const startY = H - 30 - (rows - 1) * spacingY;
    const arr: Particle[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (arr.length >= PARTICLE_COUNT) break;
        const ax = startX + c * spacingX;
        const ay = startY + r * spacingY;
        arr.push({ x: ax, y: ay, vx: 0, vy: 0, ax, ay });
      }
    }
    particlesRef.current = arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const beaker = { left: 30, right: W - 30, top: 60, bottom: H - 30 };
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(32, now - last) / 16.67;
      last = now;
      const t = tempRef.current;
      const sub = substanceRef.current;
      const ph = phaseFromTemp(t, sub);
      const particles = particlesRef.current;

      let intensity: number;
      if (ph === "solid") {
        const span = Math.max(1, sub.melt - sub.tempMin);
        intensity = Math.max(0.05, (t - sub.tempMin) / span);
      } else if (ph === "liquid") {
        const span = Math.max(1, sub.boil - sub.melt);
        intensity = 0.3 + (t - sub.melt) / span;
      } else {
        const span = Math.max(1, sub.tempMax - sub.boil);
        intensity = 0.8 + Math.min(1.5, (t - sub.boil) / span);
      }

      const energy = intensity;
      const maxSpeed = ph === "solid" ? 0.2 + intensity * 0.6 : ph === "liquid" ? 1.0 + intensity * 1.4 : 3.5 + intensity * 2.5;

      for (const p of particles) {
        const jitter = energy * (ph === "solid" ? 0.6 : ph === "liquid" ? 1.4 : 2.2);
        p.vx += (Math.random() - 0.5) * jitter;
        p.vy += (Math.random() - 0.5) * jitter;

        if (ph === "solid") {
          const k = 0.25;
          p.vx += (p.ax - p.x) * k;
          p.vy += (p.ay - p.y) * k;
          p.vx *= 0.55; p.vy *= 0.55;
        } else if (ph === "liquid") {
          p.vy += 0.18;
          const targetY = beaker.bottom - 90;
          if (p.y < targetY - 40) p.vy += 0.05;
          p.vx *= 0.94; p.vy *= 0.94;
        } else {
          p.vx *= 0.995; p.vy *= 0.995;
        }

        const sp = Math.hypot(p.vx, p.vy);
        if (sp > maxSpeed) { p.vx = (p.vx / sp) * maxSpeed; p.vy = (p.vy / sp) * maxSpeed; }

        p.x += p.vx * dt; p.y += p.vy * dt;

        if (p.x < beaker.left + PARTICLE_R)  { p.x = beaker.left + PARTICLE_R;  p.vx =  Math.abs(p.vx) * 0.8; }
        if (p.x > beaker.right - PARTICLE_R) { p.x = beaker.right - PARTICLE_R; p.vx = -Math.abs(p.vx) * 0.8; }
        if (p.y > beaker.bottom - PARTICLE_R){ p.y = beaker.bottom - PARTICLE_R;p.vy = -Math.abs(p.vy) * 0.8; }
        if (p.y < beaker.top + PARTICLE_R)   { p.y = beaker.top + PARTICLE_R;   p.vy =  Math.abs(p.vy) * 0.8; }
      }

      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      const warm = Math.min(1, Math.max(0, (t - sub.tempMin) / Math.max(1, sub.tempMax - sub.tempMin)));
      bg.addColorStop(0, `rgba(${30 + warm * 80}, ${60 + warm * 30}, ${120 - warm * 80}, 0.05)`);
      bg.addColorStop(1, `rgba(${100 + warm * 120}, ${120 + warm * 40}, ${180 - warm * 140}, 0.12)`);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(148,163,184,0.55)";
      ctx.fillStyle = "rgba(226,232,240,0.12)";
      ctx.beginPath();
      ctx.moveTo(beaker.left - 8, beaker.top - 18);
      ctx.lineTo(beaker.left, beaker.top);
      ctx.lineTo(beaker.left, beaker.bottom);
      ctx.quadraticCurveTo(beaker.left, beaker.bottom + 14, beaker.left + 14, beaker.bottom + 14);
      ctx.lineTo(beaker.right - 14, beaker.bottom + 14);
      ctx.quadraticCurveTo(beaker.right, beaker.bottom + 14, beaker.right, beaker.bottom);
      ctx.lineTo(beaker.right, beaker.top);
      ctx.lineTo(beaker.right + 8, beaker.top - 18);
      ctx.stroke();

      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const y = beaker.top + (i * (beaker.bottom - beaker.top)) / 5;
        ctx.beginPath();
        ctx.moveTo(beaker.left + 4, y);
        ctx.lineTo(beaker.left + 18, y);
        ctx.stroke();
      }

      for (const p of particles) {
        const sp = Math.hypot(p.vx, p.vy);
        const glow = Math.min(1, sp / 4);
        const r1 = ph === "gas" ? 180 + glow * 75 : 80 + glow * 80;
        const g1 = ph === "gas" ? 140 - glow * 40 : 160 + glow * 40;
        const b1 = ph === "gas" ? 60 : 240;
        const grad = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, PARTICLE_R + 2);
        grad.addColorStop(0, `rgba(255,255,255,0.95)`);
        grad.addColorStop(0.5, `rgba(${r1},${g1},${b1},0.95)`);
        grad.addColorStop(1, `rgba(${r1 * 0.5},${g1 * 0.5},${b1 * 0.5},0.85)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PARTICLE_R, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const reset = () => {
    setTemp(Math.round(substance.melt - (substance.boil - substance.melt) * 0.3));
  };

  return (
    <TheoryLabShell
      onBack={onBack}
      titleBn="পদার্থের গতিতত্ত্ব — কণা সিমুলেটর"
      subtitleEn="Chapter 2 · Kinetic Theory of Matter"
      headerIcon={
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 shadow shadow-cyan-500/20">
          <Thermometer className="h-4 w-4 text-white" />
        </div>
      }
      badge={
        <Badge
          variant="secondary"
          className={`gap-1.5 border bg-gradient-to-r ${meta.color} text-white border-white/10`}
        >
          <PhaseIcon className="h-3.5 w-3.5" />
          <span className="text-lab-xs font-semibold">{meta.bn} · {meta.en}</span>
        </Badge>
      }

      /* ── LEFT ── */
      info={
        <>
          <Card className={`overflow-hidden border-0 shadow ring-2 ${meta.ring}`}>
            <div className={`bg-gradient-to-br ${meta.color} px-3 py-2 text-white`}>
              <div className="flex items-center gap-1.5 text-lab-xs font-medium opacity-90">
                <PhaseIcon className="h-3 w-3" /> বর্তমান অবস্থা
              </div>
              <div className="mt-0.5 font-extrabold leading-tight text-lab-lg">
                {meta.bn}{" "}
                <span className="text-lab-xs font-medium opacity-80">/ {meta.en}</span>
              </div>
            </div>
            <p className="px-3 py-2 text-lab-sm text-foreground/90">{meta.tip}</p>
          </Card>

          <Card className="space-y-3 p-3">
            <Gauge icon={Activity} labelBn="গতিশক্তি" labelEn="KE" value={kineticEnergy} gradient="from-amber-400 to-orange-600" />
            <Gauge icon={Magnet}   labelBn="আকর্ষণ"  labelEn="IMF" value={attraction}    gradient="from-sky-400 to-blue-600" />
          </Card>

          <Card className="p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Info className="h-3 w-3" /> Concept
            </div>
            <ul className="space-y-1 text-lab-sm text-foreground/85">
              <li>• তাপ বাড়লে গতিশক্তি বাড়ে।</li>
              <li>• গতিশক্তি বাড়লে আকর্ষণ কমে।</li>
              <li>• গলনাঙ্ক: কঠিন→তরল; স্ফুটনাঙ্ক: তরল→গ্যাস।</li>
            </ul>
          </Card>
        </>
      }

      /* ── CENTER: beaker auto-fits ── */
      visual={
        <div
          className="relative rounded-xl bg-gradient-to-b from-slate-100/60 to-slate-200/40 ring-1 ring-slate-300/40 dark:from-slate-800/40 dark:to-slate-900/60 dark:ring-slate-700/40"
          style={{
            aspectRatio: "360 / 420",
            maxHeight: "100%",
            maxWidth: "100%",
            height: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            width={360}
            height={420}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-lab-xs font-semibold shadow ring-1 ring-border">
            <PhaseIcon className="h-3 w-3" />
            {meta.bn}
          </div>
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-lab-xs font-semibold shadow ring-1 ring-border">
            <Thermometer className="h-3 w-3 text-rose-500" />
            {temp}°C
          </div>
        </div>
      }

      /* ── RIGHT: controls ── */
      controls={
        <>
          <Card className="p-3">
            <div className="mb-1 text-lab-xs font-medium text-muted-foreground">পদার্থ · Substance</div>
            <Select value={substanceId} onValueChange={setSubstanceId}>
              <SelectTrigger className="h-9 w-full text-lab-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBSTANCES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="mr-2">{s.emoji}</span>
                    {s.bn} ({s.en}) · {s.formula}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 flex items-center justify-between text-lab-xs text-muted-foreground">
              <span>গলনাঙ্ক <b className="text-foreground">{substance.melt}°C</b></span>
              <span>স্ফুটনাঙ্ক <b className="text-foreground">{substance.boil}°C</b></span>
            </div>
          </Card>

          <Card className="flex-1 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lab-xs font-medium text-muted-foreground">তাপমাত্রা</span>
              <span className="font-extrabold tabular-nums text-lab-xl">
                {temp}
                <span className="text-lab-sm font-medium text-muted-foreground">°C</span>
              </span>
            </div>
            <div className="mb-1.5 flex items-center justify-between text-lab-xs">
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <Snowflake className="h-3 w-3" /> {substance.tempMin}°
              </span>
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                {substance.tempMax}° <Flame className="h-3 w-3" />
              </span>
            </div>
            <Slider
              value={[temp]}
              onValueChange={(v) => setTemp(v[0])}
              min={substance.tempMin}
              max={substance.tempMax}
              step={1}
              className="my-2"
            />
            <div className="mt-1 flex items-center justify-between text-lab-xs text-muted-foreground">
              <span>কঠিন</span><span>তরল</span><span>গ্যাস</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <QuickBtn label="কঠিন" onClick={() => setTemp(Math.max(substance.tempMin, substance.melt - Math.max(20, (substance.boil - substance.melt) * 0.4)))} tone="sky" />
              <QuickBtn label="তরল"  onClick={() => setTemp(Math.round((substance.melt + substance.boil) / 2))} tone="cyan" />
              <QuickBtn label="গ্যাস" onClick={() => setTemp(Math.min(substance.tempMax, substance.boil + Math.max(20, (substance.tempMax - substance.boil) * 0.3)))} tone="orange" />
            </div>

            <Button variant="outline" size="sm" onClick={reset} className="mt-3 h-8 w-full gap-1.5 text-lab-sm">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </Card>
        </>
      }

      /* ── Optional deep theory ── */
      theory={
        <div className="space-y-3">
          <p><b>পদার্থের গতিতত্ত্ব</b> অনুসারে সকল পদার্থ ক্ষুদ্র কণা দিয়ে গঠিত এবং এই কণাগুলো সর্বদা গতিশীল। কণার গতিশক্তি নির্ভর করে তাপমাত্রার উপর।</p>
          <p><b>তিন অবস্থা:</b></p>
          <ul>
            <li><b>কঠিন —</b> কণাগুলো নির্দিষ্ট স্থানে কম্পিত হয়, আন্তঃআণবিক আকর্ষণ সবচেয়ে বেশি।</li>
            <li><b>তরল —</b> কণাগুলো গড়াতে পারে কিন্তু কাছাকাছি থাকে; আকর্ষণ মাঝারি।</li>
            <li><b>গ্যাস —</b> কণাগুলো মুক্তভাবে ছুটে চলে; আকর্ষণ প্রায় শূন্য।</li>
          </ul>
          <p><b>গলনাঙ্ক (Melting Point):</b> যে তাপমাত্রায় কঠিন পদার্থ তরলে পরিণত হয়।</p>
          <p><b>স্ফুটনাঙ্ক (Boiling Point):</b> যে তাপমাত্রায় তরল পদার্থ গ্যাসে পরিণত হয়।</p>
        </div>
      }
    />
  );
}

function QuickBtn({ label, onClick, tone }: { label: string; onClick: () => void; tone: "sky" | "cyan" | "orange" }) {
  const map = {
    sky:    "border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950",
    cyan:   "border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-950",
    orange: "border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950",
  } as const;
  return (
    <button
      onClick={onClick}
      className={`h-8 rounded-md border bg-background text-lab-sm font-semibold transition ${map[tone]}`}
    >
      {label}
    </button>
  );
}

function Gauge({
  icon: Icon, labelBn, labelEn, value, gradient,
}: {
  icon: typeof Activity; labelBn: string; labelEn: string; value: number; gradient: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1 text-lab-sm font-semibold">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span>{labelBn}</span>
          <span className="text-lab-xs font-normal text-muted-foreground">/{labelEn}</span>
        </div>
        <span className="text-lab-sm font-bold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
