/**
 * Dry Cell Mechanism (ড্রাই সেল) — Interactive Simulation
 * NCTB Class 9-10 · Chapter 8 · রসায়ন ও শক্তি
 */
import { useEffect, useRef, useState } from "react";
import {
  Battery,
  Power,
  RotateCcw,
  Layers,
  Atom,
  Lightbulb,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TheoryLabShell from "./TheoryLabShell";

interface Props {
  onBack: () => void;
}

type ViewMode = "layers" | "micro";

interface LayerInfo {
  id: string;
  bn: string;
  en: string;
  role: string;
  color: string;
  stroke: string;
}

const LAYERS: LayerInfo[] = [
  { id: "cap", bn: "মেটাল ক্যাপ", en: "Metal Cap (+)", role: "ধনাত্মক প্রান্ত · Positive terminal", color: "#94a3b8", stroke: "#475569" },
  { id: "carbon", bn: "কার্বন দণ্ড", en: "Carbon Rod (Cathode)", role: "ইলেকট্রন গ্রহণ করে · Current collector", color: "#1e293b", stroke: "#0f172a" },
  { id: "paste", bn: "রাসায়নিক পেস্ট", en: "Moist Paste (NH₄Cl + ZnCl₂ + MnO₂ + C)", role: "ইলেকট্রোলাইট · Redox medium", color: "#78350f", stroke: "#451a03" },
  { id: "zinc", bn: "জিংক কেসিং", en: "Zinc Casing (Anode)", role: "ইলেকট্রন দান করে · Loses e⁻", color: "#cbd5e1", stroke: "#64748b" },
  { id: "jacket", bn: "বাইরের লেবেল", en: "Outer Label / Jacket", role: "সুরক্ষা · Insulation & branding", color: "#dc2626", stroke: "#7f1d1d" },
];

/* ─────────────────────────────────────────────────────────
 * MODE 1 — LAYERED / EXPLODED VIEW
 * ───────────────────────────────────────────────────────── */
function LayersScene({
  slice,
  onPickLayer,
  selected,
}: {
  slice: number; // 0..1 — how much layers are peeled/exploded
  onPickLayer: (id: string) => void;
  selected: string | null;
}) {
  // Base battery centered vertically
  const cx = 320;
  const topY = 70;
  const botY = 380;
  const baseHalfW = 60;

  // Explode offsets (right side peels out)
  const off = slice; // 0..1

  const layerBoxes = [
    // outer jacket (peels fully to the right)
    { id: "jacket", x: cx - baseHalfW - 10 + off * 220, y: topY, w: 12, h: botY - topY, fill: "#dc2626", stroke: "#7f1d1d" },
    // right jacket half mirror
    { id: "jacket", x: cx + baseHalfW - 2 + off * 260, y: topY, w: 12, h: botY - topY, fill: "#dc2626", stroke: "#7f1d1d" },
    // zinc casing
    { id: "zinc", x: cx - baseHalfW + off * 160, y: topY - off * 8, w: 10, h: botY - topY + off * 16, fill: "#cbd5e1", stroke: "#64748b" },
    { id: "zinc", x: cx + baseHalfW - 12 + off * 200, y: topY - off * 8, w: 10, h: botY - topY + off * 16, fill: "#cbd5e1", stroke: "#64748b" },
    // paste (large body)
    { id: "paste", x: cx - baseHalfW + 12 + off * 100, y: topY + 8, w: 2 * (baseHalfW - 20), h: botY - topY - 16, fill: "#78350f", stroke: "#451a03" },
  ];

  return (
    <svg viewBox="0 0 640 440" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="capMetal" x1="0" x2="1">
          <stop offset="0" stopColor="#94a3b8" />
          <stop offset="0.5" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="zincG" x1="0" x2="1">
          <stop offset="0" stopColor="#94a3b8" />
          <stop offset="0.5" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="pasteG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a16207" />
          <stop offset="1" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id="jacketG" x1="0" x2="1">
          <stop offset="0" stopColor="#b91c1c" />
          <stop offset="0.5" stopColor="#ef4444" />
          <stop offset="1" stopColor="#7f1d1d" />
        </linearGradient>
        <pattern id="pasteDots" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#78350f" />
          <circle cx="3" cy="3" r="1" fill="#fde68a" opacity="0.6" />
        </pattern>
      </defs>

      {/* Bench line */}
      <line x1="40" y1="410" x2="600" y2="410" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

      {/* Metal cap (+) — offset up when sliced */}
      <g
        onClick={() => onPickLayer("cap")}
        style={{ cursor: "pointer" }}
        transform={`translate(0 ${-off * 40})`}
      >
        <rect x={cx - 22} y={topY - 18} width="44" height="10" rx="2" fill="url(#capMetal)" stroke="#475569" />
        <rect x={cx - 12} y={topY - 24} width="24" height="8" rx="2" fill="url(#capMetal)" stroke="#475569" />
        <text x={cx} y={topY - 30} textAnchor="middle" fontSize="10" fontWeight="800" fill="#dc2626">+</text>
        {selected === "cap" && <rect x={cx - 26} y={topY - 28} width="52" height="24" fill="none" stroke="#22d3ee" strokeDasharray="3 2" />}
      </g>

      {/* Outer jacket layers */}
      <g onClick={() => onPickLayer("jacket")} style={{ cursor: "pointer" }}>
        <rect x={cx - baseHalfW - 6 - off * 180} y={topY} width="8" height={botY - topY} fill="url(#jacketG)" stroke="#7f1d1d" />
        <rect x={cx + baseHalfW - 2 + off * 180} y={topY} width="8" height={botY - topY} fill="url(#jacketG)" stroke="#7f1d1d" />
        {off > 0.15 && (
          <>
            <text x={cx - baseHalfW - 10 - off * 180} y={topY + 20} textAnchor="end" fontSize="9" fill="#7f1d1d" fontWeight="700">Label</text>
          </>
        )}
        {selected === "jacket" && (
          <>
            <rect x={cx - baseHalfW - 10 - off * 180} y={topY - 4} width="12" height={botY - topY + 8} fill="none" stroke="#22d3ee" strokeDasharray="3 2" />
            <rect x={cx + baseHalfW - 2 + off * 180} y={topY - 4} width="12" height={botY - topY + 8} fill="none" stroke="#22d3ee" strokeDasharray="3 2" />
          </>
        )}
      </g>

      {/* Zinc casing */}
      <g onClick={() => onPickLayer("zinc")} style={{ cursor: "pointer" }}>
        <rect x={cx - baseHalfW + 2 - off * 130} y={topY - off * 6} width="10" height={botY - topY + off * 12} fill="url(#zincG)" stroke="#64748b" />
        <rect x={cx + baseHalfW - 12 + off * 130} y={topY - off * 6} width="10" height={botY - topY + off * 12} fill="url(#zincG)" stroke="#64748b" />
        {off > 0.2 && (
          <text x={cx - baseHalfW - off * 130 - 4} y={topY + 60} textAnchor="end" fontSize="9" fill="#334155" fontWeight="700">Zn (−)</text>
        )}
        {selected === "zinc" && (
          <>
            <rect x={cx - baseHalfW - off * 130} y={topY - off * 6 - 3} width="14" height={botY - topY + off * 12 + 6} fill="none" stroke="#22d3ee" strokeDasharray="3 2" />
            <rect x={cx + baseHalfW - 14 + off * 130} y={topY - off * 6 - 3} width="14" height={botY - topY + off * 12 + 6} fill="none" stroke="#22d3ee" strokeDasharray="3 2" />
          </>
        )}
      </g>

      {/* Paste */}
      <g onClick={() => onPickLayer("paste")} style={{ cursor: "pointer" }}>
        <rect
          x={cx - baseHalfW + 14 - off * 60}
          y={topY + 6 - off * 4}
          width={2 * (baseHalfW - 20) + off * 120}
          height={botY - topY - 12 + off * 8}
          fill="url(#pasteDots)"
          stroke="#451a03"
          opacity={0.95}
        />
        {off > 0.35 && (
          <text x={cx} y={botY + 24} textAnchor="middle" fontSize="9" fill="#78350f" fontWeight="700">
            NH₄Cl · ZnCl₂ · MnO₂ · Carbon
          </text>
        )}
        {selected === "paste" && (
          <rect
            x={cx - baseHalfW + 12 - off * 60}
            y={topY + 4 - off * 4}
            width={2 * (baseHalfW - 18) + off * 120}
            height={botY - topY - 8 + off * 8}
            fill="none" stroke="#22d3ee" strokeDasharray="3 2"
          />
        )}
      </g>

      {/* Carbon rod (center) */}
      <g onClick={() => onPickLayer("carbon")} style={{ cursor: "pointer" }}>
        <rect x={cx - 6} y={topY - 12} width="12" height={botY - topY + 18} rx="2" fill="#0f172a" stroke="#000" />
        <rect x={cx - 4} y={topY - 10} width="4" height={botY - topY + 12} fill="#334155" opacity="0.6" />
        {off > 0.5 && (
          <text x={cx + 14} y={topY + 40} fontSize="9" fill="#0f172a" fontWeight="700">Carbon (+)</text>
        )}
        {selected === "carbon" && (
          <rect x={cx - 9} y={topY - 15} width="18" height={botY - topY + 22} fill="none" stroke="#22d3ee" strokeDasharray="3 2" />
        )}
      </g>

      {/* Bottom Zn cap (-) */}
      <g>
        <rect x={cx - 22} y={botY - 2} width="44" height="10" rx="2" fill="url(#zincG)" stroke="#475569" />
        <text x={cx} y={botY + 22} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0284c7">−</text>
      </g>

      {/* Instruction */}
      {off < 0.05 && (
        <text x={cx} y={430} textAnchor="middle" fontSize="10" fill="#64748b">
          স্লাইডার টেনে লেয়ার আলাদা করো · Drag slider to peel layers
        </text>
      )}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
 * MODE 2 — MICROSCOPIC / REACTION FLOW
 * ───────────────────────────────────────────────────────── */
function MicroScene({ on }: { on: boolean }) {
  const cx = 320;
  const topY = 100;
  const botY = 340;
  const dur = "1.6s";

  return (
    <svg viewBox="0 0 640 440" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fde047" stopOpacity="1" />
          <stop offset="1" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="zincSide" x1="0" x2="1">
          <stop offset="0" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="pasteBg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a16207" opacity="0.4" />
          <stop offset="1" stopColor="#451a03" opacity="0.5" />
        </linearGradient>
      </defs>

      {/* External wire path: top cap (+) → up → bulb → down → bottom (-) */}
      {/* Wire */}
      <path
        d={`M${cx + 20} ${topY - 10} L${cx + 130} ${topY - 10} L${cx + 130} 60 L${cx + 30} 60`}
        stroke={on ? "#ef4444" : "#94a3b8"} strokeWidth="3" fill="none"
      />
      <path
        d={`M${cx - 30} 60 L${cx - 130} 60 L${cx - 130} ${botY + 20} L${cx - 20} ${botY + 20}`}
        stroke={on ? "#0284c7" : "#94a3b8"} strokeWidth="3" fill="none"
      />

      {/* Bulb */}
      <g transform={`translate(${cx} 55)`}>
        {on && <circle r="34" fill="url(#bulbGlow)">
          <animate attributeName="r" values="30;38;30" dur="1s" repeatCount="indefinite" />
        </circle>}
        <circle r="18" fill={on ? "#fef08a" : "#e2e8f0"} stroke="#a16207" strokeWidth="1.5" />
        <LightbulbSvg />

        <path d="M-6 12 L6 12 L4 20 L-4 20 Z" fill="#64748b" />
        <text y="-22" textAnchor="middle" fontSize="10" fontWeight="700" fill={on ? "#a16207" : "#64748b"}>
          {on ? "Glowing" : "Bulb"}
        </text>
      </g>

      {/* Battery body (cutaway) */}
      <g>
        {/* Zinc left wall */}
        <rect x={cx - 90} y={topY} width="14" height={botY - topY} fill="url(#zincSide)" stroke="#475569" />
        <text x={cx - 96} y={topY - 6} textAnchor="end" fontSize="10" fontWeight="700" fill="#334155">Zn wall (−)</text>
        {/* Zinc right wall */}
        <rect x={cx + 76} y={topY} width="14" height={botY - topY} fill="url(#zincSide)" stroke="#475569" />

        {/* Paste zone */}
        <rect x={cx - 74} y={topY} width="150" height={botY - topY} fill="url(#pasteBg)" stroke="#78350f" strokeDasharray="4 3" />
        <text x={cx} y={topY + 14} textAnchor="middle" fontSize="9" fill="#78350f" fontWeight="700">
          NH₄⁺ · MnO₂ · Cl⁻ paste
        </text>

        {/* Carbon rod */}
        <rect x={cx - 6} y={topY - 12} width="12" height={botY - topY + 20} rx="2" fill="#0f172a" />
        <rect x={cx - 22} y={topY - 22} width="44" height="10" rx="2" fill="#f1f5f9" stroke="#475569" />
        <text x={cx} y={topY - 28} textAnchor="middle" fontSize="10" fontWeight="800" fill="#dc2626">+</text>
        <text x={cx + 18} y={topY + 40} fontSize="9" fontWeight="700" fill="#0f172a">Carbon (+)</text>

        {/* Bottom cap */}
        <rect x={cx - 22} y={botY} width="44" height="10" rx="2" fill="url(#zincSide)" />
      </g>

      {/* Electron flow: bottom Zn (-) → wire → bulb → top (+) */}
      {on && [0, 0.4, 0.8, 1.2].map((delay, i) => (
        <g key={i}>
          <circle r="3.5" fill="#fde047">
            <animateMotion
              dur={dur}
              begin={`${delay}s`}
              repeatCount="indefinite"
              path={`M${cx - 20} ${botY + 20} L${cx - 130} ${botY + 20} L${cx - 130} 60 L${cx - 30} 60 L${cx} 55 L${cx + 30} 60 L${cx + 130} 60 L${cx + 130} ${topY - 10} L${cx + 20} ${topY - 10}`}
            />
          </circle>
          <text fontSize="8" fill="#a16207" fontWeight="700" dy="-6">
            <animateMotion
              dur={dur}
              begin={`${delay}s`}
              repeatCount="indefinite"
              path={`M${cx - 20} ${botY + 20} L${cx - 130} ${botY + 20} L${cx - 130} 60 L${cx - 30} 60 L${cx} 55 L${cx + 30} 60 L${cx + 130} 60 L${cx + 130} ${topY - 10} L${cx + 20} ${topY - 10}`}
            />
            e⁻
          </text>
        </g>
      ))}

      {/* Anode: Zn²⁺ leaving wall */}
      {on && Array.from({ length: 4 }).map((_, i) => (
        <g key={`zn${i}`}>
          <circle r="4" fill="#60a5fa">
            <animate attributeName="cx" values={`${cx - 76};${cx - 30}`} dur="2.4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="cy" values={`${topY + 40 + i * 40};${topY + 60 + i * 40}`} dur="2.4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0" dur="2.4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </circle>
          <text fontSize="8" fill="#0c4a6e" fontWeight="700">
            <animate attributeName="x" values={`${cx - 72};${cx - 26}`} dur="2.4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="y" values={`${topY + 44 + i * 40};${topY + 64 + i * 40}`} dur="2.4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0" dur="2.4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            Zn²⁺
          </text>
        </g>
      ))}

      {/* Cathode: NH4+ arriving, NH3 gas bubbling up */}
      {on && Array.from({ length: 3 }).map((_, i) => (
        <g key={`nh4${i}`}>
          <circle r="3.5" fill="#c084fc">
            <animate attributeName="cx" values={`${cx + 60};${cx + 8}`} dur="2s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
            <animate attributeName="cy" values={`${topY + 80 + i * 50};${topY + 100 + i * 50}`} dur="2s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {on && Array.from({ length: 3 }).map((_, i) => (
        <circle key={`nh3${i}`} r="2.5" fill="#ffffff" opacity="0.9" cx={cx + 18 + i * 4}>
          <animate attributeName="cy" values={`${topY + 40};${topY - 8}`} dur="1.4s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0" dur="1.4s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Legend */}
      <g transform="translate(20 400)">
        <circle cx="0" cy="0" r="4" fill="#fde047" /> <text x="8" y="4" fontSize="9" fill="#f8fafc">e⁻</text>
        <circle cx="40" cy="0" r="4" fill="#60a5fa" /> <text x="48" y="4" fontSize="9" fill="#f8fafc">Zn²⁺</text>
        <circle cx="90" cy="0" r="4" fill="#c084fc" /> <text x="98" y="4" fontSize="9" fill="#f8fafc">NH₄⁺</text>
        <circle cx="150" cy="0" r="4" fill="#ffffff" /> <text x="158" y="4" fontSize="9" fill="#f8fafc">NH₃↑</text>
      </g>
    </svg>
  );
}

// Small helper to make the bulb glyph render — using lucide icon as a foreignObject-free SVG group
function LightbulbSvg() {
  return (
    <g transform="translate(-6 -12)">
      <path d="M6 2a6 6 0 0 1 4 10.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1.5A6 6 0 0 1 6 2z" fill="none" stroke="#a16207" strokeWidth="1" />
    </g>
  );
}
// Alias so JSX <Lightbulb-svg /> compiles as component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LightbulbSvg2 = LightbulbSvg;

/* ─────────────────────────────────────────────────────────
 * MAIN
 * ───────────────────────────────────────────────────────── */
export default function DryCellMechanismLab({ onBack }: Props) {
  const [view, setView] = useState<ViewMode>("layers");
  const [circuit, setCircuit] = useState(false);
  const [slice, setSlice] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [runtime, setRuntime] = useState(0);
  const raf = useRef<number | null>(null);
  const lastT = useRef<number | null>(null);

  useEffect(() => {
    if (view !== "micro" || !circuit) {
      if (raf.current) cancelAnimationFrame(raf.current);
      lastT.current = null;
      return;
    }
    const tick = (t: number) => {
      if (lastT.current == null) lastT.current = t;
      setRuntime((r) => r + (t - lastT.current!) / 1000);
      lastT.current = t;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [view, circuit]);

  const electronsFlowed = Math.floor(runtime * 32);
  const stage: 0 | 1 | 2 = !circuit ? 0 : runtime < 3 ? 1 : 2;

  const selectedLayer = LAYERS.find((l) => l.id === selected) ?? null;

  const reset = () => {
    setCircuit(false);
    setSlice(0);
    setSelected(null);
    setRuntime(0);
  };

  const Header = (
    <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 text-white">
      <Battery className="h-4 w-4" />
    </div>
  );

  const Badge_ = (
    <Badge variant="outline" className="gap-1 border-amber-400/60 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <Zap className="h-3 w-3" /> Dry Cell 1.5 V
    </Badge>
  );

  const info = (
    <>
      <Card className="p-3 space-y-2 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30 border-amber-200/60 dark:border-amber-800/40">
        <div className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
          ড্রাই সেল / টর্চ ব্যাটারি
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {view === "layers"
            ? "একটি সাধারণ Zn-C ব্যাটারির অভ্যন্তরীণ পাঁচটি স্তর। স্লাইডার টেনে বাইরের আবরণ খুলে দেখো।"
            : "সার্কিট বন্ধ হলে Zn এর দেয়াল থেকে ইলেকট্রন বাইরে দিয়ে কার্বন দণ্ডে যায়, ভেতরে NH₄⁺ ও MnO₂ ইলেকট্রন গ্রহণ করে।"}
        </div>
      </Card>

      {view === "layers" && (
        <Card className="p-3 space-y-2">
          <div className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" /> Layer Info · লেয়ার
          </div>
          {selectedLayer ? (
            <div className="rounded-lg border border-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded" style={{ background: selectedLayer.color, border: `1px solid ${selectedLayer.stroke}` }} />
                <span className="text-xs font-bold">{selectedLayer.bn}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{selectedLayer.en}</div>
              <div className="text-[11px]">{selectedLayer.role}</div>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground">কোনো লেয়ারে ক্লিক করো · Click a layer</div>
          )}
          <div className="grid grid-cols-1 gap-1 pt-1">
            {LAYERS.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelected(l.id)}
                className={`flex items-center gap-2 rounded border px-2 py-1 text-left text-[11px] transition ${selected === l.id ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/40" : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"}`}
              >
                <span className="inline-block h-3 w-3 rounded" style={{ background: l.color, border: `1px solid ${l.stroke}` }} />
                <span className="font-semibold">{l.bn}</span>
                <span className="text-muted-foreground text-[10px]">· {l.en}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {view === "micro" && (
        <Card className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Atom className="h-3 w-3" /> Reaction Flow
            </div>
            <span className="text-[10px] text-muted-foreground">t={runtime.toFixed(1)}s</span>
          </div>

          <div className={`rounded border p-2 text-[11px] transition ${stage >= 1 ? "border-rose-400 bg-rose-50 dark:bg-rose-950/40" : "border-slate-200 opacity-50"}`}>
            <div className="font-bold text-rose-700 dark:text-rose-300">Anode (Zn wall) −</div>
            <div className="font-mono">Zn(s) → Zn²⁺(aq) + 2e⁻</div>
          </div>

          <div className={`rounded border p-2 text-[11px] transition ${stage >= 2 ? "border-sky-400 bg-sky-50 dark:bg-sky-950/40" : "border-slate-200 opacity-50"}`}>
            <div className="font-bold text-sky-700 dark:text-sky-300">Cathode (Carbon rod) +</div>
            <div className="font-mono leading-snug">
              2NH₄⁺ + 2MnO₂ + 2e⁻ →<br />
              Mn₂O₃ + 2NH₃↑ + H₂O
            </div>
          </div>

          <div className={`rounded border p-2 text-[11px] transition ${stage >= 2 ? "border-violet-400 bg-violet-50 dark:bg-violet-950/40" : "border-slate-200 opacity-50"}`}>
            <div className="font-bold text-violet-700 dark:text-violet-300">Complexation · কমপ্লেক্স গঠন</div>
            <div>
              Zn²⁺ + 4NH₃ → [Zn(NH₃)₄]²⁺ ·
              <span className="text-muted-foreground"> NH₃ গ্যাসের চাপ কমায়।</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded border p-2 text-xs">
              <div className="text-muted-foreground text-[10px]">Electrons</div>
              <div className="font-bold text-yellow-600">{electronsFlowed}</div>
            </div>
            <div className="rounded border p-2 text-xs">
              <div className="text-muted-foreground text-[10px]">EMF</div>
              <div className="font-bold text-amber-600">{circuit ? "1.5 V" : "0 V"}</div>
            </div>
          </div>
        </Card>
      )}
    </>
  );

  const controls = (
    <>
      <Card className="p-3 space-y-3">
        <div className="text-xs font-bold uppercase text-muted-foreground">View · ভিউ</div>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layers" className="text-[11px]">Layers</TabsTrigger>
            <TabsTrigger value="micro" className="text-[11px]">Micro</TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>

      {view === "layers" && (
        <Card className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1">
              <Layers className="h-3 w-3" /> Cross-Section
            </span>
            <span className="font-mono text-amber-600">{Math.round(slice * 100)}%</span>
          </div>
          <Slider value={[slice * 100]} onValueChange={(v) => setSlice(v[0] / 100)} min={0} max={100} step={1} />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Intact</span><span>Exploded</span>
          </div>
        </Card>
      )}

      {view === "micro" && (
        <Card className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className={`h-4 w-4 ${circuit ? "text-emerald-500" : "text-slate-400"}`} />
              <span className="text-sm font-semibold">Connect Bulb · সার্কিট</span>
            </div>
            <Switch checked={circuit} onCheckedChange={setCircuit} />
          </div>
          <div className={`flex items-center gap-2 rounded border p-2 text-[11px] ${circuit ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/40" : "border-slate-200"}`}>
            <Lightbulb className={`h-4 w-4 ${circuit ? "text-yellow-500" : "text-slate-400"}`} />
            <span>{circuit ? "বাল্ব জ্বলছে · Bulb glowing" : "সার্কিট খোলা · Circuit open"}</span>
          </div>
        </Card>
      )}

      <Card className="p-3">
        <Button onClick={reset} variant="outline" size="sm" className="w-full gap-1">
          <RotateCcw className="h-3 w-3" /> Reset · রিসেট
        </Button>
      </Card>
    </>
  );

  const visual = (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(56,189,248,0.12),transparent_60%)]" />
      <div className="relative h-full w-full">
        {view === "layers" ? (
          <LayersScene slice={slice} onPickLayer={setSelected} selected={selected} />
        ) : (
          <MicroScene on={circuit} />
        )}
      </div>
    </div>
  );

  const theory = (
    <div>
      <h3>ড্রাই সেল কেমন করে কাজ করে?</h3>
      <p>
        Zn-C ড্রাই সেলে জিংক পাত্র হয় অ্যানোড (−) আর কেন্দ্রের কার্বন দণ্ড ক্যাথোড (+)। এদের মাঝে
        থাকে NH₄Cl, ZnCl₂, MnO₂ ও কার্বন গুঁড়োর আর্দ্র পেস্ট — এটাই ইলেকট্রোলাইট।
      </p>
      <h4>বিক্রিয়া</h4>
      <ul>
        <li>Anode: Zn → Zn²⁺ + 2e⁻</li>
        <li>Cathode: 2NH₄⁺ + 2MnO₂ + 2e⁻ → Mn₂O₃ + 2NH₃ + H₂O</li>
        <li>Complex: Zn²⁺ + 4NH₃ → [Zn(NH₃)₄]²⁺ (গ্যাসের চাপ প্রতিরোধ)</li>
      </ul>
      <p>প্রতি সেলের EMF ≈ 1.5 V। রিচার্জ করা যায় না — এটি প্রাথমিক (primary) কোষ।</p>
    </div>
  );

  return (
    <TheoryLabShell
      onBack={onBack}
      headerIcon={Header}
      titleBn="ড্রাই সেল · Dry Cell Mechanism"
      subtitleEn={view === "layers" ? "Exploded Layer View" : "Microscopic Reaction Flow"}
      badge={Badge_}
      info={info}
      visual={visual}
      controls={controls}
      theory={theory}
    />
  );
}
