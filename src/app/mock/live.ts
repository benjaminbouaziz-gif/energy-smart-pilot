// Télémétrie temps réel simulée (mise à jour côté hook)

export type LiveTelemetry = {
  socPct: number;
  batteryPowerKw: number; // + décharge, - charge
  gridPowerKw: number;
  consumptionKw: number;
  mode: "idle" | "charging" | "discharging" | "standby";
  currentPriceEurPerKwh: number;
  priceLabel: string;
  pilotageMode: "auto" | "vacation" | "event" | "manual";
  pilotageLabel: string;
  todaySavingsEur: number;
  yesterdaySavingsEur: number;
  todayConsumptionKwh: number;
  yesterdayConsumptionKwh: number;
  todayCycles: number;
  plannedCycles: number;
  lastSyncSecondsAgo: number;
};

export function buildLiveTelemetry(tick = 0): LiveTelemetry {
  // Simule une batterie en charge/décharge selon l'heure
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  const charging = (h >= 2.75 && h < 5) || (h >= 12.75 && h < 15);
  const discharging = (h >= 7.5 && h < 9.75) || (h >= 18.75 && h < 21);

  let mode: LiveTelemetry["mode"] = "idle";
  let batteryPower = 0;
  if (charging) {
    mode = "charging";
    batteryPower = -6.4 + Math.sin(tick / 10) * 0.6;
  } else if (discharging) {
    mode = "discharging";
    batteryPower = 5.8 + Math.sin(tick / 8) * 0.7;
  } else {
    mode = "standby";
    batteryPower = 0.1 * Math.sin(tick / 12);
  }

  // SOC évolue lentement, oscillation pour rendu vivant
  const baseSoc = charging ? 60 + (h - 2.75) * 12 : discharging ? 90 - (h - 7.5) * 18 : 73;
  const socPct = Math.max(20, Math.min(98, baseSoc + Math.sin(tick / 15) * 1.5));

  const consumption = 4.2 + Math.sin(tick / 6) * 0.8 + (h > 7 && h < 22 ? 1.5 : 0);
  const grid = consumption + batteryPower;

  // Prix actuel
  let price = 0.12 + 0.05 * Math.cos(((h - 14) / 24) * Math.PI * 2);
  price += 0.08 * Math.exp(-Math.pow(h - 19.5, 2) / 4);
  price -= 0.07 * Math.exp(-Math.pow(h - 3, 2) / 6);
  price = Math.max(0.015, +price.toFixed(4));

  let priceLabel = "Heure normale";
  if (price < 0.05) priceLabel = "Heure creuse";
  else if (price > 0.18) priceLabel = "Heure de pointe";

  return {
    socPct: +socPct.toFixed(0),
    batteryPowerKw: +batteryPower.toFixed(1),
    gridPowerKw: +grid.toFixed(1),
    consumptionKw: +consumption.toFixed(1),
    mode,
    currentPriceEurPerKwh: price,
    priceLabel,
    pilotageMode: "auto",
    pilotageLabel: "Pilotage automatique",
    todaySavingsEur: 18.4 + Math.sin(tick / 20) * 0.3,
    yesterdaySavingsEur: 16.7,
    todayConsumptionKwh: 127,
    yesterdayConsumptionKwh: 138,
    todayCycles: 1.8,
    plannedCycles: 2,
    lastSyncSecondsAgo: (tick % 12) + 1,
  };
}
