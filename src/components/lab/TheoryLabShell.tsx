/**
 * TheoryLabShell — shared layout for all theory / concept labs.
 *
 * One canonical mobile-landscape UX:
 *   ┌───────────────────────────────────────────────┐
 *   │  ← Back    Title                     [Badge]  │
 *   ├────────┬────────────────────────┬────────────┤
 *   │  INFO  │       VISUAL           │  CONTROLS  │
 *   │  25%   │       50% (auto-fit)   │    25%     │
 *   └────────┴────────────────────────┴────────────┘
 *   +  optional pull-up Theory sheet
 *
 * On portrait or narrow screens it stacks: info → visual → controls.
 * The visual slot always auto-fits its own aspect ratio inside the
 * available space (no manual sizing needed by the lab).
 */
import { ReactNode, useState } from "react";
import { ArrowLeft, BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  /** Optional deep theory content — surfaced via a pull-up drawer. */
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
  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      {/* ── Header ── */}
      <header className="shrink-0 border-b bg-background/85 backdrop-blur-xl">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 h-8 shrink-0 gap-1 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden text-lab-sm sm:inline">Back</span>
            </Button>
            {headerIcon}
            <div className="min-w-0 leading-tight">
              <div className="truncate font-extrabold tracking-tight text-lab-base">
                {titleBn}
              </div>
              {subtitleEn && (
                <div className="truncate text-lab-xs text-muted-foreground">
                  {subtitleEn}
                </div>
              )}
            </div>
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      </header>

      {/* ── Body ── */}
      <main className="min-h-0 flex-1 p-2 sm:p-2.5">
        <div
          className={cn(
            "grid h-full min-h-0 gap-2 sm:gap-2.5",
            // Portrait / narrow: stack. Landscape: 3 columns.
            "grid-rows-[auto_minmax(0,1fr)_auto] grid-cols-1",
            "landscape:grid-rows-1 landscape:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,0.95fr)]",
          )}
        >
          {/* LEFT — info */}
          <aside className="lab-scroll flex min-h-0 flex-col gap-2 overflow-y-auto pr-0.5 landscape:pr-1">
            {info}
          </aside>

          {/* CENTER — visual (auto-fits its aspect-ratio child) */}
          <section className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden">
            <div className="flex h-full w-full items-center justify-center">
              {visual}
            </div>
          </section>

          {/* RIGHT — controls */}
          <aside className="lab-scroll flex min-h-0 flex-col gap-2 overflow-y-auto pl-0.5 landscape:pl-1">
            {controls}
          </aside>
        </div>
      </main>

      {/* ── Pull-up theory sheet ── */}
      {theory && (
        <TheoryDrawer label={theoryLabel}>{theory}</TheoryDrawer>
      )}
    </div>
  );
}

function TheoryDrawer({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          className="absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/90 px-3 py-1.5 text-lab-xs font-semibold text-primary-foreground shadow-lg backdrop-blur transition hover:bg-primary"
          type="button"
        >
          <BookOpen className="h-3.5 w-3.5" />
          {label}
          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lab-lg">{label}</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="px-4 pb-6">
          <div className="prose prose-sm max-w-none text-lab-sm dark:prose-invert">
            {children}
          </div>
        </ScrollArea>
        <DrawerClose asChild>
          <Button variant="ghost" size="sm" className="mx-4 mb-3">
            বন্ধ করুন
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}
