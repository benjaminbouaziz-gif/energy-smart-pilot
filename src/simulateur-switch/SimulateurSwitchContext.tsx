import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

interface SimulateurSwitchState {
  prospectId: string | null;
  step: number;
  data: Record<string, any>;
}

interface SimulateurSwitchContextValue extends SimulateurSwitchState {
  next: () => void;
  prev: () => void;
  goToStep: (n: number) => void;
  updateData: (patch: Partial<Record<string, any>>) => void;
  reset: () => void;
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
  const [data, setData] = useState<Record<string, any>>({});

  const next = useCallback(() => setStep((s) => Math.min(TOTAL_STEPS, s + 1)), []);
  const prev = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);
  const goToStep = useCallback((n: number) => setStep(Math.max(1, Math.min(TOTAL_STEPS, n))), []);
  const updateData = useCallback((patch: Partial<Record<string, any>>) => {
    setData((d) => ({ ...d, ...patch }));
  }, []);
  const reset = useCallback(() => {
    setStep(1);
    setData({});
  }, []);

  const value = useMemo<SimulateurSwitchContextValue>(
    () => ({ prospectId, step, data, next, prev, goToStep, updateData, reset }),
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
