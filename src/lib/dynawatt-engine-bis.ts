// ============================================================
// DYNAWATT ENGINE — Moteur de simulation des économies
// ============================================================
// Format JSON Sobry attendu (calibré sur exemples uploadés):
// {
//   prm, month, client { ... },
//   fixed_costs: { abo_sobry_mois, total_turpe_mois, cta_mois,
//                  total_fixe_mensuel, puissance_kva, jours_mois, ... },
//   variable_costs: {
//     conso_totale_kwh, cost_variable_total_eur,
//     prix_unitaire_moyen_eur_kwh,
//     details: [{ timestamp, conso_kwh, spot_eur_kwh,
//                 turpe_var_eur_kwh, accise_eur_kwh, cost_total_eur }]
//   }
// }

export const CONSTANTES = {
  SPREAD_MIN: 0.05,             // €/kWh minimum entre prix bas et haut
  DUREE_MIN: 1,                 // h
  DUREE_MAX: 4,                 // h
  PLAFOND_CYCLES_MOYEN: 1.75,   // cycles/jour en moyenne sur 365j
  RTE_BATTERIE: 0.90,
  DEGRADATION: 0.90,
  AMORTISSEMENT_ANS: 8,
  MARGE_SOBRY: 0.008,           // €/kWh — déjà incluse dans cost_total_eur
  TVA: 0.20,
  LEASING_COEF_MENSUEL: 0.0155, // loyer mensuel HT = prix HT × coef
};

export const CONFIGS = {
  PETIT: {
    key: "PETIT" as const,
    nom: "Petit Consommateur",
    capacite: 18,        // kWh
    puissance: 6,        // kW
    prix_ttc: 9990,
    prix_ht: 8325,
    seuil_conso_annuelle: 60000,
  },
  MOYEN: {
    key: "MOYEN" as const,
    nom: "Consommateur Moyen",
    capacite: 28.8,
    puissance: 10,
    prix_ttc: 14400,
    prix_ht: 12000,
    seuil_conso_annuelle: Infinity,
  },
};
export type ConfigKey = keyof typeof CONFIGS;

// ====== TYPES ======
export interface SobryHourPoint {
  timestamp: string;
  hour: number;        // 0..23
  date: string;        // YYYY-MM-DD
  conso_kwh: number;
  prix_eur_kwh: number; // prix horaire TOUT compris (electron + turpe_var + accise + marge)
}

export interface SobryParsed {
  prm: string;
  monthsLoaded: string[];
  hours: SobryHourPoint[];
  consoTotaleKwh: number;
  coutVariableTotalEur: number; // HT, depuis details
  fixedCostsMonthlyHt: number;  // moyenne HT par mois (turpe fixe + abo + cta)
  fixedCostsAnnualHt: number;
  prmClient?: { nom?: string; address?: any };
  puissanceKva?: number;
  // extrapolation
  daysCovered: number;
  extrapolationFactor: number; // 1 si année complète, sinon 365/daysCovered
  monthsCount: number;
  isFullYear: boolean;
}

export interface CycleResult {
  chargeStart: number;
  chargeEnd: number;
  dechargeStart: number;
  dechargeEnd: number;
  duree: number;
  spread: number;
  gain: number;
  energie: number;
  heuresUtilisees: Set<number>;
}

export interface DayPlan {
  date: string;
  prix24h: number[];
  conso24h: number[];
  cycle1: CycleResult | null;
  cycle2: CycleResult | null;
  gainJour: number;
  cycleCount: number;
  // Pour viz panel batterie
  socCurve?: number[];
}

export interface AnnualStats {
  totalGainAn: number;
  totalCyclesAn: number;
  daysSimulated: number;
  avgCyclesParJour: number;
  consoAnnuelleKwh: number;
  coutSobryAnnuelHt: number;
  coutSobryAnnuelTtc: number;
}

export interface MonthlyData {
  month: number;
  monthName: string;
  consoMois: number;
  coutAncienHt: number;
  coutAncienTtc: number;
  coutSobryHt: number;
  coutSobryTtc: number;
  coutDynawattHt: number;
  coutDynawattTtc: number;
  economieSobryTtc: number;
  economiePilotageTtc: number;
  economieTotaleTtc: number;
  estMoisDefavorable: boolean;
}

