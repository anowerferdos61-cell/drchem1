// Shared types for the chemistry lab.

export type ExperimentId = "titration" | "oxygen_prep";

export type Mode = "guide" | "student" | "classroom";

export type EquipmentId =
  // Titration
  | "flask"
  | "burette"
  | "beaker"
  | "pipette"
  | "hcl"
  | "naoh"
  | "phenolphthalein"
  | "clamp"
  // Oxygen prep
  | "test_tube_reaction"
  | "delivery_tube"
  | "water_trough"
  | "test_tube_collection"
  | "hydrogen_peroxide"
  | "manganese_dioxide"
  | "glowing_splint";

export interface Placed {
  flask: boolean;
  burette: boolean;
  clamp: boolean;
  hcl: boolean;
  naoh: boolean;
  indicator: boolean;
}

export interface OxygenPlaced {
  reaction_tube: boolean;
  manganese_dioxide: boolean;
  delivery_tube: boolean;
  water_trough: boolean;
  collection_tube: boolean;
  hydrogen_peroxide: boolean; // poured (reaction running)
}

export type MistakeType =
  | "burette_before_clamp"
  | "stopcock_before_naoh"
  | "stopcock_before_indicator"
  | "no_flask"
  | "over_titration"
  | "incomplete_submit"
  // Oxygen prep
  | "no_manganese_dioxide"
  | "missing_delivery_tube"
  | "early_splint_test";

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
  experiment: ExperimentId;
  // Titration
  Vb_final?: number;
  Ve?: number;
  // Oxygen
  VO2_final?: number;
  VO2_target?: number;
  splintResult?: "pass" | "early" | "none";

  accuracy: number; // %
  grade: "A" | "B" | "C" | "D" | "F";
  durationSec: number;
  mistakes: Mistake[];
  steps: Step[];
}
