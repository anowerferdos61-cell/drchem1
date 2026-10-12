/**
 * Fuel Combustion & Environmental Impact
 * NCTB Class 9-10 · Chapter 11 · খনিজ সম্পদ: জীবাশ্ম
 *
 * Interactive bilingual (Bangla + English) simulation contrasting
 * fossil fuels (methane, butane, coal) with green ethanol.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Power, RotateCcw, Leaf, Factory, Gauge, Wind, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TheoryLabShell from "./TheoryLabShell";

interface Props {
  onBack: () => void;
}

/* ─────────────────────────────────────────────────────────
 * Fuel registry — chemistry + environmental profile
 * ───────────────────────────────────────────────────────── */

type FuelId = "methane" | "butane" | "coal" | "ethanol";

interface FuelSpec {
  id: FuelId;
  bn: string;
  en: string;
  formula: string;
  category: "fossil" | "green";
  /** CO₂ produced per unit fuel per second (relative) */
  co2Rate: number;
  /** Soot / particulates produced (0..1 scale) */
  sootRate: number;
  /** Heat / energy generated per second (relative MJ) */
  energyRate: number;
  /** Flame colours */
  flameInner: string;
  flameOuter: string;
  /** Balanced equation (rendered as unicode) */
  equation: string;
  note: { bn: string; en: string };
}

const FUELS: Record<FuelId, FuelSpec> = {
  methane: {
    id: "methane",
    bn: "মিথেন (প্রাকৃতিক গ্যাস)",
    en: "Methane (Natural Gas)",
    formula: "CH₄",
    category: "fossil",
    co2Rate: 0.9,
    sootRate: 0.05,
    energyRate: 1.0,
    flameInner: "#60a5fa",
    flameOuter: "#facc15",
    equation: "CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g) + ΔH",
    note: {
      bn: "নীল শিখা · অপেক্ষাকৃত পরিচ্ছন্ন দহন · তবু গ্রিনহাউস CO₂ নিঃসরণ।",
      en: "Blue flame · relatively clean burn · still emits greenhouse CO₂.",
    },
  },
  butane: {
    id: "butane",
    bn: "বিউটেন (LPG সিলিন্ডার)",
    en: "Butane (LPG)",
    formula: "C₄H₁₀",
    category: "fossil",
    co2Rate: 1.4,
    sootRate: 0.15,
    energyRate: 1.3,
    flameInner: "#3b82f6",
    flameOuter: "#f97316",
    equation: "2C₄H₁₀(g) + 13O₂(g) → 8CO₂(g) + 10H₂O(g) + ΔH",
    note: {
      bn: "রান্নার গ্যাস · উচ্চ শক্তি · কিন্তু প্রতি অণুতে বেশি কার্বন → বেশি CO₂।",
      en: "Household LPG · high energy · more carbons per molecule → more CO₂.",
    },
  },
  coal: {
    id: "coal",
    bn: "কয়লা (বিশুদ্ধ কার্বন)",
    en: "Coal (Pure Carbon)",
    formula: "C",
    category: "fossil",
    co2Rate: 1.7,
    sootRate: 0.95,
    energyRate: 0.85,
    flameInner: "#f87171",
    flameOuter: "#7c2d12",
    equation: "C(s) + O₂(g) → CO₂(g) + কালো ধোঁয়া / ছাই + ΔH",
    note: {
      bn: "ঘন কালো ধোঁয়া · সালফার অক্সাইড ও ছাই · বায়ু দূষণের প্রধান কারণ।",
      en: "Thick soot, SOₓ and ash · a leading cause of air pollution.",
    },
  },
  ethanol: {
    id: "ethanol",
    bn: "ইথানল (জৈব জ্বালানি)",
    en: "Ethanol (Biofuel)",
    formula: "C₂H₅OH",
    category: "green",
    co2Rate: 0.55,
    sootRate: 0.0,
    energyRate: 0.9,
    flameInner: "#a5f3fc",
    flameOuter: "#67e8f9",
    equation: "C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(g) + ΔH",
    note: {
      bn: "নবায়নযোগ্য · পরিচ্ছন্ন হালকা নীল শিখা · কোনো সট নেই · কার্বন-নিরপেক্ষ চক্র।",
      en: "Renewable · clean pale-blue flame · no soot · near carbon-neutral cycle.",
    },
  },
};

