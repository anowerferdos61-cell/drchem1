import MoleConceptLab from "./MoleConceptLab";

export default function EmpiricalFormulaLab({ onBack }: { onBack: () => void }) {
  return <MoleConceptLab onBack={onBack} forcedMode="empirical" />;
}
