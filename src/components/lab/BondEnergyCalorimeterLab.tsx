/**
 * Bond Energy & Calorimeter Lab
 * NCTB Class 9-10 · Chapter 8 · রসায়ন ও শক্তি
 *
 * Gamified bilingual (Bangla + English) simulation for
 * bond-breaking (endothermic) vs bond-forming (exothermic)
 * and net ΔH = ΣE(broken) − ΣE(formed).
 */
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Flame,
  Scissors,
  Snowflake,
  RotateCcw,
  Zap,
  Thermometer,
  CheckCircle2,
  Languages,
  Sparkles,
  Atom as AtomIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import TheoryLabShell from "./TheoryLabShell";

interface Props {
  onBack: () => void;
}

/* ─────────────────────────────────────────────────────────
 * i18n
 * ───────────────────────────────────────────────────────── */
type Lang = "bn" | "en";

const T = {
  title: { bn: "বন্ধন শক্তি ও ক্যালোরিমিটার", en: "Bond Energy & Calorimeter" },
  subtitle: {
    bn: "ΔH = ΣE(ভাঙা) − ΣE(গঠিত)",
    en: "ΔH = ΣE(broken) − ΣE(formed)",
  },
  reaction: { bn: "বিক্রিয়া নির্বাচন", en: "Reaction" },
  bondTable: { bn: "বন্ধন শক্তি (kJ/mol)", en: "Bond Energies (kJ/mol)" },
  phase1: { bn: "ধাপ ১ — পুরাতন বন্ধন ভাঙুন", en: "Phase 1 — Break Bonds" },
  phase2: { bn: "ধাপ ২ — নতুন বন্ধন গড়ুন", en: "Phase 2 — Form Bonds" },
  done: { bn: "সম্পন্ন", en: "Complete" },
  absorbed: { bn: "শোষিত শক্তি", en: "Energy Absorbed" },
  released: { bn: "নির্গত শক্তি", en: "Energy Released" },
  deltaH: { bn: "নেট ΔH", en: "Net ΔH" },
  exo: { bn: "তাপোৎপাদী · Exothermic", en: "Exothermic · তাপোৎপাদী" },
  endo: { bn: "তাপহারী · Endothermic", en: "Endothermic · তাপহারী" },
  temp: { bn: "ক্যালোরিমিটার তাপমাত্রা", en: "Calorimeter Temperature" },
  reset: { bn: "রিসেট", en: "Reset" },
  breakBond: { bn: "বন্ধন ভাঙুন", en: "Break bond" },
  formBond: { bn: "বন্ধন গড়ুন", en: "Form bond" },
  atomPool: { bn: "মুক্ত পরমাণু পুল", en: "Free Atom Pool" },
  clickBond: {
    bn: "সবুজ আলোকিত বন্ধন-এ ক্লিক করে ভাঙুন",
    en: "Click glowing bonds to snip them",
  },
  clickForm: {
    bn: "ডান পাশে “গড়ুন” বাটনে ক্লিক করে পণ্য অণু তৈরি করুন",
    en: "Click the “Form” buttons on the right to build product molecules",
  },
  theory: { bn: "থিওরি ও বিস্তারিত", en: "Theory & Details" },
} as const;

const t = (k: keyof typeof T, l: Lang) => T[k][l];

/* ─────────────────────────────────────────────────────────
 * Reaction data
 * ───────────────────────────────────────────────────────── */

interface BondRef {
  label: string; // "C-H"
  energy: number; // kJ/mol
}

interface Bond {
  id: string;
  label: string; // "C-H"
  energy: number;
  broken: boolean;
}

interface ReactionSpec {
  id: "combustion" | "hcl" | "no";
  labelBn: string;
  labelEn: string;
  equation: string;
  category: "exo" | "endo";
  reactantsBonds: Omit<Bond, "broken">[];
  productsBonds: Omit<Bond, "broken">[]; // to be formed
  bondRefs: BondRef[];
  reactantMolecules: string[]; // for display: e.g. ["CH₄", "O₂", "O₂"]
  productMolecules: string[];
  descBn: string;
  descEn: string;
}

