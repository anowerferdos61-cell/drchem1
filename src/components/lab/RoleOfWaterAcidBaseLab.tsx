/**
 * RoleOfWaterAcidBaseLab — Chapter 10
 * এসিড ও ক্ষারকের কার্যকারিতায় পানির ভূমিকা
 *
 * Demonstrates: dry HCl gas / dry NaOH / pure ethanol never change
 * litmus paper unless water is present. Ionization needs H2O.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Droplets, Beaker, Info, FlaskConical, Languages, RefreshCcw } from "lucide-react";
import TheoryLabShell from "./TheoryLabShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ────────── Types ──────────
type Compound = "hcl" | "ethanol" | "naoh";
type LitmusState = "dry" | "wet";
type LitmusColor = "blue" | "red" | "purple";
type Lang = "bn" | "en";

interface CompoundInfo {
  id: Compound;
  nameBn: string;
  nameEn: string;
  formula: string;
  litmusExpected: "blue" | "red"; // paper you should place
  isAcid: boolean;
  isBase: boolean;
  hasHydrogen: boolean;
  dryEq: string;
  wetEq: string;
  color: string;
}

const COMPOUNDS: Record<Compound, CompoundInfo> = {
  hcl: {
    id: "hcl",
    nameBn: "শুষ্ক HCl গ্যাস",
    nameEn: "Dry HCl Gas",
    formula: "HCl(g)",
    litmusExpected: "blue",
    isAcid: true,
    isBase: false,
    hasHydrogen: true,
    dryEq: "HCl(g) → কোনো আয়ন নয় / No ions",
    wetEq: "HCl(g) + H₂O(l) → H₃O⁺(aq) + Cl⁻(aq)",
    color: "#fbbf24",
  },
  ethanol: {
    id: "ethanol",
    nameBn: "বিশুদ্ধ ইথানল",
    nameEn: "Pure Ethanol",
    formula: "C₂H₅OH",
    litmusExpected: "blue",
    isAcid: false,
    isBase: false,
    hasHydrogen: true,
    dryEq: "C₂H₅OH → নিষ্ক্রিয় / Non-ionising",
    wetEq: "C₂H₅OH + H₂O → C₂H₅OH(aq)  [H⁺ ছাড়ে না]",
    color: "#38bdf8",
  },
  naoh: {
    id: "naoh",
    nameBn: "শুষ্ক NaOH দানা",
    nameEn: "Dry NaOH Pellets",
    formula: "NaOH(s)",
    litmusExpected: "red",
    isAcid: false,
    isBase: true,
    hasHydrogen: true,
    dryEq: "NaOH(s) → কঠিন লবণ, আয়ন মুক্ত নয়",
    wetEq: "NaOH(s) + H₂O → Na⁺(aq) + OH⁻(aq)",
    color: "#f9fafb",
  },
};

const T = {
  title: { bn: "এসিড ও ক্ষারকে পানির ভূমিকা", en: "Role of Water in Acids & Bases" },
  subtitle: { bn: "Chapter 10 · আয়নন প্রমাণ পরীক্ষা", en: "Chapter 10 · Ionization Proof Lab" },
  reagent: { bn: "যৌগ নির্বাচন", en: "Select Compound" },
  litmusToggle: { bn: "লিটমাসের অবস্থা", en: "Litmus State" },
  dry: { bn: "শুষ্ক", en: "Dry" },
  wet: { bn: "ভেজা", en: "Wet" },
  addWater: { bn: "পানি ফোঁটা যোগ করুন", en: "Add Water Drops" },
  reset: { bn: "রিসেট", en: "Reset" },
  ionGauge: { bn: "মুক্ত H⁺/OH⁻ ঘনত্ব", en: "Free H⁺ / OH⁻ concentration" },
  equations: { bn: "লাইভ আয়নন সমীকরণ", en: "Live Dissociation" },
  keyIdea: { bn: "মূল ধারণা", en: "Key Concept" },
  keyText: {
    bn: "শুধু হাইড্রোজেন থাকলেই এসিড নয়। পানিতে দ্রবীভূত হয়ে মুক্ত H⁺ (বা H₃O⁺) দিলে তবেই এসিড; OH⁻ দিলে ক্ষারক।",
    en: "Hydrogen presence ≠ acid. A substance is acidic only when it releases free H⁺ (H₃O⁺) in water; basic when it releases OH⁻.",
  },
  noChange: { bn: "কোনো রঙ পরিবর্তন নেই", en: "No colour change" },
  turnedRed: { bn: "টকটকে লাল", en: "Vivid red" },
  turnedBlue: { bn: "গাঢ় নীল", en: "Deep blue" },
  warn: {
    bn: "পানি নেই → আয়ন নেই → লিটমাস অপরিবর্তিত",
    en: "No water → no ionization → litmus unchanged",
  },
  paperKind: { bn: "লিটমাস কাগজ", en: "Litmus Paper" },
  status: { bn: "অবস্থা", en: "Status" },
  microscopic: { bn: "মাইক্রোস্কোপিক দৃশ্য", en: "Microscopic view" },
  contact: { bn: "কাগজ স্পর্শ করুন", en: "Touch Paper" },
  touching: { bn: "সংস্পর্শে", en: "In contact" },
};

const tr = (k: keyof typeof T, l: Lang) => T[k][l];

// ────────── Component ──────────
export default function RoleOfWaterAcidBaseLab({ onBack }: { onBack: () => void }) {
  const [lang, setLang] = useState<Lang>("bn");
  const [compound, setCompound] = useState<Compound>("hcl");
  const [litmusState, setLitmusState] = useState<LitmusState>("dry");
  const [waterDrops, setWaterDrops] = useState(0); // discrete drops added
  const [touching, setTouching] = useState(false);
  const [dropAnim, setDropAnim] = useState<number[]>([]);

  const info = COMPOUNDS[compound];
  const isWaterPresent = litmusState === "wet" || waterDrops > 0;

  // Reset when switching compound
  useEffect(() => {
    setLitmusState("dry");
    setWaterDrops(0);
    setTouching(false);
  }, [compound]);

  // Ionization % — 0 dry, ramps up with wet/drops, capped for non-ionising
  const ionPct = useMemo(() => {
    if (!isWaterPresent) return 0;
    if (!info.isAcid && !info.isBase) return 4; // ethanol trickle
    const base = litmusState === "wet" ? 55 : 0;
    return Math.min(100, base + waterDrops * 18);
  }, [isWaterPresent, info, litmusState, waterDrops]);

  // Litmus colour — depends on paper kind (matches expected) + ionization
  const paperKind: "blue" | "red" = info.litmusExpected;
  const litmusColor: LitmusColor = useMemo(() => {
    if (!touching) return paperKind;
    if (!isWaterPresent) return paperKind;
    if (!info.isAcid && !info.isBase) return paperKind; // ethanol → nothing
    if (info.isAcid && paperKind === "blue" && ionPct > 20) return "red";
    if (info.isBase && paperKind === "red" && ionPct > 20) return "blue";
    return paperKind;
  }, [touching, isWaterPresent, info, ionPct, paperKind]);

  const changed = litmusColor !== paperKind;

  const addDrop = () => {
    setWaterDrops((d) => Math.min(5, d + 1));
    const id = Date.now();
    setDropAnim((a) => [...a, id]);
    setTimeout(() => setDropAnim((a) => a.filter((x) => x !== id)), 900);
  };

  const reset = () => {
    setLitmusState("dry");
    setWaterDrops(0);
    setTouching(false);
  };

  const L = (k: keyof typeof T) => tr(k, lang);

  // ────────── UI Sections ──────────
  const info_left = (
    <>
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-lab-sm">{L("keyIdea")}</CardTitle>
          <Info className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="text-lab-xs leading-relaxed text-muted-foreground">
          {L("keyText")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lab-sm flex items-center gap-1.5">
            <Droplets className="h-4 w-4 text-sky-500" />
            {L("ionGauge")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IonGauge percent={ionPct} kind={info.isAcid ? "H⁺" : info.isBase ? "OH⁻" : "—"} />
          <div className="mt-2 text-center text-lab-xs">
            {isWaterPresent ? (
              <span className="font-semibold text-emerald-600">
                {info.isAcid || info.isBase ? "আয়নন হচ্ছে · Ionising" : "অ-আয়নিক · Non-ionising"}
              </span>
            ) : (
              <span className="font-semibold text-rose-500">{L("warn")}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lab-sm">{L("equations")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-lab-xs">
          <EqRow label={L("dry")} eq={info.dryEq} active={!isWaterPresent} tone="rose" />
          <EqRow
            label={L("wet")}
            eq={info.wetEq}
            active={isWaterPresent}
            tone={info.isAcid ? "amber" : info.isBase ? "sky" : "slate"}
          />
        </CardContent>
      </Card>
    </>
  );

  const controls = (
    <>
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-lab-sm">{L("reagent")}</CardTitle>
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
        <CardContent>
          <Tabs value={compound} onValueChange={(v) => setCompound(v as Compound)}>
            <TabsList className="grid grid-cols-3 h-auto">
              <TabsTrigger value="hcl" className="text-lab-xs py-1.5">
                HCl(g)
              </TabsTrigger>
              <TabsTrigger value="ethanol" className="text-lab-xs py-1.5">
                C₂H₅OH
              </TabsTrigger>
              <TabsTrigger value="naoh" className="text-lab-xs py-1.5">
                NaOH(s)
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-2 text-lab-xs text-muted-foreground">
            <div className="font-semibold text-foreground">
              {lang === "bn" ? info.nameBn : info.nameEn}
            </div>
            <div>{info.formula}</div>
            <div className="mt-1">
              {info.hasHydrogen && (
                <Badge variant="outline" className="mr-1 text-[10px]">
                  H present
                </Badge>
              )}
              {info.isAcid && <Badge className="bg-amber-500 text-[10px]">Acid</Badge>}
              {info.isBase && <Badge className="bg-sky-500 text-[10px]">Base</Badge>}
              {!info.isAcid && !info.isBase && (
                <Badge variant="secondary" className="text-[10px]">
                  Neutral
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lab-sm">{L("litmusToggle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md border p-2">
            <span className="text-lab-xs font-medium">
              {litmusState === "dry" ? L("dry") : L("wet")} · {L("paperKind")}
            </span>
            <Switch
              checked={litmusState === "wet"}
              onCheckedChange={(v) => setLitmusState(v ? "wet" : "dry")}
            />
          </div>

          <Button
            variant="outline"
            className="w-full h-9"
            onClick={addDrop}
            disabled={waterDrops >= 5}
          >
            <Droplets className="h-4 w-4 mr-1.5 text-sky-500" />
            {L("addWater")} ({waterDrops}/5)
          </Button>

          <Button
            variant={touching ? "default" : "secondary"}
            className="w-full h-9"
            onClick={() => setTouching((t) => !t)}
          >
            {touching ? L("touching") : L("contact")}
          </Button>

          <Button variant="ghost" className="w-full h-8 text-lab-xs" onClick={reset}>
            <RefreshCcw className="h-3.5 w-3.5 mr-1" /> {L("reset")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lab-sm">{L("status")}</CardTitle>
        </CardHeader>
        <CardContent className="text-lab-xs space-y-1">
          <div>
            💧 {L("wet").toLowerCase()}?{" "}
            <span
              className={
                isWaterPresent ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"
              }
            >
              {isWaterPresent ? "Yes" : "No"}
            </span>
          </div>
          <div>
            🎨 {L("paperKind")}:{" "}
            <span
              className="font-bold"
              style={{
                color:
                  litmusColor === "red"
                    ? "#dc2626"
                    : litmusColor === "blue"
                      ? "#2563eb"
                      : "#7c3aed",
              }}
            >
              {litmusColor.toUpperCase()}
            </span>
          </div>
          <div className="text-muted-foreground">
            {changed ? (litmusColor === "red" ? L("turnedRed") : L("turnedBlue")) : L("noChange")}
          </div>
        </CardContent>
      </Card>
    </>
  );

  const visual = (
    <LabScene
      compound={info}
      isWaterPresent={isWaterPresent}
      litmusState={litmusState}
      litmusColor={litmusColor}
      paperKind={paperKind}
      touching={touching}
      ionPct={ionPct}
      dropAnim={dropAnim}
      lang={lang}
    />
  );

  return (
    <TheoryLabShell
      onBack={onBack}
      titleBn={T.title.bn}
      subtitleEn={T.subtitle.en}
      headerIcon={
        <div className="rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 p-1.5 text-white shadow">
          <FlaskConical className="h-4 w-4" />
        </div>
      }
      badge={
        <Badge
          className={
            !isWaterPresent
              ? "bg-slate-500"
              : info.isAcid
                ? "bg-amber-500"
                : info.isBase
                  ? "bg-sky-500"
                  : "bg-slate-400"
          }
        >
          {isWaterPresent ? `${ionPct}% ionised` : "Dry · আয়নন 0%"}
        </Badge>
      }
      info={info_left}
      visual={visual}
      controls={controls}
      theoryLabel="থিওরি · Why water matters"
      theory={
        <div className="space-y-3">
          <p>
            <strong>এসিড</strong> সেই যৌগ যা জলীয় দ্রবণে H⁺ (বা H₃O⁺) আয়ন দান করে।
            <strong> ক্ষারক</strong> সেই যৌগ যা জলীয় দ্রবণে OH⁻ আয়ন দান করে।
          </p>
          <p>
            শুষ্ক HCl গ্যাসে অণুগুলো সমযোজী (H–Cl)। এতে H পরমাণু আছে ঠিকই, কিন্তু বন্ধন ভেঙে H⁺ বের
            হয় না — তাই লিটমাস রঙ বদলায় না। পানি (H₂O) একটি পোলার দ্রাবক; এর ধনাত্মক ও ঋণাত্মক
            প্রান্ত HCl অণুকে টেনে ভেঙে দেয়:
          </p>
          <pre className="rounded bg-slate-100 p-2 text-lab-xs">
            HCl(g) + H₂O(l) → H₃O⁺(aq) + Cl⁻(aq)
          </pre>
          <p>
            মুক্ত H₃O⁺ (হাইড্রোনিয়াম আয়ন) লিটমাসের অ্যানথোসায়ানিন রঞ্জকের সাথে বিক্রিয়া করে নীল
            → লাল করে। একইভাবে শুষ্ক NaOH দানা লিটমাসে ছোঁয়ালে কিছু হয় না, কিন্তু পানিতে দ্রবীভূত
            হলে OH⁻ মুক্ত করে লাল লিটমাস → নীল করে।
          </p>
          <p>
            ইথানল (C₂H₅OH)–এ H আছে, কিন্তু O–H বন্ধন এত শক্ত যে পানিতেও H⁺ মুক্ত করে না — তাই এটি
            হাইড্রোজেন থাকা সত্ত্বেও এসিড নয়।
          </p>
          <p className="font-semibold">
            মূল কথা: <em>H থাকলেই এসিড নয়</em> — জলীয় দ্রবণে <em>H⁺ মুক্ত হলে</em> তবেই এসিড।
          </p>
        </div>
      }
    />
  );
}

// ────────── Ion Gauge ──────────
function IonGauge({ percent, kind }: { percent: number; kind: string }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const dash = (percent / 100) * C;
  const color = percent === 0 ? "#94a3b8" : percent > 50 ? "#10b981" : "#f59e0b";
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
          style={{ transition: "stroke-dasharray 0.5s, stroke 0.4s" }}
          strokeLinecap="round"
        />
        <text x="45" y="43" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a">
          {percent}%
        </text>
        <text x="45" y="58" textAnchor="middle" fontSize="9" fill="#64748b">
          {kind}
        </text>
      </svg>
    </div>
  );
}

// ────────── Equation Row ──────────
function EqRow({
  label,
  eq,
  active,
  tone,
}: {
  label: string;
  eq: string;
  active: boolean;
  tone: "amber" | "sky" | "rose" | "slate";
}) {
  const tones: Record<string, string> = {
    amber: "border-amber-400 bg-amber-50 text-amber-900",
    sky: "border-sky-400 bg-sky-50 text-sky-900",
    rose: "border-rose-400 bg-rose-50 text-rose-900",
    slate: "border-slate-300 bg-slate-50 text-slate-700",
  };
  return (
    <div
      className={`rounded-md border px-2 py-1.5 transition-all ${
        active
          ? `${tones[tone]} shadow-sm scale-[1.01]`
          : "border-slate-200 bg-slate-50/50 text-slate-400"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide font-semibold opacity-70">{label}</div>
      <div className="font-mono text-lab-xs">{eq}</div>
    </div>
  );
}

// ────────── Scene (SVG) ──────────
function LabScene({
  compound,
  isWaterPresent,
  litmusState,
  litmusColor,
  paperKind,
  touching,
  ionPct,
  dropAnim,
  lang,
}: {
  compound: CompoundInfo;
  isWaterPresent: boolean;
  litmusState: LitmusState;
  litmusColor: LitmusColor;
  paperKind: "blue" | "red";
  touching: boolean;
  ionPct: number;
  dropAnim: number[];
  lang: Lang;
}) {
  // Animate ion particles when water present + touching
  const [tick, setTick] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!isWaterPresent || !touching) return;
    const loop = () => {
      setTick((t) => t + 1);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [isWaterPresent, touching]);

  const paperFill =
    litmusColor === "red" ? "#dc2626" : litmusColor === "blue" ? "#2563eb" : "#7c3aed";

  const showMicro = isWaterPresent && touching && (compound.isAcid || compound.isBase);

  return (
    <div className="relative h-full w-full rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-inner overflow-hidden">
      <svg viewBox="0 0 400 340" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {/* bench */}
        <rect x="0" y="290" width="400" height="50" fill="#1e293b" />
        <line x1="0" y1="290" x2="400" y2="290" stroke="#334155" strokeWidth="1" />

        {/* Watch-glass / gas source */}
        <ellipse cx="120" cy="270" rx="70" ry="14" fill="#475569" />
        <path d="M60 268 Q120 240 180 268 Z" fill={compound.color} opacity="0.75" />
        <text x="120" y="298" textAnchor="middle" fontSize="10" fill="#cbd5e1" fontWeight="600">
          {lang === "bn" ? compound.nameBn : compound.nameEn}
        </text>

        {/* Rising gas puffs for HCl */}
        {compound.id === "hcl" &&
          Array.from({ length: 4 }).map((_, i) => {
            const y = 240 - ((tick / 2 + i * 30) % 120);
            return (
              <circle
                key={i}
                cx={120 + Math.sin((tick + i * 20) / 15) * 8}
                cy={y}
                r="8"
                fill="#fde68a"
                opacity={0.3}
              />
            );
          })}

        {/* Water dropper */}
        <g transform="translate(260, 40)">
          <rect x="-6" y="0" width="12" height="55" fill="#94a3b8" rx="3" />
          <rect x="-10" y="55" width="20" height="8" fill="#64748b" rx="2" />
          <polygon points="-4,63 4,63 0,78" fill="#38bdf8" opacity="0.8" />
        </g>
        {dropAnim.map((id, i) => (
          <circle key={id} cx={260} cy={80} r={4} fill="#38bdf8">
            <animate attributeName="cy" from="80" to="230" dur="0.9s" fill="freeze" />
            <animate attributeName="opacity" from="1" to="0.2" dur="0.9s" fill="freeze" />
          </circle>
        ))}

        {/* Litmus paper — draggable feel: sits above compound when touching */}
        <g transform={`translate(${touching ? 100 : 260}, ${touching ? 235 : 130})`}>
          <rect
            x="0"
            y="0"
            width="60"
            height="26"
            rx="3"
            fill={paperFill}
            style={{ transition: "fill 0.6s ease" }}
            stroke="#0f172a"
            strokeWidth="1"
          />
          {/* gradient wipe when changing */}
          {litmusColor !== paperKind && (
            <rect x="0" y="0" width="60" height="26" rx="3" fill="url(#wipe)" opacity="0.5">
              <animate attributeName="width" from="0" to="60" dur="0.6s" fill="freeze" />
            </rect>
          )}
          <text x="30" y="17" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">
            {paperKind === "blue" ? "Blue Litmus" : "Red Litmus"}
          </text>
        </g>

        <defs>
          <linearGradient id="wipe" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Wet paper shimmer */}
        {litmusState === "wet" && (
          <g transform={`translate(${touching ? 100 : 260}, ${touching ? 235 : 130})`}>
            <circle cx={10} cy={5} r="2" fill="#38bdf8" opacity="0.7">
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={50} cy={20} r="1.5" fill="#38bdf8" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.2;0.7;0.2"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}

        {/* Warning banner when dry */}
        {!isWaterPresent && touching && (
          <g>
            <rect x="220" y="150" width="170" height="42" rx="6" fill="#fecaca" stroke="#dc2626" />
            <text x="305" y="167" textAnchor="middle" fontSize="10" fontWeight="700" fill="#991b1b">
              ⚠ No water, no ionization
            </text>
            <text x="305" y="182" textAnchor="middle" fontSize="9" fill="#7f1d1d">
              পানি ছাড়া লিটমাস অপরিবর্তিত
            </text>
          </g>
        )}

        {/* Microscopic ion particles */}
        {showMicro && (
          <g>
            {Array.from({ length: 8 }).map((_, i) => {
              const t = (tick + i * 12) / 25;
              const cx = 130 + Math.sin(t + i) * 25;
              const cy = 235 - ((t * 15) % 40);
              const ionLabel = compound.isAcid ? "H⁺" : "OH⁻";
              const fill = compound.isAcid ? "#f97316" : "#0ea5e9";
              return (
                <g key={i} opacity={0.9}>
                  <circle cx={cx} cy={cy} r="7" fill={fill} />
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#fff"
                    fontWeight="700"
                  >
                    {ionLabel}
                  </text>
                </g>
              );
            })}
            {/* counter-ion */}
            {Array.from({ length: 4 }).map((_, i) => {
              const t = (tick + i * 20) / 30;
              const cx = 110 + Math.cos(t + i) * 30;
              const cy = 260 + Math.sin(t * 1.3) * 5;
              const ionLabel = compound.isAcid ? "Cl⁻" : "Na⁺";
              return (
                <g key={"c" + i} opacity={0.85}>
                  <circle cx={cx} cy={cy} r="6" fill="#334155" />
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#fff"
                    fontWeight="700"
                  >
                    {ionLabel}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Ionisation strength glow around paper */}
        {ionPct > 20 && touching && (
          <circle
            cx={130}
            cy={248}
            r={40}
            fill="none"
            stroke={paperFill}
            strokeWidth="1.5"
            opacity="0.4"
          >
            <animate attributeName="r" values="30;46;30" dur="1.4s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.5;0.05;0.5"
              dur="1.4s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>

      {/* Overlay label */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-100 backdrop-blur">
        <Beaker className="h-3 w-3 text-cyan-400" />
        {showMicro ? T.microscopic[lang] : "Macroscopic"}
      </div>
    </div>
  );
}
