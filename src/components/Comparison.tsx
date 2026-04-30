import { motion } from "framer-motion";
import { Check } from "lucide-react";

const rows = [
  { label: "TRV", price: "0,21 €", saving: "—", color: "text-muted-foreground", highlight: false },
  { label: "Concurrent -10%", price: "0,189 €", saving: "-10%", color: "text-foreground/80", highlight: false },
  { label: "Concurrent -20%", price: "0,168 €", saving: "-20%", color: "text-foreground/80", highlight: false },
  { label: "Dynawatt", price: "0,141 €", saving: "-33%", color: "text-gold", highlight: true },
];

export const Comparison = () => (
  <section className="py-24 relative">
    <div className="container mx-auto px-4 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Comparaison</div>
        <h2 className="text-4xl md:text-5xl font-black">Le marché. <span className="text-gradient-gold">Et nous.</span></h2>
        <p className="mt-4 text-muted-foreground">Prix kWh TTC moyen sur 100 kWh consommés.</p>
      </motion.div>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="grid grid-cols-3 px-6 py-4 border-b border-border/50 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <div>Offre</div>
          <div className="text-center">Prix kWh TTC</div>
          <div className="text-right">Économies</div>
        </div>
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={`grid grid-cols-3 px-6 py-5 items-center border-b border-border/30 last:border-0 ${
              r.highlight ? "bg-gradient-to-r from-primary/15 via-gold/5 to-transparent" : ""
            }`}
          >
            <div className={`font-bold flex items-center gap-2 ${r.highlight ? "text-foreground" : ""}`}>
              {r.highlight && <Check className="w-4 h-4 text-gold" />}
              {r.label}
            </div>
            <div className={`text-center font-mono text-lg ${r.color}`}>{r.price}</div>
            <div className={`text-right font-mono text-lg font-bold ${r.color}`}>{r.saving}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
