/**
 * Kinetic Theory of Matter — Particle Simulator
 * পদার্থের গতিতত্ত্ব — কণা সিমুলেটর
 *
 * Chapter 2 (পদার্থের অবস্থা): Interactive beaker showing how temperature
 * controls particle kinetic energy & intermolecular attraction, driving
 * phase transitions Solid → Liquid → Gas.
 *
 * Pure HTML5 canvas — no extra deps.
 */
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowLeft,
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

interface Props {
  onBack: () => void;
}

type Phase = "solid" | "liquid" | "gas";

interface Substance {
  id: string;
  bn: string;
  en: string;
  formula: string;
  melt: number; // °C
  boil: number; // °C
  tempMin: number; // slider range
  tempMax: number;
  emoji: string;
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
  solid: {
    bn: "কঠিন",
    en: "Solid",
    color: "from-sky-500 to-blue-600",
    ring: "ring-sky-400/40",
    icon: Snowflake,
    tip: "কণাগুলো নির্দিষ্ট অবস্থানে কম্পিত হচ্ছে — আন্তঃআণবিক আকর্ষণ সবচেয়ে বেশি।",
  },
  liquid: {
    bn: "তরল",
    en: "Liquid",
    color: "from-cyan-500 to-teal-600",
    ring: "ring-cyan-400/40",
    icon: Droplets,
    tip: "কণাগুলো গড়িয়ে চলছে কিন্তু একসাথে থাকছে — মাঝারি আকর্ষণ।",
  },
  gas: {
    bn: "গ্যাস",
    en: "Gas",
    color: "from-amber-500 to-orange-600",
    ring: "ring-amber-400/40",
    icon: Wind,
    tip: "কণাগুলো মুক্তভাবে ছুটছে — আন্তঃআণবিক আকর্ষণ প্রায় শূন্য।",
  },
};

const PARTICLE_COUNT = 90;
const PARTICLE_R = 7;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
}

