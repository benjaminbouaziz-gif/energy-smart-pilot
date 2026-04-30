import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticulierForm } from "@/components/ParticulierForm";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sun, Snowflake, Zap, Waves, Home as HomeIcon } from "lucide-react";
import { ComparativeTable } from "@/components/ComparativeTable";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const PROFILES = [
  { icon: Sun, name: "Maisons du Sud", desc: "Piscine + clim", detail: "Forte conso été. 6 mois de spreads spot très favorables." },
  { icon: Snowflake, name: "Maisons avec PAC", desc: "Pompe à chaleur + ECS", detail: "Conso hivernale élevée. Double levier batterie + pilotage thermique." },
  { icon: Zap, name: "Foyers avec VE", desc: "Recharge nocturne pilotée", detail: "Économies sur la charge VE : 200-400 €/an supplémentaires." },
  { icon: Waves, name: "Multiples charges flexibles", desc: "Piscine, jacuzzi, ECS", detail: "Plus de charges flexibles = plus d'économies." },
];

const ParticulierPage = () => {
  useEffect(() => {
    document.title = "Dynawatt Particuliers — Jusqu'à 35% d'économies";
  }, []);

  return (
    <main>
      <Navbar />

      <section className="pt-32 pb-16 md:pt-40 relative">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono">
            <HomeIcon className="w-3 h-3 text-gold" />Solution résidentielle
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-black mb-6">
            Votre maison consomme.<br /><span className="text-gradient-violet">Dynawatt fait le reste.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Pour les maisons à forte consommation : piscine, climatisation, pompe à chaleur, véhicule électrique. Réduisez votre facture jusqu'à <span className="text-gold font-semibold">35%</span> sans rien changer à votre confort.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button asChild size="lg" className="bg-gradient-to-r from-gold to-gold-warm text-background font-bold h-14 px-8 glow-gold">
              <a href="#simulation">Calculer mes économies<ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Comparatif solaire */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <ComparativeTable
            title="Vous hésitez avec le solaire ?"
            subtitle="C'est une question légitime. Voici comment se compare honnêtement Dynawatt face à une installation photovoltaïque complète."
            rows={[
              { label: "Investissement", alternative: "25 000 à 35 000 €", dynawatt: "6 000 à 9 000 €", highlight: true },
              { label: "Délai de mise en service", alternative: "12 à 18 mois", dynawatt: "4 à 6 semaines" },
              { label: "Toiture nécessaire", alternative: "Plein sud, sans ombre", dynawatt: "Aucune" },
              { label: "Démarches administratives", alternative: "Enedis, mairie, CONSUEL", dynawatt: "Aucune" },
              { label: "Économies annuelles", alternative: "1 200 à 1 800 €/an", dynawatt: "1 000 à 1 500 €/an" },
              { label: "ROI", alternative: "12 à 20 ans", dynawatt: "5 à 8 ans", highlight: true },
              { label: "Idéal si", alternative: "Maison, propriétaire long terme", dynawatt: "Tout type de logement" },
            ]}
          />
          <div className="max-w-3xl mx-auto mt-8 space-y-4 text-sm text-muted-foreground">
            <p>
              Le solaire reste pertinent si vous êtes propriétaire d'une maison avec une toiture adaptée et que vous prévoyez d'y vivre 15 à 20 ans. Dans ce cas, c'est probablement la meilleure solution.
            </p>
            <p>
              Pour les 90% d'autres situations — locataires, propriétaires sans toiture exposée, profils urbains, projets à moyen terme, ou simplement budgets limités — Dynawatt capture la majorité des économies pour une fraction de l'investissement.
            </p>
            <p className="italic">Ce n'est pas une compétition. C'est une question de profil.</p>
            <div className="text-center pt-4">
              <a href="#simulation" className="inline-flex items-center gap-2 text-gold font-bold hover:gap-3 transition-all">
                Voir si Dynawatt est fait pour vous — Calculer mes économies <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="text-center pt-2">
              <Link to="/comprendre/vs-solaire" className="text-xs font-mono text-muted-foreground hover:text-foreground underline">
                Voir la comparaison détaillée sur 4 profils →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">Profils résidentiels cibles</h2>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {PROFILES.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:border-gold/40 transition-all flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold">{p.name}</h3>
                  <div className="text-xs font-mono text-primary-light mb-2">{p.desc}</div>
                  <p className="text-sm text-muted-foreground">{p.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cas type */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-gold/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <span className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded bg-primary/20 text-primary-light border border-primary/30">Cas type</span>
              <h2 className="text-3xl md:text-4xl font-black mt-3 mb-2">Maison du Sud — 200 m²</h2>
              <p className="text-muted-foreground mb-8">Piscine + climatisation + pompe à chaleur + 1 VE</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { l: "Conso annuelle", v: "18 000", u: "kWh" },
                  { l: "Facture TRV", v: "3 800 €", u: "/an" },
                  { l: "Avec Dynawatt", v: "2 500 €", u: "/an", gold: true },
                  { l: "Économie", v: "1 300 €", u: "/an", gold: true },
                ].map((m, i) => (
                  <div key={i} className={`rounded-2xl p-4 ${m.gold ? "bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30" : "bg-card/50 border border-border"}`}>
                    <div className="text-xs text-muted-foreground">{m.l}</div>
                    <div className={`font-mono text-2xl font-black mt-1 ${m.gold ? "text-gradient-gold" : ""}`}>{m.v}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.u}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="simulation" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Simulation gratuite</div>
            <h2 className="text-4xl md:text-5xl font-black">Réservez votre <span className="text-gradient-gold">simulation</span>.</h2>
          </motion.div>
          <ParticulierForm />
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default ParticulierPage;
