/**
 * DraggableTheoryFab — a floating "থিওরি ও বিস্তারিত" button that the
 * user can drag anywhere on the screen. Clicking (without dragging) opens
 * a bottom drawer that scrolls the passed-in theory content.
 *
 * Position persists per-lab in localStorage.
 */
import { ReactNode, useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, GripVertical } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Props {
  storageKey: string;
  label?: string;
  children: ReactNode;
}

export default function DraggableTheoryFab({
  storageKey,
  label = "থিওরি ও বিস্তারিত",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const btnRef = useRef<HTMLDivElement | null>(null);

  // Initial pos: bottom-center
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`fab-pos:${storageKey}`);
      if (raw) {
        setPos(JSON.parse(raw));
        return;
      }
    } catch {
      /* empty */
    }
    const w = typeof window !== "undefined" ? window.innerWidth : 800;
    const h = typeof window !== "undefined" ? window.innerHeight : 600;
    setPos({ x: w / 2 - 90, y: h - 72 });
  }, [storageKey]);

  const clamp = (x: number, y: number) => {
    const el = btnRef.current;
    const w = el?.offsetWidth ?? 180;
    const h = el?.offsetHeight ?? 40;
    const maxX = window.innerWidth - w - 4;
    const maxY = window.innerHeight - h - 4;
    return { x: Math.max(4, Math.min(maxX, x)), y: Math.max(4, Math.min(maxY, y)) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    movedRef.current = false;
    const rect = btnRef.current!.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = Math.abs(e.movementX);
    const dy = Math.abs(e.movementY);
    if (dx + dy > 2) movedRef.current = true;
    const next = clamp(e.clientX - offsetRef.current.x, e.clientY - offsetRef.current.y);
    setPos(next);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (pos) {
      try {
        localStorage.setItem(`fab-pos:${storageKey}`, JSON.stringify(pos));
      } catch {
        /* empty */
      }
    }
  };

  if (!pos) return null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <div
        ref={btnRef}
        style={{ left: pos.x, top: pos.y, touchAction: "none" }}
        className="fixed z-40 select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="flex items-stretch overflow-hidden rounded-full border border-primary/30 bg-primary/95 text-primary-foreground shadow-xl backdrop-blur">
          <div
            className="flex cursor-grab items-center px-2 active:cursor-grabbing"
            title="Drag to move"
          >
            <GripVertical className="h-3.5 w-3.5 opacity-80" />
          </div>
          <DrawerTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                if (movedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  movedRef.current = false;
                  return;
                }
                setOpen(true);
              }}
              className="flex items-center gap-1.5 py-1.5 pl-1 pr-3 text-xs font-semibold hover:bg-primary/80"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {label}
              <ChevronDown className="h-3.5 w-3.5 rotate-180" />
            </button>
          </DrawerTrigger>
        </div>
      </div>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lg">{label}</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="px-4 pb-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">{children}</div>
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
