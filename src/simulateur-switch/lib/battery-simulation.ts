import {
  CONFIGS,
  CONSTANTES,
  calculerROI,
  simulerAnnee,
  suggerConfig,
  type ConfigKey,
  type SobryParsed,
  MONTH_NAMES,
} from "@/lib/dynawatt-engine-bis";

export interface BatterySimulationOutput {
  configKey: ConfigKey;
  config: typeof CONFIGS[ConfigKey];
  annual: {
    total_ttc_apres_batterie: number;
    economies_annuelles_ttc: number;
    prix_batterie_ttc: number;
    retour_sur_investissement_ans: number;
    cycles_par_jour_moyen: number;
  };
  monthly: { month: string; total_ttc_apres_batterie: number }[];
  simulationResult: any;
}

/**
 * Run the battery simulation against a SobryParsed structure derived from the
 * sobry-calc-cost output. Returns a structured object stored in the wizard
 * state under data.factureSobryAvecBatterie.
 */
export function simulateBattery(
  parsed: SobryParsed,
  factureSobryAnnualTtc: number,
  factureSobryMonthlyTtc: { month: string; total_ttc: number }[],
): BatterySimulationOutput {
  const configKey: ConfigKey = suggerConfig(parsed.consoTotaleKwh * parsed.extrapolationFactor);
  const config = CONFIGS[configKey];
  const { planJours, stats } = simulerAnnee(parsed, configKey);
  const roi = calculerROI(stats, configKey);

  const economies_annuelles_ttc = roi.gainTtcAn;
  const total_ttc_apres_batterie = factureSobryAnnualTtc - economies_annuelles_ttc;
  const prix_batterie_ttc = config.prix_ttc;
  const retour_sur_investissement_ans =
    economies_annuelles_ttc > 0 ? prix_batterie_ttc / economies_annuelles_ttc : Infinity;

  // Monthly: distribute the annual battery savings using each month's pilot gain
  // weight (TTC). If no per-month info, fall back to even split.
  const factor = parsed.extrapolationFactor;
  const gainByMonth: number[] = new Array(12).fill(0);
  for (const d of planJours) {
    const m = Number(d.date.slice(5, 7)) - 1;
    if (m >= 0 && m < 12) gainByMonth[m] += d.gainJour;
  }
  const totalGainObs = gainByMonth.reduce((a, b) => a + b, 0);
  const monthlyOut: { month: string; total_ttc_apres_batterie: number }[] = [];

  for (const fs of factureSobryMonthlyTtc) {
    const monthIdx = Number(fs.month.slice(5, 7)) - 1;
    let economieMois: number;
    if (totalGainObs > 0) {
      const share = (gainByMonth[monthIdx] || 0) / totalGainObs;
      economieMois = economies_annuelles_ttc * share *
        (factor /* annualized weight already in economies */ ? 1 : 1);
      // simpler: distribute economies by share of observed gain
      economieMois = economies_annuelles_ttc * share;
    } else {
      economieMois = economies_annuelles_ttc / Math.max(factureSobryMonthlyTtc.length, 1);
    }
    monthlyOut.push({
      month: fs.month,
      total_ttc_apres_batterie: fs.total_ttc - economieMois,
    });
  }

  // Cycles moyen / jour
  const cycles_par_jour_moyen = stats.totalCyclesAn / 365;

  return {
    configKey,
    config,
    annual: {
      total_ttc_apres_batterie,
      economies_annuelles_ttc,
      prix_batterie_ttc,
      retour_sur_investissement_ans,
      cycles_par_jour_moyen,
    },
    monthly: monthlyOut,
    simulationResult: { planJours, stats, roi, MONTH_NAMES, TVA: CONSTANTES.TVA },
  };
}
