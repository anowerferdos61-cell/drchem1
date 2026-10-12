/**
 * OresVsMineralsLab — Chapter 10 theory lab
 * "সকল আকরিকই খনিজ, কিন্তু সকল খনিজ আকরিক নয়।"
 * Bilingual (Bangla + English) Venn diagram explainer for Minerals ⊃ Ores.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Languages, Gem, Layers, TrendingUp, Info, Sparkles } from "lucide-react";
import DraggableTheoryFab from "./DraggableTheoryFab";

type Lang = "bn" | "en";

const L = {
  title: { bn: "খনিজ ও আকরিক", en: "Minerals & Ores" },
  subtitle: {
    bn: "চ্যাপ্টার ১০ · খনিজ সম্পদ: ধাতু ও অধাতু",
    en: "Chapter 10 · Mineral Resources: Metals & Non-metals",
  },
  quote: {
    bn: "সকল আকরিকই খনিজ, কিন্তু সকল খনিজ আকরিক নয়।",
    en: "All ores are minerals, but all minerals are not ores.",
  },
  back: { bn: "ফিরে যান", en: "Back" },
  minerals: { bn: "খনিজ", en: "Minerals" },
  ores: { bn: "আকরিক", en: "Ores" },
  mineralsDesc: {
    bn: "প্রকৃতিতে প্রাপ্ত ধাতুর যেকোনো রাসায়নিক যৌগ।",
    en: "Any naturally occurring chemical compound of a metal.",
  },
  oresDesc: {
    bn: "যে খনিজ থেকে সহজে ও লাভজনকভাবে ধাতু নিষ্কাশন করা যায়।",
    en: "A mineral from which metal can be extracted easily and profitably.",
  },
  clay: { bn: "কাদা মাটি", en: "Clay" },
  bauxite: { bn: "বক্সাইট", en: "Bauxite" },
  clayNote: {
    bn: "অ্যালুমিনিয়ামের খনিজ — কিন্তু লাভজনকভাবে ধাতু নিষ্কাশন সম্ভব নয় (আকরিক নয়)।",
    en: "A mineral of aluminium — but metal cannot be extracted profitably (not an ore).",
  },
  bauxiteNote: {
    bn: "অ্যালুমিনিয়ামের আকরিক — কারণ এখান থেকে সহজে ও লাভজনকভাবে অ্যালুমিনিয়াম পাওয়া যায়।",
    en: "An ore of aluminium — Al can be extracted easily and profitably from it.",
  },
  keyLogic: { bn: "মূল যুক্তি", en: "Key Logic" },
  keyLogicText: {
    bn: "খনিজ হতে হলে শুধু প্রকৃতিতে পেলেই হবে। কিন্তু আকরিক হতে হলে খনিজ হওয়ার পাশাপাশি সেখান থেকে লাভজনকভাবে (Profitable) ধাতু নিষ্কাশন সম্ভব হতে হবে।",
    en: "To be a mineral, it just needs to occur naturally. To be an ore, it must also allow profitable metal extraction.",
  },
  subset: { bn: "উপসেট সম্পর্ক", en: "Subset relation" },
  profitable: { bn: "লাভজনক নিষ্কাশন", en: "Profitable extraction" },
  notProfitable: { bn: "অলাভজনক", en: "Not profitable" },
} as const;

export default function OresVsMineralsLab({ onBack }: { onBack: () => void }) {
  const [lang, setLang] = useState<Lang>("bn");
  const t = (k: keyof typeof L) => L[k][lang];

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 h-8 gap-1 px-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t("back")}</span>
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow">
              <Gem className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-base font-extrabold tracking-tight">{t("title")}</div>
              <div className="truncate text-xs text-muted-foreground">{t("subtitle")}</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setLang((v) => (v === "bn" ? "en" : "bn"))}
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === "bn" ? "EN" : "বাংলা"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
        {/* Quote hero */}
        <div className="mb-6 rounded-2xl border bg-gradient-to-br from-fuchsia-500/10 via-pink-500/5 to-sky-500/10 p-5 text-center shadow-sm">
          <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">
            <Sparkles className="h-3.5 w-3.5" />
            {t("subset")}
          </div>
          <p className="mx-auto max-w-3xl text-lg font-bold leading-snug tracking-tight md:text-2xl">
            “{t("quote")}”
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Venn diagram */}
          <Card className="overflow-hidden p-4 md:p-6">
            <VennDiagram lang={lang} />
          </Card>

          {/* Side legend + logic */}
          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold">{t("minerals")} · Minerals</h3>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  Outer set
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t("mineralsDesc")}</p>
              <div className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                  <Info className="h-3.5 w-3.5" />
                  {t("clay")} · Al₂O₃·2SiO₂·2H₂O
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("clayNote")}</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold">{t("ores")} · Ores</h3>
                <Badge className="ml-auto bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 text-[10px]">
                  Subset ⊂ Minerals
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t("oresDesc")}</p>
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Info className="h-3.5 w-3.5" />
                  {t("bauxite")} · Al₂O₃·2H₂O
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("bauxiteNote")}</p>
              </div>
            </Card>

            <Alert className="border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-sm font-bold">💡 {t("keyLogic")}</AlertTitle>
              <AlertDescription className="text-xs leading-relaxed">
                {t("keyLogicText")}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </main>

      <DraggableTheoryFab storageKey="ores-vs-minerals">
        <h3>খনিজ (Mineral) কী?</h3>
        <p>
          প্রকৃতিতে প্রাপ্ত যে সকল অজৈব পদার্থের নির্দিষ্ট রাসায়নিক সংকেত ও স্ফটিক গঠন থাকে, তাদের
          খনিজ বলে। যেমন — কোয়ার্টজ (SiO₂), হ্যালাইট (NaCl), হেমাটাইট (Fe₂O₃), বক্সাইট
          (Al₂O₃·2H₂O)।
        </p>
        <h3>আকরিক (Ore) কী?</h3>
        <p>
          যে সকল খনিজ থেকে সহজে ও লাভজনকভাবে (economically & profitably) ধাতু নিষ্কাশন করা যায়,
          তাকে আকরিক বলে। অর্থাৎ প্রতিটি আকরিকই একটি খনিজ, কিন্তু প্রতিটি খনিজ আকরিক নয়।
        </p>
        <h3>প্রধান শর্ত (Conditions for an Ore)</h3>
        <ul>
          <li>ধাতুর পরিমাণ (Metal content) যথেষ্ট বেশি হতে হবে।</li>
          <li>নিষ্কাশন-প্রক্রিয়া অর্থনৈতিকভাবে লাভজনক হতে হবে।</li>
          <li>
            ধাতুটি সহজে আলাদা করা যায় এমন যৌগ (সাধারণত অক্সাইড / সালফাইড / কার্বনেট) হিসেবে থাকতে
            হবে।
          </li>
        </ul>
        <h3>উদাহরণ</h3>
        <ul>
          <li>বক্সাইট (Al₂O₃·2H₂O) — অ্যালুমিনিয়ামের আকরিক ✅</li>
          <li>হেমাটাইট (Fe₂O₃) — লোহার আকরিক ✅</li>
          <li>ক্লে/কেওলিন — অ্যালুমিনিয়াম থাকলেও নিষ্কাশন লাভজনক নয়, তাই শুধু খনিজ ❌</li>
        </ul>
        <p>
          <em>Key takeaway — "All ores are minerals, but all minerals are not ores."</em>
        </p>
      </DraggableTheoryFab>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Venn diagram (pure SVG, no external animation deps needed) */
