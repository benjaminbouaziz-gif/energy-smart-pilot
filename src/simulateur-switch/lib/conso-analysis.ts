import { parisAll, parisHourFromIso, parisWeekdayFromIso, parisYearMonthFromIso, moisLabel } from "./paris-time";

const HOUR_MS = 3600 * 1000;

export function timestampsFromWindow(windowStart: string, n: number): string[] {
  const start = new Date(windowStart).getTime();
  const out: string[] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = new Date(start + i * HOUR_MS).toISOString();
  return out;
}

export interface DailyProfilePoint { hour: number; semaine: number; weekend: number }

export function computeDailyProfile(hourlyKwh: number[], windowStart: string): DailyProfilePoint[] {
  const sumSem = new Array(24).fill(0);
  const cntSem = new Array(24).fill(0);
  const sumWe = new Array(24).fill(0);
  const cntWe = new Array(24).fill(0);
  const startMs = new Date(windowStart).getTime();
  for (let i = 0; i < hourlyKwh.length; i++) {
    const ms = startMs + i * HOUR_MS;
    const p = parisAll(new Date(ms).toISOString());
    const isWeekend = p.weekday >= 5;
    const h = p.h;
    if (isWeekend) { sumWe[h] += hourlyKwh[i]; cntWe[h]++; }
    else { sumSem[h] += hourlyKwh[i]; cntSem[h]++; }
  }
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    semaine: cntSem[h] ? sumSem[h] / cntSem[h] : 0,
    weekend: cntWe[h] ? sumWe[h] / cntWe[h] : 0,
  }));
}

export interface MonthlyPoint { key: string; label: string; conso: number }

export function computeMonthly(hourlyKwh: number[], windowStart: string): MonthlyPoint[] {
  const map = new Map<string, { y: number; m: number; v: number }>();
  const startMs = new Date(windowStart).getTime();
  for (let i = 0; i < hourlyKwh.length; i++) {
    const iso = new Date(startMs + i * HOUR_MS).toISOString();
    const { year, month } = parisYearMonthFromIso(iso);
    const k = `${year}-${String(month).padStart(2, "0")}`;
    const cur = map.get(k);
    if (cur) cur.v += hourlyKwh[i];
    else map.set(k, { y: year, m: month, v: hourlyKwh[i] });
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({ key: k, label: moisLabel(v.y, v.m), conso: v.v }));
}

export function computeHeatmap(hourlyKwh: number[], windowStart: string): number[][] {
  // [weekday 0..6 (Mon=0)][hour 0..23] = average kWh
  const sum: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const cnt: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const startMs = new Date(windowStart).getTime();
  for (let i = 0; i < hourlyKwh.length; i++) {
    const iso = new Date(startMs + i * HOUR_MS).toISOString();
    const wd = parisWeekdayFromIso(iso);
    const h = parisHourFromIso(iso);
    sum[wd][h] += hourlyKwh[i];
    cnt[wd][h]++;
  }
  return sum.map((row, w) => row.map((s, h) => (cnt[w][h] ? s / cnt[w][h] : 0)));
}

export interface ConsoStats {
  totalKwh: number;
  dailyAvgKwh: number;
  peakHour: number;
  peakLabel: string;
  weekendRatioPct: number;
  nightRatioPct: number;
}

export function computeStats(hourlyKwh: number[], windowStart: string): ConsoStats {
  const totalKwh = hourlyKwh.reduce((a, b) => a + b, 0);
  const dailyAvgKwh = totalKwh / 365;

  const profile = computeDailyProfile(hourlyKwh, windowStart);
  // pic typique = max sum (semaine + weekend)
  let peakHour = 0; let peakV = -1;
  profile.forEach((p) => {
    const v = p.semaine + p.weekend;
    if (v > peakV) { peakV = v; peakHour = p.hour; }
  });
  let peakLabel = "nuit";
  if (peakHour >= 6 && peakHour < 12) peakLabel = "matin";
  else if (peakHour >= 12 && peakHour < 14) peakLabel = "midi";
  else if (peakHour >= 14 && peakHour < 18) peakLabel = "après-midi";
  else if (peakHour >= 18 && peakHour < 23) peakLabel = "soir";

  const startMs = new Date(windowStart).getTime();
  let weekendKwh = 0; let nightKwh = 0;
  for (let i = 0; i < hourlyKwh.length; i++) {
    const iso = new Date(startMs + i * HOUR_MS).toISOString();
    const p = parisAll(iso);
    if (p.weekday >= 5) weekendKwh += hourlyKwh[i];
    if (p.h >= 23 || p.h < 7) nightKwh += hourlyKwh[i];
  }
  return {
    totalKwh,
    dailyAvgKwh,
    peakHour,
    peakLabel,
    weekendRatioPct: totalKwh > 0 ? (weekendKwh / totalKwh) * 100 : 0,
    nightRatioPct: totalKwh > 0 ? (nightKwh / totalKwh) * 100 : 0,
  };
}

export function formatPrm(s: string) {
  const d = (s ?? "").replace(/\D/g, "").slice(0, 14);
  return [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12), d.slice(12, 14)].filter(Boolean).join(" ");
}

export function formatDateFr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });
}
