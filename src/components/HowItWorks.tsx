import { motion } from "framer-motion";
import { PhoneCall, Wrench, Cpu, TrendingDown } from "lucide-react";

const steps = [
  {
    icon: PhoneCall,
    num: "01",
    title: "Vous nous contactez",
    desc: "Vous remplissez notre formulaire ou contactez l'un de nos distributeurs agréés. Nous évaluons gratuitement votre profil de consommation et le potentiel d'économies.",
  },
  {
    icon: Wrench,
    num: "02",
    title: "Un distributeur agréé vous installe",
    desc: "Un installateur du réseau Dynawatt près de chez vous prend en charge l'achat, l'installation et la mise en service de votre batterie. Vous payez votre installation directement à votre distributeur, en achat ou en leasing.",
  },
  {
    icon: Cpu,
    num: "03",
    title: "Le pilotage Dynawatt s'active",
    desc: "Dès la mise en service, notre algorithme de pilotage J-1 prend le relais. Charge et décharge automatiques selon les prix EPEX. Pilotage de votre PAC, ECS ou borne VE si applicable. Le pilotage Dynawatt est inclus la première année.",
  },
  {
    icon: TrendingDown,
    num: "04",
    title: "Vous économisez automatiquement",
    desc: "Suivez vos économies en temps réel via votre espace client Dynawatt. Bilans mensuels, prévisions du lendemain, optimisations en continu. À partir de la 2ᵉ année, un abonnement Dynawatt mensuel maintient votre installation à pleine performance.",
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
        className="text-center mb-16 max-w-3xl mx-auto"
      >
        <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Comment ça marche</div>
        <h2 className="text-4xl md:text-5xl font-black mb-4">
          Comment ça marche, <span className="text-gradient-violet">étape par étape</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          Dynawatt vous accompagne du début à la fin de votre projet, à travers un réseau de distributeurs agréés.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.12 }}
            className="glass rounded-3xl p-7 hover:border-primary/50 transition-all hover:-translate-y-1 group"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <s.icon className="w-6 h-6 text-primary-light" />
              </div>
              <span className="font-mono text-5xl font-black text-muted-foreground/20">{s.num}</span>
            </div>
            <h3 className="text-lg font-bold mb-3 leading-tight">{s.title}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">{s.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center mt-10"
      >
        <a
          href="/notre-modele"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-light transition-colors story-link"
        >
          En savoir plus sur notre modèle éditeur + réseau de distributeurs
        </a>
      </motion.div>
    </div>
  </section>
);
