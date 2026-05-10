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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const askId = url.searchParams.get("askId");
    if (!askId) {
      return new Response(JSON.stringify({ error: "INVALID_BODY", details: "askId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(`${SWITCHGRID_BASE_URL}/ask/${askId}`, {
      method: "GET", headers: sgHeaders(), cache: "no-store",
    });
    const text = await resp.text();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "SWITCHGRID_HTTP_ERROR", status: resp.status, details: text.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = JSON.parse(text);
    const status = data.status;

    if (status === "ACCEPTED") {
      const consentId = Object.values(data.consentIds ?? {})[0] as string | undefined;
      if (consentId) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("switchgrid_sessions").update({
          status: "CONSENT_ACCEPTED", consent_id: consentId,
        }).eq("ask_id", askId);
      }
      return new Response(JSON.stringify({ status, consentId }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (["ADDRESS_CHECK_FAILED", "EXPIRED", "REVOKED"].includes(status)) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.from("switchgrid_sessions").update({
        status: "FAILED", error_message: status,
      }).eq("ask_id", askId);
      return new Response(JSON.stringify({ status, error: status }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "INTERNAL", details: String(e?.message ?? e).slice(0, 500) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
