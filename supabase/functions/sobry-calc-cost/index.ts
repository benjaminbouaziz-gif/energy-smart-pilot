// Sobry cost calculation edge function
// Pure additive — reads from pricing_* tables, writes nothing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type Segment = "C5" | "C4";
type Variante = "CU4" | "MU4" | "CU" | "LU";
type Offre = "SoFlex" | "SoCap";
type SegmentClient = "Particulier" | "Pro";
type Periode = "HCB" | "HPB" | "HCH" | "HPH";

interface Input {
  prm: string;
  segment: Segment;
  kva: number;
  variante: Variante;
  offre: Offre;
  segment_client: SegmentClient;
  hourlyKwh: number[];
  windowStart: string;
  windowEnd: string;
}

function bad(code: string, message: string, extra: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({ error: code, message, ...extra }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function internal(message: string, extra: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({ error: "INTERNAL", message, ...extra }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function validate(body: any): { ok: true; data: Input } | { ok: false; res: Response } {
  if (!body || typeof body !== "object") return { ok: false, res: bad("INVALID_BODY", "body missing") };
  const required = ["prm", "segment", "kva", "variante", "offre", "segment_client", "hourlyKwh", "windowStart", "windowEnd"];
  for (const k of required) if (body[k] === undefined || body[k] === null) return { ok: false, res: bad("INVALID_BODY", `missing field: ${k}`) };
  if (!["C5", "C4"].includes(body.segment)) return { ok: false, res: bad("INVALID_BODY", "segment must be C5 or C4") };
  if (!["CU4", "MU4", "CU", "LU"].includes(body.variante)) return { ok: false, res: bad("INVALID_BODY", "variante invalid") };
  if (!["SoFlex", "SoCap"].includes(body.offre)) return { ok: false, res: bad("INVALID_BODY", "offre invalid") };
  if (!["Particulier", "Pro"].includes(body.segment_client)) return { ok: false, res: bad("INVALID_BODY", "segment_client invalid") };
  if (!Array.isArray(body.hourlyKwh)) return { ok: false, res: bad("INVALID_BODY", "hourlyKwh must be an array") };
  const start = new Date(body.windowStart);
  const end = new Date(body.windowEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { ok: false, res: bad("INVALID_BODY", "invalid windowStart/windowEnd") };
  const hours = Math.round((end.getTime() - start.getTime()) / 3600000);
  if (hours <= 0) return { ok: false, res: bad("INVALID_BODY", "windowEnd must be after windowStart") };
  if (body.hourlyKwh.length !== hours) {
    return { ok: false, res: bad("INVALID_BODY", `hourlyKwh.length (${body.hourlyKwh.length}) ≠ window hours (${hours})`) };
  }
  return { ok: true, data: body as Input };
}

function formatCet(d: Date): string {
  // "YYYY-MM-DD HH:mm:ss" in Europe/Paris
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  return `${m.year}-${m.month}-${m.day} ${m.hour}:${m.minute}:${m.second}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try { body = await req.json(); } catch { return bad("INVALID_BODY", "invalid JSON"); }

  const v = validate(body);
  if (!v.ok) return v.res;
  const input = v.data;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const startDate = input.windowStart.slice(0, 10);
  const endDate = input.windowEnd.slice(0, 10);

  try {
    // 1) Constants
    const { data: constsRow, error: constsErr } = await supabase
      .from("pricing_constants")
      .select("*")
      .lte("date_debut", endDate)
      .or(`date_fin.is.null,date_fin.gte.${startDate}`)
      .order("date_debut", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (constsErr) return internal("pricing_constants query failed", { detail: constsErr.message });
    if (!constsRow) return bad("NO_ACTIVE_CONSTANTS", "no pricing_constants for the window");
    const consts: any = constsRow;

    // 2) Subscription
    const { data: sub, error: subErr } = await supabase
      .from("pricing_subscriptions")
      .select("*")
      .eq("segment", input.segment)
      .eq("kva", input.kva)
      .eq("variante", input.variante)
      .maybeSingle();
    if (subErr) return internal("pricing_subscriptions query failed", { detail: subErr.message });
    if (!sub) return bad("SUBSCRIPTION_NOT_FOUND", `no subscription for ${input.segment}/${input.kva}/${input.variante}`);

    // 3) Caps
    const { data: caps, error: capsErr } = await supabase
      .from("pricing_caps")
      .select("*")
      .eq("offre", input.offre)
      .eq("segment_client", input.segment_client);
    if (capsErr) return internal("pricing_caps query failed", { detail: capsErr.message });
    if (!caps || caps.length === 0) return bad("NO_CAP_FOUND", `no caps for ${input.offre}/${input.segment_client}`);

    // 4) Hourly EPEX — paginate to bypass the default 1000-row cap
    const hourlyMap = new Map<string, { epex_spot: number; periode_4_postes: Periode }>();
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data: page, error: hErr } = await supabase
        .from("pricing_hourly")
        .select("date, hour, epex_spot, periode_4_postes")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })
        .order("hour", { ascending: true })
        .range(from, from + PAGE - 1);
      if (hErr) return internal("pricing_hourly query failed", { detail: hErr.message });
      if (!page || page.length === 0) break;
      for (const r of page) {
        hourlyMap.set(`${r.date}-${r.hour}`, {
          epex_spot: Number(r.epex_spot),
          periode_4_postes: r.periode_4_postes as Periode,
        });
      }
      if (page.length < PAGE) break;
      from += PAGE;
    }

    const warnings: string[] = [];
    let nbFallback = 0;

    function fallbackSpot(dateStr: string, hour: number): { epex_spot: number; periode_4_postes: Periode } | null {
      const base = new Date(`${dateStr}T00:00:00Z`);
      for (let back = 1; back <= 7; back++) {
        const d = new Date(base);
        d.setUTCDate(d.getUTCDate() - back);
        const k = `${d.toISOString().slice(0, 10)}-${hour}`;
        const r = hourlyMap.get(k);
        if (r) return r;
      }
      return null;
    }

    // 5) Iterate
    const start = new Date(input.windowStart);
    const details: any[] = [];
    type MAgg = { conso_kwh: number; cost_variable_ht: number; nb_heures: number; year: number; month: number };
    const monthly = new Map<string, MAgg>();

    function parisYearMonth(d: Date): { key: string; year: number; month: number } {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Paris", year: "numeric", month: "2-digit",
      }).formatToParts(d);
      const m: Record<string, string> = {};
      for (const p of parts) m[p.type] = p.value;
      const year = Number(m.year);
      const month = Number(m.month);
      return { key: `${m.year}-${m.month}`, year, month };
    }

    const turpeKey = (per: Periode) => `turpe_var_${input.segment.toLowerCase()}_${per.toLowerCase()}`;

    for (let i = 0; i < input.hourlyKwh.length; i++) {
      const ts = new Date(start.getTime() + i * 3600000);
      const dateStr = ts.toISOString().slice(0, 10);
      const hour = ts.getUTCHours();
      const conso = Number(input.hourlyKwh[i]) || 0;

      let row = hourlyMap.get(`${dateStr}-${hour}`);
      let usedFallback = false;
      if (!row) {
        const fb = fallbackSpot(dateStr, hour);
        if (fb) { row = fb; usedFallback = true; nbFallback++; }
        else {
          warnings.push(`MISSING_SPOT ${dateStr}-${hour}`);
          row = { epex_spot: 0, periode_4_postes: "HCB" };
          nbFallback++;
        }
      }
      const spot = row.epex_spot;
      const periode = row.periode_4_postes;
      const turpe_var = Number(consts[turpeKey(periode)] ?? 0);

      const month = ts.getUTCMonth() + 1;
      const saison = (month >= 4 && month <= 10) ? "ete" : "hiver";
      const cap = caps.find((c: any) => c.saison === saison || c.saison === "all");
      if (!cap) return bad("NO_CAP_FOUND", `no cap for saison=${saison}`);

      const accise = Number(consts.accise_eur_kwh);
      const marge = Number(consts.marge_sobry_eur_kwh);
      const prime = input.offre === "SoCap"
        ? Number(consts.prime_socap_eur_kwh)
        : Number(consts.prime_soflex_eur_kwh);
      const cee = Number(consts.cee_eur_kwh);
      const capacite = Number(consts.capacite_eur_kwh);
      const plafond = Number(cap.plafond_eur_kwh);

      let cost_var_eur_kwh: number;
      if (cap.applies_to === "spot_only") {
        const spot_cape = Math.min(spot, plafond);
        cost_var_eur_kwh = spot_cape + turpe_var + accise + marge + prime + cee + capacite;
      } else {
        const bloc = spot + turpe_var + accise;
        const bloc_cape = Math.min(bloc, plafond);
        cost_var_eur_kwh = bloc_cape + marge + prime + cee + capacite;
      }

      const cost_total_eur = cost_var_eur_kwh * conso;

      details.push({
        timestamp: ts.toISOString(),
        timestamp_cet: formatCet(ts),
        periode,
        conso_kwh: conso,
        spot_eur_kwh: spot,
        turpe_var_eur_kwh: turpe_var,
        accise_eur_kwh: accise,
        cost_total_eur,
        missing_conso_point: false,
        ...(usedFallback ? { spot_fallback: true } : {}),
      });

      const ymKey = `${ts.getUTCFullYear()}-${String(month).padStart(2, "0")}`;
      const agg = monthly.get(ymKey) ?? { conso_kwh: 0, cost_variable_ht: 0 };
      agg.conso_kwh += conso;
      agg.cost_variable_ht += cost_total_eur;
      monthly.set(ymKey, agg);
    }

    // 6) Monthly + annual aggregation
    const acheminement_mois = Number(sub.acheminement_eur_mois);
    const abo_sobry_mois = Number(sub.abo_sobry_eur_mois);
    const cta_ratio = Number(consts.cta_ratio);
    const tva_ratio = Number(consts.tva_ratio);
    const cta_mois = acheminement_mois * cta_ratio;
    const total_fixe_mois = acheminement_mois + abo_sobry_mois + cta_mois;

    const monthlyArr = Array.from(monthly.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, m]) => {
        const total_ht = m.cost_variable_ht + total_fixe_mois;
        return {
          month,
          conso_kwh: m.conso_kwh,
          cost_variable_ht: m.cost_variable_ht,
          cost_fixe_ht: {
            acheminement: acheminement_mois,
            abo_sobry: abo_sobry_mois,
            cta: cta_mois,
            total: total_fixe_mois,
          },
          total_ht,
          total_ttc: total_ht * (1 + tva_ratio),
        };
      });

    const conso_an = monthlyArr.reduce((a, m) => a + m.conso_kwh, 0);
    const cost_var_an = monthlyArr.reduce((a, m) => a + m.cost_variable_ht, 0);
    const cost_fixe_an = monthlyArr.reduce((a, m) => a + m.cost_fixe_ht.total, 0);
    const total_ht_an = cost_var_an + cost_fixe_an;
    const total_ttc_an = total_ht_an * (1 + tva_ratio);

    const out = {
      metadata: {
        prm: input.prm,
        segment: input.segment,
        kva: input.kva,
        variante: input.variante,
        offre: input.offre,
        segment_client: input.segment_client,
        window_start: input.windowStart,
        window_end: input.windowEnd,
        constants_id: consts.id,
        calculated_at: new Date().toISOString(),
      },
      annual: {
        conso_kwh: conso_an,
        cost_variable_ht: cost_var_an,
        cost_fixe_ht: cost_fixe_an,
        total_ht: total_ht_an,
        total_ttc: total_ttc_an,
        prix_moyen_eur_kwh_ttc: conso_an > 0 ? total_ttc_an / conso_an : 0,
      },
      monthly: monthlyArr,
      details_horaires: details,
      warnings,
      fallback_stats: {
        nb_heures_avec_fallback_spot: nbFallback,
        nb_heures_total: input.hourlyKwh.length,
      },
    };

    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return internal("unexpected error", { detail: String(e?.message ?? e) });
  }
});