const REACTIONS: ReactionSpec[] = [
  {
    id: "combustion",
    labelBn: "মিথেন দহন",
    labelEn: "Methane Combustion",
    equation: "CH₄ + 2 O₂ → CO₂ + 2 H₂O",
    category: "exo",
    reactantsBonds: [
      { id: "r-ch1", label: "C-H", energy: 414 },
      { id: "r-ch2", label: "C-H", energy: 414 },
      { id: "r-ch3", label: "C-H", energy: 414 },
      { id: "r-ch4", label: "C-H", energy: 414 },
      { id: "r-oo1", label: "O=O", energy: 498 },
      { id: "r-oo2", label: "O=O", energy: 498 },
    ],
    productsBonds: [
      { id: "p-co1", label: "C=O", energy: 743 },
      { id: "p-co2", label: "C=O", energy: 743 },
      { id: "p-oh1", label: "O-H", energy: 464 },
      { id: "p-oh2", label: "O-H", energy: 464 },
      { id: "p-oh3", label: "O-H", energy: 464 },
      { id: "p-oh4", label: "O-H", energy: 464 },
    ],
    bondRefs: [
      { label: "C-H", energy: 414 },
      { label: "O=O", energy: 498 },
      { label: "C=O", energy: 743 },
      { label: "O-H", energy: 464 },
    ],
    reactantMolecules: ["CH₄", "O₂", "O₂"],
    productMolecules: ["CO₂", "H₂O", "H₂O"],
    descBn: "প্রাকৃতিক গ্যাসের দহন — উচ্চ তাপোৎপাদী।",
    descEn: "Natural-gas combustion — highly exothermic.",
  },
  {
    id: "hcl",
    labelBn: "হাইড্রোজেন + ক্লোরিন",
    labelEn: "Hydrogen + Chlorine",
    equation: "H₂ + Cl₂ → 2 HCl",
    category: "exo",
    reactantsBonds: [
      { id: "r-hh", label: "H-H", energy: 436 },
      { id: "r-clcl", label: "Cl-Cl", energy: 242 },
    ],
    productsBonds: [
      { id: "p-hcl1", label: "H-Cl", energy: 431 },
      { id: "p-hcl2", label: "H-Cl", energy: 431 },
    ],
    bondRefs: [
      { label: "H-H", energy: 436 },
      { label: "Cl-Cl", energy: 242 },
      { label: "H-Cl", energy: 431 },
    ],
    reactantMolecules: ["H₂", "Cl₂"],
    productMolecules: ["HCl", "HCl"],
    descBn: "ফটোকেমিক্যাল ফ্রি-র‍্যাডিক্যাল চেইন বিক্রিয়া।",
    descEn: "Photochemical free-radical chain reaction.",
  },
  {
    id: "no",
    labelBn: "নাইট্রোজেন + অক্সিজেন",
    labelEn: "Nitrogen + Oxygen",
    equation: "N₂ + O₂ → 2 NO",
    category: "endo",
    reactantsBonds: [
      { id: "r-nn", label: "N≡N", energy: 945 },
      { id: "r-oo", label: "O=O", energy: 498 },
    ],
    productsBonds: [
      { id: "p-no1", label: "N=O", energy: 607 },
      { id: "p-no2", label: "N=O", energy: 607 },
    ],
    bondRefs: [
      { label: "N≡N", energy: 945 },
      { label: "O=O", energy: 498 },
      { label: "N=O", energy: 607 },
    ],
    reactantMolecules: ["N₂", "O₂"],
    productMolecules: ["NO", "NO"],
    descBn: "উচ্চ তাপমাত্রায় (বজ্রপাত/ইঞ্জিন) ঘটে — তাপহারী।",
    descEn: "Occurs at very high temperatures (lightning, engines) — endothermic.",
  },
];

