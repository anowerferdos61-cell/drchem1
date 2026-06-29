/**
 * Electron Configuration & Period-Group Determination
 * ইলেকট্রন বিন্যাস ও পর্যায়-গ্রুপ নির্ণয়
 *
 * Interactive Bohr-model visualiser for the first 30 elements (H → Zn).
 * Bilingual labels, animated electrons, step-by-step Period/Group logic,
 * and a mini periodic-table snippet that highlights the current element.
 */
import { Fragment, useEffect, useState } from "react";
import { ArrowLeft, Atom, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  ELEMENTS,
  ELEMENT_BY_Z,
  ELEMENT_FACTS,
  SHELL_NAMES,
  groupRule,
  type Element,
} from "@/lib/electron-config";


interface Props {
  onBack: () => void;
}

// ────────────────────────────────────────────────────────────
// Bohr model SVG
// ────────────────────────────────────────────────────────────

function BohrModel({
  element,
  speed,
  focusShell,
  onFocusShell,
}: {
  element: Element;
  speed: number; // 0..1
  focusShell: number | null;
  onFocusShell: (n: number | null) => void;
}) {
  const cx = 200;
  const cy = 200;
  const shells = element.shells;
  const radii = [55, 90, 128, 165];
  const basePeriod = 14 - speed * 11; // 14s slow → 3s fast (outer baseline)

  return (
    <svg
      viewBox="0 0 400 400"
      className="h-full w-full max-h-[460px]"
      role="img"
      aria-label={`Bohr model of ${element.name}`}
    >
      <defs>
        <radialGradient id="nucleusGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="70%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
        <radialGradient id="electronGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>

      {/* Orbit rings + electrons */}
      {shells.map((count, idx) => {
        const r = radii[idx];
        const isFocus = focusShell === idx + 1;
        const dim = focusShell !== null && !isFocus;
        const isValence = idx === shells.length - 1;
        // Inner shells faster; scale period by (idx+1)
        const period = (basePeriod * (idx + 1)) / shells.length;
        const direction = idx % 2 === 0 ? 1 : -1;

        return (
          <g key={`shell-${idx}`} opacity={dim ? 0.2 : 1}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={isFocus ? "hsl(var(--primary))" : "#94a3b8"}
              strokeOpacity={isFocus ? 0.9 : 0.55}
              strokeDasharray="4 6"
              strokeWidth={isFocus ? 1.6 : 1.1}
              className="cursor-pointer"
              onClick={() => onFocusShell(isFocus ? null : idx + 1)}
            />
            <text
              x={cx + r + 6}
              y={cy + 3}
              fontSize="10"
              fontWeight="600"
              fill="hsl(var(--muted-foreground))"
              className="select-none"
            >
              {SHELL_NAMES[idx]}
            </text>

            {/* Orbiting electrons — rotate around nucleus (cx,cy) so they stay on this shell */}
            <g>
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from={`0 ${cx} ${cy}`}
                to={`${360 * direction} ${cx} ${cy}`}
                dur={`${period}s`}
                repeatCount="indefinite"
                additive="replace"
              />

              {Array.from({ length: count }).map((_, ei) => {
                const angle = (ei / count) * Math.PI * 2;
                const ex = cx + r * Math.cos(angle);
                const ey = cy + r * Math.sin(angle);
                return (
                  <g key={`e-${idx}-${ei}`}>
                    <circle
                      cx={ex}
                      cy={ey}
                      r={isValence ? 7 : 6}
                      fill="url(#electronGrad)"
                      stroke={isValence ? "#ef4444" : "#92400e"}
                      strokeWidth={isValence ? 1.5 : 0.8}
                    >
                      <title>
                        {isValence
                          ? `Valence electron · যোজ্যতা ইলেকট্রন (${SHELL_NAMES[idx]})`
                          : `Electron · ইলেকট্রন (${SHELL_NAMES[idx]})`}
                      </title>
                    </circle>
                  </g>
                );
              })}
            </g>
          </g>
        );
      })}

      {/* Clean nucleus */}
      <g>
        <circle cx={cx} cy={cy} r={32} fill="#1e3a8a" opacity="0.25" />
        <circle
          cx={cx}
          cy={cy}
          r={26}
          fill="url(#nucleusGrad)"
          stroke="#1e40af"
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={cy}
          fontSize="18"
          fontWeight="800"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffffff"
          style={{ paintOrder: "stroke", letterSpacing: "0.5px" }}
        >
          {element.symbol}
        </text>
      </g>

      {/* Legend */}
      <g fontSize="9" fill="hsl(var(--muted-foreground))">
        <circle cx={14} cy={384} r={5} fill="url(#nucleusGrad)" />
        <text x={24} y={387}>nucleus · নিউক্লিয়াস</text>
        <circle cx={150} cy={384} r={5} fill="url(#electronGrad)" stroke="#92400e" strokeWidth={0.6} />
        <text x={160} y={387}>electron</text>
        <circle cx={240} cy={384} r={5} fill="url(#electronGrad)" stroke="#ef4444" strokeWidth={1.5} />
        <text x={250} y={387}>valence · যোজ্যতা</text>
      </g>
    </svg>
  );
}


