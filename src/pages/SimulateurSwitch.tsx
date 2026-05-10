import { useParams } from "react-router-dom";
import { SimulateurSwitchProvider, useSimulateurSwitch } from "@/simulateur-switch/SimulateurSwitchContext";
import { Stepper } from "@/simulateur-switch/components/Stepper";
import Step1_Identite from "@/simulateur-switch/steps/Step1_Identite";
import Step2_Switchgrid from "@/simulateur-switch/steps/Step2_Switchgrid";
import Step3_AnalyseConso from "@/simulateur-switch/steps/Step3_AnalyseConso";
import Step4_TarifConcurrent from "@/simulateur-switch/steps/Step4_TarifConcurrent";
import Step5_CalculSobry from "@/simulateur-switch/steps/Step5_CalculSobry";
import Step6_Comparaison from "@/simulateur-switch/steps/Step6_Comparaison";
import Step7_Animations from "@/simulateur-switch/steps/Step7_Animations";
import Step8_Financing from "@/simulateur-switch/steps/Step8_Financing";

function Body() {
  const { step } = useSimulateurSwitch();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Simulateur Sobry</h1>
          <p className="text-sm text-gray-500 mt-1">Outil commercial</p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6">
          <Stepper />
        </div>

        {step === 1 && <Step1_Identite />}
        {step === 2 && <Step2_Switchgrid />}
        {step === 3 && <Step3_AnalyseConso />}
        {step === 4 && <Step4_TarifConcurrent />}
        {step === 5 && <Step5_CalculSobry />}
        {step === 6 && <Step6_Comparaison />}
        {step === 7 && <Step7_Animations />}
        {step === 8 && <Step8_Financing />}
      </div>
    </div>
  );
}

export default function SimulateurSwitch() {
  const { prospect_id } = useParams();
  return (
    <SimulateurSwitchProvider prospectId={prospect_id ?? null}>
      <Body />
    </SimulateurSwitchProvider>
  );
}
