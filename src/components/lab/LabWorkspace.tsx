/**
 * 2D SVG-based titration workspace (flat illustration style).
 * Same props as the prior 3D version — drop-in replacement.
 */
import type { Placed } from "./types";
import { solutionColor } from "@/lib/chemistry";

interface Props {
  placed: Placed;
  Vb: number;
  Ve: number;
  pH: number;
  stopcockOpen: boolean;
  stirring: boolean;
  classroom: boolean;
}

const rgba = (c: { r: number; g: number; b: number; a: number }) =>
  `rgba(${c.r},${c.g},${c.b},${c.a})`;

export default function LabWorkspace({
  placed,
  Vb,
  pH,
  stopcockOpen,
  stirring,
}: Props) {
  const buretteCapacity = 50;
  const fillFrac = placed.naoh ? Math.max(0, 1 - Vb / buretteCapacity) : 0;

  // Burette liquid geometry (SVG coords)
  const buretteX = 300;
  const buretteTop = 60;
  const buretteBottom = 360;
  const buretteH = buretteBottom - buretteTop;
  const liquidTopY = buretteBottom - buretteH * fillFrac;

  const flaskLiquid = rgba(solutionColor(pH));
  const hasFlaskLiquid = placed.hcl;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-slate-100">
      {/* Bench */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-amber-100/70 to-amber-200/80 border-t border-amber-300/60" />

      <svg
        viewBox="0 0 600 560"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="glass" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="metal" x1="0" x2="1">
            <stop offset="0" stopColor="#6b7280" />
            <stop offset="0.5" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="naohLiquid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#bcdcff" />
            <stop offset="1" stopColor="#6ea8e6" />
          </linearGradient>
        </defs>

        {/* === Stand === */}
        {placed.clamp && (
          <g>
            {/* Base */}
            <rect x="380" y="475" width="170" height="18" rx="3" fill="url(#metal)" />
            <ellipse cx="465" cy="493" rx="85" ry="5" fill="#0f172a" opacity="0.18" />
            {/* Vertical rod */}
            <rect x="458" y="80" width="10" height="400" rx="3" fill="url(#metal)" />
            {/* Clamp arm holding burette */}
            <rect x="305" y="190" width="160" height="10" rx="3" fill="url(#metal)" />
            <circle cx="305" cy="195" r="10" fill="#1f2937" />
          </g>
        )}

        {/* === Burette === */}
        {placed.burette && placed.clamp && (
          <g>
            {/* Funnel top */}
            <path
              d="M270 50 L330 50 L310 80 L290 80 Z"
              fill="url(#glass)"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            {/* Tube */}
            <rect
              x="290"
              y={buretteTop}
              width="20"
              height={buretteH}
              fill="url(#glass)"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            {/* Liquid */}
            {fillFrac > 0.001 && (
              <rect
                x="291"
                y={liquidTopY}
                width="18"
                height={buretteBottom - liquidTopY}
                fill="url(#naohLiquid)"
              />
            )}
            {/* Tick marks */}
            {Array.from({ length: 11 }).map((_, i) => {
              const y = buretteTop + (i * buretteH) / 10;
              return (
                <g key={i}>
                  <line x1="305" y1={y} x2="315" y2={y} stroke="#475569" strokeWidth="1" />
                  <text x="318" y={y + 3} fontSize="9" fill="#475569" fontFamily="ui-monospace,monospace">
                    {i * 5}
                  </text>
                </g>
              );
            })}
            {/* Stopcock */}
            <circle cx={buretteX} cy="372" r="10" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="1.5" />
            <rect
              x="285"
              y="368"
              width="30"
              height="8"
              rx="2"
              fill={stopcockOpen ? "#22c55e" : "#0ea5e9"}
              transform={stopcockOpen ? `rotate(90 ${buretteX} 372)` : undefined}
              style={{ transition: "transform 0.3s" }}
            />
            {/* Tip */}
            <path d="M295 382 L305 382 L302 405 L298 405 Z" fill="url(#glass)" stroke="#94a3b8" strokeWidth="1" />

            {/* Drip animation */}
            {stopcockOpen && (
              <circle cx={buretteX} cy="405" r="3" fill="#7fb6f0">
                <animate attributeName="cy" from="405" to="445" dur="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="1" to="0" dur="0.6s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        )}

        {/* === Flask === */}
        {placed.flask && (
          <g transform="translate(220 340)">
            {stirring && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="220 340; 218 340; 222 340; 219 341; 221 339; 220 340"
                dur="0.4s"
                repeatCount="indefinite"
                additive="replace"
              />
            )}
            {/* Flask outline (Erlenmeyer) */}
            <path
              d="M68 0 L92 0 L92 35 L150 130 L150 145 Q150 155 140 155 L20 155 Q10 155 10 145 L10 130 L68 35 Z"
              fill="url(#glass)"
              stroke="#64748b"
              strokeWidth="2"
            />
            {/* Liquid inside */}
            {hasFlaskLiquid && (
              <path
                d="M30 100 L130 100 L150 145 Q150 155 140 155 L20 155 Q10 155 10 145 Z"
                fill={flaskLiquid}
                stroke="none"
              >
                {stirring && (
                  <animate
                    attributeName="d"
                    values="M30 100 L130 100 L150 145 Q150 155 140 155 L20 155 Q10 155 10 145 Z;
                            M32 98 L128 102 L150 145 Q150 155 140 155 L20 155 Q10 155 10 145 Z;
                            M30 100 L130 100 L150 145 Q150 155 140 155 L20 155 Q10 155 10 145 Z"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                )}
              </path>
            )}
            {/* Volume label */}
            <text x="80" y="135" textAnchor="middle" fontSize="10" fill="#475569" fontFamily="ui-monospace,monospace">
              250 mL
            </text>
            {/* Stir bar */}
            {hasFlaskLiquid && stirring && (
              <ellipse cx="80" cy="148" rx="14" ry="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 80 148"
                  to="360 80 148"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </ellipse>
            )}
          </g>
        )}

        {/* Empty-state hint */}
        {!placed.clamp && !placed.flask && !placed.burette && (
          <g>
            <text x="300" y="260" textAnchor="middle" fontSize="16" fill="#94a3b8">
              Drag equipment from the left to begin
            </text>
            <text x="300" y="282" textAnchor="middle" fontSize="12" fill="#cbd5e1">
              বাম দিক থেকে যন্ত্রপাতি টেনে আনুন
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
