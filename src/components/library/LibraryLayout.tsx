/**
 * Shared layout for Video Lessons (/app/videos) and Smart Notes (/app/notes).
 * - Sidebar / accordion grouped by NCTB chapters
 * - Loads rows from Supabase
 * - Premium gate via useEntitlements
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Lock,
  Sparkles,
  ChevronRight,
  BookOpen,
} from "lucide-react";

export type Chapter = { number: number; titleBn: string; titleEn: string };

export const CHAPTERS: Chapter[] = [
  { number: 1, titleBn: "রসায়নের ধারণা", titleEn: "Concepts of Chemistry" },
  { number: 2, titleBn: "পদার্থের অবস্থা", titleEn: "States of Matter" },
  { number: 3, titleBn: "পদার্থের গঠন", titleEn: "Structure of Matter" },
  { number: 4, titleBn: "পর্যায় সারণি", titleEn: "Periodic Table" },
  { number: 5, titleBn: "রাসায়নিক বন্ধন", titleEn: "Chemical Bonding" },
  { number: 6, titleBn: "মোল ও রাসায়নিক গণনা", titleEn: "Mole & Calculations" },
  { number: 7, titleBn: "রাসায়নিক বিক্রিয়া", titleEn: "Chemical Reactions" },
  { number: 8, titleBn: "রসায়ন ও শক্তি", titleEn: "Chemistry & Energy" },
  { number: 9, titleBn: "এসিড-ক্ষারক সাম্য", titleEn: "Acid-Base Equilibrium" },
  { number: 10, titleBn: "এসিড, ক্ষারক ও লবণ", titleEn: "Acids, Bases & Salts" },
  { number: 11, titleBn: "খনিজ সম্পদ", titleEn: "Mineral Resources" },
  { number: 12, titleBn: "আমাদের জীবনে রসায়ন", titleEn: "Chemistry in Our Lives" },
];

interface LibraryRow {
  id: string;
  chapter_number: number;
  title: string;
  is_premium: boolean;
}

interface Props<T extends LibraryRow> {
  module: "videos" | "notes";
  headerTitleBn: string;
  headerSubtitle: string;
  accent: string;
  renderItem: (row: T, locked: boolean) => ReactNode;
  emptyState?: ReactNode;
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
}: {
  module: "videos" | "notes";
  headerTitleBn: string;
  headerSubtitle: string;
  accent: string;
  children: ReactNode;
  activeChapter: number;
  setActiveChapter: (n: number) => void;
  countsByChapter: Record<number, number>;
}) {
  const { isAuthenticated, loading } = useAuth();
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
            </Link>
            <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${accent} shadow-lg`}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight md:text-lg">{headerTitleBn}</div>
              <div className="text-[10px] text-muted-foreground md:text-xs">{headerSubtitle}</div>
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

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[260px,1fr] md:px-6 md:py-8">
        {/* Sidebar */}
        <aside className="md:sticky md:top-20 md:self-start">
          <Card className="p-2">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              NCTB Chapters
            </div>
            <ScrollArea className="md:h-[calc(100vh-180px)]">
              <div className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
                {CHAPTERS.map((ch) => {
                  const count = countsByChapter[ch.number] ?? 0;
                  const isActive = ch.number === activeChapter;
                  return (
                    <button
                      key={ch.number}
                      onClick={() => setActiveChapter(ch.number)}
                      className={`group flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition md:w-full ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-[10px] ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                            CH {String(ch.number).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="truncate text-xs font-semibold md:text-sm">{ch.titleBn}</div>
                      </div>
                      {count > 0 && (
                        <Badge
                          variant={isActive ? "secondary" : "outline"}
                          className="ml-auto h-5 shrink-0 px-1.5 text-[10px]"
                        >
                          {count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </aside>

        {/* Main */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
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
