import { motion } from "framer-motion";
import { Cpu, Shield, FileText, Layers } from "lucide-react";

const pillars = [
  { icon: Cpu, title: "Algorithme propriétaire", desc: "Pilotage J-1, optimisation au quart d'heure, intégration TURPE complète." },
  { icon: Shield, title: "Hardware premium", desc: "Batteries Tigo (Nasdaq: TYGO). Garantie constructeur 11 ans." },
  { icon: FileText, title: "Contrat optimisé", desc: "Sobry ou autre fournisseur dynamique sélectionné selon votre profil." },
  { icon: Layers, title: "Tout-en-un", desc: "Une seule mensualité de leasing. Zéro gestion. Zéro complexité." },
];

export const WhyDynawatt = () => (
  <section className="py-24 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16 max-w-2xl mx-auto"
      >
        <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Pourquoi Dynawatt</div>
        <h2 className="text-4xl md:text-5xl font-black">Quatre piliers. <span className="text-gradient-gold">Une promesse.</span></h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {pillars.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass rounded-2xl p-6 hover:border-gold/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-transparent border border-gold/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <p.icon className="w-5 h-5 text-gold" />
            </div>
            <h3 className="font-bold mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
