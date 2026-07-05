/**
 * Daniel Cell (Galvanic Cell) — Interactive Simulation
 * NCTB Class 9-10 · Chapter 8 · রসায়ন ও শক্তি
 *
 * Two SVG scenes:
 *   • Normal view — beakers, salt bridge, wire+bulb+voltmeter, e⁻ flow
 *   • Microscopic view — anode oxidation + cathode reduction + salt bridge ions
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Zap,
  Lightbulb,
  RotateCcw,
  Cable,
  ZoomIn,
  ZoomOut,
  BatteryCharging,
  Info,
  FlaskConical,
  Atom,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TheoryLabShell from "./TheoryLabShell";

interface Props {
  onBack: () => void;
}

/* ─────────────────────────────────────────────────────────
 * NORMAL SCENE — full apparatus
 * ───────────────────────────────────────────────────────── */
function NormalScene({
  connected,
  voltage,
  onConnect,
}: {
  connected: boolean;
  voltage: number;
  onConnect: () => void;
}) {
  // Bulb glow driven by voltage
  const glow = connected ? Math.min(1, voltage / 1.1) : 0;

  return (
    <svg
      viewBox="0 0 640 440"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="benchGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#0b1220" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="znSol" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#94a3b8" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="cuSol" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0.85" />
          <stop offset="1" stopColor="#1d4ed8" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="zincMetal" x1="0" x2="1">
          <stop offset="0" stopColor="#cbd5e1" />
          <stop offset="0.5" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="copperMetal" x1="0" x2="1">
          <stop offset="0" stopColor="#b45309" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <radialGradient id="bulbGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fde047" stopOpacity={0.9 * glow} />
          <stop offset="0.6" stopColor="#fbbf24" stopOpacity={0.4 * glow} />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Bench */}
      <rect x="0" y="360" width="640" height="80" fill="url(#benchGrad)" />
      <line x1="0" y1="360" x2="640" y2="360" stroke="#334155" strokeWidth="1" />

      {/* Salt Bridge (inverted U) */}
      <g>
        <path
          d="M 175 210 L 175 165 Q 175 130 220 130 L 420 130 Q 465 130 465 165 L 465 210"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M 175 210 L 175 165 Q 175 130 220 130 L 420 130 Q 465 130 465 165 L 465 210"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.55"
        />
        <text x="320" y="118" textAnchor="middle" fontSize="12" fontWeight="700" fill="#c4b5fd">
          Salt Bridge · KCl
        </text>
        {/* K+ moving right (toward cathode) inside bridge */}
        {connected &&
          [0, 0.4, 0.8].map((d, i) => (
            <g key={`kp-${i}`}>
              <circle r="4" fill="#f472b6">
                <animateMotion
                  dur="4s"
                  begin={`${d}s`}
                  repeatCount="indefinite"
                  path="M 200 150 L 440 150"
                />
              </circle>
              <text fontSize="9" fill="#fdf2f8" fontWeight="700">
                <animateMotion
                  dur="4s"
                  begin={`${d}s`}
                  repeatCount="indefinite"
                  path="M 205 148 L 445 148"
                />
                K+
              </text>
            </g>
          ))}
        {/* Cl- moving left (toward anode) inside bridge */}
        {connected &&
          [0.2, 0.6, 1.0].map((d, i) => (
            <g key={`cl-${i}`}>
              <circle r="4" fill="#34d399">
                <animateMotion
                  dur="4s"
                  begin={`${d}s`}
                  repeatCount="indefinite"
                  path="M 440 165 L 200 165"
                />
              </circle>
              <text fontSize="9" fill="#d1fae5" fontWeight="700">
                <animateMotion
                  dur="4s"
                  begin={`${d}s`}
                  repeatCount="indefinite"
                  path="M 442 163 L 202 163"
                />
                Cl-
              </text>
            </g>
          ))}
      </g>

      {/* LEFT BEAKER — Zn / ZnSO4 */}
      <g>
        {/* glass */}
        <path
          d="M 90 210 L 90 350 Q 90 360 100 360 L 250 360 Q 260 360 260 350 L 260 210 Z"
          fill="url(#glassGrad)"
          stroke="#94a3b8"
          strokeWidth="2"
        />
        {/* solution */}
        <path
          d="M 95 240 L 95 350 Q 95 355 100 355 L 250 355 Q 255 355 255 350 L 255 240 Z"
          fill="url(#znSol)"
        />
        {/* solution surface highlight */}
        <ellipse cx="175" cy="240" rx="80" ry="4" fill="#f8fafc" opacity="0.4" />
        {/* Zinc electrode */}
        <rect x="165" y="150" width="20" height="180" fill="url(#zincMetal)" stroke="#475569" strokeWidth="1" rx="2" />
        <rect x="163" y="150" width="24" height="6" fill="#64748b" rx="1" />
        <text x="175" y="380" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e2e8f0">
          Anode (Zn)
        </text>
        <text x="175" y="395" textAnchor="middle" fontSize="10" fill="#94a3b8">
          অ্যানোড · জিংক
        </text>
        <text x="175" y="330" textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">
          ZnSO₄
        </text>
      </g>

      {/* RIGHT BEAKER — Cu / CuSO4 */}
      <g>
        <path
          d="M 380 210 L 380 350 Q 380 360 390 360 L 540 360 Q 550 360 550 350 L 550 210 Z"
          fill="url(#glassGrad)"
          stroke="#94a3b8"
          strokeWidth="2"
        />
        <path
          d="M 385 240 L 385 350 Q 385 355 390 355 L 540 355 Q 545 355 545 350 L 545 240 Z"
          fill="url(#cuSol)"
        />
        <ellipse cx="465" cy="240" rx="80" ry="4" fill="#dbeafe" opacity="0.5" />
        {/* Copper electrode */}
        <rect x="455" y="150" width="20" height="180" fill="url(#copperMetal)" stroke="#78350f" strokeWidth="1" rx="2" />
        <rect x="453" y="150" width="24" height="6" fill="#78350f" rx="1" />
        <text x="465" y="380" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e2e8f0">
          Cathode (Cu)
        </text>
        <text x="465" y="395" textAnchor="middle" fontSize="10" fill="#94a3b8">
          ক্যাথোড · কপার
        </text>
        <text x="465" y="330" textAnchor="middle" fontSize="10" fontWeight="600" fill="#bfdbfe">
          CuSO₄
        </text>
      </g>

      {/* ─── Wire + Bulb + Voltmeter ─── */}
      {!connected && (
        <>
          {/* Loose wire coiled */}
          <path
            d="M 45 60 Q 65 45 90 55 T 140 55 T 190 55"
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <text x="45" y="45" fontSize="10" fill="#94a3b8">Wire</text>
          {/* Disconnected bulb sitting up top */}
          <g transform="translate(300 40)">
            <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <Lightbulb x="8" y="8" width="24" height="24" />
            <text x="20" y="60" textAnchor="middle" fontSize="10" fill="#94a3b8">
              Bulb (off)
            </text>
          </g>
          {/* Voltmeter idle */}
          <g transform="translate(500 30)">
            <rect x="0" y="0" width="90" height="55" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            <text x="45" y="18" textAnchor="middle" fontSize="9" fill="#64748b">VOLTMETER</text>
            <text x="45" y="40" textAnchor="middle" fontSize="16" fontFamily="ui-monospace,monospace" fill="#475569" fontWeight="700">
              -- V
            </text>
          </g>
        </>
      )}

      {connected && (
        <>
          {/* Wire: Zn (175,150) → up → across → down to bulb → across → down to Cu (465,150) */}
          {/* Left segment: up from Zn */}
          <path
            d="M 175 150 L 175 70 L 285 70"
            fill="none"
            stroke="#f97316"
            strokeWidth="3.5"
            strokeLinecap="round"
          >
            <animate attributeName="stroke-dasharray" from="0 400" to="400 0" dur="0.6s" fill="freeze" />
          </path>
          {/* Right segment: from bulb to Cu */}
          <path
            d="M 355 70 L 465 70 L 465 150"
            fill="none"
            stroke="#f97316"
            strokeWidth="3.5"
            strokeLinecap="round"
          >
            <animate attributeName="stroke-dasharray" from="0 400" to="400 0" dur="0.6s" fill="freeze" />
          </path>

          {/* Direction arrows on wire (e- flow Zn → Cu, i.e. left → right along top) */}
          {[0.15, 0.5, 0.85].map((f, i) => (
            <g key={`arr-${i}`} fill="#fbbf24">
              <polygon
                points={`${175 + f * (285 - 175)},64 ${175 + f * (285 - 175) - 6},58 ${175 + f * (285 - 175) - 6},70`}
              />
              <polygon
                points={`${355 + f * (465 - 355)},64 ${355 + f * (465 - 355) - 6},58 ${355 + f * (465 - 355) - 6},70`}
              />
            </g>
          ))}

          {/* Electron particles animating along wire (Zn -> bulb -> Cu) */}
          {[0, 0.25, 0.5, 0.75].map((delay, i) => (
            <g key={`e-${i}`}>
              <circle r="4" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="1">
                <animateMotion
                  dur="2s"
                  begin={`${delay + 0.6}s`}
                  repeatCount="indefinite"
                  path="M 175 150 L 175 70 L 285 70 L 355 70 L 465 70 L 465 150"
                />
              </circle>
              <text fontSize="8" fill="#e0f2fe" fontWeight="700">
                <animateMotion
                  dur="2s"
                  begin={`${delay + 0.6}s`}
                  repeatCount="indefinite"
                  path="M 178 148 L 178 68 L 288 68 L 358 68 L 468 68 L 468 148"
                />
                e-
              </text>
            </g>
          ))}

          {/* Bulb — lit */}
          <g transform="translate(285 40)">
            <circle cx="35" cy="30" r="34" fill="url(#bulbGlow)" />
            <circle cx="35" cy="30" r="20" fill="#fde047" stroke="#f59e0b" strokeWidth="2">
              <animate
                attributeName="opacity"
                values="0.85;1;0.85"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </circle>
            <path d="M 27 42 L 43 42 L 41 50 L 29 50 Z" fill="#64748b" />
            <text x="35" y="72" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fde047">
              Bulb · ON
            </text>
          </g>

          {/* Voltmeter — live */}
          <g transform="translate(500 30)">
            <rect x="0" y="0" width="90" height="55" rx="6" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
            <text x="45" y="18" textAnchor="middle" fontSize="9" fill="#6ee7b7">VOLTMETER</text>
            <text x="45" y="42" textAnchor="middle" fontSize="18" fontFamily="ui-monospace,monospace" fill="#34d399" fontWeight="800">
              {voltage.toFixed(2)} V
            </text>
          </g>
        </>
      )}

      {/* Empty-state prompt */}
      {!connected && (
        <g>
          <rect x="200" y="405" width="240" height="28" rx="14" fill="#0ea5e9" opacity="0.15" />
          <text x="320" y="424" textAnchor="middle" fontSize="12" fontWeight="700" fill="#7dd3fc">
            "Connect Circuit" চাপুন ▶
          </text>
        </g>
      )}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
 * MICROSCOPIC SCENE — animated split view
 * ───────────────────────────────────────────────────────── */
function MicroScene({ depositThick }: { depositThick: number }) {
  return (
    <svg viewBox="0 0 640 440" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="zincSurface" x1="0" x2="1">
          <stop offset="0" stopColor="#94a3b8" />
          <stop offset="0.5" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="cuSurface" x1="0" x2="1">
          <stop offset="0" stopColor="#78350f" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#78350f" />
        </linearGradient>
      </defs>

      {/* Background split */}
      <rect x="0" y="0" width="320" height="440" fill="#0f172a" />
      <rect x="320" y="0" width="320" height="440" fill="#0c1e3d" />
      <line x1="320" y1="0" x2="320" y2="440" stroke="#334155" strokeDasharray="4 4" />

      {/* ── LEFT: Zinc oxidation ── */}
      <g>
        <text x="160" y="26" textAnchor="middle" fontSize="13" fontWeight="800" fill="#e2e8f0">
          Zinc Anode · Oxidation
        </text>
        <text x="160" y="42" textAnchor="middle" fontSize="10" fill="#7dd3fc" fontFamily="ui-monospace,monospace">
          Zn → Zn²⁺ + 2e⁻
        </text>

        {/* Zinc slab */}
        <rect x="30" y="240" width="120" height="180" fill="url(#zincSurface)" stroke="#475569" />
        <text x="90" y="335" textAnchor="middle" fontSize="10" fill="#0f172a" fontWeight="700">
          Zn Metal
        </text>

        {/* Solution area */}
        <rect x="150" y="60" width="160" height="360" fill="#1e293b" opacity="0.4" />
        <text x="230" y="80" textAnchor="middle" fontSize="10" fill="#94a3b8">ZnSO₄ solution</text>

        {/* Zn atoms dissolving — cycle 3 atoms with delayed animation */}
        {[0, 1.3, 2.6].map((delay, i) => (
          <g key={`znatom-${i}`}>
            {/* the atom leaving surface, becoming Zn2+ floating right */}
            <g>
              <circle r="13" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5">
                <animate
                  attributeName="cx"
                  values="150;170;220;270"
                  keyTimes="0;0.15;0.6;1"
                  dur="4s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values={`${260 + i * 40};${250 + i * 40};${220 + i * 30};${180 + i * 20}`}
                  dur="4s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fill"
                  values="#cbd5e1;#cbd5e1;#7dd3fc;#38bdf8"
                  dur="4s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <text fontSize="10" fontWeight="800" fill="#0f172a" textAnchor="middle">
                <animate
                  attributeName="x"
                  values="150;170;220;270"
                  keyTimes="0;0.15;0.6;1"
                  dur="4s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="y"
                  values={`${263 + i * 40};${253 + i * 40};${223 + i * 30};${183 + i * 20}`}
                  dur="4s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
                Zn²⁺
              </text>
            </g>

            {/* two electrons rising up along wire indicator */}
            {[0, 0.15].map((offset, k) => (
              <g key={`ze-${i}-${k}`}>
                <circle r="4" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="1">
                  <animate
                    attributeName="cx"
                    values={`150;${100 + k * 10};${90 + k * 10}`}
                    dur="4s"
                    begin={`${delay + offset}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values={`${260 + i * 40};80;20`}
                    dur="4s"
                    begin={`${delay + offset}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.1;0.85;1"
                    dur="4s"
                    begin={`${delay + offset}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            ))}
          </g>
        ))}

        {/* wire out — top */}
        <path d="M 90 60 L 90 20 L 320 20" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" />
        <text x="60" y="55" fontSize="9" fill="#fdba74">to wire →</text>
      </g>

      {/* ── RIGHT: Cu reduction ── */}
      <g>
        <text x="480" y="26" textAnchor="middle" fontSize="13" fontWeight="800" fill="#e2e8f0">
          Copper Cathode · Reduction
        </text>
        <text x="480" y="42" textAnchor="middle" fontSize="10" fill="#fbbf24" fontFamily="ui-monospace,monospace">
          Cu²⁺ + 2e⁻ → Cu
        </text>

        {/* wire in - top */}
        <path d="M 320 20 L 550 20 L 550 60" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" />
        <text x="570" y="55" fontSize="9" fill="#fdba74">← wire</text>

        {/* Solution */}
        <rect x="330" y="60" width="160" height="360" fill="#1e3a8a" opacity="0.45" />
        <text x="410" y="80" textAnchor="middle" fontSize="10" fill="#bfdbfe">CuSO₄ solution</text>

        {/* Copper slab — grows with deposit */}
        <rect
          x={490 - depositThick}
          y="240"
          width={120 + depositThick}
          height="180"
          fill="url(#cuSurface)"
          stroke="#78350f"
        />
        <text x="550" y="335" textAnchor="middle" fontSize="10" fill="#fef3c7" fontWeight="700">
          Cu Metal
        </text>
        {depositThick > 4 && (
          <text x="550" y="352" textAnchor="middle" fontSize="8" fill="#fde68a">
            (deposit growing)
          </text>
        )}

        {/* Cu2+ ions moving to cathode + 2e- arriving from wire */}
        {[0, 1.3, 2.6].map((delay, i) => (
          <g key={`cuion-${i}`}>
            <circle r="13" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5">
              <animate
                attributeName="cx"
                values={`${420 - i * 20};${470 - i * 5};${490 - depositThick}`}
                keyTimes="0;0.7;1"
                dur="4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values={`${180 + i * 30};${260 + i * 20};${300 + i * 20}`}
                dur="4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="fill"
                values="#3b82f6;#3b82f6;#f59e0b"
                keyTimes="0;0.7;1"
                dur="4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
            <text fontSize="10" fontWeight="800" fill="#f8fafc" textAnchor="middle">
              <animate
                attributeName="x"
                values={`${420 - i * 20};${470 - i * 5};${490 - depositThick}`}
                keyTimes="0;0.7;1"
                dur="4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="y"
                values={`${183 + i * 30};${263 + i * 20};${303 + i * 20}`}
                dur="4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;1;0"
                keyTimes="0;0.9;1"
                dur="4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              Cu²⁺
            </text>

            {/* electrons arriving from wire down to cathode */}
            {[0, 0.15].map((off, k) => (
              <circle key={`ce-${i}-${k}`} r="4" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="1">
                <animate
                  attributeName="cx"
                  values={`${540 - k * 10};${520 - k * 10};${490 - depositThick + 10}`}
                  dur="4s"
                  begin={`${delay + off}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values={`20;120;${300 + i * 20}`}
                  dur="4s"
                  begin={`${delay + off}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.9;1"
                  dur="4s"
                  begin={`${delay + off}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
 * MAIN LAB
 * ───────────────────────────────────────────────────────── */
export default function DanielCellLab({ onBack }: Props) {
  const [connected, setConnected] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [voltage, setVoltage] = useState(1.1);
  const [runtime, setRuntime] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Voltage slowly decays as reactants consume; deposit thickness grows
  useEffect(() => {
    if (!connected) return;
    intervalRef.current = window.setInterval(() => {
      setRuntime((r) => r + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [connected]);

  useEffect(() => {
    // 1.10 V → slow decay, bottom out around 0.85 V
    const v = Math.max(0.85, 1.1 - runtime * 0.004);
    setVoltage(v);
  }, [runtime]);

  const depositThick = useMemo(() => Math.min(25, runtime * 0.4), [runtime]);

  const connect = useCallback(() => setConnected(true), []);
  const reset = useCallback(() => {
    setConnected(false);
    setZoom(false);
    setRuntime(0);
    setVoltage(1.1);
  }, []);

  return (
    <TheoryLabShell
      onBack={onBack}
      titleBn="ড্যানিয়েল সেল · গ্যালভানিক কোষ"
      subtitleEn="Chapter 8 · Daniel Cell (Galvanic Cell)"
      headerIcon={
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 shadow shadow-amber-500/30">
          <Zap className="h-4 w-4 text-white" />
        </div>
      }
      badge={
        <Badge
          variant="secondary"
          className={`gap-1.5 border border-white/10 text-white bg-gradient-to-r ${
            !connected
              ? "from-slate-500 to-slate-700"
              : zoom
                ? "from-fuchsia-500 to-violet-600"
                : "from-amber-500 to-yellow-600"
          }`}
        >
          {!connected ? (
            <Cable className="h-3.5 w-3.5" />
          ) : zoom ? (
            <Atom className="h-3.5 w-3.5" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          <span className="text-lab-xs font-semibold">
            {!connected
              ? "Circuit Open · সংযোগ নেই"
              : zoom
                ? "Microscopic View · আণবিক দৃশ্য"
                : `EMF = ${voltage.toFixed(2)} V`}
          </span>
        </Badge>
      }

      /* ── LEFT — theory + legend ── */
      info={
        <>
          <Card className="overflow-hidden border-0 shadow ring-2 ring-amber-400/30">
            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 px-3 py-2 text-white">
              <div className="flex items-center gap-1.5 text-lab-xs font-medium opacity-90">
                <FlaskConical className="h-3 w-3" /> রাসায়নিক শক্তি → বৈদ্যুতিক শক্তি
              </div>
              <div className="mt-0.5 font-extrabold leading-tight text-lab-lg">
                Zn | Zn²⁺ ‖ Cu²⁺ | Cu
              </div>
            </div>
            <p className="px-3 py-2 text-lab-sm text-foreground/90">
              জিংক ইলেকট্রোড ইলেকট্রন দান করে (অক্সিডেশন), কপার ইলেকট্রোড ইলেকট্রন গ্রহণ
              করে (রিডাকশন)। ফলে বহিরাগত তারে e⁻ প্রবাহ = <b>বিদ্যুৎ</b>।
            </p>
          </Card>

          <Card className="p-3 space-y-2">
            <div className="text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Half-Reactions · অর্ধ-বিক্রিয়া
            </div>
            <div className="rounded-md border bg-slate-50 p-2 dark:bg-slate-900/50">
              <div className="text-[10px] font-semibold text-slate-500">Anode (−)</div>
              <div className="font-mono text-lab-sm font-bold text-rose-600 dark:text-rose-400">
                Zn → Zn²⁺ + 2e⁻
              </div>
            </div>
            <div className="rounded-md border bg-slate-50 p-2 dark:bg-slate-900/50">
              <div className="text-[10px] font-semibold text-slate-500">Cathode (+)</div>
              <div className="font-mono text-lab-sm font-bold text-emerald-600 dark:text-emerald-400">
                Cu²⁺ + 2e⁻ → Cu
              </div>
            </div>
            <div className="rounded-md border-2 border-amber-400/60 bg-amber-50 p-2 dark:bg-amber-950/30">
              <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Net</div>
              <div className="font-mono text-lab-sm font-bold text-amber-700 dark:text-amber-300">
                Zn + Cu²⁺ → Zn²⁺ + Cu
              </div>
              <div className="mt-0.5 text-[10px] text-amber-700/80 dark:text-amber-400/80">
                E°<sub>cell</sub> = +1.10 V
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Info className="h-3 w-3" /> Legend · সংকেত
            </div>
            <div className="space-y-1.5 text-lab-sm">
              <LegendDot color="bg-sky-400 shadow-[0_0_6px_2px_rgba(56,189,248,0.6)]" label="e⁻ · ইলেকট্রন" />
              <LegendDot color="bg-slate-300" label="Zn / Zn²⁺" />
              <LegendDot color="bg-blue-600" label="Cu²⁺ (aq)" />
              <LegendDot color="bg-amber-500" label="Cu (s) — deposit" />
              <LegendDot color="bg-pink-400" label="K⁺ · সল্ট ব্রিজ" />
              <LegendDot color="bg-emerald-400" label="Cl⁻ · সল্ট ব্রিজ" />
            </div>
          </Card>
        </>
      }

      /* ── CENTER — scene ── */
      visual={
        <div
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 via-slate-950 to-black ring-1 ring-slate-700/50"
          style={{ aspectRatio: "640 / 440", maxHeight: "100%", maxWidth: "100%", height: "100%" }}
        >
          {zoom ? (
            <MicroScene depositThick={depositThick} />
          ) : (
            <NormalScene connected={connected} voltage={voltage} onConnect={connect} />
          )}

          {/* Overlay badge for museum-style caption */}
          <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
            {zoom ? "Microscopic View" : "Daniel Cell · Lab Bench"}
          </div>
        </div>
      }

      /* ── RIGHT — controls ── */
      controls={
        <>
          <Card className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Cable className="h-4 w-4 text-amber-500" />
              <div>
                <div className="text-lab-sm font-semibold">Circuit Control</div>
                <div className="text-[10px] text-muted-foreground">সার্কিট নিয়ন্ত্রণ</div>
              </div>
            </div>
            {!connected ? (
              <Button
                onClick={connect}
                size="sm"
                className="h-10 w-full gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:opacity-90"
              >
                <Cable className="h-4 w-4" /> Connect Circuit
              </Button>
            ) : (
              <Button
                onClick={() => setZoom((z) => !z)}
                size="sm"
                className="h-10 w-full gap-1.5 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white hover:opacity-90"
              >
                {zoom ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                {zoom ? "Back to Bench View" : "Zoom-In · আণবিক দৃশ্য"}
              </Button>
            )}
          </Card>

          <Card className="p-3 space-y-2">
            <div className="text-lab-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Live Readings · সরাসরি
            </div>
            <Metric
              label="EMF (Voltage)"
              value={connected ? voltage.toFixed(2) : "0.00"}
              unit="V"
              icon={BatteryCharging}
              gradient="from-emerald-500 to-teal-600"
            />
            <Metric
              label="Runtime"
              value={`${runtime}`}
              unit="s"
              icon={Zap}
              gradient="from-amber-500 to-orange-600"
            />
            <Metric
              label="Cu Deposit"
              value={depositThick.toFixed(1)}
              unit="μm"
              icon={Atom}
              gradient="from-orange-500 to-rose-600"
            />
            <Metric
              label="Bulb"
              value={connected ? "ON" : "OFF"}
              unit=""
              icon={Lightbulb}
              gradient={connected ? "from-yellow-400 to-amber-500" : "from-slate-400 to-slate-600"}
            />
          </Card>

          <Button variant="outline" size="sm" onClick={reset} className="h-8 w-full gap-1.5 text-lab-sm">
            <RotateCcw className="h-3.5 w-3.5" /> Reset Cell
          </Button>
        </>
      }

      /* ── Theory drawer ── */
      theory={
        <div className="space-y-3">
          <p>
            <b>ড্যানিয়েল সেল (Daniel Cell):</b> ১৮৩৬ সালে ব্রিটিশ রসায়নবিদ
            John Frederic Daniell তৈরি করেন এই গ্যালভানিক সেল, যা রাসায়নিক
            শক্তিকে বৈদ্যুতিক শক্তিতে রূপান্তর করে।
          </p>
          <p><b>গঠন:</b></p>
          <ul>
            <li>• <b>অ্যানোড:</b> ZnSO₄ দ্রবণে জিংক দণ্ড (ঋণাত্মক প্রান্ত)</li>
            <li>• <b>ক্যাথোড:</b> CuSO₄ দ্রবণে কপার দণ্ড (ধনাত্মক প্রান্ত)</li>
            <li>• <b>লবণ সেতু:</b> KCl জেলে ভরা U-নল — আয়ন প্রবাহ দিয়ে সার্কিট পূর্ণ করে</li>
            <li>• <b>বহিরাগত তার:</b> ইলেকট্রন প্রবাহের পথ (Zn → Cu)</li>
          </ul>
          <p><b>কার্যপ্রণালী:</b></p>
          <ol>
            <li>1. Zn দণ্ড থেকে e⁻ মুক্ত হয়ে তারের মধ্য দিয়ে Cu দণ্ডে যায়।</li>
            <li>2. Zn²⁺ আয়ন ZnSO₄ দ্রবণে চলে যায় — Zn দণ্ড ক্ষয়প্রাপ্ত হয়।</li>
            <li>3. Cu²⁺ আয়ন Cu দণ্ডে e⁻ গ্রহণ করে Cu ধাতু হিসেবে জমা হয়।</li>
            <li>4. লবণ সেতুর K⁺ ক্যাথোড দিকে, Cl⁻ অ্যানোড দিকে গিয়ে বৈদ্যুতিক নিরপেক্ষতা রক্ষা করে।</li>
          </ol>
          <p>
            <b>EMF (তড়িৎচালক বল):</b> E°<sub>cell</sub> = E°<sub>cathode</sub> − E°<sub>anode</sub>
            = 0.34 − (−0.76) = <b>+1.10 V</b>
          </p>
          <p>
            <b>প্রয়োগ:</b> ব্যাটারি, ইলেকট্রোপ্লেটিং, ধাতু নিষ্কাশন — সব
            আধুনিক বৈদ্যুতিক শক্তির ভিত্তি এই সরল সেল।
          </p>
        </div>
      }
    />
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
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
