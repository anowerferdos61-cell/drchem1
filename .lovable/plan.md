## Virtual Chemistry Lab — Full Rebuild Plan

Rebuild the existing single-file `TitrationLab.tsx` into a modular, AI-powered, 3D titration lab matching the spec.

### Scope
Replace current 2.5D isometric lab with a true Three.js workspace, modular panels, teacher config, mistake tracking, AI viva, and lab report.

### File structure
```text
src/
├── routes/
│   ├── __root.tsx          (keep, add Toaster globally)
│   ├── index.tsx           (central brain — all state + handlers)
│   └── api/viva.ts         (server route, optional — viva uses serverFn)
├── components/
│   ├── lab/
│   │   ├── LabWorkspace.tsx    (r3f Canvas, glass flask, burette, liquid)
│   │   ├── EquipmentPanel.tsx  (draggable equipment list)
│   │   ├── StatusPanel.tsx     (live pH, volume, moles, endpoint)
│   │   ├── StepsPanel.tsx      (step checklist + mistake log)
│   │   ├── ConfigPanel.tsx     (teacher Ma/Va/Mb inputs)
│   │   └── LabReport.tsx       (grade/accuracy/print)
│   └── viva/
│       ├── TeacherViva.tsx     (generate questions via AI)
│       └── StudentViva.tsx     (answer + AI grading)
└── lib/
    ├── viva.functions.ts       (createServerFn → Lovable AI Gateway)
    └── chemistry.ts            (computePH, equivalence, pure functions)
```

### Tech additions
- Add deps: `three`, `@react-three/fiber`, `@react-three/drei`
- AI Gateway provider helper at `src/lib/ai-gateway.ts`
- Lovable AI key — request enable if not present

### Core systems

**Chemistry engine (`lib/chemistry.ts`)**
- `computePH({ Ma, Va, Mb, Vb })` — full strong-acid/strong-base curve (excess H+, equivalence at 7, excess OH−)
- `equivalenceVolume({ Ma, Va, Mb })` → Ve mL
- `solutionColor(pH, endpointPH)` → rgb for phenolphthalein (clear → faint pink ~8.2 → magenta ~10)

**State (in `routes/index.tsx`)**
- `mode`: `'guide' | 'student' | 'classroom'`
- `config`: `{ Ma, Va, Mb }` (persisted localStorage; optional Supabase save later)
- `placed`: record of equipment on bench
- `hasIndicator`, `stopcockOpen`, `Vb` (dispensed mL), `pH`
- `mistakes[]`: `{ ts, type, severity }`
- `steps[]`: ordered with `done` flag
- `timer`, `startedAt`, `submitted`, `report`
- `viva`: `{ questions[], answers[], grade }`

**Animation loop**
- `requestAnimationFrame` while `stopcockOpen`: increment `Vb` at adaptive rate (slows near Ve), recompute pH, update flask liquid color via uniform.

**Mistake detection**
- Open stopcock before indicator → `no_indicator` (high)
- Burette before clamp → `no_clamp` (med)
- Vb > Ve + 1.0 → `over_titration` (high)
- Reset before submit → `incomplete` (low)

**3D Workspace**
- `<Canvas camera={{ position: [0, 1.2, 3], fov: 45 }}>`
- Drei: `MeshTransmissionMaterial` for glass, `ContactShadows`, `Environment preset="studio"`, `OrbitControls` (limited)
- Erlenmeyer flask via `latheGeometry` (profile points)
- Burette cylinder + liquid `<mesh>` whose `scale.y` animates with `Vb`
- Drip: tiny instanced spheres while open
- Stir bar rotating mesh when stirring

**AI Viva (`lib/viva.functions.ts`)**
- `generateViva({ topic, count })` — serverFn → AI Gateway `google/gemini-3-flash-preview`, returns `{ questions: [{ q, expected }] }` via `Output.object` + zod
- `gradeViva({ questions, answers })` → `{ score, perQuestion: [{ correct, feedback }], gaps[] }`
- Client uses `useServerFn`; sync via custom `viva:update` window event

**Lab Report**
- Computes: accuracy = `1 - |Vb_final - Ve| / Ve`; grade A(≥95) B(≥85) C(≥75) D(≥65) F
- Print via `window.print()` with print CSS

**Localization**
- All labels bilingual inline: `"Reset · পুনরায় শুরু"`

### Verification
- `bun add` deps, then build
- Open preview, check 3D renders, drag flow, pH updates, viva generates

### Notes for the user (non-technical)
This delivers a full chemistry lab with a real 3D scene, teacher controls, AI-powered oral exam (viva), automatic mistake tracking, and a printable lab report. Two modes (Guide / Student) plus a Classroom projection mode. All labels appear in English and Bengali.