const FUEL_ORDER: FuelId[] = ["methane", "butane", "coal", "ethanol"];

/* ─────────────────────────────────────────────────────────
 * Locale
 * ───────────────────────────────────────────────────────── */
const LOCALE = {
  bn: {
    title: "জ্বালানি দহন ও পরিবেশ",
    subtitle: "Chapter 11 · Fuel Combustion & Environmental Impact",
    fuel: "জ্বালানি নির্বাচন",
    burner: "বার্নার",
    ignite: "জ্বালান",
    stop: "বন্ধ করুন",
    reset: "রিসেট",
    flow: "জ্বালানি প্রবাহ",
    footprint: "কার্বন ফুটপ্রিন্ট",
    smoke: "ধোঁয়া / সট",
    energy: "উৎপন্ন শক্তি (MJ)",
    efficiency: "দক্ষতা vs পরিবেশ",
    equation: "রাসায়নিক সমীকরণ",
    theory: "থিওরি ও পরিবেশগত প্রভাব",
    clean: "পরিচ্ছন্ন জ্বালানি",
    fossil: "জীবাশ্ম জ্বালানি",
    warming: "বৈশ্বিক উষ্ণতা",
  },
  en: {
    title: "Fuel Combustion & Environment",
    subtitle: "Chapter 11 · জীবাশ্ম জ্বালানি ও পরিবেশ",
    fuel: "Select Fuel",
    burner: "Burner",
    ignite: "Ignite",
    stop: "Stop",
    reset: "Reset",
    flow: "Fuel Flow Rate",
    footprint: "Carbon Footprint",
    smoke: "Smoke / Soot",
    energy: "Energy Generated (MJ)",
    efficiency: "Efficiency vs Damage",
    equation: "Balanced Equation",
    theory: "Theory & Environmental Impact",
    clean: "Clean Fuel",
    fossil: "Fossil Fuel",
    warming: "Global Warming",
  },
} as const;

type Lang = "bn" | "en";

/* ─────────────────────────────────────────────────────────
 * Particle system for CO₂ / soot rising through the dome
 * ───────────────────────────────────────────────────────── */

interface Particle {
  id: number;
  x: number;
  y: number;
  vy: number;
  kind: "co2" | "h2o" | "soot";
  life: number;
}

let PID = 0;

