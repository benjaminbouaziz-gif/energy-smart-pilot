import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export interface SimulateurSwitchIdentite {
  civilite: "M" | "Mme";
  prenom: string;
  nom: string;
  adresse: string;
  email: string;
  telephone: string;
  estPro: boolean;
  nomEntreprise?: string;
}

export type SwitchgridStatus =
  | "INIT"
  | "SEARCHING"
  | "CONTRACTS_FOUND"
  | "AWAITING_SIGNATURE"
  | "FETCHING_DATA"
  | "READY"
  | "FAILED"
  | "PAUSED";

export interface SimulateurSwitchSwitchgrid {
  sessionId: string | null;
  prm: string | null;
  contractInfo: {
    signerName?: string;
    address?: string;
    segment?: string;
  } | null;
  askId: string | null;
  consentId: string | null;
  orderId: string | null;
  loadcurveRequestId: string | null;
  status: SwitchgridStatus;
}

export interface SimulateurSwitchLoadCurve {
  hourlyKwh: number[];
  windowStart: string;
  windowEnd: string;
  qualityScore: number;
  totalKwh: number;
  warnings: string[];
  source: "switchgrid" | "manual";
  kva?: number;
}

export interface SimulateurSwitchTarifConcurrent {
  fournisseur?: string;
  structure: "BASE" | "HC_HP" | "SUPER_CREUSES";
  abonnementMensuelHt: number;
  tvaPct: number;
  prixKwhHt?: number;
  prixHpHt?: number;
  prixHcHt?: number;
  plageHcDebut?: number;
  plageHcFin?: number;
  prixHscHt?: number;
  plageHscDebut?: number;
  plageHscFin?: number;
}

export interface SimulateurSwitchFactureConcurrent {
  annual: {
    total_ht: number;
    total_ttc: number;
    cost_variable_ht: number;
    cost_fixe_ht: number;
    conso_kwh: number;
    prix_moyen_eur_kwh_ttc: number;
  };
  monthly: { month: string; conso_kwh: number; total_ht: number; total_ttc: number }[];
  repartition_horaire: {
    heures_hp_kwh: number;
    heures_hc_kwh: number;
    heures_hsc_kwh?: number;
  };
}

export interface SimulateurSwitchSobryParams {
  kva: number;
  variante: "CU4" | "MU4" | "CU" | "LU";
  offre: "SoFlex";
  segment_client: "Particulier" | "Pro";
  segment: "C5" | "C4";
  configBatterie: "PETIT" | "MOYEN";
}

export interface SimulateurSwitchFactureSobry {
  annual: {
    total_ht: number;
    total_ttc: number;
    cost_variable_ht: number;
    cost_fixe_ht: number;
    conso_kwh: number;
    prix_moyen_eur_kwh_ttc: number;
  };
  monthly: {
    month: string;
    conso_kwh: number;
    total_ht: number;
    total_ttc: number;
    cost_variable_ht: number;
    cost_fixe_ht: { total: number };
  }[];
  details_horaires: any[];
  metadata: any;
}

export interface SimulateurSwitchFactureSobryAvecBatterie {
  configKey: "PETIT" | "MOYEN";
  annual: {
    total_ttc_apres_batterie: number;
    economies_annuelles_ttc: number;
    prix_batterie_ttc: number;
    retour_sur_investissement_ans: number;
    cycles_par_jour_moyen?: number;
  };
  monthly: { month: string; total_ttc_apres_batterie: number }[];
  simulationResult: any;
}

export interface SimulateurSwitchData {
  identite?: SimulateurSwitchIdentite;
  switchgrid?: SimulateurSwitchSwitchgrid;
  loadCurve?: SimulateurSwitchLoadCurve;
  tarifConcurrent?: SimulateurSwitchTarifConcurrent;
  factureConcurrent?: SimulateurSwitchFactureConcurrent;
  sobryParams?: SimulateurSwitchSobryParams;
  factureSobry?: SimulateurSwitchFactureSobry;
  factureSobryAvecBatterie?: SimulateurSwitchFactureSobryAvecBatterie;
  simulationResult?: any;
  [k: string]: any;
}

interface PersistedState {
  step: number;
  data: SimulateurSwitchData;
}

interface SimulateurSwitchContextValue {
  prospectId: string | null;
  step: number;
  data: SimulateurSwitchData;
  next: () => void;
  prev: () => void;
  goToStep: (n: number) => void;
  updateData: (patch: Partial<SimulateurSwitchData>) => void;
  reset: () => void;
  resetSimulation: () => void;
  getIdentite: () => SimulateurSwitchIdentite | undefined;
  getSwitchgrid: () => SimulateurSwitchSwitchgrid | undefined;
  getLoadCurve: () => SimulateurSwitchLoadCurve | undefined;
}

const SimulateurSwitchContext = createContext<SimulateurSwitchContextValue | null>(null);

export const TOTAL_STEPS = 8;
const STORAGE_KEY = "simulateur-switch-state";
const INITIAL_STATE: PersistedState = { step: 1, data: {} };

function loadInitial(): PersistedState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && typeof parsed.step === "number") {
        return { step: parsed.step, data: parsed.data ?? {} };
      }
    }
  } catch {}
  return INITIAL_STATE;
}

export function SimulateurSwitchProvider({
  children,
  prospectId = null,
}: {
  children: ReactNode;
  prospectId?: string | null;
}) {
  const [state, setState] = useState<PersistedState>(() => loadInitial());
  const { step, data } = state;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const next = useCallback(() => setState((s) => ({ ...s, step: Math.min(TOTAL_STEPS, s.step + 1) })), []);
  const prev = useCallback(() => setState((s) => ({ ...s, step: Math.max(1, s.step - 1) })), []);
  const goToStep = useCallback((n: number) => setState((s) => ({ ...s, step: Math.max(1, Math.min(TOTAL_STEPS, n)) })), []);
  const updateData = useCallback((patch: Partial<SimulateurSwitchData>) => {
    setState((s) => ({ ...s, data: { ...s.data, ...patch } }));
  }, []);
  const reset = useCallback(() => setState(INITIAL_STATE), []);
  const resetSimulation = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setState(INITIAL_STATE);
  }, []);

  const value = useMemo<SimulateurSwitchContextValue>(
    () => ({
      prospectId,
      step,
      data,
      next,
      prev,
      goToStep,
      updateData,
      reset,
      resetSimulation,
      getIdentite: () => data.identite,
      getSwitchgrid: () => data.switchgrid,
      getLoadCurve: () => data.loadCurve,
    }),
    [prospectId, step, data, next, prev, goToStep, updateData, reset, resetSimulation]
  );

  return (
    <SimulateurSwitchContext.Provider value={value}>{children}</SimulateurSwitchContext.Provider>
  );
}

export function useSimulateurSwitch() {
  const ctx = useContext(SimulateurSwitchContext);
  if (!ctx) throw new Error("useSimulateurSwitch must be used within SimulateurSwitchProvider");
  return ctx;
}
