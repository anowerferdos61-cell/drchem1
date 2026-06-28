/**
 * Dr. Chem — Main App Dashboard
 * 4-card home: Curriculum Hub, Practical Lab Room, Video Lessons, Smart Notes
 */
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PaywallModal } from "@/components/subscription/PaywallModal";

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
    labIds: [], comingSoonCount: 2, accent: "from-cyan-500 to-teal-500", icon: Droplets },
  { number: 3, titleBn: "পদার্থের গঠন", titleEn: "Structure of Matter",
    descBn: "পরমাণু, ইলেকট্রন বিন্যাস ও আইসোটোপ।",
    labIds: [], comingSoonCount: 3, accent: "from-violet-500 to-purple-500", icon: Atom },
  { number: 4, titleBn: "পর্যায় সারণি", titleEn: "Periodic Table",
    descBn: "মৌলিক পদার্থের শ্রেণিবিন্যাস ও ধর্ম।",
    labIds: [], comingSoonCount: 2, accent: "from-fuchsia-500 to-pink-500", icon: Microscope },
  { number: 5, titleBn: "রাসায়নিক বন্ধন", titleEn: "Chemical Bonding",
    descBn: "আয়নিক, সমযোজী ও ধাতব বন্ধনের ধারণা।",
    labIds: ["bonding_basics", "ionic_covalent"],
    accent: "from-indigo-500 to-violet-500", icon: Atom },
  { number: 6, titleBn: "মোল ও রাসায়নিক গণনা", titleEn: "Mole & Chemical Calculations",
    descBn: "মোল ধারণা, মোলারিটি ও প্রমাণ দ্রবণ।",
    labIds: [], comingSoonCount: 1,
    accent: "from-emerald-500 to-teal-500", icon: TestTubes },
  { number: 7, titleBn: "রাসায়নিক বিক্রিয়া", titleEn: "Chemical Reactions",
    descBn: "বিক্রিয়ার ধরন, দ্রাব্যতা ও গ্যাস প্রস্তুতি।",
    labIds: [],
    accent: "from-amber-500 to-orange-500", icon: Beaker },
  { number: 8, titleBn: "রসায়ন ও শক্তি", titleEn: "Chemistry & Energy",
    descBn: "তাপ পরিবর্তন, তড়িৎ-রাসায়নিক সারি।",
    labIds: ["electrochemical_series"],
    accent: "from-yellow-500 to-amber-500", icon: Zap },
  { number: 9, titleBn: "এসিড-ক্ষারক সাম্য", titleEn: "Acid-Base Equilibrium",
    descBn: "pH, Ka/Kb এবং দ্রাব্যতার ধারণা।",
    labIds: ["solubility_rules"],
    accent: "from-rose-500 to-pink-500", icon: Droplets },
  { number: 10, titleBn: "এসিড, ক্ষারক ও লবণ", titleEn: "Acids, Bases & Salts",
    descBn: "pH স্কেল, নির্দেশক ও দৈনন্দিন প্রয়োগ।",
    labIds: ["ph_scale", "indicator_compare"],
    accent: "from-pink-500 to-fuchsia-500", icon: FlaskConical },
  { number: 11, titleBn: "খনিজ সম্পদ: জীবাশ্ম", titleEn: "Mineral Resources: Fossil Fuels",
    descBn: "হাইড্রোকার্বন, পেট্রোলিয়াম ও পলিমার।",
    labIds: [], comingSoonCount: 2, accent: "from-orange-500 to-red-500", icon: Flame },
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

  const completedCount = ALL_LABS.filter((l) => l.completed).length;
  const overallProgress = Math.round((completedCount / ALL_LABS.length) * 100);

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

      {/* Hero strip with progress */}
      <section className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2 overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl shadow-emerald-500/10">
            <div className="flex items-center gap-2 text-xs font-medium opacity-90">
              <Sparkles className="h-3.5 w-3.5" /> AI-Powered · দ্বিভাষিক
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
              স্বাগতম, রসায়নবিদ! 🧪
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/85 md:text-base">
              NCTB কারিকুলামের ১২টি অধ্যায় ভ্রমণ করো, ভার্চুয়াল ল্যাবে পরীক্ষণ চালাও আর AI টিউটরের সাহায্য নাও।
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" className="bg-white text-emerald-700 hover:bg-white/90" onClick={() => setView("curriculum")}>
                <BookOpen className="h-4 w-4" /> কারিকুলাম দেখুন
              </Button>
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={goTutor}>
                <Bot className="h-4 w-4" /> AI কে প্রশ্ন করো
              </Button>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">আপনার অগ্রগতি</div>
              <Badge variant="outline" className="text-xs">{completedCount}/{ALL_LABS.length}</Badge>
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-3 h-2" />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="অধ্যায়" value="12" />
              <Stat label="ল্যাব" value={String(ALL_LABS.length)} />
              <Stat label="ভাষা" value="2" />
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {view === "home" && (
          <HomeGrid
            onCurriculum={() => setView("curriculum")}
            onPractical={() => setView("practical")}
            onComingSoon={handleComingSoon}
            practicalCount={PRACTICAL_LABS.length}
          />
        )}

        {view === "curriculum" && (
          <CurriculumGrid onPick={setActiveChapter} />
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

function HomeGrid({
  onCurriculum,
  onPractical,
  onComingSoon,
  practicalCount,
}: {
  onCurriculum: () => void;
  onPractical: () => void;
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
      desc: "প্রতিটি অধ্যায়ের ছোট, দ্বিভাষিক ভিডিও পাঠ — শীঘ্রই আসছে।",
      icon: Video,
      accent: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-500/20",
      meta: "শীঘ্রই",
      onClick: () => onComingSoon("Video Lessons"),
      available: false,
    },
    {
      key: "notes",
      title: "Smart Notes",
      titleBn: "স্মার্ট নোটস",
      desc: "AI-জেনারেটেড সংক্ষিপ্ত নোট, ফর্মুলা শিট ও রিভিশন কার্ড — শীঘ্রই আসছে।",
      icon: NotebookPen,
      accent: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
      meta: "শীঘ্রই",
      onClick: () => onComingSoon("Smart Notes"),
      available: false,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.key}
            onClick={c.onClick}
            className={`group relative cursor-pointer overflow-hidden border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${c.shadow}`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent}`} />
            <div className="flex items-start justify-between">
              <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${c.accent} text-white shadow-lg`}>
                <Icon className="h-7 w-7" />
              </div>
              {c.available ? (
                <Badge variant="secondary" className="border bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300">
                  {c.meta}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> {c.meta}
                </Badge>
              )}
            </div>
            <h3 className="mt-5 text-xl font-extrabold tracking-tight">{c.titleBn}</h3>
            <p className="text-xs font-medium text-muted-foreground">{c.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            <div className="mt-5 flex items-center justify-end text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {c.available ? "Open" : "Notify Me"} <ChevronRight className="h-4 w-4" />
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

function CurriculumGrid({ onPick }: { onPick: (c: ChapterMeta) => void }) {
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

          return (
            <Card
              key={ch.number}
              onClick={() => onPick(ch)}
              className="group relative cursor-pointer overflow-hidden border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ch.accent}`} />
              <div className="flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${ch.accent} text-white shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">CH {String(ch.number).padStart(2, "0")}</Badge>
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
                <Progress value={pct} className="h-1.5" />
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
            return (
              <Card
                key={lab.id}
                onClick={() => onOpenLab(lab.id)}
                className={`group relative cursor-pointer overflow-hidden border bg-gradient-to-br ${lab.tint} p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
              >
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
                  onClick={(e) => { e.stopPropagation(); onOpenLab(lab.id); }}
                >
                  <PlayCircle className="h-4 w-4" /> Start Lab
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
