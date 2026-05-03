import { SimulatorProvider, useSimulator } from "@/simulator/SimulatorContext";
import { WizardHeader } from "@/simulator/components/WizardHeader";
import Step1Client from "@/simulator/steps/Step1Client";
import Step2Upload from "@/simulator/steps/Step2Upload";
import Step3Config from "@/simulator/steps/Step3Config";
import StepPlaceholder from "@/simulator/steps/StepPlaceholder";

function WizardBody() {
  const { step } = useSimulator();
  return (
    <div className="min-h-screen pb-16">
      <WizardHeader />
      {step === 1 && <Step1Client />}
      {step === 2 && <Step2Upload />}
      {step === 3 && <Step3Config />}
      {step === 4 && <StepPlaceholder step={4} title="Comparaison facture initiale vs Sobry+Dynawatt" />}
      {step === 5 && <StepPlaceholder step={5} title="Animations dynamiques (slider date + heatmap)" />}
      {step === 6 && <StepPlaceholder step={6} title="Financement avec cashflow" />}
    </div>
  );
}

export default function Simulation() {
  return (
    <SimulatorProvider>
      <WizardBody />
    </SimulatorProvider>
  );
}
