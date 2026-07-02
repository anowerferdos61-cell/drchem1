/**
 * Interactive pH Scale Lesson — bilingual (Bangla + English).
 * Optimized for mobile-landscape: fits in one viewport, no scroll on main panel.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, Droplets, FlaskConical, Info, Lightbulb, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface Props {
  onBack: () => void;
}

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
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
}
const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
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
  { name: "লেবুর রস (Lemon)", pH: 2.0 },
  { name: "টমেটোর রস (Tomato)", pH: 4.0 },
  { name: "বিশুদ্ধ পানি (Water)", pH: 7.0 },
  { name: "রক্ত (Blood)", pH: 7.4 },
  { name: "মিল্ক অব ম্যাগনেসিয়া", pH: 10.5 },
  { name: "সোডিয়াম হাইড্রক্সাইড", pH: 14.0 },
];

const REAL_LIFE = [
  "কৃষিকাজে: মাটির pH (৬-৮) নিয়ন্ত্রণ করে ফসলের উৎপাদন বাড়ানো যায়। মাটি বেশি অম্লীয় হলে চুন ($CaCO_3$ বা $CaO$) ব্যবহার করা হয়।",
  "প্রসাধন: ত্বকের স্বাভাবিক pH ~৫.৫, তাই সাবান/শ্যাম্পুর pH ভারসাম্য জরুরি।",
  "পাকস্থলী: খাদ্য হজম করতে পাকস্থলীর pH ~১.০-১.৫।",
];

const MISTAKES = [
  "ভুল: pH ঋণাত্মক হতে পারে না। (সংশোধন: অত্যন্ত তীব্র অ্যাসিডে pH ঋণাত্মক হতে পারে, তবে NCTB-তে ০-১৪ সীমা।)",
  "ভুল: pH বাড়লে অম্লত্ব বাড়ে। (সংশোধন: pH যত কম, $H^+$ তত বেশি, অম্লত্ব তত তীব্র।)",
];

export default function PHScaleLab({ onBack }: Props) {
  const [pH, setPH] = useState(7);

  const color = useMemo(() => indicatorColor(pH), [pH]);
  const cat = useMemo(() => categoryLabel(pH), [pH]);
  const hConc = useMemo(() => Math.pow(10, -pH), [pH]);
  const ohConc = useMemo(() => Math.pow(10, -(14 - pH)), [pH]);

  const hCount = Math.max(1, Math.min(30, Math.round(30 - pH * 2.1)));
  const ohCount = Math.max(1, Math.min(30, Math.round(pH * 2.1)));

  const closestExample = useMemo(
    () => [...EXAMPLES].sort((a, b) => Math.abs(a.pH - pH) - Math.abs(b.pH - pH))[0],
    [pH]
  );

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100 text-base">
      {/* Compact header */}
      <header className="flex shrink-0 items-center justify-between border-b bg-white/80 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> <span className="text-sm">Back</span>
          </Button>
          <FlaskConical className="h-5 w-5 shrink-0 text-primary" />
          <h1 className="truncate text-base font-bold sm:text-lg">
            pH Scale · pH স্কেল
          </h1>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-white"
          style={{ background: cat.color }}
        >
          {cat.type}
        </span>
      </header>

      {/* Main split — always 2 columns to fit landscape */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 sm:grid-cols-5">
        {/* LEFT: Beaker + slider (compact, no scroll) */}
        <div className="sm:col-span-3 flex min-h-0 flex-col gap-2">
          <Card className="relative flex-1 overflow-hidden">
            <div
              className="absolute inset-0 transition-colors duration-300"
              style={{
                background: `linear-gradient(180deg, ${color}22 0%, ${color}aa 60%, ${color} 100%)`,
              }}
            />
            <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet" className="relative h-full w-full">
              <defs>
                <linearGradient id="glassPh" x1="0" x2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
                  <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <path
                d="M120 40 L280 40 L280 60 L270 60 L270 240 Q270 255 255 255 L145 255 Q130 255 130 240 L130 60 L120 60 Z"
                fill="url(#glassPh)"
                stroke="#475569"
                strokeWidth="2"
              />
              <path
                d="M132 110 L268 110 L268 240 Q268 253 255 253 L145 253 Q132 253 132 240 Z"
                fill={color}
                opacity="0.85"
              />
              {Array.from({ length: hCount }).map((_, i) => {
                const x = 140 + ((i * 17) % 120);
                const y = 130 + ((i * 23) % 110);
                return (
                  <g key={`h-${i}`}>
                    <circle cx={x} cy={y} r="7" fill="#fecaca" stroke="#b91c1c" />
                    <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fill="#7f1d1d" fontWeight="bold">
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
                    <circle cx={x} cy={y} r="8" fill="#bfdbfe" stroke="#1d4ed8" />
                    <text x={x} y={y + 3} textAnchor="middle" fontSize="7" fill="#1e3a8a" fontWeight="bold">
                      OH⁻
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Big pH readout */}
            <div className="absolute right-2 top-2 rounded-2xl bg-black/70 px-3 py-1.5 text-white shadow-xl backdrop-blur">
              <div className="text-[10px] uppercase tracking-widest opacity-70">pH</div>
              <div className="font-mono text-3xl font-bold leading-none">{pH.toFixed(1)}</div>
            </div>

            {/* Ion readout floating bottom-left */}
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              <div className="rounded-md bg-rose-500/90 px-2 py-1 text-xs font-mono text-white shadow">
                [H⁺] {hConc.toExponential(1)}
              </div>
              <div className="rounded-md bg-blue-500/90 px-2 py-1 text-xs font-mono text-white shadow">
                [OH⁻] {ohConc.toExponential(1)}
              </div>
            </div>
          </Card>

          {/* Slider — always visible */}
          <Card className="shrink-0 space-y-2 p-3">
            <div
              className="h-2.5 w-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg,#b91c1c,#ef4444,#f97316,#eab308,#10b981,#14b8a6,#3b82f6,#6366f1,#7c3aed)",
              }}
            />
            <Slider value={[pH]} min={0} max={14} step={0.1} onValueChange={(v) => setPH(v[0])} />
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-rose-600">0 · Acid</span>
              <span className="text-muted-foreground">
                Closest: <span className="font-semibold">{closestExample.name}</span> (pH {closestExample.pH})
              </span>
              <span className="font-semibold text-indigo-600">14 · Base</span>
            </div>
          </Card>
        </div>

        {/* RIGHT: Scrollable theory */}
        <div className="sm:col-span-2 min-h-0">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              <Card className="p-3">
                <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold sm:text-base">
                  <Info className="h-4 w-4 text-primary" /> সংজ্ঞা
                </h3>
                <div className="prose prose-sm max-w-none text-sm leading-relaxed sm:text-base">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {"হাইড্রোজেন আয়নের ($H^+$) মোলার ঘনমাত্রার ঋণাত্মক লগারিদমকে pH বলে।\n\n$$pH = -\\log[H^+]$$\n\n$$pH + pOH = 14$$"}
                  </ReactMarkdown>
                </div>
              </Card>

              <Card className="p-3">
                <h3 className="mb-2 text-sm font-semibold sm:text-base">দ্রুত নির্বাচন</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {EXAMPLES.map((ex) => {
                    const active = Math.abs(ex.pH - pH) < 0.5;
                    return (
                      <button
                        key={ex.name}
                        onClick={() => setPH(ex.pH)}
                        className={`flex items-center gap-1.5 rounded-md border p-1.5 text-left transition ${
                          active ? "border-primary bg-primary/5" : "hover:bg-accent"
                        }`}
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border"
                          style={{ background: indicatorColor(ex.pH) }}
                        />
                        <span className="flex-1 truncate text-xs sm:text-sm">{ex.name}</span>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:text-xs">
                          {ex.pH}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-3">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold sm:text-base">
                  <Droplets className="h-4 w-4 text-primary" /> ক্যাটাগরি
                </h3>
                <div className="space-y-1.5">
                  <Row color="#EF4444" type="Acidic · অম্লীয়" range="0 – 6.9" desc="pH < 7। মান যত কম, অ্যাসিড তত শক্তিশালী।" />
                  <Row color="#10B981" type="Neutral · নিরপেক্ষ" range="= 7" desc="বিশুদ্ধ পানি, [H⁺]=[OH⁻]=10⁻⁷ M।" />
                  <Row color="#3B82F6" type="Basic · ক্ষারীয়" range="7.1 – 14" desc="pH > 7। মান যত বেশি, ক্ষার তত শক্তিশালী।" />
                </div>
              </Card>

              <Card className="p-3">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold sm:text-base">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> বাস্তব প্রয়োগ
                </h3>
                <ul className="space-y-1.5 text-sm leading-relaxed">
                  {REAL_LIFE.map((r, i) => (
                    <li key={i} className="prose prose-sm max-w-none text-sm">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {`• ${r}`}
                      </ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </Card>

              <Accordion type="single" collapsible>
                <AccordionItem value="m">
                  <AccordionTrigger className="text-sm sm:text-base">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-500" /> ভুল ধারণা
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1.5 text-sm">
                      {MISTAKES.map((m, i) => (
                        <li key={i} className="prose prose-sm max-w-none rounded border-l-2 border-rose-400 bg-rose-50 p-2 text-sm">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {m}
                          </ReactMarkdown>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Card className="border-dashed bg-amber-50 p-2.5 text-sm text-amber-900">
                💡 স্লাইডার টেনে pH পরিবর্তন করুন এবং রঙ ও আয়নের তারতম্য দেখুন।
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function Row({ color, type, range, desc }: { color: string; type: string; range: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border p-1.5">
      <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{type}</span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground sm:text-xs">{range}</span>
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">{desc}</p>
      </div>
    </div>
  );
}