/* ─────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────── */

type Phase = "reactants" | "broken" | "products";

export default function BondEnergyCalorimeterLab({ onBack }: Props) {
  const [lang, setLang] = useState<Lang>("bn");
  const [rxnId, setRxnId] = useState<ReactionSpec["id"]>("combustion");
  const rxn = useMemo(() => REACTIONS.find((r) => r.id === rxnId)!, [rxnId]);

  const [rBonds, setRBonds] = useState<Bond[]>(() =>
    rxn.reactantsBonds.map((b) => ({ ...b, broken: false })),
  );
  const [pBonds, setPBonds] = useState<Bond[]>(() =>
    rxn.productsBonds.map((b) => ({ ...b, broken: true })), // "broken" = not yet formed
  );

  // Reset state when reaction changes
  useEffect(() => {
    setRBonds(rxn.reactantsBonds.map((b) => ({ ...b, broken: false })));
    setPBonds(rxn.productsBonds.map((b) => ({ ...b, broken: true })));
  }, [rxn]);

  const eBroken = useMemo(
    () => rBonds.filter((b) => b.broken).reduce((s, b) => s + b.energy, 0),
    [rBonds],
  );
  const eFormed = useMemo(
    () => pBonds.filter((b) => !b.broken).reduce((s, b) => s + b.energy, 0),
    [pBonds],
  );

  const allBroken = rBonds.every((b) => b.broken);
  const allFormed = pBonds.every((b) => !b.broken);
  const phase: Phase = !allBroken ? "reactants" : !allFormed ? "broken" : "products";

  const deltaH = eBroken - eFormed; // convention: E(broken) − E(formed)
  const netVisible = allBroken; // only meaningful once bonds are broken
  const finalDeltaH = allFormed ? deltaH : 0;
  const isExo = finalDeltaH < 0;

  // Thermometer: 25°C base. Scale ΔH to a ±30°C swing over ±1000 kJ/mol.
  const displayDelta = phase === "products" ? deltaH : eBroken - eFormed;
  const tempC = 25 + Math.max(-30, Math.min(30, -displayDelta / 33));

  const breakBond = useCallback((id: string) => {
    setRBonds((prev) => prev.map((b) => (b.id === id ? { ...b, broken: true } : b)));
  }, []);
  const formBond = useCallback(
    (id: string) => {
      if (!allBroken) return;
      setPBonds((prev) => prev.map((b) => (b.id === id ? { ...b, broken: false } : b)));
    },
    [allBroken],
  );

  const reset = useCallback(() => {
    setRBonds(rxn.reactantsBonds.map((b) => ({ ...b, broken: false })));
    setPBonds(rxn.productsBonds.map((b) => ({ ...b, broken: true })));
  }, [rxn]);

  const brokenCount = rBonds.filter((b) => b.broken).length;
  const formedCount = pBonds.filter((b) => !b.broken).length;

  // ── Layout ──
  return (
    <TheoryLabShell
      onBack={onBack}
      titleBn={t("title", lang)}
      subtitleEn={`Chapter 8 · ${rxn.equation}`}
      headerIcon={
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/30">
          <Flame className="h-5 w-5" />
        </div>
      }
      badge={
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setLang((l) => (l === "bn" ? "en" : "bn"))}
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === "bn" ? "EN" : "বাংলা"}
          </Button>
          {phase === "products" ? (
            <Badge
              className={cn(
                "gap-1 text-xs",
                isExo ? "bg-emerald-500 hover:bg-emerald-500" : "bg-sky-500 hover:bg-sky-500",
              )}
            >
              {isExo ? <Flame className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}
              {isExo ? t("exo", lang) : t("endo", lang)}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {phase === "reactants" ? t("phase1", lang) : t("phase2", lang)}
            </Badge>
          )}
        </div>
      }
      /* ─── LEFT ─── */
      info={
        <>
          <Card className="border-slate-200/70 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {t("reaction", lang)}
            </div>
            <Select value={rxnId} onValueChange={(v) => setRxnId(v as ReactionSpec["id"])}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REACTIONS.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs">
                    {lang === "bn" ? r.labelBn : r.labelEn} —{" "}
                    <span className="text-muted-foreground">{r.equation}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 rounded-md bg-slate-50 px-2 py-1.5 text-[11px] leading-relaxed text-slate-600">
              {lang === "bn" ? rxn.descBn : rxn.descEn}
            </p>
            <div className="mt-2 rounded-md bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-1.5 text-center font-mono text-sm font-semibold text-slate-800">
              {rxn.equation}
            </div>
          </Card>

          <Card className="border-slate-200/70 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <AtomIcon className="h-3.5 w-3.5 text-indigo-500" />
              {t("bondTable", lang)}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {rxn.bondRefs.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px]"
                >
                  <span className="font-mono font-semibold text-slate-700">{b.label}</span>
                  <span className="font-mono text-slate-600">{b.energy}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
              {lang === "bn"
                ? "বন্ধন শক্তি = ১ মোল বন্ধন ভাঙতে যে শক্তি লাগে।"
                : "Bond energy = energy required to break 1 mole of that bond."}
            </p>
          </Card>

          <Card className="border-slate-200/70 bg-white p-3 shadow-sm">
            <div className="mb-1.5 text-xs font-semibold text-slate-700">
              {lang === "bn" ? "অগ্রগতি" : "Progress"}
            </div>
            <div className="space-y-2">
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-rose-600">{t("phase1", lang)}</span>
                  <span className="font-mono text-slate-500">
                    {brokenCount}/{rBonds.length}
                  </span>
                </div>
                <Progress value={(brokenCount / rBonds.length) * 100} className="h-1.5" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600">{t("phase2", lang)}</span>
                  <span className="font-mono text-slate-500">
                    {formedCount}/{pBonds.length}
                  </span>
                </div>
                <Progress
                  value={(formedCount / pBonds.length) * 100}
                  className="h-1.5"
                />
              </div>
            </div>
          </Card>
        </>
      }
      /* ─── CENTER ─── */
      visual={
        <div className="relative h-full w-full">
          <div className="absolute inset-0 rounded-2xl border border-slate-700/50 bg-slate-900/85 shadow-2xl backdrop-blur-md" />
          <div className="relative flex h-full w-full flex-col gap-2 p-3">
            {/* Phase title */}
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {phase === "reactants"
                  ? t("phase1", lang)
                  : phase === "broken"
                    ? t("phase2", lang)
                    : t("done", lang)}
              </div>
              <div className="text-[10px] text-slate-500">
                {phase === "reactants" ? t("clickBond", lang) : t("clickForm", lang)}
              </div>
            </div>

            {/* Reactant molecules */}
            <div className="flex-1 rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-rose-300/80">
                {lang === "bn" ? "বিক্রিয়ক" : "Reactants"}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {rxn.reactantMolecules.map((m, i) => (
                  <MoleculeCard
                    key={`r-${i}`}
                    label={m}
                    tone={allBroken ? "empty" : "reactant"}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {rBonds.map((b) => (
                  <BondChip
                    key={b.id}
                    label={b.label}
                    energy={b.energy}
                    broken={b.broken}
                    onClick={() => !b.broken && breakBond(b.id)}
                    action={lang === "bn" ? "ভাঙুন" : "Break"}
                    tone="rose"
                  />
                ))}
              </div>
            </div>

            {/* Free atom pool */}
            {allBroken && !allFormed && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2">
                <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  <span>{t("atomPool", lang)}</span>
                  <Sparkles className="h-3 w-3 animate-pulse" />
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {getAtomPool(rxn).map((a, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-amber-400/60 bg-slate-900/70 px-2 py-0.5 font-mono text-[11px] text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.35)]"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product molecules */}
            <div className="flex-1 rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
                {lang === "bn" ? "উৎপাদ" : "Products"}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {rxn.productMolecules.map((m, i) => (
                  <MoleculeCard
                    key={`p-${i}`}
                    label={m}
                    tone={allFormed ? "product" : "empty"}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {pBonds.map((b) => (
                  <BondChip
                    key={b.id}
                    label={b.label}
                    energy={b.energy}
                    broken={b.broken /* here broken=notFormed */}
                    disabled={!allBroken}
                    onClick={() => formBond(b.id)}
                    action={lang === "bn" ? "গড়ুন" : "Form"}
                    tone="emerald"
                    invert
                  />
                ))}
              </div>
            </div>

            {/* Final flash */}
            {allFormed && (
              <div
                className={cn(
                  "rounded-xl border p-2 text-center text-xs font-semibold",
                  isExo
                    ? "border-orange-400/60 bg-orange-500/15 text-orange-200"
                    : "border-sky-400/60 bg-sky-500/15 text-sky-200",
                )}
              >
                {isExo ? "🔥 " : "❄️ "}
                ΔH = {deltaH > 0 ? "+" : ""}
                {deltaH} kJ/mol · {isExo ? t("exo", lang) : t("endo", lang)}
              </div>
            )}
          </div>
        </div>
      }
      /* ─── RIGHT ─── */
      controls={
        <>
          <Card className="border-slate-200/70 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Thermometer className="h-3.5 w-3.5 text-rose-500" />
              {t("temp", lang)}
            </div>
            <ThermometerGauge tempC={tempC} isExo={isExo && allFormed} lang={lang} />
          </Card>

          <Card className="border-slate-200/70 bg-white p-3 shadow-sm">
            <div className="mb-2 text-xs font-semibold text-slate-700">
              {lang === "bn" ? "শক্তি তুলনা" : "Energy Comparison"}
            </div>
            <EnergyBars eBroken={eBroken} eFormed={eFormed} lang={lang} />
          </Card>

          <Card
            className={cn(
              "border p-3 shadow-sm transition-colors",
              phase === "products"
                ? isExo
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-sky-300 bg-sky-50"
                : "border-slate-200/70 bg-white",
            )}
          >
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {t("deltaH", lang)}
            </div>
            <div className="rounded-md bg-white/70 px-2 py-1.5 text-center font-mono text-[11px] text-slate-700">
              ΔH = E<sub>broken</sub> − E<sub>formed</sub>
            </div>
            <div className="mt-1.5 flex items-baseline justify-center gap-1">
              <span
                className={cn(
                  "font-mono text-2xl font-bold",
                  netVisible
                    ? deltaH < 0
                      ? "text-emerald-600"
                      : "text-sky-600"
                    : "text-slate-400",
                )}
              >
                {netVisible ? (deltaH > 0 ? "+" : "") + deltaH : "—"}
              </span>
              <span className="text-[10px] text-slate-500">kJ/mol</span>
            </div>
            <div className="mt-1 text-center text-[10px] text-slate-500">
              {eBroken} − {eFormed}
            </div>
            {phase === "products" && (
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className={isExo ? "text-emerald-700" : "text-sky-700"}>
                  {isExo ? t("exo", lang) : t("endo", lang)}
                </span>
              </div>
            )}
          </Card>

          <Button variant="outline" size="sm" onClick={reset} className="mt-1 h-8 gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {t("reset", lang)}
          </Button>
        </>
      }
      /* ─── THEORY ─── */
      theoryLabel={t("theory", lang)}
      theory={
        <div className="space-y-3">
          <h3 className="text-base font-bold">
            {lang === "bn"
              ? "বন্ধন শক্তি ও তাপের পরিবর্তন"
              : "Bond Energy & Enthalpy Change"}
          </h3>
          <p>
            {lang === "bn"
              ? "রাসায়নিক বিক্রিয়ায় পুরাতন বন্ধন ভাঙতে শক্তি শোষিত হয় (এন্ডোথার্মিক ধাপ) এবং নতুন বন্ধন গঠনে শক্তি নির্গত হয় (এক্সোথার্মিক ধাপ)।"
              : "In a chemical reaction, breaking old bonds absorbs energy (endothermic step) and forming new bonds releases energy (exothermic step)."}
          </p>
          <p className="rounded-md bg-slate-100 p-2 font-mono">
            ΔH = ΣE(broken) − ΣE(formed)
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              {lang === "bn"
                ? "ΔH < 0 হলে বিক্রিয়া তাপোৎপাদী — চারপাশ গরম হয়।"
                : "ΔH < 0 → exothermic — surroundings warm up."}
            </li>
            <li>
              {lang === "bn"
                ? "ΔH > 0 হলে বিক্রিয়া তাপহারী — চারপাশ ঠান্ডা হয়।"
                : "ΔH > 0 → endothermic — surroundings cool down."}
            </li>
          </ul>
          <p>
            {lang === "bn"
              ? "মিথেন দহনে C-H ও O=O ভাঙা প্রয়োজন, কিন্তু নবগঠিত C=O ও O-H অনেক শক্তিশালী — তাই বিপুল তাপ নির্গত হয়।"
              : "In methane combustion, breaking C-H and O=O costs energy, but the new C=O and O-H bonds are much stronger — so a large amount of heat is released."}
          </p>
        </div>
      }
    />
  );
}

/* ─────────────────────────────────────────────────────────
 * Small sub-components
 * ───────────────────────────────────────────────────────── */

function MoleculeCard({
  label,
  tone,
}: {
  label: string;
  tone: "reactant" | "product" | "empty";
}) {
  return (
    <div
      className={cn(
        "min-w-[52px] rounded-lg border px-3 py-1.5 text-center font-mono text-sm font-bold shadow-sm transition-all",
        tone === "reactant" &&
          "border-rose-400/60 bg-gradient-to-br from-rose-500/20 to-rose-600/10 text-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.35)]",
        tone === "product" &&
          "animate-in fade-in zoom-in border-emerald-400/60 bg-gradient-to-br from-emerald-500/25 to-emerald-600/10 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.45)]",
        tone === "empty" &&
          "border-dashed border-slate-600 bg-slate-800/40 text-slate-500",
      )}
    >
      {label}
    </div>
  );
}

function BondChip({
  label,
  energy,
  broken,
  onClick,
  disabled,
  action,
  tone,
  invert,
}: {
  label: string;
  energy: number;
  broken: boolean;
  onClick: () => void;
  disabled?: boolean;
  action: string;
  tone: "rose" | "emerald";
  /** If true, "broken" means "not yet formed" (product phase). */
  invert?: boolean;
}) {
  const active = invert ? !broken : !broken; // pending action state
  const isDone = invert ? !broken : broken; // done = broken(reactant) or formed(product)

  const doneClass =
    tone === "rose"
      ? "border-slate-600 bg-slate-800/50 text-slate-500 line-through"
      : "border-emerald-400/70 bg-emerald-500/20 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.5)]";

  const activeClass =
    tone === "rose"
      ? "border-rose-400/70 bg-rose-500/20 text-rose-100 hover:bg-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.45)] animate-pulse"
      : "border-emerald-400/70 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/30";

  return (
    <button
      type="button"
      disabled={disabled || isDone}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-all",
        isDone ? doneClass : active ? activeClass : "border-slate-700 bg-slate-800 text-slate-500",
        disabled && !isDone && "opacity-40",
      )}
      title={`${label} · ${energy} kJ/mol`}
    >
      {tone === "rose" ? (
        <Scissors className="h-2.5 w-2.5" />
      ) : (
        <Sparkles className="h-2.5 w-2.5" />
      )}
      <span className="font-semibold">{label}</span>
      <span className="text-[9px] opacity-80">{energy}</span>
      {!isDone && !disabled && (
        <span className="ml-0.5 hidden text-[9px] font-semibold uppercase group-hover:inline">
          {action}
        </span>
      )}
    </button>
  );
}

function ThermometerGauge({
  tempC,
  isExo,
  lang,
}: {
  tempC: number;
  isExo: boolean;
  lang: Lang;
}) {
  // Map −5..55 °C to 0..1
  const pct = Math.max(0, Math.min(1, (tempC - -5) / 60));
  const fillHeight = pct * 100;
  const fillColor =
    tempC > 28
      ? "linear-gradient(to top, #dc2626, #f97316)"
      : tempC < 22
        ? "linear-gradient(to top, #0ea5e9, #38bdf8)"
        : "linear-gradient(to top, #94a3b8, #cbd5e1)";

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-32 w-6">
        <div className="absolute inset-x-1 top-0 h-[calc(100%-14px)] rounded-full border border-slate-300 bg-slate-100 overflow-hidden">
          <div
            className="absolute inset-x-0 bottom-0 transition-[height] duration-500"
            style={{ height: `${fillHeight}%`, background: fillColor }}
          />
        </div>
        <div
          className="absolute -bottom-1 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full border border-slate-300 shadow"
          style={{ background: fillColor }}
        />
      </div>
      <div className="flex-1">
        <div className="font-mono text-2xl font-bold text-slate-800">
          {tempC.toFixed(1)}°C
        </div>
        <div
          className={cn(
            "mt-1 text-[10px] font-semibold",
            tempC > 28 ? "text-orange-600" : tempC < 22 ? "text-sky-600" : "text-slate-500",
          )}
        >
          {isExo
            ? lang === "bn"
              ? "🔥 তাপ নির্গত"
              : "🔥 Heat released"
            : tempC < 22
              ? lang === "bn"
                ? "❄️ তাপ শোষিত"
                : "❄️ Heat absorbed"
              : lang === "bn"
                ? "প্রারম্ভিক অবস্থা"
                : "Baseline"}
        </div>
      </div>
    </div>
  );
}

function EnergyBars({
  eBroken,
  eFormed,
  lang,
}: {
  eBroken: number;
  eFormed: number;
  lang: Lang;
}) {
  const max = Math.max(eBroken, eFormed, 1);
  const brokenH = (eBroken / max) * 100;
  const formedH = (eFormed / max) * 100;
  return (
    <div className="flex h-32 items-end gap-4 px-2">
      <BarCol
        label={lang === "bn" ? "শোষিত" : "Broken"}
        value={eBroken}
        heightPct={brokenH}
        color="from-rose-500 to-rose-400"
      />
      <BarCol
        label={lang === "bn" ? "নির্গত" : "Formed"}
        value={eFormed}
        heightPct={formedH}
        color="from-emerald-500 to-emerald-400"
      />
    </div>
  );
}

function BarCol({
  label,
  value,
  heightPct,
  color,
}: {
  label: string;
  value: number;
  heightPct: number;
  color: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <div className="font-mono text-[11px] font-bold text-slate-700">{value}</div>
      <div className="relative flex h-24 w-full max-w-[42px] items-end rounded-md bg-slate-100">
        <div
          className={cn("w-full rounded-md bg-gradient-to-t transition-[height] duration-500", color)}
          style={{ height: `${heightPct}%` }}
        />
      </div>
      <div className="text-[10px] font-semibold text-slate-600">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────── */

function getAtomPool(rxn: ReactionSpec): string[] {
  // Break down reactant molecules into free atoms (as displayed).
  const atoms: string[] = [];
  for (const m of rxn.reactantMolecules) {
    switch (m) {
      case "CH₄":
        atoms.push("C", "H", "H", "H", "H");
        break;
      case "O₂":
        atoms.push("O", "O");
        break;
      case "H₂":
        atoms.push("H", "H");
        break;
      case "Cl₂":
        atoms.push("Cl", "Cl");
        break;
      case "N₂":
        atoms.push("N", "N");
        break;
      default:
        atoms.push(m);
    }
  }
  return atoms;
}
