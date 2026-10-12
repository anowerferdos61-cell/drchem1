/**
 * 2D SVG workspace for the Na2CO3 standard solution experiment.
 * Stations: digital balance (left) → volumetric flask + funnel (centre) → wash bottle (right).
 */
import type { Na2CO3Placed } from "../types";
import { TARGET_VOLUME_ML } from "@/lib/na2co3";

interface Props {
  placed: Na2CO3Placed;
}

export default function Na2CO3Workspace({ placed }: Props) {
  const displayMass = placed.balanceOn
    ? placed.watchGlassOnBalance
      ? placed.tared
        ? placed.actualAddedMass
        : placed.watchGlassMass + placed.actualAddedMass
      : 0
    : 0;
  const fillPct = Math.min(1.05, placed.addedWaterVolume / TARGET_VOLUME_ML);
  const overfilled = placed.addedWaterVolume > 252;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-slate-100">
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-amber-50 to-amber-100/80 border-t border-amber-200" />

      <svg
        viewBox="0 0 760 540"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="naGlass" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="naMetal" x1="0" x2="1">
            <stop offset="0" stopColor="#94a3b8" />
            <stop offset="0.5" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* ============ STATION 1 — DIGITAL BALANCE ============ */}
        <g transform="translate(40 320)">
          <text x="100" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            Digital Analytical Balance · ডিজিটাল ব্যালান্স
          </text>
          {/* Balance body */}
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
          {/* Display */}
          <rect x="20" y="55" width="160" height="40" rx="3" fill="#0a0a0a" />
          {placed.balanceOn ? (
            <text
              x="170"
              y="84"
              textAnchor="end"
              fontFamily="ui-monospace,monospace"
              fontSize="22"
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
          {/* Tare button */}
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
          {/* Power LED */}
          <circle cx="170" cy="120" r="4" fill={placed.balanceOn ? "#22c55e" : "#475569"} />
          {/* Weighing pan */}
          <rect x="40" y="32" width="120" height="6" rx="2" fill="url(#naMetal)" />

          {/* Watch glass on pan */}
          {placed.watchGlassOnBalance && (
            <g transform="translate(60 8)">
              <ellipse cx="40" cy="22" rx="40" ry="6" fill="#cbd5e1" opacity="0.5" />
              <path
                d="M0 22 Q40 12 80 22 Q40 28 0 22 Z"
                fill="url(#naGlass)"
                stroke="#64748b"
                strokeWidth="1"
              />
              {/* Powder pile */}
              {placed.actualAddedMass > 0 && (
                <g>
                  <ellipse
                    cx="40"
                    cy="20"
                    rx={6 + placed.actualAddedMass * 4}
                    ry={2 + placed.actualAddedMass * 1.5}
                    fill="#f1f5f9"
                    stroke="#94a3b8"
                    strokeWidth="0.5"
                  />
                  {Array.from({ length: Math.min(10, Math.round(placed.actualAddedMass * 4)) }).map(
                    (_, i) => (
                      <circle
                        key={i}
                        cx={40 + ((i % 5) - 2) * 3}
                        cy={18 + Math.floor(i / 5) * 2}
                        r="0.8"
                        fill="#cbd5e1"
                      />
                    ),
                  )}
                </g>
              )}
              <text x="40" y="40" textAnchor="middle" fontSize="8" fill="#475569">
                Watch Glass
              </text>
            </g>
          )}
        </g>

        {/* ============ STATION 2 — VOLUMETRIC FLASK ============ */}
        <g transform="translate(310 100)">
          <text x="80" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            250 mL Volumetric Flask · আয়তনিক ফ্লাস্ক
          </text>

          {placed.flaskReady && (
            <g>
              {/* Long neck */}
              <rect
                x="68"
                y="10"
                width="24"
                height="120"
                fill="url(#naGlass)"
                stroke="#64748b"
                strokeWidth="1.5"
              />
              {/* Calibration mark */}
              <line x1="62" y1="120" x2="98" y2="120" stroke="#dc2626" strokeWidth="1.5" />
              <text x="104" y="124" fontSize="9" fill="#dc2626" fontWeight="600">
                250 mL
              </text>
              {/* Bulb */}
              <path
                d="M68 130 Q10 150 10 230 Q10 320 80 320 Q150 320 150 230 Q150 150 92 130 Z"
                fill="url(#naGlass)"
                stroke="#64748b"
                strokeWidth="1.5"
              />

              {/* Water + dissolved Na2CO3 (light blue tint when solute present) */}
              {placed.addedWaterVolume > 0 &&
                (() => {
                  const maxLiquidH = 195; // px from bottom of bulb to calibration mark area
                  const liquidH = Math.min(maxLiquidH + 8, maxLiquidH * fillPct);
                  const bottomY = 320;
                  const topY = bottomY - liquidH;
                  // top in neck if past bulb top
                  const inNeck = liquidH > 190;
                  const tint = placed.soluteTransferred ? "#dbeafe" : "#cfe9ff";
                  return (
                    <>
                      {/* Bulb liquid */}
                      <path
                        d={`M10 230 Q10 320 80 320 Q150 320 150 230 L150 ${Math.max(130, Math.min(230, topY))} Q80 ${Math.max(120, Math.min(220, topY - 8))} 10 ${Math.max(130, Math.min(230, topY))} Z`}
                        fill={tint}
                        opacity="0.85"
                      />
                      {/* Neck liquid */}
                      {inNeck && (
                        <rect
                          x="68"
                          y={Math.max(10, topY)}
                          width="24"
                          height={Math.min(120, 320 - liquidH > 130 ? 0 : 130 - Math.max(10, topY))}
                          fill={tint}
                          opacity="0.85"
                        />
                      )}
                      {/* Meniscus line */}
                      {placed.meniscusChecked && Math.abs(placed.addedWaterVolume - 250) < 1.5 && (
                        <circle cx="80" cy="120" r="3" fill="#16a34a">
                          <animate
                            attributeName="r"
                            values="3;6;3"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </>
                  );
                })()}

              {/* Solute particles dissolving */}
              {placed.soluteTransferred && !placed.initialDissolved && (
                <g>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <circle key={i} cx={50 + i * 12} cy={250 + (i % 2) * 20} r="2" fill="#94a3b8">
                      <animate
                        attributeName="cy"
                        values={`${250 + (i % 2) * 20};${300 + (i % 2) * 10};${250 + (i % 2) * 20}`}
                        dur="2s"
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                    </circle>
                  ))}
                </g>
              )}

              {/* Stopper */}
              {placed.stoppered && (
                <g>
                  <rect x="62" y="-8" width="36" height="18" rx="3" fill="#475569" />
                  <rect x="68" y="-2" width="24" height="12" fill="#64748b" />
                </g>
              )}

              {/* Shake motion lines */}
              {placed.shaken && (
                <g stroke="#94a3b8" strokeWidth="1" fill="none">
                  <path d="M-10 200 Q-20 210 -10 220" />
                  <path d="M170 200 Q180 210 170 220" />
                </g>
              )}

              {/* Overfill warning */}
              {overfilled && (
                <text
                  x="80"
                  y="100"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#dc2626"
                >
                  ⚠ Over 250 mL!
                </text>
              )}

              {/* Volume readout */}
              <text
                x="80"
                y="345"
                textAnchor="middle"
                fontSize="9"
                fontFamily="ui-monospace,monospace"
                fill="#475569"
              >
                {placed.addedWaterVolume.toFixed(1)} / 250 mL
              </text>
            </g>
          )}

          {/* Funnel on flask */}
          {placed.flaskReady && placed.funnelOnFlask && (
            <g>
              <path
                d="M40 -55 L120 -55 L96 0 L64 0 Z"
                fill="url(#naGlass)"
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <rect
                x="68"
                y="0"
                width="24"
                height="12"
                fill="url(#naGlass)"
                stroke="#64748b"
                strokeWidth="1"
              />
              {/* powder falling */}
              {placed.soluteTransferred && !placed.washedDown && (
                <g fill="#cbd5e1">
                  <circle cx="80" cy="-20" r="1.5">
                    <animate
                      attributeName="cy"
                      from="-50"
                      to="20"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx="76" cy="-30" r="1.5">
                    <animate
                      attributeName="cy"
                      from="-50"
                      to="20"
                      dur="0.7s"
                      repeatCount="indefinite"
                      begin="0.2s"
                    />
                  </circle>
                </g>
              )}
            </g>
          )}
        </g>

        {/* ============ STATION 3 — WASH BOTTLE ============ */}
        <g transform="translate(580 280)">
          <text x="50" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            Wash Bottle · ওয়াশ বটল (H₂O)
          </text>
          {/* Body */}
          <rect
            x="20"
            y="40"
            width="60"
            height="100"
            rx="8"
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />
          <rect x="32" y="50" width="36" height="80" rx="4" fill="#bfdbfe" opacity="0.7" />
          <text x="50" y="98" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e40af">
            H₂O
          </text>
          {/* Cap */}
          <rect x="35" y="30" width="30" height="12" rx="2" fill="#1e3a8a" />
          {/* Curved spout */}
          <path d="M50 30 Q50 0 90 0 Q120 0 120 -25" fill="none" stroke="#1e3a8a" strokeWidth="3" />
          {/* Spray when adding water */}
          {placed.addedWaterVolume > 0 && placed.addedWaterVolume < 250 && (
            <g fill="#3b82f6" opacity="0.6">
              <circle cx="120" cy="-30" r="2">
                <animate
                  attributeName="cy"
                  from="-30"
                  to="-80"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.8"
                  to="0"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}
        </g>

        {/* Empty state hint */}
        {!placed.balanceOn && !placed.flaskReady && (
          <g>
            <text x="380" y="260" textAnchor="middle" fontSize="16" fill="#94a3b8">
              বাম দিক থেকে যন্ত্রপাতি বসান
            </text>
            <text x="380" y="282" textAnchor="middle" fontSize="12" fill="#cbd5e1">
              Place balance → watch glass → flask → funnel
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
