/**
 * 2D SVG workspace for the laboratory preparation of carbon dioxide gas.
 *   CaCO3 + 2 HCl → CaCl2 + H2O + CO2
 * Apparatus:
 *  - Round-bottom flask on a stand clamp containing CaCO3 chips.
 *  - Two-hole cork sealing the flask.
 *  - Thistle funnel through one hole — bottom tip MUST submerge in liquid.
 *  - Bent (twice-bent at right angles) delivery glass tube through the other
 *    hole, leading to an upright Gas Jar (upward displacement of air, since
 *    CO2 is denser than air).
 */
import type { CO2Placed } from "../types";

export type IdTool = "splint" | "mg" | "litmus" | null;

interface Props {
  placed: CO2Placed;
  collectedMl: number;
  jarCapacityMl: number;
  reacting: boolean;
  funnelSubmerged: boolean;
  jarUpright: boolean;
  limewaterActive?: boolean;
  limewaterPhase?: "clear" | "milky" | "redissolved";
  /** Currently armed identification tool (follows cursor). */
  activeIdTool?: IdTool;
  /** Cursor position in CSS pixels relative to the workspace container. */
  cursor?: { x: number; y: number } | null;
  /** Persistent outcomes after a successful test on the jar mouth. */
  splintExtinguished?: boolean;
  mgReacted?: boolean;
  litmusReacted?: boolean;
}

