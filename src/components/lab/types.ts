// Shared types for the chemistry lab.

export type ExperimentId =
  | "titration"
  | "oxygen_prep"
  | "co2_prep"
  | "nacl_crystal"
  | "ionic_covalent"
  | "na2co3_standard"
  | "cuso4_water"
  | "ph_scale"
  | "indicator_compare"
  | "solubility_rules"
  | "electrochemical_series"
  | "bonding_basics"
  | "electron_config"
  | "periodic_trends"
  | "group_reactivity"
  | "periodic_anomalies"
  | "kinetic_theory"
  | "diffusion_race"
  | "heating_curve"
  | "atom_builder"
  | "atom_models"
  | "aufbau_principle"
  | "isotope_stability"
  | "metallic_bonding"
  | "ionic_vs_covalent_theory"
  | "mole_concept"
  | "molarity_dilution"
  | "empirical_formula"
  | "limiting_reactant"
  | "stp_molar_volume"
  | "daniel_cell"
  | "electrolytic_cell"
  | "dry_cell"
  | "fuel_combustion"
  | "bond_energy_calorimeter"
  | "role_of_water"
  | "acid_base_strength"
  | "neutralization_reaction"
  | "antacid_action"
  | "minerals_vs_rocks"
  | "ores_vs_minerals"
  | "metallurgy_steps"
  | "blast_furnace"
  | "electrolytic_refining"
  | "corrosion_rusting"
  | "petroleum_distillation"
  | "hydrocarbon_3d"
  | "unsaturation_test";


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
  | "spatula"
  // Na2CO3 standard solution
  | "balance"
  | "watch_glass"
  | "na2co3_solid"
  | "volumetric_flask_250"
  | "wash_bottle"
  | "stopper"
  // CuSO4·5H2O crystallization water
  | "crucible"
  | "cuso4_hydrated"
  | "desiccator"
  | "tongs";

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

export interface CuSO4Placed {
  // Weighing
  balanceOn: boolean;
  crucibleOnBalance: boolean;
  emptyCrucibleMass: number;     // x (g) ~20
  weighedEmpty: boolean;
  tared: boolean;
  hydratedSampleMass: number;    // sample added (y - x)
  weighedHydrated: boolean;
  // Heating
  tripodReady: boolean;
  crucibleOnTripod: boolean;
  burnerOn: boolean;
  heatingTime: number;           // accumulated seconds
  dehydrationFraction: number;   // 0..1
  stirred: number;               // gentle stir count
  spilled: boolean;
  // Cooling
  inDesiccator: boolean;
  cooledTime: number;
  cooled: boolean;
  touchedBare: boolean;
  // Final weigh
  weighedAnhydrous: boolean;
  finalCrucibleMass: number;     // z (g)
}

export interface Na2CO3Placed {
  balanceOn: boolean;
  watchGlassOnBalance: boolean;
  watchGlassMass: number;   // initial tare mass (~26 g)
  tared: boolean;
  actualAddedMass: number;  // grams of Na2CO3 on watch glass
  flaskReady: boolean;
  funnelOnFlask: boolean;
  soluteTransferred: boolean;
  washedDown: boolean;
  initialDissolved: boolean;
  addedWaterVolume: number; // mL in flask (0-260)
  meniscusChecked: boolean;
  stoppered: boolean;
  shaken: boolean;
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
  | "no_distilled_water"
  // Ionic vs Covalent + Electrolysis
  | "naphthalene_overheated"
  | "conductivity_solid_salt"
  | "reversed_electrodes"
  | "no_water_for_conductivity"
  | "skipped_stage"
  // Na2CO3 standard solution
  | "no_funnel_pour"
  | "overfill_meniscus"
  | "not_tared"
  | "not_washed_down"
  | "shaken_early"
  // CuSO4·5H2O
  | "not_weighed_empty"
  | "spilled_crystals"
  | "under_heated"
  | "touched_hot_crucible"
  | "weighed_hot";

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
  // Ionic vs Covalent
  solubilityScore?: number;
  conductivityScore?: number;
  meltingScore?: number;
  electrolysisScore?: number;
  copperDepositPct?: number;
  // Na2CO3 standard solution
  actualMassG?: number;
  actualVolumeMl?: number;
  finalMolarity?: number;
  massError?: number;
  volumeError?: number;
  // CuSO4·5H2O crystallization water
  cuEmptyMass?: number;        // x
  cuHydratedMass?: number;     // y
  cuAnhydrousMass?: number;    // z
  cuWaterPct?: number;
  cuTheoreticalPct?: number;






  accuracy: number; // %
  grade: "A" | "B" | "C" | "D" | "F";
  durationSec: number;
  mistakes: Mistake[];
  steps: Step[];
}
