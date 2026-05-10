import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

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
  // Optional manual extras
  kva?: number;
}

export interface SimulateurSwitchData {
  identite?: SimulateurSwitchIdentite;
  switchgrid?: SimulateurSwitchSwitchgrid;
  loadCurve?: SimulateurSwitchLoadCurve;
  [k: string]: any;
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
  getIdentite: () => SimulateurSwitchIdentite | undefined;
  getSwitchgrid: () => SimulateurSwitchSwitchgrid | undefined;
  getLoadCurve: () => SimulateurSwitchLoadCurve | undefined;
}

const SimulateurSwitchContext = createContext<SimulateurSwitchContextValue | null>(null);

export const TOTAL_STEPS = 8;

export function SimulateurSwitchProvider({
  children,
  prospectId = null,
}: {
  children: ReactNode;
  prospectId?: string | null;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SimulateurSwitchData>({});

  const next = useCallback(() => setStep((s) => Math.min(TOTAL_STEPS, s + 1)), []);
  const prev = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);
  const goToStep = useCallback((n: number) => setStep(Math.max(1, Math.min(TOTAL_STEPS, n))), []);
  const updateData = useCallback((patch: Partial<SimulateurSwitchData>) => {
    setData((d) => ({ ...d, ...patch }));
  }, []);
  const reset = useCallback(() => {
    setStep(1);
    setData({});
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
      getIdentite: () => data.identite,
      getSwitchgrid: () => data.switchgrid,
      getLoadCurve: () => data.loadCurve,
    }),
    [prospectId, step, data, next, prev, goToStep, updateData, reset]
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
