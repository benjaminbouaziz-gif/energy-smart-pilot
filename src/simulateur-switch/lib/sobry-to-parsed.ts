import type { SobryParsed, SobryHourPoint } from "@/lib/dynawatt-engine-bis";

/**
 * Convert the output of the sobry-calc-cost edge function into the SobryParsed
 * structure expected by dynawatt-engine-bis.ts.
 */
export function convertSobryFactureToParsed(factureSobry: any, prm: string): SobryParsed {
  const details: any[] = factureSobry?.details_horaires ?? [];
  const hours: SobryHourPoint[] = [];
  const datesSet = new Set<string>();
  const monthsSet = new Set<string>();

  for (const d of details) {
    const ts = String(d.timestamp);
    // Use Paris-local hour to be consistent with the rest of the project
    const date = (d.timestamp_cet ? d.timestamp_cet.slice(0, 10) : ts.slice(0, 10));
    const hour = d.timestamp_cet
      ? Number(d.timestamp_cet.slice(11, 13))
      : new Date(ts).getHours();
    const conso = Number(d.conso_kwh ?? 0);
    const cost = Number(d.cost_total_eur ?? 0);
    const prix = conso > 0
      ? cost / conso
      : Number(d.spot_eur_kwh ?? 0) + Number(d.turpe_var_eur_kwh ?? 0) + Number(d.accise_eur_kwh ?? 0);
    hours.push({ timestamp: ts, date, hour, conso_kwh: conso, prix_eur_kwh: prix });
    datesSet.add(date);
    monthsSet.add(date.slice(0, 7));
  }

  const consoTotaleKwh = Number(factureSobry?.annual?.conso_kwh ?? 0);
  const coutVariableTotalEur = Number(factureSobry?.annual?.cost_variable_ht ?? 0);
  const fixedCostsAnnualHt = Number(factureSobry?.annual?.cost_fixe_ht ?? 0);
  const monthsCount = monthsSet.size;
  const fixedCostsMonthlyHt = monthsCount > 0 ? fixedCostsAnnualHt / 12 : 0;
  const daysCovered = datesSet.size || 1;
  const isFullYear = monthsCount >= 12 && daysCovered >= 360;
  const extrapolationFactor = isFullYear ? 1 : 365 / daysCovered;

  return {
    prm,
    monthsLoaded: Array.from(monthsSet).sort(),
    hours,
    consoTotaleKwh,
    coutVariableTotalEur,
    fixedCostsMonthlyHt,
    fixedCostsAnnualHt,
    daysCovered,
    extrapolationFactor,
    monthsCount,
    isFullYear,
  };
}
