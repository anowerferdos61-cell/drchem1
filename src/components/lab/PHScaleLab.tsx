/**
 * Interactive pH Scale Lesson — bilingual (Bangla + English).
 * Drag the slider 0..14 to see the Universal Indicator color shift,
 * H⁺/OH⁻ particle balance, and matched real-world examples.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, Droplets, FlaskConical, Info, Lightbulb, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface Props {
  onBack: () => void;
}

// Universal-indicator color stops (pH 0..14)
const INDICATOR_STOPS: Array<{ pH: number; color: string; name: string }> = [
  { pH: 0, color: "#b91c1c", name: "তীব্র অম্ল" },
  { pH: 2, color: "#ef4444", name: "অম্ল" },
  { pH: 4, color: "#f97316", name: "মৃদু অম্ল" },
  { pH: 6, color: "#eab308", name: "প্রায় নিরপেক্ষ" },
  { pH: 7, color: "#10b981", name: "নিরপেক্ষ" },
  { pH: 8, color: "#14b8a6", name: "মৃদু ক্ষার" },
  { pH: 10, color: "#3b82f6", name: "ক্ষার" },
  { pH: 12, color: "#6366f1", name: "তীব্র ক্ষার" },
  { pH: 14, color: "#7c3aed", name: "অতি তীব্র ক্ষার" },
];

function hexToRgb(h: string) {
  const v = h.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}
function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}
function indicatorColor(pH: number): string {
  for (let i = 0; i < INDICATOR_STOPS.length - 1; i++) {
    const a = INDICATOR_STOPS[i];
    const b = INDICATOR_STOPS[i + 1];
    if (pH >= a.pH && pH <= b.pH) {
      const t = (pH - a.pH) / (b.pH - a.pH);
      const ca = hexToRgb(a.color);
      const cb = hexToRgb(b.color);
      return `rgb(${lerp(ca.r, cb.r, t)}, ${lerp(ca.g, cb.g, t)}, ${lerp(ca.b, cb.b, t)})`;
    }
  }
  return INDICATOR_STOPS[INDICATOR_STOPS.length - 1].color;
}
function categoryLabel(pH: number): { type: string; range: string; color: string } {
  if (pH < 7) return { type: "Acidic · অম্লীয়", range: "0 – 6.9", color: "#ef4444" };
  if (Math.abs(pH - 7) < 0.05) return { type: "Neutral · নিরপেক্ষ", range: "7", color: "#10b981" };
  return { type: "Basic · ক্ষারীয়", range: "7.1 – 14", color: "#3b82f6" };
}

const EXAMPLES = [
  { name: "লেবুর রস (Lemon Juice)", pH: 2.0 },
  { name: "টমেটোর রস (Tomato Juice)", pH: 4.0 },
  { name: "বিশুদ্ধ পানি (Pure Water)", pH: 7.0 },
  { name: "রক্ত (Human Blood)", pH: 7.4 },
  { name: "মিল্ক অব ম্যাগনেসিয়া (Milk of Magnesia)", pH: 10.5 },
  { name: "সোডিয়াম হাইড্রক্সাইড (NaOH)", pH: 14.0 },
];

const REAL_LIFE = [
  "কৃষিকাজে: মাটির pH (৬-৮ এর মধ্যে) নিয়ন্ত্রণ করে ফসলের উৎপাদন বাড়ানো যায়। মাটি বেশি অম্লীয় হলে চুন ($CaCO_3$ বা $CaO$) ব্যবহার করা হয়।",
  "প্রসাধন সামগ্রী: আমাদের ত্বকের স্বাভাবিক pH প্রায় ৫.৫, তাই ব্যবহৃত সাবান বা শ্যাম্পুর pH এর ভারসাম্য রক্ষা করা জরুরি।",
  "পাকস্থলী: খাদ্য হজম করতে আমাদের পাকস্থলীর ভেতরের pH প্রায় ১.০ থেকে ১.৫ এর কাছাকাছি থাকে।",
];

const MISTAKES = [
  "ভুল ধারণা: pH এর মান ঋণাত্মক হতে পারে না। (সংশোধন: অত্যন্ত তীব্র অ্যাসিডের ক্ষেত্রে pH এর মান ০ এর কম বা ঋণাত্মকও হতে পারে, তবে NCTB বই অনুযায়ী আমরা ০-১৪ সীমা নিয়ে আলোচনা করি।)",
  "ভুল ধারণা: pH বাড়লে অম্লত্ব বাড়ে। (সংশোধন: pH এর মান যত কমবে, $H^+$ আয়নের ঘনমাত্রা তত বাড়বে এবং অম্লত্ব তত তীব্র হবে।)",
];

export default function PHScaleLab({ onBack }: Props) {
  const [pH, setPH] = useState(7);

  const color = useMemo(() => indicatorColor(pH), [pH]);
  const cat = useMemo(() => categoryLabel(pH), [pH]);
  const hConc = useMemo(() => Math.pow(10, -pH), [pH]);
  const ohConc = useMemo(() => Math.pow(10, -(14 - pH)), [pH]);

  // Particle counts (visual only) — log mapped to 0..40
  const hCount = Math.max(1, Math.min(40, Math.round(40 - pH * 2.8)));
  const ohCount = Math.max(1, Math.min(40, Math.round(pH * 2.8)));

  const closestExample = useMemo(() => {
    return [...EXAMPLES].sort((a, b) => Math.abs(a.pH - pH) - Math.abs(b.pH - pH))[0];
  }, [pH]);

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
              pH Scale · pH স্কেল ও হাইড্রোজেন আয়নের ঘনমাত্রা
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Interactive Universal Indicator · Class 9-10
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 md:grid-cols-5">
        {/* === LEFT: Beaker + slider === */}
        <div className="md:col-span-3 space-y-4">
          <Card className="overflow-hidden">
            <div
              className="relative h-72 w-full transition-colors duration-300"
              style={{
                background: `linear-gradient(180deg, ${color}22 0%, ${color}aa 60%, ${color} 100%)`,
              }}
            >
              {/* Beaker SVG */}
              <svg viewBox="0 0 400 280" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="glassPh" x1="0" x2="1">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
                    <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.15" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                {/* Beaker outline */}
                <path
                  d="M120 40 L280 40 L280 60 L270 60 L270 240 Q270 255 255 255 L145 255 Q130 255 130 240 L130 60 L120 60 Z"
                  fill="url(#glassPh)"
                  stroke="#475569"
                  strokeWidth="2"
                />
                {/* Liquid */}
                <path
                  d="M132 110 L268 110 L268 240 Q268 253 255 253 L145 253 Q132 253 132 240 Z"
                  fill={color}
                  opacity="0.85"
                />
                {/* H+ / OH- floating particles */}
                {Array.from({ length: hCount }).map((_, i) => {
                  const x = 140 + ((i * 17) % 120);
                  const y = 130 + ((i * 23) % 110);
                  return (
                    <g key={`h-${i}`}>
                      <circle cx={x} cy={y} r="6" fill="#fecaca" stroke="#b91c1c" />
                      <text x={x} y={y + 3} textAnchor="middle" fontSize="7" fill="#7f1d1d" fontWeight="bold">
                        H⁺
                      </text>
                    </g>
                  );
                })}
                {Array.from({ length: ohCount }).map((_, i) => {
                  const x = 150 + ((i * 13 + 7) % 110);
                  const y = 140 + ((i * 19 + 11) % 100);
                  return (
                    <g key={`oh-${i}`}>
                      <circle cx={x} cy={y} r="7" fill="#bfdbfe" stroke="#1d4ed8" />
                      <text x={x} y={y + 3} textAnchor="middle" fontSize="6" fill="#1e3a8a" fontWeight="bold">
                        OH⁻
                      </text>
                    </g>
                  );
                })}
                {/* Label */}
                <text x="200" y="80" textAnchor="middle" fontSize="14" fill="#0f172a" fontWeight="600">
                  Universal Indicator
                </text>
              </svg>

              {/* Big pH readout */}
              <div className="absolute right-4 top-4 rounded-2xl bg-black/60 px-4 py-2 text-white shadow-xl backdrop-blur">
                <div className="text-[10px] uppercase tracking-widest opacity-70">pH</div>
                <div className="font-mono text-4xl font-bold leading-none">{pH.toFixed(1)}</div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-600">0 · Acidic</span>
                <span className="font-semibold text-emerald-600">7 · Neutral</span>
                <span className="font-semibold text-indigo-600">14 · Basic</span>
              </div>

              {/* Gradient track */}
              <div
                className="h-3 w-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg,#b91c1c,#ef4444,#f97316,#eab308,#10b981,#14b8a6,#3b82f6,#6366f1,#7c3aed)",
                }}
              />

              <Slider
                value={[pH]}
                min={0}
                max={14}
                step={0.1}
                onValueChange={(v) => setPH(v[0])}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: cat.color }}
                >
                  {cat.type} · {cat.range}
                </span>
                <span className="text-xs text-muted-foreground">
                  Closest: <span className="font-medium">{closestExample.name}</span> (pH {closestExample.pH})
                </span>
              </div>
            </div>
          </Card>

          {/* Ion concentrations */}
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Droplets className="h-4 w-4 text-primary" /> Ion Concentrations · আয়ন ঘনমাত্রা
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border bg-rose-50 p-3">
                <div className="text-[10px] uppercase text-rose-700">[H⁺]</div>
                <div className="font-mono text-base font-bold text-rose-900">
                  {hConc.toExponential(2)} M
                </div>
              </div>
              <div className="rounded-lg border bg-blue-50 p-3">
                <div className="text-[10px] uppercase text-blue-700">[OH⁻]</div>
                <div className="font-mono text-base font-bold text-blue-900">
                  {ohConc.toExponential(2)} M
                </div>
              </div>
            </div>
            <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
              pH = −log[H⁺] &nbsp;·&nbsp; pH + pOH = 14
            </p>
          </Card>

          {/* Examples ladder */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Real Substances · বাস্তব দ্রবণ</h3>
            <div className="space-y-2">
              {EXAMPLES.map((ex) => {
                const active = Math.abs(ex.pH - pH) < 0.5;
                return (
                  <button
                    key={ex.name}
                    onClick={() => setPH(ex.pH)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                      active ? "border-primary bg-primary/5" : "hover:bg-accent"
                    }`}
                  >
                    <span
                      className="h-6 w-6 shrink-0 rounded-full border"
                      style={{ background: indicatorColor(ex.pH) }}
                    />
                    <span className="flex-1 text-xs">{ex.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]">
                      pH {ex.pH}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* === RIGHT: Theory === */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Info className="h-4 w-4 text-primary" /> সংজ্ঞা · Definition
            </h3>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {"কোনো দ্রবণে হাইড্রোজেন আয়নের ($H^+$) মোলার ঘনমাত্রার ঋণাত্মক লগারিদমকে তার pH বলে।\n\n$$pH = -\\log[H^+]$$"}
              </ReactMarkdown>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Categories · ক্যাটাগরি</h3>
            <div className="space-y-2 text-xs">
              <Row color="#EF4444" type="Acidic · অম্লীয়" range="0 – 6.9" desc="pH < 7 হলে অম্লীয়। মান যত কম, অ্যাসিড তত শক্তিশালী।" />
              <Row color="#10B981" type="Neutral · নিরপেক্ষ" range="= 7" desc="বিশুদ্ধ পানি, [H⁺] = [OH⁻] = 10⁻⁷ M।" />
              <Row color="#3B82F6" type="Basic · ক্ষারীয়" range="7.1 – 14" desc="pH > 7 হলে ক্ষারীয়। মান যত বেশি, ক্ষার তত শক্তিশালী।" />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-amber-500" /> বাস্তব প্রয়োগ
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed">
              {REAL_LIFE.map((r, i) => (
                <li key={i} className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {`• ${r}`}
                  </ReactMarkdown>
                </li>
              ))}
            </ul>
          </Card>

          <Accordion type="single" collapsible>
            <AccordionItem value="m">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" /> Common Mistakes · ভুল ধারণা
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-xs">
                  {MISTAKES.map((m, i) => (
                    <li key={i} className="prose prose-sm max-w-none rounded border-l-2 border-rose-400 bg-rose-50 p-2">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {m}
                      </ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card className="border-dashed bg-amber-50 p-3 text-xs text-amber-900">
            💡 স্লাইডারটি ড্র্যাগ করে 0 থেকে 14 এ নিয়ে যান। লক্ষ্য করুন pH পরিবর্তনের সাথে ইউনিভার্সাল ইন্ডিকেটরের রঙ ও দ্রবণে H⁺ / OH⁻ আয়নের তারতম্য কীভাবে ঘটছে।
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ color, type, range, desc }: { color: string; type: string; range: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border p-2">
      <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{type}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{range}</span>
        </div>
        <p className="text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
