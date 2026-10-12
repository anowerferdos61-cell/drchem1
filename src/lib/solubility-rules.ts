// Solubility Rules dataset — Class 9-10 NCTB
// দ্রাব্যতা নীতি — শ্রেণী ৯-১০

export interface SolubilityRule {
  id: string;
  statement: string;
  bg_color: string;
}

export interface SolubilityException {
  ion: string;
  rule: string;
}

export type SolubilityStatus = "Soluble" | "Insoluble";

export type TextureType = "crystals" | "cloudy-grains" | "needles" | "powder";
export type TextureSize = "tiny" | "small" | "small-medium" | "medium";

export interface TextureVisual {
  type: TextureType;
  count: number;
  color: string;
  size: TextureSize;
}

export interface SolubilityExample {
  id: string;
  formula: string; // KaTeX math (no $)
  name: string;
  status: SolubilityStatus;
  appearance?: string;
  textureVisual?: TextureVisual;
  note: string;
}

export interface SolubilityData {
  title: string;
  rules: SolubilityRule[];
  exceptions: SolubilityException[];
  examples: SolubilityExample[];
  mnemonic: string;
  interactive_hint: string;
}

export const SOLUBILITY_DATA: SolubilityData = {
  title: "দ্রাব্যতা নীতি (Solubility Rules)",
  rules: [
    {
      id: "rule_1",
      statement:
        "সব নাইট্রেট ($NO_3^-$) এবং অ্যামোনিয়াম ($NH_4^+$) লবণ পানিতে সবসময় দ্রবণীয় (Always Soluble)।",
      bg_color: "bg-blue-50 border-blue-200",
    },
    {
      id: "rule_2",
      statement: "গ্রুপ-১ এর সব ক্ষার ধাতু ($Na^+, K^+$ ইত্যাদি) এর লবণ পানিতে সম্পূর্ণ দ্রবণীয়।",
      bg_color: "bg-green-50 border-green-200",
    },
    {
      id: "rule_3",
      statement: "সব ক্লোরাইড ($Cl^-$) লবণ দ্রবণীয়, তবে কিছু ব্যতিক্রম ছাড়া।",
      bg_color: "bg-yellow-50 border-yellow-200",
    },
    {
      id: "rule_4",
      statement:
        "অধিকাংশ কার্বনেট ($CO_3^{2-}$) এবং ফসফেট ($PO_4^{3-}$) লবণ পানিতে অদ্রবণীয় (Insoluble)।",
      bg_color: "bg-red-50 border-red-200",
    },
  ],
  exceptions: [
    {
      ion: "ক্লোরাইড (Cl⁻) এর ব্যতিক্রম",
      rule: "সিলভার ক্লোরাইড ($AgCl$) এবং লেড ক্লোরাইড ($PbCl_2$) পানিতে অদ্রবণীয়। এরা সাদা অধঃক্ষেপ (Precipitate) তৈরি করে।",
    },
    {
      ion: "কার্বনেট (CO₃²⁻) এর ব্যতিক্রম",
      rule: "গ্রুপ-১ এর কার্বনেট যেমন সোডিয়াম কার্বনেট ($Na_2CO_3$) এবং পটাশিয়াম কার্বনেট ($K_2CO_3$) পানিতে দ্রবণীয়।",
    },
  ],
  examples: [
    {
      id: "ex1",
      formula: "NaCl",
      name: "সোডিয়াম ক্লোরাইড (খাবার লবণ)",
      status: "Soluble",
      appearance: "সাদা স্ফটিক দানা (White Crystals)",
      textureVisual: { type: "crystals", count: 8, color: "#FFFFFF", size: "small" },
      note: "গ্রুপ-১ এর লবণ, তাই পানিতে সম্পূর্ণ দ্রবণীয়।",
    },
    {
      id: "ex2",
      formula: "AgCl",
      name: "সিলভার ক্লোরাইড",
      status: "Insoluble",
      appearance: "সাদা দইয়ের মতো অধঃক্ষেপ (White Curdy PPt)",
      textureVisual: { type: "cloudy-grains", count: 12, color: "#F0F0F0", size: "small" },
      note: "ক্লোরাইড হলেও এটি ব্যতিক্রম, নিচে সাদা অধঃক্ষেপ পড়বে।",
    },
    {
      id: "ex3",
      formula: "KNO_3",
      name: "পটাশিয়াম নাইট্রেট",
      status: "Soluble",
      appearance: "সাদা সুঁচালো ক্রিস্টাল (White Prismatic Crystals)",
      textureVisual: { type: "needles", count: 6, color: "#F8F8FF", size: "small-medium" },
      note: "নাইট্রেট লবণ সবসময় দ্রবণীয়।",
    },
    {
      id: "ex4",
      formula: "CaCO_3",
      name: "ক্যালসিয়াম কার্বনেট",
      status: "Insoluble",
      appearance: "সাদা পাউডার (White Powder)",
      textureVisual: { type: "powder", count: 15, color: "#E8E8E8", size: "tiny" },
      note: "অধিকাংশ কার্বনেট অদ্রবণীয়।",
    },
  ],
  mnemonic:
    "NAG SAG: N-Nitrates, A-Ammonium, G-Group 1 salts (সবসময় দ্রবণীয় বা Soluble)! এই সহজ সূত্রটি মনে রাখলে SSC-র যেকোনো অধঃক্ষেপণ (Precipitation) বিক্রিয়া এক সেকেন্ডে সমাধান করা যাবে।",
  interactive_hint:
    "উপরে দেওয়া লবণের কার্ডগুলো মাউস দিয়ে ড্র্যাগ (Drag) বা ক্লিক করে ডানপাশের সঠিক বক্সে ফেলুন: একটি 'পানিতে দ্রবণীয় (Soluble)' বিকারে এবং অন্যটি 'তলানি বা অধঃক্ষেপ (Insoluble)' বিকারে। লক্ষ্য করুন, অদ্রবণীয় লবণটি বিকারের তলায় কীভাবে জমা হচ্ছে।",
};
