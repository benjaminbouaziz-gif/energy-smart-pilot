import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const SWITCHGRID_BASE_URL = "https://app.switchgrid.tech/enedis/v2";
const SWITCHGRID_TEST_MODE = "false";

function sgHeaders() {
  const h: Record<string, string> = {
    Authorization: `Bearer ${Deno.env.get("SWITCHGRID_API_KEY")}`,
  };
  if (SWITCHGRID_TEST_MODE === "true") h["switchgrid-test-env"] = "true";
  return h;
}

function parsePeriodMin(period: string): number {
  const m = period?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
  const hours = m?.[1] ? +m[1] : 0;
  const minutes = m?.[2] ? +m[2] : 0;
  const seconds = m?.[3] ? +m[3] : 0;
  return hours * 60 + minutes + seconds / 60 || 60;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    const sessionId = url.searchParams.get("sessionId");
    if (!orderId || !sessionId) {
      return new Response(JSON.stringify({ error: "INVALID_BODY" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const orderResp = await fetch(`${SWITCHGRID_BASE_URL}/order/${orderId}`, {
      method: "GET", headers: sgHeaders(), cache: "no-store",
    });
    const orderText = await orderResp.text();
    if (!orderResp.ok) {
      return new Response(JSON.stringify({ error: "SWITCHGRID_HTTP_ERROR", status: orderResp.status, details: orderText.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const order = JSON.parse(orderText);
    const status = order.status;
    const requests = order.requests ?? [];
    const loadcurve = requests.find((r: any) => r.type === "LOADCURVE");

    if (["PENDING_REQUESTS", "PROCESSING", "PENDING_ADDRESS_CHECK"].includes(status)) {
      return new Response(JSON.stringify({ status }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status === "FAILED") {
      const message = requests.find((r: any) => r.errorMessage)?.errorMessage ?? "Order failed";
      await supabase.from("switchgrid_sessions").update({ status: "FAILED", error_message: message }).eq("id", sessionId);
      return new Response(JSON.stringify({ status, message }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const okToProceed = status === "SUCCESS" || (status === "SOME_REQUESTS_FAILED" && loadcurve?.status === "SUCCESS");
    if (!okToProceed) {
      return new Response(JSON.stringify({ status }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch session for loadcurve_request_id
    const { data: sess } = await supabase.from("switchgrid_sessions").select("loadcurve_request_id").eq("id", sessionId).maybeSingle();
    const requestId = sess?.loadcurve_request_id ?? loadcurve?.id;
    if (!requestId) {
      return new Response(JSON.stringify({ error: "NO_REQUEST_ID" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataResp = await fetch(`${SWITCHGRID_BASE_URL}/request/${requestId}/data?format=json`, {
      method: "GET", headers: sgHeaders(), cache: "no-store",
    });
    const dataText = await dataResp.text();
    if (!dataResp.ok) {
      return new Response(JSON.stringify({ error: "SWITCHGRID_HTTP_ERROR", status: dataResp.status, details: dataText.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const payload = JSON.parse(dataText);
    // Switchgrid retourne pour LOADCURVE le payload enveloppé par PRM :
    // { "<PRM>": { period, startsAt, endsAt, values: [...] } }
    // On détecte automatiquement : si values est à la racine, on l'utilise ;
    // sinon on prend la première sous-clé qui contient un objet avec values.
    let prmData: any = payload;
    if (!Array.isArray(payload.values)) {
      for (const key of Object.keys(payload)) {
        const candidate = payload[key];
        if (candidate && typeof candidate === "object" && Array.isArray(candidate.values)) {
          prmData = candidate;
          break;
        }
      }
    }
    const periodMin = parsePeriodMin(prmData.period);
    const startMs = new Date(prmData.startsAt).getTime();
    const values: number[] = prmData.values ?? [];

    const loadCurve = values.map((powerW, i) => ({
      timestamp: new Date(startMs + i * periodMin * 60000).toISOString(),
      valueWh: powerW * (periodMin / 60),
      durationMinutes: periodMin,
    }));

    await supabase.from("switchgrid_sessions").update({ status: "READY" }).eq("id", sessionId);

    return new Response(JSON.stringify({ status: "READY", loadCurve }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "INTERNAL", details: String(e?.message ?? e).slice(0, 500) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
