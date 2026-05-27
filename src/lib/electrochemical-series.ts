// Electrochemical Series — Class 9-10 NCTB (Chapter 8)
// তড়িৎ-রাসায়নিক সারি

export type Reactivity =
  | "High"
  | "Medium-High"
  | "Medium"
  | "Medium-Low"
  | "Reference Point"
  | "Low"
  | "Very Low"
  | "Lowest";

export interface SeriesMetal {
  symbol: string;
  name: string;
  reactivity: Reactivity;
  color: string;
  note: string;
}

export interface SeriesExample {
  equation: string;
  explanation: string;
}

export interface ElectrochemicalSeriesData {
  title: string;
  definition: string;
  series: SeriesMetal[];
  key_point: string;
  example: SeriesExample;
  exam_tricks: string[];
}

export const ELECTROCHEMICAL_SERIES: ElectrochemicalSeriesData = {
  title: "তড়িৎ-রাসায়নিক সারি (Electrochemical Series)",
  definition:
    "বিভিন্ন ধাতু (এবং হাইড্রোজেন)-কে তাদের ইলেকট্রন বর্জন বা জারণ ক্ষমতার হ্রাসের ক্রমানুসারে সাজিয়ে যে সক্রিয়তা সিরিজ তৈরি করা হয়, তাকে তড়িৎ-রাসায়নিক সারি বলে।",
  series: [
    { symbol: "K", name: "পটাশিয়াম", reactivity: "High", color: "#EF4444", note: "সবচেয়ে সক্রিয় ধাতু, সহজে ইলেকট্রন ছাড়ে।" },
    { symbol: "Na", name: "সোডিয়াম", reactivity: "High", color: "#F97316", note: "অত্যন্ত সক্রিয় ধাতু।" },
    { symbol: "Ca", name: "ক্যালসিয়াম", reactivity: "Medium-High", color: "#F59E0B", note: "তীব্র সক্রিয়।" },
    { symbol: "Mg", name: "ম্যাগনেসিয়াম", reactivity: "Medium", color: "#10B981", note: "মধ্যম সক্রিয় ধাতু।" },
    { symbol: "Al", name: "অ্যালুমিনিয়াম", reactivity: "Medium", color: "#06B6D4", note: "ধীরে বিক্রিয়া করে।" },
    { symbol: "Zn", name: "জিঙ্ক", reactivity: "Medium", color: "#3B82F6", note: "মাঝারি সক্রিয়।" },
    { symbol: "Fe", name: "আয়রন/লোহা", reactivity: "Medium-Low", color: "#6366F1", note: "মৃদু সক্রিয়।" },
    { symbol: "H", name: "হাইড্রোজেন (Reference)", reactivity: "Reference Point", color: "#6B7280", note: "এটি অধাতু হলেও সক্রিয়তার রেফারেন্স বা ভিত্তি হিসেবে সারিতে রাখা হয়েছে।" },
    { symbol: "Cu", name: "কপার/তামা", reactivity: "Low", color: "#A855F7", note: "কম সক্রিয়, সহজে বিক্রিয়া করে না।" },
    { symbol: "Ag", name: "সিলভার/রুপা", reactivity: "Very Low", color: "#EC4899", note: "অত্যন্ত নিষ্ক্রিয় ধাতু।" },
    { symbol: "Au", name: "গোল্ড/সোনা", reactivity: "Lowest", color: "#D97706", note: "সারির নিচে অবস্থিত, রাসায়নিকভাবে সবচেয়ে নিষ্ক্রিয়।" },
  ],
  key_point:
    "সারির ওপরে অবস্থিত ধাতু বেশি সক্রিয় (Higher → More Reactive)। ওপরে থাকা যেকোনো ধাতু তার নিচের ধাতুকে দ্রবণ থেকে প্রতিস্থাপন (Displace) করতে পারে।",
  example: {
    equation: "Zn + CuSO_4 \\rightarrow ZnSO_4 + Cu",
    explanation:
      "এই বিক্রিয়ায় জিঙ্ক ($Zn$) সক্রিয়তা সারিতে কপারের ($Cu$) ওপরে থাকায়, সে কপার সালফেট দ্রবণ থেকে কপারকে তাড়িয়ে নিজে জায়গা দখল করে। কিন্তু উল্টো বিক্রিয়া ($Cu + ZnSO_4$) ঘটবে না কারণ কপার কম সক্রিয়।",
  },
  exam_tricks: [
    "মনে রাখার ছন্দ: কে কে না কে মেগাইবার এলো যেনো ফিরে পাবে হায় কুলাঙ্গার হাজি আজি পেটাবে আমায়!",
    "বোর্ড টিপস: পরীক্ষায় প্রায়ই আসে 'জিঙ্ক পাত্রে কপার সালফেট রাখা যাবে কি না?'। উত্তর: রাখা যাবে না, কারণ জিঙ্ক বেশি সক্রিয় হওয়ায় পাত্র ক্ষয়ে যাবে এবং বিক্রিয়া ঘটে যাবে।",
  ],
};
