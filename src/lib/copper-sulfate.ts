/**
 * Pure simulation logic for "Determination of Crystallization Water in CuSO4·5H2O".
 *
 * Theory:
 *   M(CuSO4·5H2O) = 249.5 g/mol
 *   M(CuSO4)      = 159.5 g/mol
 *   M(5H2O)       = 90.0  g/mol
 *   Theoretical water % = 90.0 / 249.5 × 100 = 36.07 %
 *
 * Anhydrous fraction by mass = 159.5 / 249.5 = 0.63928
 * Water    fraction by mass =  90.0 / 249.5 = 0.36072
 */

export const M_HYDRATED = 249.5;
export const M_ANHYDROUS = 159.5;
export const M_WATER = 90.0;
export const THEORETICAL_WATER_PCT = (M_WATER / M_HYDRATED) * 100; // 36.07
export const ANHYDROUS_FRACTION = M_ANHYDROUS / M_HYDRATED;       // 0.6393
export const WATER_FRACTION = M_WATER / M_HYDRATED;               // 0.3607

export const HEATING_TIME_FOR_FULL_DEHYDRATION = 35; // seconds
export const TOLERANCE_PCT = 1.5;

/** Slightly randomized empty crucible mass around 20 g. */
export function randomCrucibleMass(): number {
  return 19.8 + Math.random() * 0.5; // 19.8 – 20.3
}

/** Dehydration fraction (0..1) given accumulated heating seconds. */
export function dehydrationFromHeating(heatingTime: number): number {
  const f = heatingTime / HEATING_TIME_FOR_FULL_DEHYDRATION;
  return Math.max(0, Math.min(1, f));
}

/** Compute crucible-with-anhydrous mass z given inputs. */
export function computeAnhydrousMass(
  x: number,
  hydratedSampleMass: number,
  dehydrationFraction: number,
): number {
  // water lost = sample × WATER_FRACTION × fraction
  const waterLost = hydratedSampleMass * WATER_FRACTION * dehydrationFraction;
  return x + hydratedSampleMass - waterLost;
}

/** Crystallization water % using x, y, z. */
export function computeWaterPct(x: number, y: number, z: number): number {
  if (y - x <= 0) return 0;
  return ((y - z) / (y - x)) * 100;
}

export type ColorState = "blue" | "paleblue" | "white";

export function colorFromFraction(f: number): ColorState {
  if (f < 0.3) return "blue";
  if (f < 0.85) return "paleblue";
  return "white";
}

export interface CuSO4GradeInput {
  x: number;
  y: number;
  z: number;
  weighedHot: boolean;
  spilled: boolean;
  highMistakes: number;
  medMistakes: number;
  lowMistakes: number;
}

export interface CuSO4GradeOutput {
  waterPct: number;
  errorPct: number; // |waterPct - 36.07|
  accuracy: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export function gradeCuSO4(input: CuSO4GradeInput): CuSO4GradeOutput {
  // Hot-weigh artifact: simulate ~0.05g convection-induced under-read.
  const zEffective = input.weighedHot ? input.z - 0.05 : input.z;
  const waterPct = computeWaterPct(input.x, input.y, zEffective);
  const errorPct = Math.abs(waterPct - THEORETICAL_WATER_PCT);

  let acc = 100;
  if (errorPct > TOLERANCE_PCT) {
    acc -= Math.min(40, Math.round((errorPct - TOLERANCE_PCT) * 8));
  }
  acc -= 18 * input.highMistakes;
  acc -= 8 * input.medMistakes;
  acc -= 3 * input.lowMistakes;
  if (input.spilled) acc -= 10;
  acc = Math.max(0, Math.min(100, acc));

  const grade =
    acc >= 90 ? "A" : acc >= 80 ? "B" : acc >= 70 ? "C" : acc >= 60 ? "D" : "F";

  return { waterPct, errorPct, accuracy: acc, grade };
}
