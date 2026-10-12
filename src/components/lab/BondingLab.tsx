/**
 * Chemical Bonding Basics — Ionic vs Covalent simulation.
 * NCTB Class 9-10 — রাসায়নিক বন্ধন।
 *
 * Self-contained: split-tab SVG sim, step wizard, mistake toasts,
 * concept quiz, inline report + viva.
 */
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Atom,
  Trophy,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BONDING_STEPS,
  BONDING_VIVA,
  CONCEPT_QUESTIONS,
  MISTAKE_MESSAGES,
  gradeBonding,
  shellPositions,
  type BondingMistake,
  type BondingMistakeType,
  type BondingStepId,
  type BondKind,
  type Lang,
} from "@/lib/bonding";

interface Props {
  onBack: () => void;
}

// ── small i18n helper ─────────────────────────────────────
const T = {
  title: { en: "Chemical Bonding Basics", bn: "রাসায়নিক বন্ধন (মৌলিক)" },
  subtitle: {
    en: "Ionic transfer vs Covalent sharing — drag valence electrons.",
    bn: "আয়নিক স্থানান্তর বনাম সমযোজী শেয়ার — যোজ্যতা ইলেকট্রন টানুন।",
  },
  back: { en: "Back", bn: "ফিরে যান" },
  reset: { en: "Reset", bn: "রিসেট" },
  ionic: { en: "Ionic Bond (Na + Cl)", bn: "আয়নিক বন্ধন (Na + Cl)" },
  covalent: { en: "Covalent Bond (Cl₂)", bn: "সমযোজী বন্ধন (Cl₂)" },
  steps: { en: "Steps", bn: "ধাপ" },
  hint: { en: "Hint", bn: "ইঙ্গিত" },
  mistakes: { en: "Mistakes", bn: "ভুল" },
  noMistakes: { en: "No mistakes yet — keep going!", bn: "কোনো ভুল নেই — এগিয়ে যান!" },
  submit: { en: "Submit Lab", bn: "জমা দিন" },
  report: { en: "Lab Report", bn: "ল্যাব রিপোর্ট" },
  accuracy: { en: "Accuracy", bn: "সঠিকতা" },
  grade: { en: "Grade", bn: "গ্রেড" },
  duration: { en: "Time", bn: "সময়" },
  viva: { en: "Viva Questions", bn: "ভাইভা প্রশ্ন" },
  quizHeading: {
    en: "Concept Check: pick the correct bond type",
    bn: "ধারণা যাচাই: সঠিক বন্ধনের ধরন বাছুন",
  },
  ionicChoice: { en: "Ionic", bn: "আয়নিক" },
  covalentChoice: { en: "Covalent", bn: "সমযোজী" },
  ionicDone: { en: "Ionic bond formed!", bn: "আয়নিক বন্ধন গঠিত!" },
  covalentDone: { en: "Cl–Cl bond formed!", bn: "Cl–Cl বন্ধন গঠিত!" },
  introTitle: {
    en: "Valence Electrons & Octet Rule",
    bn: "যোজ্যতা ইলেকট্রন ও অষ্টক নিয়ম",
  },
  introBody: {
    en: "An atom's outermost shell holds its valence electrons. Atoms become stable by completing 8 electrons (octet) — either by transferring electrons (ionic) or by sharing them (covalent).",
    bn: "পরমাণুর সবচেয়ে বাইরের শেলের ইলেকট্রনই যোজ্যতা ইলেকট্রন। ৮টি ইলেকট্রন (অষ্টক) পূর্ণ করে পরমাণু স্থিতিশীল হয় — হয় স্থানান্তরের (আয়নিক) মাধ্যমে, না হয় শেয়ারের (সমযোজী) মাধ্যমে।",
  },
  startIntro: { en: "I understand — continue", bn: "বুঝেছি — চালিয়ে যান" },
  langEN: { en: "EN", bn: "EN" },
  langBN: { en: "বাং", bn: "বাং" },
};

function tx<K extends keyof typeof T>(k: K, lang: Lang) {
  return T[k][lang];
}

