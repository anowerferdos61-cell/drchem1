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
