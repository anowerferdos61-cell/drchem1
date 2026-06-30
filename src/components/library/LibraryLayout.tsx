/**
 * Shared layout for Video Lessons (/app/videos) and Smart Notes (/app/notes).
 * - Curriculum-Hub-style chapter grid landing
 * - Click a chapter → render module content (children) with a back button
 * - Premium gating: Free users only get Chapter 10 unlocked (matches Curriculum Hub)
 */
import { useEffect, type ComponentType, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Lock,
  Sparkles,
  ChevronRight,
  BookOpen,
  Atom,
  Droplets,
  Microscope,
  TestTubes,
  Beaker,
  Zap,
  FlaskConical,
  Flame,
} from "lucide-react";

export type Chapter = {
  number: number;
  titleBn: string;
  titleEn: string;
  descBn: string;
  accent: string;
  icon: ComponentType<{ className?: string }>;
};

export const CHAPTERS: Chapter[] = [
  { number: 1, titleBn: "রসায়নের ধারণা", titleEn: "Concepts of Chemistry",
    descBn: "রসায়নের পরিচিতি, গুরুত্ব ও নিরাপত্তা।",
    accent: "from-sky-500 to-blue-500", icon: BookOpen },
  { number: 2, titleBn: "পদার্থের অবস্থা", titleEn: "States of Matter",
    descBn: "ব্যাপন, ঊর্ধ্বপাতন ও অবস্থার পরিবর্তন।",
    accent: "from-cyan-500 to-teal-500", icon: Droplets },
  { number: 3, titleBn: "পদার্থের গঠন", titleEn: "Structure of Matter",
    descBn: "পরমাণু, ইলেকট্রন বিন্যাস ও আইসোটোপ।",
    accent: "from-violet-500 to-purple-500", icon: Atom },
  { number: 4, titleBn: "পর্যায় সারণি", titleEn: "Periodic Table",
    descBn: "মৌলিক পদার্থের শ্রেণিবিন্যাস ও ধর্ম।",
    accent: "from-fuchsia-500 to-pink-500", icon: Microscope },
  { number: 5, titleBn: "রাসায়নিক বন্ধন", titleEn: "Chemical Bonding",
    descBn: "আয়নিক, সমযোজী ও ধাতব বন্ধনের ধারণা।",
    accent: "from-indigo-500 to-violet-500", icon: Atom },
  { number: 6, titleBn: "মোল ও রাসায়নিক গণনা", titleEn: "Mole & Calculations",
    descBn: "মোল ধারণা, মোলারিটি ও প্রমাণ দ্রবণ।",
    accent: "from-emerald-500 to-teal-500", icon: TestTubes },
  { number: 7, titleBn: "রাসায়নিক বিক্রিয়া", titleEn: "Chemical Reactions",
    descBn: "বিক্রিয়ার ধরন, দ্রাব্যতা ও গ্যাস প্রস্তুতি।",
    accent: "from-amber-500 to-orange-500", icon: Beaker },
  { number: 8, titleBn: "রসায়ন ও শক্তি", titleEn: "Chemistry & Energy",
    descBn: "তাপ পরিবর্তন, তড়িৎ-রাসায়নিক সারি।",
    accent: "from-yellow-500 to-amber-500", icon: Zap },
  { number: 9, titleBn: "এসিড-ক্ষারক সাম্য", titleEn: "Acid-Base Equilibrium",
    descBn: "pH, Ka/Kb এবং দ্রাব্যতার ধারণা।",
    accent: "from-rose-500 to-pink-500", icon: Droplets },
  { number: 10, titleBn: "এসিড, ক্ষারক ও লবণ", titleEn: "Acids, Bases & Salts",
    descBn: "pH স্কেল, নির্দেশক ও দৈনন্দিন প্রয়োগ।",
    accent: "from-pink-500 to-fuchsia-500", icon: FlaskConical },
  { number: 11, titleBn: "খনিজ সম্পদ", titleEn: "Mineral Resources",
    descBn: "হাইড্রোকার্বন, পেট্রোলিয়াম ও পলিমার।",
    accent: "from-orange-500 to-red-500", icon: Flame },
  { number: 12, titleBn: "আমাদের জীবনে রসায়ন", titleEn: "Chemistry in Our Lives",
    descBn: "খাদ্য, ঔষধ, প্রসাধনী ও পরিবেশ।",
    accent: "from-lime-500 to-emerald-500", icon: Sparkles },
];

interface LibraryRow {
  id: string;
  chapter_number: number;
  title: string;
  is_premium: boolean;
}

