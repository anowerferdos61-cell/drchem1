/**
 * Electron Configuration & Period-Group Determination
 * ইলেকট্রন বিন্যাস ও পর্যায়-গ্রুপ নির্ণয়
 *
 * Interactive Bohr-model visualiser for the first 30 elements (H → Zn).
 * Bilingual labels, animated electrons, step-by-step Period/Group logic,
 * and a mini periodic-table snippet that highlights the current element.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Atom, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ELEMENTS,
  ELEMENT_BY_Z,
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
  // Radii for up to 4 shells
  const radii = [40, 70, 105, 145];
  // Animation period (s): slower when speed→0
  const basePeriod = 8 - speed * 6; // 8s slow → 2s fast

  // Nucleus: protons (Z), neutrons ≈ round(mass-Z). Use small cluster.
  const nucleons = Math.min(element.Z * 2, 28); // visual cap
  const protonCount = Math.min(element.Z, Math.ceil(nucleons / 2));
  const neutronCount = Math.max(0, nucleons - protonCount);

  return (
    <svg
      viewBox="0 0 400 400"
      className="h-full w-full max-h-[460px]"
      role="img"
      aria-label={`Bohr model of ${element.name}`}
    >
      {/* Shells */}
      {shells.map((count, idx) => {
        const r = radii[idx];
        const isFocus = focusShell === idx + 1;
        const dim = focusShell !== null && !isFocus;
        const isValence = idx === shells.length - 1;
        return (
          <g key={`shell-${idx}`} opacity={dim ? 0.25 : 1}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={isFocus ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.35)"}
              strokeDasharray={isFocus ? "0" : "3 4"}
              strokeWidth={isFocus ? 1.5 : 1}
              className="cursor-pointer"
              onClick={() => onFocusShell(isFocus ? null : idx + 1)}
            />
            {/* Shell label */}
            <text
              x={cx + r + 4}
              y={cy - 4}
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
              className="select-none"
            >
              {SHELL_NAMES[idx]} ({count})
            </text>

            {/* Electrons orbiting */}
            <g style={{ transformOrigin: `${cx}px ${cy}px` }}>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${cx} ${cy}`}
                to={`360 ${cx} ${cy}`}
                dur={`${basePeriod + idx * 0.7}s`}
                repeatCount="indefinite"
              />
              {Array.from({ length: count }).map((_, ei) => {
                const angle = (ei / count) * Math.PI * 2;
                const ex = cx + r * Math.cos(angle);
                const ey = cy + r * Math.sin(angle);
                return (
                  <circle
                    key={`e-${idx}-${ei}`}
                    cx={ex}
                    cy={ey}
                    r={isValence ? 5.5 : 4.5}
                    fill="#facc15"
                    stroke={isValence ? "#ef4444" : "rgba(0,0,0,0.25)"}
                    strokeWidth={isValence ? 1.5 : 0.6}
                  >
                    <title>
                      {isValence
                        ? `Valence electron · যোজ্যতা ইলেকট্রন (${SHELL_NAMES[idx]})`
                        : `Electron · ইলেকট্রন (${SHELL_NAMES[idx]})`}
                    </title>
                  </circle>
                );
              })}
            </g>
          </g>
        );
      })}

      {/* Nucleus cluster */}
      <g>
        <circle cx={cx} cy={cy} r={28} fill="hsl(var(--muted))" opacity="0.4" />
        {Array.from({ length: nucleons }).map((_, i) => {
          const a = (i / nucleons) * Math.PI * 2;
          const rr = i % 2 === 0 ? 9 : 16;
          const px = cx + rr * Math.cos(a);
          const py = cy + rr * Math.sin(a);
          const isProton = i < protonCount;
          return (
            <circle
              key={`n-${i}`}
              cx={px}
              cy={py}
              r={4.5}
              fill={isProton ? "#3b82f6" : "#94a3b8"}
            >
              <title>{isProton ? "Proton" : "Neutron"}</title>
            </circle>
          );
        })}
        <text
          x={cx}
          y={cy + 3}
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="hsl(var(--foreground))"
        >
          {element.symbol}
        </text>
      </g>

      {/* Legend */}
      <g fontSize="9" fill="hsl(var(--muted-foreground))">
        <circle cx={14} cy={384} r={4} fill="#3b82f6" />
        <text x={22} y={387}>proton ({protonCount}/{element.Z})</text>
        <circle cx={120} cy={384} r={4} fill="#94a3b8" />
        <text x={128} y={387}>neutron</text>
        <circle cx={210} cy={384} r={4} fill="#facc15" />
        <text x={218} y={387}>electron</text>
        <circle cx={300} cy={384} r={4} fill="#facc15" stroke="#ef4444" strokeWidth={1.5} />
        <text x={308} y={387}>valence · যোজ্যতা</text>
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

function PeriodicSnippet({ element }: { element: Element }) {
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
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Periodic Table snippet · পর্যায় সারণি (H – Zn)
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
            <>
              <div key={`ph-${p}`} className="self-center text-[9px] font-medium text-muted-foreground">
                {p}
              </div>
              {groups.map((g) => {
                const el = lookup.get(`${p}-${g}`);
                if (!el) return <div key={`c-${p}-${g}`} className="h-9 rounded-sm bg-muted/20" />;
                const active = el.Z === element.Z;
                return (
                  <div
                    key={`c-${p}-${g}`}
                    className={`flex h-9 flex-col items-center justify-center rounded-sm text-[10px] leading-none ${groupColor(g)} ${
                      active
                        ? "ring-2 ring-primary ring-offset-1 scale-110 font-bold shadow-md"
                        : "opacity-90"
                    } transition-all`}
                    title={`${el.name} · ${el.nameBn} (Z=${el.Z})`}
                  >
                    <span className="text-[8px] opacity-70">{el.Z}</span>
                    <span className="font-bold">{el.symbol}</span>
                  </div>
                );
              })}
            </>
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
  const [search, setSearch] = useState("");

  const element = ELEMENT_BY_Z.get(Z)!;

  useEffect(() => {
    setFocusShell(null);
  }, [Z]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ELEMENTS;
    return ELEMENTS.filter(
      (e) =>
        e.symbol.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.nameBn.includes(search.trim()) ||
        String(e.Z) === q,
    );
  }, [search]);

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

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[260px_1fr_320px]">
        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Element · মৌল
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Na, 11, সোডিয়াম..."
                className="w-full rounded-md border bg-background py-1.5 pl-8 pr-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Search element"
              />
            </div>
            <Select value={String(Z)} onValueChange={(v) => setZ(parseInt(v, 10))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filtered.map((e) => (
                  <SelectItem key={e.Z} value={String(e.Z)}>
                    <span className="font-mono">{String(e.Z).padStart(2, "0")}</span>{" "}
                    <span className="font-semibold">{e.symbol}</span> · {e.name} · {e.nameBn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-1.5 pt-2">
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

          <Card className="p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Properties · ধর্ম
            </div>
            <Prop label="Atomic No · পারমাণবিক সংখ্যা" value={String(element.Z)} />
            <Prop label="Symbol · প্রতীক" value={element.symbol} />
            <Prop label="Name · নাম" value={`${element.name} · ${element.nameBn}`} />
            <Prop label="Total e⁻ · মোট ইলেকট্রন" value={String(element.Z)} />
            <Prop label="Shells · শেল" value={element.shells.join(", ")} />
            <Prop label="Block" value={element.block.toUpperCase()} />
          </Card>

          <Card className="p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick navigate · দ্রুত মৌল
            </div>
            <div className="grid grid-cols-5 gap-1">
              {ELEMENTS.map((e) => (
                <button
                  key={e.Z}
                  onClick={() => setZ(e.Z)}
                  className={`rounded-md border px-1 py-1 text-[10px] font-mono transition ${
                    e.Z === Z
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/40 hover:bg-muted"
                  }`}
                  title={`${e.name} · ${e.nameBn}`}
                >
                  {e.symbol}
                </button>
              ))}
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
            <PeriodicSnippet element={element} />
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

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
