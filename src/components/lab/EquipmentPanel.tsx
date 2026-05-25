import { Card } from "@/components/ui/card";
import {
  FlaskConical,
  TestTube,
  Beaker,
  Droplet,
  Pipette,
  Sparkles,
  Wind,
  Flame,
  FlaskRound,
  TestTube2,
  Leaf,
  Hammer,
  Filter,
  Layers,
  Box,
  Gem,
  Minus,
  Zap,
  Lightbulb,
  Cable,
  Battery,
  Scale,
  Circle,
  type LucideIcon,
} from "lucide-react";

import type { EquipmentId } from "./types";

export interface EquipmentItem {
  id: EquipmentId;
  label: string;
  icon: LucideIcon;
}

const TITRATION_ITEMS: EquipmentItem[] = [
  { id: "clamp", label: "Stand & Clamp · স্ট্যান্ড", icon: TestTube },
  { id: "burette", label: "Burette · বিউরেট", icon: TestTube },
  { id: "flask", label: "Conical Flask · কনিক্যাল ফ্লাস্ক", icon: FlaskConical },
  { id: "beaker", label: "Beaker · বিকার", icon: Beaker },
  { id: "pipette", label: "Pipette · পিপেট", icon: Pipette },
  { id: "hcl", label: "HCl (acid) · হাইড্রোক্লোরিক অ্যাসিড", icon: Droplet },
  { id: "naoh", label: "NaOH (base) · সোডিয়াম হাইড্রক্সাইড", icon: Droplet },
  { id: "phenolphthalein", label: "Phenolphthalein · ফেনলফথ্যালিন", icon: Sparkles },
];

interface Props {
  onSelect: (id: EquipmentId) => void;
  disabled?: (id: EquipmentId) => boolean;
  highlight?: EquipmentId | null;
  items?: EquipmentItem[];
}

