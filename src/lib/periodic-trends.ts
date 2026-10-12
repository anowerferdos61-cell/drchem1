/**
 * Periodic property data for first 20 elements (H → Ca).
 * Values:
 *  - radius: empirical atomic radius (pm)
 *  - ie: 1st ionization energy (kJ/mol)
 *  - ea: electron affinity (kJ/mol, positive = energy released)
 *  - en: Pauling electronegativity (—)
 */
export type TrendKey = "radius" | "ie" | "ea" | "en";

export type TrendElement = {
  Z: number;
  symbol: string;
  name: string;
  nameBn: string;
  group: number;
  period: number;
  shells: number[];
  radius: number; // pm
  ie: number; // kJ/mol
  ea: number; // kJ/mol
  en: number; // Pauling
};

export const TREND_ELEMENTS: TrendElement[] = [
  {
    Z: 1,
    symbol: "H",
    name: "Hydrogen",
    nameBn: "হাইড্রোজেন",
    group: 1,
    period: 1,
    shells: [1],
    radius: 53,
    ie: 1312,
    ea: 73,
    en: 2.2,
  },
  {
    Z: 2,
    symbol: "He",
    name: "Helium",
    nameBn: "হিলিয়াম",
    group: 18,
    period: 1,
    shells: [2],
    radius: 31,
    ie: 2372,
    ea: 0,
    en: 0.0,
  },
  {
    Z: 3,
    symbol: "Li",
    name: "Lithium",
    nameBn: "লিথিয়াম",
    group: 1,
    period: 2,
    shells: [2, 1],
    radius: 167,
    ie: 520,
    ea: 60,
    en: 0.98,
  },
  {
    Z: 4,
    symbol: "Be",
    name: "Beryllium",
    nameBn: "বেরিলিয়াম",
    group: 2,
    period: 2,
    shells: [2, 2],
    radius: 112,
    ie: 899,
    ea: 0,
    en: 1.57,
  },
  {
    Z: 5,
    symbol: "B",
    name: "Boron",
    nameBn: "বোরন",
    group: 13,
    period: 2,
    shells: [2, 3],
    radius: 87,
    ie: 801,
    ea: 27,
    en: 2.04,
  },
  {
    Z: 6,
    symbol: "C",
    name: "Carbon",
    nameBn: "কার্বন",
    group: 14,
    period: 2,
    shells: [2, 4],
    radius: 67,
    ie: 1086,
    ea: 122,
    en: 2.55,
  },
  {
    Z: 7,
    symbol: "N",
    name: "Nitrogen",
    nameBn: "নাইট্রোজেন",
    group: 15,
    period: 2,
    shells: [2, 5],
    radius: 56,
    ie: 1402,
    ea: -7,
    en: 3.04,
  },
  {
    Z: 8,
    symbol: "O",
    name: "Oxygen",
    nameBn: "অক্সিজেন",
    group: 16,
    period: 2,
    shells: [2, 6],
    radius: 48,
    ie: 1314,
    ea: 141,
    en: 3.44,
  },
  {
    Z: 9,
    symbol: "F",
    name: "Fluorine",
    nameBn: "ফ্লোরিন",
    group: 17,
    period: 2,
    shells: [2, 7],
    radius: 42,
    ie: 1681,
    ea: 328,
    en: 3.98,
  },
  {
    Z: 10,
    symbol: "Ne",
    name: "Neon",
    nameBn: "নিয়ন",
    group: 18,
    period: 2,
    shells: [2, 8],
    radius: 38,
    ie: 2081,
    ea: 0,
    en: 0.0,
  },
  {
    Z: 11,
    symbol: "Na",
    name: "Sodium",
    nameBn: "সোডিয়াম",
    group: 1,
    period: 3,
    shells: [2, 8, 1],
    radius: 190,
    ie: 496,
    ea: 53,
    en: 0.93,
  },
  {
    Z: 12,
    symbol: "Mg",
    name: "Magnesium",
    nameBn: "ম্যাগনেসিয়াম",
    group: 2,
    period: 3,
    shells: [2, 8, 2],
    radius: 145,
    ie: 738,
    ea: 0,
    en: 1.31,
  },
  {
    Z: 13,
    symbol: "Al",
    name: "Aluminium",
    nameBn: "অ্যালুমিনিয়াম",
    group: 13,
    period: 3,
    shells: [2, 8, 3],
    radius: 118,
    ie: 578,
    ea: 42,
    en: 1.61,
  },
  {
    Z: 14,
    symbol: "Si",
    name: "Silicon",
    nameBn: "সিলিকন",
    group: 14,
    period: 3,
    shells: [2, 8, 4],
    radius: 111,
    ie: 786,
    ea: 134,
    en: 1.9,
  },
  {
    Z: 15,
    symbol: "P",
    name: "Phosphorus",
    nameBn: "ফসফরাস",
    group: 15,
    period: 3,
    shells: [2, 8, 5],
    radius: 98,
    ie: 1012,
    ea: 72,
    en: 2.19,
  },
  {
    Z: 16,
    symbol: "S",
    name: "Sulfur",
    nameBn: "সালফার",
    group: 16,
    period: 3,
    shells: [2, 8, 6],
    radius: 88,
    ie: 1000,
    ea: 200,
    en: 2.58,
  },
  {
    Z: 17,
    symbol: "Cl",
    name: "Chlorine",
    nameBn: "ক্লোরিন",
    group: 17,
    period: 3,
    shells: [2, 8, 7],
    radius: 79,
    ie: 1251,
    ea: 349,
    en: 3.16,
  },
  {
    Z: 18,
    symbol: "Ar",
    name: "Argon",
    nameBn: "আর্গন",
    group: 18,
    period: 3,
    shells: [2, 8, 8],
    radius: 71,
    ie: 1521,
    ea: 0,
    en: 0.0,
  },
  {
    Z: 19,
    symbol: "K",
    name: "Potassium",
    nameBn: "পটাশিয়াম",
    group: 1,
    period: 4,
    shells: [2, 8, 8, 1],
    radius: 243,
    ie: 419,
    ea: 48,
    en: 0.82,
  },
  {
    Z: 20,
    symbol: "Ca",
    name: "Calcium",
    nameBn: "ক্যালসিয়াম",
    group: 2,
    period: 4,
    shells: [2, 8, 8, 2],
    radius: 194,
    ie: 590,
    ea: 2,
    en: 1.0,
  },
];

