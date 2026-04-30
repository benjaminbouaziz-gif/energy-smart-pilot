// Dynawatt savings simulation logic

const TRV_PRICE = 0.21; // €/kWh TTC
const DYNAWATT_PRICE = 0.141; // €/kWh TTC moyen

export interface SimulationInputs {
  type: "pro" | "particulier";
  annualBudget?: number;
  activity?: string;
  hasPool?: boolean;
  hasAc?: boolean;
  hasHeatPump?: boolean;
  hasEv?: boolean;
  surface?: number;
}

export interface SimulationResult {
  annualConsumption: number;
  currentCost: number;
  dynawattCost: number;
  annualSavings: number;
  monthlySavings: number;
  savingsPct: number;
  recommendedConfig: { code: string; label: string; size: string };
  estimatedRoiYears: number;
}

const PRO_CONSUMPTION: Record<string, number> = {
  restaurant: 50000,
  hotel: 150000,
  camping: 90000,
  bakery: 70000,
  artisan: 60000,
  other: 60000,
};

function estimateConsumption(inputs: SimulationInputs): number {
  if (inputs.annualBudget && inputs.annualBudget > 0) {
    return inputs.annualBudget / TRV_PRICE;
  }
  if (inputs.type === "pro") {
    return PRO_CONSUMPTION[inputs.activity || "other"] || 60000;
  }
  // particulier baseline
  let base = 6000;
  if (inputs.surface) base = Math.max(3500, inputs.surface * 35);
  if (inputs.hasPool) base += 3500;
  if (inputs.hasAc) base += 2500;
  if (inputs.hasHeatPump) base += 4500;
  if (inputs.hasEv) base += 2500;
  return base;
}

export function recommendConfig(consumption: number) {
  if (consumption < 15000) return { code: "config_1", label: "Mono 3kW", size: "7,3 kWh" };
  if (consumption < 50000) return { code: "config_2", label: "Tri 6kW", size: "10,8 kWh" };
  if (consumption < 100000) return { code: "config_3", label: "Tri 10kW", size: "14,4 kWh" };
  if (consumption < 200000) return { code: "config_5", label: "Tri 15kW", size: "29 kWh" };
  return { code: "config_6", label: "Tri 20kW", size: "36 kWh" };
}

export function simulateSavings(inputs: SimulationInputs): SimulationResult {
  const annualConsumption = estimateConsumption(inputs);
  const currentCost = annualConsumption * TRV_PRICE;
  const dynawattCost = annualConsumption * DYNAWATT_PRICE;
  const annualSavings = currentCost - dynawattCost;
  const config = recommendConfig(annualConsumption);
  // Approx leasing cost — simplified
  const leasingMonthly = inputs.type === "pro" ? 320 : 75;
  const annualLeasing = leasingMonthly * 12;
  const netAnnualGain = Math.max(annualSavings - annualLeasing * 0.3, annualSavings * 0.5);
  const estimatedRoiYears = Math.max(1.2, Math.min(7, (annualLeasing * 5) / Math.max(annualSavings, 1) ));

  return {
    annualConsumption,
    currentCost,
    dynawattCost,
    annualSavings,
    monthlySavings: annualSavings / 12,
    savingsPct: (annualSavings / currentCost) * 100,
    recommendedConfig: config,
    estimatedRoiYears: Number(estimatedRoiYears.toFixed(1)),
  };
}

export const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