// ────────────────────────────────────────────────────────────
// Config display
// ────────────────────────────────────────────────────────────

function ConfigDisplay({ element }: { element: Element }) {
  const parts = element.config.split(" ");
  const lastN = element.period;
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        ইলেকট্রন বিন্যাস · Electron Configuration
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-lg leading-tight">
        {parts.map((p, i) => {
          const n = parseInt(p[0] ?? "0", 10);
          const orb = p.slice(1, 2);
          const eCount = p.slice(2);
          const outer = n === lastN;
          return (
            <span
              key={i}
              className={
                outer
                  ? "rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary"
                  : "text-muted-foreground"
              }
            >
              {n}
              {orb}
              <sup>{eCount}</sup>
            </span>
          );
        })}
      </div>
      {element.shortConfig && (
        <div className="font-mono text-sm text-foreground/80">
          <span className="text-muted-foreground">Short · সংক্ষিপ্ত:</span>{" "}
          <span className="rounded bg-muted px-1.5 py-0.5">{element.shortConfig}</span>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Step-by-step determination
// ────────────────────────────────────────────────────────────

function DeterminationPanel({ element }: { element: Element }) {
  const rule = groupRule(element);
  return (
    <div className="space-y-3" aria-live="polite">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        পর্যায় ও গ্রুপ নির্ণয় · Period & Group Logic
      </div>

      <StepCard
        n={1}
        title="Highest Principle Quantum Number · সর্বোচ্চ শক্তিস্তর"
        body={
          <>
            <p className="text-sm">
              বিন্যাসের সর্বোচ্চ <b>n</b> = <span className="font-mono text-primary">{element.period}</span>{" "}
              ⟹ <b>Period {element.period}</b>
            </p>
          </>
        }
      />

      <StepCard
        n={2}
        title="Valence Electrons · যোজ্যতা ইলেকট্রন"
        body={
          <p className="text-sm">
            বাহিরের শেলের ইলেকট্রন সংখ্যা ={" "}
            <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-mono font-bold text-rose-600">
              {element.shells[element.shells.length - 1]}
            </span>
            {element.block === "d" && (
              <>
                {" · "}d-electrons ={" "}
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono font-bold text-amber-700">
                  {element.dCount}
                </span>
              </>
            )}
          </p>
        }
      />

      <StepCard
        n={3}
        title="Group Rule · গ্রুপ নিয়ম"
        body={
          <>
            <p className="text-sm">{rule.ruleBn}</p>
            <p className="mt-1 font-mono text-sm text-primary">{rule.calc} ⟹ Group {element.group}</p>
          </>
        }
      />
    </div>
  );
}

function StepCard({ n, title, body }: { n: number; title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {n}
        </span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="pl-8">{body}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Periodic table snippet
// ────────────────────────────────────────────────────────────

function PeriodicSnippet({
  element,
  onSelect,
}: {
  element: Element;
  onSelect: (z: number) => void;
}) {
  // Build a grid of periods 1..4 × groups 1..18 with sparse cells.
  const cells = ELEMENTS.map((e) => ({
    key: `${e.period}-${e.group}`,
    el: e,
  }));
  const lookup = new Map(cells.map((c) => [c.key, c.el]));
  const periods = [1, 2, 3, 4];
  const groups = Array.from({ length: 18 }, (_, i) => i + 1);

  const groupColor = (g: number) => {
    if (g === 1) return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
    if (g === 2) return "bg-orange-500/10 text-orange-700 dark:text-orange-300";
    if (g >= 3 && g <= 12) return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
    if (g >= 13 && g <= 16) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    if (g === 17) return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
    return "bg-violet-500/10 text-violet-700 dark:text-violet-300";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Periodic Table · পর্যায় সারণি (H – Zn)
        </div>
        <div className="text-[10px] text-muted-foreground">মৌল বেছে নিতে ক্লিক করুন · click to select</div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] gap-1" style={{ gridTemplateColumns: `28px repeat(18, minmax(28px, 1fr))` }}>
          <div />
          {groups.map((g) => (
            <div key={`gh-${g}`} className="text-center text-[9px] font-medium text-muted-foreground">
              {g}
            </div>
          ))}
          {periods.map((p) => (
            <Fragment key={`row-${p}`}>
              <div className="self-center text-[9px] font-medium text-muted-foreground">
                {p}
              </div>
              {groups.map((g) => {
                const el = lookup.get(`${p}-${g}`);
                if (!el) return <div key={`c-${p}-${g}`} className="h-9 rounded-sm bg-muted/20" />;
                const active = el.Z === element.Z;
                return (
                  <button
                    key={`c-${p}-${g}`}
                    onClick={() => onSelect(el.Z)}
                    className={`flex h-9 flex-col items-center justify-center rounded-sm text-[10px] leading-none cursor-pointer ${groupColor(g)} ${
                      active
                        ? "ring-2 ring-primary ring-offset-1 scale-110 font-bold shadow-md z-10"
                        : "opacity-90 hover:opacity-100 hover:scale-105 hover:ring-1 hover:ring-primary/50"
                    } transition-all`}
                    title={`${el.name} · ${el.nameBn} (Z=${el.Z})`}
                  >
                    <span className="text-[8px] opacity-70">{el.Z}</span>
                    <span className="font-bold">{el.symbol}</span>
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

export default function ElectronConfigLab({ onBack }: Props) {
  const [Z, setZ] = useState<number>(11); // Sodium default — nice demo
  const [speed, setSpeed] = useState<number>(0.5);
  const [focusShell, setFocusShell] = useState<number | null>(null);

  const element = ELEMENT_BY_Z.get(Z)!;
  const facts = ELEMENT_FACTS[Z];

  useEffect(() => {
    setFocusShell(null);
  }, [Z]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow">
              <Atom className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight">
                ইলেকট্রন বিন্যাস ও পর্যায়-গ্রুপ নির্ণয়
              </div>
              <div className="text-[11px] text-muted-foreground">
                Electron Configuration & Period-Group Logic · NCTB CH 4
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="hidden border bg-fuchsia-500/10 text-fuchsia-700 sm:inline-flex dark:text-fuchsia-300">
            Interactive Bohr Model
          </Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[300px_1fr_320px]">
        {/* ── Sidebar: Properties only ───────────────────── */}
        <aside className="space-y-4">
          <Card className="overflow-hidden">
            {/* Hero / "sample" visual */}
            <div
              className="relative h-32 w-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${facts?.color ?? "#94a3b8"} 0%, rgba(0,0,0,0.55) 100%)`,
              }}
              aria-label={`${element.name} sample swatch`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute left-3 top-3 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-mono text-white backdrop-blur">
                Z = {element.Z}
              </div>
              <div className="absolute right-3 top-3 rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                {facts?.metalType}
              </div>
              <div className="absolute bottom-2 left-3 text-white drop-shadow">
                <div className="text-3xl font-black leading-none">{element.symbol}</div>
                <div className="text-[11px] opacity-90">
                  {element.name} · {element.nameBn}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Properties · ধর্ম
              </div>
              {facts && (
                <>
                  <Prop label="পারমাণবিক ভর · Mass" value={`${facts.mass} g/mol`} />
                  <Prop label="অবস্থা · State" value={`${facts.state} · ${facts.stateBn}`} />
                  <Prop label="কঠিনতা · Hardness" value={facts.hardnessBn} />
                  <Prop
                    label="রঙ · Colour"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-border"
                          style={{ background: facts.color }}
                        />
                        {facts.colorLabelBn}
                      </span>
                    }
                  />
                  <Prop label="গলনাঙ্ক · Melting" value={facts.melt} />
                  <Prop label="স্ফুটনাঙ্ক · Boiling" value={facts.boil} />
                  {facts.density && <Prop label="ঘনত্ব · Density" value={facts.density} />}
                  <Prop label="প্রকার · Type" value={facts.metalTypeBn} />
                </>
              )}
              <Prop label="শেল · Shells" value={element.shells.join(", ")} />
              <Prop label="ব্লক · Block" value={element.block.toUpperCase()} />
              <Prop label="মোট e⁻ · Electrons" value={String(element.Z)} />

              {facts?.uses && (
                <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-2.5">
                  <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    ব্যবহার · Uses
                  </div>
                  <div className="text-xs leading-snug">{facts.uses}</div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 border-t bg-muted/30 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Animation Speed · গতি</span>
                <span className="font-mono">{Math.round(speed * 100)}%</span>
              </div>
              <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={0} max={1} step={0.05} />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Slow</span><span>Fast</span>
              </div>
            </div>
          </Card>
        </aside>


        {/* ── Center: Bohr model + periodic snippet ───────── */}
        <section className="space-y-4">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Bohr Model · বোর মডেল
                </div>
                <div className="text-sm">
                  শেল-এ ক্লিক করে আলাদা করে দেখুন · click a shell to isolate
                </div>
              </div>
              {focusShell && (
                <Button size="sm" variant="outline" onClick={() => setFocusShell(null)}>
                  Show all
                </Button>
              )}
            </div>
            <div className="aspect-square w-full max-w-[460px] mx-auto">
              <BohrModel element={element} speed={speed} focusShell={focusShell} onFocusShell={setFocusShell} />
            </div>
          </Card>

          <Card className="p-4">
            <PeriodicSnippet element={element} onSelect={setZ} />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                <ChevronRight className="mr-1 h-3 w-3" />
                {element.symbol}: Period {element.period} · Group {element.group}
              </Badge>
              <span className="text-muted-foreground">
                Category: <b className="capitalize">{element.category}</b>
              </span>
            </div>
          </Card>
        </section>

        {/* ── Right: Config + logic ───────────────────────── */}
        <aside className="space-y-4">
          <Card className="p-4">
            <ConfigDisplay element={element} />
          </Card>
          <Card className="p-4">
            <DeterminationPanel element={element} />
          </Card>
        </aside>
      </main>
    </div>
  );
}

function Prop({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}

