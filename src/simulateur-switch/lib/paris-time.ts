// Helpers to derive Europe/Paris calendar fields from a UTC timestamp.
const PARIS_TZ = "Europe/Paris";

const partsCache = new Map<number, { y: number; m: number; d: number; h: number; weekday: number }>();

function parisParts(ms: number) {
  const cached = partsCache.get(ms);
  if (cached) return cached;
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wdMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const out = {
    y: parseInt(get("year"), 10),
    m: parseInt(get("month"), 10),
    d: parseInt(get("day"), 10),
    h: parseInt(get("hour"), 10) % 24,
    weekday: wdMap[get("weekday")] ?? 0,
  };
  if (partsCache.size > 20000) partsCache.clear();
  partsCache.set(ms, out);
  return out;
}

export function parisHourFromIso(iso: string): number {
  return parisParts(new Date(iso).getTime()).h;
}
export function parisWeekdayFromIso(iso: string): number {
  return parisParts(new Date(iso).getTime()).weekday;
}
export function parisYearMonthFromIso(iso: string): { year: number; month: number } {
  const p = parisParts(new Date(iso).getTime());
  return { year: p.y, month: p.m };
}
export function parisAll(iso: string) {
  return parisParts(new Date(iso).getTime());
}

const MOIS_FR = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
export function moisLabel(year: number, month: number) {
  return `${MOIS_FR[month - 1]} ${year}`;
}
