/**
 * Chemical Bonding Basics — data & helpers for Ionic vs Covalent simulation.
 * NCTB Class 9-10 — রাসায়নিক বন্ধন (আয়নিক ও সমযোজী)।
 *
 * Pure data + scoring. UI lives in src/components/lab/BondingLab.tsx.
 */

export type Lang = "en" | "bn";

export type BondingStepId = "intro" | "ionic_transfer" | "covalent_share" | "concept_check";

export interface BondingStep {
  id: BondingStepId;
  label: { en: string; bn: string };
  hint: { en: string; bn: string };
}

export const BONDING_STEPS: BondingStep[] = [
  {
    id: "intro",
    label: {
      en: "Read: Valence electrons & Octet rule",
      bn: "পড়ুন: যোজ্যতা ইলেকট্রন ও অষ্টক নিয়ম",
    },
    hint: {
      en: "Atoms become stable by completing 8 electrons in their outer shell.",
      bn: "পরমাণু বহিঃস্তরে ৮টি ইলেকট্রন পূরণ করে স্থিতিশীল হয়।",
    },
  },
  {
    id: "ionic_transfer",
    label: {
      en: "Ionic: drag Na's valence electron onto Cl",
      bn: "আয়নিক: Na-এর যোজ্যতা ইলেকট্রনটি Cl-এ ছাড়ুন",
    },
    hint: {
      en: "Sodium loses 1 electron → Na⁺. Chlorine gains it → Cl⁻.",
      bn: "সোডিয়াম একটি ইলেকট্রন বর্জন করে Na⁺, ক্লোরিন গ্রহণ করে Cl⁻ হয়।",
    },
  },
  {
    id: "covalent_share",
    label: {
      en: "Covalent: drag electrons into the sharing zone (Cl–Cl)",
      bn: "সমযোজী: ইলেকট্রনগুলো শেয়ারিং জোনে নিন (Cl–Cl)",
    },
    hint: {
      en: "Each Cl shares 1 electron — together they form 1 shared pair (single bond).",
      bn: "প্রতিটি Cl একটি করে ইলেকট্রন শেয়ার করে — একটি যৌথ জোড়া তৈরি হয়।",
    },
  },
  {
    id: "concept_check",
    label: { en: "Concept check quiz", bn: "ধারণা যাচাই কুইজ" },
    hint: {
      en: "Match each property to the correct bond type.",
      bn: "প্রতিটি বৈশিষ্ট্য সঠিক বন্ধনের সাথে মেলান।",
    },
  },
];

// ── Mistake catalog ────────────────────────────────────────
export type BondingMistakeType =
  "inner_shell_electron" | "wrong_drop_target" | "transfer_in_covalent" | "duplicate_action";

export interface BondingMistake {
  ts: number;
  type: BondingMistakeType;
  message: string;
}

export const MISTAKE_MESSAGES: Record<BondingMistakeType, { en: string; bn: string }> = {
  inner_shell_electron: {
    en: "Only valence (outermost) electrons take part in bonding!",
    bn: "শুধু যোজ্যতা (সবচেয়ে বাইরের) ইলেকট্রন বন্ধনে অংশ নেয়!",
  },
  wrong_drop_target: {
    en: "Drop the electron onto the highlighted target.",
    bn: "ইলেকট্রনটি হাইলাইট করা জায়গায় ছাড়ুন।",
  },
  transfer_in_covalent: {
    en: "Covalent bonds share electrons — they are not transferred.",
    bn: "সমযোজী বন্ধনে ইলেকট্রন শেয়ার হয়, স্থানান্তর হয় না।",
  },
  duplicate_action: {
    en: "Already done — move to the next step.",
    bn: "ইতিমধ্যে সম্পন্ন — পরবর্তী ধাপে যান।",
  },
};

// ── Concept check quiz ─────────────────────────────────────
export type BondKind = "ionic" | "covalent";

export interface ConceptQuestion {
  id: string;
  prompt: { en: string; bn: string };
  answer: BondKind;
}

export const CONCEPT_QUESTIONS: ConceptQuestion[] = [
  {
    id: "q_transfer",
    prompt: {
      en: "Which bond involves complete transfer of electrons?",
      bn: "কোন বন্ধনে ইলেকট্রনের সম্পূর্ণ স্থানান্তর ঘটে?",
    },
    answer: "ionic",
  },
  {
    id: "q_share",
    prompt: {
      en: "Which bond is formed by sharing of electron pairs?",
      bn: "কোন বন্ধন ইলেকট্রন জোড়া শেয়ারের মাধ্যমে গঠিত হয়?",
    },
    answer: "covalent",
  },
  {
    id: "q_conduct",
    prompt: {
      en: "Which compound conducts electricity when dissolved in water?",
      bn: "কোন যৌগ পানিতে দ্রবীভূত হলে বিদ্যুৎ পরিবহন করে?",
    },
    answer: "ionic",
  },
  {
    id: "q_mp",
    prompt: {
      en: "Which compound usually has a low melting point?",
      bn: "কোন যৌগের সাধারণত গলনাঙ্ক কম থাকে?",
    },
    answer: "covalent",
  },
];

