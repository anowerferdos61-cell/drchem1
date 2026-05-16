// Pure chemistry helpers for strong acid – strong base titration (HCl + NaOH).

export interface TitrationConfig {
  /** Acid molarity (mol/L) */
  Ma: number;
  /** Acid volume in flask (mL) */
  Va: number;
  /** Base molarity (mol/L, in burette) */
  Mb: number;
}

export interface TitrationState extends TitrationConfig {
  /** Base volume dispensed (mL) */
  Vb: number;
}

/** Equivalence point base volume (mL). */
export function equivalenceVolume({ Ma, Va, Mb }: TitrationConfig): number {
  if (Mb <= 0) return 0;
  return (Ma * Va) / Mb;
}

/** Moles of acid initially present. */
export function molesAcid({ Ma, Va }: { Ma: number; Va: number }): number {
  return (Ma * Va) / 1000;
}

/** Moles of base dispensed so far. */
export function molesBase({ Mb, Vb }: { Mb: number; Vb: number }): number {
  return (Mb * Vb) / 1000;
}

/** pH for a strong acid / strong base titration. */
export function computePH({ Ma, Va, Mb, Vb }: TitrationState): number {
  const nA = molesAcid({ Ma, Va });
  const nB = molesBase({ Mb, Vb });
  const totalL = (Va + Vb) / 1000;
  if (totalL <= 0) return 7;

  const diff = nA - nB;
  if (Math.abs(diff) < 1e-9) return 7;

  if (diff > 0) {
    const H = diff / totalL;
    return -Math.log10(Math.max(H, 1e-14));
  }
  const OH = -diff / totalL;
  const pOH = -Math.log10(Math.max(OH, 1e-14));
  return 14 - pOH;
}

/**
 * Phenolphthalein color as 0-255 RGB.
 * Clear below ~8.2, faint pink 8.2–10, vivid magenta above.
 */
export function solutionColor(pH: number): { r: number; g: number; b: number; a: number } {
  if (pH < 8.2) return { r: 235, g: 245, b: 250, a: 0.25 };
  if (pH < 10) {
    const t = (pH - 8.2) / 1.8;
    return {
      r: Math.round(235 - t * 20),
      g: Math.round(245 - t * 160),
      b: Math.round(250 - t * 130),
      a: 0.55 + t * 0.3,
    };
  }
  return { r: 215, g: 60, b: 140, a: 0.9 };
}

export function grade(accuracyPct: number): "A" | "B" | "C" | "D" | "F" {
  if (accuracyPct >= 95) return "A";
  if (accuracyPct >= 85) return "B";
  if (accuracyPct >= 75) return "C";
  if (accuracyPct >= 65) return "D";
  return "F";
}
