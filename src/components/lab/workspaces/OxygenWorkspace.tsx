/**
 * OxygenWorkspace.tsx — Hyper-realistic 2D SVG Laboratory Workspace
 * Experiment: Preparation of Oxygen (2 H₂O₂ → 2 H₂O + O₂ via MnO₂)
 * 
 * Splint Architecture:
 * - 100% SVG-native wooden splint (No HTML overlay, zero layout drift/overflow)
 * - Rests realistically on porcelain watch glass on the bench when ready
 * - Supports direct pointer/touch drag OR automated smooth test animation
 * - Bursting multi-zone flame erupts directly from the tip of the splint at the tube mouth!
 * - Scales perfectly on any screen size from mobile (280px) to 4K desktop
 */
import { useRef, useState, useMemo } from "react";
import type { OxygenPlaced } from "../types";

interface Props {
  placed: OxygenPlaced;
  collectedMl: number;
  tubeCapacityMl: number;
  reacting: boolean;
  splintResult: "pass" | "early" | "none";
  onSplintDrop: (hit: boolean) => void;
  disabled?: boolean;
  isTestingSplint?: boolean;
}

export default function OxygenWorkspace({
  placed,
  collectedMl,
  tubeCapacityMl,
  reacting,
  splintResult,
  onSplintDrop,
  disabled,
  isTestingSplint = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragPt, setDragPt] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Inverted collection tube geometry (viewBox: 640 x 520)
  const COLLECTION_X = 490;
  const TUBE_TOP_Y = 110; // closed dome top of inverted jar
  const TUBE_BOTTOM_Y = 360; // mouth submerged in water trough
  const TUBE_INNER_HEIGHT = TUBE_BOTTOM_Y - TUBE_TOP_Y; // 250px
  const fillFrac = Math.min(1, Math.max(0, collectedMl / tubeCapacityMl));
  
  // Gas accumulates at the dome top, pushing water downwards
  const gasHeight = TUBE_INNER_HEIGHT * fillFrac;
  const waterTopY = TUBE_TOP_Y + gasHeight;

  // ViewBox coordinate conversion for touch/mouse
  function screenToViewBox(clientX: number, clientY: number) {
    const el = wrapRef.current;
    if (!el) return { x: 340, y: 440 };
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 640;
    const y = ((clientY - r.top) / r.height) * 520;
    return { x, y };
  }

  function handleSplintPointerDown(e: React.PointerEvent) {
    if (disabled) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    setDragPt(screenToViewBox(e.clientX, e.clientY));
  }

  function handleSplintPointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    setDragPt(screenToViewBox(e.clientX, e.clientY));
  }

  function handleSplintPointerUp(e: React.PointerEvent) {
    if (!isDragging) return;
    setIsDragging(false);
    const pt = dragPt ?? screenToViewBox(e.clientX, e.clientY);
    // Hit-zone: near mouth or inside collection tube
    const hit =
      pt.x > COLLECTION_X - 60 &&
      pt.x < COLLECTION_X + 60 &&
      pt.y > TUBE_TOP_Y - 20 &&
      pt.y < TUBE_BOTTOM_Y + 45;

    setDragPt(null);
    onSplintDrop(hit);
  }

  // Pre-calculated bubbles for stable rendering
  const flaskBubbles = useMemo(
    () => [
      { id: 1, cx: 125, dur: 1.1, r: 2.2, delay: 0.1 },
      { id: 2, cx: 140, dur: 0.9, r: 3.0, delay: 0.3 },
      { id: 3, cx: 155, dur: 1.3, r: 2.0, delay: 0.5 },
      { id: 4, cx: 170, dur: 1.0, r: 2.8, delay: 0.2 },
      { id: 5, cx: 185, dur: 1.2, r: 2.4, delay: 0.4 },
      { id: 6, cx: 132, dur: 0.95, r: 1.8, delay: 0.6 },
      { id: 7, cx: 162, dur: 1.15, r: 2.5, delay: 0.15 },
      { id: 8, cx: 178, dur: 1.05, r: 2.2, delay: 0.45 },
    ],
    [],
  );

  // Splint Position Calculation (SVG Coordinates)
  // Default resting position: resting on a porcelain dish between flask and trough
  const restingPos = { x: 300, y: 440, angle: -18 };
  // Testing position at the mouth of the inverted jar
  const testingPos = { x: COLLECTION_X, y: TUBE_BOTTOM_Y - 15, angle: -50 };

  const activePos = useMemo(() => {
    if (dragPt) {
      return { x: dragPt.x, y: dragPt.y, angle: -45 };
    }
    if (isTestingSplint || splintResult === "pass") {
      return testingPos;
    }
    return restingPos;
  }, [dragPt, isTestingSplint, splintResult]);

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full select-none overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 shadow-inner"
    >
      <svg
        viewBox="0 0 640 520"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Lab Bench Gradient */}
          <linearGradient id="bench-surface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="15%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="bench-bevel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#475569" stopOpacity="0.8" />
          </linearGradient>

          {/* Realistic Glass Specular & Transparency */}
          <linearGradient id="glass-specular" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="15%" stopColor="#bae6fd" stopOpacity="0.15" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="glass-tube-gloss" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.7" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.8" />
          </linearGradient>

          {/* Stainless Steel / Cast Metal */}
          <linearGradient id="stand-metal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="35%" stopColor="#94a3b8" />
            <stop offset="65%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="stand-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Water in Trough & Jar */}
          <linearGradient id="water-azure" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
          </linearGradient>

          <linearGradient id="water-jar-column" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.8" />
          </linearGradient>

          {/* Oxygen Gas Shimmer Glow */}
          <radialGradient id="o2-gas-glow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
          </radialGradient>

          {/* Realistic Wooden Splint Gradient */}
          <linearGradient id="wood-splint" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="45%" stopColor="#d97706" />
            <stop offset="85%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Splint Glowing Ember Radial Glow */}
          <radialGradient id="splint-ember" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="65%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </radialGradient>

          {/* Flame Gradients */}
          <radialGradient id="flame-core" cx="50%" cy="65%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </radialGradient>

          {/* Delivery Tube 3D Path */}
          <path
            id="delivery-path"
            d="M 188 178 C 220 120, 350 90, 485 160 C 498 175, 498 335, 490 355"
            fill="none"
          />

          {/* Filter for glowing flame & ambient smoke */}
          <filter id="flame-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ember-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="drop-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* ═══════════════════════════════════════════════════════════
            1. LABORATORY BACKGROUND & WORKBENCH
        ═══════════════════════════════════════════════════════════ */}
        {/* Subtle Wall Grid Tiles */}
        <g opacity="0.08">
          {[60, 120, 180, 240, 300, 360, 420].map((y) => (
            <line key={`grid-h-${y}`} x1="0" y1={y} x2="640" y2={y} stroke="#cbd5e1" strokeWidth="1" />
          ))}
          {[80, 160, 240, 320, 400, 480, 560].map((x) => (
            <line key={`grid-v-${x}`} x1={x} y1="0" x2={x} y2="440" stroke="#cbd5e1" strokeWidth="1" />
          ))}
        </g>

        {/* Lab Countertop Surface */}
        <g filter="url(#drop-soft)">
          <polygon points="0,435 640,435 640,520 0,520" fill="url(#bench-surface)" />
          <rect x="0" y="435" width="640" height="3.5" fill="url(#bench-bevel)" />
          <rect x="0" y="438.5" width="640" height="6" fill="#020617" opacity="0.6" />
        </g>

        {/* ═══════════════════════════════════════════════════════════
            2. RETORT STAND & CLAMP
        ═══════════════════════════════════════════════════════════ */}
        {placed.reaction_tube && (
          <g className="transition-opacity duration-300">
            <ellipse cx="105" cy="450" rx="60" ry="10" fill="#020617" opacity="0.7" />
            <rect x="50" y="436" width="110" height="15" rx="3" fill="url(#stand-base)" stroke="#334155" strokeWidth="1" />
            <rect x="52" y="437" width="106" height="2" fill="#94a3b8" opacity="0.5" />

            <rect x="98" y="100" width="12" height="340" rx="3" fill="url(#stand-metal)" stroke="#1e293b" strokeWidth="1" />

            {/* Bosshead & Clamp Arm */}
            <rect x="92" y="212" width="24" height="22" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <circle cx="104" cy="223" r="5" fill="#334155" />
            <rect x="85" y="220" width="8" height="6" rx="1.5" fill="#94a3b8" />

            <rect x="114" y="218" width="46" height="9" rx="2" fill="url(#stand-metal)" />
            <path
              d="M 148 206 C 160 206, 172 210, 172 222 C 172 234, 160 238, 148 238"
              fill="none"
              stroke="#0f172a"
              strokeWidth="5"
            />
            <path
              d="M 148 206 C 160 206, 172 210, 172 222 C 172 234, 160 238, 148 238"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2.5"
            />
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════
            3. ERLENMEYER FLASK & REACTION (H₂O₂ + MnO₂)
        ═══════════════════════════════════════════════════════════ */}
        {placed.reaction_tube && (
          <g className="transition-all duration-300">
            <ellipse cx="160" cy="442" rx="48" ry="8" fill="#020617" opacity="0.65" />

            {/* Flask Glass Body */}
            <g>
              <path
                d="M 147 175 
                   L 173 175 
                   L 173 240 
                   L 214 416 
                   Q 218 434 200 434 
                   L 120 434 
                   Q 102 434 106 416 
                   L 147 240 
                   Z"
                fill="url(#glass-specular)"
                stroke="#64748b"
                strokeWidth="1.8"
              />

              {/* Volumetric Marks */}
              <g stroke="#ffffff" strokeWidth="1" opacity="0.6">
                <line x1="130" y1="390" x2="148" y2="390" />
                <text x="152" y="393" fill="#cbd5e1" fontSize="8" fontFamily="ui-monospace">50mL</text>
                <line x1="136" y1="355" x2="152" y2="355" />
                <text x="156" y="358" fill="#cbd5e1" fontSize="8" fontFamily="ui-monospace">100mL</text>
                <line x1="142" y1="320" x2="156" y2="320" />
                <text x="160" y="323" fill="#cbd5e1" fontSize="8" fontFamily="ui-monospace">150mL</text>
              </g>

              {/* MnO₂ Catalyst Powder Bed */}
              {placed.manganese_dioxide && (
                <g>
                  <path
                    d="M 112 422 
                       Q 160 415 208 422 
                       L 204 430 
                       Q 160 436 116 430 
                       Z"
                    fill="#0f172a"
                  />
                  {[
                    [120, 424], [130, 420], [142, 426], [155, 418],
                    [168, 424], [180, 419], [192, 427], [200, 423],
                    [135, 428], [150, 427], [165, 429], [175, 426]
                  ].map(([gx, gy], idx) => (
                    <circle key={`cat-${idx}`} cx={gx} cy={gy} r={idx % 2 === 0 ? 1.4 : 1.8} fill="#334155" />
                  ))}
                  <text x="160" y="446" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600">
                    MnO₂ (প্রভাবক)
                  </text>
                </g>
              )}

              {/* H₂O₂ Liquid Layer */}
              {placed.hydrogen_peroxide && (
                <g>
                  <path
                    d="M 132 340 
                       Q 160 344 188 340 
                       L 208 422 
                       Q 160 415 112 422 
                       Z"
                    fill="url(#water-azure)"
                    opacity="0.8"
                  />
                  <ellipse cx="160" cy="340" rx="28" ry="3" fill="#e0f2fe" opacity="0.65" />
                </g>
              )}

              {/* Bubbles in flask */}
              {reacting && placed.hydrogen_peroxide && placed.manganese_dioxide && (
                <g>
                  {flaskBubbles.map((b) => (
                    <circle key={b.id} cx={b.cx} cy={415} r={b.r} fill="#ffffff" opacity="0.95">
                      <animate
                        attributeName="cy"
                        values="418;360;340"
                        dur={`${b.dur}s`}
                        begin={`${b.delay}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="cx"
                        values={`${b.cx};${b.cx + (b.id % 2 === 0 ? 3 : -3)};${b.cx}`}
                        dur={`${b.dur}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0.95;0"
                        dur={`${b.dur}s`}
                        begin={`${b.delay}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  ))}
                  <text x="160" y="300" textAnchor="middle" fill="#a5f3fc" fontSize="11" fontWeight="700" opacity="0.8">
                    O₂ ↑
                  </text>
                </g>
              )}

              {/* Glare */}
              <path
                d="M 150 178 L 152 240 L 118 412 Q 112 426 122 430"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                opacity="0.5"
              />
            </g>

            {/* Stopper */}
            {placed.delivery_tube && (
              <g>
                <polygon
                  points="145,178 175,178 178,162 142,162"
                  fill="#c2410c"
                  stroke="#7c2d12"
                  strokeWidth="1.2"
                />
                <line x1="144" y1="165" x2="176" y2="165" stroke="#fdba74" strokeWidth="1.5" opacity="0.6" />
              </g>
            )}
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════
            4. DELIVERY TUBE
        ═══════════════════════════════════════════════════════════ */}
        {placed.delivery_tube && placed.reaction_tube && (
          <g>
            <use href="#delivery-path" stroke="#475569" strokeWidth="8" fill="none" opacity="0.8" />
            <use href="#delivery-path" stroke="url(#glass-tube-gloss)" strokeWidth="5.5" fill="none" />
            <use href="#delivery-path" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.75" />

            {reacting && (
              <>
                {[0, 1, 2, 3].map((idx) => (
                  <circle key={`dt-bubble-${idx}`} r="2.8" fill="#e0f2fe" opacity="0.95">
                    <animateMotion
                      dur="1.8s"
                      repeatCount="indefinite"
                      begin={`${idx * 0.45}s`}
                    >
                      <mpath href="#delivery-path" />
                    </animateMotion>
                  </circle>
                ))}
              </>
            )}
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════
            5. PNEUMATIC WATER TROUGH & BEEHIVE SHELF
        ═══════════════════════════════════════════════════════════ */}
        {placed.water_trough && (
          <g className="transition-all duration-300">
            <ellipse cx="490" cy="442" rx="100" ry="12" fill="#020617" opacity="0.65" />

            {/* Beehive Shelf */}
            <g opacity="0.85">
              <path
                d="M 450 395 L 530 395 L 535 435 L 445 435 Z"
                fill="#334155"
                stroke="#1e293b"
                strokeWidth="1.5"
              />
              <ellipse cx="490" cy="396" rx="12" ry="3" fill="#0f172a" />
              <rect x="460" y="410" width="10" height="15" fill="#0f172a" />
            </g>

            {/* Glass Trough Basin */}
            <path
              d="M 390 355 
                 L 590 355 
                 Q 595 435 570 435 
                 L 410 435 
                 Q 385 435 390 355 
                 Z"
              fill="url(#glass-specular)"
              stroke="#64748b"
              strokeWidth="2"
            />

            <path
              d="M 393 365 
                 L 587 365 
                 Q 591 432 568 432 
                 L 412 432 
                 Q 389 432 393 365 
                 Z"
              fill="url(#water-azure)"
              opacity="0.85"
            />
            <ellipse cx="490" cy="365" rx="96" ry="4" fill="#bae6fd" opacity="0.5" />
            <text x="545" y="420" fill="#bae6fd" fontSize="9" fontWeight="600" opacity="0.75">
              পানি (Water)
            </text>
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════
            6. INVERTED COLLECTION TUBE
        ═══════════════════════════════════════════════════════════ */}
        {placed.collection_tube && placed.water_trough && (
          <g className="transition-all duration-300">
            {fillFrac > 0.05 && (
              <rect
                x={COLLECTION_X - 25}
                y={TUBE_TOP_Y}
                width="50"
                height={gasHeight}
                fill="url(#o2-gas-glow)"
              />
            )}

            <rect
              x={COLLECTION_X - 24}
              y={waterTopY}
              width="48"
              height={Math.max(0, TUBE_BOTTOM_Y - waterTopY)}
              fill="url(#water-jar-column)"
              className="transition-all duration-300 ease-out"
            />

            <ellipse
              cx={COLLECTION_X}
              cy={waterTopY}
              rx="24"
              ry="3"
              fill="#e0f2fe"
              opacity="0.85"
              className="transition-all duration-300 ease-out"
            />

            {/* Rising Bubbles */}
            {reacting && fillFrac < 0.99 && (
              <g>
                {[
                  { id: 1, cx: COLLECTION_X - 6, dur: 0.8, delay: 0 },
                  { id: 2, cx: COLLECTION_X + 8, dur: 0.7, delay: 0.25 },
                  { id: 3, cx: COLLECTION_X - 1, dur: 0.85, delay: 0.5 },
                ].map((bub) => (
                  <circle key={`tube-bub-${bub.id}`} cx={bub.cx} cy={TUBE_BOTTOM_Y - 5} r="3" fill="#ffffff">
                    <animate
                      attributeName="cy"
                      values={`${TUBE_BOTTOM_Y - 5};${Math.max(TUBE_TOP_Y + 15, waterTopY)}`}
                      dur={`${bub.dur}s`}
                      begin={`${bub.delay}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.95;0"
                      dur={`${bub.dur}s`}
                      begin={`${bub.delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </g>
            )}

            <path
              d={`M ${COLLECTION_X - 26} ${TUBE_BOTTOM_Y} 
                  L ${COLLECTION_X - 26} ${TUBE_TOP_Y + 26} 
                  Q ${COLLECTION_X - 26} ${TUBE_TOP_Y} ${COLLECTION_X} ${TUBE_TOP_Y} 
                  Q ${COLLECTION_X + 26} ${TUBE_TOP_Y} ${COLLECTION_X + 26} ${TUBE_TOP_Y + 26} 
                  L ${COLLECTION_X + 26} ${TUBE_BOTTOM_Y}`}
              fill="url(#glass-specular)"
              stroke="#64748b"
              strokeWidth="2"
            />

            <line
              x1={COLLECTION_X - 21}
              y1={TUBE_TOP_Y + 20}
              x2={COLLECTION_X - 21}
              y2={TUBE_BOTTOM_Y - 20}
              stroke="#ffffff"
              strokeWidth="2"
              opacity="0.6"
            />

            {/* Graduations */}
            <g stroke="#ffffff" strokeWidth="0.8" opacity="0.65">
              {[0, 25, 50, 75, 100].map((ml) => {
                const yPos = TUBE_TOP_Y + 15 + (ml / 100) * (TUBE_INNER_HEIGHT - 35);
                return (
                  <g key={`grad-${ml}`}>
                    <line x1={COLLECTION_X + 16} y1={yPos} x2={COLLECTION_X + 24} y2={yPos} />
                    <text
                      x={COLLECTION_X + 28}
                      y={yPos + 3}
                      fill="#cbd5e1"
                      fontSize="7.5"
                      fontFamily="ui-monospace, monospace"
                    >
                      {ml}
                    </text>
                  </g>
                );
              })}
            </g>

            {fillFrac > 0.08 && (
              <g className="transition-opacity duration-300">
                <text
                  x={COLLECTION_X}
                  y={TUBE_TOP_Y + 35}
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="12"
                  fontWeight="800"
                  fontFamily="ui-monospace, monospace"
                >
                  O₂ গ্যাস
                </text>
                <text
                  x={COLLECTION_X}
                  y={TUBE_TOP_Y + 50}
                  textAnchor="middle"
                  fill="#bae6fd"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  {collectedMl.toFixed(0)} mL ({(fillFrac * 100).toFixed(0)}%)
                </text>
              </g>
            )}
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════
            7. 100% SVG NATIVE WOODEN GLOWING SPLINT & FLAME IGNITION
        ═══════════════════════════════════════════════════════════ */}
        {placed.collection_tube && (
          <g
            className={`transition-transform duration-300 cursor-grab active:cursor-grabbing ${
              isDragging ? "cursor-grabbing" : ""
            }`}
            style={{
              transform: `translate(${activePos.x}px, ${activePos.y}px) rotate(${activePos.angle}deg)`,
              transformOrigin: "0px 0px",
            }}
            onPointerDown={handleSplintPointerDown}
            onPointerMove={handleSplintPointerMove}
            onPointerUp={handleSplintPointerUp}
          >
            {/* Ambient drop shadow under splint stick */}
            <rect
              x="-4"
              y="2"
              width="90"
              height="7"
              rx="2.5"
              fill="#020617"
              opacity="0.5"
            />

            {/* Wooden Stick Body */}
            <rect
              x="0"
              y="0"
              width="85"
              height="6.5"
              rx="2"
              fill="url(#wood-splint)"
              stroke="#78350f"
              strokeWidth="0.8"
            />

            {/* Charred wood near ember tip */}
            <rect
              x="0"
              y="0"
              width="14"
              height="6.5"
              rx="1.5"
              fill="#18181b"
            />

            {/* Glowing Red/Orange Ember Tip */}
            <circle
              cx="0"
              cy="3.25"
              r="4.2"
              fill="url(#splint-ember)"
              filter="url(#ember-glow)"
            >
              <animate attributeName="r" values="3.8;4.8;3.8" dur="0.8s" repeatCount="indefinite" />
            </circle>

            {/* Ember hot center spark */}
            <circle cx="0" cy="3.25" r="1.8" fill="#ffffff" opacity="0.9" />

            {/* Faint wisps of smoldering smoke when NOT fully ignited */}
            {splintResult !== "pass" && (
              <g opacity="0.5">
                <circle cx="-3" cy="1" r="2" fill="#94a3b8">
                  <animate attributeName="cy" values="1;-10;-20" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="cx" values="-3;-5;-8" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.3;0" dur="1.2s" repeatCount="indefinite" />
                </circle>
              </g>
            )}

            {/* ── Brilliant Bursting Flame when oxygen is confirmed! ── */}
            {splintResult === "pass" && (
              <g transform="translate(0, 3.25) rotate(45)" filter="url(#flame-glow)">
                {/* Corona Glow */}
                <circle cx="0" cy="-18" r="38" fill="#f97316" opacity="0.3">
                  <animate attributeName="r" values="34;42;34" dur="0.25s" repeatCount="indefinite" />
                </circle>

                {/* Flame Body */}
                <path
                  d="M -14 0 
                     Q -22 -25 0 -62 
                     Q 22 -25 14 0 
                     Z"
                  fill="url(#flame-core)"
                >
                  <animate
                    attributeName="d"
                    values="
                      M -14 0 Q -22 -25 0 -62 Q 22 -25 14 0 Z;
                      M -13 0 Q -18 -30 2 -68 Q 24 -22 13 0 Z;
                      M -14 0 Q -22 -25 0 -62 Q 22 -25 14 0 Z
                    "
                    dur="0.22s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* White-hot Inner Core */}
                <ellipse cx="0" cy="-15" rx="8" ry="22" fill="#ffffff" opacity="0.95">
                  <animate attributeName="ry" values="20;25;20" dur="0.25s" repeatCount="indefinite" />
                </ellipse>

                {/* Sparks */}
                {[
                  { id: 1, cx: -8, cy: -50, dur: "0.35s" },
                  { id: 2, cx: 8, cy: -62, dur: "0.45s" },
                  { id: 3, cx: -12, cy: -35, dur: "0.3s" },
                ].map((sp) => (
                  <circle key={sp.id} cx={sp.cx} cy={sp.cy} r="1.5" fill="#fef08a">
                    <animate attributeName="opacity" values="1;0;1" dur={sp.dur} repeatCount="indefinite" />
                  </circle>
                ))}
              </g>
            )}

            {/* Resting Porcelain Tile Base when on bench */}
            {!isDragging && !isTestingSplint && splintResult !== "pass" && (
              <g transform="translate(25, 12)">
                <rect x="-35" y="-5" width="70" height="6" rx="2" fill="#475569" opacity="0.5" />
                <rect x="-33" y="-7" width="66" height="4" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                <text x="0" y="14" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="700">
                  আধা-জ্বলা কাঠি
                </text>
              </g>
            )}
          </g>
        )}

        {/* Success Banner when confirmed */}
        {splintResult === "pass" && (
          <g transform={`translate(${COLLECTION_X} 75)`}>
            <rect x="-95" y="-14" width="190" height="28" rx="14" fill="#0f172a" stroke="#22c55e" strokeWidth="2" filter="url(#drop-soft)" />
            <text x="0" y="4" textAnchor="middle" fill="#4ade80" fontSize="11.5" fontWeight="800">
              ✨ অক্সিজেন নিশ্চিত! (O₂ Confirmed)
            </text>
          </g>
        )}

        {/* Empty State Helpful Hint */}
        {!placed.reaction_tube && (
          <g>
            <rect x="180" y="200" width="280" height="70" rx="12" fill="#0f172a" opacity="0.85" stroke="#334155" strokeWidth="1.5" />
            <text x="320" y="228" textAnchor="middle" fontSize="13" fontWeight="700" fill="#f8fafc">
              ল্যাব শুরু করতে যন্ত্রপাতি যুক্ত করুন
            </text>
            <text x="320" y="250" textAnchor="middle" fontSize="11" fill="#94a3b8">
              নিচ/বাম প্যানেল থেকে "রেটর্ট স্ট্যান্ড" নির্বাচন করুন
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
