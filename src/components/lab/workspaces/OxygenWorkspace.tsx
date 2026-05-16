/**
 * 2D SVG workspace for the Oxygen Preparation experiment.
 *   H2O2 → H2O + O2 (catalyzed by MnO2), collected by downward displacement of water.
 *
 * The glowing splint is a draggable HTML overlay so we can use pointer events
 * cleanly across mobile and desktop.
 */
import { useRef, useState } from "react";
import type { OxygenPlaced } from "../types";
import { Flame } from "lucide-react";

interface Props {
  placed: OxygenPlaced;
  collectedMl: number;
  tubeCapacityMl: number;
  reacting: boolean;
  /** Drop result: pass = ignited, early = dimmed, none = not tested. */
  splintResult: "pass" | "early" | "none";
  onSplintDrop: (hit: boolean) => void;
  disabled?: boolean;
}

export default function OxygenWorkspace({
  placed,
  collectedMl,
  tubeCapacityMl,
  reacting,
  splintResult,
  onSplintDrop,
  disabled,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  // Inverted tube geometry — must match the SVG below.
  // Tube extends from y=140 (closed top) to y=345 (open mouth) in viewBox coords.
  const COLLECTION_X = 470;
  const TUBE_TOP_Y = 140;
  const TUBE_BOTTOM_Y = 345; // mouth (submerged)
  const TUBE_INNER_HEIGHT = TUBE_BOTTOM_Y - TUBE_TOP_Y; // 205
  const fillFrac = Math.min(1, collectedMl / tubeCapacityMl);
  // Gas fills from the top; water remains at the bottom.
  const gasHeight = TUBE_INNER_HEIGHT * fillFrac;
  const waterTopY = TUBE_TOP_Y + gasHeight;

  // For splint hit-test we need viewBox→screen mapping.
  function screenToViewBox(clientX: number, clientY: number) {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 600;
    const y = ((clientY - r.top) / r.height) * 560;
    return { x, y };
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ x: e.clientX, y: e.clientY });
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!drag) return;
    setDrag({ x: e.clientX, y: e.clientY });
  }
  function handlePointerUp(e: React.PointerEvent) {
    if (!drag) return;
    const pt = screenToViewBox(e.clientX, e.clientY);
    // Hit area: near the mouth of the inverted tube.
    const hit =
      pt.x > COLLECTION_X - 30 &&
      pt.x < COLLECTION_X + 30 &&
      pt.y > TUBE_TOP_Y - 10 &&
      pt.y < TUBE_BOTTOM_Y;
    setDrag(null);
    onSplintDrop(hit);
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-emerald-50"
    >
      {/* Bench */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-amber-100/70 to-amber-200/80 border-t border-amber-300/60" />

      <svg
        viewBox="0 0 600 560"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="ox-glass" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="ox-metal" x1="0" x2="1">
            <stop offset="0" stopColor="#6b7280" />
            <stop offset="0.5" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="ox-water" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#bae6fd" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
          <radialGradient id="ox-flame" cx="50%" cy="60%" r="60%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="60%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.2" />
          </radialGradient>
          <path
            id="ox-delivery-path"
            d="M 170 160 C 200 110, 330 100, 470 145"
            fill="none"
          />
        </defs>

        {/* === Retort stand === */}
        {placed.reaction_tube && (
          <g>
            <rect x="60" y="475" width="160" height="16" rx="3" fill="url(#ox-metal)" />
            <ellipse cx="140" cy="491" rx="80" ry="5" fill="#0f172a" opacity="0.18" />
            <rect x="135" y="120" width="10" height="360" rx="3" fill="url(#ox-metal)" />
            {/* Clamp arm */}
            <rect x="100" y="200" width="80" height="8" rx="2" fill="url(#ox-metal)" />
            <circle cx="100" cy="204" r="8" fill="#1f2937" />
          </g>
        )}

        {/* === Reaction flask (Erlenmeyer) === */}
        {placed.reaction_tube && (
          <g transform="translate(80 220)">
            {/* Stopper (orange) when delivery tube is connected */}
            {placed.delivery_tube && (
              <rect x="48" y="-22" width="34" height="14" rx="2" fill="#ea580c" />
            )}
            <path
              d="M52 -8 L78 -8 L78 25 L130 130 L130 150 Q130 160 120 160 L10 160 Q0 160 0 150 L0 130 L52 25 Z"
              fill="url(#ox-glass)"
              stroke="#64748b"
              strokeWidth="1.8"
            />
            {/* MnO2 powder at bottom */}
            {placed.manganese_dioxide && (
              <g>
                <path
                  d="M14 140 L116 140 L130 150 Q130 160 120 160 L10 160 Q0 160 0 150 Z"
                  fill="#1f2937"
                />
                {/* speckles */}
                {[
                  [20, 145],
                  [40, 152],
                  [60, 148],
                  [80, 154],
                  [100, 149],
                  [50, 156],
                  [90, 145],
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="1.2" fill="#9ca3af" />
                ))}
              </g>
            )}
            {/* H2O2 liquid sitting above catalyst */}
            {placed.hydrogen_peroxide && (
              <path
                d="M30 80 L100 80 L130 150 Q130 160 120 160 L10 160 Q0 160 0 150 Z"
                fill="#dbeafe"
                opacity="0.65"
              />
            )}
            {/* Bubbles inside reaction flask */}
            {reacting &&
              [0, 1, 2, 3, 4].map((i) => (
                <circle
                  key={i}
                  cx={30 + i * 18}
                  cy={150}
                  r={2 + (i % 2)}
                  fill="#ffffff"
                  opacity="0.9"
                >
                  <animate
                    attributeName="cy"
                    values="150;90;80"
                    dur={`${1.2 + i * 0.2}s`}
                    begin={`${i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.9;0"
                    dur={`${1.2 + i * 0.2}s`}
                    begin={`${i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
          </g>
        )}

        {/* === Delivery tube === */}
        {placed.delivery_tube && placed.reaction_tube && (
          <g>
            <use href="#ox-delivery-path" stroke="#94a3b8" strokeWidth="6" fill="none" />
            <use href="#ox-delivery-path" stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.6" />
            {/* Bubbles travelling along the path when reacting */}
            {reacting &&
              [0, 1, 2].map((i) => (
                <circle key={i} r="3" fill="#ffffff" opacity="0.85">
                  <animateMotion
                    dur={`${2 + i * 0.3}s`}
                    repeatCount="indefinite"
                    begin={`${i * 0.6}s`}
                  >
                    <mpath href="#ox-delivery-path" />
                  </animateMotion>
                </circle>
              ))}
          </g>
        )}

        {/* === Water trough === */}
        {placed.water_trough && (
          <g>
            {/* trough body */}
            <path
              d="M340 360 L600 360 L590 440 L350 440 Z"
              fill="url(#ox-glass)"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* water */}
            <path
              d="M348 372 L592 372 L585 432 L355 432 Z"
              fill="url(#ox-water)"
              opacity="0.85"
            />
          </g>
        )}

        {/* === Inverted collection tube === */}
        {placed.collection_tube && placed.water_trough && (
          <g>
            {/* outer glass tube (rounded top, open bottom in trough) */}
            <path
              d={`M${COLLECTION_X - 22} ${TUBE_BOTTOM_Y} L${COLLECTION_X - 22} ${TUBE_TOP_Y + 22} Q${COLLECTION_X - 22} ${TUBE_TOP_Y} ${COLLECTION_X} ${TUBE_TOP_Y} Q${COLLECTION_X + 22} ${TUBE_TOP_Y} ${COLLECTION_X + 22} ${TUBE_TOP_Y + 22} L${COLLECTION_X + 22} ${TUBE_BOTTOM_Y}`}
              fill="url(#ox-glass)"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* water inside the tube (drops as gas accumulates) */}
            <rect
              x={COLLECTION_X - 20}
              y={waterTopY}
              width={40}
              height={TUBE_BOTTOM_Y - waterTopY}
              fill="url(#ox-water)"
              opacity="0.85"
              style={{ transition: "y 0.4s, height 0.4s" }}
            />
            {/* Rising bubbles inside the tube */}
            {reacting &&
              [0, 1].map((i) => (
                <circle
                  key={i}
                  cx={COLLECTION_X + (i === 0 ? -5 : 6)}
                  cy={waterTopY}
                  r={2.2}
                  fill="#ffffff"
                  opacity="0.9"
                >
                  <animate
                    attributeName="cy"
                    values={`${TUBE_BOTTOM_Y - 8};${waterTopY + 4}`}
                    dur={`${1 + i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.9;0"
                    dur={`${1 + i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            {/* Label */}
            <text
              x={COLLECTION_X + 32}
              y={TUBE_TOP_Y + 30}
              fontSize="10"
              fill="#475569"
              fontFamily="ui-monospace,monospace"
            >
              O₂
            </text>
          </g>
        )}

        {/* Splint ignition flame (when result === pass) */}
        {splintResult === "pass" && (
          <g transform={`translate(${COLLECTION_X} ${TUBE_TOP_Y + 30})`}>
            <ellipse cx="0" cy="0" rx="22" ry="34" fill="url(#ox-flame)">
              <animate attributeName="rx" values="20;26;20" dur="0.4s" repeatCount="indefinite" />
              <animate attributeName="ry" values="30;38;30" dur="0.4s" repeatCount="indefinite" />
            </ellipse>
            <text x="0" y="-50" textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">
              O₂ confirmed ✓
            </text>
          </g>
        )}

        {/* Empty hint */}
        {!placed.reaction_tube && !placed.water_trough && (
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

      {/* Draggable glowing splint (HTML overlay) */}
      {placed.collection_tube && splintResult !== "pass" && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: "absolute",
            left: drag ? drag.x - (wrapRef.current?.getBoundingClientRect().left ?? 0) - 20 : "70%",
            top: drag ? drag.y - (wrapRef.current?.getBoundingClientRect().top ?? 0) - 20 : "80%",
            touchAction: "none",
            userSelect: "none",
          }}
          className={`pointer-events-auto cursor-grab active:cursor-grabbing rounded-lg border-2 bg-white/90 px-2 py-1.5 shadow-lg backdrop-blur ${
            drag ? "border-orange-500 scale-110" : "border-amber-400"
          } transition-transform`}
          title="Drag to tube mouth · টিউবের মুখে টেনে আনুন"
        >
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>Splint · কাঠি</span>
          </div>
        </div>
      )}
    </div>
  );
}
