import { supabase } from "@/integrations/supabase/client";

export type EpexPricesMap = Map<string, number>; // key = "YYYY-MM-DD-HH"

const PAGE_SIZE = 1000;

export async function loadEpexPricesForRange(
  windowStart: string,
  windowEnd: string
): Promise<EpexPricesMap> {
  const startDate = windowStart.slice(0, 10);
  const endDate = windowEnd.slice(0, 10);
  const map: EpexPricesMap = new Map();
  let from = 0;
  // Page through to bypass the 1000 row default limit.
  while (true) {
    const { data, error } = await supabase
      .from("pricing_hourly")
      .select("date,hour,epex_spot")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("hour", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) {
      const h = String(row.hour).padStart(2, "0");
      map.set(`${row.date}-${h}`, Number(row.epex_spot));
    }
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return map;
}
