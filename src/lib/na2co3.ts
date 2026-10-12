/**
 * Pure simulation logic for "Preparation of 0.1 M Na2CO3 Standard Solution" (250 mL).
 *
 * Target: W = (S × M × V) / 1000 = (0.1 × 106 × 250) / 1000 = 2.650 g
 * Actual molarity: S = (1000 × W_actual) / (106 × V_actual)
 */

export const TARGET_MASS_G = 2.65;
export const TARGET_VOLUME_ML = 250;
export const MOLAR_MASS = 106; // g/mol Na2CO3
export const TARGET_MOLARITY = 0.1; // M
export const MASS_TOLERANCE_G = 0.05;
export const VOLUME_TOLERANCE_ML = 1.0;
export const OVERFILL_LIMIT_ML = 252; // beyond this → ruined

/** Theoretical mass required for a desired molarity / volume (mL). */
export function theoreticalMass(molarity = TARGET_MOLARITY, volumeMl = TARGET_VOLUME_ML): number {
  return (molarity * MOLAR_MASS * volumeMl) / 1000;
}

/** Final molarity given actual mass (g) and actual volume (mL). */
export function computeMolarity(massG: number, volumeMl: number): number {
  if (volumeMl <= 0) return 0;
  return (1000 * massG) / (MOLAR_MASS * volumeMl);
}

/** Slightly randomized watch-glass tare mass (~26.0 g). */
export function randomWatchGlassMass(): number {
  return 26 + (Math.random() * 0.2 - 0.1) + Math.random() * 0.05;
}

export interface Na2CO3GradeInput {
  actualMassG: number;
  actualVolumeMl: number;
  tared: boolean;
  funnelUsed: boolean;
  washedDown: boolean;
  shakenEarly: boolean;
  overFilled: boolean;
  highMistakes: number;
  medMistakes: number;
  lowMistakes: number;
}

export interface Na2CO3GradeOutput {
  accuracy: number;
  grade: "A" | "B" | "C" | "D" | "F";
  massError: number;
  volumeError: number;
  finalMolarity: number;
  molarityErrorPct: number;
}

export function gradeNa2CO3(input: Na2CO3GradeInput): Na2CO3GradeOutput {
  const massError = Math.abs(input.actualMassG - TARGET_MASS_G);
  const volumeError = Math.abs(input.actualVolumeMl - TARGET_VOLUME_ML);
  const finalMolarity = computeMolarity(
    input.actualMassG,
    input.actualVolumeMl || TARGET_VOLUME_ML,
  );
  const molarityErrorPct = Math.abs((finalMolarity - TARGET_MOLARITY) / TARGET_MOLARITY) * 100;

  let acc = 100;
  // Mass accuracy: lose 1 pt per 0.01 g beyond tolerance, max -25
  if (massError > MASS_TOLERANCE_G) {
    acc -= Math.min(25, Math.round((massError - MASS_TOLERANCE_G) * 100));
  }
  // Volume accuracy: lose 2 pt per mL beyond tolerance, max -25
  if (volumeError > VOLUME_TOLERANCE_ML) {
    acc -= Math.min(25, Math.round((volumeError - VOLUME_TOLERANCE_ML) * 2));
  }
  if (input.overFilled) acc -= 25;
  acc -= 15 * input.highMistakes;
  acc -= 8 * input.medMistakes;
  acc -= 3 * input.lowMistakes;
  acc = Math.max(0, Math.min(100, acc));

  const grade = acc >= 90 ? "A" : acc >= 80 ? "B" : acc >= 70 ? "C" : acc >= 60 ? "D" : "F";

  return { accuracy: acc, grade, massError, volumeError, finalMolarity, molarityErrorPct };
}
