/**
 * TheoryLabShell — shared layout for all theory / concept labs.
 *
 * Desktop: 3-column fixed 100dvh viewport (Info | Visual | Controls).
 * Mobile: Pinned compact top visual (~35dvh) + unified bottom interactive workbench (Controls + Info) and Theory tab.
 */
import { ReactNode, useState } from "react";
import { ArrowLeft, BookOpen, Sliders, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

export interface TheoryLabShellProps {
  onBack: () => void;
  /** Small header icon (any node — usually a gradient chip with a lucide icon) */
  headerIcon?: ReactNode;
  /** Bengali title, shown large */
  titleBn: string;
  /** English subtitle (chapter + english name) */
  subtitleEn?: string;
  /** Top-right badge (e.g. current phase / pH / result) */
  badge?: ReactNode;

  /** Left column — cards, gauges, concept summary */
  info: ReactNode;
  /** Center — the actual simulation (canvas / svg). Aspect-ratio must be set by child. */
  visual: ReactNode;
  /** Right column — sliders, selects, quick-jump buttons */
  controls: ReactNode;

  /** Optional deep theory content — surfaced via a pull-up drawer or tab. */
  theory?: ReactNode;
  theoryLabel?: string;
}

export default function TheoryLabShell({
  onBack,
  headerIcon,
  titleBn,
  subtitleEn,
  badge,
  info,
  visual,
  controls,
  theory,
  theoryLabel = "থিওরি ও বিস্তারিত",
}: TheoryLabShellProps) {
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"lab" | "theory">("lab");
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-background dark:to-slate-900 select-none">
      {/* ── Compact Header (46px) ── */}
      <header className="z-20 h-11 shrink-0 border-b border-border/60 bg-background/90 px-3 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-1 h-8 shrink-0 gap-1 px-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden text-xs font-semibold sm:inline">Back</span>
            </Button>
            {headerIcon}
            <div className="min-w-0 leading-tight">
              <div className="truncate text-xs font-black tracking-tight sm:text-sm">{titleBn}</div>
              {subtitleEn && (
                <div className="hidden truncate text-[10px] text-muted-foreground sm:block">
                  {subtitleEn}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {badge && <div className="shrink-0">{badge}</div>}
            {theory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDrawerOpen(true)}
                className="hidden h-7 gap-1 border-primary/30 bg-primary/5 px-2.5 text-[11px] font-semibold text-primary hover:bg-primary/10 md:flex"
              >
                <BookOpen className="h-3 w-3" />
                <span>{theoryLabel}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Conditional Rendering ── */}
      {!isMobile ? (
        /* ── Desktop Layout: 3-column fixed 100dvh viewport (zero page scrolling) ── */
        <main className="flex-1 min-h-0 overflow-hidden p-2 grid grid-cols-[minmax(250px,280px)_minmax(0,1fr)_minmax(260px,290px)] lg:grid-cols-[minmax(270px,310px)_minmax(0,1fr)_minmax(280px,320px)] gap-2 lg:gap-3">
          {/* LEFT — Info & Live Readouts */}
          <aside className="lab-scroll flex h-full min-h-0 flex-col gap-2 overflow-y-auto pr-1">
            {info}
          </aside>

          {/* CENTER — Interactive Simulation Visual */}
          <section className="relative flex h-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-2 shadow-sm backdrop-blur">
            <div className="flex h-full w-full items-center justify-center">{visual}</div>
          </section>

          {/* RIGHT — Controls & Parameters */}
          <aside className="lab-scroll flex h-full min-h-0 flex-col gap-2 overflow-y-auto pl-1">
            {controls}
          </aside>
        </main>
      ) : (
        /* ── Mobile Layout: Compact Top Visual + Unified Bottom Workbench ── */
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          {/* TOP: Compact Pinned Visual Viewport */}
          <div className="relative h-[36dvh] min-h-[170px] max-h-[220px] shrink-0 border-b border-border/70 bg-slate-950/5 dark:bg-black/30 p-1.5 flex items-center justify-center overflow-hidden">
            <div className="flex h-full w-full items-center justify-center">{visual}</div>
          </div>

          {/* BOTTOM: Interactive Workbench */}
          <div className="flex flex-1 flex-col min-h-0 bg-background/95 backdrop-blur">
            {/* Tab Selection Bar */}
            <div className="grid grid-cols-2 border-b border-border/60 bg-muted/40 p-1 text-[11px] font-semibold gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab("lab")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all",
                  mobileTab === "lab"
                    ? "bg-background text-primary shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>কন্ট্রোলস ও তথ্য</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab("theory")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all",
                  mobileTab === "theory"
                    ? "bg-background text-primary shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>থিওরি ও ব্যাখ্যা</span>
              </button>
            </div>

            {/* Active Tab Panel Content */}
            <div className="lab-scroll flex-1 min-h-0 overflow-y-auto p-2.5">
              {mobileTab === "lab" && (
                <div className="flex flex-col gap-2.5 pb-4">
                  {/* Controls on top so user can immediately touch buttons & sliders */}
                  {controls}
                  {/* Gauges & Info directly below so user sees readouts immediately */}
                  {info}
                </div>
              )}

              {mobileTab === "theory" && (
                <div className="prose prose-sm max-w-none text-xs dark:prose-invert pb-4">
                  {theory || (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                      <HelpCircle className="h-8 w-8 mb-2 opacity-40" />
                      <p>এই ল্যাবের জন্য কোনো বিস্তারিত থিওরি নোট যুক্ত নেই।</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-up Theory Sheet (for desktop button or full modal view) ── */}
      {theory && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[85dvh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-base font-bold">{theoryLabel}</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="px-4 pb-6">
              <div className="prose prose-sm max-w-none text-xs sm:text-sm dark:prose-invert">
                {theory}
              </div>
            </ScrollArea>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="mx-4 mb-3">
                বন্ধ করুন
              </Button>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
