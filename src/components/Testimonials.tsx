import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const items = [
  {
    name: "Hotel America Opera",
    role: "39 chambres + bar — Paris 8e",
    savings: "8 980 €/an",
    quote: "Le ROI s'est fait en 1,8 an. Cash flow positif dès le premier mois. Aucune contrainte sur l'exploitation.",
    badge: "Hôtellerie",
  },
  {
    name: "JC & Co",
    role: "Restaurant sushi — Rosny-sous-Bois",
    savings: "6 250 €/an",
    quote: "On ne s'occupe de rien. La batterie travaille pendant qu'on cuisine. La facture a fondu.",
    badge: "Restauration",
  },
  {
    name: "Villa Le Mistral",
    role: "Maison 200m² — piscine + clim — Bouches-du-Rhône",
    savings: "1 300 €/an",
    quote: "L'été, la clim et la pompe de piscine tournent en heures creuses. On ne change rien à nos habitudes.",
    badge: "Particulier",
  },
];

export const Testimonials = () => (
  <section id="temoignages" className="py-24 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16 max-w-2xl mx-auto"
      >
        <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Cas clients</div>
        <h2 className="text-4xl md:text-5xl font-black">Des économies <span className="text-gradient-violet">mesurables</span>.</h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5">
        {items.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass rounded-2xl p-6 hover:border-primary/40 transition-all flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-primary/20 text-primary-light border border-primary/30">{t.badge}</span>
              <Quote className="w-5 h-5 text-gold/60" />
            </div>
            <p className="text-foreground/90 leading-relaxed mb-5 flex-1">"{t.quote}"</p>
            <div className="border-t border-border/50 pt-4">
              <div className="font-bold">{t.name}</div>
              <div className="text-xs text-muted-foreground mb-3">{t.role}</div>
              <div className="font-mono text-xl font-bold text-gradient-gold">{t.savings}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">économies annuelles</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
