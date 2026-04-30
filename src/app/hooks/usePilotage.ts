// Store léger pour les modes Pilotage (persistance localStorage)
import { useEffect, useState } from "react";

export type VacationMode = {
  active: boolean;
  startDate?: string; // ISO
  endDate?: string;
};

export type EventMode = {
  active: boolean;
  date?: string; // ISO datetime
  type?: "mariage" | "seminaire" | "pic" | "autre";
  label?: string;
};

export type ComfortPrefs = {
  tempMin: number; // °C
  tempMax: number;
  batteryReservePct: number;
  ecsCriticalRanges: string[]; // ["07:00-09:00", ...]
};

export type CriticalSlots = {
  // 7 jours × 24 heures (true = créneau intouchable)
  grid: boolean[][];
};

export type PilotageState = {
  vacation: VacationMode;
  event: EventMode;
  comfort: ComfortPrefs;
  critical: CriticalSlots;
  autoMode: boolean; // pilotage auto vs manuel
};

const KEY = "dynawatt-pilotage";

const defaultState: PilotageState = {
  vacation: { active: false },
  event: { active: false },
  comfort: {
    tempMin: 19,
    tempMax: 24,
    batteryReservePct: 20,
    ecsCriticalRanges: ["07:00-09:00", "18:00-20:00"],
  },
  critical: {
    grid: Array.from({ length: 7 }, () => Array(24).fill(false)),
  },
  autoMode: true,
};

function loadState(): PilotageState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<PilotageState>;
    return {
      ...defaultState,
      ...parsed,
      comfort: { ...defaultState.comfort, ...(parsed.comfort ?? {}) },
      critical: parsed.critical ?? defaultState.critical,
      vacation: { ...defaultState.vacation, ...(parsed.vacation ?? {}) },
      event: { ...defaultState.event, ...(parsed.event ?? {}) },
    };
  } catch {
    return defaultState;
  }
}

const listeners = new Set<(s: PilotageState) => void>();
let currentState = loadState();

function setState(updater: (s: PilotageState) => PilotageState) {
  currentState = updater(currentState);
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(currentState));
  }
  listeners.forEach((l) => l(currentState));
}

export function usePilotage() {
  const [state, setLocal] = useState<PilotageState>(currentState);
  useEffect(() => {
    listeners.add(setLocal);
    return () => {
      listeners.delete(setLocal);
    };
  }, []);

  return {
    state,
    setVacation: (v: VacationMode) => setState((s) => ({ ...s, vacation: v })),
    setEvent: (e: EventMode) => setState((s) => ({ ...s, event: e })),
    setComfort: (c: Partial<ComfortPrefs>) => setState((s) => ({ ...s, comfort: { ...s.comfort, ...c } })),
    toggleCriticalSlot: (day: number, hour: number) =>
      setState((s) => {
        const grid = s.critical.grid.map((row) => [...row]);
        grid[day][hour] = !grid[day][hour];
        return { ...s, critical: { grid } };
      }),
    clearCriticalSlots: () =>
      setState((s) => ({ ...s, critical: { grid: Array.from({ length: 7 }, () => Array(24).fill(false)) } })),
    setAutoMode: (auto: boolean) => setState((s) => ({ ...s, autoMode: auto })),
    reset: () => setState(() => defaultState),
  };
}

// Helper : mode actif courant
export function getActiveMode(state: PilotageState): { type: "vacation" | "event" | "manual" | "auto"; label: string } {
  if (state.vacation.active && state.vacation.endDate && new Date(state.vacation.endDate) > new Date()) {
    const end = new Date(state.vacation.endDate);
    return {
      type: "vacation",
      label: `Mode Vacances jusqu'au ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
    };
  }
  if (state.event.active && state.event.date && new Date(state.event.date) > new Date()) {
    const d = new Date(state.event.date);
    return {
      type: "event",
      label: `Événement programmé ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
    };
  }
  if (!state.autoMode) return { type: "manual", label: "Pilotage manuel" };
  return { type: "auto", label: "Pilotage automatique" };
}
