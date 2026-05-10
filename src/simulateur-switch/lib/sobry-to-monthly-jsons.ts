/**
 * Convert the response of the sobry-calc-cost edge function into an array of
 * "pseudo Sobry monthly JSONs" matching the shape expected by
 * parserJsonsSobry() in src/lib/dynawatt-engine-bis.ts.
 *
 * The engine expects, per month JSON:
 *   {
 *     prm, month, client,
 *     fixed_costs: { total_fixe_mensuel, puissance_kva, jours_mois? },
 *     variable_costs: {
 *       conso_totale_kwh, cost_variable_total_eur,
 *       details: [{ timestamp, conso_kwh, cost_total_eur,
 *                   spot_eur_kwh, turpe_var_eur_kwh, accise_eur_kwh }]
 *     }
 *   }
 */
export function convertSobryFactureToMonthlyJsons(
  factureSobry: any,
  prm: string,
  sobryParams?: { kva?: number }
): any[] {
  const details: any[] = factureSobry?.details_horaires ?? [];
  const monthlyMeta = new Map<string, any>();
  for (const m of factureSobry?.monthly ?? []) {
    monthlyMeta.set(String(m.month), m);
  }

  const detailsByMonth = new Map<string, any[]>();
  for (const d of details) {
    const monthKey = (d.timestamp_cet ?? d.timestamp ?? "").slice(0, 7); // YYYY-MM
    if (!monthKey) continue;
    const arr = detailsByMonth.get(monthKey) ?? [];
    arr.push(d);
    detailsByMonth.set(monthKey, arr);
  }

  const months = Array.from(detailsByMonth.keys()).sort();
  const jsons: any[] = [];
  for (const month of months) {
    const monthDetails = detailsByMonth.get(month)!;
    const meta = monthlyMeta.get(month);
    const conso_totale_kwh = monthDetails.reduce((a, d) => a + Number(d.conso_kwh ?? 0), 0);
    const cost_variable_total_eur = monthDetails.reduce(
      (a, d) => a + Number(d.cost_total_eur ?? 0),
      0
    );
    const total_fixe_mensuel = Number(meta?.cost_fixe_ht?.total ?? 0);

    jsons.push({
      prm,
      month,
      client: { nom: prm },
      fixed_costs: {
        total_fixe_mensuel,
        puissance_kva: sobryParams?.kva,
      },
      variable_costs: {
        conso_totale_kwh,
        cost_variable_total_eur,
        details: monthDetails.map((d) => ({
          timestamp: d.timestamp,
          conso_kwh: Number(d.conso_kwh ?? 0),
          cost_total_eur: Number(d.cost_total_eur ?? 0),
          spot_eur_kwh: Number(d.spot_eur_kwh ?? 0),
          turpe_var_eur_kwh: Number(d.turpe_var_eur_kwh ?? 0),
          accise_eur_kwh: Number(d.accise_eur_kwh ?? 0),
        })),
      },
    });
  }
  return jsons;
}
