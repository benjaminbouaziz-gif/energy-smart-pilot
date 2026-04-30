// Forecast J+1 : 96 prix EPEX au quart d'heure + plan charge/décharge

export type ForecastSlot = {
  index: number; // 0..95
  time: string; // "HH:mm"
  priceEurPerKwh: number;
  action: "charge" | "discharge" | "idle";
};

export type ForecastWindow = {
  startIdx: number;
  endIdx: number;
  startTime: string;
  endTime: string;
  energyKwh: number;
  avgPriceEurPerKwh: number;
  type: "charge" | "discharge";
  estimatedGainEur: number;
};

function fmt(idx: number) {
  const h = Math.floor(idx / 4);
  const m = (idx % 4) * 15;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function generateForecast() {
  // Profil EPEX type : creux nuit (1-5h) et midi solaire (12-15h), pics matin (7-10h) et soir (18-21h)
  const slots: ForecastSlot[] = [];
  for (let i = 0; i < 96; i++) {
    const h = i / 4;
    let base = 0.12;
    base += 0.06 * Math.cos(((h - 14) / 24) * Math.PI * 2); // courbe journalière
    base += 0.05 * Math.exp(-Math.pow(h - 8.5, 2) / 4); // pic matin
    base += 0.08 * Math.exp(-Math.pow(h - 19.5, 2) / 4); // pic soir
    base -= 0.07 * Math.exp(-Math.pow(h - 3, 2) / 6); // creux nuit
    base -= 0.04 * Math.exp(-Math.pow(h - 13.5, 2) / 4); // creux solaire
    slots.push({
      index: i,
      time: fmt(i),
      priceEurPerKwh: +base.toFixed(4),
      action: "idle",
    });
  }

  // Plan de pilotage : 2 cycles
  // Cycle 1 : charge 02h45-05h00 (creux nuit), décharge 07h30-09h45 (pic matin)
  // Cycle 2 : charge 12h45-15h00 (creux solaire), décharge 18h45-21h00 (pic soir)
  const charge1 = { start: 11, end: 20 }; // 02:45 -> 05:00
  const disch1 = { start: 30, end: 39 }; // 07:30 -> 09:45
  const charge2 = { start: 51, end: 60 }; // 12:45 -> 15:00
  const disch2 = { start: 75, end: 84 }; // 18:45 -> 21:00

  for (let i = charge1.start; i <= charge1.end; i++) slots[i].action = "charge";
  for (let i = disch1.start; i <= disch1.end; i++) slots[i].action = "discharge";
  for (let i = charge2.start; i <= charge2.end; i++) slots[i].action = "charge";
  for (let i = disch2.start; i <= disch2.end; i++) slots[i].action = "discharge";

  const buildWindow = (s: number, e: number, type: "charge" | "discharge"): ForecastWindow => {
    const range = slots.slice(s, e + 1);
    const avg = range.reduce((a, b) => a + b.priceEurPerKwh, 0) / range.length;
    const energyKwh = range.length * (29 / 4 / 9); // ~29 kWh / sur ~9 quarts d'heure
    return {
      startIdx: s,
      endIdx: e,
      startTime: fmt(s),
      endTime: fmt(e + 1),
      energyKwh: +energyKwh.toFixed(1),
      avgPriceEurPerKwh: +avg.toFixed(4),
      type,
      estimatedGainEur: 0,
    };
  };

  const windows: ForecastWindow[] = [
    buildWindow(charge1.start, charge1.end, "charge"),
    buildWindow(disch1.start, disch1.end, "discharge"),
    buildWindow(charge2.start, charge2.end, "charge"),
    buildWindow(disch2.start, disch2.end, "discharge"),
  ];

  // Calcul gain par cycle (paire charge/décharge)
  const cycle1Gain = (windows[1].avgPriceEurPerKwh - windows[0].avgPriceEurPerKwh) * windows[0].energyKwh;
  const cycle2Gain = (windows[3].avgPriceEurPerKwh - windows[2].avgPriceEurPerKwh) * windows[2].energyKwh;
  windows[0].estimatedGainEur = +cycle1Gain.toFixed(2);
  windows[2].estimatedGainEur = +cycle2Gain.toFixed(2);

  const totalGain = +(cycle1Gain + cycle2Gain).toFixed(2);
  const minPrice = Math.min(...slots.map((s) => s.priceEurPerKwh));
  const maxPrice = Math.max(...slots.map((s) => s.priceEurPerKwh));

  return {
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })(),
    slots,
    windows,
    cycles: [
      { id: 1, charge: windows[0], discharge: windows[1], gainEur: +cycle1Gain.toFixed(2) },
      { id: 2, charge: windows[2], discharge: windows[3], gainEur: +cycle2Gain.toFixed(2) },
    ],
    totalEstimatedGainEur: totalGain,
    spreadEurPerKwh: +(maxPrice - minPrice).toFixed(3),
    volatility: maxPrice - minPrice > 0.16 ? "VOLATILE" : maxPrice - minPrice > 0.10 ? "ACTIVE" : "CALME",
  };
}
