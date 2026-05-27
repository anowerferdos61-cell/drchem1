/**
 * Interactive Indicator Comparison Lab — bilingual (Bangla + English).
 * Pick an indicator (dropper), then drop into Acid (HCl) / Neutral (Water) / Base (NaOH).
 * Watch each beaker change color according to the chosen indicator + medium.
 */
import { useState } from "react";
import { ArrowLeft, FlaskConical, Droplet, RotateCcw, Info, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface Props {
  onBack: () => void;
}

type Medium = "acid" | "neutral" | "base";
type IndicatorId = "litmus" | "phenolphthalein" | "methyl_orange";

interface Indicator {
  id: IndicatorId;
  name_bn: string;
  name_en: string;
  acid_color: string; // hex
  acid_label: string;
  neutral_color: string;
  neutral_label: string;
  base_color: string;
  base_label: string;
  note: string;
  drop_color: string; // dropper visual color
}

const INDICATORS: Indicator[] = [
  {
    id: "litmus",
    name_bn: "লিটমাস পেপার",
    name_en: "Litmus",
    acid_color: "#EF4444",
    acid_label: "লাল (Red)",
    neutral_color: "#A855F7",
    neutral_label: "বেগুনি (Purple)",
    base_color: "#3B82F6",
    base_label: "নীল (Blue)",
    note: "ল্যাবরেটরিতে অম্ল ও ক্ষার চেনার জন্য সবচেয়ে সহজ এবং বহুল ব্যবহৃত নির্দেশক।",
    drop_color: "#7C3AED",
  },
  {
    id: "phenolphthalein",
    name_bn: "ফেনলফথ্যালিন",
    name_en: "Phenolphthalein",
    acid_color: "#FFFFFF",
    acid_label: "বর্ণহীন (Colorless)",
    neutral_color: "#FFFFFF",
    neutral_label: "বর্ণহীন (Colorless)",
    base_color: "#EC4899",
    base_label: "গোলাপি (Pink)",
    note: "অম্লীয় ও নিরপেক্ষ দ্রবণে এটি কোনো রঙ পরিবর্তন করে না, কিন্তু ক্ষারীয় দ্রবণে উজ্জ্বল গোলাপি বর্ণ ধারণ করে। টাইট্রেশনে ব্যাপকভাবে ব্যবহৃত।",
    drop_color: "#EC4899",
  },
  {
    id: "methyl_orange",
    name_bn: "মিথাইল অরেঞ্জ",
    name_en: "Methyl Orange",
    acid_color: "#DC2626",
    acid_label: "গোলাপি-লাল (Pinkish Red)",
    neutral_color: "#F97316",
    neutral_label: "কমলা (Orange)",
    base_color: "#EAB308",
    base_label: "হলুদ (Yellow)",
    note: "তীব্র অ্যাসিড ও মৃদু ক্ষারের টাইট্রেশনে এই নির্দেশকটি ব্যবহার করা সবচেয়ে উপযোগী।",
    drop_color: "#F97316",
  },
];

const MEDIA: Array<{
  id: Medium;
  formula: string;
  name_bn: string;
  name_en: string;
  badge: string;
  badgeColor: string;
}> = [
  { id: "acid", formula: "HCl", name_bn: "অ্যাসিড", name_en: "Acid", badge: "pH < 7", badgeColor: "#EF4444" },
  { id: "neutral", formula: "H₂O", name_bn: "নিরপেক্ষ", name_en: "Neutral", badge: "pH = 7", badgeColor: "#10B981" },
  { id: "base", formula: "NaOH", name_bn: "ক্ষার", name_en: "Base", badge: "pH > 7", badgeColor: "#3B82F6" },
];

function colorFor(ind: Indicator, m: Medium): string {
  if (m === "acid") return ind.acid_color;
  if (m === "neutral") return ind.neutral_color;
  return ind.base_color;
}
function labelFor(ind: Indicator, m: Medium): string {
  if (m === "acid") return ind.acid_label;
  if (m === "neutral") return ind.neutral_label;
  return ind.base_label;
}

export default function IndicatorLab({ onBack }: Props) {
  const [selected, setSelected] = useState<IndicatorId | null>(null);
  // For each beaker, which indicator has been dropped (null = colorless water look)
  const [drops, setDrops] = useState<Record<Medium, IndicatorId | null>>({
    acid: null,
    neutral: null,
    base: null,
  });

  const currentIndicator = INDICATORS.find((i) => i.id === selected) ?? null;

  const handleDrop = (m: Medium) => {
    if (!selected) return;
    setDrops((d) => ({ ...d, [m]: selected }));
  };

  const reset = () => {
    setDrops({ acid: null, neutral: null, base: null });
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Experiments
          </Button>
          <FlaskConical className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base font-bold leading-tight">
              Indicator Comparison · অম্ল-ক্ষার নির্দেশক তুলনা
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Litmus · Phenolphthalein · Methyl Orange — Class 9-10
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
        </Button>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 md:grid-cols-5">
        {/* === LEFT: Interactive bench === */}
        <div className="md:col-span-3 space-y-4">
          {/* Dropper picker */}
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Droplet className="h-4 w-4 text-primary" /> Step 1 · একটি নির্দেশক বাছুন (ড্রপার)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {INDICATORS.map((ind) => {
                const active = selected === ind.id;
                const isLitmus = ind.id === "litmus";
                return (
                  <button
                    key={ind.id}
                    onClick={() => setSelected(ind.id)}
                    className={`group relative flex flex-col items-center rounded-xl border-2 p-3 transition ${
                      active
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-transparent bg-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    {isLitmus ? (
                      /* Litmus paper strip */
                      <svg viewBox="0 0 40 80" className="h-16 w-10">
                        <defs>
                          <linearGradient id="litmus-strip" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0" stopColor="#C7B8E8" />
                            <stop offset="0.5" stopColor="#A855F7" />
                            <stop offset="1" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                        <rect
                          x="13"
                          y="6"
                          width="14"
                          height="68"
                          rx="1.5"
                          fill="url(#litmus-strip)"
                          stroke="#64748b"
                          strokeWidth="1"
                        />
                        <line x1="13" y1="24" x2="27" y2="24" stroke="#fff" strokeOpacity="0.35" />
                        <line x1="13" y1="42" x2="27" y2="42" stroke="#fff" strokeOpacity="0.35" />
                        <line x1="13" y1="60" x2="27" y2="60" stroke="#fff" strokeOpacity="0.35" />
                      </svg>
                    ) : (
                      /* Dropper SVG */
                      <svg viewBox="0 0 40 80" className="h-16 w-10">
                        <rect x="14" y="2" width="12" height="14" rx="3" fill="#475569" />
                        <rect x="16" y="16" width="8" height="38" fill="#e2e8f0" stroke="#64748b" />
                        <rect
                          x="17"
                          y="22"
                          width="6"
                          height="30"
                          fill={ind.drop_color}
                          opacity="0.85"
                        />
                        <path d="M16 54 L24 54 L22 70 Q20 76 18 70 Z" fill={ind.drop_color} />
                        <circle cx="20" cy="78" r="2" fill={ind.drop_color} />
                      </svg>
                    )}
                    <div className="mt-1 text-center text-[11px] font-semibold leading-tight">
                      {ind.name_bn}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{ind.name_en}</div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {selected
                ? selected === "litmus"
                  ? `✅ ${currentIndicator?.name_bn} সিলেক্ট হয়েছে — বিকারে ক্লিক করে পেপারটি ডুবান।`
                  : `✅ ${currentIndicator?.name_bn} সিলেক্ট হয়েছে — এখন যেকোনো বিকারে ক্লিক করুন।`
                : "👆 একটি ড্রপার বা পেপার সিলেক্ট করুন, তারপর বিকারে ক্লিক করুন।"}
            </p>

          </Card>

          {/* Beakers */}
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Step 2 · বিকারে ফোঁটা দিন
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {MEDIA.map((m) => {
                const droppedId = drops[m.id];
                const droppedInd = INDICATORS.find((i) => i.id === droppedId) ?? null;
                const isLitmusDropped = droppedId === "litmus";

                // Native solution tint (when litmus is dipped OR nothing dropped)
                const nativeTint =
                  m.id === "acid"
                    ? "#EAF6FF"
                    : m.id === "base"
                      ? "#FFFBEA"
                      : "#E0F2FE";

                // Liquid colour: native if litmus (paper doesn't recolor solution)
                const fill =
                  droppedInd && !isLitmusDropped
                    ? colorFor(droppedInd, m.id)
                    : droppedInd
                      ? nativeTint
                      : "#E0F2FE";
                const isWhite = fill.toUpperCase() === "#FFFFFF";

                // Litmus submerged-half colour by pH of medium
                const litmusSubmergedColor =
                  m.id === "acid" ? "#EF4444" : m.id === "base" ? "#3B82F6" : "#A855F7";
                const litmusSubmergedLabel =
                  m.id === "acid"
                    ? "পেপার লাল হবে (Paper turns Red)"
                    : m.id === "base"
                      ? "পেপার নীল হবে (Paper turns Blue)"
                      : "পেপার বেগুনি হবে (Paper turns Purple)";

                const subtext = !droppedInd
                  ? selected
                    ? "ক্লিক করুন"
                    : ""
                  : isLitmusDropped
                    ? `→ ${litmusSubmergedLabel}`
                    : `→ ${labelFor(droppedInd, m.id)}`;

                return (
                  <button
                    key={m.id}
                    onClick={() => handleDrop(m.id)}
                    disabled={!selected}
                    className={`group relative flex flex-col items-center rounded-xl border-2 p-2 transition ${
                      selected
                        ? "cursor-pointer border-dashed border-primary/40 hover:border-primary hover:shadow-md"
                        : "cursor-not-allowed border-transparent opacity-90"
                    }`}
                  >
                    <span
                      className="mb-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: m.badgeColor }}
                    >
                      {m.badge}
                    </span>
                    {/* Beaker SVG */}
                    <svg viewBox="0 0 120 140" className="h-32 w-full">
                      <defs>
                        <linearGradient id={`glass-${m.id}`} x1="0" x2="1">
                          <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
                          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.2" />
                          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
                        </linearGradient>
                        <linearGradient
                          id={`litmus-${m.id}`}
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          {/* upper half: native neutral, lower half: pH-reactive colour */}
                          <stop offset="0%" stopColor="#C7B8E8" />
                          <stop offset="49%" stopColor="#A855F7" />
                          <stop offset="51%" stopColor={litmusSubmergedColor} />
                          <stop offset="100%" stopColor={litmusSubmergedColor} />
                        </linearGradient>
                      </defs>
                      {/* Liquid */}
                      <path
                        d="M22 55 L98 55 L98 122 Q98 132 88 132 L32 132 Q22 132 22 122 Z"
                        fill={fill}
                        stroke={isWhite ? "#cbd5e1" : "none"}
                        strokeWidth="1"
                        style={{ transition: "fill 0.4s" }}
                      />
                      {/* Glass overlay */}
                      <path
                        d="M18 30 L102 30 L102 42 L98 42 L98 122 Q98 134 86 134 L34 134 Q22 134 22 122 L22 42 L18 42 Z"
                        fill={`url(#glass-${m.id})`}
                        stroke="#475569"
                        strokeWidth="2"
                      />
                      {/* Spout */}
                      <path d="M18 30 L8 24 L8 28 L17 34" fill="none" stroke="#475569" strokeWidth="2" />
                      {/* Tick marks */}
                      <g stroke="#64748b" strokeWidth="1">
                        <line x1="22" y1="70" x2="32" y2="70" />
                        <line x1="22" y1="90" x2="32" y2="90" />
                        <line x1="22" y1="110" x2="32" y2="110" />
                      </g>
                      {/* Formula label inside */}
                      <text
                        x="60"
                        y="48"
                        textAnchor="middle"
                        fontSize="12"
                        fill="#0f172a"
                        fontWeight="700"
                      >
                        {m.formula}
                      </text>
                      {/* Litmus strip dipped in (angled) — only when litmus is dropped */}
                      {isLitmusDropped && (
                        <g
                          className="origin-center animate-fade-in"
                          transform="rotate(-12 65 90)"
                        >
                          <rect
                            x="58"
                            y="20"
                            width="14"
                            height="95"
                            rx="1.5"
                            fill={`url(#litmus-${m.id})`}
                            stroke="#475569"
                            strokeWidth="1"
                            style={{ transition: "fill 0.4s" }}
                          />
                          <line x1="58" y1="40" x2="72" y2="40" stroke="#fff" strokeOpacity="0.3" />
                          <line x1="58" y1="78" x2="72" y2="78" stroke="#fff" strokeOpacity="0.3" />
                          {/* meniscus ripple at liquid surface */}
                          <ellipse cx="65" cy="68" rx="9" ry="1.5" fill="#fff" fillOpacity="0.5" />
                        </g>
                      )}
                    </svg>
                    <div className="text-center text-[11px] font-semibold leading-tight">
                      {m.name_bn} · {m.name_en}
                    </div>
                    <div className="mt-0.5 min-h-[16px] text-center text-[10px] text-muted-foreground">
                      {subtext}
                    </div>
                  </button>
                );
              })}
            </div>

          </Card>

          {/* Comparison Table */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">তুলনামূলক ছক · Comparison Table</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">নির্দেশক</TableHead>
                    <TableHead className="text-xs">অ্যাসিডে (HCl)</TableHead>
                    <TableHead className="text-xs">নিরপেক্ষ (H₂O)</TableHead>
                    <TableHead className="text-xs">ক্ষারে (NaOH)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INDICATORS.map((ind) => (
                    <TableRow key={ind.id}>
                      <TableCell className="text-xs font-semibold">
                        {ind.name_bn}
                        <div className="text-[10px] font-normal text-muted-foreground">
                          {ind.name_en}
                        </div>
                      </TableCell>
                      <ColorCell hex={ind.acid_color} label={ind.acid_label} />
                      <ColorCell hex={ind.neutral_color} label={ind.neutral_label} />
                      <ColorCell hex={ind.base_color} label={ind.base_label} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* === RIGHT: Theory & tips === */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Info className="h-4 w-4 text-primary" /> নির্দেশক কী?
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              যে সকল রাসায়নিক পদার্থ অম্লীয় বা ক্ষারীয় দ্রবণে ভিন্ন ভিন্ন বর্ণ ধারণ করে দ্রবণের
              প্রকৃতি নির্দেশ করে, তাদেরকে <b>অম্ল-ক্ষার নির্দেশক</b> (acid-base indicator) বলে।
            </p>
          </Card>

          {INDICATORS.map((ind) => (
            <Card key={ind.id} className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border"
                  style={{ background: ind.drop_color }}
                />
                <span className="text-sm font-semibold">{ind.name_bn}</span>
                <span className="text-[10px] text-muted-foreground">({ind.name_en})</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{ind.note}</p>
            </Card>
          ))}

          <Card className="border-amber-300 bg-amber-50 p-3">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" /> Exam Tip · বোর্ড প্রশ্ন
            </h3>
            <div className="prose prose-sm max-w-none text-xs leading-relaxed text-amber-900">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {
                  "এসএসসি পরীক্ষায় এই ছকটি অত্যন্ত গুরুত্বপূর্ণ। বিশেষ করে:\n\n• **ফেনলফথ্যালিন অ্যাসিডে কী বর্ণ দেয়?** → বর্ণহীন\n\n• **ক্ষারীয় দ্রবণে মিথাইল অরেঞ্জের বর্ণ?** → হলুদ\n\n• **লিটমাসের অম্লীয় বর্ণ?** → লাল"
                }
              </ReactMarkdown>
            </div>
          </Card>

          <Card className="border-dashed bg-slate-50 p-3 text-xs text-slate-700">
            💡 ড্রপার সিলেক্ট করে তিনটি বিকারে ফোঁটা দিন — দ্রবণের প্রকৃতি অনুসারে প্রতিটি নির্দেশক
            কীভাবে আলাদা রঙে রূপান্তরিত হচ্ছে লক্ষ্য করুন।
          </Card>
        </div>
      </div>
    </div>
  );
}

function ColorCell({ hex, label }: { hex: string; label: string }) {
  const isWhite = hex.toUpperCase() === "#FFFFFF";
  return (
    <TableCell className="text-xs">
      <div className="flex items-center gap-2">
        <span
          className="h-5 w-5 shrink-0 rounded-full border"
          style={{ background: hex, borderColor: isWhite ? "#cbd5e1" : "transparent" }}
        />
        <span className="leading-tight">{label}</span>
      </div>
    </TableCell>
  );
}
