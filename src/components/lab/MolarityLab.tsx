import MoleConceptLab from "./MoleConceptLab";

export default function MolarityLab({ onBack }: { onBack: () => void }) {
  return <MoleConceptLab onBack={onBack} forcedMode="molarity" />;
}
