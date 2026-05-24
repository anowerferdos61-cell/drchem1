/**
 * 2D SVG workspace for the NaCl crystallisation experiment.
 * Renders three "stations" left → right:
 *   1. Dissolving beaker (Beaker-1)
 *   2. Filtration column (funnel + filter paper + Beaker-2)
 *   3. Heating + cooling station (tripod, gauze, burner, evaporating dish)
 * Optional seed crystal + grown cubic NaCl crystals appear at the end.
 */
import type { NaClPlaced } from "../types";

interface Props {
  placed: NaClPlaced;
  /** 1.0 = full filtrate, 0.5 = saturation, lower = over-evap. */
  volumeFrac: number;
  /** Temperature of evaporating dish in °C (25 = room, 100 = boiling). */
  tempC: number;
  /** 0–1 progress for the crystal-growth animation. */
  crystalGrowth: number;
}

export default function NaClWorkspace({
  placed,
  volumeFrac,
  tempC,
  crystalGrowth,
}: Props) {
  // ----- Beaker-1 (left): dissolving station -----
  const b1Liquid = placed.water ? (placed.salt ? "#e2eaf5" : "#cfe4ff") : null;

  // ----- Beaker-2 (filtration receiver) -----
  const filtrateFrac = placed.filtered ? 1 : 0;

  // ----- Evaporating dish -----
  // Liquid level shrinks with volumeFrac. Color shifts to white as crystals form.
  const dishLiquidH = Math.max(2, 30 * volumeFrac);
  const dishLiquidColor =
    crystalGrowth > 0.6 ? "#f3f4f6" : tempC > 70 ? "#dbe7fa" : "#c8d8ee";

  // ----- Flame animation -----
  const flameOn = placed.burning;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-slate-100">
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-amber-100/70 to-amber-200/80 border-t border-amber-300/60" />

      <svg
        viewBox="0 0 700 520"
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
          <linearGradient id="steamGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* ============ STATION 1 — DISSOLVING (Beaker-1) ============ */}
        <g transform="translate(40 280)">
          <text x="55" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            Beaker-1 · দ্রবীভূতকরণ
          </text>
          {placed.beaker_1 && (
            <>
              {/* Beaker outline */}
              <path
                d="M10 0 L100 0 L96 120 Q96 130 86 130 L24 130 Q14 130 14 120 Z"
                fill="url(#naclGlass)"
                stroke="#64748b"
                strokeWidth="2"
              />
              {b1Liquid && (
                <path
                  d="M16 60 L94 60 L96 120 Q96 130 86 130 L24 130 Q14 130 14 120 Z"
                  fill={b1Liquid}
                  opacity={placed.dissolved ? 0.95 : 0.6}
                >
                  {placed.dissolved && (
                    <animate
                      attributeName="opacity"
                      values="0.85;1;0.85"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  )}
                </path>
              )}
              {/* Suspended undissolved chunks */}
              {placed.salt && !placed.dissolved && (
                <g>
                  <circle cx="40" cy="105" r="3" fill="#94a3b8" />
                  <circle cx="60" cy="115" r="2.5" fill="#94a3b8" />
                  <circle cx="75" cy="100" r="3" fill="#94a3b8" />
                  <circle cx="30" cy="118" r="2" fill="#94a3b8" />
                </g>
              )}
              <text x="55" y="100" textAnchor="middle" fontSize="9" fill="#475569" fontFamily="ui-monospace,monospace">
                100 mL
              </text>
            </>
          )}
          {placed.mortar && !placed.beaker_1 && (
            <text x="55" y="60" textAnchor="middle" fontSize="10" fill="#94a3b8">
              ⛏ গুঁড়া করো
            </text>
          )}
        </g>

        {/* ============ STATION 2 — FILTRATION ============ */}
        <g transform="translate(220 180)">
          <text x="70" y="-10" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            পরিশ্রবণ · Filtration
          </text>
          {placed.filter_setup && (
            <>
              {/* Retort clamp */}
              <rect x="135" y="-5" width="5" height="320" fill="url(#naclMetal)" />
              <rect x="60" y="20" width="80" height="6" rx="2" fill="url(#naclMetal)" />
              {/* Funnel */}
              <path
                d="M30 30 L110 30 L80 90 L60 90 Z"
                fill="url(#naclGlass)"
                stroke="#64748b"
                strokeWidth="1.5"
              />
              {/* Filter paper (cone) */}
              <path
                d="M40 35 L100 35 L78 85 L62 85 Z"
                fill="#fef9c3"
                stroke="#ca8a04"
                strokeWidth="1"
                opacity="0.85"
              />
              {/* Funnel stem */}
              <rect x="66" y="90" width="8" height="40" fill="url(#naclGlass)" stroke="#64748b" strokeWidth="1" />

              {/* Drip animation while filtering */}
              {placed.dissolved && !placed.filtered && (
                <circle cx="70" cy="135" r="3" fill="#a5c4ed">
                  <animate attributeName="cy" from="135" to="180" dur="0.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="1" to="0" dur="0.8s" repeatCount="indefinite" />
                </circle>
              )}
            </>
          )}

          {/* Beaker-2 (receiver) */}
          {placed.beaker_2 && (
            <g transform="translate(10 180)">
              <path
                d="M10 0 L120 0 L114 110 Q114 120 104 120 L26 120 Q16 120 16 110 Z"
                fill="url(#naclGlass)"
                stroke="#64748b"
                strokeWidth="2"
              />
              {filtrateFrac > 0 && (
                <path
                  d="M18 55 L112 55 L114 110 Q114 120 104 120 L26 120 Q16 120 16 110 Z"
                  fill="#dbeafe"
                  opacity="0.95"
                />
              )}
              <text x="65" y="90" textAnchor="middle" fontSize="9" fill="#475569" fontFamily="ui-monospace,monospace">
                