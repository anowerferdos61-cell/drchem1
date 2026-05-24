/**
 * Pure simulation logic for the "Properties of Ionic & Covalent Compounds
 * + Electrolysis of CuSO₄" experiment (Class 9–10, Bangladesh NCTB).
 *
 * 4 stages — each scored 0..25 toward the 100-pt total:
 *   1. Solubility test       (25)
 *   2. Conductivity test     (25)
 *   3. Melting-point test    (25)
 *   4. Electrolysis of CuSO₄ (25)
 */

import type { IonicSubstance } from "@/components/lab/types";

/** Ground truth: which substance dissolves in water (clear solution)? */
export const SOLUBILITY_TRUTH: Record<IonicSubstance, "dissolved" | "insoluble"> = {
  nacl: "dissolved",
  sugar: "dissolved",
  cuso4: "dissolved",
  naphthalene: "insoluble",
};

/** Ground truth: which aqueous solution lights the bulb (has free ions)? */
export const CONDUCTIVITY_TRUTH: Record<IonicSubstance, "on" | "off"> = {
  nacl: "on",
  cuso4: "on",
  sugar: "off",
  naphthalene: "off",
};

/** Ground truth: which melt easily over a Bunsen flame? */
export const MELTING_TRUTH: Record<IonicSubstance, "melted" | "solid" | "vaporized"> = {
  sugar: "melted",
  naphthalene: "vaporized", // sublimes / volatilises rapidly
  nacl: "solid",
  cuso4: "solid",
};

export const LABELS: Record<IonicSubstance, { en: string; bn: string }> = {
  nacl: { en: "NaCl", bn: "সোডিয়াম ক্লোরাইড" },
  sugar: { en: "Sugar", bn: "চিনি" },
  naphthalene: { en: "Naphthalene", bn: "ন্যাপথালিন" },
  cuso4: { en: "CuSO₄", bn: "কপার সালফেট" },
};

export interface IonicGradeInput {
  solubility: Record<IonicSubstance, "dissolved" | "insoluble" | null>;
  conductivity: Record<IonicSubstance, "on" | "off" | null>;
  melting: Record<IonicSubstance, "melted" | "solid" | "vaporized" | null>;
  copperDeposit: number; // 0..1
  polarityCorrect: boolean;
  electrolysisRun: boolean;
  highMistakes: number;
  medMistakes: number;
  lowMistakes: number;
}

export interface IonicGradeOutput {
  accuracy: number;
  grade: "A" | "B" | "C" | "D" | "F";
  solubilityScore: number;
  conductivityScore: number;
  meltingScore: number;
  electrolysisScore: number;
}

function scoreMatch<T extends string>(
  truth: Record<IonicSubstance, T>,
  observed: Record<IonicSubstance, T | null>,
): number {
  const keys = Object.keys(truth) as IonicSubstance[];
  let correct = 0;
  let tested = 0;
  for (const k of keys) {
    if (observed[k] !== null) {
      tested++;
      if (observed[k] === truth[k]) correct++;
    }
  }
  // 25 points; partial credit by tested substances
  if (tested === 0) return 0;
  return Math.round((correct / keys.length) * 25);
}

export function gradeIonic(input: IonicGradeInput): IonicGradeOutput {
  const solubilityScore = scoreMatch(SOLUBILITY_TRUTH, input.solubility);
  const conductivityScore = scoreMatch(CONDUCTIVITY_TRUTH, input.conductivity);
  const meltingScore = scoreMatch(MELTING_TRUTH, input.melting);

  let electrolysisScore = 0;
  if (input.electrolysisRun) {
    electrolysisScore += 10;
    if (input.polarityCorrect) electrolysisScore += 7;
    electrolysisScore += Math.round(input.copperDeposit * 8);
  }
  electrolysisScore = Math.min(25, electrolysisScore);

  let acc = solubilityScore + conductivityScore + meltingScore + electrolysisScore;
  acc -= 5 * input.highMistakes;
  acc -= 3 * input.medMistakes;
  acc -= 1 * input.lowMistakes;
  acc = Math.max(0, Math.min(100, acc));

  const grade =
    acc >= 90 ? "A" : acc >= 75 ? "B" : acc >= 60 ? "C" : acc >= 45 ? "D" : "F";

  return {
    accuracy: acc,
    grade,
    solubilityScore,
    conductivityScore,
    meltingScore,
    electrolysisScore,
  };
}