// ── Ionic SVG simulation ──────────────────────────────────
const NA_CX = 130;
const NA_CY = 200;
const CL_CX = 470;
const CL_CY = 200;
const SHELL_RADII = [28, 52, 78];
const E_RADIUS = 6;

interface IonicState {
  transferred: boolean;
}

function IonicSim({
  state,
  lang,
  onTransfer,
  onMistake,
}: {
  state: IonicState;
  lang: Lang;
  onTransfer: () => void;
  onMistake: (t: BondingMistakeType) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<null | { id: string; x: number; y: number }>(null);
  const [shake, setShake] = useState(false);

  // Cl valence positions: 7 of 8 — leave a vacant slot at angle index 7 (top-right gap).
  const clValencePositions = useMemo(
    () => shellPositions(CL_CX, CL_CY, SHELL_RADII[2], 8, -90),
    [],
  );
  const vacant = clValencePositions[3]; // empty slot — clearly visible

  const toSvgCoords = useCallback((evt: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
  }, []);

  const onElectronDown = (id: string) => (e: React.PointerEvent) => {
    if (state.transferred) return;
    e.stopPropagation();
    const isValence = id === "na-valence";
    if (!isValence) {
      onMistake("inner_shell_electron");
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      return;
    }
    const { x, y } = toSvgCoords(e);
    setDragging({ id, x, y });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const { x, y } = toSvgCoords(e);
    setDragging({ ...dragging, x, y });
  };

  const onUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    const { x, y } = toSvgCoords(e);
    const dx = x - vacant.x;
    const dy = y - vacant.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 32) {
      onTransfer();
    } else {
      onMistake("wrong_drop_target");
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
    }
    setDragging(null);
  };

  // Na shells: 2, 8, 1   (after transfer: 2, 8)
  const naShell1 = shellPositions(NA_CX, NA_CY, SHELL_RADII[0], 2);
  const naShell2 = shellPositions(NA_CX, NA_CY, SHELL_RADII[1], 8);
  const naValence = shellPositions(NA_CX, NA_CY, SHELL_RADII[2], 1)[0];

  // Cl shells: 2, 8, 7   (after transfer the 8th slot fills)
  const clShell1 = shellPositions(CL_CX, CL_CY, SHELL_RADII[0], 2);
  const clShell2 = shellPositions(CL_CX, CL_CY, SHELL_RADII[1], 8);
  const clShell3 = clValencePositions.filter((_, i) => i !== 3);

  const t = state.transferred;

  return (
    <div className={shake ? "animate-[shake_0.45s_ease-in-out]" : ""}>
      <svg
        ref={svgRef}
        viewBox="0 0 600 400"
        className="w-full h-auto touch-none select-none"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={() => dragging && setDragging(null)}
      >
        <defs>
          <radialGradient id="naCore" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <radialGradient id="clCore" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="100%" stopColor="#10b981" />
          </radialGradient>
        </defs>

        {/* Bracket frame after ion formation */}
        {t && (
          <>
            <g className="text-zinc-600">
              <line x1={40} y1={90} x2={40} y2={310} stroke="currentColor" strokeWidth={2} />
              <line x1={40} y1={90} x2={55} y2={90} stroke="currentColor" strokeWidth={2} />
              <line x1={40} y1={310} x2={55} y2={310} stroke="currentColor" strokeWidth={2} />
              <line x1={235} y1={90} x2={235} y2={310} stroke="currentColor" strokeWidth={2} />
              <line x1={220} y1={90} x2={235} y2={90} stroke="currentColor" strokeWidth={2} />
              <line x1={220} y1={310} x2={235} y2={310} stroke="currentColor" strokeWidth={2} />
              <text x={245} y={105} fontSize={22} fontWeight={700} fill="currentColor">
                +
              </text>

              <line x1={370} y1={90} x2={370} y2={310} stroke="currentColor" strokeWidth={2} />
              <line x1={370} y1={90} x2={385} y2={90} stroke="currentColor" strokeWidth={2} />
              <line x1={370} y1={310} x2={385} y2={310} stroke="currentColor" strokeWidth={2} />
              <line x1={565} y1={90} x2={565} y2={310} stroke="currentColor" strokeWidth={2} />
              <line x1={550} y1={90} x2={565} y2={90} stroke="currentColor" strokeWidth={2} />
              <line x1={550} y1={310} x2={565} y2={310} stroke="currentColor" strokeWidth={2} />
              <text x={573} y={105} fontSize={22} fontWeight={700} fill="currentColor">
                −
              </text>
            </g>
          </>
        )}

        {/* Na atom */}
        <g>
          {SHELL_RADII.slice(0, t ? 2 : 3).map((r, i) => (
            <circle
              key={`na-shell-${i}`}
              cx={NA_CX}
              cy={NA_CY}
              r={r}
              fill="none"
              stroke="#fcd34d"
              strokeOpacity={0.6}
              strokeDasharray="3 3"
            />
          ))}
          <circle cx={NA_CX} cy={NA_CY} r={18} fill="url(#naCore)" />
          <text
            x={NA_CX}
            y={NA_CY + 5}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill="#78350f"
          >
            Na
          </text>
          {/* Na electrons (red dots) */}
          {[...naShell1, ...naShell2].map((p, i) => (
            <circle
              key={`na-e-${i}`}
              cx={p.x}
              cy={p.y}
              r={E_RADIUS}
              fill="#dc2626"
              stroke="#7f1d1d"
              strokeWidth={1}
            />
          ))}
          {/* Na valence electron — draggable until transferred */}
          {!t && !dragging && (
            <g onPointerDown={onElectronDown("na-valence")} style={{ cursor: "grab" }}>
              <circle
                cx={naValence.x}
                cy={naValence.y}
                r={E_RADIUS + 4}
                fill="#dc2626"
                fillOpacity={0.18}
              >
                <animate
                  attributeName="r"
                  values={`${E_RADIUS + 4};${E_RADIUS + 9};${E_RADIUS + 4}`}
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={naValence.x}
                cy={naValence.y}
                r={E_RADIUS}
                fill="#dc2626"
                stroke="#7f1d1d"
                strokeWidth={1.5}
              />
            </g>
          )}
        </g>

        {/* Cl atom */}
        <g>
          {SHELL_RADII.map((r, i) => (
            <circle
              key={`cl-shell-${i}`}
              cx={CL_CX}
              cy={CL_CY}
              r={r}
              fill="none"
              stroke="#6ee7b7"
              strokeOpacity={0.6}
              strokeDasharray="3 3"
            />
          ))}
          <circle cx={CL_CX} cy={CL_CY} r={18} fill="url(#clCore)" />
          <text
            x={CL_CX}
            y={CL_CY + 5}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill="#064e3b"
          >
            Cl
          </text>
          {/* Cl electrons (green crosses) */}
          {[...clShell1, ...clShell2, ...clShell3].map((p, i) => (
            <g key={`cl-e-${i}`} onPointerDown={onElectronDown(`cl-inner-${i}`)}>
              <line
                x1={p.x - 4}
                y1={p.y - 4}
                x2={p.x + 4}
                y2={p.y + 4}
                stroke="#059669"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
              <line
                x1={p.x - 4}
                y1={p.y + 4}
                x2={p.x + 4}
                y2={p.y - 4}
                stroke="#059669"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </g>
          ))}
          {/* Vacant slot highlight (until transferred) */}
          {!t && (
            <circle
              cx={vacant.x}
              cy={vacant.y}
              r={E_RADIUS + 5}
              fill="#fde68a"
              fillOpacity={0.55}
              stroke="#f59e0b"
              strokeDasharray="2 2"
            >
              <animate
                attributeName="fillOpacity"
                values="0.25;0.7;0.25"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </circle>
          )}
          {/* Transferred electron (red dot, now in Cl shell) */}
          {t && (
            <circle
              cx={vacant.x}
              cy={vacant.y}
              r={E_RADIUS}
              fill="#dc2626"
              stroke="#7f1d1d"
              strokeWidth={1.2}
            />
          )}
        </g>

        {/* Drag ghost */}
        {dragging && (
          <circle
            cx={dragging.x}
            cy={dragging.y}
            r={E_RADIUS}
            fill="#dc2626"
            stroke="#7f1d1d"
            strokeWidth={1.2}
            opacity={0.9}
            pointerEvents="none"
          />
        )}

        {/* Electrostatic attraction after transfer */}
        {t && (
          <g>
            <path
              d={`M 245 200 Q 350 160 370 200`}
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="none"
            />
            <path
              d={`M 245 200 Q 350 240 370 200`}
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="none"
            />
            <text x={300} y={335} textAnchor="middle" fontSize={13} fill="#6d28d9" fontWeight={600}>
              {lang === "bn" ? "তড়িৎ স্থির আকর্ষণ" : "Electrostatic attraction"}
            </text>
          </g>
        )}

        {/* Caption */}
        <text x={NA_CX} y={365} textAnchor="middle" fontSize={13} fontWeight={600} fill="#92400e">
          {t ? "Na⁺ (2, 8)" : "Na (2, 8, 1)"}
        </text>
        <text x={CL_CX} y={365} textAnchor="middle" fontSize={13} fontWeight={600} fill="#065f46">
          {t ? "Cl⁻ (2, 8, 8)" : "Cl (2, 8, 7)"}
        </text>
      </svg>
    </div>
  );
}

