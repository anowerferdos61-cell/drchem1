import { Card } from "@/components/ui/card";
import { FlaskConical, TestTube, Beaker, Droplet, Pipette, Sparkles } from "lucide-react";
import type { EquipmentId } from "./types";

interface Item {
  id: EquipmentId | "clamp";
  label: string;
  icon: typeof FlaskConical;
}

const ITEMS: Item[] = [
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
  onSelect: (id: Item["id"]) => void;
  disabled?: (id: Item["id"]) => boolean;
  highlight?: Item["id"] | null;
}

export default function EquipmentPanel({ onSelect, disabled, highlight }: Props) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
        Equipment · যন্ত্রপাতি
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {ITEMS.map((item) => {
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