export function useLibraryRows<T extends LibraryRow>(
  table: "videos" | "notes",
  selectCols: string,
) {
  return useQuery({
    queryKey: ["library", table],
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await supabase
        .from(table)
        .select(selectCols)
        .order("chapter_number", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
    staleTime: 60_000,
  });
}

export function LibraryShell({
  module,
  headerTitleBn,
  headerSubtitle,
  accent,
  children,
  activeChapter,
  setActiveChapter,
  countsByChapter,
  itemLabel,
}: {
  module: "videos" | "notes";
  headerTitleBn: string;
  headerSubtitle: string;
  accent: string;
  children: ReactNode;
  activeChapter: number | null;
  setActiveChapter: (n: number | null) => void;
  countsByChapter: Record<number, number>;
  itemLabel: string; // e.g. "ভিডিও" or "নোট"
}) {
  const { isAuthenticated, loading } = useAuth();
  const { isPro } = useEntitlements();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      void navigate({
        to: "/login",
        search: { redirect: `/app/${module}` },
        replace: true,
      });
    }
  }, [loading, isAuthenticated, navigate, module]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        লোড হচ্ছে…
      </div>
    );
  }

  const activeMeta = activeChapter ? CHAPTERS.find((c) => c.number === activeChapter) : null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {activeChapter ? (
              <button
                onClick={() => setActiveChapter(null)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">অধ্যায়সমূহ</span>
              </button>
            ) : (
              <Link
                to="/app"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
              </Link>
            )}
            <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${accent} shadow-lg`}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="truncate text-base font-extrabold tracking-tight md:text-lg">{headerTitleBn}</div>
              <div className="truncate text-[10px] text-muted-foreground md:text-xs">{headerSubtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={module === "videos" ? "/app/notes" : "/app/videos"}>
              <Button variant="outline" size="sm">
                {module === "videos" ? "📝 Smart Notes" : "🎬 Video Lessons"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {!activeChapter ? (
          <ChapterGrid
            itemLabel={itemLabel}
            countsByChapter={countsByChapter}
            isPro={isPro}
            onPick={(ch) => setActiveChapter(ch.number)}
            headerTitleBn={headerTitleBn}
            headerSubtitle={headerSubtitle}
          />
        ) : (
          <div>
            {/* Chapter breadcrumb header */}
            {activeMeta && (
              <div className="mb-6 flex items-center gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${activeMeta.accent} text-white shadow-md`}>
                  <activeMeta.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      CH {String(activeMeta.number).padStart(2, "0")}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{activeMeta.titleEn}</span>
                  </div>
                  <h1 className="truncate text-lg font-extrabold tracking-tight md:text-2xl">
                    {activeMeta.titleBn}
                  </h1>
                </div>
              </div>
            )}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function ChapterGrid({
  onPick,
  isPro,
  countsByChapter,
  itemLabel,
  headerTitleBn,
  headerSubtitle,
}: {
  onPick: (c: Chapter) => void;
  isPro: boolean;
  countsByChapter: Record<number, number>;
  itemLabel: string;
  headerTitleBn: string;
  headerSubtitle: string;
}) {
  return (
    <>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">{headerTitleBn}</h2>
        <p className="text-sm text-muted-foreground">{headerSubtitle} · একটি অধ্যায় বাছাই করো</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHAPTERS.map((ch) => {
          const Icon = ch.icon;
          const count = countsByChapter[ch.number] ?? 0;
          const locked = !isPro && ch.number !== 10;
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
                {count > 0 ? (
                  <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300" variant="secondary">
                    <Sparkles className="h-3 w-3" /> {count} {itemLabel}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <Lock className="h-3 w-3" /> শীঘ্রই
                  </Badge>
                )}
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

export function PremiumLockCard({ kind }: { kind: "video" | "note" }) {
  return (
    <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-50/40 via-background to-orange-50/30 p-8 text-center dark:from-amber-950/20 dark:to-orange-950/10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.15),transparent_60%)]" />
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/30">
        <Lock className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-extrabold tracking-tight md:text-xl">
        {kind === "video"
          ? "এই ভিডিওটি দেখতে প্রো সাবস্ক্রিপশন লাগবে"
          : "এই নোটটি পড়তে প্রো সাবস্ক্রিপশন লাগবে"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        মাত্র ৯৯ টাকায় মাসিক প্রো — সব অধ্যায়, সব ল্যাব ও সব নোট আনলক।
      </p>
      <Link to="/pricing" className="mt-5 inline-block">
        <Button className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
          <Sparkles className="h-4 w-4" /> প্রো নাও
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </Card>
  );
}