export interface AnnualTotals {
  economieSobryAnnuelle: number;
  economiePilotageAnnuelle: number;
  economieTotaleAnnuelle: number;
  moisFavorables: number;
  moisDefavorables: number;
}

export interface SimulationResult {
  factureInitiale: { ht: number; ttc: number };
  sobry: { ht: number; ttc: number };
  dynawatt: { ht: number; ttc: number };
  economieAnnuelleTtc: number;
  economiePctTtc: number;
  planJours: DayPlan[];
  stats: AnnualStats;
  roi: {
    paybackAns: number;
    roi7Ans: number;
    gainNetAn: number;
    gainTtcAn: number;
  };
  config: typeof CONFIGS[ConfigKey];
  parsed: SobryParsed;
  monthlyData: MonthlyData[];
  annualTotals: AnnualTotals;
  coverageMonths: number;
  isFullYear: boolean;
}

export const MONTH_NAMES = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

export interface FactureActuelle {
  fournisseur: string;
  prix_kwh_ht: number;
  abonnement_mensuel_ht: number;
  structure_tarifaire?: string;
  puissance_souscrite_kva?: number;
}

// ====== PARSER JSON SOBRY ======
export function parserJsonsSobry(jsons: any[]): SobryParsed {
  if (!jsons.length) throw new Error("Aucun fichier JSON Sobry fourni");

  const prm = String(jsons[0].prm || "");
  for (const j of jsons) {
    if (String(j.prm) !== prm) {
      throw new Error(`PRM incohérent: ${j.prm} ≠ ${prm}`);
    }
  }

  const hours: SobryHourPoint[] = [];
  const months = new Set<string>();
  let coutVariableTotalEur = 0;
  let consoTotaleKwh = 0;
  let fixedCostsMonthlyHt = 0;
  let monthsCount = 0;
  let puissanceKva: number | undefined;
  let prmClient: any;

  for (const j of jsons) {
    months.add(String(j.month));
    monthsCount += 1;
    prmClient = prmClient || j.client;
    const fc = j.fixed_costs || {};
    fixedCostsMonthlyHt += Number(fc.total_fixe_mensuel || 0);
    if (fc.puissance_kva && !puissanceKva) puissanceKva = Number(fc.puissance_kva);

    const vc = j.variable_costs || {};
    coutVariableTotalEur += Number(vc.cost_variable_total_eur || 0);
    consoTotaleKwh += Number(vc.conso_totale_kwh || 0);

    const details: any[] = vc.details || [];
    for (const d of details) {
      const ts = String(d.timestamp);
      const date = ts.slice(0, 10); // YYYY-MM-DD
      const hour = new Date(ts).getHours();
      const conso = Number(d.conso_kwh || 0);
      // prix horaire complet €/kWh (electron + turpe_var + accise) — marge déjà incluse côté Sobry sinon ajout
      const prix =
        conso > 0
          ? Number(d.cost_total_eur || 0) / conso
          : Number(d.spot_eur_kwh || 0) +
            Number(d.turpe_var_eur_kwh || 0) +
            Number(d.accise_eur_kwh || 0);
      hours.push({
        timestamp: ts,
        date,
        hour,
        conso_kwh: conso,
        prix_eur_kwh: prix,
      });
    }
  }

  const fixedCostsAvgMonthly = monthsCount > 0 ? fixedCostsMonthlyHt / monthsCount : 0;
  const fixedCostsAnnualHt = fixedCostsAvgMonthly * 12;

  const dates = new Set(hours.map((h) => h.date));
  const daysCovered = dates.size || 1;
  const isFullYear = monthsCount >= 12 && daysCovered >= 360;
  const extrapolationFactor = isFullYear ? 1 : 365 / daysCovered;

  if (monthsCount > 0 && monthsCount < 6) {
    console.warn(`[engine-bis] Données insuffisantes : ${monthsCount} mois (min 6 recommandé).`);
  } else if (!isFullYear) {
    console.warn(`[engine-bis] Simulation basée sur ${monthsCount} mois (${daysCovered} jours). Annualisation appliquée.`);
  }

  return {
    prm,
    monthsLoaded: Array.from(months).sort(),
    hours,
    consoTotaleKwh,
    coutVariableTotalEur,
    fixedCostsMonthlyHt: fixedCostsAvgMonthly,
    fixedCostsAnnualHt,
    prmClient,
    puissanceKva,
    daysCovered,
    extrapolationFactor,
    monthsCount,
    isFullYear,
  };
}

