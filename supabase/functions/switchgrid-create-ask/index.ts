import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const SWITCHGRID_BASE_URL = "https://app.switchgrid.tech/enedis/v2";
const SWITCHGRID_TEST_MODE = "true";

function sgHeaders() {
  const h: Record<string, string> = {
    Authorization: `Bearer ${Deno.env.get("SWITCHGRID_API_KEY")}`,
    "Content-Type": "application/json",
  };
  if (SWITCHGRID_TEST_MODE === "true") h["switchgrid-test-env"] = "true";
  return h;
}

function parseAddress(address: string) {
  const m = address.match(/^(.+?)[\s,]+(\d{5})\s+(.+)$/);
  if (m) {
    return {
      street: m[1].trim().toUpperCase(),
      postalCode: m[2],
      city: m[3].trim().toUpperCase(),
      country: "FR",
    };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { sessionId, contractId, signer, address } = await req.json();
    if (!sessionId || !contractId || !signer?.firstName || !signer?.lastName || !signer?.genre || !address) {
      return new Response(JSON.stringify({ error: "INVALID_BODY" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const addressObj = parseAddress(address);
    if (!addressObj) {
      return new Response(JSON.stringify({ error: "INVALID_ADDRESS", details: "Format attendu: 'rue, 75001 Paris'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") ?? Deno.env.get("APP_URL") ?? "";
    const redirectUrl = `${origin}/switchgrid/callback?sessionId=${sessionId}`;

    const askBody = {
      electricityContracts: [{
        prm: contractId,
        heldBy: { genre: signer.genre, firstName: signer.firstName, lastName: signer.lastName },
        address: addressObj,
      }],
      signer: { firstName: signer.firstName, lastName: signer.lastName },
      purposes: ["SOLAR_INSTALLATION_SIZING"],
      consentDuration: "1 year",
      redirectUrl,
    };

    const resp = await fetch(`${SWITCHGRID_BASE_URL}/ask`, {
      method: "POST", headers: sgHeaders(), body: JSON.stringify(askBody), cache: "no-store",
    });
    const text = await resp.text();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "SWITCHGRID_HTTP_ERROR", status: resp.status, details: text.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = JSON.parse(text);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase.from("switchgrid_sessions").update({
      status: "PENDING_CONSENT", ask_id: data.id,
    }).eq("id", sessionId);

    return new Response(JSON.stringify({
      askId: data.id,
      userUrl: data?.consentCollectionDetails?.userUrl,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "INTERNAL", details: String(e?.message ?? e).slice(0, 500) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
