import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ExperimentId } from "./types";
import {
  Atom,
  Bot,
  BookOpen,
  PlayCircle,
  Headphones,
  Sparkles,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface DashboardProps {
  onEnterExperiments: () => void;
  onPickExperiment: (id: ExperimentId) => void;
}

type Lang = "en" | "bn";

type ExperimentCard = { title: string; desc: string; cta: string };
type ComingSoonCard = { title: string; desc: string; badge: string };

type CopySet = {
  title: string;
  subtitle: string;
  tagline: string;
  cards: {
    experiments: ExperimentCard;
    aiTutor: ComingSoonCard;
    notes: ComingSoonCard;
    videos: ComingSoonCard;
    support: ComingSoonCard;
  };
  toastMsg: string;
  footer: string;
};

const COPY: Record<Lang, CopySet> = {
  en: {
    title: "Virtual Chemistry Lab",
    subtitle: "Your AI-powered science portal",
    tagline:
      "Explore experiments, AI tutoring, notes, video lessons & live support — all in one place.",
    cards: {
      experiments: {
        title: "Virtual Experiments",
        desc: "Titration, O₂ & CO₂ Preparation, NaCl Crystallisation, Ionic vs Covalent + Electrolysis — interactive SVG simulations.",
        cta: "Enter Lab",
      },
      aiTutor: {
        title: "Chemistry AI Tutor",
        desc: "Ask questions and get answers grounded in your textbooks using NotebookLM-powered RAG.",
        badge: "Coming Soon",
      },
      notes: {
        title: "Smart Notes & Guides",
        desc: "Textbook summaries, lab manuals, and curated study guides for Class 9–10 & HSC.",
        badge: "Coming Soon",
      },
      videos: {
        title: "Video Lessons",
        desc: "Curated chemistry lectures, experiment demos, and concept explainers.",
        badge: "Coming Soon",
      },
      support: {
        title: "Live Support Session",
        desc: "Book a live doubt-clearing session with experienced chemistry teachers.",
        badge: "Coming Soon",
      },
    },
    toastMsg:
      "This feature is coming soon! We are indexing textbooks and video lessons.",
    footer: "Built for Bangladeshi students · Made with AI",
  },
  bn: {
    title: "ভার্চুয়াল রসায়ন ল্যাব",
    subtitle: "আপনার AI-চালিত বিজ্ঞান পোর্টাল",
    tagline:
      "পরীক্ষণ, AI টিউটর, নোট, ভিডিও লেসন এবং লাইভ সাপোর্ট — সব এক জায়গায়।",
    cards: {
      experiments: {
        title: "ভার্চুয়াল পরীক্ষণ",
        desc: "টাইট্রেশন, O₂ ও CO₂ প্রস্তুতি, NaCl কেলাস, আয়নিক বনাম সমযোজী + তড়িৎ বিশ্লেষণ — ইন্টারঅ্যাক্টিভ সিমুলেশন।",
        cta: "ল্যাবে প্রবেশ করুন",
      },
      aiTutor: {
        title: "রসায়ন AI টিউটর",
        desc: "আপনার বই থেকে উত্তর পান — NotebookLM-চালিত RAG ব্যবহার করে।",
        badge: "শীঘ্রই আসছে",
      },
      notes: {
        title: "স্মার্ট নোট ও গাইড",
        desc: "পাঠ্যবই সারাংশ, ল্যাব ম্যানুয়াল এবং নির্বাচিত স্টাডি গাইড (৯-১০ ও এইচএসসি)।",
        badge: "শীঘ্রই আসছে",
      },
      videos: {
        title: "ভিডিও লেসন",
        desc: "নির্বাচিত রসায়ন লেকচার, পরীক্ষণ ডেমো এবং ধারণা ব্যাখ্যা।",
        badge: "শীঘ্রই আসছে",
      },
      support: {
        title: "লাইভ সাপোর্ট সেশন",
        desc: "অভিজ্ঞ রসায়ন শিক্ষকদের সাথে লাইভে সন্দেহ দূর করুন।",
        badge: "শীঘ্রই আসছে",
      },
    },
    toastMsg:
      "এই ফিচারটি দ্রুতই আসছে! বই এবং ভিডিও লেসন যুক্ত করার কাজ চলছে।",
    footer: "বাংলাদেশী শিক্ষার্থীদের জন্য · AI দিয়ে তৈরি",
  },
};

const CARD_META: Array<{
  key: keyof CopySet["cards"];
  icon: typeof Atom;
  gradient: string;
  accent: string;
}> = [
  {
    key: "experiments",
    icon: Atom,
    gradient: "from-rose-100/70 via-fuchsia-50/60 to-sky-100/70",
    accent: "text-rose-600",
  },
  {
    key: "aiTutor",
    icon: Bot,
    gradient: "from-violet-100/70 via-purple-50/60 to-indigo-100/70",
    accent: "text-violet-600",
  },
  {
    key: "notes",
    icon: BookOpen,
    gradient: "from-amber-100/70 via-yellow-50/60 to-orange-100/70",
    accent: "text-amber-600",
  },
  {
    key: "videos",
    icon: PlayCircle,
    gradient: "from-emerald-100/70 via-teal-50/60 to-cyan-100/70",
    accent: "text-emerald-600",
  },
  {
    key: "support",
    icon: Headphones,
    gradient: "from-sky-100/70 via-blue-50/60 to-indigo-100/70",
    accent: "text-sky-600",
  },
];

export default function Dashboard({
  onEnterExperiments,
}: DashboardProps) {
  const [lang, setLang] = useState<Lang>("en");
  const t = COPY[lang];
  const navigate = useNavigate();

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "bn" : "en"));
  }, []);

  const handleComingSoon = useCallback(() => {
    toast(t.toastMsg, {
      icon: <Sparkles className="h-4 w-4" />,
      duration: 4000,
    });
  }, [t]);

  const goTutor = useCallback(() => {
    navigate({ to: "/tutor" });
  }, [navigate]);

  return (
    <div className="min-h-screen w-full">
      {/* Hero */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-10 pb-6 text-center md:pt-14">
        {/* Floating badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>
            {lang === "en" ? "AI-Powered · Bilingual" : "AI-চালিত · দ্বিভাষিক"}
          </span>
          <button
            onClick={toggleLang}
            className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition hover:bg-muted/80"
          >
            {lang === "en" ? "বাং" : "EN"}
          </button>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
          {t.title}
        </h1>
        <p className="mt-2 text-base font-medium text-primary/80 md:text-lg">
          {t.subtitle}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          {t.tagline}
        </p>
      </section>

      {/* Bento Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARD_META.map((meta, idx) => {
            const card = t.cards[meta.key];
            const isExperiments = meta.key === "experiments";
            const isAiTutor = meta.key === "aiTutor";
            const isActive = isExperiments || isAiTutor;
            const Icon = meta.icon;

            const onClickCard = () => {
              if (isExperiments) onEnterExperiments();
              else if (isAiTutor) goTutor();
              else handleComingSoon();
            };

            return (
              <Card
                key={meta.key}
                className={[
                  "group relative overflow-hidden border-2 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer",
                  "bg-gradient-to-br",
                  meta.gradient,
                  idx === 0 ? "sm:col-span-2 lg:col-span-2" : "",
                  idx === 4 ? "sm:col-span-2 lg:col-span-1" : "",
                ].join(" ")}
                onClick={onClickCard}
              >
                {/* Shine effect */}
                <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>

                <div className="relative flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={[
                        "rounded-2xl bg-white/70 p-3 shadow-sm backdrop-blur",
                        meta.accent,
                      ].join(" ")}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    {!isActive && (
                      <Badge
                        variant="secondary"
                        className="border bg-background/70 text-xs backdrop-blur"
                      >
                        {(card as ComingSoonCard).badge}
                      </Badge>
                    )}
                    {isActive && (
                      <Badge
                        variant="default"
                        className="bg-primary text-primary-foreground text-xs"
                      >
                        {lang === "en" ? "Active" : "চালু"}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold leading-tight md:text-xl">
                      {card.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {card.desc}
                    </p>
                  </div>

                  <div className="mt-auto pt-2">
                    {isActive ? (
                      <Button
                        size="sm"
                        className="w-full gap-1 font-semibold"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onClickCard();
                        }}
                      >
                        {isExperiments
                          ? (card as ExperimentCard).cta
                          : lang === "en"
                            ? "Open Tutor"
                            : "চ্যাট শুরু করুন"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1 font-medium"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleComingSoon();
                        }}
                      >
                        {lang === "en" ? "Explore" : "ঘুরে দেখুন"}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick stats row */}
        <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl border bg-card/50 p-4 backdrop-blur sm:grid-cols-3 md:gap-4 md:p-6">
          {[
            {
              value: "5",
              label: lang === "en" ? "Experiments" : "পরীক্ষণ",
            },
            {
              value: "2",
              label: lang === "en" ? "Languages" : "ভাষা",
            },
            {
              value: "AI",
              label: lang === "en" ? "Assistant" : "সহায়ক",
            },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-extrabold tracking-tight md:text-2xl">
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground md:text-sm">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t.footer}
        </p>
      </section>
    </div>
  );
}
