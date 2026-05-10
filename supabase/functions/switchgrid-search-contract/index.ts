import { corsHeaders } from "../_shared/cors.ts";

const SWITCHGRID_BASE_URL = "https://app.switchgrid.tech/enedis/v2";
const SWITCHGRID_TEST_MODE = "false";

function sgHeaders() {
  const h: Record<string, string> = {
    Authorization: `Bearer ${Deno.env.get("SWITCHGRID_API_KEY")}`,
    "Content-Type": "application/json",
  };
  if (SWITCHGRID_TEST_MODE === "true") h["switchgrid-test-env"] = "true";
  return h;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { prm, firstName, lastName, address } = body ?? {};

    let url: string;
    if (prm) {
      if (!/^\d{14}$/.test(String(prm))) {
        return new Response(JSON.stringify({ error: "INVALID_BODY", details: "prm must be 14 digits" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      url = `${SWITCHGRID_BASE_URL}/search_contract?prm=${encodeURIComponent(prm)}`;
    } else if (firstName && lastName && address) {
      const name = `${firstName} ${lastName}`.trim();
      url = `${SWITCHGRID_BASE_URL}/search_contract?name=${encodeURIComponent(name)}&address=${encodeURIComponent(address)}`;
    } else {
      return new Response(JSON.stringify({ error: "INVALID_BODY", details: "Provide prm or (firstName,lastName,address)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(url, { method: "GET", headers: sgHeaders(), cache: "no-store" });
    const text = await resp.text();

    if (resp.status === 401 || resp.status === 403) {
      return new Response(JSON.stringify({ error: "AUTH_FAILED" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "SWITCHGRID_HTTP_ERROR", status: resp.status, details: text.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(text);
    const results = data?.results ?? [];
    const contracts = results.map((r: any) => {
      const addr = r.adresseInstallationNormalisee ?? {};
      const addressStr = ["ligne2","ligne3","ligne4","ligne5","ligne6","ligne7"]
        .map((k) => addr[k]).filter(Boolean).join(", ");
      return {
        id: r.prm,
        prm: r.prm,
        signerName: r.nomClientFinalOuDenominationSociale,
        address: addressStr,
        segment: r.categorieClientFinalCode,
      };
    });

    return new Response(JSON.stringify({ contracts }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "INTERNAL", details: String(e?.message ?? e).slice(0, 500) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
