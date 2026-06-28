import { useEffect, useState, type ReactNode } from "react";

/**
 * Auto-rotates lab content into landscape on portrait mobile devices using a
 * CSS transform. The viewport stays portrait, but the content is rendered
 * sideways at landscape dimensions — so users get a true landscape lab
 * experience without manually turning the phone.
 *
 * Best-effort Screen Orientation lock is still attempted (works when the
 * page is fullscreen), and we fall back to the CSS rotation otherwise.
 */
export default function LandscapeWrapper({ children }: { children: ReactNode }) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [rotate, setRotate] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = Math.min(w, h) < 768;
      const isPortrait = h > w;
      setRotate(isMobile && isPortrait);
      setDims({ w, h });
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // Best-effort native landscape lock (silently fails without fullscreen).
  useEffect(() => {
    if (!rotate) return;
    const tryLock = async () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (o: string) => Promise<void>;
        };
        await orientation.lock?.("landscape");
      } catch {
        /* fall back to CSS rotation */
      }
    };
    void tryLock();
  }, [rotate]);

  if (!rotate || !dims) {
    return <>{children}</>;
  }

  // Rotate the inner content 90° so it occupies a landscape canvas
  // (width = device height, height = device width).
  return (
    <div
      className="fixed inset-0 overflow-hidden bg-background"
      style={{ touchAction: "manipulation" }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: `${dims.h}px`,
          height: `${dims.w}px`,
          transform: "translate(-50%, -50%) rotate(90deg)",
          transformOrigin: "center center",
          overflow: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
