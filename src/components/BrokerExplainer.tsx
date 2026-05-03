import { motion } from "framer-motion";
import { Info } from "lucide-react";

export const BrokerExplainer = () => (
  <section className="py-16 relative">
    <div className="container mx-auto px-4 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl p-6 md:p-10 border border-primary/20 bg-primary/5 backdrop-blur-sm"
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Info className="w-5 h-5 text-primary-light" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gold mb-2">
              Contexte marché
            </div>
            <h3 className="text-2xl md:text-3xl font-black mb-4">
              Pourquoi vous payez si cher aujourd'hui ?
            </h3>
            <div className="space-y-3 text-sm md:text-base text-foreground/85 leading-relaxed">
              <p>
                Depuis la guerre en Ukraine, le marché de l'électricité professionnelle est en crise.
                Beaucoup d'entreprises ont signé des contrats à des prix très élevés via des courtiers
                qui ont surfé sur la panique des marchés de gros. Résultat : les pros paient en moyenne{" "}
                <span className="text-gold font-semibold">0,26 €/kWh TTC</span>, soit{" "}
                <span className="text-gold font-semibold">35% de plus</span> que le tarif réglementé
                des particuliers.
              </p>
              <p>
                Avec Dynawatt, vous reprenez le contrôle : prix dynamique réel + pilotage intelligent
                par batterie = des économies durables, sans intermédiaire qui marge sur votre facture.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);
