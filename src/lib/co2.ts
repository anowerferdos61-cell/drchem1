/**
 * Chemistry helpers for the laboratory preparation of carbon dioxide gas.
 *   CaCO3 (s) + 2 HCl (aq) --> CaCl2 (aq) + H2O (l) + CO2 (g)
 *
 * Pure functions only — no React, no DOM.
 */

export interface CO2Config {
  /** Mass of CaCO3 chips loaded into the round-bottom flask (g). */
  caco3MassG: number;
  /** Concentration of dilute HCl (mol/L). Typical lab: 1–3 M. */
  hclConcM: number;
  /** Volume of HCl poured through the thistle funnel (mL). */
  hclVolumeMl: number;
}

const CACO3_MOLAR_MASS = 100.09;
const MOLAR_VOLUME_STP_ML = 22400; // 1 mol gas at STP

/** Theoretical maximum CO2 producible from the supplied reagents (mL at STP). */
export function maxCO2VolumeMl(cfg: CO2Config): number {
  const molesCaCO3 = cfg.caco3MassG / CACO3_MOLAR_MASS;
  const molesHCl = (cfg.hclConcM * cfg.hclVolumeMl) / 1000;
  // CaCO3 + 2 HCl ⇒ moles CO2 = min(molesCaCO3, molesHCl / 2)
  const molesCO2 = Math.max(0, Math.min(molesCaCO3, molesHCl / 2));
  return molesCO2 * MOLAR_VOLUME_STP_ML;
}

/**
 * Pseudo first-order kinetic model for CO2 evolution as a function of
 * elapsed reaction time. Tuned so that a typical 0.5 g CaCO3 + 2 M HCl run
 * fills a ~250 mL gas jar in ~30–60 s.
 */
export function computeCO2Generation(args: {
  cfg: CO2Config;
  timeElapsedSec: number;
}): { totalMaxMl: number; generatedMl: number; rateMlPerSec: number } {
  const totalMax = maxCO2VolumeMl(args.cfg);
  // Surface-area & acidity factor — saturates at 2 M / 1 g.
  const acidFactor = Math.min(args.cfg.hclConcM, 4) / 4;
  const massFactor = Math.min(args.cfg.caco3MassG, 2) / 2;
  const k = 0.06 * (0.25 + 0.75 * acidFactor) * (0.4 + 0.6 * massFactor);
  const generated = totalMax * (1 - Math.exp(-k * args.timeElapsedSec));
  const remaining = totalMax - generated;
  const rate = k * remaining;
  return { totalMaxMl: totalMax, generatedMl: generated, rateMlPerSec: rate };
}

/**
 * The portion of generated CO2 that actually reaches the gas jar. If the
 * thistle funnel tip is not submerged or the flask is uncorked, gas escapes
 * upstream and only a small fraction is collected.
 */
export function collectionEfficiency(args: {
  corkClosed: boolean;
  funnelSubmerged: boolean;
  usingUpwardDisplacement: boolean;
}): number {
  let eff = 1;
  if (!args.corkClosed) eff *= 0.05;
  if (!args.funnelSubmerged) eff *= 0.15;
  // CO2 is heavier than air → must be collected by UPWARD displacement of air
  // (gas jar mouth upright). Downward displacement just lets the dense gas
  // spill back out.
  if (!args.usingUpwardDisplacement) eff *= 0.2;
  return eff;
}

/** Limewater (Ca(OH)2) state for the identification test. */
export type LimewaterPhase = "clear" | "milky" | "redissolved";
export function limewaterPhase(co2PassedMl: number): LimewaterPhase {
  // Arbitrary thresholds tuned for a satisfying visual.
  if (co2PassedMl < 5) return "clear";
  if (co2PassedMl < 80) return "milky";
  return "redissolved"; // excess CO2 → Ca(HCO3)2 clear solution
}

export function co2Grade(args: {
  collectedMl: number;
  targetMl: number;
  highMistakes: number;
  tests: { limewater: boolean; burning_splint: boolean; litmus: boolean; magnesium: boolean };
}): { accuracy: number; grade: "A" | "B" | "C" | "D" | "F" } {
  const ratio = args.targetMl > 0 ? Math.min(1, args.collectedMl / args.targetMl) : 0;
  const passedTests = Object.values(args.tests).filter(Boolean).length;
  let acc = ratio * 60 + passedTests * 10 - 6 * args.highMistakes;
  acc = Math.max(0, Math.min(100, acc));
  const grade =
    acc >= 90 ? "A" : acc >= 80 ? "B" : acc >= 70 ? "C" : acc >= 60 ? "D" : "F";
  return { accuracy: acc, grade };
}
