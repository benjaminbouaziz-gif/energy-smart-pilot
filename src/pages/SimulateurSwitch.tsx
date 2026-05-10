import { useParams } from "react-router-dom";
import { SimulateurSwitchProvider, useSimulateurSwitch } from "@/simulateur-switch/SimulateurSwitchContext";
import { WizardHeader } from "@/simulateur-switch/components/WizardHeader";
import Step1Identite from "@/simulateur-switch/steps/Step1Identite";
import Step2Switchgrid from "@/simulateur-switch/steps/Step2Switchgrid";
import Step3AnalyseConso from "@/simulateur-switch/steps/Step3AnalyseConso";
import Step4TarifConcurrent from "@/simulateur-switch/steps/Step4TarifConcurrent";
import Step5CalculSobry from "@/simulateur-switch/steps/Step5CalculSobry";
import Step6Comparaison from "@/simulateur-switch/steps/Step6Comparaison";
import Step7Animation from "@/simulateur-switch/steps/Step7Animation";
import Step8Financement from "@/simulateur-switch/steps/Step8Financement";

function WizardBody() {
  const { step } = useSimulateurSwitch();
  return (
    <div className="simulator-light relative min-h-screen pb-16 bg-background text-foreground">
      <WizardHeader />
      <div className="max-w-5xl mx-auto">
        {step === 1 && <Step1Identite />}
        {step === 2 && <Step2Switchgrid />}
        {step === 3 && <Step3AnalyseConso />}
        {step === 4 && <Step4TarifConcurrent />}
        {step === 5 && <Step5CalculSobry />}
        {step === 6 && <Step6Comparaison />}
        {step === 7 && <Step7Animation />}
        {step === 8 && <Step8Financement />}
      </div>
    </div>
  );
}

export default function SimulateurSwitch() {
  const { prospect_id } = useParams<{ prospect_id: string }>();
  return (
    <SimulateurSwitchProvider prospectId={prospect_id ?? null}>
      <WizardBody />
    </SimulateurSwitchProvider>
  );
}
