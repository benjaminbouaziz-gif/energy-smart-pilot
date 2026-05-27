import { corsHeaders } from "../_shared/cors.ts";

const BASE = "https://app.switchgrid.tech/enedis/v2";

async function probe(id: string) {
  const url = `${BASE}/request/${id}/data?format=json`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${Deno.env.get("SWITCHGRID_API_KEY")}` },
    cache: "no-store",
  });
  const text = await r.text();
  let payloadKeys: string[] = [];
  let valuesLength = 0;
  try {
    const j = JSON.parse(text);
    payloadKeys = Object.keys(j ?? {});
    valuesLength = Array.isArray(j?.values) ? j.values.length : 0;
  } catch { /* not json */ }
  return {
    url,
    httpStatus: r.status,
    payloadKeys,
    valuesLength,
    payloadSample: text.slice(0, 1000),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const [resultA, resultB] = await Promise.all([
      probe("35eb5bbc-63f7-4bce-8952-9c5a4eeba0d8"),
      probe("5e1e0562-ed2a-475c-b718-009b302ed9fb"),
    ]);
    return new Response(JSON.stringify({ resultA, resultB }, null, 2), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
