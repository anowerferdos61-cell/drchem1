/**
 * Solubility Rules — interactive drag-and-drop / click-to-place game.
 * Class 9-10 NCTB — দ্রাব্যতা নীতি
 */
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  FlaskConical,
  RotateCcw,
  Info,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  SOLUBILITY_DATA,
  type SolubilityExample,
  type SolubilityStatus,
  type TextureVisual,
} from "@/lib/solubility-rules";

interface Props {
  onBack: () => void;
}

type Placement = Record<string, SolubilityStatus | null>;

const MD = { remark: [remarkMath], rehype: [rehypeKatex] };

function md(text: string) {
  return (
    <ReactMarkdown remarkPlugins={MD.remark} rehypePlugins={MD.rehype}>
      {text}
    </ReactMarkdown>
  );
}

export default function SolubilityLab({ onBack }: Props) {
  const data = SOLUBILITY_DATA;

  const [placement, setPlacement] = useState<Placement>(() =>
    Object.fromEntries(data.examples.map((e) => [e.id, null])),
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverBin, setHoverBin] = useState<SolubilityStatus | null>(null);

  const place = (exId: string, bin: SolubilityStatus) => {
    setPlacement((p) => ({ ...p, [exId]: bin }));
    setSelectedCardId(null);
  };

  const reset = () => {
    setPlacement(Object.fromEntries(data.examples.map((e) => [e.id, null])));
    setSelectedCardId(null);
  };

  const { correct, total, allPlaced } = useMemo(() => {
    let c = 0;
    let placed = 0;
    for (const ex of data.examples) {
      const v = placement[ex.id];
      if (v !== null) placed++;
      if (v === ex.status) c++;
    }
    return {
      correct: c,
      total: data.examples.length,
      allPlaced: placed === data.examples.length,
    };
  }, [placement, data.examples]);

  const unplaced = data.examples.filter((e) => placement[e.id] === null);
  const inBin = (bin: SolubilityStatus) =>
    data.examples.filter((e) => placement[e.id] === bin);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Experiments
          </Button>
          <FlaskConical className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base font-bold leading-tight">
              Solubility Rules · দ্রাব্যতা নীতি
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Drag salts into the correct beaker — Class 9-10 NCTB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allPlaced && (
            <Badge
              variant={correct === total ? "default" : "secondary"}
              className={correct === total ? "bg-emerald-600" : ""}
            >
              {correct}/{total} সঠিক
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 md:grid-cols-5">
        {/* ============ LEFT: Game ============ */}
        <div className="space-y-4 md:col-span-3">
          {/* Hint */}
          <Card className="border-dashed bg-amber-50/60 p-3">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
              <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{data.interactive_hint}</span>
            </p>
          </Card>

          {/* Salt cards (the "drag pile") */}
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Step 1 · লবণের কার্ডগুলো বাছুন
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {data.examples.map((ex) => {
                const placed = placement[ex.id];
                const isSelected = selectedCardId === ex.id;
                return (
                  <button
                    key={ex.id}
                    draggable={!placed}
                    onDragStart={(e) => {
                      if (placed) return;
                      setDragId(ex.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", ex.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => {
                      if (placed) return;
                      setSelectedCardId(isSelected ? null : ex.id);
                    }}
                    disabled={!!placed}
                    className={`group flex flex-col items-center rounded-xl border-2 p-3 transition ${
                      placed
                        ? "cursor-not-allowed border-transparent bg-muted/40 opacity-40"
                        : isSelected
                          ? "scale-105 border-primary bg-primary/5 shadow-md"
                          : "cursor-grab border-slate-200 bg-white hover:border-primary/60 hover:shadow-sm active:cursor-grabbing"
                    }`}
                  >
                    <div className="relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 px-3 py-3">
                      {ex.textureVisual && <SaltTexture visual={ex.textureVisual} />}
                      <div className="relative z-10 text-center text-base font-bold text-white drop-shadow">
                        {md(`$${ex.formula}$`)}
                      </div>
                    </div>
                    <div className="mt-1.5 text-center text-[10px] leading-tight text-muted-foreground">
                      {ex.name}
                    </div>
                    {ex.appearance && (
                      <div className="mt-0.5 text-center text-[9px] italic leading-tight text-slate-400">
                        {ex.appearance}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedCardId && (
              <p className="mt-3 text-center text-[11px] text-primary">
                ✅ কার্ড সিলেক্ট হয়েছে — নিচের সঠিক বিকারে ক্লিক করুন।
              </p>
            )}
            {!selectedCardId && unplaced.length > 0 && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                👆 কার্ড ড্র্যাগ করুন অথবা ক্লিক করে সিলেক্ট করুন।
              </p>
            )}
          </Card>

          {/* Two beakers as drop bins */}
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FlaskConical className="h-4 w-4 text-primary" />
              Step 2 · সঠিক বিকারে ফেলুন
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <DropBin
                label_bn="পানিতে দ্রবণীয়"
                label_en="Soluble"
                tone="soluble"
                items={inBin("Soluble")}
                expected="Soluble"
                isHover={hoverBin === "Soluble"}
                canPlace={!!selectedCardId}
                onClickPlace={() =>
                  selectedCardId && place(selectedCardId, "Soluble")
                }
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setHoverBin("Soluble");
                }}
                onDragLeave={() => setHoverBin(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragId;
                  if (id) place(id, "Soluble");
                  setHoverBin(null);
                  setDragId(null);
                }}
              />
              <DropBin
                label_bn="অধঃক্ষেপ / অদ্রবণীয়"
                label_en="Insoluble"
                tone="insoluble"
                items={inBin("Insoluble")}
                expected="Insoluble"
                isHover={hoverBin === "Insoluble"}
                canPlace={!!selectedCardId}
                onClickPlace={() =>
                  selectedCardId && place(selectedCardId, "Insoluble")
                }
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setHoverBin("Insoluble");
                }}
                onDragLeave={() => setHoverBin(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragId;
                  if (id) place(id, "Insoluble");
                  setHoverBin(null);
                  setDragId(null);
                }}
              />
            </div>

            {/* Feedback per placed card */}
            {allPlaced && (
              <div className="mt-4 space-y-2 rounded-lg border bg-slate-50 p-3">
                <p className="text-xs font-semibold">
                  ফলাফল ({correct}/{total} সঠিক)
                </p>
                <ul className="space-y-1.5">
                  {data.examples.map((ex) => {
                    const ok = placement[ex.id] === ex.status;
                    return (
                      <li
                        key={ex.id}
                        className="flex items-start gap-2 text-[11px]"
                      >
                        {ok ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                        )}
                        <span>
                          <b>{ex.name}</b> ({ex.formula}) — {ex.note}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {/* ============ RIGHT: Theory ============ */}
        <div className="space-y-4 md:col-span-2">
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Info className="h-4 w-4 text-primary" /> দ্রাব্যতা নীতি · Rules
            </h3>
            <div className="space-y-2">
              {data.rules.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-lg border p-2.5 text-xs leading-relaxed ${r.bg_color}`}
                >
                  <div className="prose prose-sm max-w-none text-xs">
                    {md(r.statement)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-amber-300 bg-amber-50 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" /> গুরুত্বপূর্ণ ব্যতিক্রম · Exceptions
            </h3>
            <div className="space-y-2">
              {data.exceptions.map((ex, i) => (
                <div key={i} className="rounded-md bg-white/60 p-2">
                  <div className="text-[11px] font-semibold text-amber-900">
                    {ex.ion}
                  </div>
                  <div className="prose prose-sm max-w-none text-[11px] leading-relaxed text-amber-950">
                    {md(ex.rule)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-purple-900">
              <Lightbulb className="h-4 w-4" /> Mnemonic · মনে রাখার সূত্র
            </h3>
            <p className="text-[11px] leading-relaxed text-purple-950">
              {data.mnemonic}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Drop Bin (a beaker) ─────────────────────────────────────────── */

function DropBin({
  label_bn,
  label_en,
  tone,
  items,
  expected,
  isHover,
  canPlace,
  onClickPlace,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  label_bn: string;
  label_en: string;
  tone: "soluble" | "insoluble";
  items: SolubilityExample[];
  expected: SolubilityStatus;
  isHover: boolean;
  canPlace: boolean;
  onClickPlace: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const liquid = tone === "soluble" ? "#BAE6FD" : "#FECACA";
  const accent = tone === "soluble" ? "bg-sky-500" : "bg-rose-500";

  // particles: split into floating (Soluble = throughout) vs sediment (Insoluble = bottom)
  const dissolvedParticles = tone === "soluble" ? items.length * 6 : 0;
  const sedimentParticles = tone === "insoluble" ? items.length : 0;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClickPlace}
      role="button"
      tabIndex={0}
      className={`relative flex flex-col items-center rounded-xl border-2 p-3 transition ${
        isHover
          ? "border-primary bg-primary/5 shadow-lg"
          : canPlace
            ? "cursor-pointer border-dashed border-primary/40 hover:border-primary hover:shadow-md"
            : "border-slate-200 bg-white"
      }`}
    >
      <span
        className={`mb-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${accent}`}
      >
        {label_en}
      </span>

      {/* Beaker */}
      <svg viewBox="0 0 160 180" className="h-44 w-full">
        <defs>
          <linearGradient id={`bin-glass-${tone}`} x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* Liquid */}
        <path
          d="M28 70 L132 70 L132 160 Q132 172 120 172 L40 172 Q28 172 28 160 Z"
          fill={liquid}
        />
        {/* Dissolved (soluble) — small dots distributed in liquid */}
        {Array.from({ length: dissolvedParticles }).map((_, i) => {
          const x = 38 + ((i * 13) % 84);
          const y = 80 + ((i * 19) % 80);
          return (
            <circle
              key={`d-${i}`}
              cx={x}
              cy={y}
              r="1.6"
              fill="#0369a1"
              opacity="0.55"
            />
          );
        })}
        {/* Sediment (insoluble) — chunks piled at the bottom */}
        {Array.from({ length: sedimentParticles }).map((_, i) => (
          <ellipse
            key={`s-${i}`}
            cx={50 + i * 22}
            cy={166 - (i % 2) * 5}
            rx="14"
            ry="5"
            fill="#fff"
            stroke="#dc2626"
            strokeWidth="0.8"
            opacity="0.95"
          />
        ))}
        {/* Glass */}
        <path
          d="M22 40 L138 40 L138 54 L132 54 L132 160 Q132 174 116 174 L44 174 Q28 174 28 160 L28 54 L22 54 Z"
          fill={`url(#bin-glass-${tone})`}
          stroke="#475569"
          strokeWidth="2"
        />
        {/* Spout */}
        <path
          d="M22 40 L10 32 L10 36 L21 44"
          fill="none"
          stroke="#475569"
          strokeWidth="2"
        />
        {/* Tick marks */}
        <g stroke="#64748b" strokeWidth="1">
          <line x1="28" y1="90" x2="40" y2="90" />
          <line x1="28" y1="120" x2="40" y2="120" />
          <line x1="28" y1="150" x2="40" y2="150" />
        </g>
        {/* Label */}
        <text
          x="80"
          y="62"
          textAnchor="middle"
          fontSize="11"
          fill="#0f172a"
          fontWeight="700"
        >
          {expected}
        </text>
      </svg>

      <div className="text-center text-[11px] font-semibold leading-tight">
        {label_bn}
      </div>

      {/* Item chips */}
      <div className="mt-2 flex min-h-[28px] flex-wrap justify-center gap-1">
        {items.length === 0 ? (
          <span className="text-[10px] text-muted-foreground">
            {canPlace ? "এখানে ক্লিক করুন" : "—"}
          </span>
        ) : (
          items.map((it) => {
            const ok = it.status === expected;
            return (
              <span
                key={it.id}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  ok
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-rose-300 bg-rose-50 text-rose-800"
                }`}
              >
                {it.formula}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
