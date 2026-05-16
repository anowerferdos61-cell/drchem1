import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, FlaskConical, Beaker, Droplets, CheckCircle2 } from "lucide-react";

type ItemId =
  | "stand"
  | "clamp"
  | "burette"
  | "flask"
  | "naoh"
  | "hcl"
  | "indicator";

type Placed = {
  clampOnStand: boolean;
  buretteOnClamp: boolean;
  flaskOnBench: boolean;
  buretteFilled: boolean;
  acidInFlask: boolean;
  indicatorAdded: boolean;
};

const initialPlaced: Placed = {
  clampOnStand: false,
  buretteOnClamp: false,
  flaskOnBench: false,
  buretteFilled: false,
  acidInFlask: false,
  indicatorAdded: false,
};

const ENDPOINT = 25.0;
const BURETTE_MAX = 50.0;

function getFlaskColor(vol: number, indicatorAdded: boolean) {
  if (!indicatorAdded) return "transparent";
  if (vol < 24.5) return "transparent";
  if (vol < 25.0) {
    // gradually showing very faint pink
    const t = (vol - 24.5) / 0.5;
    return `oklch(0.95 ${0.02 + t * 0.03} 0 / ${0.15 + t * 0.25})`;
  }
  if (vol <= 25.05) {
    return `oklch(0.88 0.08 0 / 0.85)`;
  }
  // Over-titration: ramp to vivid magenta
  const t = Math.min(1, (vol - 25.05) / 3);
  const l = 0.88 - t * 0.26;
  const c = 0.08 + t * 0.2;
  const h = 0 - t * 10;
  return `oklch(${l} ${c} ${h})`;
}