// ====== OPTIMISATION CYCLE ======
export function optimiserCycleJour(
  prix24h: number[],
  heuresInterdites: Set<number> = new Set()
): CycleResult | null {
  let best: CycleResult | null = null;

  for (let duree = CONSTANTES.DUREE_MIN; duree <= CONSTANTES.DUREE_MAX; duree++) {
    for (let cs = 0; cs <= 24 - duree; cs++) {
      // fenêtre de charge [cs, cs+duree[
      let chargeOk = true;
      let prixCharge = 0;
      for (let h = cs; h < cs + duree; h++) {
        if (heuresInterdites.has(h)) {
          chargeOk = false;
          break;
        }
        prixCharge += prix24h[h];
      }
      if (!chargeOk) continue;
      prixCharge /= duree;

      for (let ds = cs + duree; ds <= 24 - duree; ds++) {
        let dechargeOk = true;
        let prixDecharge = 0;
        for (let h = ds; h < ds + duree; h++) {
          if (heuresInterdites.has(h)) {
            dechargeOk = false;
            break;
          }
          prixDecharge += prix24h[h];
        }
        if (!dechargeOk) continue;
        prixDecharge /= duree;

        const spread = prixDecharge - prixCharge;
        if (spread < CONSTANTES.SPREAD_MIN) continue;

        // gain proportionnel à l'énergie (1 kWh × duree d'énergie effective)
        // Spread net après pertes :
        const spreadNet =
          prixDecharge * CONSTANTES.RTE_BATTERIE * CONSTANTES.DEGRADATION - prixCharge;
        if (spreadNet <= 0) continue;
        const gain = spreadNet * duree; // par kWh de capacité utilisée pendant `duree` heures

        if (!best || gain > best.gain) {
          const heuresUtilisees = new Set<number>();
          for (let h = cs; h < cs + duree; h++) heuresUtilisees.add(h);
          for (let h = ds; h < ds + duree; h++) heuresUtilisees.add(h);
          best = {
            chargeStart: cs,
            chargeEnd: cs + duree - 1,
            dechargeStart: ds,
            dechargeEnd: ds + duree - 1,
            duree,
            spread,
            gain,
            energie: duree, // par kWh de capacité (multiplié plus tard par capacité)
            heuresUtilisees,
          };
        }
      }
    }
  }

  return best;
}

// ====== SIMULATION JOURNÉE ======
function buildDay(date: string, points: SobryHourPoint[]): { prix24h: number[]; conso24h: number[] } {
  const prix24h: number[] = new Array(24).fill(0);
  const conso24h: number[] = new Array(24).fill(0);
  // moyenne si plusieurs points même heure
  const counts: number[] = new Array(24).fill(0);
  for (const p of points) {
    prix24h[p.hour] += p.prix_eur_kwh;
    conso24h[p.hour] += p.conso_kwh;
    counts[p.hour] += 1;
  }
  for (let h = 0; h < 24; h++) {
    if (counts[h] > 0) prix24h[h] /= counts[h];
  }
  return { prix24h, conso24h };
}

