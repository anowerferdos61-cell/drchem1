/**
 * Pure simulation logic for "Preparation of Pure NaCl Crystals
 * from Impure Salt" (Class 9–10, Bangladesh NCTB).
 *
 * Workflow milestones (volumeFrac is fraction of original filtrate remaining):
 *   - dissolve   → 1.00
 *   - heat       → 1.00 → 0.50 (saturation point)
 *   - over-evap  → < 0.20  (mistake)
 *   - cool       → temperature 100 °C → 25 °C (room)
 *   - seeded     → optional; if yes → 100% cubic geometry
 *
 * No React, no DOM.
 */

export interface NaClConfig {
  /** Mass of impure salt taken, grams (target 20–25 g). */
  saltMassG: number;
  /** Volume of distilled water, mL (target 100). */
  waterMl: number;
}

/** Saturation point — volume reduced to ~50% of original filtrate. */
export const SATURATION_FRAC = 0.5;
/** Over-evaporation threshold — going below this destroys cubic geometry. */
export const OVER_EVAP_FRAC = 0.2;
/** Room temperature in °C. */
export const ROOM_TEMP = 25;
/** Boiling temperature in °C. */
export const BOIL_TEMP = 100;

/**
 * Reduce filtrate volume while burner is on.
 * Returns the next volumeFrac (clamped to ≥ 0.05).
 */
export function tickEvaporation(volumeFrac: number, dt: number): number {
  // ~50 s to go from 1.0 to 0.5; matches a normal classroom demo speed.
  const rate = 0.01; // per second
  return Math.max(0.05, volumeFrac - rate * dt);
}

/**
 * Natural cooling — exponential decay toward room temperature.
 * "Fast cool" applies a much larger k.
 */
export function tickCooling(
  tempC: number,
  dt: number,
  fast: boolean,
): number {
  const k = fast ? 0.6 : 0.06;
  const next = ROOM_TEMP + (tempC - ROOM_TEMP) * Math.exp(-k * dt);
  return next;
}

export interface NaClGradeInput {
  filtered: boolean;
  reachedSaturation: boolean;
  overEvaporated: boolean;
  rapidCooled: boolean;
  seeded: boolean;
  highMistakes: number;
  medMistakes: number;
  lowMistakes: number;
}

export interface NaClGradeOutput {
  accuracy: number;
  grade: "A" | "B" | "C" | "D" | "F";
  crystalQuality: number;
}

/**
 * Grade rubric (out of 100):
 *   base 100
 *   −30 unfiltered heating
 *   −15 over-evaporation
 *   −10 rapid cooling
 *   −5  missing seed crystal
 *   −5  for every other high mistake
 *   −3  for every med mistake
 *   −1  for every low mistake
 *
 * Crystal geometry quality:
 *   100 if filtered + saturated + slow-cooled + seeded
 *   −20 each missing best-practice
 */
export function gradeNaCl(input: NaClGradeInput): NaClGradeOutput {
  let acc = 100;
  if (!input.filtered) acc -= 30;
  if (input.overEvaporated) acc -= 15;
  if (input.rapidCooled) acc -= 10;
  if (!input.seeded) acc -= 5;
  acc -= 5 * Math.max(0, input.highMistakes - (input.filtered ? 0 : 1));
  acc -= 3 * input.medMistakes;
  acc -= 1 * input.lowMistakes;
  acc = Math.max(0, Math.min(100, acc));

  let quality = 100;
  if (!input.filtered) quality -= 30;
  if (!input.reachedSaturation) quality -= 20;
  if (input.overEvaporated) quality -= 25;
  if (input.rapidCooled) quality -= 20;
  if (!input.seeded) quality -= 15;
  quality = Math.max(0, Math.min(100, quality));

  const grade =
    acc >= 90 ? "A" : acc >= 80 ? "B" : acc >= 70 ? "C" : acc >= 60 ? "D" : "F";

  return { accuracy: acc, grade, crystalQuality: quality };
}
