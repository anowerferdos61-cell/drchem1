/**
 * Hydrocarbon3DLab — Chapter 11 theory lab
 * 3D Ball-and-Stick model builder for hydrocarbons (Methane, Ethane, Ethene, Ethyne).
 * Uses @react-three/fiber + drei for 3D rendering.
 */
import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Atom,
  Sparkles,
  TriangleAlert,
  RotateCw,
  Beaker,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DraggableTheoryFab from "./DraggableTheoryFab";

/* ─────────────────────────── Molecule Data ─────────────────────────── */
type AtomSpec = { el: "C" | "H"; pos: [number, number, number] };
type BondSpec = { a: number; b: number; order: 1 | 2 | 3 };
type AngleSpec = { a: number; center: number; b: number; label: string };

type Molecule = {
  id: "methane" | "ethane" | "ethene" | "ethyne";
  nameBn: string;
  nameEn: string;
  formula: string;
  atoms: AtomSpec[];
  bonds: BondSpec[];
  angles: AngleSpec[];
  geometryBn: string;
  geometryEn: string;
  hybridization: string;
  saturationBn: "সম্পৃক্ত" | "অসম্পৃক্ত";
  saturationEn: "Saturated" | "Unsaturated";
  bondAngle: string;
  color: string;
};

// Tetrahedral coords (methane)
const T = 1.09; // C-H length units
const t = 1 / Math.sqrt(3);
const TET: [number, number, number][] = [
  [t, t, t],
  [-t, -t, t],
  [-t, t, -t],
  [t, -t, -t],
].map(([x, y, z]) => [x * T, y * T, z * T] as [number, number, number]);

const CC = 1.54; // single
const CC2 = 1.34; // double
const CC3 = 1.2; // triple

// Ethane sp3 (staggered)
function ethaneAtoms(): AtomSpec[] {
  const c1: [number, number, number] = [-CC / 2, 0, 0];
  const c2: [number, number, number] = [CC / 2, 0, 0];
  // 3 H around each C, rotated 60° between them (staggered)
  const angH = Math.acos(-1 / 3); // 109.47°, angle between C-C and C-H
  const rH = T;
  const off = Math.sin(angH); // ~0.9428
  const along = Math.cos(angH); // ~-0.333
  const hs1: AtomSpec[] = [0, 1, 2].map((k) => {
    const theta = (k * 2 * Math.PI) / 3;
    return {
      el: "H" as const,
      pos: [c1[0] - along * rH, Math.cos(theta) * off * rH, Math.sin(theta) * off * rH],
    };
  });
  const hs2: AtomSpec[] = [0, 1, 2].map((k) => {
    const theta = (k * 2 * Math.PI) / 3 + Math.PI / 3; // staggered
    return {
      el: "H" as const,
      pos: [c2[0] + along * rH, Math.cos(theta) * off * rH, Math.sin(theta) * off * rH],
    };
  });
  return [{ el: "C", pos: c1 }, { el: "C", pos: c2 }, ...hs1, ...hs2];
}

