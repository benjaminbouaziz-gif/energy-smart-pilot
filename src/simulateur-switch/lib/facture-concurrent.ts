import type { SimulateurSwitchLoadCurve, SimulateurSwitchTarifConcurrent, SimulateurSwitchFactureConcurrent } from "../SimulateurSwitchContext";
import { parisAll, parisYearMonthFromIso, moisLabel } from "./paris-time";

const HOUR_MS = 3600 * 1000;

function inWrapRange(hour: number, start: number, end: number): boolean {
  // hour ∈ [start, end) ; supports wrap-around when start >= end
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

type Slot = "HP" | "HC" | "HSC";

function slotFor(hour: number, t: SimulateurSwitchTarifConcurrent): Slot {
  if (t.structure === "BASE") return "HP"; // arbitrary
  if (t.structure === "SUPER_CREUSES") {
    if (t.plageHscDebut !== undefined && t.plageHscFin !== undefined &&
        inWrapRange(hour, t.plageHscDebut, t.plageHscFin)) return "HSC";
  }
  if (t.structure === "HC_HP" || t.structure === "SUPER_CREUSES") {
    if (t.plageHcDebut !== undefined && t.plageHcFin !== undefined &&
        inWrapRange(hour, t.plageHcDebut, t.plageHcFin)) return "HC";
  }
  return "HP";
}

function priceFor(slot: Slot, t: SimulateurSwitchTarifConcurrent): number {
  if (t.structure === "BASE") return t.prixKwhHt ?? 0;
  if (slot === "HSC") return t.prixHscHt ?? t.prixHcHt ?? 0;
  if (slot === "HC") return t.prixHcHt ?? 0;
  return t.prixHpHt ?? 0;
}

export function computeFactureConcurrent(
  loadCurve: SimulateurSwitchLoadCurve,
  tarif: SimulateurSwitchTarifConcurrent
): SimulateurSwitchFactureConcurrent {
  const startMs = new Date(loadCurve.windowStart).getTime();
  const tva = (tarif.tvaPct ?? 20) / 100;

  let costVar = 0;
  let totalKwh = 0;
  let hp = 0, hc = 0, hsc = 0;

  // monthly aggregation
  const monthlyMap = new Map<string, { y: number; m: number; conso: number; var: number }>();

  if (loadCurve.source === "manual") {
    // Mode dégradé: total réparti 70% HP / 30% HC (HSC = 0)
    totalKwh = loadCurve.totalKwh;
    if (tarif.structure === "BASE") {
      costVar = totalKwh * (tarif.prixKwhHt ?? 0);
      hp = totalKwh;
    } else if (tarif.structure === "HC_HP") {
      hp = totalKwh * 0.7; hc = totalKwh * 0.3;
      costVar = hp * (tarif.prixHpHt ?? 0) + hc * (tarif.prixHcHt ?? 0);
    } else {
      hp = totalKwh * 0.65; hc = totalKwh * 0.25; hsc = totalKwh * 0.10;
      costVar = hp * (tarif.prixHpHt ?? 0) + hc * (tarif.prixHcHt ?? 0) + hsc * (tarif.prixHscHt ?? 0);
    }
  } else {
    for (let i = 0; i < loadCurve.hourlyKwh.length; i++) {
      const kwh = loadCurve.hourlyKwh[i];
      if (kwh === 0) continue;
      const iso = new Date(startMs + i * HOUR_MS).toISOString();
      const p = parisAll(iso);
      const slot = slotFor(p.h, tarif);
      const price = priceFor(slot, tarif);
      const cost = kwh * price;
      costVar += cost;
      totalKwh += kwh;
      if (slot === "HP") hp += kwh;
      else if (slot === "HC") hc += kwh;
      else hsc += kwh;

      const ym = parisYearMonthFromIso(iso);
      const k = `${ym.year}-${String(ym.month).padStart(2, "0")}`;
      const cur = monthlyMap.get(k);
      if (cur) { cur.conso += kwh; cur.var += cost; }
      else monthlyMap.set(k, { y: ym.year, m: ym.month, conso: kwh, var: cost });
    }
  }

  const fixePerMonth = tarif.abonnementMensuelHt;
  const fixeTotal = fixePerMonth * 12;
  const totalHt = costVar + fixeTotal;
  const totalTtc = totalHt * (1 + tva);

  let monthly: SimulateurSwitchFactureConcurrent["monthly"];
  if (loadCurve.source === "manual" || monthlyMap.size === 0) {
    // fallback : 12 mois plats
    monthly = Array.from({ length: 12 }, (_, i) => {
      const consoM = totalKwh / 12;
      const varM = costVar / 12;
      const htM = varM + fixePerMonth;
      return {
        month: moisLabel(2025, i + 1),
        conso_kwh: consoM,
        total_ht: htM,
        total_ttc: htM * (1 + tva),
      };
    });
  } else {
    monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, v]) => {
        const ht = v.var + fixePerMonth;
        return {
          month: moisLabel(v.y, v.m),
          conso_kwh: v.conso,
          total_ht: ht,
          total_ttc: ht * (1 + tva),
        };
      });
  }

  return {
    annual: {
      total_ht: totalHt,
      total_ttc: totalTtc,
      cost_variable_ht: costVar,
      cost_fixe_ht: fixeTotal,
      conso_kwh: totalKwh,
      prix_moyen_eur_kwh_ttc: totalKwh > 0 ? totalTtc / totalKwh : 0,
    },
    monthly,
    repartition_horaire: {
      heures_hp_kwh: hp,
      heures_hc_kwh: hc,
      heures_hsc_kwh: tarif.structure === "SUPER_CREUSES" ? hsc : undefined,
    },
  };
}