// ── Covalent SVG simulation (Cl₂) ─────────────────────────
const CCL1_CX = 180;
const CCL2_CX = 420;
const CCL_CY = 200;
const SHARE_CX = 300;
const SHARE_CY = 200;

interface CovalentState {
  shared: { left: boolean; right: boolean }; // each atom contributed one e
}

function CovalentSim({
  state,
  lang,
  onShare,
  onMistake,
}: {
  state: CovalentState;
  lang: Lang;
  onShare: (side: "left" | "right") => void;
  onMistake: (t: BondingMistakeType) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<null | { side: "left" | "right"; x: number; y: number }>(
    null,
  );
  const [shake, setShake] = useState(false);

  const toSvgCoords = useCallback((evt: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
  }, []);

  // Each Cl: shells 2,8,7 — pick a valence electron facing the shared zone.
  const leftValence = shellPositions(CCL1_CX, CCL_CY, SHELL_RADII[2], 7, -90);
  const rightValence = shellPositions(CCL2_CX, CCL_CY, SHELL_RADII[2], 7, -90);
  const leftShare = leftValence[1]; // facing right side
  const rightShare = rightValence[5]; // facing left side

  const startDrag = (side: "left" | "right", isValence: boolean) => (e: React.PointerEvent) => {
    if (state.shared.left && state.shared.right) return;
    e.stopPropagation();
    if (!isValence) {
      onMistake("inner_shell_electron");
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      return;
    }
    if ((side === "left" && state.shared.left) || (side === "right" && state.shared.right)) {
      onMistake("duplicate_action");
      return;
    }
    const { x, y } = toSvgCoords(e);
    setDragging({ side, x, y });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const { x, y } = toSvgCoords(e);
    setDragging({ ...dragging, x, y });
  };

  const onUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    const { x, y } = toSvgCoords(e);
    const dx = x - SHARE_CX;
    const dy = y - SHARE_CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Mistake: dragged the electron all the way past the sharing zone onto the other atom
    const distOther =
      dragging.side === "left"
        ? Math.sqrt((x - CCL2_CX) ** 2 + (y - CCL_CY) ** 2)
        : Math.sqrt((x - CCL1_CX) ** 2 + (y - CCL_CY) ** 2);
    if (distOther < 36) {
      onMistake("transfer_in_covalent");
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
    } else if (dist < 38) {
      onShare(dragging.side);
    } else {
      onMistake("wrong_drop_target");
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
    }
    setDragging(null);
  };

  const bondFormed = state.shared.left && state.shared.right;

  const renderClAtom = (cx: number, sharedSide: boolean, side: "left" | "right") => {
    const valence = side === "left" ? leftValence : rightValence;
    const shareIdx = side === "left" ? 1 : 5;
    return (
      <g key={side}>
        {SHELL_RADII.map((r, i) => (
          <circle
            key={`shell-${side}-${i}`}
            cx={cx}
            cy={CCL_CY}
            r={r}
            fill="none"
            stroke="#6ee7b7"
            strokeOpacity={0.6}
            strokeDasharray="3 3"
          />
        ))}
        <circle cx={cx} cy={CCL_CY} r={18} fill="url(#clCore2)" />
        <text
          x={cx}
          y={CCL_CY + 5}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fill="#064e3b"
        >
          Cl
        </text>
        {/* inner shells (2 + 8) — green crosses, non-draggable mistake source */}
        {shellPositions(cx, CCL_CY, SHELL_RADII[0], 2).map((p, i) => (
          <g key={`inner1-${side}-${i}`} onPointerDown={startDrag(side, false)}>
            <line
              x1={p.x - 4}
              y1={p.y - 4}
              x2={p.x + 4}
              y2={p.y + 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <line
              x1={p.x - 4}
              y1={p.y + 4}
              x2={p.x + 4}
              y2={p.y - 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </g>
        ))}
        {shellPositions(cx, CCL_CY, SHELL_RADII[1], 8).map((p, i) => (
          <g key={`inner2-${side}-${i}`} onPointerDown={startDrag(side, false)}>
            <line
              x1={p.x - 4}
              y1={p.y - 4}
              x2={p.x + 4}
              y2={p.y + 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <line
              x1={p.x - 4}
              y1={p.y + 4}
              x2={p.x + 4}
              y2={p.y - 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </g>
        ))}
        {/* valence (7) — the shared-side one is draggable & highlighted */}
        {valence.map((p, i) => {
          const isShare = i === shareIdx;
          if (isShare && sharedSide) return null; // hidden once shared
          return (
            <g
              key={`val-${side}-${i}`}
              onPointerDown={startDrag(side, isShare)}
              style={isShare ? { cursor: "grab" } : undefined}
            >
              {isShare && (
                <circle cx={p.x} cy={p.y} r={E_RADIUS + 4} fill="#86efac" fillOpacity={0.4}>
                  <animate
                    attributeName="r"
                    values={`${E_RADIUS + 4};${E_RADIUS + 9};${E_RADIUS + 4}`}
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <line
                x1={p.x - 4}
                y1={p.y - 4}
                x2={p.x + 4}
                y2={p.y + 4}
                stroke="#059669"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
              <line
                x1={p.x - 4}
                y1={p.y + 4}
                x2={p.x + 4}
                y2={p.y - 4}
                stroke="#059669"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className={shake ? "animate-[shake_0.45s_ease-in-out]" : ""}>
      <svg
        ref={svgRef}
        viewBox="0 0 600 400"
        className="w-full h-auto touch-none select-none"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={() => dragging && setDragging(null)}
      >
        <defs>
          <radialGradient id="clCore2" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="100%" stopColor="#10b981" />
          </radialGradient>
        </defs>

        {/* Sharing zone */}
        <ellipse
          cx={SHARE_CX}
          cy={SHARE_CY}
          rx={42}
          ry={28}
          fill={bondFormed ? "#bbf7d0" : "#fef9c3"}
          fillOpacity={bondFormed ? 0.6 : 0.4}
          stroke={bondFormed ? "#22c55e" : "#facc15"}
          strokeDasharray={bondFormed ? "0" : "4 3"}
          strokeWidth={2}
        />
        <text
          x={SHARE_CX}
          y={SHARE_CY - 38}
          textAnchor="middle"
          fontSize={11}
          fill="#78350f"
          fontWeight={600}
        >
          {bondFormed
            ? lang === "bn"
              ? "যৌথ ইলেকট্রন জোড়া"
              : "Shared pair"
            : lang === "bn"
              ? "শেয়ারিং জোন"
              : "Sharing zone"}
        </text>

        {renderClAtom(CCL1_CX, state.shared.left, "left")}
        {renderClAtom(CCL2_CX, state.shared.right, "right")}

        {/* Shared electrons inside zone */}
        {state.shared.left && (
          <g>
            <line
              x1={SHARE_CX - 14 - 4}
              y1={SHARE_CY - 4}
              x2={SHARE_CX - 14 + 4}
              y2={SHARE_CY + 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <line
              x1={SHARE_CX - 14 - 4}
              y1={SHARE_CY + 4}
              x2={SHARE_CX - 14 + 4}
              y2={SHARE_CY - 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </g>
        )}
        {state.shared.right && (
          <g>
            <line
              x1={SHARE_CX + 14 - 4}
              y1={SHARE_CY - 4}
              x2={SHARE_CX + 14 + 4}
              y2={SHARE_CY + 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <line
              x1={SHARE_CX + 14 - 4}
              y1={SHARE_CY + 4}
              x2={SHARE_CX + 14 + 4}
              y2={SHARE_CY - 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Drag ghost */}
        {dragging && (
          <g pointerEvents="none">
            <line
              x1={dragging.x - 4}
              y1={dragging.y - 4}
              x2={dragging.x + 4}
              y2={dragging.y + 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <line
              x1={dragging.x - 4}
              y1={dragging.y + 4}
              x2={dragging.x + 4}
              y2={dragging.y - 4}
              stroke="#059669"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Final Lewis dash structure */}
        {bondFormed && (
          <g>
            <text
              x={SHARE_CX}
              y={340}
              textAnchor="middle"
              fontSize={28}
              fontWeight={700}
              fill="#065f46"
            >
              Cl — Cl
            </text>
            <text x={SHARE_CX} y={365} textAnchor="middle" fontSize={12} fill="#065f46">
              {lang === "bn" ? "একক সমযোজী বন্ধন" : "Single covalent bond"}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function BondingLab({ onBack }: Props) {
  const [lang, setLang] = useState<Lang>("bn");
  const [activeStep, setActiveStep] = useState<BondingStepId>("intro");
  const [tab, setTab] = useState<"ionic" | "covalent">("ionic");
  const [ionic, setIonic] = useState<IonicState>({ transferred: false });
  const [covalent, setCovalent] = useState<CovalentState>({
    shared: { left: false, right: false },
  });
  const [quizAnswers, setQuizAnswers] = useState<Record<string, BondKind | null>>(() =>
    Object.fromEntries(CONCEPT_QUESTIONS.map((q) => [q.id, null])),
  );
  const [mistakes, setMistakes] = useState<BondingMistake[]>([]);
  const [startedAt] = useState<number>(() => Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [showViva, setShowViva] = useState(false);

  const logMistake = useCallback(
    (type: BondingMistakeType) => {
      const msg = MISTAKE_MESSAGES[type][lang];
      setMistakes((prev) => [...prev, { ts: Date.now(), type, message: msg }]);
      toast.warning(msg);
    },
    [lang],
  );

  const onTransfer = useCallback(() => {
    setIonic({ transferred: true });
    toast.success(tx("ionicDone", lang));
    setActiveStep((s) => (s === "ionic_transfer" ? "covalent_share" : s));
    setTab("covalent");
  }, [lang]);

  const onShare = useCallback(
    (side: "left" | "right") => {
      setCovalent((c) => {
        const next = { shared: { ...c.shared, [side]: true } };
        if (next.shared.left && next.shared.right) {
          toast.success(tx("covalentDone", lang));
          setActiveStep((s) => (s === "covalent_share" ? "concept_check" : s));
        }
        return next;
      });
    },
    [lang],
  );

  const covalentSharedPairs = covalent.shared.left && covalent.shared.right ? 1 : 0;

  const quizCorrect = useMemo(
    () => CONCEPT_QUESTIONS.reduce((sum, q) => sum + (quizAnswers[q.id] === q.answer ? 1 : 0), 0),
    [quizAnswers],
  );
  const allQuizAnswered = useMemo(
    () => CONCEPT_QUESTIONS.every((q) => quizAnswers[q.id] !== null),
    [quizAnswers],
  );

  const grade = useMemo(
    () =>
      gradeBonding({
        ionicDone: ionic.transferred,
        covalentSharedPairs,
        quizCorrect,
        quizTotal: CONCEPT_QUESTIONS.length,
        mistakes: mistakes.length,
        durationSec: Math.floor((Date.now() - startedAt) / 1000),
      }),
    [ionic.transferred, covalentSharedPairs, quizCorrect, mistakes.length, startedAt],
  );

  const reset = () => {
    setIonic({ transferred: false });
    setCovalent({ shared: { left: false, right: false } });
    setMistakes([]);
    setQuizAnswers(Object.fromEntries(CONCEPT_QUESTIONS.map((q) => [q.id, null])));
    setActiveStep("intro");
    setTab("ionic");
    setSubmitted(false);
    setShowViva(false);
  };

  const submit = () => {
    setSubmitted(true);
    toast.success(`${tx("submit", lang)} · ${tx("grade", lang)}: ${grade.grade}`);
  };

  const stepIdx = BONDING_STEPS.findIndex((s) => s.id === activeStep);
  const progressPct = Math.round(((stepIdx + 1) / BONDING_STEPS.length) * 100);

  // shake keyframes injected once
  useEffect(() => {
    const id = "bonding-shake-kf";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `@keyframes shake {0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-rose-50 to-sky-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {tx("back", lang)}
            </Button>
            <div className="flex items-center gap-2">
              <Atom className="h-6 w-6 text-violet-600" />
              <div>
                <h1 className="text-xl font-bold leading-tight md:text-2xl">{tx("title", lang)}</h1>
                <p className="text-xs text-muted-foreground">{tx("subtitle", lang)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-md border bg-white p-0.5">
              <Button
                size="sm"
                variant={lang === "en" ? "default" : "ghost"}
                className="h-7 px-2"
                onClick={() => setLang("en")}
              >
                EN
              </Button>
              <Button
                size="sm"
                variant={lang === "bn" ? "default" : "ghost"}
                className="h-7 px-2"
                onClick={() => setLang("bn")}
              >
                বাং
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="mr-1 h-4 w-4" />
              {tx("reset", lang)}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Workspace */}
          <div className="space-y-4">
            {activeStep === "intro" ? (
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-violet-600" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{tx("introTitle", lang)}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{tx("introBody", lang)}</p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setActiveStep("ionic_transfer");
                        setTab("ionic");
                      }}
                    >
                      {tx("startIntro", lang)}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : activeStep === "concept_check" ? (
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  {tx("quizHeading", lang)}
                </h2>
                <div className="space-y-3">
                  {CONCEPT_QUESTIONS.map((q) => {
                    const picked = quizAnswers[q.id];
                    const correct = picked !== null && picked === q.answer;
                    return (
                      <div key={q.id} className="rounded-md border bg-white p-3">
                        <p className="mb-2 text-sm font-medium">{q.prompt[lang]}</p>
                        <div className="flex flex-wrap gap-2">
                          {(["ionic", "covalent"] as const).map((opt) => {
                            const selected = picked === opt;
                            return (
                              <Button
                                key={opt}
                                size="sm"
                                variant={selected ? "default" : "outline"}
                                onClick={() => setQuizAnswers((p) => ({ ...p, [q.id]: opt }))}
                              >
                                {opt === "ionic"
                                  ? tx("ionicChoice", lang)
                                  : tx("covalentChoice", lang)}
                              </Button>
                            );
                          })}
                          {picked !== null &&
                            (correct ? (
                              <Badge className="ml-auto bg-emerald-500/15 text-emerald-700">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                {lang === "bn" ? "সঠিক" : "Correct"}
                              </Badge>
                            ) : (
                              <Badge className="ml-auto bg-rose-500/15 text-rose-700">
                                <XCircle className="mr-1 h-3 w-3" />
                                {lang === "bn" ? "ভুল" : "Wrong"}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  className="w-full"
                  disabled={!allQuizAnswered || submitted}
                  onClick={submit}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  {tx("submit", lang)}
                </Button>
              </Card>
            ) : (
              <Card className="p-4">
                <Tabs value={tab} onValueChange={(v) => setTab(v as "ionic" | "covalent")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ionic">{tx("ionic", lang)}</TabsTrigger>
                    <TabsTrigger value="covalent">{tx("covalent", lang)}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ionic" className="mt-4">
                    <IonicSim
                      state={ionic}
                      lang={lang}
                      onTransfer={onTransfer}
                      onMistake={logMistake}
                    />
                  </TabsContent>
                  <TabsContent value="covalent" className="mt-4">
                    <CovalentSim
                      state={covalent}
                      lang={lang}
                      onShare={onShare}
                      onMistake={logMistake}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            )}

            {/* Report */}
            {submitted && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    {tx("report", lang)}
                  </h2>
                  <Badge variant="outline" className="text-lg font-bold">
                    {tx("grade", lang)}: {grade.grade}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-2xl font-bold text-emerald-600">{grade.accuracy}%</div>
                    <div className="text-xs text-muted-foreground">{tx("accuracy", lang)}</div>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-2xl font-bold">
                      {quizCorrect}/{CONCEPT_QUESTIONS.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Quiz</div>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-2xl font-bold">
                      {Math.floor((Date.now() - startedAt) / 60000)}m
                    </div>
                    <div className="text-xs text-muted-foreground">{tx("duration", lang)}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowViva((v) => !v)}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {showViva ? (lang === "bn" ? "ভাইভা লুকান" : "Hide Viva") : tx("viva", lang)}
                </Button>
                {showViva && (
                  <div className="space-y-3">
                    {BONDING_VIVA.map((v, i) => (
                      <div key={i} className="rounded-md border bg-white p-3">
                        <p className="text-sm font-semibold">
                          Q{i + 1}. {v.q[lang]}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{v.a[lang]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Side panel: steps + mistakes */}
          <aside className="space-y-4">
            <Card className="p-4 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wide">{tx("steps", lang)}</span>
                  <span>
                    {stepIdx + 1}/{BONDING_STEPS.length}
                  </span>
                </div>
                <Progress value={progressPct} />
              </div>
              <ul className="space-y-1.5 text-sm">
                {BONDING_STEPS.map((s, i) => {
                  const done = i < stepIdx || (i === stepIdx && submitted);
                  const isCurrent = s.id === activeStep && !submitted;
                  return (
                    <li
                      key={s.id}
                      className={[
                        "flex items-start gap-2 rounded px-2 py-1",
                        isCurrent ? "bg-violet-100/70" : "",
                      ].join(" ")}
                    >
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <div
                          className={[
                            "mt-1 h-3 w-3 shrink-0 rounded-full border",
                            isCurrent ? "border-violet-500 bg-violet-300" : "border-muted",
                          ].join(" ")}
                        />
                      )}
                      <span className={done ? "text-muted-foreground line-through" : ""}>
                        {s.label[lang]}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="rounded-md border border-violet-200 bg-violet-50 p-2 text-xs">
                💡 <span className="font-semibold">{tx("hint", lang)}: </span>
                {BONDING_STEPS[stepIdx]?.hint[lang]}
              </div>
            </Card>

            <Card className="p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tx("mistakes", lang)} ({mistakes.length})
              </div>
              {mistakes.length === 0 ? (
                <p className="text-xs text-muted-foreground">{tx("noMistakes", lang)}</p>
              ) : (
                <ul className="max-h-40 space-y-1 overflow-auto text-xs">
                  {mistakes.slice(-6).map((m, i) => (
                    <li
                      key={i}
                      className="rounded border border-amber-300/60 bg-amber-50 px-2 py-1"
                    >
                      {m.message}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
