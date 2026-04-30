import { motion } from "framer-motion";
import { Battery, Cpu, TrendingDown } from "lucide-react";

const steps = [
  {
    icon: Battery,
    num: "01",
    title: "On installe une batterie Tigo",
    desc: "De 7,3 à 36 kWh selon vos besoins. Hardware premium, garantie 11 ans, partenaire Nasdaq (TYGO).",
  },
  {
    icon: Cpu,
    num: "02",
    title: "On pilote automatiquement",
    desc: "Notre algorithme analyse les prix EPEX J-1 au quart d'heure. Charge aux heures creuses, décharge aux pics.",
  },
  {
    icon: TrendingDown,
    num: "03",
    title: "Vous économisez dès M1",
    desc: "Jusqu'à 33% d'économies sur votre facture mensuelle. Cash flow positif dès le premier mois.",
  },
];

export const HowItWorks = () => (
  <section id="comment" className="py-24 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-2xl mx-auto"
      >
        <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Comment ça marche</div>
        <h2 className="text-4xl md:text-5xl font-black">Trois étapes. <span className="text-gradient-violet">Zéro complexité.</span></h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 relative">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="glass rounded-3xl p-8 hover:border-primary/50 transition-all hover:-translate-y-1 group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <s.icon className="w-6 h-6 text-primary-light" />
              </div>
              <span className="font-mono text-5xl font-black text-muted-foreground/20">{s.num}</span>
            </div>
            <h3 className="text-xl font-bold mb-3">{s.title}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
