import { useParams } from "react-router-dom";
import { SimulateurSwitchProvider, useSimulateurSwitch } from "@/simulateur-switch/SimulateurSwitchContext";
import { WizardHeader } from "@/simulateur-switch/components/WizardHeader";
import Step1Identite from "@/simulateur-switch/steps/Step1Identite";
import Step2Switchgrid from "@/simulateur-switch/steps/Step2Switchgrid";
import Step3AnalyseConso from "@/simulateur-switch/steps/Step3AnalyseConso";
import Step4TarifConcurrent from "@/simulateur-switch/steps/Step4TarifConcurrent";
import Step5Comparaison from "@/simulateur-switch/steps/Step5Comparaison";
import Step6Animation from "@/simulateur-switch/steps/Step6Animation";
import Step7Financement from "@/simulateur-switch/steps/Step7Financement";

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
        {step === 5 && <Step5SobryComparaison />}
        {step === 6 && <Step6Animation />}
        {step === 7 && <Step7Financement />}
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
