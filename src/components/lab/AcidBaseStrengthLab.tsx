/**
 * AcidBaseStrengthLab — Chapter 9
 * এসিড ও ক্ষারকের তীব্রতা — Strong vs Weak
 *
 * Visualises degree of ionization (α) and its effect on bulb brightness.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Zap, Languages, Lightbulb, Info, FlaskConical, RefreshCcw } from "lucide-react";
import TheoryLabShell from "./TheoryLabShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = "acid" | "base";
type SubstanceId = "hcl" | "ch3cooh" | "naoh" | "nh4oh";
type Lang = "bn" | "en";
type Bulb = "off" | "dim" | "bright";

interface Substance {
  id: SubstanceId;
  category: Category;
  strength: "strong" | "weak";
  nameEn: string;
  nameBn: string;
  formula: string;
  alpha: number; // baseline α at 1M (0..1)
  cationLabel: string;
  anionLabel: string;
  cationColor: string;
  anionColor: string;
  eqStrong: string;
  eqWeak: string;
}

const SUBSTANCES: Record<SubstanceId, Substance> = {
  hcl: {
    id: "hcl",
    category: "acid",
    strength: "strong",
    nameEn: "Hydrochloric Acid",
    nameBn: "হাইড্রোক্লোরিক এসিড",
    formula: "HCl",
    alpha: 1.0,
    cationLabel: "H⁺",
    anionLabel: "Cl⁻",
    cationColor: "#facc15",
    anionColor: "#22c55e",
    eqStrong: "HCl (aq) → H⁺ (aq) + Cl⁻ (aq)",
    eqWeak: "",
  },
  ch3cooh: {
    id: "ch3cooh",
    category: "acid",
    strength: "weak",
    nameEn: "Acetic Acid",
    nameBn: "অ্যাসিটিক এসিড",
    formula: "CH₃COOH",
    alpha: 0.05,
    cationLabel: "H⁺",
    anionLabel: "CH₃COO⁻",
    cationColor: "#facc15",
    anionColor: "#f97316",
    eqStrong: "",
    eqWeak: "CH₃COOH (aq) ⇌ CH₃COO⁻ (aq) + H⁺ (aq)",
  },
  naoh: {
    id: "naoh",
    category: "base",
    strength: "strong",
    nameEn: "Sodium Hydroxide",
    nameBn: "সোডিয়াম হাইড্রক্সাইড",
    formula: "NaOH",
    alpha: 1.0,
    cationLabel: "Na⁺",
    anionLabel: "OH⁻",
    cationColor: "#38bdf8",
    anionColor: "#a855f7",
    eqStrong: "NaOH (aq) → Na⁺ (aq) + OH⁻ (aq)",
    eqWeak: "",
  },
  nh4oh: {
    id: "nh4oh",
    category: "base",
    strength: "weak",
    nameEn: "Ammonium Hydroxide",
    nameBn: "অ্যামোনিয়াম হাইড্রক্সাইড",
    formula: "NH₄OH",
    alpha: 0.04,
    cationLabel: "NH₄⁺",
    anionLabel: "OH⁻",
    cationColor: "#60a5fa",
    anionColor: "#a855f7",
    eqStrong: "",
    eqWeak: "NH₄OH (aq) ⇌ NH₄⁺ (aq) + OH⁻ (aq)",
  },
};

const T = {
  title: { bn: "এসিড ও ক্ষারকের তীব্রতা", en: "Acid & Base Strength" },
  subtitle: {
    bn: "Chapter 9 · তীব্র বনাম দুর্বল · আয়নন মাত্রা α",
    en: "Chapter 9 · Strong vs Weak · Degree of Ionization α",
  },
  category: { bn: "শ্রেণি", en: "Category" },
  acids: { bn: "এসিড", en: "Acids" },
  bases: { bn: "ক্ষারক", en: "Bases" },
  substance: { bn: "পদার্থ", en: "Substance" },
  molarity: { bn: "মোলারিটি", en: "Molarity" },
  circuit: { bn: "কন্ডাক্টিভিটি সার্কিট", en: "Conductivity Circuit" },
  bulb: { bn: "বাল্ব", en: "Bulb" },
  reset: { bn: "রিসেট", en: "Reset" },
  alphaLbl: { bn: "আয়নন মাত্রা (α)", en: "Degree of Ionization (α)" },
  eqLbl: { bn: "লাইভ বিয়োজন সমীকরণ", en: "Live Dissociation" },
  insight: { bn: "শিক্ষকের অন্তর্দৃষ্টি", en: "Teacher's Insight" },
  insightStrong: {
    bn: "তীব্র তড়িৎ-বিশ্লেষ্য প্রায় ১০০% আয়নিত — অনেক মুক্ত আয়ন, বেশি তড়িৎ প্রবাহ, উজ্জ্বল বাল্ব।",
    en: "Strong electrolytes ionise ~100%. Many free ions → large current → bright bulb.",
  },
  insightWeak: {
    bn: "দুর্বল তড়িৎ-বিশ্লেষ্য মাত্র কয়েক শতাংশ আয়নিত — কম মুক্ত আয়ন, কম প্রবাহ, ম্লান বাল্ব।",
    en: "Weak electrolytes ionise only a few percent. Few ions → low current → dim bulb.",
  },
  micro: { bn: "মাইক্রোস্কোপিক দৃশ্য", en: "Microscopic view" },
  macro: { bn: "ম্যাক্রোস্কোপিক", en: "Macroscopic" },
  intact: { bn: "অখণ্ড অণু", en: "intact molecules" },
  ions: { bn: "মুক্ত আয়ন", en: "free ions" },
};
const tr = (k: keyof typeof T, l: Lang) => T[k][l];

export default function AcidBaseStrengthLab({ onBack }: { onBack: () => void }) {
  const [lang, setLang] = useState<Lang>("bn");
  const [category, setCategory] = useState<Category>("acid");
  const [subId, setSubId] = useState<SubstanceId>("hcl");
  const [molarity, setMolarity] = useState(1.0);
  const [circuit, setCircuit] = useState(false);

  // filter substances by category
  const options = useMemo(
    () => Object.values(SUBSTANCES).filter((s) => s.category === category),
    [category],
  );
  useEffect(() => {
    if (!options.find((s) => s.id === subId)) setSubId(options[0].id);
  }, [options, subId]);

  const sub = SUBSTANCES[subId];

  // Effective α: strong stays ~1; weak dips a bit at low concentration
  const alpha = useMemo(() => {
    if (sub.strength === "strong") return 1.0;
    // weak: slightly higher α at very low conc (Ostwald dilution)
    return Math.min(0.15, sub.alpha * Math.sqrt(1 / Math.max(0.01, molarity)));
  }, [sub, molarity]);

  const alphaPct = Math.round(alpha * 100);

  const bulb: Bulb = useMemo(() => {
    if (!circuit) return "off";
    const power = alpha * Math.min(1, molarity);
    if (power > 0.4) return "bright";
    if (power > 0.02) return "dim";
    return "off";
  }, [circuit, alpha, molarity]);

  const L = (k: keyof typeof T) => tr(k, lang);

  const info_left = (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lab-sm flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" /> {L("alphaLbl")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlphaGauge percent={alphaPct} strong={sub.strength === "strong"} />
          <div className="mt-2 text-center text-lab-xs">
            <Badge className={sub.strength === "strong" ? "bg-emerald-500" : "bg-amber-500"}>
              {sub.strength === "strong"
                ? lang === "bn"
                  ? "তীব্র তড়িৎ-বিশ্লেষ্য"
                  : "Strong Electrolyte"
                : lang === "bn"
                  ? "দুর্বল তড়িৎ-বিশ্লেষ্য"
                  : "Weak Electrolyte"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lab-sm">{L("eqLbl")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <EqBox
            active={sub.strength === "strong"}
            eq={sub.eqStrong || "—"}
            note={lang === "bn" ? "সম্পূর্ণ বিয়োজন" : "Complete dissociation"}
            tone="emerald"
          />
          <EqBox
            active={sub.strength === "weak"}
            eq={sub.eqWeak || "—"}
            note={
              lang === "bn" ? "সাম্যাবস্থা · আংশিক বিয়োজন" : "Equilibrium · partial dissociation"
            }
            tone="amber"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center gap-1.5">
          <Info className="h-4 w-4 text-primary" />
          <CardTitle className="text-lab-sm">{L("insight")}</CardTitle>
        </CardHeader>
        <CardContent className="text-lab-xs text-muted-foreground leading-relaxed">
          {sub.strength === "strong" ? tr("insightStrong", lang) : tr("insightWeak", lang)}
        </CardContent>
      </Card>
    </>
  );

  const controls = (
    <>
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-lab-sm">{L("category")}</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
          >
            <Languages className="h-3.5 w-3.5 mr-1" />
            {lang === "bn" ? "EN" : "বাং"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Tabs value={category} onValueChange={(v) => setCategory(v as Category)}>
            <TabsList className="grid grid-cols-2 h-auto w-full">
              <TabsTrigger value="acid" className="text-lab-xs py-1.5">
                {L("acids")}
              </TabsTrigger>
              <TabsTrigger value="base" className="text-lab-xs py-1.5">
                {L("bases")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div>
            <div className="text-lab-xs font-semibold mb-1.5">{L("substance")}</div>
            <div className="grid grid-cols-1 gap-1.5">
              {options.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubId(s.id)}
                  className={`rounded-md border px-2 py-1.5 text-left text-lab-xs transition ${
                    s.id === subId
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-400 dark:bg-slate-800 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">{s.formula}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${s.strength === "strong" ? "border-emerald-500 text-emerald-600" : "border-amber-500 text-amber-600"}`}
                    >
                      {s.strength}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {lang === "bn" ? s.nameBn : s.nameEn}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lab-sm">{L("molarity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Slider
            value={[molarity]}
            min={0.01}
            max={1.0}
            step={0.01}
            onValueChange={([v]) => setMolarity(v)}
          />
          <div className="flex justify-between text-lab-xs text-muted-foreground">
            <span>0.01 M</span>
            <span className="font-semibold text-foreground">{molarity.toFixed(2)} M</span>
            <span>1.00 M</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lab-sm flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-amber-500" /> {L("circuit")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-md border p-2">
            <span className="text-lab-xs">{circuit ? "ON" : "OFF"}</span>
            <Switch checked={circuit} onCheckedChange={setCircuit} />
          </div>
          <div className="text-lab-xs text-muted-foreground text-center">
            {L("bulb")}:{" "}
            <span
              className={
                bulb === "bright"
                  ? "text-amber-500 font-bold"
                  : bulb === "dim"
                    ? "text-amber-700 font-semibold"
                    : "text-slate-500"
              }
            >
              {bulb === "bright"
                ? lang === "bn"
                  ? "উজ্জ্বল"
                  : "Bright"
                : bulb === "dim"
                  ? lang === "bn"
                    ? "ম্লান"
                    : "Dim"
                  : lang === "bn"
                    ? "নিভানো"
                    : "Off"}
            </span>
          </div>
          <Button
            variant="ghost"
            className="w-full h-8 text-lab-xs"
            onClick={() => {
              setMolarity(1);
              setCircuit(false);
            }}
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-1" /> {L("reset")}
          </Button>
        </CardContent>
      </Card>
    </>
  );

  const visual = (
    <StrengthScene
      sub={sub}
      alpha={alpha}
      molarity={molarity}
      bulb={bulb}
      circuit={circuit}
      lang={lang}
    />
  );

  return (
    <TheoryLabShell
      onBack={onBack}
      titleBn={T.title.bn}
      subtitleEn={T.subtitle.en}
      headerIcon={
        <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 p-1.5 text-white shadow">
          <FlaskConical className="h-4 w-4" />
        </div>
      }
      badge={
        <Badge className={sub.strength === "strong" ? "bg-emerald-500" : "bg-amber-500"}>
          α = {alphaPct}%
        </Badge>
      }
      info={info_left}
      visual={visual}
      controls={controls}
      theoryLabel="থিওরি · Strong vs Weak"
      theory={
        <div className="space-y-3">
          <p>
            <strong>তীব্র এসিড/ক্ষারক</strong> জলীয় দ্রবণে প্রায় ১০০% আয়নিত হয়। উদাহরণ: HCl,
            H₂SO₄, HNO₃, NaOH, KOH। এদের বিয়োজন একমুখী তীর দিয়ে দেখানো হয়।
          </p>
          <p>
            <strong>দুর্বল এসিড/ক্ষারক</strong> মাত্র কয়েক শতাংশ (১-৫%) আয়নিত হয়, বাকিটা অণু
            আকারেই থাকে — সাম্যাবস্থায়। উদাহরণ: CH₃COOH, H₂CO₃, NH₄OH।
          </p>
          <pre className="rounded bg-slate-100 p-2 text-lab-xs dark:bg-slate-800">
            {`α  =  (আয়নিত অণুর সংখ্যা) / (মোট অণুর সংখ্যা)
Strong:  α ≈ 1     Weak:  α ≪ 1`}
          </pre>
          <p>
            মুক্ত আয়ন সংখ্যা যত বেশি, দ্রবণের <strong>তড়িৎ পরিবাহিতা</strong> তত বেশি — তাই বাল্ব
            উজ্জ্বল জ্বলে। দুর্বল দ্রবণে আয়ন কম, প্রবাহ কম, বাল্ব ম্লান।
          </p>
          <p>
            মজার ব্যাপার: দুর্বল এসিডকে অনেক লঘু করলে (Ostwald dilution law) α একটু বাড়ে, কিন্তু
            প্রকৃত আয়ন সংখ্যা কমে যায় — তাই পরিবাহিতা কমে।
          </p>
        </div>
      }
    />
  );
}

// ────────── α Gauge ──────────
function AlphaGauge({ percent, strong }: { percent: number; strong: boolean }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const dash = (percent / 100) * C;
  const color = strong ? "#10b981" : "#f59e0b";
  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 90 90" width="90" height="90">
        <circle cx="45" cy="45" r={R} stroke="#e2e8f0" strokeWidth="8" fill="none" />
        <circle
          cx="45"
          cy="45"
          r={R}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${dash} ${C - dash}`}
          strokeDashoffset={C / 4}
          transform="rotate(-90 45 45)"
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s, stroke 0.4s" }}
        />
        <text x="45" y="43" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a">
          {percent}%
        </text>
        <text x="45" y="58" textAnchor="middle" fontSize="9" fill="#64748b">
          α
        </text>
      </svg>
    </div>
  );
}

function EqBox({
  active,
  eq,
  note,
  tone,
}: {
  active: boolean;
  eq: string;
  note: string;
  tone: "emerald" | "amber";
}) {
  const tones = {
    emerald:
      "border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200",
    amber: "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200",
  };
  return (
    <div
      className={`rounded-md border px-2 py-1.5 transition ${
        active
          ? `${tones[tone]} shadow-sm`
          : "border-slate-200 bg-slate-50/50 text-slate-400 dark:bg-slate-800/30"
      }`}
    >
      <div className="font-mono text-lab-xs">{eq}</div>
      <div className="text-[10px] opacity-70 mt-0.5">{note}</div>
    </div>
  );
}

// ────────── Scene ──────────
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "intact" | "cation" | "anion";
}

function StrengthScene({
  sub,
  alpha,
  molarity,
  bulb,
  circuit,
  lang,
}: {
  sub: Substance;
  alpha: number;
  molarity: number;
  bulb: Bulb;
  circuit: boolean;
  lang: Lang;
}) {
  // beaker viewport
  const W = 200,
    H = 160;
  const N_TOTAL = Math.max(6, Math.round(molarity * 22));

  // rebuild particle roster when inputs change
  const particles = useMemo<Particle[]>(() => {
    const ionizedCount = Math.round(N_TOTAL * alpha);
    const list: Particle[] = [];
    let id = 0;
    for (let i = 0; i < N_TOTAL; i++) {
      const dissoc = i < ionizedCount;
      if (dissoc) {
        list.push(makeP(id++, "cation"));
        list.push(makeP(id++, "anion"));
      } else {
        list.push(makeP(id++, "intact"));
      }
    }
    return list;
    function makeP(pid: number, type: Particle["type"]): Particle {
      return {
        id: pid,
        x: 10 + Math.random() * (W - 20),
        y: 10 + Math.random() * (H - 20),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        type,
      };
    }
  }, [sub.id, molarity, alpha, N_TOTAL]);

  // animate
  const [state, setState] = useState(particles);
  useEffect(() => setState(particles), [particles]);

  const raf = useRef<number | null>(null);
  useEffect(() => {
    const loop = () => {
      setState((prev) =>
        prev.map((p) => {
          let { x, y, vx, vy } = p;
          x += vx;
          y += vy;
          if (x < 8 || x > W - 8) vx = -vx;
          if (y < 8 || y > H - 8) vy = -vy;
          // small jitter
          vx += (Math.random() - 0.5) * 0.08;
          vy += (Math.random() - 0.5) * 0.08;
          vx = Math.max(-1.2, Math.min(1.2, vx));
          vy = Math.max(-1.2, Math.min(1.2, vy));
          return { ...p, x, y, vx, vy };
        }),
      );
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const bulbFill = bulb === "bright" ? "#fde047" : bulb === "dim" ? "#fbbf24" : "#475569";
  const bulbGlow = bulb === "bright" ? 24 : bulb === "dim" ? 10 : 0;
  const bulbOpacity = bulb === "bright" ? 1 : bulb === "dim" ? 0.55 : 0.3;

  const intactCount = state.filter((p) => p.type === "intact").length;
  const ionCount = state.length - intactCount;

  return (
    <div className="relative h-full w-full rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-inner overflow-hidden backdrop-blur-md">
      <svg viewBox="0 0 400 340" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="bulbGrad">
            <stop offset="0%" stopColor={bulbFill} stopOpacity="1" />
            <stop offset="70%" stopColor={bulbFill} stopOpacity="0.4" />
            <stop offset="100%" stopColor={bulbFill} stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation={bulbGlow / 2} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Bulb glow halo */}
        {bulb !== "off" && (
          <circle cx="310" cy="80" r={40 + bulbGlow} fill="url(#bulbGrad)" opacity={bulbOpacity} />
        )}

        {/* Battery */}
        <g transform="translate(30, 60)">
          <rect x="0" y="0" width="34" height="52" rx="4" fill="#1e293b" stroke="#475569" />
          <rect x="10" y="-4" width="14" height="6" fill="#94a3b8" />
          <text x="17" y="30" textAnchor="middle" fontSize="9" fill="#e2e8f0" fontWeight="700">
            6V
          </text>
          <text x="17" y="42" textAnchor="middle" fontSize="7" fill="#94a3b8">
            + −
          </text>
        </g>

        {/* Wires */}
        <path d="M64 65 L64 30 L310 30 L310 55" stroke="#f59e0b" strokeWidth="2" fill="none" />
        <path d="M64 112 L64 140 L120 140" stroke="#22d3ee" strokeWidth="2" fill="none" />
        <path d="M310 105 L310 140 L275 140" stroke="#22d3ee" strokeWidth="2" fill="none" />

        {/* Bulb */}
        <g transform="translate(310, 80)" filter={bulb !== "off" ? "url(#glow)" : undefined}>
          <circle
            cx="0"
            cy="0"
            r="18"
            fill={bulbFill}
            opacity={bulbOpacity}
            stroke="#334155"
            strokeWidth="1.5"
          />
          <path
            d="M-6 -4 L-3 4 L3 4 L6 -4"
            stroke="#fff"
            strokeWidth="1.2"
            fill="none"
            opacity={bulb === "bright" ? 1 : 0.4}
          />
          <rect x="-6" y="17" width="12" height="6" fill="#64748b" />
        </g>

        {/* Beaker with liquid */}
        <g transform="translate(120, 140)">
          <path d="M0 0 L0 130 L155 130 L155 0" fill="none" stroke="#94a3b8" strokeWidth="2" />
          <path
            d="M2 20 L2 128 L153 128 L153 20 Z"
            fill={sub.category === "acid" ? "#fef3c7" : "#e0e7ff"}
            opacity="0.25"
          />

          {/* Electrodes */}
          {circuit && (
            <>
              <rect x="30" y="-10" width="6" height="90" fill="#1e293b" stroke="#f59e0b" />
              <rect x="120" y="-10" width="6" height="90" fill="#1e293b" stroke="#22d3ee" />
              <text x="33" y="-14" textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="700">
                +
              </text>
              <text
                x="123"
                y="-14"
                textAnchor="middle"
                fontSize="8"
                fill="#22d3ee"
                fontWeight="700"
              >
                −
              </text>
            </>
          )}

          {/* Microscopic particles inside beaker */}
          <g transform="translate(-25, -5)" clipPath="url(#beakerClip)">
            <defs>
              <clipPath id="beakerClip">
                <rect x="27" y="25" width="151" height="105" />
              </clipPath>
            </defs>
            {state.map((p) => {
              const px = 27 + (p.x / W) * 151;
              const py = 25 + (p.y / H) * 105;
              if (p.type === "intact") {
                return (
                  <g key={p.id}>
                    <rect
                      x={px - 12}
                      y={py - 5}
                      width="24"
                      height="10"
                      rx="5"
                      fill="#64748b"
                      opacity="0.85"
                    />
                    <text
                      x={px}
                      y={py + 3}
                      textAnchor="middle"
                      fontSize="6"
                      fill="#fff"
                      fontWeight="700"
                    >
                      {sub.formula}
                    </text>
                  </g>
                );
              }
              const isCat = p.type === "cation";
              const color = isCat ? sub.cationColor : sub.anionColor;
              const label = isCat ? sub.cationLabel : sub.anionLabel;
              return (
                <g key={p.id}>
                  {circuit && (
                    <circle cx={px} cy={py} r="7" fill={color} opacity="0.35">
                      <animate
                        attributeName="r"
                        values="6;10;6"
                        dur="1.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <circle cx={px} cy={py} r="5.5" fill={color} stroke="#0f172a" strokeWidth="0.5" />
                  <text
                    x={px}
                    y={py + 2}
                    textAnchor="middle"
                    fontSize="5.5"
                    fill="#0f172a"
                    fontWeight="700"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>

          <text x="77" y="145" textAnchor="middle" fontSize="10" fill="#cbd5e1" fontWeight="600">
            {sub.formula} · {molarity.toFixed(2)}M
          </text>
        </g>
      </svg>

      {/* HUD */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-100 backdrop-blur">
        <Zap className="h-3 w-3 text-amber-400" />
        {T.micro[lang]}
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-1 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] text-slate-100 backdrop-blur">
        <div>
          <span className="text-amber-400">●</span> {ionCount} {T.ions[lang]}
        </div>
        <div>
          <span className="text-slate-400">■</span> {intactCount} {T.intact[lang]}
        </div>
      </div>
    </div>
  );
}
