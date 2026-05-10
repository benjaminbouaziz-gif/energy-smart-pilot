export type LoadCurvePoint = {
  timestamp: string;
  valueWh: number;
  durationMinutes: number;
};

export type HourlyResult = {
  hourlyKwh: number[];
  timestamps: string[];
  qualityScore: number;
  totalKwh: number;
  windowStart: string;
  windowEnd: string;
  warnings: string[];
};

const HOUR_MS = 3600 * 1000;

function floorHourUTC(ms: number): number {
  return Math.floor(ms / HOUR_MS) * HOUR_MS;
}

export function switchgridToHourlyKwh(loadCurve: LoadCurvePoint[]): HourlyResult {
  const warnings: string[] = [];
  if (!loadCurve.length) {
    const now = new Date();
    const end = new Date(floorHourUTC(now.getTime()));
    const start = new Date(end.getTime() - 365 * 24 * HOUR_MS);
    return {
      hourlyKwh: [], timestamps: [], qualityScore: 0, totalKwh: 0,
      windowStart: start.toISOString(), windowEnd: end.toISOString(),
      warnings: ["EMPTY_LOADCURVE"],
    };
  }

  // Bucketize Wh par heure pleine UTC
  const buckets = new Map<number, number>();
  let maxTs = 0;
  for (const p of loadCurve) {
    const t = new Date(p.timestamp).getTime();
    if (Number.isNaN(t)) continue;
    const b = floorHourUTC(t);
    buckets.set(b, (buckets.get(b) ?? 0) + p.valueWh);
    if (b > maxTs) maxTs = b;
  }

  const windowEndMs = maxTs + HOUR_MS; // borne exclusive arrondie heure
  const totalHours = 365 * 24;
  const windowStartMs = windowEndMs - totalHours * HOUR_MS;

  // Tableau brut (kWh ou null si trou)
  const raw: (number | null)[] = new Array(totalHours).fill(null);
  for (let i = 0; i < totalHours; i++) {
    const t = windowStartMs + i * HOUR_MS;
    const wh = buckets.get(t);
    if (wh !== undefined) raw[i] = wh / 1000;
  }

  const knownCount = raw.filter((v) => v !== null).length;

  // Comblement des trous
  const hourlyKwh: number[] = new Array(totalHours).fill(0);
  let i = 0;
  while (i < totalHours) {
    if (raw[i] !== null) {
      hourlyKwh[i] = raw[i] as number;
      i++;
      continue;
    }
    // début d'un trou
    let j = i;
    while (j < totalHours && raw[j] === null) j++;
    const gapLen = j - i;
    const prevIdx = i - 1;
    const nextIdx = j;
    const prevVal = prevIdx >= 0 ? (raw[prevIdx] as number) : null;
    const nextVal = nextIdx < totalHours ? (raw[nextIdx] as number) : null;

    if (gapLen <= 4 && prevVal !== null && nextVal !== null) {
      // Interpolation linéaire
      for (let k = i; k < j; k++) {
        const ratio = (k - prevIdx) / (nextIdx - prevIdx);
        hourlyKwh[k] = prevVal + (nextVal - prevVal) * ratio;
      }
    } else {
      const startIso = new Date(windowStartMs + i * HOUR_MS).toISOString();
      warnings.push(`GAP_LARGE: ${gapLen} heures à ${startIso}`);
      // déjà rempli à 0
    }
    i = j;
  }

  const timestamps = Array.from({ length: totalHours }, (_, k) =>
    new Date(windowStartMs + k * HOUR_MS).toISOString()
  );
  const totalKwh = hourlyKwh.reduce((a, b) => a + b, 0);

  return {
    hourlyKwh,
    timestamps,
    qualityScore: knownCount / totalHours,
    totalKwh,
    windowStart: new Date(windowStartMs).toISOString(),
    windowEnd: new Date(windowEndMs).toISOString(),
    warnings,
  };
}
