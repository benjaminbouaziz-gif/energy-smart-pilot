import { SimulatorProvider, useSimulator } from "@/simulator/SimulatorContext";
import { WizardHeader } from "@/simulator/components/WizardHeader";
import Step1Client from "@/simulator/steps/Step1Client";
import Step2Upload from "@/simulator/steps/Step2Upload";
import Step3Config from "@/simulator/steps/Step3Config";
import Step4Comparison from "@/simulator/steps/Step4Comparison";
import Step5Animations from "@/simulator/steps/Step5Animations";
import Step6Financing from "@/simulator/steps/Step6Financing";

function WizardBody() {
  const { step } = useSimulator();
  return (
    <div className="min-h-screen pb-16">
      <WizardHeader />
      {step === 1 && <Step1Client />}
      {step === 2 && <Step2Upload />}
      {step === 3 && <Step3Config />}
      {step === 4 && <Step4Comparison />}
      {step === 5 && <Step5Animations />}
      {step === 6 && <Step6Financing />}
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
