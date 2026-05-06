import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSimulator } from "../SimulatorContext";
import { WizardFooter } from "../components/WizardFooter";
import {
  CONFIGS,
  ConfigKey,
  CONSTANTES,
  executerSimulation,
  fmtEur,
  suggerConfig,
} from "@/lib/dynawatt-engine-bis";
import { Battery, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Step3Config() {
  const {
    sobryDocs,
    facture,
    configChoisie,
    setConfigChoisie,
    setResult,
    simulationId,
    next,
    internalMode,
    customPriceHT,
  } = useSimulator();

  // Prix standards depuis parametres_globaux (uniquement en mode interne)
  const [standardPrices, setStandardPrices] = useState<{ PETIT?: number; MOYEN?: number }>({});
  useEffect(() => {
    if (!internalMode) return;
    (async () => {
      const { data } = await supabase.from("parametres_globaux").select("cle, valeur");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => (map[r.cle] = r.valeur));
      setStandardPrices({
        PETIT: map.prix_petit_conso_ht_standard ? Number(map.prix_petit_conso_ht_standard) : undefined,
        MOYEN: map.prix_moyen_conso_ht_standard ? Number(map.prix_moyen_conso_ht_standard) : undefined,
      });
    })();
  }, [internalMode]);

  // Estimation conso annuelle pour pré-sélection
  const consoAnnuelle = useMemo(() => {
    const total = sobryDocs.reduce(
      (a, d) => a + Number(d.data?.variable_costs?.conso_totale_kwh || 0),
      0
    );
    const factor = sobryDocs.length > 0 ? 12 / sobryDocs.length : 1;
    return total * factor;
  }, [sobryDocs]);

  // Pré-sélection auto
  useEffect(() => {
    if (!configChoisie && sobryDocs.length > 0) {
      setConfigChoisie(suggerConfig(consoAnnuelle));
    }
  }, [configChoisie, consoAnnuelle, sobryDocs.length, setConfigChoisie]);

  const recommandee = suggerConfig(consoAnnuelle);

  // Simulation pour les 2 configs (pour afficher économie sur chaque card)
  const simulations = useMemo(() => {
    if (!facture || sobryDocs.length === 0) return null;
    try {
      return {
        PETIT: executerSimulation(
          sobryDocs.map((d) => d.data),
          "PETIT",
          facture
        ),
        MOYEN: executerSimulation(
          sobryDocs.map((d) => d.data),
          "MOYEN",
          facture
        ),
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [facture, sobryDocs]);

  const handleNext = async () => {
    if (!configChoisie || !simulations) return;
    const result = simulations[configChoisie];
    setResult(result);
    if (simulationId) {
      await supabase
        .from("simulations")
        .update({
          config_choisie: configChoisie,
          resultats_simulation: serializeResult(result) as any,
          current_step: 4,
        })
        .eq("id", simulationId);
    }
    next();
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 mt-10 max-w-5xl"
      >
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
            Étape 3 / 6
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Choix de la configuration</h1>
          <p className="text-sm text-muted-foreground">
            Conso annuelle estimée :{" "}
            <span className="text-primary-light font-bold">
              {consoAnnuelle.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} kWh
            </span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {(Object.keys(CONFIGS) as ConfigKey[]).map((key) => {
            const c = CONFIGS[key];
            const sim = simulations?.[key];
            const isSelected = configChoisie === key;
            const isReco = recommandee === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setConfigChoisie(key)}
                className={`text-left rounded-3xl p-6 border-2 transition-all relative ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
                    : "border-border bg-card/40 hover:border-primary/50"
                }`}
              >
                {isReco && (
                  <span className="absolute -top-3 right-6 bg-gradient-to-r from-gold to-accent-warm text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[var(--shadow-gold)]">
                    Recommandé
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                    {key === "PETIT" ? (
                      <Battery className="w-6 h-6 text-primary-light" />
                    ) : (
                      <Zap className="w-6 h-6 text-primary-light" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{c.nom}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {c.capacite} kWh — {c.puissance} kW Tri
                    </p>
                  </div>
                </div>

                <div className="text-3xl font-black text-foreground mb-1">
                  {internalMode
                    ? fmtEur(((isSelected && customPriceHT != null ? customPriceHT : (standardPrices[key] ?? c.prix_ht))) * 1.2)
                    : fmtEur(c.prix_ttc)}
                  <span className="text-xs font-mono text-muted-foreground ml-2">{internalMode ? "TTC (HT en interne)" : "TTC"}</span>
                </div>

                {sim && (
                  <div className="mt-5 pt-5 border-t border-border/60 space-y-2">
                    <div className="flex items-center gap-2 text-gold">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-mono uppercase tracking-widest">
                        Économie pilotage
                      </span>
                    </div>
                    <div className="text-2xl font-black text-gold">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(sim.roi.gainTtcAn)}
                      <span className="text-xs font-mono text-muted-foreground ml-1">TTC/an</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vous économiseriez <strong className="text-foreground">{fmtEur(sim.economieAnnuelleTtc)}</strong>{" "}
                      par an au total avec cette config (vs facture actuelle).
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Retour sur investissement&nbsp;:{" "}
                      <span className="text-primary-light font-semibold">
                        {sim.roi.paybackAns.toFixed(1)} ans
                      </span>
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.section>

      <WizardFooter onNext={handleNext} nextDisabled={!configChoisie || !simulations} />
    </>
  );
}

// Sérialise le résultat sans les Sets (heuresUtilisees) pour stocker en JSONB
function serializeResult(r: any) {
  return JSON.parse(
    JSON.stringify(r, (_k, v) => (v instanceof Set ? Array.from(v) : v))
  );
}
