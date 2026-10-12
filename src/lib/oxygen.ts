/**
 * Chemistry helpers for the laboratory preparation of oxygen gas.
 *   2 H2O2 (aq) --[MnO2]--> 2 H2O (l) + O2 (g)
 *
 * Pure functions only — no React, no DOM.
 */

export interface OxygenConfig {
  /** Concentration of H2O2 solution (%, w/w). Typical lab: 3–30%. */
  h2o2ConcPct: number;
  /** Volume of H2O2 solution poured (mL). */
  h2o2VolumeMl: number;
  /** Mass of MnO2 catalyst (g). */
  mno2MassG: number;
}

const H2O2_DENSITY_G_PER_ML = 1.0; // approximation for dilute solution
const H2O2_MOLAR_MASS = 34.0147;
const MOLAR_VOLUME_STP_ML = 22400; // 1 mol gas at STP

/** Theoretical maximum O2 producible from the given H2O2, in mL at STP. */
export function maxOxygenVolumeMl(cfg: OxygenConfig): number {
  const massH2O2 = cfg.h2o2VolumeMl * H2O2_DENSITY_G_PER_ML * (cfg.h2o2ConcPct / 100);
  const molesH2O2 = massH2O2 / H2O2_MOLAR_MASS;
  const molesO2 = molesH2O2 / 2;
  return molesO2 * MOLAR_VOLUME_STP_ML;
}

/**
 * Compute oxygen volume collected after `timeElapsedSec` seconds of reaction.
 * Uses a simple pseudo-first-order kinetic model where the catalyst mass
 * scales the rate constant (saturating at ~2 g).
 */
export function computeOxygenGeneration(args: { cfg: OxygenConfig; timeElapsedSec: number }): {
  totalMaxMl: number;
  collectedMl: number;
  rateMlPerSec: number;
} {
  const totalMax = maxOxygenVolumeMl(args.cfg);
  const catalystFactor = Math.min(args.cfg.mno2MassG, 2) / 2; // 0..1
  // Pseudo first-order rate constant (1/s). Tuned for ~30–60 s to fill a 100 mL tube.
  const k = 0.05 * (0.2 + 0.8 * catalystFactor);
  const collected = totalMax * (1 - Math.exp(-k * args.timeElapsedSec));
  const remaining = totalMax - collected;
  const rate = k * remaining;
  return { totalMaxMl: totalMax, collectedMl: collected, rateMlPerSec: rate };
}

/** Water level remaining inside the inverted collection tube (0..100 %). */
export function waterLevelPercent(collectedMl: number, tubeCapacityMl: number): number {
  if (tubeCapacityMl <= 0) return 100;
  const filled = Math.min(100, (collectedMl / tubeCapacityMl) * 100);
  return Math.max(0, 100 - filled);
}

export function oxygenGrade(args: {
  collectedMl: number;
  targetMl: number;
  highMistakes: number;
  splint: "pass" | "early" | "none";
}): { accuracy: number; grade: "A" | "B" | "C" | "D" | "F" } {
  const ratio = args.targetMl > 0 ? Math.min(1, args.collectedMl / args.targetMl) : 0;
  let acc = ratio * 100 - 5 * args.highMistakes;
  if (args.splint === "pass") acc += 0;
  else if (args.splint === "early") acc -= 5;
  else acc -= 10;
  acc = Math.max(0, Math.min(100, acc));
  const grade = acc >= 90 ? "A" : acc >= 80 ? "B" : acc >= 70 ? "C" : acc >= 60 ? "D" : "F";
  return { accuracy: acc, grade };
}
