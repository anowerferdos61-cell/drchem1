/**
 * MineralsVsRocksLab — Chapter 10 (Mineral Resources: Metals & Non-metals)
 * Bilingual (Bangla + English) theory lab comparing minerals and rocks
 * using the illustrated chart and interactive granite composition explorer.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Languages, Gem, Layers, Sparkles } from "lucide-react";
import chartImg from "@/assets/minerals-vs-rocks.jpg";

type Lang = "bn" | "en";

const L = {
  title: { bn: "খনিজ ও শিলা", en: "Minerals & Rocks" },
  subtitle: {
    bn: "চ্যাপ্টার ১০ · খনিজ সম্পদ: ধাতু ও অধাতু",
    en: "Chapter 10 · Mineral Resources: Metals & Non-metals",
  },
  back: { bn: "ফিরে যান", en: "Back" },
  chart: { bn: "ভিজ্যুয়াল চার্ট", en: "Visual Chart" },
  compare: { bn: "তুলনা", en: "Comparison" },
  granite: { bn: "গ্রানাইট গঠন", en: "Granite Composition" },
  concept: { bn: "মূল ধারণা", en: "Key Concept" },
  mineralDef: {
    bn: "খনিজ (Mineral) হলো প্রকৃতিতে প্রাপ্ত একটি নির্দিষ্ট রাসায়নিক গঠন ও স্ফটিক আকৃতির অজৈব পদার্থ।",
    en: "A mineral is a naturally occurring inorganic substance with a definite chemical composition and crystal structure.",
  },
  rockDef: {
    bn: "শিলা (Rock) হলো এক বা একাধিক খনিজের প্রাকৃতিক মিশ্রণ। শিলাকে বলা যায় খনিজের 'প্যাকেট'।",
    en: "A rock is a naturally occurring mixture of one or more minerals — think of a rock as a 'packet' of minerals.",
  },
  tapMineral: {
    bn: "গ্রানাইটের কণাগুলোতে ক্লিক করুন — কোন খনিজ তা দেখুন।",
    en: "Click a grain in the granite to identify the mineral.",
  },
} as const;

const MINERALS = [
  {
    id: "quartz",
    en: "Quartz",
    bn: "কোয়ার্টজ",
    formula: "SiO₂",
    color: "#cbd5e1",
    descBn: "সিলিকন ও অক্সিজেনের যৌগ। কাচের মতো উজ্জ্বল, ষড়ভুজাকার স্ফটিক।",
    descEn: "Silicon dioxide. Glassy lustre, hexagonal crystal form.",
  },
  {
    id: "mica",
    en: "Mica",
    bn: "মাইকা",
    formula: "K(Mg,Fe)₃AlSi₃O₁₀(OH)₂",
    color: "#334155",
    descBn: "পাতলা শীট-জাতীয় স্তরে বিভক্ত হয়। বিদ্যুৎ অপরিবাহী, তাপ প্রতিরোধী।",
    descEn: "Splits into thin sheet-like layers. Electrical insulator, heat resistant.",
  },
  {
    id: "feldspar",
    en: "Feldspar",
    bn: "ফেল্ডস্পার",
    formula: "KAlSi₃O₈",
    color: "#fca5a5",
    descBn: "অ্যালুমিনিয়াম সিলিকেট যৌগ। গোলাপি বা সাদা ব্লকাকার স্ফটিক।",
    descEn: "Aluminium silicate. Pink or white blocky crystals.",
  },
] as const;

const COMPARISON = [
  { key: "composition", bn: "রাসায়নিক গঠন", en: "Chemical composition",
    mineralBn: "নির্দিষ্ট ও সমসত্ত্ব", mineralEn: "Definite and uniform",
    rockBn: "মিশ্র · খনিজ ভেদে ভিন্ন", rockEn: "Mixed · varies with minerals" },
  { key: "structure", bn: "কণা গঠন", en: "Particle structure",
    mineralBn: "স্ফটিক (crystalline)", mineralEn: "Crystalline",
    rockBn: "দানাদার / স্তরিত মিশ্রণ", rockEn: "Grainy / layered aggregate" },
  { key: "purity", bn: "বিশুদ্ধতা", en: "Purity",
    mineralBn: "বিশুদ্ধ যৌগ বা মৌল", mineralEn: "Pure compound or element",
    rockBn: "অবিশুদ্ধ · হেটারোজেনিয়াস", rockEn: "Impure · heterogeneous" },
  { key: "example", bn: "উদাহরণ", en: "Examples",
    mineralBn: "কোয়ার্টজ, মাইকা, ফেল্ডস্পার, হেমাটাইট", mineralEn: "Quartz, Mica, Feldspar, Hematite",
    rockBn: "গ্রানাইট, মার্বেল, ব্যাসল্ট, চুনাপাথর", rockEn: "Granite, Marble, Basalt, Limestone" },
] as const;

// Granite grain layout — clickable spots on a schematic slab
const GRAINS: Array<{ x: number; y: number; r: number; mineral: (typeof MINERALS)[number]["id"] }> = [
  { x: 60, y: 55, r: 22, mineral: "feldspar" },
  { x: 140, y: 90, r: 18, mineral: "quartz" },
  { x: 210, y: 60, r: 20, mineral: "feldspar" },
  { x: 100, y: 140, r: 14, mineral: "mica" },
  { x: 175, y: 155, r: 22, mineral: "feldspar" },
  { x: 255, y: 130, r: 16, mineral: "quartz" },
  { x: 50, y: 175, r: 12, mineral: "mica" },
  { x: 230, y: 195, r: 15, mineral: "mica" },
  { x: 130, y: 200, r: 18, mineral: "quartz" },
];

interface Props {
  onBack: () => void;
}

export default function MineralsVsRocksLab({ onBack }: Props) {
  const [lang, setLang] = useState<Lang>("bn");
  const [picked, setPicked] = useState<string | null>(null);

  const t = <K extends keyof typeof L>(k: K) => L[k][lang];
  const pickedMineral = MINERALS.find((m) => m.id === picked);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Top bar */}
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> {t("back")}
            </Button>
            <div>
              <h1 className="text-base font-bold md:text-lg">{t("title")}</h1>
              <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLang(lang === "bn" ? "en" : "bn")}>
            <Languages className="mr-1 h-4 w-4" />
            {lang === "bn" ? "English" : "বাংলা"}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 p-4">
        {/* Concept intro */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Gem className="h-4 w-4" /> {lang === "bn" ? "খনিজ" : "Mineral"}
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{t("mineralDef")}</p>
          </Card>
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
              <Layers className="h-4 w-4" /> {lang === "bn" ? "শিলা" : "Rock"}
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{t("rockDef")}</p>
          </Card>
        </div>

        <Tabs defaultValue="chart">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
            <TabsTrigger value="chart">{t("chart")}</TabsTrigger>
            <TabsTrigger value="compare">{t("compare")}</TabsTrigger>
            <TabsTrigger value="granite">{t("granite")}</TabsTrigger>
          </TabsList>

          {/* Chart */}
          <TabsContent value="chart" className="mt-4">
            <Card className="overflow-hidden p-2">
              <img
                src={chartImg}
                alt="Minerals vs Rocks bilingual chart"
                loading="lazy"
                width={1600}
                height={1024}
                className="h-auto w-full rounded-lg"
              />
            </Card>
          </TabsContent>

          {/* Comparison table */}
          <TabsContent value="compare" className="mt-4">
            <Card className="overflow-hidden">
              <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <div className="p-3">{lang === "bn" ? "বৈশিষ্ট্য" : "Property"}</div>
                <div className="border-l p-3 text-emerald-700">{lang === "bn" ? "খনিজ" : "Mineral"}</div>
                <div className="border-l p-3 text-amber-700">{lang === "bn" ? "শিলা" : "Rock"}</div>
              </div>
              {COMPARISON.map((row, i) => (
                <div key={row.key} className={`grid grid-cols-[1.2fr_1fr_1fr] text-sm ${i % 2 ? "bg-slate-50" : "bg-white"}`}>
                  <div className="border-b p-3 font-medium text-slate-800">
                    {lang === "bn" ? row.bn : row.en}
                  </div>
                  <div className="border-b border-l p-3 text-slate-700">
                    {lang === "bn" ? row.mineralBn : row.mineralEn}
                  </div>
                  <div className="border-b border-l p-3 text-slate-700">
                    {lang === "bn" ? row.rockBn : row.rockEn}
                  </div>
                </div>
              ))}
            </Card>
          </TabsContent>

          {/* Interactive granite */}
          <TabsContent value="granite" className="mt-4">
            <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
              <Card className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {lang === "bn" ? "গ্রানাইট শিলা · Granite Slab" : "Granite Slab"}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="mr-1 h-3 w-3" /> {t("tapMineral")}
                  </Badge>
                </div>
                <div className="rounded-lg border-2 border-slate-300 bg-slate-800 p-2">
                  <svg viewBox="0 0 320 260" className="h-auto w-full">
                    <defs>
                      <pattern id="graniteBg" width="4" height="4" patternUnits="userSpaceOnUse">
                        <rect width="4" height="4" fill="#94a3b8" />
                        <circle cx="1" cy="1" r="0.6" fill="#475569" />
                        <circle cx="3" cy="3" r="0.4" fill="#e2e8f0" />
                      </pattern>
                    </defs>
                    <rect x="0" y="0" width="320" height="260" rx="8" fill="url(#graniteBg)" />
                    {GRAINS.map((g, i) => {
                      const m = MINERALS.find((x) => x.id === g.mineral)!;
                      const isPicked = picked === g.mineral;
                      return (
                        <g key={i}
                           className="cursor-pointer"
                           onClick={() => setPicked(g.mineral)}>
                          <circle
                            cx={g.x} cy={g.y} r={g.r}
                            fill={m.color}
                            stroke={isPicked ? "#0ea5e9" : "#1e293b"}
                            strokeWidth={isPicked ? 3 : 1}
                            opacity={picked && !isPicked ? 0.35 : 1}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {MINERALS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPicked(m.id)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 transition ${
                        picked === m.id ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-white hover:border-slate-400"
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full border" style={{ background: m.color }} />
                      {lang === "bn" ? m.bn : m.en}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                {pickedMineral ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full border-2 border-slate-300" style={{ background: pickedMineral.color }} />
                      <div>
                        <div className="text-lg font-bold">
                          {pickedMineral.en} · {pickedMineral.bn}
                        </div>
                        <div className="font-mono text-xs text-slate-600">{pickedMineral.formula}</div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {lang === "bn" ? pickedMineral.descBn : pickedMineral.descEn}
                    </p>
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                      {lang === "bn"
                        ? "গ্রানাইটে এই খনিজটি একটি উপাদান হিসেবে উপস্থিত — শিলা মানে বহু খনিজের মিশ্রণ।"
                        : "This mineral is one component of granite — a rock is a mixture of several minerals."}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                    {t("tapMineral")}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