export function simulerJournee(
  date: string,
  points: SobryHourPoint[],
  capaciteKwh: number
): DayPlan {
  const { prix24h, conso24h } = buildDay(date, points);
  const cycle1 = optimiserCycleJour(prix24h);
  const heuresInterdites = new Set<number>(cycle1?.heuresUtilisees || []);
  const cycle2 = optimiserCycleJour(prix24h, heuresInterdites);

  // gain effectif = gain par kWh × capacité
  const g1 = cycle1 ? cycle1.gain * capaciteKwh / Math.max(cycle1.duree, 1) : 0;
  const g2 = cycle2 ? cycle2.gain * capaciteKwh / Math.max(cycle2.duree, 1) : 0;
  // Mais aussi plafonné par conso réelle pendant la décharge
  const gainCycle = (c: CycleResult | null) => {
    if (!c) return 0;
    const consoDecharge = conso24h
      .slice(c.dechargeStart, c.dechargeEnd + 1)
      .reduce((a, b) => a + b, 0);
    const energieRestituable = Math.min(capaciteKwh, consoDecharge);
    const spreadNet =
      (c.spread) * CONSTANTES.RTE_BATTERIE * CONSTANTES.DEGRADATION;
    // FIX: prix_eur_kwh vient des JSON Sobry en HT, on convertit en TTC
    // pour rester cohérent avec executerSimulation qui traite gainJour
    // comme du TTC dans gainPilotageByMonth et coutDynawattTtc.
    return Math.max(0, spreadNet * energieRestituable * (1 + CONSTANTES.TVA));
  };
  const gain1 = gainCycle(cycle1);
  const gain2 = gainCycle(cycle2);

  return {
    date,
    prix24h,
    conso24h,
    cycle1,
    cycle2,
    gainJour: gain1 + gain2,
    cycleCount: (cycle1 ? 1 : 0) + (cycle2 ? 1 : 0),
  };
}

// ====== ALLOCATION ANNUELLE ======
export function allouerCyclesAnnuel(plan: DayPlan[]): DayPlan[] {
  const totalCycles = plan.reduce((a, p) => a + p.cycleCount, 0);
  const plafond = CONSTANTES.PLAFOND_CYCLES_MOYEN * plan.length;
  if (totalCycles <= plafond) return plan;

  // On retire les 2e cycles les moins rentables jusqu'à respecter le plafond
  const candidates = plan
    .filter((p) => p.cycle2 != null)
    .map((p) => ({ p, gain: gainOfSecondCycle(p) }))
    .sort((a, b) => a.gain - b.gain);

  let toRemove = totalCycles - Math.floor(plafond);
  for (const c of candidates) {
    if (toRemove <= 0) break;
    const removed = c.gain;
    c.p.cycle2 = null;
    c.p.cycleCount -= 1;
    c.p.gainJour -= removed;
    toRemove -= 1;
  }
  return plan;
}

function gainOfSecondCycle(p: DayPlan): number {
  if (!p.cycle2) return 0;
  // approximation : gain2 = gainJour - gainJourSansCycle2
  // on simule rapidement
  const c = p.cycle2;
  const consoDecharge = p.conso24h
    .slice(c.dechargeStart, c.dechargeEnd + 1)
    .reduce((a, b) => a + b, 0);
  const spreadNet = c.spread * CONSTANTES.RTE_BATTERIE * CONSTANTES.DEGRADATION;
  // FIX: cohérence TTC avec gainCycle
  return Math.max(0, spreadNet * Math.min(consoDecharge, 18) * (1 + CONSTANTES.TVA));
}

// ====== SIMULATION ANNUELLE ======
export function simulerAnnee(parsed: SobryParsed, configKey: ConfigKey): {
  planJours: DayPlan[];
  stats: AnnualStats;
} {
  const config = CONFIGS[configKey];
  // Group by date
  const byDate = new Map<string, SobryHourPoint[]>();
  for (const h of parsed.hours) {
    const arr = byDate.get(h.date) || [];
    arr.push(h);
    byDate.set(h.date, arr);
  }
  const dates = Array.from(byDate.keys()).sort();
  let planJours = dates.map((d) => simulerJournee(d, byDate.get(d)!, config.capacite));
  planJours = allouerCyclesAnnuel(planJours);

  const totalGainObs = planJours.reduce((a, p) => a + p.gainJour, 0);
  const totalCyclesObs = planJours.reduce((a, p) => a + p.cycleCount, 0);

  // Extrapolation année complète si <365j
  const factor = parsed.extrapolationFactor;
  const totalGainAn = totalGainObs * factor;
  const totalCyclesAn = totalCyclesObs * factor;
  const consoAnnuelleKwh = parsed.consoTotaleKwh * factor;
  const coutSobryVariableAn = parsed.coutVariableTotalEur * factor;
  const coutSobryAnnuelHt = coutSobryVariableAn + parsed.fixedCostsAnnualHt;
  const coutSobryAnnuelTtc = coutSobryAnnuelHt * (1 + CONSTANTES.TVA);

  return {
    planJours,
    stats: {
      totalGainAn,
      totalCyclesAn,
      daysSimulated: planJours.length,
      avgCyclesParJour: totalCyclesObs / Math.max(planJours.length, 1),
      consoAnnuelleKwh,
      coutSobryAnnuelHt,
      coutSobryAnnuelTtc,
    },
  };
}

