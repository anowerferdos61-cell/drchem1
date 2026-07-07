/**
 * Dr. Chem — Main App Dashboard
 * 4-card home: Curriculum Hub, Practical Lab Room, Video Lessons, Smart Notes
 */
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ExperimentId } from "./types";
import {
  FlaskConical,
  Atom,
  Beaker,
  TestTubes,
  Microscope,
  Zap,
  Droplets,
  Flame,
  Sparkles,
  GraduationCap,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Bot,
  PlayCircle,
  CheckCircle2,
  Circle,
  Search,
  Lock,
  Video,
  NotebookPen,
  Wind,
  Battery,
  Gem,
} from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PaywallModal } from "@/components/subscription/PaywallModal";
import { PendingPaymentBanner } from "@/components/subscription/PendingPaymentBanner";

interface DashboardProps {
  onEnterExperiments: () => void;
  onPickExperiment: (id: ExperimentId) => void;
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

type LabMeta = {
  id: ExperimentId;
  title: string;
  titleBn: string;
  icon: typeof FlaskConical;
  tint: string;
  iconColor: string;
  isCoreBoard: boolean;
  completed?: boolean;
};

const ALL_LABS: LabMeta[] = [
  { id: "titration", title: "Acid-Base Titration", titleBn: "অম্ল-ক্ষার টাইট্রেশন",
    icon: TestTubes, tint: "from-rose-500/15 to-pink-500/10", iconColor: "text-rose-500", isCoreBoard: true, completed: true },
  { id: "oxygen_prep", title: "Oxygen Preparation", titleBn: "অক্সিজেন প্রস্তুতি",
    icon: Sparkles, tint: "from-sky-500/15 to-cyan-500/10", iconColor: "text-sky-500", isCoreBoard: true, completed: true },
  { id: "co2_prep", title: "CO₂ Preparation", titleBn: "কার্বন ডাই-অক্সাইড প্রস্তুতি",
    icon: Beaker, tint: "from-slate-500/15 to-zinc-500/10", iconColor: "text-slate-600", isCoreBoard: true },
  { id: "nacl_crystal", title: "NaCl Crystallisation", titleBn: "NaCl কেলাসন",
    icon: Sparkles, tint: "from-amber-400/15 to-yellow-500/10", iconColor: "text-amber-500", isCoreBoard: true },
  { id: "ionic_covalent", title: "Ionic vs Covalent", titleBn: "আয়নিক বনাম সমযোজী",
    icon: Atom, tint: "from-violet-500/15 to-purple-500/10", iconColor: "text-violet-500", isCoreBoard: true },
  { id: "bonding_basics", title: "Chemical Bonding", titleBn: "রাসায়নিক বন্ধন",
    icon: Atom, tint: "from-indigo-500/15 to-blue-500/10", iconColor: "text-indigo-500", isCoreBoard: false },
  { id: "metallic_bonding", title: "Metallic Bonding", titleBn: "ধাতব বন্ধন — ইলেকট্রন সাগর",
    icon: Atom, tint: "from-orange-500/15 to-amber-500/10", iconColor: "text-orange-500", isCoreBoard: false },
  { id: "ionic_vs_covalent_theory", title: "Ionic vs Covalent Properties", titleBn: "আয়নিক বনাম সমযোজী — ধর্ম তুলনা",
    icon: Zap, tint: "from-violet-500/15 to-fuchsia-500/10", iconColor: "text-violet-500", isCoreBoard: false },
  { id: "mole_concept", title: "Avogadro Number & Mole Concept", titleBn: "অ্যাভোগেড্রো সংখ্যা ও মোল ধারণা",
    icon: TestTubes, tint: "from-emerald-500/15 to-teal-500/10", iconColor: "text-emerald-500", isCoreBoard: false },
  { id: "molarity_dilution", title: "Molarity & Dilution", titleBn: "মোলারিটি ও দ্রবণ লঘুকরণ",
    icon: FlaskConical, tint: "from-sky-500/15 to-blue-500/10", iconColor: "text-sky-500", isCoreBoard: false },
  { id: "empirical_formula", title: "Percentage Composition & Empirical Formula", titleBn: "শতকরা সংযুতি ও স্থূল সংকেত",
    icon: Sparkles, tint: "from-fuchsia-500/15 to-violet-500/10", iconColor: "text-fuchsia-500", isCoreBoard: false },
  { id: "limiting_reactant", title: "Limiting Reactant & Yield Predictor", titleBn: "লিমিটিং বিক্রিয়ক ও উৎপাদ",
    icon: Zap, tint: "from-orange-500/15 to-rose-500/10", iconColor: "text-orange-500", isCoreBoard: false },
  { id: "stp_molar_volume", title: "STP & Molar Volume Explorer", titleBn: "STP ও মোলার আয়তন",
    icon: Wind, tint: "from-emerald-500/15 to-cyan-500/10", iconColor: "text-emerald-500", isCoreBoard: false },
  { id: "na2co3_standard", title: "0.1 M Na₂CO₃ Standard", titleBn: "০.১ M Na₂CO₃ প্রমাণ দ্রবণ",
    icon: FlaskConical, tint: "from-emerald-500/15 to-green-500/10", iconColor: "text-emerald-500", isCoreBoard: true },
  { id: "cuso4_water", title: "CuSO₄·5H₂O Water of Crystallisation", titleBn: "CuSO₄·5H₂O কেলাস পানি",
    icon: Droplets, tint: "from-blue-500/15 to-cyan-500/10", iconColor: "text-blue-500", isCoreBoard: true },
  { id: "ph_scale", title: "pH Scale Explorer", titleBn: "pH স্কেল",
    icon: Beaker, tint: "from-fuchsia-500/15 to-pink-500/10", iconColor: "text-fuchsia-500", isCoreBoard: false },
  { id: "indicator_compare", title: "Indicator Comparison", titleBn: "নির্দেশক তুলনা",
    icon: Droplets, tint: "from-rose-500/15 to-orange-500/10", iconColor: "text-rose-500", isCoreBoard: false },
  { id: "solubility_rules", title: "Solubility Rules", titleBn: "দ্রাব্যতা নিয়ম",
    icon: Microscope, tint: "from-teal-500/15 to-emerald-500/10", iconColor: "text-teal-500", isCoreBoard: false },
  { id: "electrochemical_series", title: "Electrochemical Series", titleBn: "তড়িৎ-রাসায়নিক সারি",
    icon: Zap, tint: "from-yellow-500/15 to-amber-500/10", iconColor: "text-yellow-600", isCoreBoard: true },
  { id: "electron_config", title: "Electron Configuration", titleBn: "ইলেকট্রন বিন্যাস ও পর্যায়-গ্রুপ",
    icon: Atom, tint: "from-fuchsia-500/15 to-violet-500/10", iconColor: "text-fuchsia-500", isCoreBoard: false },
  { id: "periodic_trends", title: "Periodic Properties & Trends", titleBn: "পর্যায়বৃত্ত ধর্ম ও ট্রেন্ড",
    icon: Microscope, tint: "from-pink-500/15 to-fuchsia-500/10", iconColor: "text-pink-500", isCoreBoard: false },
  { id: "group_reactivity", title: "Special Groups & Water Reactivity", titleBn: "গ্রুপ ভিত্তিক বিশেষ মৌল ও পানির বিক্রিয়া",
    icon: Flame, tint: "from-orange-500/15 to-red-500/10", iconColor: "text-orange-500", isCoreBoard: false },
  { id: "periodic_anomalies", title: "Periodic Table Anomalies & Debate", titleBn: "পর্যায় সারণির পটভূমি ও ত্রুটি অনুসন্ধানকারী",
    icon: Sparkles, tint: "from-fuchsia-500/15 to-pink-500/10", iconColor: "text-fuchsia-500", isCoreBoard: false },
  { id: "kinetic_theory", title: "Kinetic Theory of Matter", titleBn: "পদার্থের গতিতত্ত্ব — কণা সিমুলেটর",
    icon: Droplets, tint: "from-cyan-500/15 to-teal-500/10", iconColor: "text-cyan-500", isCoreBoard: false },
  { id: "diffusion_race", title: "Diffusion Race (Graham's Law)", titleBn: "ব্যাপন প্রতিযোগিতা — গ্রাহামের সূত্র",
    icon: Sparkles, tint: "from-emerald-500/15 to-cyan-500/10", iconColor: "text-emerald-500", isCoreBoard: false },
  { id: "heating_curve", title: "Heating Curve of Water", titleBn: "পানির তাপন বক্ররেখা",
    icon: Flame, tint: "from-orange-500/15 to-rose-500/10", iconColor: "text-orange-500", isCoreBoard: false },
  { id: "atom_builder", title: "Build an Atom & Isotope Simulator", titleBn: "পরমাণু গঠন ও আইসোটোপ সিমুলেটর",
    icon: Atom, tint: "from-violet-500/15 to-purple-500/10", iconColor: "text-violet-500", isCoreBoard: false },
  { id: "atom_models", title: "Rutherford vs. Bohr Atom Model Face-off", titleBn: "রাদারফোর্ড বনাম বোর পরমাণু মডেল",
    icon: Atom, tint: "from-rose-500/15 to-cyan-500/10", iconColor: "text-cyan-500", isCoreBoard: false },
  { id: "aufbau_principle", title: "Aufbau Principle & Electron Configuration", titleBn: "আউফবাউ নীতি ও ইলেকট্রন বিন্যাস",
    icon: Atom, tint: "from-sky-500/15 to-violet-500/10", iconColor: "text-sky-500", isCoreBoard: false },
  { id: "isotope_stability", title: "Isotope Balance & Nuclear Stability", titleBn: "আইসোটোপ ভারসাম্য ও নিউক্লীয় স্থিতিশীলতা",
    icon: Atom, tint: "from-emerald-500/15 to-rose-500/10", iconColor: "text-emerald-400", isCoreBoard: false },
  { id: "daniel_cell", title: "Daniel Cell (Galvanic Cell)", titleBn: "ড্যানিয়েল সেল · গ্যালভানিক কোষ",
    icon: Zap, tint: "from-amber-500/15 to-yellow-500/10", iconColor: "text-amber-500", isCoreBoard: false },
  { id: "electrolytic_cell", title: "Electrolytic Cell (Electrolysis + Plating)", titleBn: "তড়িৎবিশ্লেষ্য কোষ · পানি বিশ্লেষণ ও প্লেটিং",
    icon: Zap, tint: "from-orange-500/15 to-amber-500/10", iconColor: "text-orange-500", isCoreBoard: false },
  { id: "dry_cell", title: "Dry Cell Mechanism (Zn-C battery)", titleBn: "ড্রাই সেল · অভ্যন্তরীণ গঠন ও বিক্রিয়া",
    icon: Battery, tint: "from-yellow-500/15 to-amber-500/10", iconColor: "text-yellow-600", isCoreBoard: false },
  { id: "fuel_combustion", title: "Fuel Combustion & Environment", titleBn: "জ্বালানি দহন ও পরিবেশ",
    icon: Flame, tint: "from-orange-500/15 to-red-500/10", iconColor: "text-orange-500", isCoreBoard: false },
  { id: "bond_energy_calorimeter", title: "Bond Energy & Calorimeter", titleBn: "বন্ধন শক্তি ও ΔH ক্যালোরিমিটার",
    icon: Flame, tint: "from-amber-500/15 to-orange-500/10", iconColor: "text-amber-500", isCoreBoard: false },
  { id: "role_of_water", title: "Role of Water in Acids & Bases", titleBn: "এসিড-ক্ষারকে পানির ভূমিকা",
    icon: Droplets, tint: "from-sky-500/15 to-cyan-500/10", iconColor: "text-sky-500", isCoreBoard: false },
  { id: "acid_base_strength", title: "Acid & Base Strength (Strong vs Weak)", titleBn: "এসিড-ক্ষারকের তীব্রতা · Strong vs Weak",
    icon: Zap, tint: "from-amber-500/15 to-orange-500/10", iconColor: "text-amber-500", isCoreBoard: false },
  { id: "neutralization_reaction", title: "Neutralization & Salt Formation", titleBn: "প্রশমন বিক্রিয়া ও লবণের গঠন",
    icon: FlaskConical, tint: "from-rose-500/15 to-pink-500/10", iconColor: "text-rose-500", isCoreBoard: false },
  { id: "antacid_action", title: "Stomach Acidity & Antacid Action", titleBn: "পাকস্থলীর এসিডিটি ও এন্টাসিডের ভূমিকা",
    icon: Droplets, tint: "from-pink-500/15 to-rose-500/10", iconColor: "text-pink-500", isCoreBoard: false },
  { id: "minerals_vs_rocks", title: "Minerals vs Rocks", titleBn: "খনিজ ও শিলা",
    icon: Gem, tint: "from-fuchsia-500/15 to-pink-500/10", iconColor: "text-fuchsia-500", isCoreBoard: false },
  { id: "ores_vs_minerals", title: "Ores vs Minerals (Venn)", titleBn: "খনিজ ও আকরিক — ভেন চিত্র",
    icon: Gem, tint: "from-emerald-500/15 to-sky-500/10", iconColor: "text-emerald-500", isCoreBoard: false },
  { id: "metallurgy_steps", title: "Steps of Metallurgy", titleBn: "ধাতু নিষ্কাশনের ধাপসমূহ",
    icon: Flame, tint: "from-indigo-500/15 to-violet-500/10", iconColor: "text-indigo-500", isCoreBoard: false },
  { id: "blast_furnace", title: "Blast Furnace (Fe Extraction)", titleBn: "বাতচুল্লী · লোহা নিষ্কাশন",
    icon: Flame, tint: "from-rose-500/15 to-fuchsia-500/10", iconColor: "text-rose-500", isCoreBoard: false },
  { id: "electrolytic_refining", title: "Electrolytic Refining (Cu)", titleBn: "তড়িৎ বিশোধন · কপার",
    icon: Zap, tint: "from-orange-500/15 to-amber-500/10", iconColor: "text-orange-500", isCoreBoard: false },
  { id: "corrosion_rusting", title: "Corrosion & Rusting of Iron", titleBn: "ধাতুর ক্ষয় ও মরিচা ধরা",
    icon: Droplets, tint: "from-orange-600/15 to-red-700/10", iconColor: "text-orange-600", isCoreBoard: false },
  { id: "petroleum_distillation", title: "Fractional Distillation of Petroleum", titleBn: "পেট্রোলিয়ামের আংশিক পাতন",
    icon: Flame, tint: "from-orange-500/15 to-amber-500/10", iconColor: "text-orange-500", isCoreBoard: false },
];

type ChapterMeta = {
  number: number;
  titleBn: string;
  titleEn: string;
  descBn: string;
  labIds: ExperimentId[];
  comingSoonCount?: number;
  accent: string;
  icon: typeof BookOpen;
};

// Curriculum Hub holds exploratory/conceptual labs mapped to their
// NCTB chapter. All board/practical labs (isCoreBoard) live in the
// Practical Lab Room.
const CHAPTERS: ChapterMeta[] = [
  { number: 1, titleBn: "রসায়নের ধারণা", titleEn: "Concepts of Chemistry",
    descBn: "রসায়নের পরিচিতি, গুরুত্ব ও নিরাপত্তা।",
    labIds: [], comingSoonCount: 2, accent: "from-sky-500 to-blue-500", icon: BookOpen },
  { number: 2, titleBn: "পদার্থের অবস্থা", titleEn: "States of Matter",
    descBn: "ব্যাপন, ঊর্ধ্বপাতন ও অবস্থার পরিবর্তন।",
    labIds: ["kinetic_theory", "diffusion_race", "heating_curve"], accent: "from-cyan-500 to-teal-500", icon: Droplets },
  { number: 3, titleBn: "পদার্থের গঠন", titleEn: "Structure of Matter",
    descBn: "পরমাণু, ইলেকট্রন বিন্যাস ও আইসোটোপ।",
    labIds: ["atom_builder", "atom_models", "aufbau_principle", "isotope_stability"], accent: "from-violet-500 to-purple-500", icon: Atom },
  { number: 4, titleBn: "পর্যায় সারণি", titleEn: "Periodic Table",
    descBn: "মৌলিক পদার্থের শ্রেণিবিন্যাস ও ধর্ম।",
    labIds: ["electron_config", "periodic_trends", "group_reactivity", "periodic_anomalies"], accent: "from-fuchsia-500 to-pink-500", icon: Microscope },
  { number: 5, titleBn: "রাসায়নিক বন্ধন", titleEn: "Chemical Bonding",
    descBn: "আয়নিক, সমযোজী ও ধাতব বন্ধনের ধারণা।",
    labIds: ["bonding_basics", "ionic_covalent", "metallic_bonding", "ionic_vs_covalent_theory"],
    accent: "from-indigo-500 to-violet-500", icon: Atom },
  { number: 6, titleBn: "মোল ও রাসায়নিক গণনা", titleEn: "Mole & Chemical Calculations",
    descBn: "মোল ধারণা, মোলারিটি ও প্রমাণ দ্রবণ।",
    labIds: ["mole_concept", "molarity_dilution", "empirical_formula", "limiting_reactant", "stp_molar_volume"],
    accent: "from-emerald-500 to-teal-500", icon: TestTubes },
  { number: 7, titleBn: "রাসায়নিক বিক্রিয়া", titleEn: "Chemical Reactions",
    descBn: "বিক্রিয়ার ধরন, দ্রাব্যতা ও গ্যাস প্রস্তুতি।",
    labIds: [], comingSoonCount: 1,
    accent: "from-amber-500 to-orange-500", icon: Beaker },
  { number: 8, titleBn: "রসায়ন ও শক্তি", titleEn: "Chemistry & Energy",
    descBn: "তাপ পরিবর্তন, তড়িৎ-রাসায়নিক সারি।",
    labIds: ["bond_energy_calorimeter", "electrochemical_series", "daniel_cell", "electrolytic_cell", "dry_cell"],
    accent: "from-yellow-500 to-amber-500", icon: Zap },
  { number: 9, titleBn: "এসিড, ক্ষারক ও লবণ", titleEn: "Acids, Bases & Salts",
    descBn: "pH, নির্দেশক, দ্রাব্যতা, পানির ভূমিকা ও প্রশমন বিক্রিয়া।",
    labIds: ["ph_scale", "indicator_compare", "role_of_water", "acid_base_strength", "neutralization_reaction", "antacid_action", "solubility_rules"],
    accent: "from-rose-500 to-pink-500", icon: Droplets },
  { number: 10, titleBn: "খনিজ সম্পদ: ধাতু ও অধাতু", titleEn: "Mineral Resources: Metals & Non-metals",
    descBn: "খনিজ ও শিলার পার্থক্য, ধাতু, অধাতু, সংকর ধাতু ও আকরিক।",
    labIds: ["minerals_vs_rocks", "ores_vs_minerals", "metallurgy_steps", "blast_furnace", "electrolytic_refining", "corrosion_rusting"],
    accent: "from-pink-500 to-fuchsia-500", icon: Gem },
  { number: 11, titleBn: "খনিজ সম্পদ: জীবাশ্ম", titleEn: "Mineral Resources: Fossil Fuels",
    descBn: "হাইড্রোকার্বন, পেট্রোলিয়াম ও পলিমার।",
    labIds: ["fuel_combustion", "petroleum_distillation"], accent: "from-orange-500 to-red-500", icon: Flame },
  { number: 12, titleBn: "আমাদের জীবনে রসায়ন", titleEn: "Chemistry in Our Lives",
    descBn: "খাদ্য, ঔষধ, প্রসাধনী ও পরিবেশ।",
    labIds: [], comingSoonCount: 3, accent: "from-lime-500 to-emerald-500", icon: Sparkles },
];

const LAB_BY_ID = new Map(ALL_LABS.map((l) => [l.id, l]));

// All board/practical labs live in the Practical Lab Room.
const PRACTICAL_LABS = ALL_LABS.filter((l) => l.isCoreBoard);

type View = "home" | "curriculum" | "practical";

// ─────────────────────────────────────────────────────────────

export default function Dashboard({ onPickExperiment }: DashboardProps) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const displayName = profile?.display_name?.trim() || user?.email?.split("@")[0] || "রসায়নবিদ";
  const [view, setView] = useState<View>("home");
  const [activeChapter, setActiveChapter] = useState<ChapterMeta | null>(null);
  const [labFilter, setLabFilter] = useState<"all" | "core" | "completed" | "incomplete">("all");
  const [search, setSearch] = useState("");
  const { isPro, canAccessLab, loading: entLoading } = useEntitlements();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallLab, setPaywallLab] = useState<string>("");

  const filteredLabs = useMemo(() => {
    return PRACTICAL_LABS.filter((l) => {
      if (labFilter === "core" && !l.isCoreBoard) return false;
      if (labFilter === "completed" && !l.completed) return false;
      if (labFilter === "incomplete" && l.completed) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!l.title.toLowerCase().includes(q) && !l.titleBn.includes(search)) return false;
      }
      return true;
    });
  }, [labFilter, search]);


  const openLab = useCallback((id: ExperimentId) => {
    if (!entLoading && !canAccessLab(id)) {
      const meta = ALL_LABS.find((l) => l.id === id);
      setPaywallLab(meta?.titleBn || meta?.title || "এই Lab");
      setPaywallOpen(true);
      return;
    }
    onPickExperiment(id);
  }, [onPickExperiment, canAccessLab, entLoading]);

  const goTutor = useCallback(() => navigate({ to: "/tutor" }), [navigate]);

  const handleComingSoon = useCallback((what: string) => {
    toast(`${what} — শীঘ্রই আসছে`, { icon: <Sparkles className="h-4 w-4" /> });
  }, []);


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {view !== "home" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("home")}
                className="gap-1 -ml-2"
              >
                <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight md:text-lg">Dr. Chem</div>
              <div className="text-[10px] text-muted-foreground md:text-xs">Virtual Chemistry Lab</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden gap-1.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 sm:inline-flex dark:text-emerald-300">
              <GraduationCap className="h-3.5 w-3.5" />
              NCTB · Class 9-10
            </Badge>
            <Button variant="outline" size="sm" onClick={goTutor} className="gap-1.5">
              <Bot className="h-4 w-4" /> <span className="hidden sm:inline">AI Tutor</span>
            </Button>
          </div>
        </div>
      </header>

      <PendingPaymentBanner />

      {/* Compact greeting */}
      <section className="mx-auto max-w-7xl px-4 pt-4 md:px-6 md:pt-8">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-4 text-white shadow-xl shadow-emerald-500/10 md:p-6">
          <div className="flex items-center gap-2 text-[11px] font-medium opacity-90 md:text-xs">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered · দ্বিভাষিক
          </div>
          <h1 className="mt-1 text-lg font-extrabold tracking-tight md:text-3xl">
            স্বাগতম, <span className="underline decoration-white/40 underline-offset-4">{displayName}</span>! 🧪
          </h1>
          <p className="mt-1 hidden max-w-xl text-sm text-white/85 md:block md:text-base">
            NCTB কারিকুলামের ১২টি অধ্যায় ভ্রমণ করো, ভার্চুয়াল ল্যাবে পরীক্ষণ চালাও আর AI টিউটরের সাহায্য নাও।
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" className="h-8 bg-white text-emerald-700 hover:bg-white/90" onClick={() => setView("curriculum")}>
              <BookOpen className="h-4 w-4" /> কারিকুলাম
            </Button>
            <Button size="sm" variant="outline" className="h-8 border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={goTutor}>
              <Bot className="h-4 w-4" /> AI টিউটর
            </Button>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-10">
        {view === "home" && (
          <HomeGrid
            onCurriculum={() => setView("curriculum")}
            onPractical={() => setView("practical")}
            onVideos={() => navigate({ to: "/app/videos" })}
            onNotes={() => navigate({ to: "/app/notes" })}
            onComingSoon={handleComingSoon}
            practicalCount={PRACTICAL_LABS.length}
          />
        )}

        {view === "curriculum" && (
          <CurriculumGrid
            isPro={isPro}
            canAccessLab={canAccessLab}
            onPick={(ch) => {
              const hasUnlockedLab = ch.labIds.some((id) => canAccessLab(id));
              if (!isPro && !hasUnlockedLab) {
                setPaywallLab(`অধ্যায় ${ch.number}: ${ch.titleBn}`);
                setPaywallOpen(true);
                return;
              }
              setActiveChapter(ch);
            }}
          />
        )}

        {view === "practical" && (
          <PracticalRoom
            labs={filteredLabs}
            labFilter={labFilter}
            setLabFilter={setLabFilter}
            search={search}
            setSearch={setSearch}
            onOpenLab={openLab}
          />
        )}
      </section>

      {/* Chapter Drawer / Dialog */}
      <Dialog open={!!activeChapter} onOpenChange={(open) => !open && setActiveChapter(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {activeChapter && (
            <>
              <div className={`bg-gradient-to-br ${activeChapter.accent} p-6 text-white`}>
                <Badge className="border-0 bg-white/20 text-white">CH {String(activeChapter.number).padStart(2, "0")}</Badge>
                <DialogHeader className="mt-3 space-y-1 text-left">
                  <DialogTitle className="text-2xl font-extrabold text-white">{activeChapter.titleBn}</DialogTitle>
                  <DialogDescription className="text-sm text-white/80">{activeChapter.titleEn} · {activeChapter.descBn}</DialogDescription>
                </DialogHeader>
              </div>
              <ScrollArea className="max-h-[55vh] p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-muted-foreground">এই অধ্যায়ের ল্যাব</h4>
                    {activeChapter.labIds.length === 0 ? (
                      <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                        <Lock className="mx-auto mb-2 h-5 w-5" />
                        এখনো কোনো ভার্চুয়াল ল্যাব যুক্ত হয়নি।
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {activeChapter.labIds.map((id) => {
                          const lab = LAB_BY_ID.get(id);
                          if (!lab) return null;
                          const Icon = lab.icon;
                          return (
                            <button
                              key={id}
                              onClick={() => { setActiveChapter(null); openLab(id); }}
                              className="group flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-primary hover:shadow-md"
                            >
                              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted ${lab.iconColor}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold">{lab.titleBn}</div>
                                <div className="truncate text-xs text-muted-foreground">{lab.title}</div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {(activeChapter.comingSoonCount ?? 0) > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-muted-foreground">শীঘ্রই আসছে</h4>
                      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                        {activeChapter.comingSoonCount}টি AI Conceptual Lab তৈরির কাজ চলছে।
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2 pt-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleComingSoon("Chapter Viva")}
                    >
                      <GraduationCap className="h-4 w-4" /> Start Chapter Viva
                    </Button>
                    <Button
                      className="gap-2"
                      onClick={() => { setActiveChapter(null); goTutor(); }}
                    >
                      <Bot className="h-4 w-4" /> Ask AI Tutor
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>


      <PaywallModal
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        featureName={paywallLab}
      />

      <footer className="mx-auto max-w-7xl px-4 pb-10 text-center text-xs text-muted-foreground md:px-6">
        Built for Bangladeshi students · NCTB Curriculum · Made with AI
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Home — 4 main cards
// ─────────────────────────────────────────────────────────────

function FeaturedChapterSixLab({ onOpen }: { onOpen: () => void }) {
  return (
    <Card
      onClick={onOpen}
      className="group mb-4 cursor-pointer overflow-hidden border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-4 shadow-xl shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/50 md:mb-5 md:p-5"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
          <TestTubes className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" variant="secondary">
              নতুন · CH 06 Theory
            </Badge>
            <Badge variant="outline" className="text-[10px]">Free</Badge>
          </div>
          <h2 className="mt-1 text-base font-extrabold leading-tight tracking-tight md:text-xl">
            মোল ও রাসায়নিক গণনা — অ্যাভোগেড্রো সংখ্যা ও মোলারিটি Lab
          </h2>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground md:text-sm">
            ১. মোল ও অ্যাভোগাড্রো সংখ্যা · ২. মোলারিটি এবং দ্রবণ লঘুকরণ — সরাসরি শুরু করো।
          </p>
        </div>
        <Button size="sm" className="hidden shrink-0 gap-1.5 sm:inline-flex" onClick={(event) => { event.stopPropagation(); onOpen(); }}>
          Open Lab <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function HomeGrid({
  onCurriculum,
  onPractical,
  onVideos,
  onNotes,
  onComingSoon: _onComingSoon,
  practicalCount,
}: {
  onCurriculum: () => void;
  onPractical: () => void;
  onVideos: () => void;
  onNotes: () => void;
  onComingSoon: (what: string) => void;
  practicalCount: number;
}) {
  const cards = [
    {
      key: "curriculum",
      title: "Curriculum Hub",
      titleBn: "কারিকুলাম হাব",
      desc: "NCTB-র ১২টি অধ্যায়, প্রতিটি অধ্যায়ের ভেতরে যুক্ত ল্যাব ও AI টিউটর শর্টকাট।",
      icon: BookOpen,
      accent: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/20",
      meta: "১২ অধ্যায়",
      onClick: onCurriculum,
      available: true,
    },
    {
      key: "practical",
      title: "Practical Lab Room",
      titleBn: "ব্যবহারিক ল্যাব রুম",
      desc: "চ্যাপ্টারের বাইরের এক্সপ্লোরেটরি ভার্চুয়াল ল্যাবগুলো — সরাসরি পরীক্ষণ শুরু করো।",
      icon: FlaskConical,
      accent: "from-sky-500 to-cyan-600",
      shadow: "shadow-sky-500/20",
      meta: `${practicalCount} ল্যাব`,
      onClick: onPractical,
      available: true,
    },
    {
      key: "video",
      title: "Video Lessons",
      titleBn: "ভিডিও লেসন",
      desc: "প্রতিটি অধ্যায়ের ছোট, দ্বিভাষিক ভিডিও পাঠ — সরাসরি ইন-অ্যাপে দেখো।",
      icon: Video,
      accent: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-500/20",
      meta: "নতুন",
      onClick: onVideos,
      available: true,
    },
    {
      key: "notes",
      title: "Smart Notes",
      titleBn: "স্মার্ট নোটস",
      desc: "অধ্যায়-ভিত্তিক স্মার্ট নোট, ফর্মুলা শিট ও AI টিউটর ইন্টিগ্রেশন।",
      icon: NotebookPen,
      accent: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
      meta: "নতুন",
      onClick: onNotes,
      available: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.key}
            onClick={c.onClick}
            className={`group relative flex min-h-[180px] cursor-pointer flex-col overflow-hidden border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:min-h-[240px] md:p-6 ${c.shadow}`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent}`} />
            <div className="flex items-start justify-between gap-2">
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${c.accent} text-white shadow-lg md:h-14 md:w-14 md:rounded-2xl`}>
                <Icon className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              {c.available ? (
                <Badge variant="secondary" className="border bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-700 dark:text-emerald-300">
                  {c.meta}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> {c.meta}
                </Badge>
              )}
            </div>
            <h3 className="mt-3 text-[15px] font-extrabold leading-tight tracking-tight md:mt-5 md:text-xl">{c.titleBn}</h3>
            <p className="text-[11px] font-medium text-muted-foreground md:text-xs">{c.title}</p>
            <p className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-muted-foreground md:mt-2 md:line-clamp-none md:text-sm">{c.desc}</p>
            <div className="mt-auto flex items-center justify-end pt-2 text-xs font-semibold text-primary md:text-sm">
              {c.available ? "Open" : "Notify"} <ChevronRight className="h-4 w-4" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Curriculum view
// ─────────────────────────────────────────────────────────────

function CurriculumGrid({
  onPick,
  isPro,
  canAccessLab,
}: {
  onPick: (c: ChapterMeta) => void;
  isPro: boolean;
  canAccessLab: (id: ExperimentId) => boolean;
}) {
  return (
    <>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">কারিকুলাম হাব</h2>
        <p className="text-sm text-muted-foreground">NCTB ক্লাস ৯-১০ রসায়নের ১২টি অধ্যায়</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHAPTERS.map((ch) => {
          const labCount = ch.labIds.length;
          const total = labCount + (ch.comingSoonCount ?? 0);
          const done = ch.labIds.filter((id) => LAB_BY_ID.get(id)?.completed).length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const Icon = ch.icon;
          const hasLabs = labCount > 0;
          const locked = !isPro && !ch.labIds.some((id) => canAccessLab(id));

          return (
            <Card
              key={ch.number}
              onClick={() => onPick(ch)}
              className={`group relative cursor-pointer overflow-hidden border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${locked ? "opacity-80" : ""}`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ch.accent}`} />
              <div className="flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${ch.accent} text-white shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  {locked && (
                    <Badge variant="outline" className="gap-1 text-[10px] text-amber-600 border-amber-500/40 bg-amber-500/10">
                      <Lock className="h-3 w-3" /> Pro
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] font-mono">CH {String(ch.number).padStart(2, "0")}</Badge>
                </div>
              </div>
              <h3 className="mt-3 text-base font-bold leading-tight">{ch.titleBn}</h3>
              <p className="text-xs font-medium text-muted-foreground">{ch.titleEn}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ch.descBn}</p>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {hasLabs ? (
                  <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300" variant="secondary">
                    <FlaskConical className="h-3 w-3" /> {labCount} Lab{labCount > 1 ? "s" : ""}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <Lock className="h-3 w-3" /> শীঘ্রই
                  </Badge>
                )}
                {(ch.comingSoonCount ?? 0) > 0 && hasLabs && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">+{ch.comingSoonCount} concept</Badge>
                )}
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>অগ্রগতি</span><span>{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full bg-gradient-to-r ${ch.accent}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Practical Lab Room view
// ─────────────────────────────────────────────────────────────

function PracticalRoom({
  labs,
  labFilter,
  setLabFilter,
  search,
  setSearch,
  onOpenLab,
}: {
  labs: LabMeta[];
  labFilter: "all" | "core" | "completed" | "incomplete";
  setLabFilter: (k: "all" | "core" | "completed" | "incomplete") => void;
  search: string;
  setSearch: (s: string) => void;
  onOpenLab: (id: ExperimentId) => void;
}) {
  const { canAccessLab } = useEntitlements();
  return (
    <>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">ব্যবহারিক ল্যাব রুম</h2>
        <p className="text-sm text-muted-foreground">
          কারিকুলামের বাইরের এক্সপ্লোরেটরি ভার্চুয়াল ল্যাব — সরাসরি চালু করো।
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { k: "all", label: "All Labs" },
            { k: "core", label: "Core Board Practicals" },
            { k: "completed", label: "Completed" },
            { k: "incomplete", label: "Incomplete" },
          ].map((f) => (
            <Button
              key={f.k}
              size="sm"
              variant={labFilter === f.k ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setLabFilter(f.k as typeof labFilter)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ল্যাব খুঁজুন..."
            className="w-full rounded-full border bg-background py-2 pl-9 pr-4 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {labs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          কোন ল্যাব পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {labs.map((lab) => {
            const Icon = lab.icon;
            const locked = !canAccessLab(lab.id);
            return (
              <Card
                key={lab.id}
                onClick={() => onOpenLab(lab.id)}
                className={`group relative cursor-pointer overflow-hidden border bg-gradient-to-br ${lab.tint} p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
              >
                {locked && (
                  <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    <Lock className="h-3 w-3" /> Pro
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className={`grid h-12 w-12 place-items-center rounded-xl bg-background/80 shadow-sm backdrop-blur ${lab.iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {lab.isCoreBoard && (
                      <Badge variant="secondary" className="border bg-background/70 text-[10px] backdrop-blur">Board</Badge>
                    )}
                    {lab.completed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Circle className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-bold leading-tight md:text-base">{lab.titleBn}</h3>
                <p className="text-xs text-muted-foreground">{lab.title}</p>
                <Button
                  size="sm"
                  className="mt-4 w-full gap-1"
                  variant={locked ? "outline" : "default"}
                  onClick={(e) => { e.stopPropagation(); onOpenLab(lab.id); }}
                >
                  {locked ? (
                    <><Lock className="h-4 w-4" /> Unlock Pro</>
                  ) : (
                    <><PlayCircle className="h-4 w-4" /> Start Lab</>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <div className="text-base font-extrabold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
