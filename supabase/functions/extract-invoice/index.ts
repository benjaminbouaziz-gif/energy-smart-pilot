import { corsHeaders } from "@supabase/supabase-js/cors";

const SYSTEM_PROMPT = `Tu es un expert en analyse de factures d'électricité françaises. Extrais les informations demandées.

Si la facture est en HP/HC ou Tempo, calcule le prix moyen pondéré sur la période.
Si tu n'es pas sûr d'un champ, mets-le à null et confiance="basse".`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { pdfBase64, filename } = await req.json();
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: "pdfBase64 requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY non configurée" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyse cette facture d'électricité française (${filename || "facture.pdf"}) et appelle l'outil extract_facture avec les valeurs extraites.`,
              },
              {
                type: "file",
                file: {
                  filename: filename || "facture.pdf",
                  file_data: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_facture",
              description: "Retourne les champs extraits de la facture",
              parameters: {
                type: "object",
                properties: {
                  fournisseur: {
                    type: "string",
                    enum: ["EDF", "TotalEnergies", "Engie", "Mint Energie", "Octopus", "ekWateur", "Autre"],
                  },
                  prix_kwh_ht: {
                    type: ["number", "null"],
                    description: "Prix unitaire HT en €/kWh (moyenne pondérée si HP/HC ou Tempo)",
                  },
                  abonnement_mensuel_ht: {
                    type: ["number", "null"],
                    description: "Abonnement mensuel HT en €",
                  },
                  structure_tarifaire: {
                    type: "string",
                    enum: ["Tarif unique", "HP/HC", "Tempo", "EJP", "Autre"],
                  },
                  puissance_souscrite_kva: {
                    type: ["number", "null"],
                    description: "Puissance souscrite en kVA",
                  },
                  confiance: {
                    type: "string",
                    enum: ["haute", "moyenne", "basse"],
                  },
                },
                required: [
                  "fournisseur",
                  "prix_kwh_ht",
                  "abonnement_mensuel_ht",
                  "structure_tarifaire",
                  "puissance_souscrite_kva",
                  "confiance",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_facture" } },
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "Crédits Lovable AI épuisés. Ajoutez du crédit dans Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: `Erreur AI gateway (${response.status})` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "Aucune extraction renvoyée par le modèle" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(args), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("extract-invoice error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