// ====== ROI ======
// Aligné sur la simulation horaire réelle (cohérent avec Step 6 et Step 7 du
// Simulateur Switch, et avec la base de calibration Simulateur_Batterie_Sobry.xlsx).
// Les constantes ci-dessous sont conservées à titre de référence "brochure".
export const CYCLES_PAR_AN_FIXE = 638.75;        // 1,75 cycles/j × 365 (valeur cible)
export const SPREAD_NET_TTC_PAR_KWH = 0.08660;   // €/kWh TTC (valeur cible)

export function calculerROI(stats: AnnualStats, configKey: ConfigKey) {
  const config = CONFIGS[configKey];
  const gainTtcAn = stats.totalGainAn; // projeté à 365 j dans simulerAnnee
  const gainNetAn = gainTtcAn / (1 + CONSTANTES.TVA); // HT (utilisé ailleurs)
  const paybackAns = config.prix_ttc / Math.max(gainTtcAn, 1);
  const roi7Ans = gainTtcAn * 7 - config.prix_ttc;
  return { paybackAns, roi7Ans, gainNetAn, gainTtcAn };
}


// ====== API PRINCIPALE ======
export function executerSimulation(
  jsonSobry: any[],
  configKey: ConfigKey,
  facture: FactureActuelle
): SimulationResult {
  const parsed = parserJsonsSobry(jsonSobry);
  const { planJours, stats } = simulerAnnee(parsed, configKey);
  const roi = calculerROI(stats, configKey);

  // Facture initiale (chez le fournisseur actuel) sur la conso annuelle observée
  const coutFactureInitialeHt =
    stats.consoAnnuelleKwh * facture.prix_kwh_ht +
    facture.abonnement_mensuel_ht * 12;

  const sobryHt = stats.coutSobryAnnuelHt;
  const dynawattHt = sobryHt - roi.gainNetAn;

  const factureInitialeTtc = coutFactureInitialeHt * (1 + CONSTANTES.TVA);
  const sobryTtc = sobryHt * (1 + CONSTANTES.TVA);
  const dynawattTtc = dynawattHt * (1 + CONSTANTES.TVA);

  const economieAnnuelleTtc = factureInitialeTtc - dynawattTtc;
  const economiePctTtc = (economieAnnuelleTtc / Math.max(factureInitialeTtc, 1)) * 100;

  // ====== Calcul mensuel détaillé (12 mois) ======
  const tva = 1 + CONSTANTES.TVA;
  const fixedCostsMonthlyHt = parsed.fixedCostsMonthlyHt;
  const aboAncienMensuelHt = facture.abonnement_mensuel_ht;
  const prixAncienHt = facture.prix_kwh_ht;

  // Conso & coût Sobry par mois calendaire à partir des heures parsées
  const consoByMonth = new Array(12).fill(0);
  const coutSobryVarHtByMonth = new Array(12).fill(0);
  const gainPilotageByMonth = new Array(12).fill(0);
  const daysByMonth = new Array(12).fill(0);

  for (const h of parsed.hours) {
    const m = Number(h.date.slice(5, 7)) - 1;
    if (m < 0 || m > 11) continue;
    consoByMonth[m] += h.conso_kwh;
    coutSobryVarHtByMonth[m] += h.conso_kwh * h.prix_eur_kwh;
  }

  // Jours et gains pilotage par mois
  const seenDays = new Set<string>();
  for (const d of planJours) {
    const m = Number(d.date.slice(5, 7)) - 1;
    if (m < 0 || m > 11) continue;
    if (!seenDays.has(d.date)) {
      seenDays.add(d.date);
      daysByMonth[m] += 1;
    }
    gainPilotageByMonth[m] += d.gainJour; // déjà TTC
  }

  // Si année non complète, extrapoler chaque mois proportionnellement
  const factor = parsed.extrapolationFactor;
  const totalDaysObs = daysByMonth.reduce((a, b) => a + b, 0) || 1;

  // Distribution conso & coûts : si un mois n'a pas de données, on répartit l'extrapolation
  // de manière à reconstituer une année complète. Quand isFullYear: factor=1, pas de correction.
  const monthlyData: MonthlyData[] = [];
  let economieSobryAnn = 0;
  let economiePilotageAnn = 0;
  let economieTotaleAnn = 0;
  let moisFav = 0;
  let moisDef = 0;

  for (let m = 0; m < 12; m++) {
    let consoMois = consoByMonth[m];
    let coutSobryVarHt = coutSobryVarHtByMonth[m];
    let gainPilotage = gainPilotageByMonth[m];

    // Si mois absent et extrapolation active, on distribue la moyenne
    if (consoMois === 0 && !parsed.isFullYear) {
      const totalConso = consoByMonth.reduce((a, b) => a + b, 0);
      const totalCout = coutSobryVarHtByMonth.reduce((a, b) => a + b, 0);
      const totalGain = gainPilotageByMonth.reduce((a, b) => a + b, 0);
      const moisAvecData = consoByMonth.filter((v) => v > 0).length || 1;
      consoMois = (totalConso * factor - totalConso) / Math.max(12 - moisAvecData, 1);
      coutSobryVarHt = (totalCout * factor - totalCout) / Math.max(12 - moisAvecData, 1);
      gainPilotage = (totalGain * factor - totalGain) / Math.max(12 - moisAvecData, 1);
    }

    const coutAncienHt = consoMois * prixAncienHt + aboAncienMensuelHt;
    const coutAncienTtc = coutAncienHt * tva;

    const coutSobryHt = coutSobryVarHt + fixedCostsMonthlyHt;
    const coutSobryTtc = coutSobryHt * tva;

    const coutDynawattTtc = coutSobryTtc - gainPilotage;
    const coutDynawattHt = coutDynawattTtc / tva;

    const economieSobryTtc = coutAncienTtc - coutSobryTtc; // peut être négatif
    const economiePilotageTtc = gainPilotage;
    const economieTotaleTtc = coutAncienTtc - coutDynawattTtc;
    const estMoisDefavorable = economieTotaleTtc < 0;

    if (estMoisDefavorable) moisDef += 1; else moisFav += 1;
    economieSobryAnn += economieSobryTtc;
    economiePilotageAnn += economiePilotageTtc;
    economieTotaleAnn += economieTotaleTtc;

    monthlyData.push({
      month: m + 1,
      monthName: MONTH_NAMES[m],
      consoMois,
      coutAncienHt,
      coutAncienTtc,
      coutSobryHt,
      coutSobryTtc,
      coutDynawattHt,
      coutDynawattTtc,
      economieSobryTtc,
      economiePilotageTtc,
      economieTotaleTtc,
      estMoisDefavorable,
    });
  }

  return {
    factureInitiale: { ht: coutFactureInitialeHt, ttc: factureInitialeTtc },
    sobry: { ht: sobryHt, ttc: sobryTtc },
    dynawatt: { ht: dynawattHt, ttc: dynawattTtc },
    economieAnnuelleTtc,
    economiePctTtc,
    planJours,
    stats,
    roi,
    config: CONFIGS[configKey],
    parsed,
    monthlyData,
    annualTotals: {
      economieSobryAnnuelle: economieSobryAnn,
      economiePilotageAnnuelle: economiePilotageAnn,
      economieTotaleAnnuelle: economieTotaleAnn,
      moisFavorables: moisFav,
      moisDefavorables: moisDef,
    },
    coverageMonths: parsed.monthsCount,
    isFullYear: parsed.isFullYear,
  };
}

// ====== UTIL FORMAT ======
export const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtKwh = (n: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n)} kWh`;

export function suggerConfig(consoAnnuelleKwh: number): ConfigKey {
  return consoAnnuelleKwh < CONFIGS.PETIT.seuil_conso_annuelle ? "PETIT" : "MOYEN";
}
