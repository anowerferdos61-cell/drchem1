import { useEffect, useState } from "react";
import { RotateCcw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shows a full-screen "please rotate" overlay when a mobile user
 * is in portrait. Attempts (best-effort) to lock landscape via the
 * Screen Orientation API after a user gesture / fullscreen.
 */
export default function LandscapeGate() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = Math.min(w, h) < 768; // phone-sized
      setIsMobile(mobile);
      setIsPortrait(h > w);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // Best-effort auto-lock on mount (will silently fail without fullscreen).
  useEffect(() => {
    if (!isMobile) return;
    const tryLock = async () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (o: string) => Promise<void>;
        };
        await orientation.lock?.("landscape");
      } catch {
        /* ignored — needs fullscreen / user gesture on most browsers */
      }
    };
    void tryLock();
  }, [isMobile]);

  const requestLandscape = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      await orientation.lock?.("landscape");
    } catch {
      /* show overlay until user rotates manually */
    }
  };

  if (!isMobile || !isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 text-center text-white">
      <div className="relative">
        <Smartphone className="h-20 w-20 animate-pulse text-primary" strokeWidth={1.5} />
        <RotateCcw
          className="absolute -right-6 -top-2 h-8 w-8 animate-spin text-primary/80"
          style={{ animationDuration: "2.5s" }}
        />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight">Rotate your device</h2>
        <p className="text-sm text-slate-300">ফোনটি ল্যান্ডস্কেপ মোডে ঘোরান</p>
        <p className="text-xs text-slate-400">
          Virtual Lab works best in landscape · ভার্চুয়াল ল্যাব ল্যান্ডস্কেপে ভালো চলে
        </p>
      </div>
      <Button onClick={requestLandscape} size="sm" variant="secondary">
        <RotateCcw className="mr-2 h-4 w-4" /> Try auto-rotate
      </Button>
    </div>
  );
}
