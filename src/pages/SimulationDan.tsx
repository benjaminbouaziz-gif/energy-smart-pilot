import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { SimulatorProvider, useSimulator } from "@/simulator/SimulatorContext";
import { WizardHeader } from "@/simulator/components/WizardHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Step1Client from "@/simulator/steps/Step1Client";
import Step2Upload from "@/simulator/steps/Step2Upload";
import Step3Config from "@/simulator/steps/Step3Config";
import Step4Comparison from "@/simulator/steps/Step4Comparison";
import Step5Animations from "@/simulator/steps/Step5Animations";
import Step6Financing from "@/simulator/steps/Step6Financing";

function PrefillFromProspect({ prospectId }: { prospectId: string }) {
  const { setClient, setSobryDocs, setConfigChoisie, goToStep } = useSimulator();

  useEffect(() => {
    (async () => {
      const { data: p, error } = await supabase
        .from("prospects")
        .select("*")
        .eq("id", prospectId)
        .single();
      if (error || !p) {
        toast.error("Prospect introuvable");
        return;
      }
      setClient({
        nom: p.nom_entreprise ?? "",
        email: p.email ?? "",
        telephone: p.telephone ?? "",
        pdl: p.pdl ?? "",
        adresse: p.adresse_pdl ?? "",
      });
      if (p.config_choisie) setConfigChoisie(p.config_choisie as any);

      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("prospect_id", prospectId)
        .eq("type", "json_sobry");
      if (docs && docs.length) {
        setSobryDocs(
          docs.map((d: any) => ({ mois: d.mois_concerne ?? d.nom_fichier, data: d.data }))
        );
      }
      // Si on a déjà tout, on saute à l'étape 3
      if (p.pdl && docs && docs.length) goToStep(3);
      toast.success("Prospect chargé");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  return null;
}

function WizardBody({ prospectId }: { prospectId?: string }) {
  const { step } = useSimulator();
  return (
    <div className="simulator-light relative min-h-screen pb-16 bg-background text-foreground">
      <div className="bg-primary/10 border-b border-primary/20 text-primary px-4 py-2 text-sm flex items-center justify-center gap-2">
        <Lock className="w-4 h-4" />
        <span className="font-medium">Mode interne — Simulation commerciale Dynawatt</span>
      </div>
      {prospectId && <PrefillFromProspect prospectId={prospectId} />}
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

export default function SimulationDan() {
  const { prospect_id } = useParams<{ prospect_id: string }>();
  return (
    <SimulatorProvider internalMode prospectId={prospect_id ?? null}>
      <WizardBody prospectId={prospect_id} />
    </SimulatorProvider>
  );
}
