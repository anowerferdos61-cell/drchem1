/**
 * 2D SVG workspace for the NaCl crystallisation experiment.
 * Stations: dissolving beaker → filtration column → heating/cooling dish.
 */
import type { NaClPlaced } from "../types";

interface Props {
  placed: NaClPlaced;
  /** 1.0 = full filtrate, 0.5 = saturation, lower = over-evap. */
  volumeFrac: number;
  /** Temperature of evaporating dish in °C. */
  tempC: number;
  /** 0–1 progress for the crystal-growth animation. */
  crystalGrowth: number;
}

export default function NaClWorkspace({ placed, volumeFrac, tempC, crystalGrowth }: Props) {
  const b1Liquid = placed.water ? (placed.salt ? "#e2eaf5" : "#cfe4ff") : null;
  const dishLiquidH = Math.max(2, 36 * volumeFrac);
  const flameOn = placed.burning;
  const showSteam = flameOn && tempC > 60 && volumeFrac > 0.1;
  const dishLiquidColor = crystalGrowth > 0.6 ? "#f8fafc" : tempC > 70 ? "#dbe7fa" : "#c8d8ee";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-slate-100">
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-amber-100/70 to-amber-200/80 border-t border-amber-300/60" />

      <svg
        viewBox="0 0 760 540"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="naclGlass" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="naclMetal" x1="0" x2="1">
            <stop offset="0" stopColor="#6b7280" />
            <stop offset="0.5" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <radialGradient id="naclFlame" cx="0.5" cy="0.85" r="0.6">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#b91c1c" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* ============ STATION 1 — DISSOLVING ============ */}
        <g transform="translate(30 290)">
          <text x="55" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            Beaker-1 · দ্রবীভূতকরণ
          </text>
          {placed.beaker_1 ? (
            <g>
              <path
                d="M10 0 L100 0 L96 130 Q96 140 86 140 L24 140 Q14 140 14 130 Z"
                fill="url(#naclGlass)"
                stroke="#64748b"
                strokeWidth="2"
              />
              {b1Liquid && (
                <path
                  d="M16 60 L94 60 L96 130 Q96 140 86 140 L24 140 Q14 140 14 130 Z"
                  fill={b1Liquid}
                  opacity={placed.dissolved ? 0.95 : 0.7}
                />
              )}
              {placed.salt && !placed.dissolved && (
                <g>
                  <circle cx="40" cy="115" r="3" fill="#94a3b8" />
                  <circle cx="60" cy="125" r="2.5" fill="#94a3b8" />
                  <circle cx="75" cy="110" r="3" fill="#94a3b8" />
                  <circle cx="32" cy="128" r="2" fill="#94a3b8" />
                </g>
              )}
              <text
                x="55"
                y="100"
                textAnchor="middle"
                fontSize="9"
                fill="#475569"
                fontFamily="ui-monospace,monospace"
              >
                100 mL H₂O
              </text>
            </g>
          ) : (
            <text x="55" y="70" textAnchor="middle" fontSize="10" fill="#94a3b8">
              ➕ Beaker-1
            </text>
          )}
          {placed.mortar && !placed.salt && (
            <text x="55" y="-26" textAnchor="middle" fontSize="9" fill="#64748b">
              ⛏ অবিশুদ্ধ লবণ গুঁড়া করো
            </text>
          )}
        </g>

        {/* ============ STATION 2 — FILTRATION ============ */}
        <g transform="translate(220 170)">
          <text x="75" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            পরিশ্রবণ · Filtration
          </text>
          {placed.filter_setup && (
            <g>
              {/* Stand */}
              <rect x="140" y="-5" width="6" height="330" fill="url(#naclMetal)" />
              <rect x="60" y="20" width="90" height="6" rx="2" fill="url(#naclMetal)" />
              {/* Funnel */}
              <path
                d="M25 30 L125 30 L88 95 L62 95 Z"
                fill="url(#naclGlass)"
                stroke="#64748b"
                strokeWidth="1.5"
              />
              {/* Filter paper cone */}
              <path
                d="M40 38 L110 38 L84 90 L66 90 Z"
                fill="#fef9c3"
                stroke="#ca8a04"
                strokeWidth="1"
                opacity="0.85"
              />
              {/* Funnel stem */}
              <rect
                x="71"
                y="95"
                width="8"
                height="45"
                fill="url(#naclGlass)"
                stroke="#64748b"
                strokeWidth="1"
              />
              {placed.dissolved && !placed.filtered && (
                <circle cx="75" cy="145" r="3" fill="#a5c4ed">
                  <animate
                    attributeName="cy"
                    from="145"
                    to="190"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="1"
                    to="0"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          )}

          {placed.beaker_2 && (
            <g transform="translate(10 195)">
              <path
                d="M10 0 L130 0 L124 115 Q124 125 114 125 L26 125 Q16 125 16 115 Z"
                fill="url(#naclGlass)"
                stroke="#64748b"
                strokeWidth="2"
              />
              {placed.filtered && (
                <path
                  d="M18 50 L122 50 L124 115 Q124 125 114 125 L26 125 Q16 125 16 115 Z"
                  fill="#dbeafe"
                  opacity="0.95"
                />
              )}
              <text
                x="70"
                y="90"
                textAnchor="middle"
                fontSize="9"
                fill="#475569"
                fontFamily="ui-monospace,monospace"
              >
                {placed.filtered ? "পরিশ্রুত দ্রবণ" : "Beaker-2"}
              </text>
            </g>
          )}
        </g>

        {/* ============ STATION 3 — HEATING / COOLING ============ */}
        <g transform="translate(510 260)">
          <text x="80" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            উত্তাপ · Evaporation
          </text>

          {placed.heat_setup && (
            <g>
              {/* Bunsen burner base */}
              <rect x="55" y="190" width="50" height="14" rx="2" fill="#1f2937" />
              {/* Burner stem */}
              <rect x="72" y="135" width="16" height="58" fill="url(#naclMetal)" />
              {/* Flame */}
              {flameOn && (
                <g>
                  <path
                    d="M80 75 Q60 110 70 140 Q80 130 80 140 Q80 130 90 140 Q100 110 80 75 Z"
                    fill="url(#naclFlame)"
                  >
                    <animate
                      attributeName="d"
                      values="M80 75 Q60 110 70 140 Q80 130 80 140 Q80 130 90 140 Q100 110 80 75 Z;
                              M80 70 Q58 108 70 140 Q80 128 80 140 Q80 128 90 140 Q102 108 80 70 Z;
                              M80 75 Q60 110 70 140 Q80 130 80 140 Q80 130 90 140 Q100 110 80 75 Z"
                      dur="0.4s"
                      repeatCount="indefinite"
                    />
                  </path>
                  <ellipse cx="80" cy="130" rx="8" ry="14" fill="#60a5fa" opacity="0.7" />
                </g>
              )}
              {/* Tripod legs */}
              <line x1="35" y1="80" x2="20" y2="160" stroke="url(#naclMetal)" strokeWidth="4" />
              <line x1="125" y1="80" x2="140" y2="160" stroke="url(#naclMetal)" strokeWidth="4" />
              <line
                x1="80"
                y1="80"
                x2="80"
                y2="160"
                stroke="url(#naclMetal)"
                strokeWidth="4"
                opacity="0.3"
              />
              {/* Tripod ring */}
              <ellipse
                cx="80"
                cy="80"
                rx="60"
                ry="6"
                fill="none"
                stroke="url(#naclMetal)"
                strokeWidth="4"
              />
              {/* Wire gauze */}
              <rect
                x="22"
                y="73"
                width="116"
                height="6"
                fill="#a8a29e"
                stroke="#57534e"
                strokeWidth="0.5"
              />
              <g stroke="#57534e" strokeWidth="0.4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={i} x1={22 + i * 10} y1="73" x2={22 + i * 10} y2="79" />
                ))}
              </g>
            </g>
          )}

          {/* Evaporating dish */}
          {placed.evaporating_dish && placed.heat_setup && (
            <g transform="translate(20 40)">
              <path
                d="M0 0 Q60 -8 120 0 L110 30 Q60 38 10 30 Z"
                fill="url(#naclGlass)"
                stroke="#64748b"
                strokeWidth="1.5"
              />
              {/* Liquid */}
              {placed.filtered && volumeFrac > 0.05 && (
                <path
                  d={`M10 ${30 - dishLiquidH} Q60 ${30 - dishLiquidH - 4} 110 ${30 - dishLiquidH} L110 30 Q60 38 10 30 Z`}
                  fill={dishLiquidColor}
                  opacity="0.9"
                />
              )}
              {/* Crystals growing */}
              {crystalGrowth > 0 && (
                <g>
                  {[
                    { x: 30, y: 22, base: 4 },
                    { x: 50, y: 26, base: 5 },
                    { x: 65, y: 22, base: 6 },
                    { x: 80, y: 25, base: 4 },
                    { x: 95, y: 23, base: 5 },
                  ].map((c, i) => {
                    const s = c.base * crystalGrowth;
                    return (
                      <rect
                        key={i}
                        x={c.x - s / 2}
                        y={c.y - s / 2}
                        width={s}
                        height={s}
                        fill="#f8fafc"
                        stroke="#94a3b8"
                        strokeWidth="0.6"
                        transform={`rotate(${i * 8 - 16} ${c.x} ${c.y})`}
                      />
                    );
                  })}
                  {placed.seeded && (
                    <rect
                      x="58"
                      y="20"
                      width={6 + 4 * crystalGrowth}
                      height={6 + 4 * crystalGrowth}
                      fill="#ffffff"
                      stroke="#475569"
                      strokeWidth="1"
                    />
                  )}
                </g>
              )}
              <text
                x="60"
                y="55"
                textAnchor="middle"
                fontSize="9"
                fill="#475569"
                fontFamily="ui-monospace,monospace"
              >
                বাষ্পীভবন পাত্র · {tempC.toFixed(0)}°C
              </text>
            </g>
          )}

          {/* Steam */}
          {showSteam && (
            <g opacity="0.7">
              {[0, 1, 2].map((i) => (
                <circle key={i} cx={70 + i * 14} cy={40} r="6" fill="#ffffff" opacity="0.65">
                  <animate
                    attributeName="cy"
                    from={40}
                    to={-10}
                    dur="2s"
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.7;0"
                    dur="2s"
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          )}

          {/* Volume marker */}
          {placed.heat_setup && placed.filtered && (
            <g transform="translate(160 50)">
              <rect width="8" height="40" fill="#e5e7eb" stroke="#94a3b8" />
              <rect y={40 - 40 * volumeFrac} width="8" height={40 * volumeFrac} fill="#3b82f6" />
              <text x="14" y="8" fontSize="9" fill="#475569">
                Volume {(volumeFrac * 100).toFixed(0)}%
              </text>
              <line
                x1="0"
                y1="20"
                x2="8"
                y2="20"
                stroke="#dc2626"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <text x="14" y="24" fontSize="8" fill="#dc2626">
                সম্পৃক্ত 50%
              </text>
            </g>
          )}
        </g>

        {/* Empty-state hint */}
        {!placed.beaker_1 && !placed.filter_setup && !placed.heat_setup && (
          <g>
            <text x="380" y="260" textAnchor="middle" fontSize="16" fill="#94a3b8">
              বাম দিক থেকে যন্ত্রপাতি টেনে আনুন
            </text>
            <text x="380" y="282" textAnchor="middle" fontSize="12" fill="#cbd5e1">
              Drag equipment to set up dissolving → filtration → evaporation
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
