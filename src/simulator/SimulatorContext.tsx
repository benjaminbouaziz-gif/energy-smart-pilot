import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ConfigKey, FactureActuelle, SimulationResult } from "@/lib/dynawatt-engine";

export interface ClientInfo {
  nom: string;
  email: string;
  telephone: string;
  pdl: string;
  adresse: string;
}

export interface SobryDoc {
  mois: string;
  data: any;
}

interface SimulatorState {
  simulationId: string | null;
  step: number;
  client: ClientInfo;
  facture: FactureActuelle | null;
  sobryDocs: SobryDoc[];
  configChoisie: ConfigKey | null;
  result: SimulationResult | null;
  customPriceHT: number | null;
}

interface SimulatorContextValue extends SimulatorState {
  setClient: (c: ClientInfo) => void;
  setFacture: (f: FactureActuelle | null) => void;
  setSobryDocs: (docs: SobryDoc[]) => void;
  setConfigChoisie: (c: ConfigKey | null) => void;
  setResult: (r: SimulationResult | null) => void;
  setCustomPriceHT: (n: number | null) => void;
  goToStep: (n: number) => void;
  next: () => void;
  prev: () => void;
  saveStep1: () => Promise<void>;
  saveProgress: (patch: Record<string, any>) => Promise<void>;
  reset: () => void;
  internalMode: boolean;
  prospectId: string | null;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

const emptyClient: ClientInfo = {
  nom: "",
  email: "",
  telephone: "",
  pdl: "",
  adresse: "",
};

export function SimulatorProvider({
  children,
  internalMode = false,
  prospectId = null,
}: {
  children: ReactNode;
  internalMode?: boolean;
  prospectId?: string | null;
}) {
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [client, setClient] = useState<ClientInfo>(emptyClient);
  const [facture, setFacture] = useState<FactureActuelle | null>(null);
  const [sobryDocs, setSobryDocs] = useState<SobryDoc[]>([]);
  const [configChoisie, setConfigChoisie] = useState<ConfigKey | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [customPriceHT, setCustomPriceHT] = useState<number | null>(null);

  const saveStep1 = useCallback(async () => {
    if (simulationId) {
      await supabase
        .from("simulations")
        .update({
          client_nom: client.nom,
          client_email: client.email,
          client_telephone: client.telephone,
          client_pdl: client.pdl,
          client_adresse: client.adresse,
          current_step: 2,
        })
        .eq("id", simulationId);
      return;
    }
    const { data, error } = await supabase
      .from("simulations")
      .insert({
        client_nom: client.nom,
        client_email: client.email,
        client_telephone: client.telephone,
        client_pdl: client.pdl,
        client_adresse: client.adresse,
        current_step: 2,
      })
      .select("id")
      .single();
    if (error) throw error;
    setSimulationId(data.id);
  }, [client, simulationId]);

  const saveProgress = useCallback(
    async (patch: Record<string, any>) => {
      if (!simulationId) return;
      await supabase.from("simulations").update(patch as any).eq("id", simulationId);
    },
    [simulationId]
  );

  const goToStep = useCallback((n: number) => setStep(Math.max(1, Math.min(6, n))), []);
  const next = useCallback(() => setStep((s) => Math.min(6, s + 1)), []);
  const prev = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  const reset = useCallback(() => {
    setSimulationId(null);
    setStep(1);
    setClient(emptyClient);
    setFacture(null);
    setSobryDocs([]);
    setConfigChoisie(null);
    setResult(null);
  }, []);

  const value = useMemo<SimulatorContextValue>(
    () => ({
      simulationId,
      step,
      client,
      facture,
      sobryDocs,
      configChoisie,
      result,
      customPriceHT,
      setClient,
      setFacture,
      setSobryDocs,
      setConfigChoisie,
      setResult,
      setCustomPriceHT,
      goToStep,
      next,
      prev,
      saveStep1,
      saveProgress,
      reset,
      internalMode,
      prospectId,
    }),
    [simulationId, step, client, facture, sobryDocs, configChoisie, result, customPriceHT, goToStep, next, prev, saveStep1, saveProgress, reset, internalMode, prospectId]
  );

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>;
}

export function useSimulator() {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error("useSimulator must be used within SimulatorProvider");
  return ctx;
}
