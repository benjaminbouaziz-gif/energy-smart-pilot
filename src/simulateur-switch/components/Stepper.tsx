import { Check } from "lucide-react";
import { useSimulateurSwitch, TOTAL_STEPS } from "../SimulateurSwitchContext";

const STEPS = [
  "Identité",
  "Switchgrid",
  "Analyse conso",
  "Tarif concurrent",
  "Calcul Sobry",
  "Comparaison",
  "Animations",
  "Leasing",
];

export function Stepper() {
  const { step, goToStep } = useSimulateurSwitch();

  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex items-center justify-between gap-2 min-w-[700px] py-4">
        {STEPS.map((label, idx) => {
          const n = idx + 1;
          const isCurrent = n === step;
          const isDone = n < step;
          const isFuture = n > step;
          const clickable = !isFuture;

          return (
            <li key={n} className="flex-1 flex items-center">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && goToStep(n)}
                className={`flex flex-col items-center gap-2 flex-1 group ${
                  clickable ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all
                    ${isCurrent ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30" : ""}
                    ${isDone ? "bg-emerald-100 border-emerald-300 text-emerald-700" : ""}
                    ${isFuture ? "bg-gray-50 border-gray-200 text-gray-400" : ""}
                  `}
                >
                  {isDone ? <Check className="w-4 h-4" /> : n}
                </div>
                <span
                  className={`text-xs text-center whitespace-nowrap font-medium
                    ${isCurrent ? "text-emerald-700" : ""}
                    ${isDone ? "text-emerald-600" : ""}
                    ${isFuture ? "text-gray-400" : ""}
                  `}
                >
                  {label}
                </span>
              </button>
              {n < TOTAL_STEPS && (
                <div
                  className={`h-0.5 flex-shrink-0 w-6 -mt-6 ${
                    n < step ? "bg-emerald-300" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
