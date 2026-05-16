// Shared types for the chemistry lab.

export type Mode = "guide" | "student" | "classroom";

export type EquipmentId =
  | "flask"
  | "burette"
  | "beaker"
  | "pipette"
  | "hcl"
  | "naoh"
  | "phenolphthalein";

export interface Placed {
  flask: boolean;
  burette: boolean;
  clamp: boolean;
  hcl: boolean; // HCl poured into flask
  naoh: boolean; // NaOH filled in burette
  indicator: boolean; // phenolphthalein added
}

export type MistakeType =
  | "burette_before_clamp"
  | "stopcock_before_naoh"
  | "stopcock_before_indicator"
  | "no_flask"
  | "over_titration"
  | "incomplete_submit";

export type Severity = "low" | "med" | "high";

export interface Mistake {
  ts: number;
  type: MistakeType;
  severity: Severity;
  message: string;
}

export interface Step {
  id: string;
  label: string; // bilingual
  done: boolean;
}

export interface Report {
  Vb_final: number;
  Ve: number;
  accuracy: number; // %
  grade: "A" | "B" | "C" | "D" | "F";
  durationSec: number;
  mistakes: Mistake[];
  steps: Step[];
}
