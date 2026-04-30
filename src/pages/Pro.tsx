import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProForm } from "@/components/ProForm";
import { Button } from "@/components/ui/button";
import { ArrowRight, Utensils, Hotel, Tent, Croissant, Building2, TrendingUp, Calendar, Wallet } from "lucide-react";
import { useEffect } from "react";

const SECTORS = [
  { icon: Utensils, name: "Restaurants & Pizzerias", range: "30k-80k kWh/an", saving: "4 500 - 8 000 €/an" },
  { icon: Hotel, name: "Hôtels", range: "80k-250k kWh/an", saving: "8 000 - 25 000 €/an" },
  { icon: Tent, name: "Campings", range: "40k-150k kWh/an", saving: "5 000 - 15 000 €/an" },
  { icon: Croissant, name: "Boulangeries & Artisans", range: "50k-100k kWh/an", saving: "5 000 - 12 000 €/an" },
];

const ProPage = () => {
  useEffect(() => {
    document.title = "Dynawatt Pro — Économisez jusqu'à 12 000 €/an";
  }, []);

  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 relative">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono">
            <Building2 className="w-3 h-3 text-gold" />Solution professionnels
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-black mb-6">
            Votre énergie <span className="text-gradient-violet">professionnelle</span>,<br />pilotée intelligemment.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Restaurants, hôtels, campings, boulangeries, artisans. Économisez jusqu'à <span className="text-gold font-semibold">12 000 €/an</span> sans changer votre activité.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button asChild size="lg" className="bg-gradient-to-r from-gold to-gold-warm text-background font-bold h-14 px-8 glow-gold">
              <a href="#simulation">Calculer mes économies<ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pour qui */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">Pour qui ?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SECTORS.map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:border-gold/40 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5 text-primary-light" />
                </div>
                <h3 className="font-bold mb-2">{s.name}</h3>
                <p className="text-xs font-mono text-muted-foreground mb-3">{s.range}</p>
                <div className="text-sm font-bold text-gradient-gold">{s.saving}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cas client */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded bg-gold/20 text-gold border border-gold/30">Cas client réel</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-2">Hotel America Opera</h2>
              <p className="text-muted-foreground mb-8">39 chambres + bar — Paris 8e</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: TrendingUp, label: "Conso annuelle", value: "106 688", unit: "kWh" },
                  { icon: Wallet, label: "Facture TRV", value: "22 400 €", unit: "/an" },
                  { icon: Wallet, label: "Avec Dynawatt", value: "15 000 €", unit: "/an", gold: true },
                  { icon: Calendar, label: "ROI", value: "1,8 an", unit: "+331€/mois", gold: true },
                ].map((m, i) => (
                  <div key={i} className={`rounded-2xl p-4 ${m.gold ? "bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30" : "bg-card/50 border border-border"}`}>
                    <m.icon className={`w-4 h-4 mb-2 ${m.gold ? "text-gold" : "text-muted-foreground"}`} />
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                    <div className={`font-mono text-2xl font-black mt-1 ${m.gold ? "text-gradient-gold" : ""}`}>{m.value}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.unit}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-gold/10 border border-gold/30 text-center">
                <span className="font-mono text-2xl font-black text-gradient-gold">7 400 €</span>
                <span className="text-sm text-muted-foreground ml-2">d'économies annuelles — soit 33% de réduction</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simulation */}
      <section id="simulation" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Simulation gratuite</div>
            <h2 className="text-4xl md:text-5xl font-black">Vos économies en <span className="text-gradient-gold">3 minutes</span>.</h2>
          </motion.div>
          <ProForm />
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default ProPage;