const MOLECULES: Record<string, Molecule> = {
  methane: {
    id: "methane",
    nameBn: "মিথেন",
    nameEn: "Methane",
    formula: "CH₄",
    atoms: [
      { el: "C", pos: [0, 0, 0] },
      { el: "H", pos: TET[0] },
      { el: "H", pos: TET[1] },
      { el: "H", pos: TET[2] },
      { el: "H", pos: TET[3] },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
    ],
    angles: [{ a: 1, center: 0, b: 2, label: "109.5°" }],
    geometryBn: "চতুস্তলকীয় (Tetrahedral)",
    geometryEn: "Tetrahedral",
    hybridization: "sp³",
    saturationBn: "সম্পৃক্ত",
    saturationEn: "Saturated",
    bondAngle: "109.5°",
    color: "from-emerald-500 to-teal-500",
  },
  ethane: {
    id: "ethane",
    nameBn: "ইথেন",
    nameEn: "Ethane",
    formula: "C₂H₆",
    atoms: ethaneAtoms(),
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
      { a: 1, b: 5, order: 1 },
      { a: 1, b: 6, order: 1 },
      { a: 1, b: 7, order: 1 },
    ],
    angles: [{ a: 2, center: 0, b: 3, label: "109.5°" }],
    geometryBn: "চতুস্তলকীয় (Tetrahedral)",
    geometryEn: "Tetrahedral",
    hybridization: "sp³",
    saturationBn: "সম্পৃক্ত",
    saturationEn: "Saturated",
    bondAngle: "109.5°",
    color: "from-sky-500 to-cyan-500",
  },
  ethene: {
    id: "ethene",
    nameBn: "ইথিন",
    nameEn: "Ethene (Ethylene)",
    formula: "C₂H₄",
    atoms: (() => {
      const c1: [number, number, number] = [-CC2 / 2, 0, 0];
      const c2: [number, number, number] = [CC2 / 2, 0, 0];
      const bh = 1.08;
      const a = (2 * Math.PI) / 3; // 120°
      const dx = bh * Math.cos(Math.PI - a);
      const dy = bh * Math.sin(Math.PI - a);
      return [
        { el: "C", pos: c1 } as AtomSpec,
        { el: "C", pos: c2 } as AtomSpec,
        { el: "H", pos: [c1[0] - Math.abs(dx), dy, 0] },
        { el: "H", pos: [c1[0] - Math.abs(dx), -dy, 0] },
        { el: "H", pos: [c2[0] + Math.abs(dx), dy, 0] },
        { el: "H", pos: [c2[0] + Math.abs(dx), -dy, 0] },
      ];
    })(),
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 1, b: 4, order: 1 },
      { a: 1, b: 5, order: 1 },
    ],
    angles: [{ a: 2, center: 0, b: 1, label: "120°" }],
    geometryBn: "সমতলীয় ত্রিভুজাকার (Trigonal Planar)",
    geometryEn: "Trigonal Planar",
    hybridization: "sp²",
    saturationBn: "অসম্পৃক্ত",
    saturationEn: "Unsaturated",
    bondAngle: "120°",
    color: "from-fuchsia-500 to-pink-500",
  },
  ethyne: {
    id: "ethyne",
    nameBn: "ইথাইন",
    nameEn: "Ethyne (Acetylene)",
    formula: "C₂H₂",
    atoms: [
      { el: "C", pos: [-CC3 / 2, 0, 0] },
      { el: "C", pos: [CC3 / 2, 0, 0] },
      { el: "H", pos: [-CC3 / 2 - 1.06, 0, 0] },
      { el: "H", pos: [CC3 / 2 + 1.06, 0, 0] },
    ],
    bonds: [
      { a: 0, b: 1, order: 3 },
      { a: 0, b: 2, order: 1 },
      { a: 1, b: 3, order: 1 },
    ],
    angles: [{ a: 2, center: 0, b: 1, label: "180°" }],
    geometryBn: "রৈখিক (Linear)",
    geometryEn: "Linear",
    hybridization: "sp",
    saturationBn: "অসম্পৃক্ত",
    saturationEn: "Unsaturated",
    bondAngle: "180°",
    color: "from-orange-500 to-red-500",
  },
};

