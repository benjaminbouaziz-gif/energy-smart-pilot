import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { EnergyChart } from "@/components/EnergyChart";
import { Brain, Cpu, Database, LineChart, Radio, Shield, Zap, ArrowRight, Cloud, GitBranch, Activity } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const PIPELINE = [
  { icon: Cloud, title: "Données J-1", desc: "EPEX Spot, prix dynamiques, météo, profil de charge client.", code: "epex.fetch(t-24h)" },
  { icon: Brain, title: "Algorithme propriétaire", desc: "Optimisation MILP : minimisation du coût sous contrainte de batterie.", code: "milp.solve(prices, soc)" },
  { icon: GitBranch, title: "Plan de charge", desc: "Génération de la courbe charge/décharge optimale 96 créneaux 15min.", code: "schedule[96] = optimum" },
  { icon: Radio, title: "Pilotage hardware", desc: "Push API vers les onduleurs Tigo Energy via cloud sécurisé.", code: "tigo.push(plan)" },
  { icon: Activity, title: "Monitoring temps réel", desc: "Télémétrie continue, ajustement adaptatif si écart > 5%.", code: "loop.if(drift > 5%)" },
];

const STACK = [
  { label: "Hardware", value: "Tigo Energy", desc: "Onduleurs hybrides + batteries LFP" },
  { label: "Cloud", value: "AWS eu-west", desc: "Infrastructure souveraine européenne" },
  { label: "Algorithme", value: "Python + MILP", desc: "Solveur d'optimisation propriétaire" },
  { label: "Data feed", value: "EPEX Spot", desc: "Prix spot J-1 + météo France" },
  { label: "API", value: "REST + MQTT", desc: "Communication bidirectionnelle 15min" },
  { label: "Sécurité", value: "TLS 1.3 + RBAC", desc: "Chiffrement end-to-end" },
];

const PilotagePage = () => {
  useEffect(() => {
    document.title = "Dynawatt Pilotage — L'algorithme qui dynamite votre facture";
  }, []);

  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 relative">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono">
            <Cpu className="w-3 h-3 text-gold" />La technologie Dynawatt
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-black mb-6">
            L'<span className="text-gradient-violet">algorithme</span> qui dynamite<br />votre facture.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Une intelligence logicielle propriétaire qui anticipe les prix EPEX J-1 et pilote vos batteries au créneau de 15 minutes près.
          </motion.p>
        </div>
      </section>

      {/* Live chart */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="glass rounded-3xl p-6 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs font-mono text-gold uppercase tracking-widest mb-1">Live — EPEX Spot</div>
                <h3 className="text-2xl font-black">Décision J-1, exécution 15min</h3>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />Optimisation active
              </div>
            </div>
            <EnergyChart />
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Pipeline</div>
            <h2 className="text-4xl md:text-5xl font-black">5 étapes, <span className="text-gradient-gold">96 créneaux/jour</span>.</h2>
          </div>
          <div className="space-y-4">
            {PIPELINE.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-4 md:w-72 shrink-0">
                  <div className="font-mono text-3xl font-black text-gradient-violet w-10">0{i + 1}</div>
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-primary-light" />
                  </div>
                  <h3 className="font-bold text-lg">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground flex-1">{step.desc}</p>
                <code className="font-mono text-xs px-3 py-1.5 rounded-lg bg-background/60 border border-border text-gold whitespace-nowrap">
                  {step.code}
                </code>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack technique */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Stack technique</div>
            <h2 className="text-4xl md:text-5xl font-black">Du <span className="text-gradient-violet">solide</span>, du <span className="text-gradient-gold">souverain</span>.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STACK.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-2xl p-6 hover:border-gold/40 transition-all"
              >
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">{s.label}</div>
                <div className="text-xl font-black mb-2">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité & garanties */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Shield, title: "Données chiffrées", desc: "TLS 1.3 end-to-end. Hébergement Europe. RGPD natif." },
              { icon: Zap, title: "Garantie 10 ans", desc: "Hardware Tigo + algorithme. Maintenance incluse." },
              { icon: LineChart, title: "Performance contractuelle", desc: "Engagement de réduction minimale. Audit transparent." },
            ].map((g) => (
              <div key={g.title} className="glass rounded-2xl p-6">
                <g.icon className="w-6 h-6 text-gold mb-4" />
                <h3 className="font-bold mb-2">{g.title}</h3>
                <p className="text-sm text-muted-foreground">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi le pilotage seul fait l'essentiel */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Différenciation</div>
            <h2 className="text-3xl md:text-5xl font-black">
              Pourquoi notre pilotage seul fait <span className="text-gradient-gold">déjà l'essentiel</span> du travail
            </h2>
          </div>
          <div className="glass rounded-3xl p-8 md:p-10 space-y-5 text-muted-foreground leading-relaxed">
            <p>
              Une installation solaire avec batterie cumule trois sources d'économie : production gratuite, autoconsommation, et arbitrage tarifaire.
            </p>
            <p>
              Dans une installation pro réelle,{" "}
              <span className="text-foreground font-bold">l'arbitrage tarifaire représente 60 à 80% des économies totales</span>. La production solaire et l'autoconsommation représentent 20 à 40%.
            </p>
            <p>
              Dynawatt sans panneaux solaires capture donc déjà la majorité des économies. C'est ce qui rend notre solution si compétitive financièrement : nous adressons{" "}
              <span className="text-gold font-bold">le levier qui rapporte le plus, sans l'investissement qui coûte le plus</span>.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Prêt à voir le pilotage <span className="text-gradient-gold">à l'œuvre</span> ?</h2>
          <p className="text-lg text-muted-foreground mb-8">Démonstration live avec vos propres données de consommation.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-gold to-gold-warm text-background font-bold h-14 px-8 glow-gold">
              <Link to="/pro">Je suis pro<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 border-primary/40 hover:bg-primary/10">
              <Link to="/particulier">Je suis particulier</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default PilotagePage;
