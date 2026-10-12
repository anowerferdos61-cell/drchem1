/**
 * 2D SVG workspace for the CuSO4·5H2O crystallization-water experiment.
 * Stations: digital balance (left) · tripod + crucible + bunsen burner (centre) · desiccator (right).
 */
import type { CuSO4Placed } from "../types";
import { colorFromFraction } from "@/lib/copper-sulfate";

interface Props {
  placed: CuSO4Placed;
}

export default function CopperSulfateWorkspace({ placed }: Props) {
  const color = colorFromFraction(placed.dehydrationFraction);
  const sampleFill = color === "blue" ? "#1d4ed8" : color === "paleblue" ? "#93c5fd" : "#f8fafc";
  const sampleStroke = color === "blue" ? "#1e3a8a" : color === "paleblue" ? "#60a5fa" : "#cbd5e1";

  const displayMass = placed.balanceOn
    ? placed.crucibleOnBalance
      ? placed.tared
        ? placed.hydratedSampleMass > 0
          ? // After tare, only sample shows; after heating, post-cool reading
            placed.weighedAnhydrous
            ? placed.finalCrucibleMass - placed.emptyCrucibleMass
            : placed.hydratedSampleMass
          : 0
        : placed.weighedAnhydrous
          ? placed.finalCrucibleMass
          : placed.emptyCrucibleMass + placed.hydratedSampleMass
      : 0
    : 0;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-slate-100">
      <div className="absolute inset-x-0 bottom-0 h-20 border-t border-amber-200 bg-gradient-to-b from-amber-50 to-amber-100/80" />

      <svg
        viewBox="0 0 760 540"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="cuGlass" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="cuMetal" x1="0" x2="1">
            <stop offset="0" stopColor="#94a3b8" />
            <stop offset="0.5" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <radialGradient id="cuFlame" cx="0.5" cy="1" r="0.8">
            <stop offset="0" stopColor="#fef08a" />
            <stop offset="0.4" stopColor="#fb923c" />
            <stop offset="0.8" stopColor="#ea580c" stopOpacity="0.7" />
            <stop offset="1" stopColor="#7c2d12" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ============ STATION 1 — DIGITAL BALANCE ============ */}
        <g transform="translate(30 330)">
          <text x="100" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            Analytical Balance · ব্যালান্স
          </text>
          <rect
            x="0"
            y="40"
            width="200"
            height="120"
            rx="8"
            fill="#1f2937"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <rect x="20" y="55" width="160" height="40" rx="3" fill="#0a0a0a" />
          {placed.balanceOn ? (
            <text
              x="170"
              y="84"
              textAnchor="end"
              fontFamily="ui-monospace,monospace"
              fontSize="20"
              fontWeight="700"
              fill="#22c55e"
            >
              {displayMass.toFixed(3)} g
            </text>
          ) : (
            <text
              x="100"
              y="82"
              textAnchor="middle"
              fontFamily="ui-monospace,monospace"
              fontSize="11"
              fill="#475569"
            >
              OFF
            </text>
          )}
          <rect
            x="30"
            y="110"
            width="50"
            height="22"
            rx="3"
            fill={placed.tared ? "#16a34a" : "#374151"}
            stroke="#0f172a"
          />
          <text x="55" y="125" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">
            TARE
          </text>
          <circle cx="170" cy="120" r="4" fill={placed.balanceOn ? "#22c55e" : "#475569"} />
          <rect x="40" y="32" width="120" height="6" rx="2" fill="url(#cuMetal)" />

          {/* Crucible on pan */}
          {placed.crucibleOnBalance && (
            <g transform="translate(70 -12)">
              <Crucible
                fillSample={placed.hydratedSampleMass > 0 ? sampleFill : null}
                strokeSample={sampleStroke}
                sampleAmount={placed.hydratedSampleMass}
                hot={false}
              />
            </g>
          )}
        </g>

        {/* ============ STATION 2 — TRIPOD + BURNER ============ */}
        <g transform="translate(310 140)">
          <text x="80" y="-15" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            Tripod + Wire Gauze + Bunsen · ত্রিপদী
          </text>

          {placed.tripodReady && (
            <g>
              {/* Wire gauze */}
              <rect x="20" y="120" width="120" height="6" fill="#94a3b8" stroke="#475569" />
              <rect
                x="55"
                y="118"
                width="50"
                height="10"
                rx="1"
                fill="#fde68a"
                stroke="#a16207"
                strokeWidth="0.5"
              />
              {/* Tripod legs */}
              <line x1="30" y1="124" x2="10" y2="220" stroke="#1f2937" strokeWidth="3" />
              <line x1="130" y1="124" x2="150" y2="220" stroke="#1f2937" strokeWidth="3" />
              <line x1="80" y1="124" x2="80" y2="220" stroke="#1f2937" strokeWidth="3" />
              {/* Burner base */}
              <rect x="55" y="220" width="50" height="14" rx="2" fill="#0f172a" />
              <rect x="68" y="170" width="24" height="50" fill="#334155" stroke="#0f172a" />
              {/* Flame */}
              {placed.burnerOn && (
                <g>
                  <ellipse cx="80" cy="150" rx="14" ry="32" fill="url(#cuFlame)">
                    <animate
                      attributeName="ry"
                      values="28;36;28"
                      dur="0.7s"
                      repeatCount="indefinite"
                    />
                  </ellipse>
                  <ellipse cx="80" cy="155" rx="7" ry="20" fill="#3b82f6" opacity="0.7">
                    <animate
                      attributeName="ry"
                      values="18;24;18"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </ellipse>
                  {/* Heat shimmer */}
                  {[0, 1, 2].map((i) => (
                    <path
                      key={i}
                      d={`M${60 + i * 20} 90 q5 -10 0 -20 q-5 -10 0 -20`}
                      stroke="#fb923c"
                      strokeWidth="0.6"
                      fill="none"
                      opacity="0.5"
                    >
                      <animate
                        attributeName="opacity"
                        values="0.1;0.6;0.1"
                        dur="1.2s"
                        repeatCount="indefinite"
                        begin={`${i * 0.3}s`}
                      />
                    </path>
                  ))}
                </g>
              )}

              {/* Crucible on gauze */}
              {placed.crucibleOnTripod && (
                <g transform="translate(50 70)">
                  <Crucible
                    fillSample={placed.hydratedSampleMass > 0 ? sampleFill : null}
                    strokeSample={sampleStroke}
                    sampleAmount={placed.hydratedSampleMass}
                    hot={placed.burnerOn || (!placed.cooled && placed.heatingTime > 0)}
                  />
                  {/* Steam when burner on and water remaining */}
                  {placed.burnerOn && placed.dehydrationFraction < 0.99 && (
                    <g fill="#e2e8f0" opacity="0.7">
                      {[0, 1, 2].map((i) => (
                        <circle key={i} cx={15 + i * 12} cy="-10" r="3">
                          <animate
                            attributeName="cy"
                            values="-10;-50;-10"
                            dur="1.8s"
                            repeatCount="indefinite"
                            begin={`${i * 0.4}s`}
                          />
                          <animate
                            attributeName="opacity"
                            values="0;0.7;0"
                            dur="1.8s"
                            repeatCount="indefinite"
                            begin={`${i * 0.4}s`}
                          />
                        </circle>
                      ))}
                    </g>
                  )}
                  {/* Glass rod when stirring */}
                  {placed.stirred > 0 && placed.burnerOn && (
                    <line
                      x1="20"
                      y1="-30"
                      x2="35"
                      y2="15"
                      stroke="#cbd5e1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              )}
            </g>
          )}
        </g>

        {/* ============ STATION 3 — DESICCATOR ============ */}
        <g transform="translate(560 280)">
          <text x="80" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            Desiccator · ডেসিকেটর
          </text>
          {/* Dome */}
          <path
            d="M10 60 Q10 10 80 10 Q150 10 150 60 L150 120 L10 120 Z"
            fill="url(#cuGlass)"
            stroke="#64748b"
            strokeWidth="1.5"
          />
          {/* Knob */}
          <rect x="70" y="0" width="20" height="14" rx="3" fill="#475569" />
          {/* Perforated shelf */}
          <line x1="20" y1="80" x2="140" y2="80" stroke="#475569" strokeWidth="2" />
          {[30, 50, 70, 90, 110, 130].map((cx) => (
            <circle key={cx} cx={cx} cy="80" r="1.5" fill="#94a3b8" />
          ))}
          {/* Silica gel beads */}
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={i} cx={20 + i * 10} cy={108} r="2" fill="#3b82f6" opacity="0.6" />
          ))}
          <text x="80" y="100" textAnchor="middle" fontSize="7" fill="#475569">
            silica gel
          </text>

          {/* Crucible inside */}
          {placed.inDesiccator && (
            <g transform="translate(55 55)">
              <Crucible
                fillSample={placed.hydratedSampleMass > 0 ? sampleFill : null}
                strokeSample={sampleStroke}
                sampleAmount={placed.hydratedSampleMass}
                hot={!placed.cooled}
              />
              {placed.cooled && (
                <text
                  x="25"
                  y="40"
                  textAnchor="middle"
                  fontSize="8"
                  fill="#16a34a"
                  fontWeight="700"
                >
                  ✓ 25 °C
                </text>
              )}
            </g>
          )}
        </g>

        {/* Empty state */}
        {!placed.balanceOn && !placed.tripodReady && !placed.inDesiccator && (
          <g>
            <text x="380" y="260" textAnchor="middle" fontSize="16" fill="#94a3b8">
              বাম দিক থেকে যন্ত্রপাতি বসান
            </text>
            <text x="380" y="282" textAnchor="middle" fontSize="12" fill="#cbd5e1">
              Balance → Crucible → Tripod → Burner → Desiccator
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function Crucible({
  fillSample,
  strokeSample,
  sampleAmount,
  hot,
}: {
  fillSample: string | null;
  strokeSample: string;
  sampleAmount: number;
  hot: boolean;
}) {
  // Triangular porcelain crucible
  const sampleHeight = Math.min(14, sampleAmount * 3);
  return (
    <g>
      {/* Lid (small disc above) */}
      <ellipse cx="25" cy="-2" rx="22" ry="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
      {/* Walls */}
      <path d="M0 4 L50 4 L40 38 L10 38 Z" fill="#fef3c7" stroke="#a16207" strokeWidth="1.2" />
      {/* Sample */}
      {fillSample && sampleAmount > 0 && (
        <path
          d={`M${12} ${38 - sampleHeight} L${38} ${38 - sampleHeight} L${40} ${38} L${10} ${38} Z`}
          fill={fillSample}
          stroke={strokeSample}
          strokeWidth="0.8"
        />
      )}
      {/* Hot glow */}
      {hot && (
        <path
          d="M0 4 L50 4 L40 38 L10 38 Z"
          fill="none"
          stroke="#f97316"
          strokeWidth="1.5"
          opacity="0.7"
        >
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />
        </path>
      )}
    </g>
  );
}
