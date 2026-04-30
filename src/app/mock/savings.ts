// Génère 120 jours d'économies réalistes pour Hotel America Opera
// Conso annuelle ~106 688 kWh => ~292 kWh/jour avec saisonnalité hôtelière.

export type DailySaving = {
  date: string; // ISO
  consumptionKwh: number;
  costActualEur: number;
  costTrvEur: number;
  costTempoEur: number;
  costTarifJauneEur: number;
  savingsVsTrvEur: number;
  cyclesDone: number;
  spreadMaxEurPerKwh: number;
};

// Pseudo-random déterministe (seedé) pour cohérence entre rechargements
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function generateDailySavings(days = 120): DailySaving[] {
  const rand = seeded(42);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out: DailySaving[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    // Saisonnalité hôtel : creux fév, pic mai-juin
    const seasonal = 1 + 0.18 * Math.sin(((dayOfYear - 30) / 365) * Math.PI * 2);
    const weekendBoost = [0, 6].includes(d.getDay()) ? 1.08 : 1;
    const noise = 0.85 + rand() * 0.3;
    const consumption = Math.round(292 * seasonal * weekendBoost * noise);

    // Tarifs de référence (€/kWh moyens journaliers)
    const trvPrice = 0.2516; // TRV bleu pro
    const jaunePrice = 0.2280;
    const tempoPrice = 0.1850 + (rand() < 0.15 ? 0.45 : 0); // jours rouges aléatoires
    // Spread spot : journées volatiles vs calmes
    const spread = 0.06 + rand() * 0.18;
    const dynawattPrice = trvPrice * (0.55 + rand() * 0.12); // 33-45% d'éco moyen

    const costActual = consumption * dynawattPrice;
    const costTrv = consumption * trvPrice;
    const costJaune = consumption * jaunePrice;
    const costTempo = consumption * tempoPrice;

    out.push({
      date: d.toISOString().slice(0, 10),
      consumptionKwh: consumption,
      costActualEur: +costActual.toFixed(2),
      costTrvEur: +costTrv.toFixed(2),
      costTempoEur: +costTempo.toFixed(2),
      costTarifJauneEur: +costJaune.toFixed(2),
      savingsVsTrvEur: +(costTrv - costActual).toFixed(2),
      cyclesDone: +(1.2 + rand() * 1.1).toFixed(2),
      spreadMaxEurPerKwh: +spread.toFixed(3),
    });
  }
  return out;
}

export function aggregateMonthly(savings: DailySaving[]) {
  const map = new Map<string, { month: string; savings: number; consumption: number; costActual: number; costTrv: number }>();
  for (const s of savings) {
    const key = s.date.slice(0, 7);
    const cur = map.get(key) ?? { month: key, savings: 0, consumption: 0, costActual: 0, costTrv: 0 };
    cur.savings += s.savingsVsTrvEur;
    cur.consumption += s.consumptionKwh;
    cur.costActual += s.costActualEur;
    cur.costTrv += s.costTrvEur;
    map.set(key, cur);
  }
  return Array.from(map.values()).map((m) => ({
    ...m,
    savings: +m.savings.toFixed(0),
    consumption: Math.round(m.consumption),
    costActual: +m.costActual.toFixed(0),
    costTrv: +m.costTrv.toFixed(0),
  }));
}

export function buildCumulativeSeries(savings: DailySaving[]) {
  let cumActual = 0;
  let cumTrv = 0;
  return savings.map((s) => {
    cumActual += s.costActualEur;
    cumTrv += s.costTrvEur;
    return {
      date: s.date,
      cumulativeSavings: +(cumTrv - cumActual).toFixed(2),
      cumulativeTrv: +cumTrv.toFixed(2),
      cumulativeActual: +cumActual.toFixed(2),
    };
  });
}