export default function KineticTheoryLab({ onBack }: Props) {
  const [substanceId, setSubstanceId] = useState<string>("water");
  const substance = useMemo(
    () => SUBSTANCES.find((s) => s.id === substanceId) ?? SUBSTANCES[0],
    [substanceId],
  );

  // Temperature in °C, clamped to substance range
  const [temp, setTemp] = useState<number>(20);

  // When substance changes, snap temp to a sensible default (just below melt)
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

  // Gauges (0..100) — based on position within substance's range
  const range = Math.max(1, substance.tempMax - substance.tempMin);
  const norm = Math.max(0, Math.min(1, (temp - substance.tempMin) / range));
  const kineticEnergy = Math.round(8 + norm * 92);
  const attraction = Math.round(Math.max(2, 100 - norm * 98));
  const tempCelsius = temp;


  // ── Initialise particles in lattice ──
  useEffect(() => {
    const W = 360;
    const H = 420;
    const cols = 10;
    const rows = 9;
    const spacingX = 26;
    const spacingY = 26;
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

  // ── Simulation loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    // Beaker bounds (inside walls)
    const beaker = { left: 30, right: W - 30, top: 60, bottom: H - 30 };

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(32, now - last) / 16.67; // normalised
      last = now;
      const t = tempRef.current;
      const sub = substanceRef.current;
      const ph = phaseFromTemp(t, sub);

      const particles = particlesRef.current;

      // Normalised "thermal intensity" within current phase (0..1+)
      let intensity: number;
      if (ph === "solid") {
        // 0 at tempMin, ~1 at melt
        const span = Math.max(1, sub.melt - sub.tempMin);
        intensity = Math.max(0.05, (t - sub.tempMin) / span);
      } else if (ph === "liquid") {
        const span = Math.max(1, sub.boil - sub.melt);
        intensity = 0.3 + (t - sub.melt) / span; // 0.3..1.3
      } else {
        const span = Math.max(1, sub.tempMax - sub.boil);
        intensity = 0.8 + Math.min(1.5, (t - sub.boil) / span);
      }

      const energy = intensity;
      const maxSpeed = ph === "solid" ? 0.2 + intensity * 0.6 : ph === "liquid" ? 1.0 + intensity * 1.4 : 3.5 + intensity * 2.5;


      for (const p of particles) {
        // Thermal jitter
        const jitter = energy * (ph === "solid" ? 0.6 : ph === "liquid" ? 1.4 : 2.2);
        p.vx += (Math.random() - 0.5) * jitter;
        p.vy += (Math.random() - 0.5) * jitter;

        if (ph === "solid") {
          // Strong restoring force to lattice
          const k = 0.25;
          p.vx += (p.ax - p.x) * k;
          p.vy += (p.ay - p.y) * k;
          p.vx *= 0.55;
          p.vy *= 0.55;
        } else if (ph === "liquid") {
          // Gravity + settle in lower half
          p.vy += 0.18;
          // Loose cohesion toward bottom region
          const targetY = beaker.bottom - 90;
          if (p.y < targetY - 40) p.vy += 0.05;
          p.vx *= 0.94;
          p.vy *= 0.94;
        } else {
          // Gas: no gravity, mild damping so they don't slow forever
          p.vx *= 0.995;
          p.vy *= 0.995;
        }

        // Clamp speed
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > maxSpeed) {
          p.vx = (p.vx / sp) * maxSpeed;
          p.vy = (p.vy / sp) * maxSpeed;
        }

        // Integrate
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Walls (beaker)
        if (p.x < beaker.left + PARTICLE_R) {
          p.x = beaker.left + PARTICLE_R;
          p.vx = Math.abs(p.vx) * 0.8;
        }
        if (p.x > beaker.right - PARTICLE_R) {
          p.x = beaker.right - PARTICLE_R;
          p.vx = -Math.abs(p.vx) * 0.8;
        }
        if (p.y > beaker.bottom - PARTICLE_R) {
          p.y = beaker.bottom - PARTICLE_R;
          p.vy = -Math.abs(p.vy) * 0.8;
        }
        if (p.y < beaker.top + PARTICLE_R) {
          p.y = beaker.top + PARTICLE_R;
          p.vy = Math.abs(p.vy) * 0.8;
        }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, W, H);

      // Background gradient (cool blue → warm orange based on intensity)
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      const warm = Math.min(1, Math.max(0, (t - sub.tempMin) / Math.max(1, sub.tempMax - sub.tempMin)));
      bg.addColorStop(0, `rgba(${30 + warm * 80}, ${60 + warm * 30}, ${120 - warm * 80}, 0.05)`);
      bg.addColorStop(1, `rgba(${100 + warm * 120}, ${120 + warm * 40}, ${180 - warm * 140}, 0.12)`);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Beaker — glass
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

      // Volume marks
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const y = beaker.top + (i * (beaker.bottom - beaker.top)) / 5;
        ctx.beginPath();
        ctx.moveTo(beaker.left + 4, y);
        ctx.lineTo(beaker.left + 18, y);
        ctx.stroke();
      }

      // Particles
      for (const p of particles) {
        // Heat glow scales with speed
        const sp = Math.hypot(p.vx, p.vy);
        const glow = Math.min(1, sp / 4);
        const r1 = ph === "gas" ? 180 + glow * 75 : 80 + glow * 80;
        const g1 = ph === "gas" ? 140 - glow * 40 : 160 + glow * 40;
        const b1 = ph === "gas" ? 60 : 240;

        const grad = ctx.createRadialGradient(
          p.x - 2,
          p.y - 2,
          1,
          p.x,
          p.y,
          PARTICLE_R + 2,
        );
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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const reset = () => {
    setTemp(
      Math.round(substance.melt - (substance.boil - substance.melt) * 0.3),
    );
  };


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/20 shrink-0">
              <Thermometer className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-extrabold tracking-tight md:text-base truncate">
                পদার্থের গতিতত্ত্ব — কণা সিমুলেটর
              </div>
              <div className="text-[10px] text-muted-foreground md:text-xs truncate">
                Chapter 2 · Kinetic Theory of Matter
              </div>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`gap-1.5 border bg-gradient-to-r ${meta.color} text-white border-white/10 shrink-0`}
          >
            <PhaseIcon className="h-3.5 w-3.5" />
            <span className="font-semibold">
              {meta.bn} · {meta.en}
            </span>
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Canvas Stage ── */}
          <Card className="relative overflow-hidden border-0 shadow-2xl shadow-cyan-500/10 bg-gradient-to-br from-white via-slate-50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <div className="p-3 md:p-4">
              <div className="relative mx-auto aspect-[3/3.5] max-w-md rounded-xl bg-gradient-to-b from-slate-100/60 to-slate-200/40 dark:from-slate-800/40 dark:to-slate-900/60 ring-1 ring-slate-300/40 dark:ring-slate-700/40">
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={420}
                  className="absolute inset-0 h-full w-full"
                />
                {/* Phase label floating */}
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/85 px-3 py-1.5 text-xs font-semibold shadow ring-1 ring-border">
                  <PhaseIcon className="h-3.5 w-3.5" />
                  {meta.bn}
                </div>
                {/* Temperature badge */}
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-xs font-semibold shadow ring-1 ring-border">
                  <Thermometer className="h-3.5 w-3.5 text-rose-500" />
                  {tempCelsius}°C
                </div>
              </div>
            </div>

            {/* Substance + Temperature footer */}
            <div className="border-t bg-background/60 px-4 py-4 md:px-6 space-y-4">
              {/* Substance selector */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">পদার্থ নির্বাচন — Substance</span>
                  <span className="text-[11px] text-muted-foreground">
                    গলনাঙ্ক <b className="text-foreground">{substance.melt}°C</b> · স্ফুটনাঙ্ক <b className="text-foreground">{substance.boil}°C</b>
                  </span>
                </div>
                <Select value={substanceId} onValueChange={setSubstanceId}>
                  <SelectTrigger className="w-full">
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
              </div>

              {/* Temperature slider */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                    <Snowflake className="h-3.5 w-3.5" /> {substance.tempMin}°C
                  </span>
                  <span className="text-muted-foreground">তাপমাত্রা — {tempCelsius}°C</span>
                  <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                    {substance.tempMax}°C <Flame className="h-3.5 w-3.5" />
                  </span>
                </div>
                <Slider
                  value={[temp]}
                  onValueChange={(v) => setTemp(v[0])}
                  min={substance.tempMin}
                  max={substance.tempMax}
                  step={1}
                  className="my-3"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>কঠিন (&lt; {substance.melt}°C)</span>
                  <span>তরল</span>
                  <span>গ্যাস (&gt; {substance.boil}°C)</span>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                </div>
              </div>
            </div>

          </Card>

          {/* ── Side Panels ── */}
          <div className="space-y-4">
            {/* Phase info card */}
            <Card className={`overflow-hidden border-0 ring-2 ${meta.ring} shadow-lg`}>
              <div className={`bg-gradient-to-br ${meta.color} px-4 py-3 text-white`}>
                <div className="flex items-center gap-2 text-xs font-medium opacity-90">
                  <PhaseIcon className="h-3.5 w-3.5" /> বর্তমান অবস্থা
                </div>
                <div className="mt-1 text-xl font-extrabold">
                  {meta.bn} <span className="text-sm font-medium opacity-80">/ {meta.en}</span>
                </div>
              </div>
              <div className="space-y-2 px-4 py-3 text-sm text-foreground/90">
                <p className="leading-relaxed">{meta.tip}</p>
              </div>
            </Card>

            {/* Gauges */}
            <Card className="p-4 space-y-4">
              <Gauge
                icon={Activity}
                labelBn="গতিশক্তি (KE)"
                labelEn="Kinetic Energy"
                value={kineticEnergy}
                gradient="from-amber-400 to-orange-600"
              />
              <Gauge
                icon={Magnet}
                labelBn="আন্তঃআণবিক আকর্ষণ"
                labelEn="Intermolecular Force"
                value={attraction}
                gradient="from-sky-400 to-blue-600"
              />
            </Card>

            {/* Concept callout */}
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Info className="h-3.5 w-3.5" /> Concept
              </div>
              <ul className="space-y-1.5 text-xs leading-relaxed text-foreground/85">
                <li>• তাপমাত্রা বাড়লে কণার <b>গতিশক্তি</b> বাড়ে।</li>
                <li>• গতিশক্তি বাড়লে আন্তঃআণবিক আকর্ষণ দুর্বল হয়।</li>
                <li>• গলনাঙ্ক → কঠিন থেকে তরল; স্ফুটনাঙ্ক → তরল থেকে গ্যাস।</li>
                <li>• গ্যাস অবস্থায় কণাগুলো পাত্রের সমস্ত আয়তন দখল করে।</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Gauge component ──
function Gauge({
  icon: Icon,
  labelBn,
  labelEn,
  value,
  gradient,
}: {
  icon: typeof Activity;
  labelBn: string;
  labelEn: string;
  value: number;
  gradient: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{labelBn}</span>
          <span className="text-[10px] font-normal text-muted-foreground">/ {labelEn}</span>
        </div>
        <span className="text-xs font-bold tabular-nums">{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