function BurnerScene({
  fuel,
  burning,
  flow,
  particles,
  smokeDensity,
}: {
  fuel: FuelSpec;
  burning: boolean;
  flow: number;
  particles: Particle[];
  smokeDensity: number;
}) {
  const flameHeight = burning ? 60 + flow * 60 : 0;
  const wobble = burning ? Math.sin(Date.now() / 120) * 4 : 0;

  return (
    <svg
      viewBox="0 0 400 460"
      className="h-full w-full drop-shadow-[0_0_20px_rgba(56,189,248,0.15)]"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="dome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(148,163,184,0.35)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0.05)" />
        </linearGradient>
        <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={fuel.flameOuter} />
          <stop offset="100%" stopColor={fuel.flameInner} />
        </linearGradient>
        <radialGradient id="smokeGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(30,41,59,0.9)" />
          <stop offset="100%" stopColor="rgba(30,41,59,0)" />
        </radialGradient>
      </defs>

      {/* Atmospheric dome */}
      <path
        d="M40 260 Q200 40 360 260 L360 300 L40 300 Z"
        fill="url(#dome)"
        stroke="rgba(148,163,184,0.4)"
        strokeWidth="1.5"
      />
      {/* Smoke haze inside dome */}
      {smokeDensity > 0.02 && (
        <rect
          x="40"
          y="70"
          width="320"
          height="220"
          fill="url(#smokeGrad)"
          opacity={Math.min(0.85, smokeDensity)}
        />
      )}

      {/* Particles */}
      {particles.map((p) => {
        if (p.kind === "co2") {
          return (
            <g key={p.id} opacity={Math.max(0, 1 - p.life / 100)}>
              <circle cx={p.x} cy={p.y} r="9" fill="rgba(148,163,184,0.9)" />
              <text
                x={p.x}
                y={p.y + 3}
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                fill="#0f172a"
              >
                CO₂
              </text>
            </g>
          );
        }
        if (p.kind === "h2o") {
          return (
            <g key={p.id} opacity={Math.max(0, 1 - p.life / 100)}>
              <circle cx={p.x} cy={p.y} r="7" fill="rgba(125,211,252,0.85)" />
              <text
                x={p.x}
                y={p.y + 3}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="#0c4a6e"
              >
                H₂O
              </text>
            </g>
          );
        }
        // soot
        return (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={3 + Math.random() * 3}
            fill="#0f172a"
            opacity={Math.max(0, 1 - p.life / 120)}
          />
        );
      })}

      {/* Burner base */}
      <rect x="160" y="360" width="80" height="18" rx="4" fill="#334155" />
      <rect x="180" y="378" width="40" height="60" rx="6" fill="#1e293b" />
      <circle cx="200" cy="360" r="12" fill="#0f172a" />

      {/* Flame */}
      {burning && (
        <>
          <path
            d={`M${188 + wobble} 360
                Q${200} ${360 - flameHeight * 1.1} ${212 - wobble} 360
                Q${206} ${360 - flameHeight * 0.4} ${200} 360
                Q${194} ${360 - flameHeight * 0.4} ${188 + wobble} 360 Z`}
            fill="url(#flame)"
            opacity="0.95"
          />
          {fuel.id === "coal" && (
            <circle
              cx={200}
              cy={360 - flameHeight * 0.3}
              r={10 + Math.random() * 4}
              fill="#7c2d12"
              opacity="0.55"
            />
          )}
          <ellipse
            cx="200"
            cy={360 - flameHeight * 0.5}
            rx="6"
            ry={flameHeight * 0.35}
            fill={fuel.flameInner}
            opacity="0.8"
          />
        </>
      )}

      {/* Fuel label */}
      <text x="200" y="425" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e2e8f0">
        {fuel.formula}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
 * MAIN
 * ───────────────────────────────────────────────────────── */
export default function FuelCombustionEnvLab({ onBack }: Props) {
  const [lang, setLang] = useState<Lang>("bn");
  const t = LOCALE[lang];
  const [fuelId, setFuelId] = useState<FuelId>("methane");
  const [burning, setBurning] = useState(false);
  const [flow, setFlow] = useState(0.6);
  const [co2, setCo2] = useState(0);
  const [smoke, setSmoke] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [co2History, setCo2History] = useState<number[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  const fuel = FUELS[fuelId];

  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const sinceHist = useRef<number>(0);

  useEffect(() => {
    if (!burning) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last.current) / 1000);
      last.current = now;

      // Accumulate metrics
      setCo2((v) => v + fuel.co2Rate * flow * dt * 3);
      setSmoke((v) => Math.min(1, v + fuel.sootRate * flow * dt * 0.4));
      setEnergy((v) => v + fuel.energyRate * flow * dt * 2);

      // Emit particles
      setParticles((prev) => {
        const next = prev
          .map((p) => ({ ...p, y: p.y + p.vy * dt * 60, life: p.life + 1 }))
          .filter((p) => p.life < 120 && p.y > 40);

        const emit = Math.random() < flow * 0.9 ? 1 : 0;
        for (let i = 0; i < emit; i++) {
          const roll = Math.random();
          let kind: Particle["kind"] = "co2";
          if (fuel.sootRate > 0.3 && roll < fuel.sootRate * 0.7) kind = "soot";
          else if (roll < 0.35) kind = "h2o";
          next.push({
            id: PID++,
            x: 180 + Math.random() * 40,
            y: 340,
            vy: -(0.6 + Math.random() * 0.7),
            kind,
            life: 0,
          });
        }
        return next.slice(-60);
      });

      // History sample every ~300ms
      sinceHist.current += dt;
      if (sinceHist.current > 0.3) {
        sinceHist.current = 0;
        setCo2History((h) => {
          const n = [...h, fuel.co2Rate * flow];
          return n.slice(-40);
        });
      }

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [burning, fuel, flow]);

  // When burner is off, decay smoke slowly
  useEffect(() => {
    if (burning) return;
    const iv = setInterval(() => {
      setSmoke((s) => Math.max(0, s - 0.02));
      setParticles((prev) =>
        prev.map((p) => ({ ...p, y: p.y - 1, life: p.life + 2 })).filter((p) => p.life < 120),
      );
    }, 100);
    return () => clearInterval(iv);
  }, [burning]);

  const reset = () => {
    setBurning(false);
    setCo2(0);
    setSmoke(0);
    setEnergy(0);
    setCo2History([]);
    setParticles([]);
  };

  // Score: energy per unit CO₂
  const efficiency = useMemo(() => {
    if (co2 < 0.1) return 100;
    return Math.max(0, Math.min(100, (energy / co2) * 40));
  }, [energy, co2]);

  const info = (
    <>
      <Card className="border-slate-700/60 bg-slate-900/70 p-3 text-slate-100 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-400" />
          <div className="text-sm font-bold">{t.title}</div>
        </div>
        <div className="mt-1 text-xs text-slate-400">{t.subtitle}</div>
        <div className="mt-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              fuel.category === "green"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                : "border-orange-500/50 bg-orange-500/10 text-orange-300"
            }
          >
            {fuel.category === "green" ? (
              <Leaf className="mr-1 h-3 w-3" />
            ) : (
              <Factory className="mr-1 h-3 w-3" />
            )}
            {fuel.category === "green" ? t.clean : t.fossil}
          </Badge>
          <Badge variant="secondary" className="bg-slate-800 text-slate-200">
            {fuel.formula}
          </Badge>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          {lang === "bn" ? fuel.note.bn : fuel.note.en}
        </p>
      </Card>

      <Card className="border-slate-700/60 bg-slate-900/70 p-3 text-slate-100">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Gauge className="h-3.5 w-3.5 text-fuchsia-400" /> {t.equation}
        </div>
        <div className="rounded-md bg-slate-950/70 p-2 font-mono text-[11px] leading-relaxed text-emerald-300">
          {fuel.equation}
        </div>
      </Card>

      <Card className="border-slate-700/60 bg-slate-900/70 p-3 text-slate-100">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Cloud className="h-3.5 w-3.5 text-sky-400" /> {t.footprint}
        </div>
        <MeterBar
          label={t.footprint}
          value={Math.min(100, co2)}
          color="from-orange-500 to-red-500"
        />
        <MeterBar label={t.smoke} value={smoke * 100} color="from-slate-500 to-slate-800" />
        <MeterBar
          label={t.energy}
          value={Math.min(100, energy)}
          color="from-emerald-500 to-teal-500"
        />
        <MeterBar label={t.efficiency} value={efficiency} color="from-sky-500 to-indigo-500" />

        {/* Mini CO₂ line chart */}
        <div className="mt-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">CO₂ / t</div>
          <svg viewBox="0 0 200 40" className="h-10 w-full">
            <polyline
              fill="none"
              stroke="#f97316"
              strokeWidth="1.5"
              points={co2History
                .map((v, i) => `${(i / Math.max(1, co2History.length - 1)) * 200},${40 - v * 20}`)
                .join(" ")}
            />
          </svg>
        </div>
      </Card>
    </>
  );

  const controls = (
    <>
      <Card className="border-slate-700/60 bg-slate-900/70 p-3 text-slate-100">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-300">{t.fuel}</div>
          <div className="flex gap-1">
            <button
              onClick={() => setLang("bn")}
              className={`rounded px-2 py-0.5 text-[10px] ${
                lang === "bn" ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              BN
            </button>
            <button
              onClick={() => setLang("en")}
              className={`rounded px-2 py-0.5 text-[10px] ${
                lang === "en" ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              EN
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {FUEL_ORDER.map((id) => {
            const f = FUELS[id];
            const active = id === fuelId;
            return (
              <button
                key={id}
                onClick={() => {
                  setFuelId(id);
                  reset();
                }}
                className={`rounded-lg border p-2 text-left text-[11px] transition ${
                  active
                    ? "border-emerald-500/70 bg-emerald-500/15 text-emerald-200"
                    : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500"
                }`}
              >
                <div className="font-bold">{f.formula}</div>
                <div className="truncate text-[10px] opacity-80">{lang === "bn" ? f.bn : f.en}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="border-slate-700/60 bg-slate-900/70 p-3 text-slate-100">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Power className="h-3.5 w-3.5 text-amber-400" /> {t.burner}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setBurning((b) => !b)}
            className={
              burning
                ? "flex-1 bg-red-600 hover:bg-red-500"
                : "flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900"
            }
          >
            <Flame className="mr-1 h-3.5 w-3.5" />
            {burning ? t.stop : t.ignite}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={reset}
            className="border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-slate-300">
            <span>{t.flow}</span>
            <span className="font-mono">{Math.round(flow * 100)}%</span>
          </div>
          <Slider
            value={[flow * 100]}
            min={10}
            max={100}
            step={5}
            onValueChange={(v) => setFlow(v[0] / 100)}
          />
        </div>
      </Card>

      <Card className="border-slate-700/60 bg-slate-900/70 p-3 text-xs text-slate-200">
        <div className="mb-1 flex items-center gap-2 font-semibold text-emerald-300">
          <Leaf className="h-3.5 w-3.5" /> {t.warming}
        </div>
        <p className="leading-relaxed text-slate-300">
          {lang === "bn"
            ? "ইথানল প্রতি মেগাজুল শক্তিতে জীবাশ্ম জ্বালানির তুলনায় অনেক কম CO₂ নিঃসরণ করে এবং নবায়নযোগ্য, তাই বৈশ্বিক উষ্ণতা কমাতে সাহায্য করে।"
            : "Ethanol emits far less CO₂ per megajoule than fossil fuels and is renewable — helping mitigate global warming."}
        </p>
      </Card>
    </>
  );

  const visual = (
    <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-900/70 to-slate-950/90 p-2 backdrop-blur-md">
      <BurnerScene
        fuel={fuel}
        burning={burning}
        flow={flow}
        particles={particles}
        smokeDensity={smoke}
      />
      <div className="pointer-events-none absolute left-2 top-2 flex gap-1">
        <Badge className="bg-slate-800/80 text-[10px] text-slate-200 backdrop-blur">
          <Wind className="mr-1 h-3 w-3" /> {t.footprint}: {Math.round(co2)}
        </Badge>
      </div>
    </div>
  );

  const theory = (
    <div className="space-y-3 text-sm">
      <h3 className="font-bold">জীবাশ্ম জ্বালানি vs সবুজ জ্বালানি</h3>
      <p>
        মিথেন, বিউটেন ও কয়লার মতো জীবাশ্ম জ্বালানি দহনের ফলে বায়ুমণ্ডলে বিপুল পরিমাণে CO₂ যোগ হয়
        — যা গ্রিনহাউস প্রভাব বাড়িয়ে <b>বৈশ্বিক উষ্ণতা</b>
        (Global Warming) ঘটায়। কয়লা অতিরিক্ত <b>সট, SOₓ ও ছাই</b> নিঃসরণ করে বায়ু দূষণ বাড়ায়।
      </p>
      <p>
        অপরদিকে <b>ইথানল (C₂H₅OH)</b> নবায়নযোগ্য উৎস (আখ, ভুট্টা, বায়োমাস) থেকে তৈরি হয় এবং প্রতি
        মেগাজুলে অনেক কম CO₂ নিঃসরণ করে। এর দহন সট- মুক্ত এবং কার্বন চক্রে প্রায় নিরপেক্ষ।
      </p>
      <ul className="list-disc pl-5">
        <li>CH₄ + 2O₂ → CO₂ + 2H₂O + ΔH (নীল শিখা)</li>
        <li>2C₄H₁₀ + 13O₂ → 8CO₂ + 10H₂O + ΔH (LPG)</li>
        <li>C + O₂ → CO₂ + সট / ছাই (কয়লা)</li>
        <li>C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O + ΔH (সবুজ জ্বালানি)</li>
      </ul>
    </div>
  );

  return (
    <TheoryLabShell
      onBack={onBack}
      headerIcon={
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white shadow">
          <Flame className="h-4 w-4" />
        </div>
      }
      titleBn={t.title}
      subtitleEn={t.subtitle}
      badge={
        <Tabs value={lang} onValueChange={(v) => setLang(v as Lang)}>
          <TabsList className="h-7">
            <TabsTrigger value="bn" className="h-6 px-2 text-[10px]">
              বাংলা
            </TabsTrigger>
            <TabsTrigger value="en" className="h-6 px-2 text-[10px]">
              English
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
      info={info}
      visual={visual}
      controls={controls}
      theory={theory}
      theoryLabel={t.theory}
    />
  );
}

function MeterBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-0.5 flex justify-between text-[10px] text-slate-400">
        <span>{label}</span>
        <span className="font-mono">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
