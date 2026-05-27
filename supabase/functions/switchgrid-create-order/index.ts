import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

function fmtParis(d: Date) {
  // YYYY-MM-DDTHH:mm:ss[Europe/Paris]
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T00:00:00[Europe/Paris]`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { sessionId, consentId, prm } = await req.json();
    if (!sessionId || !consentId || !prm) {
      return new Response(JSON.stringify({ error: "INVALID_BODY" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const until = new Date();
    until.setUTCHours(0, 0, 0, 0);
    const since = new Date(until.getTime() - 365 * 24 * 60 * 60 * 1000);

    const orderBody = {
      consentId,
      requests: [
        {
          type: "LOADCURVE",
          prms: [prm],
          direction: "CONSUMPTION",
          enedisRetryAfterLoadcurveActivation: true,
          since: fmtParis(since),
          until: fmtParis(until),
        },
        { type: "C68", prms: [prm] },
      ],
    };

    const resp = await fetch(`${SWITCHGRID_BASE_URL}/order`, {
      method: "POST", headers: sgHeaders(), body: JSON.stringify(orderBody), cache: "no-store",
    });
    const text = await resp.text();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "SWITCHGRID_HTTP_ERROR", status: resp.status, details: text.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = JSON.parse(text);
    const loadcurve = (data.requests ?? []).find((r: any) => r.type === "LOADCURVE");
    if (!loadcurve) {
      return new Response(JSON.stringify({ error: "NO_LOADCURVE_REQUEST" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase.from("switchgrid_sessions").update({
      status: "FETCHING", order_id: data.id, loadcurve_request_id: loadcurve.id,
    }).eq("id", sessionId);

    return new Response(JSON.stringify({ orderId: data.id, loadcurveRequestId: loadcurve.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "INTERNAL", details: String(e?.message ?? e).slice(0, 500) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
