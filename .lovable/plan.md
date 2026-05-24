## NaCl Crystallization Lab — Plan

Add a 4th interactive 2D SVG experiment "Preparation of Pure NaCl Crystals" alongside Titration / O₂ / CO₂, following the exact same architecture.

### Scope
- New experiment id: `nacl_crystal`
- Same UX as OxygenLab/CO2Lab: equipment drag, steps panel, status panel, mistake tracking, lab report, AI assistant context, bilingual labels.
- Engine thresholds match the spec (20–25g salt + 100mL H₂O, filter before heat, evaporate to ~50%, natural cooling, optional seed crystal → cubic NaCl).

### Files to create
1. `src/lib/nacl.ts` — pure simulation logic (state machine, step advancement, mistake detection, accuracy/grade calculation). Mirrors `oxygen.ts` / `co2.ts`.
2. `src/components/lab/workspaces/NaClWorkspace.tsx` — 2D SVG scene: Beaker-1 (dissolving), Beaker-2 (filtrate), funnel + filter paper, tripod + wire gauze + Bunsen burner, evaporating dish, optional seed crystal, animated crystallization growth.
3. `src/components/lab/NaClLab.tsx` — top-level lab component wiring Equipment / Steps / Status / Config / Workspace / Report panels and publishing AI context. Mirrors `OxygenLab.tsx`.

### Files to edit
- `src/components/lab/types.ts`
  - Extend `ExperimentId` with `"nacl_crystal"`.
  - Add new `EquipmentId`s: `mortar_pestle`, `impure_salt`, `distilled_water`, `beaker_1`, `beaker_2`, `funnel`, `filter_paper`, `tripod_stand`, `wire_gauze`, `bunsen_burner`, `evaporating_dish`, `seed_crystal`.
  - Add `NaClPlaced` interface (crushed, dissolved, filter_setup, filtered, on_heat, saturated, cooling, seeded, crystallized).
  - Add `MistakeType`s: `heat_before_filter` (high), `over_evaporation` (med), `rapid_cooling` (low), `no_seed_crystal` (low).
  - Extend `Report` with `crystal_quality?: number`.
- `src/components/lab/ExperimentPicker.tsx` — add 4th card for NaCl experiment (bilingual title/description, icon).
- `src/routes/index.tsx` — route the new id to `<NaClLab />`.
- `src/components/lab/EquipmentPanel.tsx` — register new equipment items (icon + bilingual label) under a `nacl_crystal` group.
- `src/components/lab/StepsPanel.tsx` / `StatusPanel.tsx` — accept new step list & status fields (already props-driven; just ensure copy works for new keys).
- `src/components/lab/LabReport.tsx` — handle the new experiment's report fields (volume reduction %, crystal quality, seed used).
- `src/components/lab/LabAIAssistant.tsx` — system prompt branch for `nacl_crystal` so Dr. Chem gives hint-based guidance using the bilingual terminology mapping (অবিশুদ্ধ লবণ, পরিশ্রুত দ্রবণ, সম্পৃক্ত দ্রবণ, বীজ কেলাস, তারজালি, বুনসেন বার্নার).
- `src/components/lab/Dashboard.tsx` — mark NaCl card as active and route to the experiment.

### Simulation state machine (nacl.ts)
Steps map 1:1 to the 6-step checklist. Key transitions:
- Crush + dissolve → requires `mortar_pestle` + `impure_salt` + `distilled_water` + `beaker_1`.
- Filtration → requires `funnel` + `filter_paper` + `beaker_2`; produces `filtered=true`.
- Heating → enabling burner with `filtered=false` triggers `heat_before_filter` (high severity).
- Saturation tracked as `volumeFrac` decreasing from 1.0 toward 0.5; continuing past 0.2 triggers `over_evaporation` (medium).
- Cooling: a "Fast cool" action before natural cooling completes triggers `rapid_cooling` (low).
- Seed crystal optional: if added → `crystal_quality = 100`; otherwise 70 with note.
- Grade computed from `100 − Σ penalties` mapped to A/B/C/D/F like other labs.

### Visual (NaClWorkspace.tsx)
- Bench backdrop matching existing labs.
- Beaker-1 with swirling cloudy solution while crushing/dissolving.
- Filtration column: funnel with filter paper, drips into Beaker-2; opacity of filtrate clears as filtration progresses.
- Heating setup: Bunsen flame SVG animation, rising steam particles, liquid level animates down with `volumeFrac`.
- Cooling stage: hot solution color fades; small cubic crystals appear and grow over time (SVG `<rect>` ghost cubes scaling up).
- Empty state hint identical to existing workspaces.

### Bilingual copy
All labels use the exact terminology from the spec (70% Bangla / 30% English term ratio): অবিশুদ্ধ লবণ, পাতিত পানি ($H_2O$), পরিশ্রুত দ্রবণ, সম্পৃক্ত দ্রবণ, বীজ কেলাস, নিয়তাকার ঘনকীয় জ্যামিতি, বুনসেন বার্নার, তারজালি.

### Out of scope (later phases)
- Database persistence of NaCl reports (Phase 3 auth/cloud sync).
- RAG "Ask from Book" coverage of crystallization chapter (Phase 2 ingestion).
- A standalone Viva mode for this experiment — current StudentViva/TeacherViva are generic; can be extended later.

### Verification
- Build passes (TypeScript strict).
- Manually exercise: pick experiment → drag all equipment → run correct flow → see crystals + A grade. Then run "skip filter" path → see high-severity mistake in report.
