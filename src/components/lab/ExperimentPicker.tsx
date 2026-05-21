import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Wind, FlaskRound } from "lucide-react";
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

      <div className="grid w-full gap-4 md:grid-cols-3">
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
