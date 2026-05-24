/**
 * 2D SVG workspace for "Ionic vs Covalent Properties & Electrolysis".
 * Four stations stacked horizontally: solubility, conductivity, melting, electrolysis.
 */
import type { IonicPlaced, IonicSubstance } from "../types";
import { LABELS } from "@/lib/ionic";

interface Props {
  placed: IonicPlaced;
  /** Substance currently selected for conductivity / melting test stations. */
  activeSubstance: IonicSubstance | null;
  /** 0..1, current electrolysis time. */
  electrolysisT: number;
}

const SUB_COLORS: Record<IonicSubstance, string> = {
  nacl: "#f8fafc",
  sugar: "#fef3c7",
  naphthalene: "#e5e7eb",
  cuso4: "#bfdbfe",
};

export default function IonicWorkspace({ placed, activeSubstance, electrolysisT }: Props) {
  const bulbOn =
    activeSubstance !== null &&
    placed.circuitReady &&
    placed.conductivityTested[activeSubstance] === "on";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-slate-100">
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-amber-100/70 to-amber-200/80 border-t border-amber-300/60" />

      <svg
        viewBox="0 0 900 540"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="iGlass" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="iMetal" x1="0" x2="1">
            <stop offset="0" stopColor="#6b7280" />
            <stop offset="0.5" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <radialGradient id="iBulb" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fef9c3" />
            <stop offset="0.6" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0.2" />
          </radialGradient>
          <radialGradient id="iFlame" cx="0.5" cy="0.85" r="0.6">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#b91c1c" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* ============ STATION 1 — SOLUBILITY ============ */}
        <g transform="translate(20 60)">
          <text x="110" y="0" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
            ১. দ্রবণীয়তা · Solubility
          </text>
          {(["nacl", "sugar", "naphthalene", "cuso4"] as IonicSubstance[]).map(
            (sub, i) => {
              const x = i * 55;
              const result = placed.solubility[sub];
              const liquid = placed.waterAdded
                ? result === "dissolved"
                  ? SUB_COLORS[sub]
                  : result === "insoluble"
                    ? "#cbd5e1"
                    : "#dbeafe"
                : null;
              return (
                <g key={sub} transform={`translate(${x} 14)`}>
                  <path
                    d="M5 0 L45 0 L42 70 Q42 76 36 76 L14 76 Q8 76 8 70 Z"
                    fill="url(#iGlass)"
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />
                  {liquid && (
                    <path
                      d="M9 30 L41 30 L42 70 Q42 76 36 76 L14 76 Q8 76 8 70 Z"
                      fill={liquid}
                      opacity={result === "insoluble" ? 0.65 : 0.9}
                    />
                  )}
                  {result === "insoluble" && (
                    <g>
                      <circle cx="18" cy="38" r="2" fill="#475569" />
                      <circle cx="28" cy="44" r="2.5" fill="#475569" />
                      <circle cx="35" cy="36" r="2" fill="#475569" />
                    </g>
                  )}
                  <text x="25" y="92" textAnchor="middle" fontSize="8" fill="#1e293b" fontWeight="600">
                    {LABELS[sub].en}
                  </text>
                  {result && (
                    <text
                      x="25"
                      y="102"
                      textAnchor="middle"
                      fontSize="7"
                      fill={result === "dissolved" ? "#059669" : "#dc2626"}
                    >
                      {result === "dissolved" ? "✓ দ্রবীভূত" : "✗ অদ্রবণীয়"}
                    </text>
                  )}
                </g>
              );
            },
          )}
        </g>

        {/* ============ STATION 2 — CONDUCTIVITY CIRCUIT ============ */}
        <g transform="translate(280 70)">
          <text x="110" y="-10" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
            ২. তড়িৎ পরিবাহিতা · Conductivity
          </text>
          {placed.circuitReady ? (
            <g>
              {/* Battery */}
              <g transform="translate(0 10)">
                <rect width="60" height="34" rx="4" fill="#1e293b" />
                <rect x="6" y="6" width="48" height="22" fill="#f59e0b" />
                <text x="30" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e293b">
                  9V
                </text>
              </g>
              {/* Wires */}
              <path
                d="M60 27 L100 27 L100 70"
                stroke="#dc2626"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M0 27 L-20 27 L-20 70"
                stroke="#1e293b"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Bulb */}
              <g transform="translate(160 10)">
                <circle
                  cx="0"
                  cy="0"
                  r="22"
                  fill={bulbOn ? "url(#iBulb)" : "#e5e7eb"}
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                {bulbOn && (
                  <circle cx="0" cy="0" r="30" fill="#fde68a" opacity="0.5">
                    <animate
                      attributeName="opacity"
                      values="0.3;0.7;0.3"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <rect x="-8" y="20" width="16" height="6" fill="#9ca3af" />
                <text x="0" y="-30" textAnchor="middle" fontSize="9" fill="#475569">
                  {bulbOn ? "ON · জ্বলছে" : "OFF · বন্ধ"}
                </text>
              </g>
              <path d="M140 27 L60 27" stroke="#1e293b" strokeWidth="2.5" fill="none" />
              {/* Electrodes dipped into a beaker */}
              <g transform="translate(-50 70)">
                <path
                  d="M0 0 L150 0 L144 75 Q144 82 137 82 L13 82 Q6 82 6 75 Z"
                  fill="url(#iGlass)"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />
                {activeSubstance && (
                  <path
                    d="M8 35 L142 35 L144 75 Q144 82 137 82 L13 82 Q6 82 6 75 Z"
                    fill={SUB_COLORS[activeSubstance]}
                    opacity="0.85"
                  />
                )}
                <rect x="30" y="-12" width="6" height="60" fill="url(#iMetal)" />
                <rect x="114" y="-12" width="6" height="60" fill="url(#iMetal)" />
                {bulbOn && activeSubstance && (
                  <g stroke="#3b82f6" strokeWidth="1" opacity="0.7" fill="none">
                    <path d="M36 25 Q60 30 75 40">
                      <animate
                        attributeName="opacity"
                        values="0;0.8;0"
                        dur="0.6s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <path d="M114 25 Q90 30 75 40">
                      <animate
                        attributeName="opacity"
                        values="0;0.8;0"
                        dur="0.6s"
                        begin="0.3s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
                )}
                <text x="75" y="60" textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="600">
                  {activeSubstance ? LABELS[activeSubstance].en : "Select substance"}
                </text>
              </g>
            </g>
          ) : (
            <text x="100" y="60" textAnchor="middle" fontSize="10" fill="#94a3b8">
              ➕ Battery + Bulb + Wires + Electrodes
            </text>
          )}
        </g>

        {/* ============ STATION 3 — MELTING POINT ============ */}
        <g transform="translate(570 70)">
          <text x="80" y="-10" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
            ৩. গলনাঙ্ক · Melting
          </text>
          {placed.meltingReady ? (
            <g>
              {/* Spatula over flame */}
              <g transform="translate(20 0)">
                <rect x="0" y="35" width="100" height="6" fill="url(#iMetal)" rx="2" />
                <rect x="-25" y="32" width="30" height="12" fill="#1f2937" rx="3" />
                {activeSubstance && (
                  <g>
                    {placed.meltResult[activeSubstance] === "vaporized" ? (
                      <g>
                        <text x="50" y="30" textAnchor="middle" fontSize="10" fill="#94a3b8">
                          ☁ বাষ্পীভূত
                        </text>
                        {[0, 1, 2].map((i) => (
                          <circle
                            key={i}
                            cx={40 + i * 12}
                            cy={25}
                            r="4"
                            fill="#cbd5e1"
                            opacity="0.6"
                          >
                            <animate
                              attributeName="cy"
                              from={25}
                              to={-5}
                              dur="1.5s"
                              begin={`${i * 0.3}s`}
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0;0.7;0"
                              dur="1.5s"
                              begin={`${i * 0.3}s`}
                              repeatCount="indefinite"
                            />
                          </circle>
                        ))}
                      </g>
                    ) : placed.meltResult[activeSubstance] === "melted" ? (
                      <ellipse cx="50" cy="34" rx="22" ry="4" fill={SUB_COLORS[activeSubstance]} />
                    ) : placed.meltResult[activeSubstance] === "solid" ? (
                      <g>
                        <rect x="38" y="26" width="24" height="10" fill={SUB_COLORS[activeSubstance]} stroke="#475569" />
                        <text x="50" y="20" textAnchor="middle" fontSize="8" fill="#dc2626">
                          কঠিন
                        </text>
                      </g>
                    ) : (
                      <rect x="40" y="28" width="20" height="8" fill={SUB_COLORS[activeSubstance]} stroke="#475569" />
                    )}
                  </g>
                )}
              </g>
              {/* Bunsen flame */}
              <g transform="translate(50 70)">
                <rect x="-15" y="50" width="40" height="14" rx="2" fill="#1f2937" />
                <rect x="0" y="0" width="10" height="55" fill="url(#iMetal)" />
                <path
                  d="M5 -30 Q-10 0 0 30 Q5 20 5 30 Q5 20 10 30 Q20 0 5 -30 Z"
                  fill="url(#iFlame)"
                >
                  <animate
                    attributeName="d"
                    values="M5 -30 Q-10 0 0 30 Q5 20 5 30 Q5 20 10 30 Q20 0 5 -30 Z;
                            M5 -35 Q-12 0 0 30 Q5 18 5 30 Q5 18 10 30 Q22 0 5 -35 Z;
                            M5 -30 Q-10 0 0 30 Q5 20 5 30 Q5 20 10 30 Q20 0 5 -30 Z"
                    dur="0.4s"
                    repeatCount="indefinite"
                  />
                </path>
              </g>
            </g>
          ) : (
            <text x="80" y="60" textAnchor="middle" fontSize="10" fill="#94a3b8">
              ➕ Spatula + Bunsen Burner
            </text>
          )}
        </g>

        {/* ============ STATION 4 — ELECTROLYSIS OF CuSO₄ ============ */}
        <g transform="translate(80 340)">
          <text x="380" y="0" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
            ৪. CuSO₄ এর তড়িৎ বিশ্লেষণ · Electrolysis
          </text>

          {placed.cellReady ? (
            <g transform="translate(0 18)">
              {/* Battery */}
              <g transform="translate(0 20)">
                <rect width="80" height="44" rx="4" fill="#1e293b" />
                <rect x="8" y="8" width="64" height="28" fill="#f59e0b" />
                <text x="40" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">
                  9V Battery
                </text>
                <text x="14" y="-4" fontSize="14" fontWeight="700" fill={placed.polarityCorrect ? "#dc2626" : "#1e293b"}>+</text>
                <text x="60" y="-4" fontSize="14" fontWeight="700" fill={placed.polarityCorrect ? "#1e293b" : "#dc2626"}>−</text>
              </g>
              {/* Wires */}
              <path
                d="M14 20 L14 0 L300 0 L300 50"
                stroke={placed.polarityCorrect ? "#dc2626" : "#1e293b"}
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M66 20 L66 -10 L500 -10 L500 50"
                stroke={placed.polarityCorrect ? "#1e293b" : "#dc2626"}
                strokeWidth="3"
                fill="none"
              />
              {/* Electrolysis cell */}
              <g transform="translate(180 50)">
                <path
                  d="M0 0 L440 0 L430 130 Q430 142 418 142 L22 142 Q10 142 10 130 Z"
                  fill="url(#iGlass)"
                  stroke="#64748b"
                  strokeWidth="2"
                />
                {placed.cuso4InCell && (
                  <path
                    d="M10 28 L430 28 L430 130 Q430 142 418 142 L22 142 Q10 142 10 130 Z"
                    fill="#3b82f6"
                    opacity="0.55"
                  />
                )}
                {placed.cuso4InCell && (
                  <text x="220" y="80" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e3a8a" opacity="0.7">
                    CuSO₄ (aq)
                  </text>
                )}
                {/* Electrodes */}
                {placed.electrodesPlaced && (
                  <g>
                    {/* Cathode (left) - copper grows */}
                    <rect
                      x="115"
                      y="-20"
                      width="10"
                      height="130"
                      fill="#94a3b8"
                      stroke="#475569"
                    />
                    {placed.electrolysisRun && placed.polarityCorrect && (
                      <rect
                        x={115 - 4 * placed.copperDeposit}
                        y={-20}
                        width={10 + 8 * placed.copperDeposit}
                        height="130"
                        fill="#b87333"
                        opacity={0.4 + 0.6 * placed.copperDeposit}
                      />
                    )}
                    <text x="120" y="-26" textAnchor="middle" fontSize="10" fontWeight="700" fill="#dc2626">
                      −
                    </text>
                    <text x="120" y="158" textAnchor="middle" fontSize="9" fill="#1e293b">
                      Cathode · ক্যাথোড
                    </text>

                    {/* Anode (right) */}
                    <rect
                      x="315"
                      y="-20"
                      width="10"
                      height="130"
                      fill="#475569"
                      stroke="#1e293b"
                    />
                    <text x="320" y="-26" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e293b">
                      +
                    </text>
                    <text x="320" y="158" textAnchor="middle" fontSize="9" fill="#1e293b">
                      Anode · অ্যানোড
                    </text>

                    {/* Bubbles at anode */}
                    {placed.electrolysisRun && placed.polarityCorrect && (
                      <g>
                        {[0, 1, 2, 3].map((i) => (
                          <circle
                            key={i}
                            cx={325 + (i % 2) * 5}
                            cy={100 - i * 8}
                            r="3"
                            fill="#ffffff"
                            opacity="0.7"
                          >
                            <animate
                              attributeName="cy"
                              from={110}
                              to={30}
                              dur="2s"
                              begin={`${i * 0.5}s`}
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0;0.8;0"
                              dur="2s"
                              begin={`${i * 0.5}s`}
                              repeatCount="indefinite"
                            />
                          </circle>
                        ))}
                      </g>
                    )}

                    {/* Ion migration */}
                    {placed.electrolysisRun && placed.cuso4InCell && (
                      <g fontSize="9" fontWeight="700">
                        <text fill="#dc2626" opacity={0.7 + 0.3 * Math.sin(electrolysisT * 6)}>
                          <animate
                            attributeName="x"
                            values="280;130"
                            dur="2.5s"
                            repeatCount="indefinite"
                          />
                          <animate attributeName="y" values="60;65" dur="2.5s" repeatCount="indefinite" />
                          Cu²⁺
                        </text>
                        <text fill="#1e293b" opacity={0.7}>
                          <animate
                            attributeName="x"
                            values="160;310"
                            dur="2.5s"
                            repeatCount="indefinite"
                          />
                          <animate attributeName="y" values="70;75" dur="2.5s" repeatCount="indefinite" />
                          SO₄²⁻
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>
            </g>
          ) : (
            <text x="380" y="80" textAnchor="middle" fontSize="11" fill="#94a3b8">
              ➕ Electrolysis cell + CuSO₄ + electrodes + battery
            </text>
          )}
        </g>

        {/* Empty-state hint */}
        {!placed.beakersReady && !placed.circuitReady && !placed.meltingReady && !placed.cellReady && (
          <g>
            <text x="450" y="270" textAnchor="middle" fontSize="14" fill="#94a3b8">
              বাম দিক থেকে যন্ত্রপাতি টেনে আনুন
            </text>
            <text x="450" y="290" textAnchor="middle" fontSize="11" fill="#cbd5e1">
              Drag equipment to begin each stage
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
