/**
 * Electrolytic Cell (তড়িৎবিশ্লেষ্য কোষ) — Interactive Simulation
 * NCTB Class 9-10 · Chapter 8 · রসায়ন ও শক্তি
 *
 * Two experiments:
 *   A. Water Electrolysis (পানির তড়িৎবিশ্লেষণ) — 2:1 H₂:O₂ ratio
 *   B. Electroplating (ইলেকট্রোপ্লেটিং) — Cu on Fe spoon
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Zap,
  Power,
  RotateCcw,
  Droplet,
  Info,
  BatteryCharging,
  ChevronDown,
  ChevronUp,
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

type Mode = "water" | "plating";

/* ─────────────────────────────────────────────────────────
 * A · WATER ELECTROLYSIS SCENE
 * ───────────────────────────────────────────────────────── */
function WaterScene({
  on,
  voltage,
  acid,
  h2Frac,
  o2Frac,
}: {
  on: boolean;
  voltage: number;
  acid: number;
  h2Frac: number;
  o2Frac: number;
}) {
  const active = on && voltage > 0 && acid > 0;
  const rate = (voltage / 12) * (acid / 10);

  // Tube geometry
  const tubeH = 170;
  const tubeW = 42;
  // Left tube (Anode +) — O₂
  const leftX = 200;
  // Right tube (Cathode -) — H₂
  const rightX = 340;
  const tubeTop = 70;

  const o2GasH = tubeH * o2Frac;
  const h2GasH = tubeH * h2Frac;

  return (
    <svg viewBox="0 0 640 440" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="waterFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="glassW" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="battW" x1="0" x2="1">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>

      {/* Battery */}
      <g>
        <rect x="240" y="14" width="160" height="34" rx="6" fill="url(#battW)" stroke="#475569" />
        <text x="320" y="35" textAnchor="middle" fontSize="12" fontWeight="700" fill="#f1f5f9">
          DC {voltage.toFixed(1)} V
        </text>
        <circle cx="255" cy="31" r="4" fill={on ? "#22c55e" : "#7f1d1d"}>
          {on && <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />}
        </circle>
        <text x="248" y="60" fontSize="11" fontWeight="700" fill="#ef4444">+</text>
        <text x="386" y="60" fontSize="11" fontWeight="700" fill="#38bdf8">−</text>
      </g>

      {/* Wires from battery down to electrodes */}
      <path d={`M250 48 L250 260 L${leftX + tubeW / 2} 260`} stroke="#ef4444" strokeWidth="3" fill="none" />
      <path d={`M390 48 L390 260 L${rightX + tubeW / 2} 260`} stroke="#38bdf8" strokeWidth="3" fill="none" />

      {/* Electron flow arrows (- → +) — outside battery: cathode wire → battery → anode wire */}
      {active && (
        <>
          <circle r="3.5" fill="#fde047">
            <animateMotion dur={`${1.4 / Math.max(0.2, rate)}s`} repeatCount="indefinite"
              path={`M${rightX + tubeW / 2} 260 L390 260 L390 48 L250 48 L250 260 L${leftX + tubeW / 2} 260`} />
          </circle>
          <circle r="3.5" fill="#fde047">
            <animateMotion dur={`${1.4 / Math.max(0.2, rate)}s`} begin="0.7s" repeatCount="indefinite"
              path={`M${rightX + tubeW / 2} 260 L390 260 L390 48 L250 48 L250 260 L${leftX + tubeW / 2} 260`} />
          </circle>
          <text x="320" y="12" fontSize="10" fill="#eab308" textAnchor="middle" fontWeight="700">e⁻ flow</text>
        </>
      )}

      {/* Beaker */}
      <path
        d="M120 230 L120 380 Q120 400 140 400 L500 400 Q520 400 520 380 L520 230"
        fill="url(#glassW)" stroke="#94a3b8" strokeWidth="2"
      />
      {/* Water */}
      <path
        d="M126 270 L126 378 Q126 394 142 394 L498 394 Q514 394 514 378 L514 270 Z"
        fill="url(#waterFill)"
      />
      <line x1="126" y1="272" x2="514" y2="272" stroke="#0284c7" strokeWidth="1" opacity="0.6" />

      {/* Acid drops indicator */}
      {acid > 0 && (
        <text x="320" y="420" textAnchor="middle" fontSize="10" fill="#0369a1">
          H₂SO₄: {acid} drop{acid > 1 ? "s" : ""}
        </text>
      )}

      {/* LEFT test tube — O₂ (Anode +) */}
      <g>
        {/* Tube glass */}
        <path
          d={`M${leftX} ${tubeTop} L${leftX} ${tubeTop + tubeH} Q${leftX} ${tubeTop + tubeH + 10} ${leftX + tubeW / 2} ${tubeTop + tubeH + 10} Q${leftX + tubeW} ${tubeTop + tubeH + 10} ${leftX + tubeW} ${tubeTop + tubeH} L${leftX + tubeW} ${tubeTop} Z`}
          fill="url(#glassW)" stroke="#64748b" strokeWidth="1.5"
        />
        {/* Water inside */}
        <rect x={leftX + 2} y={tubeTop + o2GasH} width={tubeW - 4} height={tubeH - o2GasH + 10} fill="url(#waterFill)" />
        {/* Gas headspace label */}
        {o2GasH > 6 && (
          <text x={leftX + tubeW / 2} y={tubeTop + o2GasH / 2 + 4} textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="700">
            O₂
          </text>
        )}
        {/* Rising bubbles */}
        {active && Array.from({ length: 3 }).map((_, i) => (
          <circle key={i} cx={leftX + 12 + i * 8} r="2.5" fill="#ffffff" opacity="0.9">
            <animate attributeName="cy"
              values={`${tubeTop + tubeH + 6};${tubeTop + o2GasH + 4}`}
              dur={`${1.6 / Math.max(0.15, rate)}s`}
              begin={`${i * 0.35}s`}
              repeatCount="indefinite" />
          </circle>
        ))}
        {/* Electrode */}
        <rect x={leftX + tubeW / 2 - 2} y={tubeTop + tubeH - 30} width="4" height="80" fill="#475569" />
        {/* Volume marker */}
        <text x={leftX - 6} y={tubeTop - 6} textAnchor="end" fontSize="10" fontWeight="700" fill="#dc2626">Anode (+)</text>
        <text x={leftX - 6} y={tubeTop + 8} textAnchor="end" fontSize="9" fill="#64748b">O₂ · 1 Vol</text>
      </g>

      {/* RIGHT test tube — H₂ (Cathode -) */}
      <g>
        <path
          d={`M${rightX} ${tubeTop} L${rightX} ${tubeTop + tubeH} Q${rightX} ${tubeTop + tubeH + 10} ${rightX + tubeW / 2} ${tubeTop + tubeH + 10} Q${rightX + tubeW} ${tubeTop + tubeH + 10} ${rightX + tubeW} ${tubeTop + tubeH} L${rightX + tubeW} ${tubeTop} Z`}
          fill="url(#glassW)" stroke="#64748b" strokeWidth="1.5"
        />
        <rect x={rightX + 2} y={tubeTop + h2GasH} width={tubeW - 4} height={tubeH - h2GasH + 10} fill="url(#waterFill)" />
        {h2GasH > 6 && (
          <text x={rightX + tubeW / 2} y={tubeTop + h2GasH / 2 + 4} textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="700">
            H₂
          </text>
        )}
        {active && Array.from({ length: 5 }).map((_, i) => (
          <circle key={i} cx={rightX + 8 + (i % 3) * 10} r="2.5" fill="#ffffff" opacity="0.95">
            <animate attributeName="cy"
              values={`${tubeTop + tubeH + 6};${tubeTop + h2GasH + 4}`}
              dur={`${0.9 / Math.max(0.15, rate)}s`}
              begin={`${i * 0.18}s`}
              repeatCount="indefinite" />
          </circle>
        ))}
        <rect x={rightX + tubeW / 2 - 2} y={tubeTop + tubeH - 30} width="4" height="80" fill="#475569" />
        <text x={rightX + tubeW + 6} y={tubeTop - 6} fontSize="10" fontWeight="700" fill="#0284c7">Cathode (−)</text>
        <text x={rightX + tubeW + 6} y={tubeTop + 8} fontSize="9" fill="#64748b">H₂ · 2 Vol</text>
      </g>

      {/* Ratio callout */}
      {active && h2Frac > 0.05 && (
        <g>
          <rect x="245" y="200" width="150" height="24" rx="6" fill="#0f172a" opacity="0.85" />
          <text x="320" y="216" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fef3c7">
            V(H₂) : V(O₂) = 2 : 1
          </text>
        </g>
      )}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
 * B · ELECTROPLATING SCENE
 * ───────────────────────────────────────────────────────── */
function PlatingScene({
  on,
  voltage,
  plating,
}: {
  on: boolean;
  voltage: number;
  plating: number; // 0..1
}) {
  const active = on && voltage > 0;
  const rate = voltage / 12;
  const anodeThinning = plating * 10; // shrink up to 10px
  const coatOpacity = Math.min(1, plating * 1.4);

  return (
    <svg viewBox="0 0 640 440" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="glassP" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="cuso4" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#93c5fd" stopOpacity="0.7" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="copperG" x1="0" x2="1">
          <stop offset="0" stopColor="#b45309" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#7c2d12" />
        </linearGradient>
        <linearGradient id="ironG" x1="0" x2="1">
          <stop offset="0" stopColor="#64748b" />
          <stop offset="0.5" stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="battP" x1="0" x2="1">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>

      {/* Battery */}
      <g>
        <rect x="240" y="14" width="160" height="34" rx="6" fill="url(#battP)" stroke="#475569" />
        <text x="320" y="35" textAnchor="middle" fontSize="12" fontWeight="700" fill="#f1f5f9">
          DC {voltage.toFixed(1)} V
        </text>
        <circle cx="255" cy="31" r="4" fill={on ? "#22c55e" : "#7f1d1d"}>
          {on && <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />}
        </circle>
        <text x="248" y="60" fontSize="11" fontWeight="700" fill="#ef4444">+</text>
        <text x="386" y="60" fontSize="11" fontWeight="700" fill="#38bdf8">−</text>
      </g>

      {/* Wires */}
      <path d="M250 48 L250 210 L215 210" stroke="#ef4444" strokeWidth="3" fill="none" />
      <path d="M390 48 L390 210 L425 210" stroke="#38bdf8" strokeWidth="3" fill="none" />

      {/* Electron flow */}
      {active && (
        <>
          <circle r="3.5" fill="#fde047">
            <animateMotion dur={`${1.4 / Math.max(0.2, rate)}s`} repeatCount="indefinite"
              path="M425 210 L390 210 L390 48 L250 48 L250 210 L215 210" />
          </circle>
          <text x="320" y="12" fontSize="10" fill="#eab308" textAnchor="middle" fontWeight="700">e⁻ flow</text>
        </>
      )}

      {/* Beaker */}
      <path
        d="M110 220 L110 390 Q110 410 130 410 L510 410 Q530 410 530 390 L530 220"
        fill="url(#glassP)" stroke="#94a3b8" strokeWidth="2"
      />
      {/* CuSO4 solution */}
      <path d="M116 260 L116 388 Q116 404 132 404 L508 404 Q524 404 524 388 L524 260 Z" fill="url(#cuso4)" />

      {/* Cu²⁺ ions migrating from anode (left) to cathode (right) */}
      {active && Array.from({ length: 6 }).map((_, i) => (
        <g key={i}>
          <circle r="4" fill="#60a5fa" opacity="0.9">
            <animate attributeName="cx"
              values={`${230 - anodeThinning};${400}`}
              dur={`${2.2 / Math.max(0.25, rate)}s`}
              begin={`${i * 0.35}s`}
              repeatCount="indefinite" />
            <animate attributeName="cy"
              values={`${300 + (i % 3) * 20};${320 + (i % 3) * 15}`}
              dur={`${2.2 / Math.max(0.25, rate)}s`}
              begin={`${i * 0.35}s`}
              repeatCount="indefinite" />
          </circle>
          <text fontSize="8" fill="#0f172a" fontWeight="700">
            <animate attributeName="x"
              values={`${234 - anodeThinning};${404}`}
              dur={`${2.2 / Math.max(0.25, rate)}s`}
              begin={`${i * 0.35}s`}
              repeatCount="indefinite" />
            <animate attributeName="y"
              values={`${303 + (i % 3) * 20};${323 + (i % 3) * 15}`}
              dur={`${2.2 / Math.max(0.25, rate)}s`}
              begin={`${i * 0.35}s`}
              repeatCount="indefinite" />
            Cu²⁺
          </text>
        </g>
      ))}

      {/* ANODE — Copper strip (left) */}
      <g>
        <rect x={215 - anodeThinning / 2} y="240" width={20 - anodeThinning} height="150" fill="url(#copperG)" stroke="#7c2d12" />
        {plating > 0.1 && (
          <rect x={215 - anodeThinning / 2} y="240" width={20 - anodeThinning} height="150"
            fill="url(#copperG)" opacity="0.5" strokeDasharray="3 2" stroke="#78350f" />
        )}
        <text x="225" y="230" textAnchor="middle" fontSize="10" fontWeight="700" fill="#dc2626">Anode (+)</text>
        <text x="225" y="428" textAnchor="middle" fontSize="9" fill="#7c2d12" fontWeight="700">Cu strip</text>
      </g>

      {/* CATHODE — Iron spoon (right) */}
      <g transform="translate(400 210)">
        {/* Handle */}
        <rect x="20" y="0" width="10" height="120" fill="url(#ironG)" stroke="#334155" />
        {/* Bowl */}
        <ellipse cx="25" cy="150" rx="26" ry="34" fill="url(#ironG)" stroke="#334155" strokeWidth="1.5" />
        {/* Copper plating overlay */}
        <ellipse cx="25" cy="150" rx="26" ry="34" fill="url(#copperG)" opacity={coatOpacity} />
        <rect x="20" y="0" width="10" height="120" fill="url(#copperG)" opacity={coatOpacity * 0.85} />
        <text x="25" y="-6" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0284c7">Cathode (−)</text>
        <text x="25" y="200" textAnchor="middle" fontSize="9" fill="#334155" fontWeight="700">Fe spoon</text>
      </g>

      {/* Solution label */}
      <text x="320" y="425" textAnchor="middle" fontSize="10" fill="#1e3a8a" fontWeight="700">
        CuSO₄ solution
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
 * MAIN COMPONENT
 * ───────────────────────────────────────────────────────── */
export default function ElectrolyticCellLab({ onBack }: Props) {
  const [mode, setMode] = useState<Mode>("water");
  const [on, setOn] = useState(false);
  const [voltage, setVoltage] = useState(6);
  const [acid, setAcid] = useState(3);
  const [runtime, setRuntime] = useState(0);
  const [h2Frac, setH2Frac] = useState(0);
  const [o2Frac, setO2Frac] = useState(0);
  const [plating, setPlating] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);
  const raf = useRef<number | null>(null);
  const lastT = useRef<number | null>(null);

  // Reset per mode change
  useEffect(() => {
    setOn(false);
    setRuntime(0);
    setH2Frac(0);
    setO2Frac(0);
    setPlating(0);
  }, [mode]);

  // Animation loop
  useEffect(() => {
    if (!on) {
      if (raf.current) cancelAnimationFrame(raf.current);
      lastT.current = null;
      return;
    }
    const tick = (t: number) => {
      if (lastT.current == null) lastT.current = t;
      const dt = (t - lastT.current) / 1000;
      lastT.current = t;
      setRuntime((r) => r + dt);
      if (mode === "water") {
        const rate = (voltage / 12) * (acid / 10); // 0..1
        setH2Frac((f) => Math.min(1, f + dt * rate * 0.12));
        setO2Frac((f) => Math.min(0.5, f + dt * rate * 0.06));
      } else {
        const rate = voltage / 12;
        setPlating((p) => Math.min(1, p + dt * rate * 0.05));
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [on, voltage, acid, mode]);

  const reset = () => {
    setOn(false);
    setRuntime(0);
    setH2Frac(0);
    setO2Frac(0);
    setPlating(0);
  };

  // Derived metrics
  const conductivity = mode === "water" ? acid * 10 : 100; // %
  const current = useMemo(() => {
    if (!on) return 0;
    if (mode === "water") return +(voltage * (acid / 10) * 0.05).toFixed(2);
    return +(voltage * 0.08).toFixed(2);
  }, [on, voltage, acid, mode]);

  // Steps
  const steps = mode === "water"
    ? [
        { label: "Add H₂SO₄ drops (conductivity ↑) · সালফিউরিক এসিড দাও", done: acid > 0 },
        { label: "Turn ON the battery · ব্যাটারি চালু করো", done: on },
        { label: "Increase voltage · ভোল্টেজ বাড়াও (>4V)", done: voltage >= 4 },
        { label: "Observe 2:1 ratio · H₂:O₂ = 2:1 দেখো", done: h2Frac > 0.15 },
      ]
    : [
        { label: "Turn ON the battery · ব্যাটারি চালু করো", done: on },
        { label: "Cu²⁺ ions migrate · আয়ন গতিশীল হয়েছে", done: on && voltage > 0 },
        { label: "Copper layer grows on spoon · চামচে আবরণ", done: plating > 0.2 },
        { label: "Full plating · সম্পূর্ণ প্লেটিং", done: plating > 0.75 },
      ];

  const Header = (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <Zap className="h-4 w-4" />
      </div>
    </div>
  );

  const Badge_ = (
    <Badge variant="outline" className="gap-1 border-amber-400/60 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <BatteryCharging className="h-3 w-3" />
      Electrolytic Cell
    </Badge>
  );

  const info = (
    <>
      <Card className="p-3 space-y-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-200/60 dark:border-amber-800/40">
        <div className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
          {mode === "water" ? "পানির তড়িৎবিশ্লেষণ" : "ইলেকট্রোপ্লেটিং"}
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {mode === "water"
            ? "বৈদ্যুতিক শক্তি ব্যবহার করে H₂O ভেঙে H₂ ও O₂ পাওয়া যায়। H₂ ও O₂ এর আয়তন অনুপাত 2:1।"
            : "লোহার চামচের উপর তামার আবরণ তৈরি করা হয়। Cu²⁺ আয়ন CuSO₄ দ্রবণ থেকে ক্যাথোডে জমা হয়।"}
        </div>
      </Card>

      <Card className="p-3 space-y-2">
        <div className="text-xs font-bold uppercase text-muted-foreground">Half Reactions</div>
        {mode === "water" ? (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="rounded bg-rose-50 dark:bg-rose-950/40 px-2 py-1">
              <span className="text-rose-700 dark:text-rose-300 font-bold">Anode (+): </span>
              2H₂O → O₂ + 4H⁺ + 4e⁻
            </div>
            <div className="rounded bg-sky-50 dark:bg-sky-950/40 px-2 py-1">
              <span className="text-sky-700 dark:text-sky-300 font-bold">Cathode (−): </span>
              4H⁺ + 4e⁻ → 2H₂
            </div>
            <div className="rounded bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1">
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">Overall: </span>
              2H₂O → 2H₂ + O₂
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="rounded bg-rose-50 dark:bg-rose-950/40 px-2 py-1">
              <span className="text-rose-700 dark:text-rose-300 font-bold">Anode (+): </span>
              Cu(s) → Cu²⁺(aq) + 2e⁻
            </div>
            <div className="rounded bg-sky-50 dark:bg-sky-950/40 px-2 py-1">
              <span className="text-sky-700 dark:text-sky-300 font-bold">Cathode (−): </span>
              Cu²⁺(aq) + 2e⁻ → Cu(s)
            </div>
          </div>
        )}
      </Card>

      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase text-muted-foreground">Live Metrics</div>
          <span className="text-[10px] text-muted-foreground">t={runtime.toFixed(1)}s</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border p-2">
            <div className="text-muted-foreground">Voltage</div>
            <div className="font-bold text-amber-600">{voltage.toFixed(1)} V</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">Current</div>
            <div className="font-bold text-emerald-600">{current} A</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">Conductivity</div>
            <div className="font-bold text-sky-600">{conductivity}%</div>
          </div>
          {mode === "water" ? (
            <div className="rounded border p-2">
              <div className="text-muted-foreground">H₂:O₂</div>
              <div className="font-bold text-violet-600">
                {o2Frac > 0.01 ? (h2Frac / o2Frac).toFixed(2) : "—"} :1
              </div>
            </div>
          ) : (
            <div className="rounded border p-2">
              <div className="text-muted-foreground">Plating</div>
              <div className="font-bold text-orange-600">{(plating * 100).toFixed(0)}%</div>
            </div>
          )}
        </div>
      </Card>

      {/* Comparison hub */}
      <Card className="p-3">
        <button
          type="button"
          onClick={() => setCompareOpen((x) => !x)}
          className="flex w-full items-center justify-between text-xs font-bold uppercase text-muted-foreground"
        >
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3" /> Comparison Hub
          </span>
          {compareOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {compareOpen && (
          <div className="mt-2 space-y-2 text-[11px]">
            <div className="rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2">
              <div className="font-bold text-amber-800 dark:text-amber-200">Electrolytic (এই ল্যাব)</div>
              <div>Electrical → Chemical · Anode (+) · Cathode (−) · Battery required</div>
            </div>
            <div className="rounded border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2">
              <div className="font-bold text-emerald-800 dark:text-emerald-200">Galvanic (Daniel Cell)</div>
              <div>Chemical → Electrical · Anode (−) · Cathode (+) · Spontaneous</div>
            </div>
          </div>
        )}
      </Card>
    </>
  );

  const controls = (
    <>
      <Card className="p-3 space-y-3">
        <div className="text-xs font-bold uppercase text-muted-foreground">Experiment · পরীক্ষা</div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="water" className="text-[11px]">A · Water</TabsTrigger>
            <TabsTrigger value="plating" className="text-[11px]">B · Plating</TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>

      <Card className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className={`h-4 w-4 ${on ? "text-emerald-500" : "text-slate-400"}`} />
            <span className="text-sm font-semibold">Battery · ব্যাটারি</span>
          </div>
          <Switch checked={on} onCheckedChange={setOn} />
        </div>
        <div className={`h-2 rounded-full ${on ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" : "bg-rose-500/60"}`} />

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">Voltage (Rheostat)</span>
            <span className="font-mono text-amber-600">{voltage.toFixed(1)} V</span>
          </div>
          <Slider value={[voltage]} onValueChange={(v) => setVoltage(v[0])} min={0} max={12} step={0.5} />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0V</span><span>12V</span>
          </div>
        </div>

        {mode === "water" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold flex items-center gap-1">
                <Droplet className="h-3 w-3 text-sky-500" /> H₂SO₄ drops
              </span>
              <span className="font-mono text-sky-600">{acid}</span>
            </div>
            <Slider value={[acid]} onValueChange={(v) => setAcid(v[0])} min={0} max={10} step={1} />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Pure H₂O (no conduct)</span><span>10 drops</span>
            </div>
          </div>
        )}

        <Button onClick={reset} variant="outline" size="sm" className="w-full gap-1">
          <RotateCcw className="h-3 w-3" /> Reset · রিসেট
        </Button>
      </Card>

      <Card className="p-3 space-y-2">
        <div className="text-xs font-bold uppercase text-muted-foreground">Steps · ধাপ</div>
        <ul className="space-y-1">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px]">
              <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${s.done ? "bg-emerald-500 text-white" : "border border-slate-300 text-slate-400"}`}>
                {s.done ? "✓" : i + 1}
              </span>
              <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );

  const visual = (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(56,189,248,0.12),transparent_60%)]" />
      <div className="relative h-full w-full">
        {mode === "water" ? (
          <WaterScene on={on} voltage={voltage} acid={acid} h2Frac={h2Frac} o2Frac={o2Frac} />
        ) : (
          <PlatingScene on={on} voltage={voltage} plating={plating} />
        )}
      </div>
      {/* Legend */}
      <div className="absolute bottom-2 left-2 rounded-lg border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[10px] text-slate-200 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" /> e⁻
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500" /> Anode +
          <span className="inline-block h-2 w-2 rounded-full bg-sky-400" /> Cathode −
        </div>
      </div>
    </div>
  );

  const theory = (
    <div>
      <h3>তড়িৎবিশ্লেষণ (Electrolysis) কী?</h3>
      <p>
        যে প্রক্রিয়ায় বহিরাগত বৈদ্যুতিক শক্তির সাহায্যে একটি অস্বতঃস্ফূর্ত রাসায়নিক
        বিক্রিয়া ঘটানো হয়, তাকে তড়িৎবিশ্লেষণ বলে। যে কোষে এটি ঘটে তাকে তড়িৎবিশ্লেষ্য
        কোষ (Electrolytic Cell) বলে।
      </p>
      <h4>মূল বৈশিষ্ট্য</h4>
      <ul>
        <li>বাহ্যিক ব্যাটারি বাধ্যতামূলক</li>
        <li>Anode ধনাত্মক (+), Cathode ঋণাত্মক (−) — গ্যালভানিক কোষের বিপরীত</li>
        <li>বৈদ্যুতিক শক্তি → রাসায়নিক শক্তি</li>
      </ul>
      <h4>Faraday's Law</h4>
      <p>জমা হওয়া পদার্থের ভর ∝ প্রবাহিত চার্জ (Q = I × t)</p>
    </div>
  );

  return (
    <TheoryLabShell
      onBack={onBack}
      headerIcon={Header}
      titleBn="তড়িৎবিশ্লেষ্য কোষ · Electrolytic Cell"
      subtitleEn={mode === "water" ? "A · Water Electrolysis" : "B · Electroplating (Cu on Fe)"}
      badge={Badge_}
      info={info}
      visual={visual}
      controls={controls}
      theory={theory}
    />
  );
}