export default function CO2Workspace({
  placed,
  collectedMl,
  jarCapacityMl,
  reacting,
  funnelSubmerged,
  jarUpright,
  limewaterActive = false,
  limewaterPhase = "clear",
  activeIdTool = null,
  cursor = null,
  splintExtinguished = false,
  mgReacted = false,
  litmusReacted = false,
}: Props) {
  const fillFrac = Math.max(0, Math.min(1, collectedMl / jarCapacityMl));
  // Gas jar geometry (upright mode): mouth at top, base at bottom.
  const JAR_X = 470;
  const JAR_TOP_Y = 200;
  const JAR_BOTTOM_Y = 410;
  const JAR_W = 90;
  const JAR_INNER_H = JAR_BOTTOM_Y - JAR_TOP_Y; // 210
  // In upward displacement of air, CO2 settles at the BOTTOM and pushes air
  // out the top → the visible "gas band" grows upward from the bottom.
  const gasBandH = JAR_INNER_H * fillFrac;

  const liquidLevelY = placed.acid_poured ? 332 : placed.calcium_carbonate ? 360 : 360;
  // funnel tip y ≈ 340. Submerged when liquidLevelY <= 340.

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox="0 0 640 500"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="co2-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="co2-glass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
          </linearGradient>
          <linearGradient id="co2-acid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(186,230,253,0.85)" />
            <stop offset="100%" stopColor="rgba(125,211,252,0.95)" />
          </linearGradient>
          <radialGradient id="co2-gas" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="rgba(203,213,225,0.55)" />
            <stop offset="100%" stopColor="rgba(148,163,184,0.85)" />
          </radialGradient>
          <linearGradient id="co2-lime-milky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(226,232,240,0.95)" />
          </linearGradient>
          <path id="co2-delivery-path" d="M 252,250 L 252,180 L 470,180 L 470,210" />
        </defs>

        {/* Background */}
        <rect width="640" height="500" fill="url(#co2-bg)" />
        <rect x="0" y="430" width="640" height="70" fill="#cbd5e1" />
        <line x1="0" y1="430" x2="640" y2="430" stroke="#94a3b8" strokeWidth="2" />

        {/* ─── Retort stand (left) ─── */}
        <rect x="80" y="425" width="120" height="10" rx="2" fill="#475569" />
        <rect x="130" y="120" width="10" height="310" fill="#64748b" />
        {/* Clamp ring */}
        {placed.round_bottom_flask && (
          <g>
            <line x1="140" y1="320" x2="210" y2="320" stroke="#334155" strokeWidth="4" />
            <circle cx="252" cy="320" r="38" fill="none" stroke="#334155" strokeWidth="4" />
          </g>
        )}

        {/* ─── Round-bottom flask (centered around x=252) ─── */}
        {placed.round_bottom_flask && (
          <g>
            {/* Neck */}
            <rect x="240" y="240" width="24" height="50" fill="url(#co2-glass)" stroke="#475569" strokeWidth="1.5" />
            {/* Round body */}
            <circle cx="252" cy="340" r="55" fill="url(#co2-glass)" stroke="#475569" strokeWidth="1.5" />

            {/* Liquid (if acid present) */}
            {placed.acid_poured && (
              <>
                <clipPath id="co2-flask-clip">
                  <circle cx="252" cy="340" r="53" />
                </clipPath>
                <rect
                  x="195"
                  y={liquidLevelY}
                  width="115"
                  height={340 + 55 - liquidLevelY}
                  fill="url(#co2-acid)"
                  clipPath="url(#co2-flask-clip)"
                />
                {/* Surface line */}
                <line
                  x1="200"
                  y1={liquidLevelY}
                  x2="305"
                  y2={liquidLevelY}
                  stroke="#0ea5e9"
                  strokeWidth="1"
                  opacity="0.7"
                />
              </>
            )}

            {/* CaCO3 chips */}
            {placed.calcium_carbonate && (
              <g fill="#e5e7eb" stroke="#94a3b8" strokeWidth="0.5">
                <ellipse cx="232" cy="378" rx="10" ry="6" />
                <ellipse cx="252" cy="383" rx="12" ry="7" />
                <ellipse cx="275" cy="378" rx="9" ry="6" />
                <ellipse cx="245" cy="370" rx="7" ry="5" />
                <ellipse cx="265" cy="370" rx="7" ry="5" />
              </g>
            )}

            {/* Bubbles inside flask when reacting */}
            {reacting && (
              <g>
                {[0, 1, 2, 3, 4].map((i) => (
                  <circle
                    key={i}
                    cx={232 + i * 12}
                    cy={370}
                    r={2 + (i % 2)}
                    fill="rgba(255,255,255,0.85)"
                    stroke="rgba(148,163,184,0.6)"
                    strokeWidth="0.4"
                  >
                    <animate
                      attributeName="cy"
                      from={385}
                      to={liquidLevelY - 5}
                      dur={`${1.2 + i * 0.15}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.25}s`}
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.95;0"
                      dur={`${1.2 + i * 0.15}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.25}s`}
                    />
                  </circle>
                ))}
              </g>
            )}
          </g>
        )}

        {/* ─── Cork (two holes) ─── */}
        {placed.cork && placed.round_bottom_flask && (
          <g>
            <rect x="234" y="232" width="36" height="14" rx="3" fill="#a16207" stroke="#713f12" strokeWidth="1" />
            {/* Hole markers */}
            <circle cx="244" cy="239" r="2" fill="#451a03" />
            <circle cx="260" cy="239" r="2" fill="#451a03" />
          </g>
        )}

        {/* ─── Thistle funnel ─── */}
        {placed.thistle_funnel && placed.round_bottom_flask && (
          <g>
            {/* Stem going down through cork into liquid */}
            <line x1="244" y1="100" x2="244" y2="340" stroke="#475569" strokeWidth="2.5" />
            <line x1="244" y1="100" x2="244" y2="340" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
            {/* Bulb (thistle shape) */}
            <path
              d="M 224,100 Q 244,60 264,100 Q 254,118 244,118 Q 234,118 224,100 Z"
              fill="url(#co2-glass)"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Indicator if not submerged */}
            {placed.acid_poured && !funnelSubmerged && (
              <g>
                <circle cx="244" cy="340" r="6" fill="none" stroke="#dc2626" strokeWidth="2">
                  <animate attributeName="r" values="6;10;6" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                </circle>
                <text x="244" y="90" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="600">
                  Funnel tip not submerged!
                </text>
              </g>
            )}

            {/* Liquid drop animation when acid is pouring */}
            {placed.acid_poured && reacting && (
              <g>
                {[0, 1].map((i) => (
                  <circle key={i} cx="244" r="3" fill="rgba(125,211,252,0.95)">
                    <animate
                      attributeName="cy"
                      from={120}
                      to={liquidLevelY - 4}
                      dur="0.9s"
                      repeatCount="indefinite"
                      begin={`${i * 0.45}s`}
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;0"
                      dur="0.9s"
                      repeatCount="indefinite"
                      begin={`${i * 0.45}s`}
                    />
                  </circle>
                ))}
              </g>
            )}
          </g>
        )}

        {/* ─── Twice-bent delivery tube ─── */}
        {placed.delivery_tube && placed.round_bottom_flask && (
          <g>
            <path
              d="M 260,246 L 260,180 L 470,180 L 470,210"
              fill="none"
              stroke="#475569"
              strokeWidth="3"
            />
            <path
              d="M 260,246 L 260,180 L 470,180 L 470,210"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.2"
            />
            {/* Travelling CO2 bubbles */}
            {reacting && placed.cork && placed.gas_jar && (
              <g>
                {[0, 1, 2].map((i) => (
                  <circle key={i} r="2.5" fill="rgba(148,163,184,0.85)">
                    <animateMotion
                      dur="1.6s"
                      repeatCount="indefinite"
                      begin={`${i * 0.55}s`}
                      path="M 260,246 L 260,180 L 470,180 L 470,210"
                    />
                  </circle>
                ))}
              </g>
            )}
          </g>
        )}

        {/* ─── Gas Jar (upright = correct, inverted = mistake) ─── */}
        {placed.gas_jar && (
          <g>
            {jarUpright ? (
              <g>
                {/* Jar walls */}
                <rect
                  x={JAR_X - JAR_W / 2}
                  y={JAR_TOP_Y}
                  width={JAR_W}
                  height={JAR_INNER_H}
                  fill="url(#co2-glass)"
                  stroke="#475569"
                  strokeWidth="2"
                />
                {/* Mouth lip */}
                <rect
                  x={JAR_X - JAR_W / 2 - 4}
                  y={JAR_TOP_Y - 4}
                  width={JAR_W + 8}
                  height="4"
                  fill="#475569"
                />
                {/* Collected gas band (grows upward from bottom) */}
                <rect
                  x={JAR_X - JAR_W / 2 + 2}
                  y={JAR_BOTTOM_Y - gasBandH}
                  width={JAR_W - 4}
                  height={gasBandH}
                  fill="url(#co2-gas)"
                  opacity="0.85"
                >
                  <animate
                    attributeName="opacity"
                    values="0.7;0.95;0.7"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </rect>
                {/* Swirling "effervescence" wisps inside the gas region */}
                {reacting && fillFrac > 0.05 && (
                  <g opacity="0.7">
                    {[0, 1, 2].map((i) => (
                      <circle
                        key={i}
                        cx={JAR_X - 20 + i * 20}
                        r={4 + i}
                        fill="rgba(226,232,240,0.7)"
                      >
                        <animate
                          attributeName="cy"
                          values={`${JAR_BOTTOM_Y - 10};${JAR_BOTTOM_Y - gasBandH + 10};${JAR_BOTTOM_Y - 10}`}
                          dur={`${2.4 + i * 0.3}s`}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0;0.7;0"
                          dur={`${2.4 + i * 0.3}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    ))}
                  </g>
                )}
                <text x={JAR_X} y={JAR_BOTTOM_Y + 22} textAnchor="middle" fontSize="10" fill="#475569">
                  Gas Jar · গ্যাস জার
                </text>
              </g>
            ) : (
              <g>
                {/* Inverted (mistake mode) */}
                <rect
                  x={JAR_X - JAR_W / 2}
                  y={JAR_TOP_Y}
                  width={JAR_W}
                  height={JAR_INNER_H}
                  fill="url(#co2-glass)"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <text x={JAR_X} y={JAR_BOTTOM_Y + 22} textAnchor="middle" fontSize="10" fill="#dc2626">
                  Wrong orientation — CO₂ spills out
                </text>
              </g>
            )}
          </g>
        )}

        {/* ─── Limewater identification tube (optional, sits to right) ─── */}
        {limewaterActive && (
          <g transform="translate(575, 250)">
            <rect x="-14" y="0" width="28" height="120" rx="4" fill="url(#co2-glass)" stroke="#475569" strokeWidth="1.5" />
            <rect
              x="-12"
              y="40"
              width="24"
              height="78"
              fill={
                limewaterPhase === "milky"
                  ? "url(#co2-lime-milky)"
                  : limewaterPhase === "redissolved"
                    ? "rgba(186,230,253,0.85)"
                    : "rgba(224,242,254,0.85)"
              }
            />
            <text x="0" y="140" textAnchor="middle" fontSize="9" fill="#475569">
              Limewater · চুনের পানি
            </text>
            <text x="0" y="152" textAnchor="middle" fontSize="8" fill="#64748b">
              {limewaterPhase === "clear"
                ? "Clear"
                : limewaterPhase === "milky"
                  ? "Milky · ঘোলা ✓"
                  : "Re-dissolved"}
            </text>
          </g>
        )}

        {/* ─── Labels ─── */}
        <text x="252" y="48" textAnchor="middle" fontSize="10" fill="#334155">
          Thistle Funnel · থিসল ফানেল
        </text>
        <text x="160" y="345" textAnchor="middle" fontSize="10" fill="#334155">
          Round-bottom Flask
        </text>
        <text x="160" y="358" textAnchor="middle" fontSize="9" fill="#64748b">
          গোলতলী ফ্লাস্ক
        </text>

        {/* ─── Persistent test outcomes at the jar mouth ─── */}
        {placed.gas_jar && jarUpright && splintExtinguished && (
          <g>
            <rect x={JAR_X - 30} y={JAR_TOP_Y - 8} width="60" height="3" fill="#3f3f46" rx="1" />
            <rect x={JAR_X + 22} y={JAR_TOP_Y - 9} width="10" height="5" fill="#111827" rx="1" />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={JAR_X - 8 + i * 8} r={4 + i} fill="rgba(148,163,184,0.55)">
                <animate attributeName="cy" values={`${JAR_TOP_Y - 10};${JAR_TOP_Y - 60}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
                <animate attributeName="opacity" values="0.7;0" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
              </circle>
            ))}
            <text x={JAR_X} y={JAR_TOP_Y - 70} textAnchor="middle" fontSize="9" fill="#475569">
              Flame extinguished · শিখা নিভে গেছে
            </text>
          </g>
        )}

        {placed.gas_jar && jarUpright && mgReacted && (
          <g>
            <rect x={JAR_X - 4} y={JAR_TOP_Y + 20} width="8" height="50" fill="#e5e7eb" stroke="#475569" strokeWidth="0.5" />
            <circle cx={JAR_X} cy={JAR_TOP_Y + 15} r="10" fill="#fef9c3" opacity="0.95">
              <animate attributeName="r" values="8;12;8" dur="0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={JAR_X} cy={JAR_TOP_Y + 15} r="5" fill="#ffffff">
              <animate attributeName="opacity" values="0.9;1;0.9" dur="0.4s" repeatCount="indefinite" />
            </circle>
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={JAR_X + (i % 2 ? 2 : -2)} cy={JAR_TOP_Y + 30 + i * 10} r="1.6" fill="#0a0a0a" />
            ))}
            <ellipse cx={JAR_X} cy={JAR_BOTTOM_Y - 4} rx="30" ry="4" fill="#f8fafc" />
            <text x={JAR_X} y={JAR_TOP_Y - 8} textAnchor="middle" fontSize="9" fill="#475569">
              Mg burns: C (black) + MgO (white)
            </text>
          </g>
        )}

        {placed.gas_jar && jarUpright && litmusReacted && (
          <g>
            <rect x={JAR_X - 12} y={JAR_TOP_Y - 22} width="24" height="18" fill="#fca5a5" stroke="#7f1d1d" strokeWidth="0.8" rx="1" />
            <text x={JAR_X} y={JAR_TOP_Y - 30} textAnchor="middle" fontSize="9" fill="#7f1d1d">
              Blue → faint red · নীল → হালকা লাল
            </text>
          </g>
        )}

        {/* Empty-state helper */}
        {!placed.round_bottom_flask && (
          <text x="320" y="250" textAnchor="middle" fontSize="14" fill="#94a3b8">
            Tap or drag equipment from the left to begin · বাঁ পাশ থেকে যন্ত্রপাতি যোগ করো
          </text>
        )}
      </svg>

      {/* ─── Cursor-following identification tool ─── */}
      {activeIdTool && cursor && (
        <div
          className="pointer-events-none absolute z-20"
          style={{ left: cursor.x, top: cursor.y, transform: "translate(-50%, -90%)" }}
        >
          {activeIdTool === "splint" && (
            <svg width="44" height="64" viewBox="0 0 44 64">
              <rect x="20" y="20" width="4" height="40" fill="#a16207" />
              <ellipse cx="22" cy="14" rx="9" ry="14" fill="#fb923c">
                <animate attributeName="ry" values="12;16;12" dur="0.4s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="22" cy="12" rx="5" ry="9" fill="#fef08a" />
            </svg>
          )}
          {activeIdTool === "mg" && (
            <svg width="44" height="64" viewBox="0 0 44 64">
              <rect x="19" y="22" width="6" height="40" fill="#e5e7eb" stroke="#475569" strokeWidth="0.5" />
              <circle cx="22" cy="16" r="11" fill="#ffffff" opacity="0.95">
                <animate attributeName="r" values="9;13;9" dur="0.35s" repeatCount="indefinite" />
              </circle>
              <circle cx="22" cy="16" r="5" fill="#fef9c3" />
            </svg>
          )}
          {activeIdTool === "litmus" && (
            <svg width="44" height="44" viewBox="0 0 44 44">
              <rect x="10" y="14" width="24" height="18" fill="#60a5fa" stroke="#1e3a8a" strokeWidth="0.8" rx="1" />
              <rect x="20" y="32" width="4" height="10" fill="#475569" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