// ── Viva questions ─────────────────────────────────────────
export const BONDING_VIVA: Array<{
  q: { en: string; bn: string };
  a: { en: string; bn: string };
}> = [
  {
    q: {
      en: "Why does Na lose an electron and Cl gain one?",
      bn: "কেন সোডিয়াম ইলেকট্রন বর্জন করে আর ক্লোরিন গ্রহণ করে?",
    },
    a: {
      en: "Na has 1 valence electron — losing it gives the stable Ne configuration (2,8). Cl has 7 valence electrons — gaining 1 completes its octet to match Ar (2,8,8).",
      bn: "Na-এর যোজ্যতা ইলেকট্রন ১টি — বর্জন করলে নিয়ন (২,৮) এর মতো স্থিতিশীল গঠন পায়। Cl-এর ৭টি — ১টি গ্রহণ করে আর্গন (২,৮,৮) এর মতো অষ্টক পূরণ হয়।",
    },
  },
  {
    q: {
      en: "Why is there no transfer of electrons in covalent bonds?",
      bn: "সমযোজী বন্ধনে ইলেকট্রন আদান-প্রদান হয় না কেন?",
    },
    a: {
      en: "Both atoms have similar electronegativity and need electrons to complete their octet. Neither can pull electrons fully, so they share pairs instead.",
      bn: "উভয় পরমাণুর তড়িৎ-ঋণাত্মকতা প্রায় সমান এবং উভয়েরই অষ্টক পূরণের জন্য ইলেকট্রন দরকার। কেউ সম্পূর্ণ টানতে পারে না, তাই জোড়ায় শেয়ার করে।",
    },
  },
  {
    q: {
      en: "Which type of bonded compound conducts electricity in water and why?",
      bn: "কোন ধরনের বন্ধনযুক্ত যৌগ পানিতে দ্রবীভূত হলে বিদ্যুৎ পরিবহন করে এবং কেন?",
    },
    a: {
      en: "Ionic compounds (e.g. NaCl) conduct in water because they dissociate into free Na⁺ and Cl⁻ ions that carry charge. Covalent compounds (e.g. sugar) stay as neutral molecules.",
      bn: "আয়নিক যৌগ (যেমন NaCl) পানিতে Na⁺ ও Cl⁻ মুক্ত আয়নে বিভাজিত হয়, যা চার্জ বহন করে — তাই বিদ্যুৎ পরিবহন করে। সমযোজী যৌগ (যেমন চিনি) নিরপেক্ষ অণু হিসেবে থাকে।",
    },
  },
];

// ── Grading ────────────────────────────────────────────────
export interface BondingGradeInput {
  ionicDone: boolean;
  covalentSharedPairs: number; // 0..1 (need 1 pair for Cl–Cl)
  quizCorrect: number;
  quizTotal: number;
  mistakes: number;
  durationSec: number;
}

export interface BondingGradeOutput {
  accuracy: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export function gradeBonding(i: BondingGradeInput): BondingGradeOutput {
  let acc = 0;
  if (i.ionicDone) acc += 35;
  acc += Math.min(35, i.covalentSharedPairs * 35);
  if (i.quizTotal > 0) acc += Math.round((i.quizCorrect / i.quizTotal) * 30);
  acc -= i.mistakes * 4;
  acc = Math.max(0, Math.min(100, acc));
  const grade = acc >= 90 ? "A" : acc >= 75 ? "B" : acc >= 60 ? "C" : acc >= 45 ? "D" : "F";
  return { accuracy: acc, grade };
}

// ── Atomic shell geometry helpers ──────────────────────────
/** Compute (x,y) coordinates for `count` electrons evenly placed on a circular shell. */
export function shellPositions(
  cx: number,
  cy: number,
  radius: number,
  count: number,
  startAngleDeg = -90,
): Array<{ x: number; y: number; angle: number }> {
  const out: Array<{ x: number; y: number; angle: number }> = [];
  for (let i = 0; i < count; i++) {
    const a = ((startAngleDeg + (i * 360) / count) * Math.PI) / 180;
    out.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a), angle: a });
  }
  return out;
}
