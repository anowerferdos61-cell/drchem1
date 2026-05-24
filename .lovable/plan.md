## New Experiment: Ionic vs Covalent Properties & Electrolysis

Add a 5th experiment `ionic_covalent` alongside titration / O₂ / CO₂ / NaCl, following the same architecture.

### Scope
- ID: `ionic_covalent`
- 4 stages in one experiment: Solubility → Conductivity → Melting Point → Electrolysis of CuSO₄
- Same UX pattern as other labs (equipment panel, steps, status, mistake tracking, report, AI Viva, Dr. Chem assistant context)

### Files to create
1. **`src/lib/ionic.ts`** — pure simulation engine
   - State: per-substance results for solubility/conductivity/melting (NaCl, Sugar, Naphthalene, CuSO₄)
   - Electrolysis substate: battery connected, polarity correct, current flowing, Cu deposited at cathode, O₂/anode dissolution
   - Mistake detection: `naphthalene_overheated` (high), `conductivity_solid_salt` (med), `reversed_electrodes` (low)
   - Grading: 100 − Σ penalties; bonus for completing all 4 stages correctly
2. **`src/components/lab/workspaces/IonicWorkspace.tsx`** — 2D SVG scene
   - Stage 1: 4 beakers with water + each substance, animated dissolution / cloudy naphthalene
   - Stage 2: Simple circuit SVG (battery, bulb, two electrodes dipped into selected beaker) — bulb glows when ions present
   - Stage 3: Test tube / spatula over Bunsen flame; sugar/naphthalene melt animation, NaCl/CuSO₄ stay solid
   - Stage 4: Electrolysis cell with CuSO₄ (blue), 2 electrodes, battery; animated Cu² ⁺ migration, copper deposit grows on cathode, bubbles at anode
3. **`src/components/lab/IonicLab.tsx`** — orchestrator mirroring `NaClLab.tsx` (equipment/steps/status/report/AI assistant/AI Viva toggle)

### Files to edit
- **`src/components/lab/types.ts`**
  - Extend `ExperimentId` with `"ionic_covalent"`
  - New `EquipmentId`s: `nacl_solid`, `sugar`, `naphthalene`, `cuso4_solid`, `water_bottle`, `test_beaker`, `battery`, `bulb`, `wires`, `carbon_electrode`, `copper_electrode`, `electrolysis_cell`, `spatula`
  - New `IonicPlaced` interface with per-stage flags
  - New `MistakeType`s: `naphthalene_overheated` (high), `conductivity_solid_salt` (med), `reversed_electrodes` (low)
  - Extend `Report` with `solubilityScore?`, `conductivityScore?`, `meltingScore?`, `electrolysisScore?`
- **`src/components/lab/ExperimentPicker.tsx`** — add 5th card (bilingual title, FlaskConical/Zap icon)
- **`src/components/lab/Dashboard.tsx`** — bump experiment count to 5
- **`src/components/lab/EquipmentPanel.tsx`** — register new equipment with bilingual labels grouped under `ionic_covalent`
- **`src/components/lab/LabReport.tsx`** — show 4 sub-scores and any flagged mistakes
- **`src/components/lab/LabAIAssistant.tsx`** — branch for `ionic_covalent` system prompt (the full Dr. Chem persona from spec)
- **`src/lib/chat.functions.ts`** — add experiment name mapping for `ionic_covalent`
- **`src/lib/viva.functions.ts`** — add `"ionic_covalent"` to enum and `experimentContext` with the 4 core viva questions from spec
- **`src/routes/index.tsx`** — route new ID to `<IonicLab />`

### Bilingual copy (70/30)
আয়নিক যৌগ, সমযোজী যৌগ, দ্রবণীয়তা, তড়িৎ পরিবাহিতা, গলনাঙ্ক, তড়িৎ বিশ্লেষণ, অ্যানোড, ক্যাথোড, ন্যাপথালিন, কপার সালফেট ($CuSO_4$), মুক্ত আয়ন, তড়িৎদ্বার.

### Out of scope
- DB persistence (Phase 3)
- Real chemistry video / RAG book lookup
- Multi-user classroom mode beyond existing AI Viva

### Verification
- TS build passes
- Pick experiment → run all 4 stages correctly → grade A with bulb on for ionic only, Cu deposit visible
- Run "test solid NaCl conductivity" → medium mistake flagged
- AI Viva button publishes 4+ questions from the core bank