/* ─────────────────────────── 3D Primitives ─────────────────────────── */
function AtomSphere({
  pos,
  el,
  onHover,
}: {
  pos: [number, number, number];
  el: "C" | "H";
  onHover: (v: boolean) => void;
}) {
  const isC = el === "C";
  const radius = isC ? 0.42 : 0.26;
  const color = isC ? "#1e1e24" : "#e9edf3";
  const emissive = isC ? "#111827" : "#94a3b8";
  const [hover, setHover] = useState(false);
  return (
    <mesh
      position={pos}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        onHover(true);
      }}
      onPointerOut={() => {
        setHover(false);
        onHover(false);
      }}
    >
      <sphereGeometry args={[radius, 48, 48]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.28}
        metalness={0.15}
        clearcoat={0.8}
        clearcoatRoughness={0.25}
        emissive={hover ? "#fde047" : emissive}
        emissiveIntensity={hover ? 0.5 : 0.08}
      />
      {hover && (
        <Html distanceFactor={8} position={[0, radius + 0.25, 0]} center>
          <div className="pointer-events-none rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white">
            {el} · valency {isC ? 4 : 1}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function Bond({
  from,
  to,
  order,
}: {
  from: [number, number, number];
  to: [number, number, number];
  order: 1 | 2 | 3;
}) {
  const vFrom = new THREE.Vector3(...from);
  const vTo = new THREE.Vector3(...to);
  const mid = vFrom.clone().add(vTo).multiplyScalar(0.5);
  const dir = vTo.clone().sub(vFrom);
  const length = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  // Perpendicular offset for multi-bonds
  const perp = new THREE.Vector3(0, 0, 1);
  if (Math.abs(dir.clone().normalize().dot(perp)) > 0.95) {
    perp.set(0, 1, 0);
  }
  const offset = new THREE.Vector3().crossVectors(dir, perp).normalize().multiplyScalar(0.12);

  const cylinders =
    order === 1
      ? [[0, 0, 0]]
      : order === 2
        ? [offset.toArray(), offset.clone().negate().toArray()]
        : [[0, 0, 0], offset.toArray(), offset.clone().negate().toArray()];

  return (
    <>
      {cylinders.map((off, i) => (
        <mesh key={i} position={[mid.x + off[0], mid.y + off[1], mid.z + off[2]]} quaternion={quat}>
          <cylinderGeometry args={[0.07, 0.07, length, 20]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.55} metalness={0.2} />
        </mesh>
      ))}
    </>
  );
}

function BondAngleArc({
  a,
  center,
  b,
  label,
}: {
  a: [number, number, number];
  center: [number, number, number];
  b: [number, number, number];
  label: string;
}) {
  const vC = new THREE.Vector3(...center);
  const vA = new THREE.Vector3(...a).sub(vC).normalize();
  const vB = new THREE.Vector3(...b).sub(vC).normalize();
  const R = 0.5;
  const steps = 24;
  const points: [number, number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = new THREE.Vector3().copy(vA).lerp(vB, t).normalize().multiplyScalar(R).add(vC);
    points.push([p.x, p.y, p.z]);
  }
  const labelPos = new THREE.Vector3()
    .copy(vA)
    .lerp(vB, 0.5)
    .normalize()
    .multiplyScalar(R * 1.35)
    .add(vC);
  return (
    <>
      <Line points={points} color="#f59e0b" lineWidth={2} dashed={false} />
      <Html position={[labelPos.x, labelPos.y, labelPos.z]} center distanceFactor={8}>
        <div className="pointer-events-none rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
          {label}
        </div>
      </Html>
    </>
  );
}

function AutoRotateGroup({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (enabled && g.current) g.current.rotation.y += dt * 0.35;
  });
  return <group ref={g}>{children}</group>;
}

function MoleculeScene({
  mol,
  showAngles,
  autoRotate,
  onAtomHover,
}: {
  mol: Molecule;
  showAngles: boolean;
  autoRotate: boolean;
  onAtomHover: (v: boolean) => void;
}) {
  return (
    <AutoRotateGroup enabled={autoRotate}>
      {mol.atoms.map((a, i) => (
        <AtomSphere key={i} pos={a.pos} el={a.el} onHover={onAtomHover} />
      ))}
      {mol.bonds.map((b, i) => (
        <Bond key={i} from={mol.atoms[b.a].pos} to={mol.atoms[b.b].pos} order={b.order} />
      ))}
      {showAngles &&
        mol.angles.map((ang, i) => (
          <BondAngleArc
            key={i}
            a={mol.atoms[ang.a].pos}
            center={mol.atoms[ang.center].pos}
            b={mol.atoms[ang.b].pos}
            label={ang.label}
          />
        ))}
    </AutoRotateGroup>
  );
}

/* ─────────────────────────── Main Component ─────────────────────────── */
type MolKey = keyof typeof MOLECULES;

export default function Hydrocarbon3DLab({ onBack }: { onBack: () => void }) {
  const [current, setCurrent] = useState<MolKey>("methane");
  const [showAngles, setShowAngles] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const mol = MOLECULES[current];

  const triggerWarning = (msg: string) => {
    setWarning(msg);
    window.setTimeout(() => setWarning(null), 2600);
  };

  const pick = (id: MolKey) => {
    setCurrent(id);
    if (id === "methane" && stepIdx < 2) setStepIdx(2);
    if (id === "ethene" && stepIdx < 3) setStepIdx(3);
    if (stepIdx === 0) setStepIdx(1);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 h-8 shrink-0 gap-1 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">ফিরে যান</span>
            </Button>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow">
              <Atom className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-base font-extrabold tracking-tight">
                হাইড্রোকার্বনের ৩ডি মডেল
              </div>
              <div className="truncate text-xs text-muted-foreground">
                Chapter 11 · 3D Ball-and-Stick Model Builder
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
            {mol.formula} · {mol.hybridization}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 pb-24">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* PANEL 1: 3D Canvas */}
          <Card className="relative overflow-hidden p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                3D Viewport · ৩ডি দৃশ্যপট (drag to rotate)
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  size="sm"
                  variant={showAngles ? "default" : "outline"}
                  onClick={() => setShowAngles((v) => !v)}
                  className="h-7 gap-1 px-2 text-[10px]"
                >
                  <Sparkles className="h-3 w-3" /> কোণ ({mol.bondAngle})
                </Button>
                <Button
                  size="sm"
                  variant={autoRotate ? "default" : "outline"}
                  onClick={() => setAutoRotate((v) => !v)}
                  className="h-7 gap-1 px-2 text-[10px]"
                >
                  <RotateCw className="h-3 w-3" /> Spin
                </Button>
              </div>
            </div>

            <div className="relative h-[420px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-black">
              <Canvas camera={{ position: [3.5, 2.6, 4.2], fov: 45 }} dpr={[1, 2]}>
                <color attach="background" args={["#0b1220"]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1.1} />
                <directionalLight position={[-4, -3, -2]} intensity={0.4} color="#67e8f9" />
                <Suspense fallback={null}>
                  <MoleculeScene
                    mol={mol}
                    showAngles={showAngles}
                    autoRotate={autoRotate}
                    onAtomHover={() => {
                      /* no-op */
                    }}
                  />
                </Suspense>
                <OrbitControls enablePan={false} enableZoom minDistance={3} maxDistance={12} />
              </Canvas>

              {/* Warning banner */}
              <AnimatePresence>
                {warning && (
                  <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1, x: [0, -8, 8, -6, 6, 0] }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300 bg-amber-500/95 px-3 py-1.5 text-xs font-bold text-white shadow-xl"
                  >
                    <TriangleAlert className="h-4 w-4" /> {warning}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Legend */}
              <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-900 ring-1 ring-white/40" />{" "}
                  C
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200 ring-1 ring-white/40" /> H
                </span>
              </div>
            </div>

            {/* Preset Toolbar */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(MOLECULES) as MolKey[]).map((k) => {
                const m = MOLECULES[k];
                const active = k === current;
                return (
                  <button
                    key={k}
                    onClick={() => pick(k)}
                    className={cn(
                      "flex flex-col items-start rounded-lg border p-2 text-left transition-all",
                      active
                        ? cn("ring-2 ring-primary shadow bg-gradient-to-br text-white", m.color)
                        : "hover:border-primary/60 bg-card",
                    )}
                  >
                    <div className={cn("text-[11px] font-bold", active ? "text-white" : "")}>
                      {m.nameBn}
                    </div>
                    <div
                      className={cn(
                        "text-[9px]",
                        active ? "text-white/85" : "text-muted-foreground",
                      )}
                    >
                      {m.nameEn} · {m.formula}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* RIGHT COLUMN */}
          <div className="grid gap-4">
            <BuilderPanel onWarn={triggerWarning} />
            <PropertiesPanel mol={mol} />
            <StepsPanel stepIdx={stepIdx} mol={mol} />
          </div>
        </div>
      </main>

      <DraggableTheoryFab storageKey="hydrocarbon-3d">
        <h3>হাইড্রোকার্বন ও ৩ডি জ্যামিতি</h3>
        <p>
          কার্বন (C) এবং হাইড্রোজেন (H) মিলে গঠিত যৌগকে <strong>হাইড্রোকার্বন</strong> বলে। কার্বনের
          যোজনী ৪ ও হাইড্রোজেনের যোজনী ১। কার্বন এই ৪টি হাত ব্যবহার করে সমযোজী বন্ধন তৈরি করে — কখনও
          একক (single), কখনও দ্বি (double), কখনও ত্রি (triple)।
        </p>

        <h4>মিথেন কেন চতুস্তলকীয়?</h4>
        <p>
          মিথেনে (CH₄) কেন্দ্রীয় কার্বনের চারপাশে ৪ জোড়া বন্ধন-ইলেকট্রন থাকে। VSEPR তত্ত্ব অনুসারে
          ইলেকট্রন জোড়াগুলো একে অপরকে যতটা সম্ভব দূরে রাখতে চায় — তাই ৪টি হাইড্রোজেন গঠন করে একটি
          নিখুঁত <strong>tetrahedron</strong>, এবং সব H–C–H কোণ হয় প্রায় <strong>109.5°</strong>।
        </p>

        <h4>একক · দ্বি · ত্রিবন্ধনের তুলনা</h4>
        <table>
          <thead>
            <tr>
              <th>বন্ধন</th>
              <th>উদাহরণ</th>
              <th>দৈর্ঘ্য (pm)</th>
              <th>শক্তি (kJ/mol)</th>
              <th>কোণ</th>
              <th>হাইব্রিডাইজেশন</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Single (C–C)</td>
              <td>Ethane C₂H₆</td>
              <td>154</td>
              <td>~348</td>
              <td>109.5°</td>
              <td>sp³</td>
            </tr>
            <tr>
              <td>Double (C=C)</td>
              <td>Ethene C₂H₄</td>
              <td>134</td>
              <td>~614</td>
              <td>120°</td>
              <td>sp²</td>
            </tr>
            <tr>
              <td>Triple (C≡C)</td>
              <td>Ethyne C₂H₂</td>
              <td>120</td>
              <td>~839</td>
              <td>180°</td>
              <td>sp</td>
            </tr>
          </tbody>
        </table>
        <p>
          <em>প্যাটার্ন:</em> বন্ধন যত বেশি (single → triple), দৈর্ঘ্য তত কম, শক্তি তত বেশি।
        </p>

        <h4>সম্পৃক্ত বনাম অসম্পৃক্ত</h4>
        <ul>
          <li>
            <strong>সম্পৃক্ত (Saturated):</strong> সব বন্ধন একক — যেমন Methane, Ethane, Propane।
          </li>
          <li>
            <strong>অসম্পৃক্ত (Unsaturated):</strong> কোথাও দ্বি বা ত্রি-বন্ধন — যেমন Ethene,
            Ethyne।
          </li>
        </ul>
      </DraggableTheoryFab>
    </div>
  );
}

/* ─────────────────────────── Builder Panel (Panel 2) ─────────────────────────── */
function BuilderPanel({ onWarn }: { onWarn: (msg: string) => void }) {
  const [bond, setBond] = useState<1 | 2 | 3>(1);

  return (
    <Card className="p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Atom & Bond Kit · পরমাণু ও বন্ধন
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="flex items-center gap-2 rounded-lg border-2 border-dashed p-2 hover:border-primary/60"
          onClick={() => onWarn("প্রিসেট থেকে অণু নির্বাচন করুন · Use preset molecules")}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-neutral-800 to-black shadow-inner ring-2 ring-white/40" />
          <div className="text-left leading-tight">
            <div className="text-[11px] font-bold">Carbon</div>
            <div className="text-[9px] text-muted-foreground">যোজনী 4</div>
          </div>
        </button>
        <button
          className="flex items-center gap-2 rounded-lg border-2 border-dashed p-2 hover:border-primary/60"
          onClick={() => onWarn("হাইড্রোজেনের যোজনী ১, কার্বনে সংযোজন করুন")}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-white shadow-inner ring-2 ring-slate-400/50" />
          <div className="text-left leading-tight">
            <div className="text-[11px] font-bold">Hydrogen</div>
            <div className="text-[9px] text-muted-foreground">যোজনী 1</div>
          </div>
        </button>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
          Bond Type · বন্ধনের ধরন
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((n) => (
            <Button
              key={n}
              size="sm"
              variant={bond === n ? "default" : "outline"}
              onClick={() => setBond(n)}
              className="h-8 text-[11px]"
            >
              {n === 1 ? "একক −" : n === 2 ? "দ্বি =" : "ত্রি ≡"}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-[10px]"
          onClick={() => onWarn("কার্বনের যোজনী ৪, এর বেশি হাত হতে পারবে না!")}
        >
          <TriangleAlert className="h-3.5 w-3.5" /> C-এ ৫ম বন্ধন
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-[10px]"
          onClick={() => onWarn("হাইড্রোজেনের যোজনী ১, একটির বেশি বন্ধন সম্ভব নয়!")}
        >
          <TriangleAlert className="h-3.5 w-3.5" /> H-এ ২য় বন্ধন
        </Button>
      </div>

      <p className="mt-3 rounded-md bg-muted/50 px-2 py-1.5 text-[10px] leading-snug text-muted-foreground">
        💡 উপরের প্রিসেট (মিথেন/ইথেন/ইথিন/ইথাইন) নির্বাচন করে ৩ডি ভিউতে ঘুরিয়ে দেখো। হাত বেশি
        লাগানোর চেষ্টা করলে AI টিউটর সতর্ক করবে।
      </p>
    </Card>
  );
}

/* ─────────────────────────── Properties Panel (Panel 3) ─────────────────────────── */
function PropertiesPanel({ mol }: { mol: Molecule }) {
  const cCount = mol.atoms.filter((a) => a.el === "C").length;
  const hCount = mol.atoms.filter((a) => a.el === "H").length;
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Molecular Properties · আণবিক ধর্ম
        </div>
        <Badge className={cn("text-[10px] bg-gradient-to-br text-white", mol.color)}>
          {mol.formula}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <Info label="নাম · Name" value={`${mol.nameBn} (${mol.nameEn})`} />
        <Info label="আণবিক সংকেত" value={mol.formula} />
        <Info label="কার্বন · Carbon" value={String(cCount)} />
        <Info label="হাইড্রোজেন" value={String(hCount)} />
        <Info label="জ্যামিতি" value={mol.geometryBn} />
        <Info label="বন্ধন কোণ" value={mol.bondAngle} />
        <Info label="হাইব্রিডাইজেশন" value={mol.hybridization} />
        <Info
          label="শ্রেণি · Class"
          value={`${mol.saturationBn} (${mol.saturationEn})`}
          highlight={mol.saturationEn === "Unsaturated" ? "text-fuchsia-600" : "text-emerald-600"}
        />
      </div>
    </Card>
  );
}

function Info({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-2 py-1.5">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className={cn("font-semibold", highlight)}>{value}</div>
    </div>
  );
}

/* ─────────────────────────── Steps Panel (Panel 4) ─────────────────────────── */
function StepsPanel({ stepIdx, mol }: { stepIdx: number; mol: Molecule }) {
  const steps = [
    "ক্যানভাসে একটি কার্বন পরমাণু ড্র্যাগ করুন (Drag a Carbon)",
    "হাইড্রোজেন যুক্ত করে মিথেন (CH₄) সম্পন্ন করুন",
    "২টি কার্বনের মাঝে দ্বিবন্ধন দিয়ে ইথিন ট্রাই করুন",
    "অণুটি ঘুরিয়ে ৩ডি গঠন পর্যবেক্ষণ করুন",
  ];
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Guided Steps · গাইডেড ধাপ
        </div>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Beaker className="h-3 w-3" /> {mol.nameEn}
        </Badge>
      </div>

      <div className="mb-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
        Status:{" "}
        {mol.saturationEn === "Unsaturated"
          ? `${mol.bondAngle} বন্ধন কোণ পরীক্ষা করা হচ্ছে…`
          : `${mol.nameBn} অণু প্রদর্শিত হচ্ছে`}
      </div>

      <ol className="space-y-1.5 text-[11.5px]">
        {steps.map((s, i) => {
          const done = i < stepIdx;
          const current = i === stepIdx;
          return (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-md border px-2 py-1.5",
                done && "border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-950/20",
                current &&
                  "border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-400/40",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white",
                  done ? "bg-emerald-500" : current ? "bg-amber-500" : "bg-muted-foreground/40",
                )}
              >
                {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </span>
              <span className={cn(done && "text-muted-foreground line-through")}>{s}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
