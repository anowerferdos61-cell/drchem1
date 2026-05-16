# Plan: Experiment 2 — Preparation of Oxygen Gas

Extend the Virtual Chemistry Lab to support multiple experiments without breaking the existing Titration flow. Add Oxygen Preparation (2H₂O₂ →[MnO₂] 2H₂O + O₂) as the second experiment, with its own SVG scene, equipment, steps, mistakes, config, status, and viva context.

---

## 1. Architecture: multi-experiment shell

**New file: `src/lib/experiments/registry.ts`**
- Define `ExperimentId = "titration" | "oxygen_prep"`.
- Export an `EXPERIMENTS` registry with metadata per experiment: `id`, `title` (bilingual), `description`, `icon`, `equipmentIds[]`, `stepsTemplate`, default config.
- This becomes the single source of truth so adding Experiment 3 later is a one-file change.

**`src/components/lab/types.ts`**
- Extend `EquipmentId` union with: `test_tube_reaction`, `delivery_tube`, `water_trough`, `test_tube_collection`, `hydrogen_peroxide`, `manganese_dioxide`, `glowing_splint`.
- Extend `MistakeType` with: `no_manganese_dioxide`, `missing_delivery_tube`, `early_splint_test`.
- Make `Placed` a discriminated record keyed per experiment, or split into `TitrationPlaced` and `OxygenPlaced` and use `Placed = TitrationPlaced | OxygenPlaced`.
- Add `ExperimentId` re-export.

**`src/routes/index.tsx`**
- Add `activeExperiment` state (default `"titration"`, persisted to `localStorage`).
- Add an **Experiment Picker**: shown on first load as a centered card grid (2 cards with icon + bilingual title + short description). Also accessible later via a "Change Experiment · এক্সপেরিমেন্ট পরিবর্তন" button in the header.
- When `activeExperiment` changes: reset `placed`, `steps`, `mistakes`, `Vb/VO2`, `published` viva state. Wire the new experiment's defaults from the registry.
- Conditionally render `<TitrationWorkspace>` vs `<OxygenWorkspace>` (split out of current `LabWorkspace`).

## 2. Chemistry engine

**`src/lib/chemistry.ts`** — add (do not touch existing titration helpers):
- `computeOxygenGeneration({ h2o2ConcPct, h2o2VolumeMl, mno2MassG, timeElapsedSec })` returning `{ totalMolesO2, rateMolPerSec, volumeMlAtSTP }`.
  - Moles H₂O₂ = (volume_mL × density × conc%/100) / 34.
  - Theoretical O₂ moles = molesH₂O₂ / 2; volume at STP = moles × 22400 mL.
  - Rate: first-order approximation `k = k0 × min(mno2Mass, saturation)`, then `dV/dt = k × remainingMoles × 22400`.
- `waterLevelPercent(VO2_collected_mL, tubeCapacity_mL)` → returns 100 − min(100, V/cap×100).

## 3. Workspace split

**Refactor** `src/components/lab/LabWorkspace.tsx` into:
- `src/components/lab/workspaces/TitrationWorkspace.tsx` — current SVG, unchanged.
- `src/components/lab/workspaces/OxygenWorkspace.tsx` — new SVG (viewBox 600×560).
- `src/components/lab/LabWorkspace.tsx` becomes a thin switcher on `activeExperiment`.

**Oxygen SVG scene:**
- Left: retort stand + clamp holding a vertical reaction test tube (or Erlenmeyer flask) with black `MnO₂` pellets at bottom.
- Curved glass delivery tube arcing right and down into a water trough (light-blue water with subtle wave).
- Inverted collection test tube standing inside the trough, initially full of water.
- Animations:
  - Bubbles inside reaction tube when H₂O₂ added (SVG `<circle>` + `animate cy` loop, opacity fade).
  - Bubbles travel up the delivery tube path (`animateMotion` on a path).
  - Bubbles emerge inside inverted tube; water level inside the tube drops with `VO2` (animated `<rect>` height + Y).
  - Glowing splint: draggable element (HTML overlay using pointer events, or SVG `<g>` with onPointerDown). When dropped near the inverted tube mouth AND `VO2 ≥ threshold`, splint bursts into a bright flame (radial-gradient flame `<path>` + scale pulse). If dropped early, fires `early_splint_test` mistake.

## 4. Panels

**`ConfigPanel.tsx`**: switch field set by `activeExperiment`.
- Titration: existing Ma/Va/Mb.
- Oxygen: `h2o2ConcPct`, `h2o2VolumeMl`, `mno2MassG`. Validate >0, conc 0–50.

**`EquipmentPanel.tsx`**: accept `items: EquipmentItem[]` prop and render from the registry instead of the hardcoded `ITEMS`.

**`StatusPanel.tsx`**: render different live blocks per experiment.
- Titration: Vb / pH / Ve (current).
- Oxygen: Reaction Rate (mL/s), O₂ Collected (mL), Water Level (%), with `<Progress>` for fill.

**`StepsPanel.tsx`**: already generic — just feed it the experiment-specific steps. Keep student-mode hide rule.

## 5. Mistake detection

In `src/routes/index.tsx` (or a small `useOxygenMachine` hook in `src/lib/experiments/oxygen.ts`):
- Adding H₂O₂ while `placed.manganese_dioxide === false` → log `no_manganese_dioxide` (high).
- Reaction running while `placed.delivery_tube === false` → log `missing_delivery_tube` (high), bubbles vent at flask mouth.
- Splint dropped on tube while `VO2 < 0.6 × tubeCapacity` → log `early_splint_test` (med), splint dims instead of igniting.

## 6. AI Viva

**`src/lib/viva.functions.ts`**:
- Add `experiment: ExperimentId` to the `generateViva` input schema.
- Branch the prompt: for `oxygen_prep`, instruct the model to ask high-school level questions on H₂O₂ decomposition, role of MnO₂ as catalyst, properties of O₂ (colorless, supports combustion), collection by downward displacement of water, glowing splint test, and safety (eye protection, no open flame near H₂O₂).
- `TeacherViva.tsx` & `StudentViva.tsx`: pass current `activeExperiment` through.

## 7. Lab Report

**`LabReport.tsx`**: branch render on experiment.
- Oxygen metrics: target O₂ volume vs collected, time taken, splint-test result (pass/early/none), mistakes list, grade based on (collected/target × 100) − 5 × highMistakes.

## 8. Persistence & reset

- `localStorage` keys: `lab:activeExperiment`, `titration:config`, `oxygen:config`.
- "Change Experiment" prompts a confirm dialog if a run is in progress.

---

## Technical notes

- **No new dependencies**; everything is SVG + existing shadcn primitives.
- **File additions:**
  - `src/lib/experiments/registry.ts`
  - `src/lib/experiments/oxygen.ts` (state machine + mistake rules)
  - `src/components/lab/workspaces/TitrationWorkspace.tsx` (extracted)
  - `src/components/lab/workspaces/OxygenWorkspace.tsx`
  - `src/components/lab/ExperimentPicker.tsx`
- **File edits:**
  - `src/components/lab/types.ts`, `LabWorkspace.tsx`, `ConfigPanel.tsx`, `EquipmentPanel.tsx`, `StatusPanel.tsx`, `LabReport.tsx`
  - `src/lib/chemistry.ts`, `src/lib/viva.functions.ts`
  - `src/routes/index.tsx`
- **Backwards compatibility:** all existing titration code paths remain; new code is additive and gated on `activeExperiment`.
- **Bilingual labels** maintained throughout ("English · বাংলা").

Confirm and I'll implement.