export default function TitrationLab() {
  const [placed, setPlaced] = useState<Placed>(initialPlaced);
  const [dispensed, setDispensed] = useState(0);
  const [stopcockOpen, setStopcockOpen] = useState(false);
  const [endpointReached, setEndpointReached] = useState(false);
  const [overTitrated, setOverTitrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [draggingId, setDraggingId] = useState<ItemId | null>(null);
  const [pourFx, setPourFx] = useState<string | null>(null);
  const [flashes, setFlashes] = useState<{ id: number; long: boolean }[]>([]);
  const flashIdRef = useRef(0);

  // Titration loop
  useEffect(() => {
    if (!stopcockOpen) return;
    const interval = setInterval(() => {
      setDispensed((prev) => {
        if (prev >= BURETTE_MAX) return prev;
        // Slow down near endpoint
        const dist = Math.abs(ENDPOINT - prev);
        let step = 0.25;
        if (dist < 0.5) step = 0.05;
        else if (dist < 2) step = 0.12;
        const next = Math.min(BURETTE_MAX, prev + step);
        // emit a flash if past 24.0 and indicator present
        if (placed.indicatorAdded && next < 25.0 && next > 22) {
          const long = next > 24.5;
          const id = ++flashIdRef.current;
          setFlashes((f) => [...f, { id, long }]);
          setTimeout(
            () => setFlashes((f) => f.filter((x) => x.id !== id)),
            long ? 1600 : 500,
          );
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [stopcockOpen, placed.indicatorAdded]);

  // Endpoint detection
  useEffect(() => {
    if (!endpointReached && dispensed >= 25.0 && placed.indicatorAdded) {
      setEndpointReached(true);
      setShowConfetti(true);
      setStopcockOpen(false);
      toast.success("End Point Reached!", {
        description: `Volume of NaOH Dispensed = ${dispensed.toFixed(2)} mL. Colorless → Faint Pink.`,
        duration: 6000,
      });
      setTimeout(() => setShowConfetti(false), 4000);
    }
    if (endpointReached && !overTitrated && dispensed > 25.5) {
      setOverTitrated(true);
      toast.error("Over-titration!", {
        description: "The solution has turned magenta. Close the stopcock and reset.",
      });
    }
  }, [dispensed, endpointReached, overTitrated, placed.indicatorAdded]);

  const reset = useCallback(() => {
    setPlaced(initialPlaced);
    setDispensed(0);
    setStopcockOpen(false);
    setEndpointReached(false);
    setOverTitrated(false);
    setShowConfetti(false);
    setFlashes([]);
    toast("Experiment reset", { description: "Lab is ready for a new titration." });
  }, []);

  // Drag handlers
  const onDragStart = (id: ItemId) => (e: React.DragEvent) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnd = () => setDraggingId(null);

  const allow = (target: ItemId): boolean => {
    if (!draggingId) return false;
    if (target === "stand") return draggingId === "clamp" && !placed.clampOnStand;
    if (target === "clamp")
      return draggingId === "burette" && placed.clampOnStand && !placed.buretteOnClamp;
    if (target === "bench-flask" as any) return false;
    return false;
  };

  const handleDrop =
    (target: "stand" | "clamp" | "bench" | "burette-top" | "flask") =>
    (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") as ItemId;
      if (!id) return;

      if (target === "stand" && id === "clamp" && !placed.clampOnStand) {
        setPlaced((p) => ({ ...p, clampOnStand: true }));
        toast("Clamp attached", { description: "Burette clamp snapped onto the stand." });
      } else if (
        target === "clamp" &&
        id === "burette" &&
        placed.clampOnStand &&
        !placed.buretteOnClamp
      ) {
        setPlaced((p) => ({ ...p, buretteOnClamp: true }));
        toast("Burette mounted", { description: "50 mL burette secured in the clamp." });
      } else if (target === "bench" && id === "flask" && !placed.flaskOnBench) {
        setPlaced((p) => ({ ...p, flaskOnBench: true }));
        toast("Flask placed", { description: "Conical flask positioned under the burette." });
      } else if (
        target === "burette-top" &&
        id === "naoh" &&
        placed.buretteOnClamp &&
        !placed.buretteFilled
      ) {
        setPourFx("naoh");
        setTimeout(() => {
          setPlaced((p) => ({ ...p, buretteFilled: true }));
          setPourFx(null);
          toast("Burette filled", { description: "50.00 mL of 0.1 M NaOH loaded." });
        }, 1500);
      } else if (
        target === "flask" &&
        id === "hcl" &&
        placed.flaskOnBench &&
        !placed.acidInFlask
      ) {
        setPourFx("hcl");
        setTimeout(() => {
          setPlaced((p) => ({ ...p, acidInFlask: true }));
          setPourFx(null);
          toast("Acid added", { description: "25.00 mL of 0.1 M HCl in the flask." });
        }, 1400);
      } else if (
        target === "flask" &&
        id === "indicator" &&
        placed.acidInFlask &&
        !placed.indicatorAdded
      ) {
        setPourFx("indicator");
        setTimeout(() => {
          setPlaced((p) => ({ ...p, indicatorAdded: true }));
          setPourFx(null);
          toast("Indicator added", {
            description: "3 drops of phenolphthalein. Solution remains colorless.",
          });
        }, 1200);
      } else {
        toast.error("Not yet", { description: "Complete the previous step first." });
      }
      setDraggingId(null);
    };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const buretteLevel = placed.buretteFilled
    ? Math.max(0, BURETTE_MAX - dispensed)
    : 0;
  const buretteFillPct = (buretteLevel / BURETTE_MAX) * 100;
  const flaskColor = getFlaskColor(dispensed, placed.indicatorAdded);

  // Next step hint
  const nextHint = useMemo(() => {
    if (!placed.clampOnStand) return "Drag the Burette Clamp onto the Retort Stand";
    if (!placed.buretteOnClamp) return "Drag the 50 mL Burette into the clamp";
    if (!placed.flaskOnBench) return "Drag the Conical Flask onto the silicone mat";
    if (!placed.buretteFilled) return "Drag the NaOH bottle to the top of the burette";
    if (!placed.acidInFlask) return "Drag the HCl pipette into the conical flask";
    if (!placed.indicatorAdded) return "Drag the Phenolphthalein dropper into the flask";
    if (!endpointReached) return "Open the red stopcock to begin titration";
    return "Experiment complete — review your notebook";
  }, [placed, endpointReached]);

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--lab-metal-dark)]/20 bg-[var(--lab-shelf)]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <FlaskConical className="text-[var(--lab-pink-vivid)]" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">Virtual Chemistry Lab</h1>
            <p className="text-xs text-[var(--lab-metal-dark)]">
              Acid–Base Titration · 0.1 M HCl ⇌ 0.1 M NaOH
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[var(--lab-lcd-bg)] text-[var(--lab-lcd-text)] lcd-font">
          STEP · {nextHint}
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--lab-metal-dark)] text-white text-sm font-medium hover:bg-black/80 transition"
        >
          <RotateCcw size={14} /> Reset Experiment
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-4 p-4">
        {/* LEFT: Shelf */}
        <aside className="lab-iso rounded-xl bg-[var(--lab-shelf)] p-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_8px_24px_rgba(0,0,0,0.12)] border border-[var(--lab-metal-dark)]/20">
          <h2 className="text-xs uppercase tracking-widest text-[var(--lab-metal-dark)] mb-2 font-bold">
            Storage Shelf
          </h2>
          <div className="space-y-3">
            <ShelfTier label="Apparatus">
              {!placed.clampOnStand && (
                <ShelfItem id="clamp" label="Burette Clamp" onDragStart={onDragStart} onDragEnd={onDragEnd}>
                  <ClampIcon />
                </ShelfItem>
              )}
              {!placed.buretteOnClamp && (
                <ShelfItem id="burette" label="50 mL Burette" onDragStart={onDragStart} onDragEnd={onDragEnd}>
                  <BuretteMini />
                </ShelfItem>
              )}
              {!placed.flaskOnBench && (
                <ShelfItem id="flask" label="250 mL Flask" onDragStart={onDragStart} onDragEnd={onDragEnd}>
                  <FlaskMini />
                </ShelfItem>
              )}
            </ShelfTier>
            <ShelfTier label="Chemicals">
              <ShelfItem
                id="naoh"
                label="0.1 M NaOH"
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                disabled={!placed.buretteOnClamp || placed.buretteFilled}
              >
                <Bottle color="oklch(0.92 0.02 220)" label="NaOH" />
              </ShelfItem>
              <ShelfItem
                id="hcl"
                label="0.1 M HCl (Pipette)"
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                disabled={!placed.flaskOnBench || placed.acidInFlask}
              >
                <PipetteMini />
              </ShelfItem>
              <ShelfItem
                id="indicator"
                label="Phenolphthalein"
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                disabled={!placed.acidInFlask || placed.indicatorAdded}
              >
                <Dropper />
              </ShelfItem>
            </ShelfTier>
          </div>
        </aside>

        {/* CENTER: Workbench */}
        <main className="relative rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-[var(--lab-wood-dark)]/40"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.92 0.02 230) 0%, oklch(0.85 0.03 235) 55%, var(--lab-wood) 55%, var(--lab-wood-dark) 100%)",
            minHeight: 600,
          }}
        >
          {/* Wall grid */}
          <div className="absolute inset-x-0 top-0 h-[55%] opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.7 0.02 230 / 0.25) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.02 230 / 0.25) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Silicone mat */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-12 w-[78%] h-32 rounded-2xl"
            style={{
              background: "linear-gradient(180deg, var(--lab-mat), oklch(0.88 0.01 230))",
              boxShadow: "0 8px 18px rgba(0,0,0,0.25), inset 0 1px 0 white",
              transform: "perspective(800px) rotateX(30deg)",
              transformOrigin: "center bottom",
            }}
          />

          {/* Retort Stand */}
          <div className="absolute left-1/2 -translate-x-[180px] bottom-16 flex flex-col items-center" style={{ height: 460 }}>
            {/* Vertical rod */}
            <div className="w-2 flex-1 rounded-full" style={{ background: "linear-gradient(90deg, var(--lab-metal-dark), var(--lab-metal), var(--lab-metal-dark))" }} />
            {/* Base */}
            <div className="w-44 h-5 rounded-md -mt-1"
              style={{
                background: "linear-gradient(180deg, var(--lab-metal), var(--lab-metal-dark))",
                boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
              }}
            />

            {/* Drop zone: stand (upper rod) */}
            <div
              onDragOver={allowDrop}
              onDrop={handleDrop("stand")}
              className={`absolute top-4 -translate-x-1/2 left-1 w-24 h-40 rounded-md transition ${
                draggingId === "clamp" && !placed.clampOnStand
                  ? "ring-2 ring-[var(--lab-amber)] ring-offset-2 bg-[var(--lab-amber)]/15"
                  : ""
              }`}
            />

            {/* Clamp + Burette assembly */}
            {placed.clampOnStand && (
              <div className="absolute left-1 -translate-x-1/2 top-6 flex items-start">
                {/* Clamp arm */}
                <div className="relative">
                  <div className="w-20 h-3 rounded-sm absolute top-6 -left-2"
                    style={{ background: "linear-gradient(180deg, var(--lab-metal), var(--lab-metal-dark))" }}
                  />
                  {/* clamp jaws */}
                  <div className="absolute top-3 left-16 w-9 h-9 rounded-full border-4 border-[var(--lab-metal-dark)]" />
                </div>

                {/* Drop zone for burette */}
                <div
                  onDragOver={allowDrop}
                  onDrop={handleDrop("clamp")}
                  className={`absolute left-14 top-0 w-14 h-80 rounded-md transition ${
                    draggingId === "burette" && placed.clampOnStand && !placed.buretteOnClamp
                      ? "ring-2 ring-[var(--lab-amber)] bg-[var(--lab-amber)]/15"
                      : ""
                  }`}
                />

                {placed.buretteOnClamp && (
                  <div className="absolute left-16 top-0">
                    {/* Burette top drop zone (for NaOH) */}
                    <div
                      onDragOver={allowDrop}
                      onDrop={handleDrop("burette-top")}
                      className={`absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-10 rounded-md transition ${
                        draggingId === "naoh" && !placed.buretteFilled
                          ? "ring-2 ring-[var(--lab-amber)] bg-[var(--lab-amber)]/20"
                          : ""
                      }`}
                    />
                    {/* Burette body */}
                    <div className="relative w-10 h-80 rounded-b-xl border-2 border-[var(--lab-glass-edge)]"
                      style={{
                        background:
                          "linear-gradient(90deg, oklch(0.95 0.01 220 / 0.3), oklch(0.99 0.005 220 / 0.5), oklch(0.95 0.01 220 / 0.3))",
                        boxShadow: "inset 0 0 12px rgba(255,255,255,0.6)",
                      }}
                    >
                      {/* Fill */}
                      <div
                        className="absolute bottom-3 left-1 right-1 rounded-b-md transition-all duration-200"
                        style={{
                          height: `${(buretteFillPct / 100) * 95}%`,
                          background: "linear-gradient(180deg, oklch(0.95 0.015 220 / 0.85), oklch(0.85 0.02 220 / 0.9))",
                          borderTop: "1px solid oklch(0.7 0.02 220)",
                        }}
                      />
                      {/* Pour effect into burette */}
                      {pourFx === "naoh" && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1.5 h-8 rounded-full bg-[var(--lab-naoh)]"
                          style={{ animation: "pour 0.8s ease-in infinite" }}
                        />
                      )}
                      {/* Graduations */}
                      <div className="absolute inset-y-3 left-0 w-full pointer-events-none flex flex-col justify-between py-1">
                        {Array.from({ length: 11 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-2 h-px bg-[var(--lab-glass-edge)]" />
                            <span className="text-[7px] text-[var(--lab-metal-dark)]/70">{i * 5}</span>
                          </div>
                        ))}
                      </div>
                      {/* Stopcock */}
                      <button
                        onClick={() => {
                          if (!placed.indicatorAdded) {
                            toast.error("Add indicator first");
                            return;
                          }
                          if (overTitrated || dispensed >= BURETTE_MAX) {
                            toast.error("Burette empty or over-titrated. Reset.");
                            return;
                          }
                          setStopcockOpen((s) => !s);
                        }}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-red-900 transition-transform"
                        style={{
                          background: "radial-gradient(circle at 30% 30%, oklch(0.7 0.2 25), oklch(0.45 0.22 25))",
                          transform: `translateX(-50%) rotate(${stopcockOpen ? 90 : 0}deg)`,
                          boxShadow: stopcockOpen ? "0 0 12px oklch(0.7 0.2 25)" : "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                        title={stopcockOpen ? "Close stopcock" : "Open stopcock"}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-1 bg-red-950 rounded" />
                      </button>

                      {/* Drip animation */}
                      {stopcockOpen && (
                        <div
                          className="absolute left-1/2 -bottom-8 w-1.5 h-2 rounded-full pointer-events-none"
                          style={{
                            background: "var(--lab-naoh)",
                            animation: "drip 0.5s linear infinite",
                            ["--drip-distance" as any]: "120px",
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bench drop zone & flask */}
          <div
            onDragOver={allowDrop}
            onDrop={handleDrop("bench")}
            className={`absolute left-1/2 -translate-x-1/2 bottom-12 w-[70%] h-32 rounded-2xl transition ${
              draggingId === "flask" && !placed.flaskOnBench
                ? "ring-2 ring-[var(--lab-amber)] bg-[var(--lab-amber)]/10"
                : ""
            }`}
          />

          {placed.flaskOnBench && (
            <div
              className="absolute bottom-20"
              style={{ left: "calc(50% - 180px + 22px)", transform: "translateX(-12px)" }}
            >
              <div
                onDragOver={allowDrop}
                onDrop={handleDrop("flask")}
                className={`relative w-32 h-40 transition ${
                  (draggingId === "hcl" || draggingId === "indicator") && placed.flaskOnBench
                    ? "ring-2 ring-[var(--lab-amber)] rounded-b-full bg-[var(--lab-amber)]/10"
                    : ""
                }`}
              >
                {/* Conical flask SVG */}
                <svg viewBox="0 0 120 160" className="w-full h-full drop-shadow-xl">
                  <defs>
                    <linearGradient id="glass" x1="0" x2="1">
                      <stop offset="0" stopColor="oklch(0.95 0.01 220 / 0.4)" />
                      <stop offset="0.5" stopColor="oklch(0.99 0.005 220 / 0.15)" />
                      <stop offset="1" stopColor="oklch(0.85 0.02 220 / 0.5)" />
                    </linearGradient>
                    <clipPath id="flaskClip">
                      <path d="M50,15 L50,55 L20,140 Q20,150 30,150 L90,150 Q100,150 100,140 L70,55 L70,15 Z" />
                    </clipPath>
                  </defs>
                  {/* Liquid */}
                  {placed.acidInFlask && (
                    <g clipPath="url(#flaskClip)">
                      <rect
                        x="0"
                        y="90"
                        width="120"
                        height="80"
                        fill={flaskColor === "transparent" ? "oklch(0.95 0.01 220 / 0.5)" : flaskColor}
                        style={{ transition: "fill 0.6s ease" }}
                      />
                      {/* Swirl */}
                      <g style={{ transformOrigin: "60px 125px", animation: stopcockOpen ? "swirl 1.6s linear infinite" : "none" }}>
                        <ellipse cx="60" cy="125" rx="28" ry="4" fill="oklch(1 0 0 / 0.25)" />
                      </g>
                      {/* Flash bursts */}
                      {flashes.map((f) => (
                        <circle
                          key={f.id}
                          cx="60"
                          cy="100"
                          r={f.long ? 26 : 14}
                          fill="oklch(0.85 0.12 0 / 0.55)"
                          style={{
                            animation: `pulse-soft ${f.long ? 1.4 : 0.4}s ease-out`,
                          }}
                        />
                      ))}
                    </g>
                  )}
                  {/* Glass outline */}
                  <path
                    d="M50,15 L50,55 L20,140 Q20,150 30,150 L90,150 Q100,150 100,140 L70,55 L70,15 Z"
                    fill="url(#glass)"
                    stroke="var(--lab-glass-edge)"
                    strokeWidth="1.5"
                  />
                  {/* Neck rim */}
                  <rect x="48" y="10" width="24" height="6" rx="2" fill="var(--lab-glass-edge)" />
                  {/* 250 mL mark */}
                  <text x="60" y="135" textAnchor="middle" fontSize="8" fill="var(--lab-metal-dark)">250 mL</text>
                </svg>

                {/* Pouring effects above flask */}
                {pourFx === "hcl" && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1.5 h-10 rounded-full"
                    style={{ background: "var(--lab-hcl)", animation: "pour 0.8s ease-in infinite" }}
                  />
                )}
                {pourFx === "indicator" && (
                  <>
                    {[0, 0.4, 0.8].map((d, i) => (
                      <div
                        key={i}
                        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pink-300"
                        style={{
                          top: -8,
                          animation: `pour 0.7s ease-in ${d}s 1`,
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Hint bubble */}
          <div className="absolute top-3 right-3 max-w-xs px-3 py-2 rounded-lg bg-white/85 backdrop-blur text-xs text-[var(--lab-metal-dark)] shadow border border-[var(--lab-metal-dark)]/15">
            <span className="font-bold text-[var(--lab-pink-vivid)]">Next:</span> {nextHint}
          </div>

          {/* Confetti */}
          {showConfetti && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 60 }).map((_, i) => {
                const colors = ["#ff5fa8", "#ffd166", "#7af0c2", "#7ac8ff", "#c89bff"];
                const left = Math.random() * 100;
                const delay = Math.random() * 1.5;
                const dur = 2 + Math.random() * 2;
                return (
                  <div
                    key={i}
                    className="absolute top-0 w-2 h-3 rounded-sm"
                    style={{
                      left: `${left}%`,
                      background: colors[i % colors.length],
                      animation: `confetti-fall ${dur}s ${delay}s linear forwards`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </main>

        {/* RIGHT: Data + Notebook */}
        <aside className="space-y-4">
          {/* LCD Meter */}
          <div className="rounded-xl p-4 border-2 border-[var(--lab-metal-dark)] shadow-inner"
            style={{ background: "linear-gradient(180deg, var(--lab-metal), var(--lab-metal-dark))" }}
          >
            <div className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-2 flex items-center gap-1">
              <Droplets size={12} /> Digital Burette Reader
            </div>
            <div className="rounded-md p-3"
              style={{ background: "var(--lab-lcd-bg)", boxShadow: "inset 0 0 14px rgba(0,0,0,0.7)" }}
            >
              <div className="lcd-font text-xs text-[var(--lab-lcd-text)]/60 flex justify-between">
                <span>DISPENSED</span>
                <span className={stopcockOpen ? "animate-pulse" : ""}>{stopcockOpen ? "●" : "○"}</span>
              </div>
              <div className="lcd-font text-4xl text-[var(--lab-lcd-text)] tabular-nums text-right mt-1">
                {dispensed.toFixed(2)}
              </div>
              <div className="lcd-font text-xs text-[var(--lab-lcd-text)]/70 text-right">mL</div>
              <div className="mt-2 pt-2 border-t border-[var(--lab-lcd-text)]/20 lcd-font text-[10px] text-[var(--lab-lcd-text)]/70 flex justify-between">
                <span>BURETTE</span>
                <span>{placed.buretteFilled ? buretteLevel.toFixed(2) : "--.--"} mL</span>
              </div>
            </div>
          </div>

          {/* Notebook */}
          <div className="relative rounded-r-lg shadow-lg overflow-hidden"
            style={{ background: "var(--lab-paper)" }}
          >
            {/* Spiral binding */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-[var(--lab-metal-dark)]/10 flex flex-col items-center justify-around py-2">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full border-2 border-[var(--lab-metal-dark)] bg-[var(--lab-metal)]" />
              ))}
            </div>
            <div className="pl-9 pr-4 py-4"
              style={{
                backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, var(--lab-paper-line) 24px)",
              }}
            >
              <h3 className="notebook-font text-2xl text-[var(--lab-metal-dark)] leading-none mb-2">
                Lab Notebook
              </h3>
              <p className="notebook-font text-sm text-[var(--lab-metal-dark)]/80 mb-3">
                Experiment: HCl vs NaOH titration
              </p>
              <ol className="notebook-font text-base text-[var(--lab-metal-dark)] space-y-[2px] leading-6">
                <Entry done={placed.clampOnStand}>Clamp mounted on stand</Entry>
                <Entry done={placed.buretteOnClamp}>Burette secured</Entry>
                <Entry done={placed.flaskOnBench}>Conical flask positioned</Entry>
                <Entry done={placed.buretteFilled}>Burette filled with NaOH (50.00 mL)</Entry>
                <Entry done={placed.acidInFlask}>25.00 mL HCl added to flask</Entry>
                <Entry done={placed.indicatorAdded}>Phenolphthalein indicator added</Entry>
                <Entry done={endpointReached}>End point reached</Entry>
              </ol>

              {endpointReached && (
                <div className="mt-4 p-2 rounded border border-[var(--lab-pink-vivid)]/40 bg-[var(--lab-pink-faint)]/30">
                  <div className="notebook-font text-lg text-[var(--lab-metal-dark)] flex items-center gap-1">
                    <CheckCircle2 size={16} className="text-[var(--lab-pink-vivid)]" /> Results
                  </div>
                  <table className="notebook-font text-sm w-full mt-1 text-[var(--lab-metal-dark)]">
                    <tbody>
                      <tr><td>Initial reading</td><td className="text-right">0.00 mL</td></tr>
                      <tr><td>Final reading</td><td className="text-right">{dispensed.toFixed(2)} mL</td></tr>
                      <tr className="border-t border-[var(--lab-metal-dark)]/30 font-bold">
                        <td>V(NaOH) used</td><td className="text-right">{dispensed.toFixed(2)} mL</td>
                      </tr>
                      <tr><td>[HCl] calc.</td><td className="text-right">0.100 M</td></tr>
                    </tbody>
                  </table>
                  {overTitrated && (
                    <p className="notebook-font text-sm text-red-700 mt-1">⚠ Over-titrated — reset and retry.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Entry({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${done ? "" : "opacity-40"}`}>
      <span className="inline-block w-4">{done ? "✓" : "□"}</span>
      <span className={done ? "" : "line-through-none"}>{children}</span>
    </li>
  );
}

function ShelfTier({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-2 border-t-4 border-[var(--lab-metal-dark)]/40"
      style={{
        background: "linear-gradient(180deg, oklch(0.93 0.01 230), oklch(0.86 0.02 230))",
        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--lab-metal-dark)]/70 font-bold mb-1">{label}</div>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

function ShelfItem({
  id,
  label,
  children,
  onDragStart,
  onDragEnd,
  disabled,
}: {
  id: ItemId;
  label: string;
  children: React.ReactNode;
  onDragStart: (id: ItemId) => (e: React.DragEvent) => void;
  onDragEnd: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart(id)}
      onDragEnd={onDragEnd}
      className={`flex flex-col items-center gap-1 p-2 rounded-md select-none transition ${
        disabled
          ? "opacity-30 cursor-not-allowed"
          : "cursor-grab hover:bg-white/40 active:cursor-grabbing active:scale-95"
      }`}
      title={disabled ? "Complete prior step" : `Drag ${label}`}
    >
      <div className="h-14 flex items-center justify-center">{children}</div>
      <div className="text-[9px] text-center text-[var(--lab-metal-dark)] font-medium leading-tight">{label}</div>
    </div>
  );
}

/* ============ Mini Icons (SVG) ============ */
function ClampIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <rect x="2" y="16" width="26" height="6" rx="1" fill="var(--lab-metal-dark)" />
      <circle cx="30" cy="19" r="7" fill="none" stroke="var(--lab-metal-dark)" strokeWidth="3" />
      <circle cx="6" cy="19" r="2" fill="var(--lab-metal)" />
    </svg>
  );
}
function BuretteMini() {
  return (
    <svg viewBox="0 0 20 50" className="h-12">
      <rect x="7" y="2" width="6" height="40" rx="1" fill="oklch(0.9 0.01 220 / 0.4)" stroke="var(--lab-glass-edge)" />
      <circle cx="10" cy="46" r="3" fill="oklch(0.5 0.22 25)" />
    </svg>
  );
}
function FlaskMini() {
  return (
    <svg viewBox="0 0 40 50" className="h-12">
      <path d="M16,5 L16,18 L8,42 Q8,46 12,46 L28,46 Q32,46 32,42 L24,18 L24,5 Z" fill="oklch(0.95 0.01 220 / 0.4)" stroke="var(--lab-glass-edge)" strokeWidth="1.5" />
      <rect x="15" y="3" width="10" height="3" fill="var(--lab-glass-edge)" />
    </svg>
  );
}
function Bottle({ color, label }: { color: string; label: string }) {
  return (
    <svg viewBox="0 0 30 50" className="h-12">
      <rect x="11" y="2" width="8" height="6" fill="var(--lab-metal-dark)" />
      <rect x="6" y="8" width="18" height="38" rx="2" fill={color} stroke="var(--lab-glass-edge)" />
      <rect x="6" y="22" width="18" height="10" fill="white" />
      <text x="15" y="29" textAnchor="middle" fontSize="6" fill="var(--lab-metal-dark)" fontWeight="bold">{label}</text>
    </svg>
  );
}
function PipetteMini() {
  return (
    <svg viewBox="0 0 20 50" className="h-12">
      <circle cx="10" cy="6" r="5" fill="oklch(0.55 0.18 25)" />
      <rect x="8" y="10" width="4" height="32" fill="oklch(0.93 0.015 200 / 0.6)" stroke="var(--lab-glass-edge)" />
      <polygon points="8,42 12,42 10,48" fill="oklch(0.93 0.015 200 / 0.6)" stroke="var(--lab-glass-edge)" />
    </svg>
  );
}
function Dropper() {
  return (
    <svg viewBox="0 0 24 50" className="h-12">
      <rect x="9" y="2" width="6" height="10" fill="oklch(0.4 0.05 30)" />
      <rect x="4" y="12" width="16" height="28" rx="2" fill="oklch(0.85 0.06 0 / 0.6)" stroke="var(--lab-glass-edge)" />
      <text x="12" y="29" textAnchor="middle" fontSize="5" fill="white" fontWeight="bold">PhPh</text>
      <polygon points="10,40 14,40 12,48" fill="var(--lab-glass-edge)" />
    </svg>
  );
}