export default function EquipmentPanel({ onSelect, disabled, highlight, items }: Props) {
  const list = items ?? TITRATION_ITEMS;
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
        Equipment · যন্ত্রপাতি
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {list.map((item) => {
          const Icon = item.icon;
          const isDisabled = disabled?.(item.id) ?? false;
          const isHighlighted = highlight === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              disabled={isDisabled}
              draggable={!isDisabled}
              onDragStart={(e) => e.dataTransfer.setData("text/equipment", item.id)}
              className={[
                "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-all",
                "hover:border-primary hover:bg-accent",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isHighlighted
                  ? "border-primary bg-primary/10 ring-2 ring-primary animate-pulse"
                  : "border-border bg-card",
              ].join(" ")}
            >
              <Icon className="h-6 w-6" />
              <span className="text-center leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export const OXYGEN_ITEMS: EquipmentItem[] = [
  { id: "clamp", label: "Retort Stand · স্ট্যান্ড", icon: TestTube },
  { id: "test_tube_reaction", label: "Reaction Flask · বিক্রিয়া ফ্লাস্ক", icon: FlaskConical },
  { id: "manganese_dioxide", label: "MnO₂ Catalyst · ম্যাঙ্গানিজ ডাইঅক্সাইড", icon: Sparkles },
  { id: "delivery_tube", label: "Delivery Tube · ডেলিভারি টিউব", icon: Wind },
  { id: "water_trough", label: "Water Trough · ওয়াটার ট্রাফ", icon: Beaker },
  { id: "test_tube_collection", label: "Collection Tube · সংগ্রহ টিউব", icon: TestTube },
  { id: "hydrogen_peroxide", label: "H₂O₂ Solution · হাইড্রোজেন পারঅক্সাইড", icon: Droplet },
  { id: "glowing_splint", label: "Glowing Splint · আধা-জ্বলা কাঠি", icon: Flame },
];

export const CO2_ITEMS: EquipmentItem[] = [
  { id: "clamp", label: "Stand & Clamp · স্ট্যান্ড", icon: TestTube },
  { id: "round_bottom_flask", label: "Round-bottom Flask · গোলতলী ফ্লাস্ক", icon: FlaskRound },
  { id: "calcium_carbonate", label: "CaCO₃ chips · ক্যালসিয়াম কার্বনেট", icon: Sparkles },
  { id: "two_hole_cork", label: "Two-hole Cork · দ্বি-ছিদ্র কর্ক", icon: Beaker },
  { id: "thistle_funnel", label: "Thistle Funnel · থিসল ফানেল", icon: Pipette },
  { id: "bent_delivery_tube", label: "Bent Delivery Tube · বাঁকা কাচনল", icon: Wind },
  { id: "gas_jar", label: "Gas Jar · গ্যাস জার", icon: TestTube2 },
  { id: "dilute_hcl", label: "Dilute HCl · লঘু হাইড্রোক্লোরিক অ্যাসিড", icon: Droplet },
  { id: "limewater", label: "Limewater · চুনের পানি", icon: Droplet },
  { id: "burning_splint", label: "Burning Splint · জ্বলন্ত কাঠি", icon: Flame },
  { id: "moist_blue_litmus", label: "Moist Blue Litmus · ভেজা নীল লিটমাস", icon: Leaf },
  { id: "magnesium_ribbon", label: "Magnesium Ribbon · ম্যাগনেসিয়াম ফিতা", icon: Flame },
];

export const NACL_ITEMS: EquipmentItem[] = [
  { id: "mortar_pestle", label: "Mortar & Pestle · হামানদিস্তা", icon: Hammer },
  { id: "impure_salt", label: "Impure Salt · অবিশুদ্ধ লবণ", icon: Sparkles },
  { id: "distilled_water", label: "Distilled Water · পাতিত পানি", icon: Droplet },
  { id: "beaker_1", label: "Beaker-1 · বিকার-১", icon: Beaker },
  { id: "glass_rod", label: "Glass Rod · কাচদণ্ড", icon: Minus },
  { id: "funnel", label: "Funnel · ফানেল", icon: Filter },
  { id: "filter_paper", label: "Filter Paper · ফিল্টার পেপার", icon: Layers },
  { id: "beaker_2", label: "Beaker-2 · বিকার-২", icon: Beaker },
  { id: "tripod_stand", label: "Tripod Stand · ত্রিপদী স্ট্যান্ড", icon: TestTube },
  { id: "wire_gauze", label: "Wire Gauze · তারজালি", icon: Layers },
  { id: "bunsen_burner", label: "Bunsen Burner · বুনসেন বার্নার", icon: Flame },
  { id: "evaporating_dish", label: "Evaporating Dish · বাষ্পীভবন পাত্র", icon: Box },
  { id: "seed_crystal", label: "Seed Crystal · বীজ কেলাস", icon: Gem },
];

export const IONIC_ITEMS: EquipmentItem[] = [
  { id: "test_beaker", label: "4× Test Beaker · ৪টি বিকার", icon: Beaker },
  { id: "water_bottle", label: "Distilled Water · পাতিত পানি", icon: Droplet },
  { id: "nacl_solid", label: "NaCl · সোডিয়াম ক্লোরাইড", icon: Sparkles },
  { id: "sugar_solid", label: "Sugar · চিনি", icon: Sparkles },
  { id: "naphthalene_solid", label: "Naphthalene · ন্যাপথালিন", icon: Sparkles },
  { id: "cuso4_solid", label: "CuSO₄ · কপার সালফেট", icon: Gem },
  { id: "battery", label: "Battery · ব্যাটারি", icon: Battery },
  { id: "bulb", label: "Bulb · বাল্ব", icon: Lightbulb },
  { id: "wires", label: "Wires · তার", icon: Cable },
  { id: "carbon_electrode", label: "Carbon Electrode · কার্বন তড়িৎদ্বার", icon: Minus },
  { id: "copper_electrode", label: "Cu Electrode · কপার তড়িৎদ্বার", icon: Minus },
  { id: "electrolysis_cell", label: "Electrolysis Cell · তড়িৎ কোষ", icon: Box },
  { id: "spatula", label: "Spatula + Burner · স্প্যাচুলা", icon: Flame },
  { id: "bunsen_burner", label: "Bunsen Burner · বুনসেন বার্নার", icon: Zap },
];

export const NA2CO3_ITEMS: EquipmentItem[] = [
  { id: "balance", label: "Digital Balance · ডিজিটাল ব্যালান্স", icon: Scale },
  { id: "watch_glass", label: "Watch Glass · ওয়াচ গ্লাস", icon: Circle },
  { id: "spatula", label: "Spatula · স্প্যাচুলা", icon: Minus },
  { id: "na2co3_solid", label: "Na₂CO₃ · সোডিয়াম কার্বনেট", icon: Sparkles },
  { id: "volumetric_flask_250", label: "250 mL Volumetric Flask · আয়তনিক ফ্লাস্ক", icon: FlaskConical },
  { id: "funnel", label: "Funnel · ফানেল", icon: Filter },
  { id: "wash_bottle", label: "Wash Bottle (H₂O) · ওয়াশ বটল", icon: Droplet },
  { id: "stopper", label: "Stopper · ছিপি", icon: Box },
];

export const CUSO4_ITEMS: EquipmentItem[] = [
  { id: "balance", label: "Analytical Balance · ব্যালান্স", icon: Scale },
  { id: "crucible", label: "Porcelain Crucible · ক্রুসিবল", icon: Box },
  { id: "cuso4_hydrated", label: "CuSO₄·5H₂O · নীল তুঁতে", icon: Gem },
  { id: "tripod_stand", label: "Tripod Stand · ত্রিপদী", icon: TestTube },
  { id: "wire_gauze", label: "Wire Gauze · তারজালি", icon: Layers },
  { id: "bunsen_burner", label: "Bunsen Burner · বুনসেন বার্নার", icon: Flame },
  { id: "glass_rod", label: "Glass Rod · কাচদণ্ড", icon: Minus },
  { id: "desiccator", label: "Desiccator · ডেসিকেটর", icon: Circle },
  { id: "tongs", label: "Crucible Tongs · চিমটা", icon: Hammer },
];

