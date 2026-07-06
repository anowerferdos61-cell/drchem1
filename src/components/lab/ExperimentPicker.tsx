import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Wind, FlaskRound, Gem, Zap, Beaker, Droplet, Activity, TestTubes, Layers, Atom, Sparkles, Flame } from "lucide-react";
import type { ExperimentId } from "./types";

interface Props {
  onPick: (id: ExperimentId) => void;
}

const EXPERIMENTS: Array<{
  id: ExperimentId;
  title: string;
  subtitle: string;
  icon: typeof FlaskConical;
  gradient: string;
}> = [
  {
    id: "titration",
    title: "Acid-Base Titration · অ্যাসিড-ক্ষার টাইট্রেশন",
    subtitle: "HCl + NaOH with phenolphthalein indicator",
    icon: FlaskConical,
    gradient: "from-rose-100 via-fuchsia-50 to-sky-100",
  },
  {
    id: "oxygen_prep",
    title: "Preparation of Oxygen · অক্সিজেন প্রস্তুতি",
    subtitle: "2 H₂O₂ →[MnO₂] 2 H₂O + O₂ — downward displacement of water",
    icon: Wind,
    gradient: "from-sky-100 via-cyan-50 to-emerald-100",
  },
  {
    id: "co2_prep",
    title: "Preparation of CO₂ · কার্বন ডাইঅক্সাইড প্রস্তুতি",
    subtitle: "CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂ — upward displacement of air",
    icon: FlaskRound,
    gradient: "from-emerald-100 via-lime-50 to-amber-100",
  },
  {
    id: "nacl_crystal",
    title: "NaCl Crystallisation · সোডিয়াম ক্লোরাইডের কেলাস",
    subtitle:
      "অবিশুদ্ধ লবণ → পরিশ্রবণ → সম্পৃক্ত দ্রবণ → ঠান্ডা → ঘনকীয় কেলাস",
    icon: Gem,
    gradient: "from-indigo-100 via-sky-50 to-cyan-100",
  },
  {
    id: "ionic_covalent",
    title: "Ionic vs Covalent · আয়নিক ও সমযোজী যৌগ",
    subtitle:
      "দ্রবণীয়তা · তড়িৎ পরিবাহিতা · গলনাঙ্ক · CuSO₄ এর তড়িৎ বিশ্লেষণ",
    icon: Zap,
    gradient: "from-violet-100 via-purple-50 to-fuchsia-100",
  },
  {
    id: "na2co3_standard",
    title: "0.1 M Na₂CO₃ Standard · প্রমাণ দ্রবণ",
    subtitle:
      "W = (S × M × V)/1000 = 2.650 g · 250 mL volumetric flask, meniscus alignment",
    icon: Beaker,
    gradient: "from-emerald-100 via-teal-50 to-sky-100",
  },
  {
    id: "cuso4_water",
    title: "Crystallization Water · CuSO₄·5H₂O",
    subtitle:
      "%H₂O = (y − z)/(y − x) × 100 · নীল → সাদা · theoretical 36.07%",
    icon: Droplet,
    gradient: "from-sky-100 via-blue-50 to-indigo-100",
  },
  {
    id: "ph_scale",
    title: "pH Scale · pH স্কেল",
    subtitle:
      "Interactive Universal Indicator · pH = −log[H⁺] · 0 → 14 (acidic ↔ basic)",
    icon: Activity,
    gradient: "from-rose-100 via-yellow-50 to-indigo-100",
  },
  {
    id: "indicator_compare",
    title: "Indicator Comparison · নির্দেশক তুলনা",
    subtitle:
      "Litmus · Phenolphthalein · Methyl Orange — HCl / H₂O / NaOH ড্রপ টেস্ট",
    icon: TestTubes,
    gradient: "from-pink-100 via-orange-50 to-yellow-100",
  },
  {
    id: "solubility_rules",
    title: "Solubility Rules · দ্রাব্যতা নীতি",
    subtitle:
      "Drag-and-drop game · NAG SAG · Soluble vs Insoluble · অধঃক্ষেপ চেনা",
    icon: Layers,
    gradient: "from-sky-100 via-blue-50 to-rose-100",
  },
  {
    id: "electrochemical_series",
    title: "Electrochemical Series · তড়িৎ-রাসায়নিক সারি",
    subtitle:
      "K → Au reactivity ladder · Displacement simulator · NCTB Chapter 8",
    icon: Atom,
    gradient: "from-rose-100 via-amber-50 to-emerald-100",
  },
  {
    id: "bonding_basics",
    title: "Chemical Bonding · রাসায়নিক বন্ধন",
    subtitle:
      "Ionic transfer (Na→Cl) vs Covalent sharing (Cl₂) · Drag valence electrons",
    icon: Sparkles,
    gradient: "from-violet-100 via-rose-50 to-sky-100",
  },
  {
    id: "metallic_bonding",
    title: "Metallic Bonding · ধাতব বন্ধন",
    subtitle:
      "Electron Sea Model · Cu²⁺ lattice + delocalized e⁻ · Battery & Malleability test",
    icon: Atom,
    gradient: "from-orange-100 via-amber-50 to-rose-100",
  },
  {
    id: "ionic_vs_covalent_theory",
    title: "Ionic vs Covalent Properties · ধর্ম তুলনা",
    subtitle:
      "Split-screen NaCl vs Sugar · Melting point + Conductivity test with animated ions",
    icon: Zap,
    gradient: "from-violet-100 via-fuchsia-50 to-rose-100",
  },
  {
    id: "mole_concept",
    title: "Mole & Avogadro · মোল ও অ্যাভোগাড্রো সংখ্যা",
    subtitle:
      "n = W/M · Digital scale + particle viewer showing 6.023 × 10²³ particles",
    icon: Atom,
    gradient: "from-emerald-100 via-teal-50 to-cyan-100",
  },
  {
    id: "molarity_dilution",
    title: "Molarity & Dilution · মোলারিটি ও দ্রবণ লঘুকরণ",
    subtitle: "S₁V₁ = S₂V₂ · CuSO₄ solution with live ion visualisation",
    icon: FlaskConical,
    gradient: "from-sky-100 via-blue-50 to-cyan-100",
  },
  {
    id: "empirical_formula",
    title: "Empirical & Molecular Formula · স্থূল সংকেত নির্ণয়",
    subtitle: "% composition → empirical → molecular formula builder",
    icon: Sparkles,
    gradient: "from-fuchsia-100 via-violet-50 to-pink-100",
  },
  {
    id: "limiting_reactant",
    title: "Limiting Reactant & Yield · লিমিটিং বিক্রিয়ক ও উৎপাদ",
    subtitle: "2H₂ + O₂ → 2H₂O · Molecular collision + % yield predictor",
    icon: Zap,
    gradient: "from-orange-100 via-rose-50 to-cyan-100",
  },
  {
    id: "stp_molar_volume",
    title: "STP & Molar Volume · STP ও মোলার আয়তন",
    subtitle: "V = n × 22.4 L · Piston chamber locks at 1 mol · H₂ / O₂ / CO₂",
    icon: Wind,
    gradient: "from-emerald-100 via-teal-50 to-cyan-100",
  },
  {
    id: "daniel_cell",
    title: "Daniel Cell · ড্যানিয়েল সেল",
    subtitle: "Zn | Zn²⁺ ‖ Cu²⁺ | Cu · E°cell = +1.10 V · গ্যালভানিক কোষ",
    icon: Zap,
    gradient: "from-amber-100 via-yellow-50 to-orange-100",
  },
  {
    id: "electrolytic_cell",
    title: "Electrolytic Cell · তড়িৎবিশ্লেষ্য কোষ",
    subtitle: "Water electrolysis (H₂:O₂ = 2:1) + Electroplating (Cu on Fe spoon)",
    icon: Zap,
    gradient: "from-orange-100 via-amber-50 to-yellow-100",
  },
  {
    id: "dry_cell",
    title: "Dry Cell · ড্রাই সেল",
    subtitle: "Zn-C battery · অভ্যন্তরীণ লেয়ার + মাইক্রোস্কোপিক বিক্রিয়া · 1.5 V",
    icon: Zap,
    gradient: "from-yellow-100 via-amber-50 to-orange-100",
  },
  {
    id: "fuel_combustion",
    title: "Fuel Combustion · জ্বালানি দহন ও পরিবেশ",
    subtitle: "CH₄ · C₄H₁₀ · Coal · Ethanol · CO₂ footprint + soot vs clean flame",
    icon: Flame,
    gradient: "from-orange-100 via-red-50 to-yellow-100",
  },
  {
    id: "bond_energy_calorimeter",
    title: "Bond Energy & ΔH · বন্ধন শক্তি ও তাপের পরিবর্তন",
    subtitle: "ΔH = ΣE(broken) − ΣE(formed) · Snip bonds, build products, watch the thermometer",
    icon: Flame,
    gradient: "from-amber-100 via-orange-50 to-rose-100",
  },
  {
    id: "role_of_water",
    title: "Role of Water · এসিড-ক্ষারকে পানির ভূমিকা",
    subtitle: "Dry HCl / Ethanol / NaOH — litmus stays put till water arrives · H⁺ ≠ acid without H₂O",
    icon: Droplet,
    gradient: "from-sky-100 via-cyan-50 to-blue-100",
  },
  {
    id: "acid_base_strength",
    title: "Acid/Base Strength · Strong vs Weak",
    subtitle: "HCl vs CH₃COOH · NaOH vs NH₄OH · Ionization degree α + bulb brightness test",
    icon: Zap,
    gradient: "from-amber-100 via-yellow-50 to-orange-100",
  },
  {
    id: "neutralization_reaction",
    title: "Neutralization Reaction · প্রশমন বিক্রিয়া ও লবণের গঠন",
    subtitle: "HCl+NaOH → NaCl · H⁺+OH⁻ ion exchange + exothermic ΔH=−57.3 kJ/mol",
    icon: FlaskConical,
    gradient: "from-rose-100 via-pink-50 to-fuchsia-100",
  },
  {
    id: "antacid_action",
    title: "Antacid Action · পাকস্থলীর এসিডিটি ও এন্টাসিড",
    subtitle: "Mg(OH)₂ / Al(OH)₃ + HCl → salt + H₂O · real-world neutralization",
    icon: Droplet,
    gradient: "from-pink-100 via-rose-50 to-fuchsia-100",
  },
  {
    id: "minerals_vs_rocks",
    title: "Minerals vs Rocks · খনিজ ও শিলা",
    subtitle: "Quartz, Mica, Feldspar → Granite · খনিজের 'প্যাকেট' হলো শিলা",
    icon: Gem,
    gradient: "from-fuchsia-100 via-pink-50 to-rose-100",
  },
  {
    id: "ores_vs_minerals",
    title: "Ores vs Minerals · খনিজ ও আকরিক (Venn)",
    subtitle: "সকল আকরিকই খনিজ, কিন্তু সকল খনিজ আকরিক নয় · Bauxite vs Clay",
    icon: Gem,
    gradient: "from-emerald-100 via-sky-50 to-blue-100",
  },
  {
    id: "metallurgy_steps",
    title: "Steps of Metallurgy · ধাতু নিষ্কাশনের ধাপ",
    subtitle: "Crush → Concentrate → Roast → Oxide → Reduce → Refine · ৬-ধাপের ইন্টারেক্টিভ পাইপলাইন",
    icon: Flame,
    gradient: "from-indigo-100 via-violet-50 to-fuchsia-100",
  },
  {
    id: "blast_furnace",
    title: "Blast Furnace · বাতচুল্লী (Fe নিষ্কাশন)",
    subtitle: "৪ থার্মাল Zone · হেমাটাইট → গলিত লোহা · ইন্টারেক্টিভ ক্রস-সেকশন",
    icon: Flame,
    gradient: "from-rose-100 via-orange-50 to-amber-100",
  },
  {
    id: "electrolytic_refining",
    title: "Electrolytic Refining · তড়িৎ বিশোধন",
    subtitle: "Cu 99.9% বিশুদ্ধকরণ · অ্যানোড কাদা · Down's / Hall-Héroult রেফারেন্স",
    icon: Zap,
    gradient: "from-orange-100 via-amber-50 to-yellow-100",
  },
];



export default function ExperimentPicker({ onPick }: Props) {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Virtual Chemistry Lab
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          ভার্চুয়াল রসায়ন ল্যাব · Choose an experiment to begin
        </p>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {EXPERIMENTS.map((e) => {
          const Icon = e.icon;
          return (
            <Card
              key={e.id}
              className={`group relative overflow-hidden border-2 p-6 transition-all hover:scale-[1.02] hover:border-primary hover:shadow-2xl cursor-pointer bg-gradient-to-br ${e.gradient}`}
              onClick={() => onPick(e.id)}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-white/70 p-3 shadow-sm">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold leading-tight">{e.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{e.subtitle}</p>
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                className="mt-5 w-full"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onPick(e.id);
                }}
              >
                Start · শুরু করুন
              </Button>
            </Card>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        More experiments coming soon · আরও পরীক্ষা শীঘ্রই
      </p>
    </div>
  );
}
