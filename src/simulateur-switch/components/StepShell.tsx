import { ReactNode } from "react";
import { useSimulateurSwitch, TOTAL_STEPS } from "../SimulateurSwitchContext";

interface Props {
  step: number;
  title: string;
  subStepLabel: string;
  children?: ReactNode;
}

export function StepShell({ step, title, subStepLabel, children }: Props) {
  const { prev, next, step: current } = useSimulateurSwitch();
  const isFirst = current === 1;
  const isLast = current === TOTAL_STEPS;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Étape {step} — {title}
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Placeholder — sera implémenté à la {subStepLabel}.
      </p>

      {children}

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={prev}
          disabled={isFirst}
          className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={next}
          disabled={isLast}
          className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shadow-emerald-500/30"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
