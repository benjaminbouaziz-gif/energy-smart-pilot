import { create } from "zustand";
import type { LoadCurvePoint } from "./transformer";

type State = {
  loadCurve: LoadCurvePoint[] | null;
  prm: string | null;
  setResult: (prm: string, loadCurve: LoadCurvePoint[]) => void;
  clear: () => void;
};

export const useSwitchgridStore = create<State>((set) => ({
  loadCurve: null,
  prm: null,
  setResult: (prm, loadCurve) => set({ prm, loadCurve }),
  clear: () => set({ prm: null, loadCurve: null }),
}));