export const TREND_BY_Z = new Map(TREND_ELEMENTS.map((e) => [e.Z, e]));

export const TREND_META: Record<
  TrendKey,
  {
    labelEn: string;
    labelBn: string;
    unit: string;
    desc: string;
    // Trend direction summary
    rowEn: string;
    rowBn: string;
    colEn: string;
    colBn: string;
  }
> = {
  radius: {
    labelEn: "Atomic Size",
    labelBn: "পরমাণুর আকার",
    unit: "pm",
    desc: "Distance from nucleus to outermost shell.",
    rowEn: "Decreases left → right (more protons pull same shell tighter).",
    rowBn: "বাম → ডান কমে যায় (প্রোটন বেড়ে একই শেলকে টেনে ছোট করে)।",
    colEn: "Increases top → bottom (new shell adds each period).",
    colBn: "উপর → নিচ বাড়ে (প্রতি পর্যায়ে নতুন শেল যুক্ত হয়)।",
  },
  ie: {
    labelEn: "Ionization Energy",
    labelBn: "আয়নীকরণ শক্তি",
    unit: "kJ/mol",
    desc: "Energy required to remove the outermost electron.",
    rowEn: "Increases left → right (electrons held tighter).",
    rowBn: "বাম → ডান বাড়ে (ইলেকট্রন বেশি শক্ত করে ধরা)।",
    colEn: "Decreases top → bottom (outer electron is farther).",
    colBn: "উপর → নিচ কমে যায় (বাইরের ইলেকট্রন দূরে চলে যায়)।",
  },
  ea: {
    labelEn: "Electron Affinity",
    labelBn: "ইলেকট্রন আসক্তি",
    unit: "kJ/mol",
    desc: "Energy released when a neutral atom gains an electron.",
    rowEn: "Generally increases left → right (greater attraction).",
    rowBn: "সাধারণত বাম → ডান বাড়ে (টান বেশি)।",
    colEn: "Generally decreases top → bottom (outer shell far).",
    colBn: "সাধারণত উপর → নিচ কমে যায় (বাইরের শেল দূরে)।",
  },
  en: {
    labelEn: "Electronegativity",
    labelBn: "তড়িৎ ঋণাত্মকতা",
    unit: "Pauling",
    desc: "Tendency of an atom to attract a shared electron pair.",
    rowEn: "Increases left → right (Fluorine = highest).",
    rowBn: "বাম → ডান বাড়ে (ফ্লোরিন সবচেয়ে বেশি)।",
    colEn: "Decreases top → bottom (atom larger, pull weaker).",
    colBn: "উপর → নিচ কমে যায় (পরমাণু বড়, টান কম)।",
  },
};

// Group column slots used by the mini periodic grid (groups: 1,2,13–18 → 8 cols)
export const GRID_GROUPS = [1, 2, 13, 14, 15, 16, 17, 18];
export const GRID_PERIODS = [1, 2, 3, 4];

export function elementAt(period: number, group: number): TrendElement | undefined {
  // Period 1 special: H at col 1, He at col 8
  if (period === 1) {
    if (group === 1) return TREND_BY_Z.get(1);
    if (group === 18) return TREND_BY_Z.get(2);
    return undefined;
  }
  return TREND_ELEMENTS.find((e) => e.period === period && e.group === group);
}

export function valueOf(el: TrendElement, key: TrendKey): number {
  return el[key];
}

/** Normalised 0..1 across the whole 20-element set for heatmap colouring. */
export function normalised(key: TrendKey): (v: number) => number {
  const vals = TREND_ELEMENTS.map((e) => e[key]).filter((v) => v > 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return (v) => (v <= 0 ? 0 : (v - min) / (max - min || 1));
}
