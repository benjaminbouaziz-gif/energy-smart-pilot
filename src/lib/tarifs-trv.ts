// Grille des Tarifs Réglementés de Vente (TRV) EDF Pro
// Source : grilles officielles EDF (Bleu Pro ≤36 kVA, Jaune CU 37-250 kVA)
// IMPORTANT : prix stockés en €/kWh HT. La TVA est appliquée au calcul.

export type TarifTRVType = "BLEU_BASE" | "BLEU_HPHC" | "JAUNE_CU";

export interface GrilleTRVPeriode {
  dateDebut: string; // ISO "YYYY-MM-DD"
  dateFin: string | null; // null = en cours
  composantes: { [composante: string]: number }; // €/kWh HT
}

export const TRV_BLEU_BASE: GrilleTRVPeriode[] = [
  { dateDebut: "2024-02-01", dateFin: "2025-01-31", composantes: { BASE: 0.2047 } },
  { dateDebut: "2025-02-01", dateFin: "2025-07-31", composantes: { BASE: 0.1659 } },
  { dateDebut: "2025-08-01", dateFin: "2026-01-31", composantes: { BASE: 0.1583 } },
  { dateDebut: "2026-02-01", dateFin: null,         composantes: { BASE: 0.1563 } },
];

export const TRV_BLEU_HPHC: GrilleTRVPeriode[] = [
  { dateDebut: "2024-02-01", dateFin: "2025-01-31", composantes: { HP: 0.2121, HC: 0.1758 } },
  { dateDebut: "2025-02-01", dateFin: "2025-07-31", composantes: { HP: 0.1713, HC: 0.1451 } },
  { dateDebut: "2025-08-01", dateFin: "2026-01-31", composantes: { HP: 0.1660, HC: 0.1298 } },
  { dateDebut: "2026-02-01", dateFin: null,         composantes: { HP: 0.1639, HC: 0.1281 } },
];

// Jaune CU disponible uniquement depuis 01/02/2025
export const TRV_JAUNE_CU: GrilleTRVPeriode[] = [
  { dateDebut: "2025-02-01", dateFin: "2025-07-31", composantes: { HPH: 0.2086, HCH: 0.1437, HPE: 0.1182, HCE: 0.0970 } },
  { dateDebut: "2025-08-01", dateFin: "2026-01-31", composantes: { HPH: 0.2147, HCH: 0.1541, HPE: 0.1105, HCE: 0.1071 } },
  { dateDebut: "2026-02-01", dateFin: null,         composantes: { HPH: 0.18808, HCH: 0.12751, HPE: 0.08839, HCE: 0.08056 } },
];

/**
 * Retourne le prix TTC (€/kWh) pour une heure donnée selon le TRV sélectionné.
 * Retourne null si le TRV n'est pas disponible à cette date (ex: Jaune avant 02/2025).
 * Approximations :
 *   - HC Bleu : 22h-6h
 *   - HC Jaune : 22h-7h + dimanche entier
 *   - Saisons Jaune : Hiver nov-mars, Été avr-oct
 */
export function prixTRV_TTC(
  timestamp: string,
  hour: number,
  type: TarifTRVType,
  tvaPct: number
): number | null {
  const date = timestamp.split("T")[0];
  let grille: GrilleTRVPeriode[];

  switch (type) {
    case "BLEU_BASE": grille = TRV_BLEU_BASE; break;
    case "BLEU_HPHC": grille = TRV_BLEU_HPHC; break;
    case "JAUNE_CU":  grille = TRV_JAUNE_CU; break;
  }

  const periode = grille.find(
    (p) => p.dateDebut <= date && (p.dateFin === null || date <= p.dateFin)
  );
  if (!periode) return null;

  let prixHt: number;

  if (type === "BLEU_BASE") {
    prixHt = periode.composantes.BASE;
  } else if (type === "BLEU_HPHC") {
    const isHC = hour >= 22 || hour < 6;
    prixHt = isHC ? periode.composantes.HC : periode.composantes.HP;
  } else {
    // JAUNE_CU
    const month = parseInt(date.split("-")[1], 10);
    const isHiver = month >= 11 || month <= 3;
    const dayOfWeek = new Date(timestamp).getDay(); // 0=dimanche
    const isHC = dayOfWeek === 0 || hour >= 22 || hour < 7;

    if (isHiver) {
      prixHt = isHC ? periode.composantes.HCH : periode.composantes.HPH;
    } else {
      prixHt = isHC ? periode.composantes.HCE : periode.composantes.HPE;
    }
  }

  return prixHt * (1 + tvaPct);
}

export function tarifApplicable(type: TarifTRVType, kVA: number): boolean {
  if (type === "JAUNE_CU") return kVA > 36;
  return kVA <= 36;
}

export function libelleTarifTRV(type: TarifTRVType): string {
  switch (type) {
    case "BLEU_BASE": return "Bleu Pro Base";
    case "BLEU_HPHC": return "Bleu Pro HP/HC";
    case "JAUNE_CU":  return "Jaune CU";
  }
}

/**
 * Calcule l'économie totale Dynawatt vs un TRV donné sur tous les jours.
 * Utilise les mêmes données que Step 6 (planJours).
 */
export function computeEconomieTRV(
  days: any[],
  type: TarifTRVType,
  tvaPct: number
): number {
  const tva = 1 + tvaPct;
  let total = 0;
  for (const d of days) {
    let coutTRV = 0;
    let coutSobry = 0;
    for (let h = 0; h < 24; h++) {
      const prixTRV = prixTRV_TTC(d.date, h, type, tvaPct);
      if (prixTRV === null) continue;
      coutTRV += prixTRV * d.conso24h[h];
      coutSobry += d.prix24h[h] * d.conso24h[h] * tva;
    }
    total += (coutTRV - coutSobry) + d.gainJour;
  }
  return total;
}

export function findWorstCaseTRV(days: any[], tvaPct: number): TarifTRVType {
  const tarifs: TarifTRVType[] = ["BLEU_BASE", "BLEU_HPHC", "JAUNE_CU"];
  let worst = tarifs[0];
  let worstValue = computeEconomieTRV(days, worst, tvaPct);
  for (const t of tarifs.slice(1)) {
    const v = computeEconomieTRV(days, t, tvaPct);
    if (v < worstValue) {
      worstValue = v;
      worst = t;
    }
  }
  return worst;
}

export function findBestCaseTRV(days: any[], tvaPct: number): TarifTRVType {
  const tarifs: TarifTRVType[] = ["BLEU_BASE", "BLEU_HPHC", "JAUNE_CU"];
  let best = tarifs[0];
  let bestValue = computeEconomieTRV(days, best, tvaPct);
  for (const t of tarifs.slice(1)) {
    const v = computeEconomieTRV(days, t, tvaPct);
    if (v > bestValue) {
      bestValue = v;
      best = t;
    }
  }
  return best;
}
