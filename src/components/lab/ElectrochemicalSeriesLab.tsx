/**
 * Electrochemical Series Basics — interactive concept visualizer.
 * Class 9-10 NCTB (Chapter 8) — তড়িৎ-রাসায়নিক সারি
 */
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  RotateCcw,
  Info,
  Lightbulb,
  Zap,
  CheckCircle2,
  XCircle,
  FlaskConical,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  ELECTROCHEMICAL_SERIES,
  type SeriesMetal,
} from "@/lib/electrochemical-series";

interface Props {
  onBack: () => void;
}

const MD_R = [remarkMath];
const MD_H = [rehypeKatex];

function md(text: string) {
  return (
    <ReactMarkdown remarkPlugins={MD_R} rehypePlugins={MD_H}>
      {text}
    </ReactMarkdown>
  );
}

type Reaction = {
  reactive: SeriesMetal;
  salt: SeriesMetal;
  willReact: boolean;
};

export default function ElectrochemicalSeriesLab({ onBack }: Props) {
  const data = ELECTROCHEMICAL_SERIES;
  const [selectedMetal, setSelectedMetal] = useState<SeriesMetal | null>(null);
  const [reactant, setReactant] = useState<SeriesMetal | null>(null);
  const [saltOf, setSaltOf] = useState<SeriesMetal | null>(null);
  const [simRun, setSimRun] = useState(false);

  const result: Reaction | null = useMemo(() => {
    if (!reactant || !saltOf) return null;
    const iR = data.series.findIndex((m) => m.symbol === reactant.symbol);
    const iS = data.series.findIndex((m) => m.symbol === saltOf.symbol);
    return { reactive: reactant, salt: saltOf, willReact: iR < iS && iR !== -1 };
  }, [reactant, saltOf, data.series]);

  const reset = () => {
    setSelectedMetal(null);
    setReactant(null);
    setSaltOf(null);
    setSimRun(false);
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-bold md:text-2xl">{data.title}</h1>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Definition */}
      <Card className="mb-4 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-slate-800 md:text-base">
            {data.definition}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Series Column */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">সক্রিয়তা সারি</h2>
            <div className="flex flex-col items-end text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3" /> More Reactive
              </span>
              <span className="flex items-center gap-1">
                <ArrowDown className="h-3 w-3" /> Less Reactive
              </span>
            </div>
          </div>

          <ol className="space-y-1.5">
            {data.series.map((m, i) => {
              const isSelected = selectedMetal?.symbol === m.symbol;
              const isH = m.symbol === "H";
              return (
                <li key={m.symbol}>
                  <button
                    onClick={() => setSelectedMetal(isSelected ? null : m)}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2 text-left transition-all hover:scale-[1.01] hover:shadow-md ${
                      isSelected
                        ? "border-slate-900 bg-white shadow-lg"
                        : "border-transparent bg-slate-50 hover:border-slate-300"
                    } ${isH ? "border-dashed border-slate-400" : ""}`}
                    style={
                      isSelected
                        ? { borderColor: m.color, boxShadow: `0 4px 16px -4px ${m.color}40` }
                        : undefined
                    }
                  >
                    <span className="w-5 text-xs font-mono text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-md font-bold text-white shadow-sm"
                      style={{ background: m.color }}
                    >
                      {m.symbol}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {m.reactivity}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Key point */}
          <div className="mt-4 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              <p className="text-xs leading-relaxed text-indigo-900">
                {data.key_point}
              </p>
            </div>
          </div>
        </Card>

        {/* Right column: details + simulator */}
        <div className="space-y-4">
          {/* Selected metal detail */}
          <Card className="p-4">
            <h2 className="mb-2 text-base font-semibold">নির্বাচিত ধাতুর তথ্য</h2>
            {selectedMetal ? (
              <div className="rounded-lg border-2 p-3"
                style={{
                  borderColor: selectedMetal.color,
                  background: `linear-gradient(135deg, ${selectedMetal.color}10, ${selectedMetal.color}05)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white shadow-md"
                    style={{ background: selectedMetal.color }}
                  >
                    {selectedMetal.symbol}
                  </span>
                  <div className="flex-1">
                    <div className="text-lg font-bold">{selectedMetal.name}</div>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {selectedMetal.reactivity}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{selectedMetal.note}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                বাম পাশের সারি থেকে যেকোনো ধাতু ক্লিক করুন।
              </p>
            )}
          </Card>

          {/* Example */}
          <Card className="border-2 border-emerald-200 bg-emerald-50/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-emerald-700" />
              <h2 className="text-base font-semibold text-emerald-900">
                উদাহরণ বিক্রিয়া
              </h2>
            </div>
            <div className="rounded-md bg-white px-3 py-2 text-center text-sm shadow-inner">
              {md(`$${data.example.equation}$`)}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">
              {data.example.explanation}
            </p>
          </Card>

          {/* Displacement simulator */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-rose-600" />
              <h2 className="text-base font-semibold">প্রতিস্থাপন সিমুলেটর</h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              একটি ধাতু (Reactant) এবং একটি লবণ-দ্রবণ (Salt of Metal) বেছে নিন।
              দেখুন উপরের ধাতু কীভাবে নিচের ধাতুকে প্রতিস্থাপন করে।
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
                  ধাতু (Reactant)
                </div>
                <select
                  className="w-full rounded-md border-2 border-slate-200 bg-white px-2 py-1.5 text-sm"
                  value={reactant?.symbol ?? ""}
                  onChange={(e) => {
                    setSimRun(false);
                    const m = data.series.find((x) => x.symbol === e.target.value);
                    setReactant(m ?? null);
                  }}
                >
                  <option value="">— বাছাই —</option>
                  {data.series
                    .filter((m) => m.symbol !== "H")
                    .map((m) => (
                      <option key={m.symbol} value={m.symbol}>
                        {m.symbol} · {m.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
                  লবণ-দ্রবণ (Salt of)
                </div>
                <select
                  className="w-full rounded-md border-2 border-slate-200 bg-white px-2 py-1.5 text-sm"
                  value={saltOf?.symbol ?? ""}
                  onChange={(e) => {
                    setSimRun(false);
                    const m = data.series.find((x) => x.symbol === e.target.value);
                    setSaltOf(m ?? null);
                  }}
                >
                  <option value="">— বাছাই —</option>
                  {data.series
                    .filter((m) => m.symbol !== "H")
                    .map((m) => (
                      <option key={m.symbol} value={m.symbol}>
                        {m.symbol} · {m.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <Button
              className="mt-3 w-full"
              disabled={!reactant || !saltOf || reactant.symbol === saltOf.symbol}
              onClick={() => setSimRun(true)}
            >
              বিক্রিয়া চালান
            </Button>

            {simRun && result && (
              <div
                className={`mt-3 rounded-lg border-2 p-3 ${
                  result.willReact
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-rose-300 bg-rose-50"
                }`}
              >
                {/* Beaker visualization */}
                <div className="mb-3 flex items-center justify-center gap-3">
                  <svg viewBox="0 0 120 140" className="h-32 w-28">
                    {/* Beaker */}
                    <path
                      d="M20 30 L20 120 Q20 130 30 130 L90 130 Q100 130 100 120 L100 30"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="2.5"
                    />
                    <line x1="15" y1="30" x2="105" y2="30" stroke="#475569" strokeWidth="2" />
                    {/* Solution */}
                    <path
                      d="M22 60 L22 118 Q22 128 32 128 L88 128 Q98 128 98 118 L98 60 Z"
                      fill={result.salt.color}
                      opacity="0.35"
                    />
                    {/* Metal strip (reactant) dipped in */}
                    <rect
                      x="55"
                      y="20"
                      width="10"
                      height="90"
                      fill={result.reactive.color}
                      stroke="#1e293b"
                      strokeWidth="1"
                      rx="1"
                    />
                    {/* Deposit/bubbles if reacts */}
                    {result.willReact && (
                      <>
                        <rect
                          x="53"
                          y="60"
                          width="14"
                          height="50"
                          fill={result.salt.color}
                          opacity="0.85"
                          rx="1"
                        />
                        {[0, 1, 2, 3].map((i) => (
                          <circle
                            key={i}
                            cx={40 + i * 12}
                            cy={90 - (i % 2) * 10}
                            r="3"
                            fill="#fff"
                            opacity="0.9"
                          />
                        ))}
                      </>
                    )}
                    <text x="60" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e293b">
                      {result.reactive.symbol}
                    </text>
                  </svg>

                  <div className="text-center text-xs">
                    <div className="font-mono text-sm">
                      {md(
                        `$${result.reactive.symbol} + ${result.salt.symbol}SO_4 \\rightarrow ${
                          result.willReact
                            ? `${result.reactive.symbol}SO_4 + ${result.salt.symbol}`
                            : "?"
                        }$`,
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  {result.willReact ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  )}
                  <p className="text-xs leading-relaxed">
                    {result.willReact ? (
                      <>
                        <strong>বিক্রিয়া ঘটবে ✓</strong> — {result.reactive.name} (
                        {result.reactive.symbol}) সারিতে {result.salt.name} (
                        {result.salt.symbol})-এর ওপরে থাকায় এটি দ্রবণ থেকে{" "}
                        {result.salt.symbol}-কে প্রতিস্থাপন করবে।
                      </>
                    ) : (
                      <>
                        <strong>বিক্রিয়া ঘটবে না ✗</strong> — {result.reactive.name} (
                        {result.reactive.symbol}) সারিতে {result.salt.name} (
                        {result.salt.symbol})-এর নিচে / সমান অবস্থানে আছে, তাই এটি
                        প্রতিস্থাপন করতে পারবে না।
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Exam tricks */}
      <Card className="mt-4 border-2 border-fuchsia-200 bg-fuchsia-50/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-fuchsia-700" />
          <h2 className="text-base font-semibold text-fuchsia-900">
            পরীক্ষার টিপস ও ছন্দ
          </h2>
        </div>
        <ul className="space-y-2">
          {data.exam_tricks.map((t, i) => (
            <li
              key={i}
              className="rounded-md bg-white px-3 py-2 text-xs leading-relaxed shadow-sm"
            >
              {t}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
