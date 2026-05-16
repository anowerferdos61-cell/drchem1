import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TitrationConfig } from "@/lib/chemistry";
import { equivalenceVolume } from "@/lib/chemistry";

interface Props {
  config: TitrationConfig;
  onChange: (c: TitrationConfig) => void;
}

export default function ConfigPanel({ config, onChange }: Props) {
  const [draft, setDraft] = useState(config);

  const apply = () => {
    if (draft.Ma <= 0 || draft.Va <= 0 || draft.Mb <= 0) {
      toast.error("Values must be positive · মান অবশ্যই ধনাত্মক হতে হবে");
      return;
    }
    const Ve = equivalenceVolume(draft);
    if (Ve > 50) {
      toast.warning(`Endpoint > 50 mL (Ve = ${Ve.toFixed(2)} mL). Burette may overflow.`);
    }
    onChange(draft);
    try {
      localStorage.setItem("titration:config", JSON.stringify(draft));
    } catch {
      /* ignore */
    }
    toast.success("Configuration saved · কনফিগারেশন সংরক্ষিত");
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
        Teacher Config · শিক্ষকের সেটিংস
      </h3>
      <Field
        label="Acid Molarity Ma (M)"
        value={draft.Ma}
        onChange={(Ma) => setDraft({ ...draft, Ma })}
      />
      <Field
        label="Acid Volume Va (mL)"
        value={draft.Va}
        onChange={(Va) => setDraft({ ...draft, Va })}
      />
      <Field
        label="Base Molarity Mb (M)"
        value={draft.Mb}
        onChange={(Mb) => setDraft({ ...draft, Mb })}
      />
      <div className="text-xs text-muted-foreground">
        Predicted Ve = <span className="font-mono">{equivalenceVolume(draft).toFixed(2)}</span> mL
      </div>
      <Button onClick={apply} size="sm" className="w-full">
        Apply · প্রয়োগ
      </Button>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}
