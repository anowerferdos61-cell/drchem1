/**
 * Isotope Balance & Nuclear Stability Simulator
 * Chapter 3 — NCTB Class 9-10 Chemistry
 *
 * Shows protons & neutrons in a nucleus, an isotope "balance scale",
 * stability status and a radiation viewer that emits α/β/γ particles
 * when the chosen isotope is unstable.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Minus,
  Plus,
  RotateCcw,
  Atom,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  HeartPulse,
  Hourglass,
} from "lucide-react";

// ── Element data ────────────────────────────────────────────────────────────
type ElementKey = "H" | "C" | "I";

type IsotopeInfo = {
  N: number;
  stable: boolean;
  abundance?: string;
  halfLife?: string;
  decay?: "α" | "β" | "γ";
  noteBn?: string;
  noteEn?: string;
  application?: {
    titleBn: string;
    titleEn: string;
    bodyBn: string;
    icon: "fossil" | "medical" | "energy";
  };
};

type ElementData = {
  Z: number;
  symbol: string;
  nameBn: string;
  nameEn: string;
  // default + min/max neutrons reachable by ± controls
  defaultN: number;
  minN: number;
  maxN: number;
  isotopes: Record<number, IsotopeInfo>;
};

const ELEMENTS: Record<ElementKey, ElementData> = {
  H: {
    Z: 1,
    symbol: "H",
    nameBn: "হাইড্রোজেন",
    nameEn: "Hydrogen",
    defaultN: 0,
    minN: 0,
    maxN: 4,
    isotopes: {
      0: { N: 0, stable: true, abundance: "~99.98%", noteBn: "প্রোটিয়াম — সাধারণ হাইড্রোজেন।" },
      1: { N: 1, stable: true, abundance: "~0.02%", noteBn: "ডিউটেরিয়াম (²H) — ভারী পানির উপাদান।" },
      2: {
        N: 2, stable: false, halfLife: "১২.৩ বছর", decay: "β",
        noteBn: "ট্রিটিয়াম (³H) — তেজস্ক্রিয়, β-ক্ষয় ঘটে।",
      },
      3: { N: 3, stable: false, halfLife: "~১০⁻²² s", decay: "β", noteBn: "অস্থিতিশীল আইসোটোপ।" },
      4: { N: 4, stable: false, halfLife: "~১০⁻²² s", decay: "β", noteBn: "অস্থিতিশীল আইসোটোপ।" },
    },
  },
  C: {
    Z: 6,
    symbol: "C",
    nameBn: "কার্বন",
    nameEn: "Carbon",
    defaultN: 6,
    minN: 4,
    maxN: 10,
    isotopes: {
      4: { N: 4, stable: false, halfLife: "~১০⁻²¹ s", decay: "β" },
      5: { N: 5, stable: false, halfLife: "১৯.৩ s", decay: "β" },
      6: { N: 6, stable: true, abundance: "~98.9%", noteBn: "কার্বন-১২ — প্রকৃতিতে সর্বাধিক।" },
      7: { N: 7, stable: true, abundance: "~1.1%", noteBn: "কার্বন-১৩ — স্থিতিশীল।" },
      8: {
        N: 8, stable: false, halfLife: "৫৭৩০ বছর", decay: "β",
        noteBn: "কার্বন-১৪ — তেজস্ক্রিয়।",
        application: {
          titleBn: "কার্বন ডেটিং",
          titleEn: "Carbon Dating",
          bodyBn:
            "কার্বন-১৪ ব্যবহার করে প্রাচীন জীবাশ্ম ও কাঠের বয়স নির্ধারণ করা হয় (Carbon Dating).",
          icon: "fossil",
        },
      },
      9: { N: 9, stable: false, halfLife: "২.৪৫ s", decay: "β" },
      10: { N: 10, stable: false, halfLife: "০.৭৪ s", decay: "β" },
    },
  },
  I: {
    Z: 53,
    symbol: "I",
    nameBn: "আয়োডিন",
    nameEn: "Iodine",
    defaultN: 74, // I-127 stable
    minN: 70,
    maxN: 82,
    isotopes: {
      70: { N: 70, stable: false, halfLife: "৪.১৮ দিন", decay: "β" },
      71: { N: 71, stable: false, halfLife: "১৩ ঘণ্টা", decay: "β" },
      72: { N: 72, stable: false, halfLife: "৫৯.৪ দিন", decay: "γ" },
      73: { N: 73, stable: false, halfLife: "২৫ মিনিট", decay: "β" },
      74: { N: 74, stable: true, abundance: "১০০%", noteBn: "আয়োডিন-১২৭ — একমাত্র স্থিতিশীল আইসোটোপ।" },
      75: { N: 75, stable: false, halfLife: "২৫ মিনিট", decay: "β" },
      76: { N: 76, stable: false, halfLife: "৬.৫৭ ঘণ্টা", decay: "β" },
      77: { N: 77, stable: false, halfLife: "১৬.১৪ ঘণ্টা", decay: "β" },
      78: {
        N: 78, stable: false, halfLife: "৮.০২ দিন", decay: "β",
        noteBn: "আয়োডিন-১৩১ — চিকিৎসায় ব্যবহৃত।",
        application: {
          titleBn: "চিকিৎসা ব্যবহার",
          titleEn: "Medical Application",
          bodyBn:
            "আয়োডিন-১৩১ থাইরয়েড ক্যান্সার নিরাময় ও থাইরয়েড গ্রন্থির ছবি তোলায় ব্যবহার হয়।",
          icon: "medical",
        },
      },
      79: { N: 79, stable: false, halfLife: "২.৩ ঘণ্টা", decay: "β" },
      80: { N: 80, stable: false, halfLife: "৫২.৫ মিনিট", decay: "β" },
      81: { N: 81, stable: false, halfLife: "২.৩ মিনিট", decay: "β" },
      82: { N: 82, stable: false, halfLife: "২২.৩ s", decay: "β" },
    },
  },
};

// Bengali digits helper
const BN_DIGIT = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const toBn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGIT[Number(d)]);

// Map Z digits and A digits to unicode super/sub.
const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};
const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
};
const sup = (n: number) => String(n).split("").map((d) => SUP[d]).join("");
const sub = (n: number) => String(n).split("").map((d) => SUB[d]).join("");

// Lay out N circles in a hexagonal-ish packed disc.
function packedPositions(count: number, radius: number) {
  const pts: { x: number; y: number }[] = [];
  if (count === 0) return pts;
  pts.push({ x: 0, y: 0 });
  let ring = 1;
  while (pts.length < count) {
    const slots = ring * 6;
    for (let i = 0; i < slots && pts.length < count; i++) {
      const a = (i / slots) * Math.PI * 2;
      pts.push({ x: Math.cos(a) * ring * radius, y: Math.sin(a) * ring * radius });
    }
    ring++;
  }
  return pts;
}

type Particle = {
  id: number;
  type: "α" | "β" | "γ";
  angle: number;
};

export default function IsotopeStabilityLab({ onBack }: { onBack: () => void }) {
  const [elementKey, setElementKey] = useState<ElementKey>("C");
  const element = ELEMENTS[elementKey];
  const [N, setN] = useState<number>(element.defaultN);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [appOpen, setAppOpen] = useState(false);
  const seenAppKey = useRef<string | null>(null);

  // Reset neutrons when element changes
  useEffect(() => {
    setN(ELEMENTS[elementKey].defaultN);
    setParticles([]);
    seenAppKey.current = null;
  }, [elementKey]);

  const Z = element.Z;
  const A = Z + N;
  const info: IsotopeInfo | undefined = element.isotopes[N];
  const stable = info?.stable ?? false;
  const decay = info?.decay ?? "β";

  // Tilt: how far isotope sits from the "stable" reference
  const referenceN = useMemo(() => {
    const stableEntries = Object.values(element.isotopes).filter((i) => i.stable);
    if (stableEntries.length === 0) return element.defaultN;
    // closest stable N to current N
    return stableEntries.reduce((best, cur) =>
      Math.abs(cur.N - N) < Math.abs(best.N - N) ? cur : best,
    ).N;
  }, [element, N]);

  const tiltDeg = Math.max(-14, Math.min(14, (N - referenceN) * 3));

  // Emit radiation particles continuously while unstable
  useEffect(() => {
    if (stable) {
      setParticles([]);
      return;
    }
    let pid = 0;
    const id = window.setInterval(() => {
      pid++;
      setParticles((prev) => {
        const next: Particle = {
          id: Date.now() + pid,
          type: decay,
          angle: Math.random() * Math.PI * 2,
        };
        const arr = [...prev, next];
        return arr.length > 18 ? arr.slice(arr.length - 18) : arr;
      });
    }, 420);
    return () => window.clearInterval(id);
  }, [stable, decay, elementKey, N]);

  // Auto-open application popup once per unique isotope w/ application
  useEffect(() => {
    if (!info?.application) return;
    const key = `${elementKey}-${N}`;
    if (seenAppKey.current === key) return;
    seenAppKey.current = key;
    const t = window.setTimeout(() => setAppOpen(true), 600);
    return () => window.clearTimeout(t);
  }, [info, elementKey, N]);

  const protons = Math.min(Z, 80); // cap for rendering
  const neutrons = Math.min(N, 120);

  const radius = 11;
  const positions = useMemo(
    () => packedPositions(protons + neutrons, radius),
    [protons, neutrons],
  );

  const isotopeLabel = `${sup(A)}${element.symbol}`;
  const fullNotation = `${sup(A)}${sub(Z)}${element.symbol}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-200 hover:bg-white/10">
            <ArrowLeft className="mr-1 h-4 w-4" /> ফিরুন
          </Button>
          <div>
            <h1 className="text-base font-bold sm:text-lg">
              আইসোটোপ ভারসাম্য ও নিউক্লীয় স্থিতিশীলতা
            </h1>
            <p className="text-[11px] text-slate-400">
              Isotope Balance & Nuclear Stability Simulator · Chapter 3
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200">
          NCTB · 9-10
        </Badge>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-12">
        {/* ─── LEFT: Nucleus & Controls ─── */}
        <Card className="lg:col-span-4 border-white/10 bg-white/5 p-4 text-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Atom className="h-4 w-4 text-rose-400" />
              <h2 className="text-sm font-semibold">নিউক্লিয়াস · Nucleus</h2>
            </div>
            <Badge variant="outline" className="border-white/20 bg-white/5 text-slate-200">
              Z = {toBn(Z)}
            </Badge>
          </div>

          {/* Element selector */}
          <div className="mb-3 grid grid-cols-1 gap-2">
            <label className="text-xs text-slate-400">মৌল নির্বাচন · Element</label>
            <Select value={elementKey} onValueChange={(v) => setElementKey(v as ElementKey)}>
              <SelectTrigger className="border-white/15 bg-slate-900/60 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/15 bg-slate-900 text-slate-100">
                <SelectItem value="H">Hydrogen · হাইড্রোজেন (Z=1)</SelectItem>
                <SelectItem value="C">Carbon · কার্বন (Z=6)</SelectItem>
                <SelectItem value="I">Iodine · আয়োডিন (Z=53)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nucleus viewer */}
          <div className="relative mx-auto mb-3 aspect-square w-full max-w-[260px] rounded-2xl bg-gradient-to-br from-slate-900/80 to-indigo-900/40 ring-1 ring-white/10">
            {/* Electron orbits */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="absolute h-[88%] w-[88%] rounded-full border border-yellow-400/15 animate-[spin_18s_linear_infinite]" />
              <div className="absolute h-[70%] w-[70%] rounded-full border border-yellow-400/10 animate-[spin_12s_linear_infinite_reverse]" />
              {/* electron dots */}
              <div className="absolute h-[88%] w-[88%] rounded-full">
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.7)] animate-[spin_18s_linear_infinite]" />
              </div>
            </div>

            <svg viewBox="-80 -80 160 160" className="absolute inset-0 h-full w-full">
              {/* Unstable jitter wrapper */}
              <g className={!stable ? "animate-[shake_0.45s_ease-in-out_infinite]" : ""}>
                {positions.map((p, i) => {
                  const isProton = i < protons;
                  return (
                    <g key={i} transform={`translate(${p.x} ${p.y})`}>
                      <circle
                        r={6}
                        fill={isProton ? "url(#pgrad)" : "url(#ngrad)"}
                        stroke={isProton ? "#7f1d1d" : "#1e293b"}
                        strokeWidth={0.5}
                      />
                      {isProton && (
                        <text
                          y={2}
                          textAnchor="middle"
                          fontSize={7}
                          fontWeight={700}
                          fill="#fff"
                        >
                          +
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
              <defs>
                <radialGradient id="pgrad">
                  <stop offset="0%" stopColor="#fda4af" />
                  <stop offset="100%" stopColor="#e11d48" />
                </radialGradient>
                <radialGradient id="ngrad">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#475569" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          {/* Legend */}
          <div className="mb-3 flex justify-center gap-3 text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-rose-500" /> Proton ({toBn(protons)})
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-slate-400" /> Neutron ({toBn(N)})
            </span>
          </div>

          {/* Neutron controls */}
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <p className="mb-2 text-xs text-slate-400">নিউট্রন নিয়ন্ত্রণ · Adjust Neutrons</p>
            <div className="flex items-center justify-between gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setN((v) => Math.max(element.minN, v - 1))}
                disabled={N <= element.minN}
                className="border-white/20 bg-slate-900 text-slate-100 hover:bg-slate-800"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold tracking-tight">{toBn(N)}</div>
                <div className="text-[10px] text-slate-400">নিউট্রন · neutrons</div>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setN((v) => Math.min(element.maxN, v + 1))}
                disabled={N >= element.maxN}
                className="border-white/20 bg-slate-900 text-slate-100 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setN(element.defaultN)}
              className="mt-2 w-full text-xs text-slate-300 hover:bg-white/5"
            >
              <RotateCcw className="mr-1 h-3 w-3" /> ডিফল্ট অবস্থায় ফেরান
            </Button>
          </div>
        </Card>

        {/* ─── CENTER: Balance scale + Mass ─── */}
        <Card className="lg:col-span-4 border-white/10 bg-white/5 p-4 text-slate-100">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-300" />
            <h2 className="text-sm font-semibold">আইসোটোপ তুলাদণ্ড · Isotope Balance</h2>
          </div>

          <div className="relative mx-auto h-[280px] w-full max-w-[360px]">
            {/* Stand */}
            <div className="absolute bottom-0 left-1/2 h-32 w-2 -translate-x-1/2 rounded bg-slate-700" />
            <div className="absolute bottom-0 left-1/2 h-3 w-28 -translate-x-1/2 rounded-full bg-slate-700" />
            <div className="absolute bottom-28 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-slate-600" />

            {/* Beam */}
            <div
              className="absolute bottom-32 left-1/2 h-1.5 w-[300px] origin-center -translate-x-1/2 rounded-full bg-gradient-to-r from-slate-500 via-slate-300 to-slate-500 transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-50%) rotate(${tiltDeg}deg)` }}
            >
              {/* Left pan */}
              <div className="absolute -left-2 top-1/2 flex flex-col items-center">
                <div className="h-12 w-0.5 bg-slate-400" />
                <div className="flex h-16 w-24 items-center justify-center rounded-b-3xl border border-slate-500 bg-slate-900/70 shadow-inner">
                  <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-rose-600/40 to-slate-700/60 ring-1 ring-white/20">
                    <div className="absolute inset-1 rounded-full bg-gradient-to-br from-rose-500/70 to-slate-500/70 blur-[1px]" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                      {toBn(Z)}p {toBn(N)}n
                    </span>
                  </div>
                </div>
              </div>
              {/* Right pan */}
              <div className="absolute -right-24 top-1/2 flex flex-col items-center">
                <div className="h-12 w-0.5 bg-slate-400" />
                <div className="flex h-16 w-24 flex-col items-center justify-center rounded-b-3xl border border-slate-500 bg-slate-900/70 text-center shadow-inner">
                  <div className="text-[10px] text-slate-400">ভর সংখ্যা · A</div>
                  <div className="text-xl font-bold text-amber-300">{toBn(A)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Isotope notation */}
          <div className="mt-2 rounded-xl border border-white/10 bg-slate-900/40 p-3 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              আইসোটোপ স্বরলিপি · Notation
            </div>
            <div className="text-3xl font-bold text-slate-50">{fullNotation}</div>
            <div className="text-[11px] text-slate-400">
              A = P + N → {toBn(Z)} + {toBn(N)} = <span className="text-amber-300">{toBn(A)}</span>
            </div>
          </div>
        </Card>

        {/* ─── RIGHT: Stability + Radiation Viewer ─── */}
        <Card className="lg:col-span-4 border-white/10 bg-white/5 p-4 text-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <h2 className="text-sm font-semibold">স্থিতিশীলতা · Stability</h2>
            </div>
            {stable ? (
              <Badge className="bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20">
                <ShieldCheck className="mr-1 h-3 w-3" /> STABLE · স্থিতিশীল
              </Badge>
            ) : (
              <Badge className="bg-rose-500/20 text-rose-200 hover:bg-rose-500/20 animate-pulse">
                <AlertTriangle className="mr-1 h-3 w-3" /> UNSTABLE · তেজস্ক্রিয়
              </Badge>
            )}
          </div>

          {/* Scoreboard */}
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-white/10 bg-slate-900/50 p-2">
              <div className="text-[10px] text-slate-400">Element · মৌল</div>
              <div className="font-semibold">{element.nameEn} · {element.nameBn}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/50 p-2">
              <div className="text-[10px] text-slate-400">Symbol · প্রতীক</div>
              <div className="font-bold text-lg">{isotopeLabel}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/50 p-2">
              <div className="text-[10px] text-slate-400">অর্ধায়ু · Half-life</div>
              <div className="flex items-center gap-1 font-medium">
                <Hourglass className="h-3 w-3 text-slate-300" />
                {stable ? "—" : info?.halfLife ?? "অজানা"}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/50 p-2">
              <div className="text-[10px] text-slate-400">প্রাচুর্য · Abundance</div>
              <div className="font-medium">{info?.abundance ?? (stable ? "—" : "trace")}</div>
            </div>
          </div>

          {/* Radiation Screen */}
          <div className="relative mb-3 h-44 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-black via-slate-950 to-black">
            <div className="absolute left-2 top-2 z-10 text-[10px] uppercase tracking-wider text-slate-400">
              বিকিরণ স্ক্রিন · Radiation Viewer
            </div>
            {stable ? (
              <div className="flex h-full items-center justify-center text-center text-xs text-slate-500">
                <div>
                  <ShieldCheck className="mx-auto mb-1 h-6 w-6 text-emerald-400/70" />
                  কোনো বিকিরণ নেই — নিউক্লিয়াস স্থিতিশীল।
                </div>
              </div>
            ) : (
              <>
                {/* Parent nucleus glow */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className={`relative h-12 w-12 rounded-full bg-gradient-to-br ${
                    decay === "α" ? "from-amber-400 to-rose-600" :
                    decay === "β" ? "from-emerald-400 to-cyan-600" :
                                     "from-violet-400 to-fuchsia-600"
                  } shadow-[0_0_30px_rgba(244,114,182,0.6)] animate-pulse`}>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                      {isotopeLabel}
                    </span>
                  </div>
                </div>
                {/* Particles */}
                {particles.map((p) => {
                  const dx = Math.cos(p.angle) * 140;
                  const dy = Math.sin(p.angle) * 90;
                  const color =
                    p.type === "α" ? "bg-amber-400 shadow-amber-400/70" :
                    p.type === "β" ? "bg-emerald-400 shadow-emerald-400/70" :
                                     "bg-violet-400 shadow-violet-400/70";
                  return (
                    <span
                      key={p.id}
                      className={`absolute left-1/2 top-1/2 h-2 w-2 rounded-full ${color} shadow-[0_0_12px_currentColor]`}
                      style={{
                        animation: "radiate 1.4s ease-out forwards",
                        // CSS vars consumed by keyframes
                        ['--dx' as never]: `${dx}px`,
                        ['--dy' as never]: `${dy}px`,
                      } as React.CSSProperties}
                    >
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/90">
                        {p.type}
                      </span>
                    </span>
                  );
                })}
                <div className="absolute bottom-2 right-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] text-slate-200 ring-1 ring-white/10">
                  Decay: <span className="font-bold">{decay}</span> ray
                </div>
              </>
            )}
          </div>

          {/* Notes / application trigger */}
          <div className="space-y-2 text-xs text-slate-300">
            {info?.noteBn && (
              <div className="rounded-lg border border-white/10 bg-slate-900/40 p-2">
                {info.noteBn}
              </div>
            )}
            {info?.application && (
              <Button
                onClick={() => setAppOpen(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90"
              >
                <HeartPulse className="mr-1 h-4 w-4" /> বাস্তব ব্যবহার দেখুন
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Application Dialog */}
      <Dialog open={appOpen} onOpenChange={setAppOpen}>
        <DialogContent className="border-white/10 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {info?.application?.icon === "medical" ? (
                <HeartPulse className="h-5 w-5 text-rose-400" />
              ) : (
                <Sparkles className="h-5 w-5 text-amber-400" />
              )}
              {info?.application?.titleBn} · {info?.application?.titleEn}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              আইসোটোপ {isotopeLabel} এর বাস্তব প্রয়োগ
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-slate-200">
            {info?.application?.bodyBn}
          </p>
          <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-400">
            অর্ধায়ু · Half-life: <span className="text-slate-100">{info?.halfLife}</span> · Decay: {decay}
          </div>
        </DialogContent>
      </Dialog>

      {/* Local keyframes */}
      <style>{`
        @keyframes radiate {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.4); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(-1px, 1px) rotate(-0.6deg); }
          50% { transform: translate(1px, -1px) rotate(0.6deg); }
          75% { transform: translate(-1px, -1px) rotate(-0.3deg); }
        }
      `}</style>
    </div>
  );
}
