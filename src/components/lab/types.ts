// Shared types for the chemistry lab.

export type ExperimentId =
  | "titration"
  | "oxygen_prep"
  | "co2_prep"
  | "nacl_crystal"
  | "ionic_covalent";

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
  | "glowing_splint"
  // CO2 prep
  | "round_bottom_flask"
  | "thistle_funnel"
  | "two_hole_cork"
  | "bent_delivery_tube"
  | "gas_jar"
  | "calcium_carbonate"
  | "dilute_hcl"
  | "limewater"
  | "magnesium_ribbon"
  | "burning_splint"
  | "moist_blue_litmus"
  // NaCl crystallization
  | "mortar_pestle"
  | "impure_salt"
  | "distilled_water"
  | "beaker_1"
  | "beaker_2"
  | "funnel"
  | "filter_paper"
  | "tripod_stand"
  | "wire_gauze"
  | "bunsen_burner"
  | "evaporating_dish"
  | "seed_crystal"
  | "glass_rod"
  // Ionic vs Covalent
  | "nacl_solid"
  | "sugar_solid"
  | "naphthalene_solid"
  | "cuso4_solid"
  | "water_bottle"
  | "test_beaker"
  | "battery"
  | "bulb"
  | "wires"
  | "carbon_electrode"
  | "copper_electrode"
  | "electrolysis_cell"
  | "spatula";

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

export interface CO2Placed {
  round_bottom_flask: boolean;
  calcium_carbonate: boolean; // chips dropped in flask
  cork: boolean; // two-hole cork sealed
  thistle_funnel: boolean; // inserted (tip will submerge once liquid is present)
  delivery_tube: boolean; // bent delivery tube connected
  gas_jar: boolean; // upright gas jar ready
  acid_poured: boolean; // dilute HCl added via thistle funnel (reaction running)
}

export type IonicSubstance = "nacl" | "sugar" | "naphthalene" | "cuso4";

export interface IonicPlaced {
  // Stage 1: solubility
  beakersReady: boolean;
  waterAdded: boolean;
  solubility: Record<IonicSubstance, "dissolved" | "insoluble" | null>;
  // Stage 2: conductivity
  circuitReady: boolean;
  conductivityTested: Record<IonicSubstance, "on" | "off" | null>;
  // Stage 3: melting point
  meltingReady: boolean;
  meltResult: Record<IonicSubstance, "melted" | "solid" | "vaporized" | null>;
  // Stage 4: electrolysis
  cellReady: boolean;
  cuso4InCell: boolean;
  electrodesPlaced: boolean;
  batteryConnected: boolean;
  polarityCorrect: boolean;
  electrolysisRun: boolean;
  copperDeposit: number; // 0-1
}

export interface NaClPlaced {
  mortar: boolean;       // mortar & pestle ready
  beaker_1: boolean;     // dissolving beaker present
  salt: boolean;         // impure salt added (crushed)
  water: boolean;        // distilled water poured
  dissolved: boolean;    // salt fully stirred into water
  filter_setup: boolean; // funnel + filter paper + Beaker-2 set up
  beaker_2: boolean;
  filtered: boolean;     // filtration complete (filtrate in Beaker-2)
  evaporating_dish: boolean;
  heat_setup: boolean;   // tripod + wire gauze + bunsen burner placed
  burning: boolean;      // burner currently on
  cooling: boolean;      // burner off, cooling stage
  seeded: boolean;       // seed crystal introduced
  crystallized: boolean; // crystals fully grown
}

export type TestId = "limewater" | "burning_splint" | "litmus" | "magnesium";
export type TestResult = "pass" | "fail" | "none";

export type MistakeType =
  // Titration
  | "burette_before_clamp"
  | "stopcock_before_naoh"
  | "stopcock_before_indicator"
  | "no_flask"
  | "over_titration"
  | "incomplete_submit"
  // Oxygen prep
  | "no_manganese_dioxide"
  | "missing_delivery_tube"
  | "early_splint_test"
  // CO2 prep
  | "funnel_not_submerged"
  | "open_reaction_flask"
  | "wrong_gas_displacement"
  | "no_calcium_carbonate"
  // NaCl crystallization
  | "heat_before_filter"
  | "over_evaporation"
  | "rapid_cooling"
  | "no_seed_crystal"
  | "no_distilled_water";

export type Severity = "low" | "med" | "high";

export interface Mistake {
  ts: number;
  type: MistakeType;
  severity: Severity;
  message: string;
}

// ── AI Chat Assistant ──────────────────────────────────────
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type AIContext = {
  experimentId: string;
  mode: "guide" | "student" | "classroom";
  currentStep: number;
  mistakesMade: string[];
  currentChemicals?: string[];
  currentEquipment?: string[];
  goal?: string;
};


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
  // CO2
  VCO2_final?: number;
  VCO2_target?: number;
  tests?: Record<TestId, TestResult>;
  // NaCl
  volumeReductionPct?: number; // how much the filtrate was reduced (target ≈ 50%)
  crystalQuality?: number;     // 0-100, cubic geometry quality
  seedUsed?: boolean;

  accuracy: number; // %
  grade: "A" | "B" | "C" | "D" | "F";
  durationSec: number;
  mistakes: Mistake[];
  steps: Step[];
}