/* ────────────────────────────────────────────────────────── */
function VennDiagram({ lang }: { lang: Lang }) {
  const t = (k: keyof typeof L) => L[k][lang];
  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 600 440"
        className="mx-auto block h-auto w-full max-w-2xl"
        role="img"
        aria-label="Venn diagram: Ores are a subset of Minerals"
      >
        <defs>
          <radialGradient id="mineralGrad" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="hsl(210 90% 70%)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(210 90% 55%)" stopOpacity="0.10" />
          </radialGradient>
          <radialGradient id="oreGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="hsl(152 80% 55%)" stopOpacity="0.42" />
            <stop offset="100%" stopColor="hsl(152 75% 40%)" stopOpacity="0.18" />
          </radialGradient>
          <marker
            id="arrowHead"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(220 15% 45%)" />
          </marker>
          <style>{`
            @keyframes drc-pulse-outer { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.015) } }
            @keyframes drc-pulse-inner { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.03) } }
            @keyframes drc-fade { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform:none } }
            .drc-outer { transform-origin: 300px 220px; animation: drc-pulse-outer 6s ease-in-out infinite; }
            .drc-inner { transform-origin: 380px 220px; animation: drc-pulse-inner 4.5s ease-in-out infinite; }
            .drc-fade-1 { animation: drc-fade .6s ease-out .1s both; }
            .drc-fade-2 { animation: drc-fade .6s ease-out .3s both; }
            .drc-fade-3 { animation: drc-fade .6s ease-out .5s both; }
          `}</style>
        </defs>

        {/* Outer circle — Minerals */}
        <g className="drc-outer">
          <ellipse
            cx="300"
            cy="220"
            rx="260"
            ry="190"
            fill="url(#mineralGrad)"
            stroke="hsl(210 80% 55%)"
            strokeWidth="2.5"
            strokeDasharray="0"
          />
        </g>

        {/* Inner circle — Ores */}
        <g className="drc-inner">
          <ellipse
            cx="380"
            cy="220"
            rx="120"
            ry="105"
            fill="url(#oreGrad)"
            stroke="hsl(152 70% 40%)"
            strokeWidth="2.5"
          />
        </g>

        {/* Labels */}
        <g className="drc-fade-1">
          <text x="120" y="80" fontSize="20" fontWeight="800" fill="hsl(210 80% 40%)">
            {t("minerals")}
          </text>
          <text x="120" y="102" fontSize="13" fontWeight="600" fill="hsl(210 40% 45%)">
            Minerals · খনিজ (outer set)
          </text>
        </g>

        <g className="drc-fade-2">
          <text
            x="380"
            y="150"
            fontSize="18"
            fontWeight="800"
            textAnchor="middle"
            fill="hsl(152 70% 30%)"
          >
            {t("ores")}
          </text>
          <text
            x="380"
            y="168"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            fill="hsl(152 40% 35%)"
          >
            Ores · আকরিক
          </text>
        </g>

        {/* Bauxite point (inside inner) */}
        <g className="drc-fade-2">
          <circle cx="380" cy="230" r="7" fill="hsl(152 75% 40%)" stroke="white" strokeWidth="2" />
          <text
            x="380"
            y="256"
            fontSize="13"
            fontWeight="700"
            textAnchor="middle"
            fill="hsl(152 70% 25%)"
          >
            {t("bauxite")} · Bauxite
          </text>
          <text x="380" y="272" fontSize="10.5" textAnchor="middle" fill="hsl(152 40% 35%)">
            Al₂O₃·2H₂O
          </text>
        </g>

        {/* Clay point (outside inner, inside outer) */}
        <g className="drc-fade-3">
          <circle cx="130" cy="260" r="7" fill="hsl(210 80% 50%)" stroke="white" strokeWidth="2" />
          <text
            x="130"
            y="286"
            fontSize="13"
            fontWeight="700"
            textAnchor="middle"
            fill="hsl(210 70% 30%)"
          >
            {t("clay")} · Clay
          </text>
          <text x="130" y="302" fontSize="10.5" textAnchor="middle" fill="hsl(210 40% 40%)">
            Al₂O₃·2SiO₂·2H₂O
          </text>
        </g>

        {/* Arrows / annotations */}
        <g className="drc-fade-3">
          {/* Arrow from Bauxite label out to profitable note */}
          <path
            d="M 445 225 Q 520 210 545 175"
            fill="none"
            stroke="hsl(152 60% 40%)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            markerEnd="url(#arrowHead)"
          />
          <text
            x="548"
            y="168"
            fontSize="11"
            fontWeight="700"
            textAnchor="end"
            fill="hsl(152 55% 30%)"
          >
            ✓ {t("profitable")}
          </text>

          {/* Arrow from Clay to "not profitable" */}
          <path
            d="M 95 250 Q 55 235 45 205"
            fill="none"
            stroke="hsl(0 60% 55%)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            markerEnd="url(#arrowHead)"
          />
          <text x="40" y="196" fontSize="11" fontWeight="700" fill="hsl(0 60% 45%)">
            ✗ {t("notProfitable")}
          </text>
        </g>

        {/* Bottom subset caption */}
        <text
          x="300"
          y="418"
          fontSize="13"
          fontWeight="700"
          textAnchor="middle"
          fill="hsl(220 20% 40%)"
        >
          Ores ⊂ Minerals
        </text>
      </svg>
    </div>
  );
}
