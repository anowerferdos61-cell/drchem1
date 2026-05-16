import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  MeshTransmissionMaterial,
  OrbitControls,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import type { Placed } from "./types";
import { solutionColor } from "@/lib/chemistry";

interface Props {
  placed: Placed;
  Vb: number; // mL dispensed
  Ve: number; // mL equivalence
  pH: number;
  stopcockOpen: boolean;
  stirring: boolean;
  classroom: boolean;
}

// Erlenmeyer profile (radius, height) for latheGeometry — units: meters.
const FLASK_PROFILE: Array<[number, number]> = [
  [0.0, 0.0],
  [0.32, 0.0],
  [0.32, 0.06],
  [0.05, 0.55], // neck taper
  [0.08, 0.55],
  [0.36, 0.06],
  [0.0, 0.06],
];

function flaskGeometry() {
  const points = FLASK_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(points, 64);
}

function Flask({
  hasLiquid,
  liquidColor,
  liquidAlpha,
  stirring,
}: {
  hasLiquid: boolean;
  liquidColor: THREE.Color;
  liquidAlpha: number;
  stirring: boolean;
}) {
  const stirRef = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (stirRef.current && stirring) stirRef.current.rotation.y += dt * 8;
  });
  const flaskGeo = useMemo(() => flaskGeometry(), []);

  return (
    <group position={[0, 0, 0]}>
      {/* Glass body */}
      <mesh geometry={flaskGeo} castShadow receiveShadow>
        <MeshTransmissionMaterial
          thickness={0.4}
          roughness={0.05}
          transmission={1}
          ior={1.45}
          chromaticAberration={0.02}
          backside
          color="#ffffff"
        />
      </mesh>
      {/* Liquid (slightly smaller lathe up to fill level) */}
      {hasLiquid && (
        <mesh position={[0, 0.005, 0]}>
          <cylinderGeometry args={[0.3, 0.34, 0.18, 48]} />
          <meshStandardMaterial
            color={liquidColor}
            transparent
            opacity={liquidAlpha}
            roughness={0.2}
          />
        </mesh>
      )}
      {/* Stir bar */}
      {hasLiquid && (
        <mesh ref={stirRef} position={[0, 0.01, 0]}>
          <boxGeometry args={[0.18, 0.02, 0.04]} />
          <meshStandardMaterial color="#eaeaea" metalness={0.4} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

function Burette({
  fillFrac,
  open,
}: {
  fillFrac: number;
  open: boolean;
}) {
  // Burette is a tall thin cylinder above the flask.
  // fillFrac: 1 = full at top, decreases as liquid is dispensed.
  const liquidHeight = 0.9 * fillFrac;
  const liquidY = 0.55 + liquidHeight / 2;

  return (
    <group position={[0, 0.6, 0]}>
      {/* Glass tube */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.95, 32, 1, true]} />
        <MeshTransmissionMaterial
          thickness={0.2}
          transmission={1}
          ior={1.45}
          roughness={0.05}
          color="#ffffff"
          backside
        />
      </mesh>
      {/* NaOH liquid inside */}
      {fillFrac > 0.01 && (
        <mesh position={[0, liquidY - 0.55, 0]}>
          <cylinderGeometry args={[0.045, 0.045, liquidHeight, 32]} />
          <meshStandardMaterial color="#dbeaff" transparent opacity={0.7} roughness={0.2} />
        </mesh>
      )}
      {/* Stopcock */}
      <mesh position={[0, -0.52, 0]} rotation={[0, 0, open ? Math.PI / 2 : 0]}>
        <boxGeometry args={[0.16, 0.04, 0.04]} />
        <meshStandardMaterial color={open ? "#22c55e" : "#0ea5e9"} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Tip */}
      <mesh position={[0, -0.6, 0]}>
        <coneGeometry args={[0.025, 0.08, 16]} />
        <MeshTransmissionMaterial transmission={1} thickness={0.1} ior={1.45} color="#ffffff" />
      </mesh>
      {/* Drip */}
      {open && <Drip />}
    </group>
  );
}

function Drip() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 1.5) % 1;
    ref.current.position.y = -0.65 - t * 0.55;
    (ref.current.material as THREE.MeshStandardMaterial).opacity = 1 - t;
  });
  return (
    <mesh ref={ref} position={[0, -0.65, 0]}>
      <sphereGeometry args={[0.018, 12, 12]} />
      <meshStandardMaterial color="#bcd6ff" transparent opacity={1} />
    </mesh>
  );
}

function Clamp() {
  return (
    <group>
      {/* Stand base */}
      <mesh position={[0.6, -0.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.04, 0.4]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Vertical rod */}
      <mesh position={[0.78, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 1.7, 16]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Horizontal clamp arm */}
      <mesh position={[0.4, 0.9, 0]} castShadow>
        <boxGeometry args={[0.55, 0.04, 0.06]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function LabWorkspace({
  placed,
  Vb,
  Ve,
  pH,
  stopcockOpen,
  stirring,
  classroom,
}: Props) {
  const liquidColor = useMemo(() => {
    const c = solutionColor(pH);
    return new THREE.Color(c.r / 255, c.g / 255, c.b / 255);
  }, [pH]);
  const liquidAlpha = useMemo(() => solutionColor(pH).a, [pH]);
  const buretteFrac = Math.max(0, 1 - Vb / 50); // 50 mL burette

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [1.6, 1.4, 2.4], fov: classroom ? 38 : 45 }}
      className="rounded-2xl"
      style={{ background: "transparent" }}
    >
      <color attach="background" args={["#e8f0f7"]} />
      <fog attach="fog" args={["#e8f0f7", 6, 14]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[3, 5, 2]}
        intensity={1.2}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Environment preset="studio" />

      {/* Lab bench */}
      <mesh position={[0, -0.42, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#e7d6b8" roughness={0.9} />
      </mesh>

      {placed.clamp && <Clamp />}

      {placed.flask && (
        <Float floatIntensity={0} rotationIntensity={0} speed={0}>
          <Flask
            hasLiquid={placed.hcl}
            liquidColor={liquidColor}
            liquidAlpha={liquidAlpha}
            stirring={stirring}
          />
        </Float>
      )}

      {placed.burette && placed.clamp && (
        <Burette fillFrac={placed.naoh ? buretteFrac : 0} open={stopcockOpen} />
      )}

      <ContactShadows
        opacity={0.45}
        scale={6}
        blur={2.4}
        position={[0, -0.41, 0]}
        far={3}
      />

      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={4.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
