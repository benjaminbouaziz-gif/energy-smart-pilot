import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Fish, Clock, AlertTriangle, TrendingDown, Battery, Brain, EyeOff, CheckCircle2 } from "lucide-react";

// Courbe spot EPEX simulée 24h (€/MWh)
const SPOT = [38,32,28,25,22,28,55,82,95,88,72,68,65,70,75,90,115,135,125,98,75,60,48,42];
const NEG = [50,40,30,20,10,5,15,30,45,55,40,20,-5,-15,-20,-10,15,40,60,75,60,45,35,30];

const PriceCurve = ({ data, showNeg = false, label }: { data: number[]; showNeg?: boolean; label: string }) => {
  const min = Math.min(...data, 0);
  const max = Math.max(...data);
  const range = max - min;
  const W = 600, H = 180;
  const zeroY = showNeg ? H - ((0 - min) / range) * (H - 20) - 10 : H;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 20) - 10}`).join(" ");
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">{label}</div>
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full h-44">
        {showNeg && (
          <line x1="0" x2={W} y1={zeroY} y2={zeroY} stroke="hsl(0 84% 60%)" strokeWidth="1" strokeDasharray="3 3" />
        )}
        <motion.polyline points={pts} fill="none" stroke="hsl(258 90% 76%)" strokeWidth="2.5"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeOut" }} />
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * W;
          const y = H - ((v - min) / range) * (H - 20) - 10;
          const isNeg = v < 0;
          const isPeak = v === max;
          const isLow = v === Math.min(...data.filter((d) => !showNeg || d >= 0));
          return (
            <circle key={i} cx={x} cy={y} r={isPeak || isLow || isNeg ? 4 : 0}
              fill={isNeg ? "hsl(0 84% 60%)" : isPeak ? "hsl(43 96% 56%)" : "hsl(262 83% 58%)"} />
          );
        })}
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} x={(h / 23) * W} y={H + 16} textAnchor="middle"
            fontSize="9" fontFamily="JetBrains Mono" fill="hsl(252 30% 70%)">{String(h).padStart(2, "0")}h</text>
        ))}
      </svg>
    </div>
  );
};

const TarificationDynamique = () => {
  useEffect(() => {
    document.title = "Comprendre la tarification dynamique de l'électricité | Dynawatt";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "Le prix de l'électricité change toutes les 15 minutes. Comprenez le marché EPEX Spot, les prix négatifs et comment en faire un atout grâce à la batterie pilotée.");
  }, []);

  const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
      className={`py-12 md:py-16 ${className}`}>
      <div className="container mx-auto px-4 max-w-4xl">{children}</div>
    </motion.section>
  );

  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 md:pt-40 relative">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono">
            <Clock className="w-3 h-3 text-accent" />Comprendre · 5 min de lecture
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-6">
            Pourquoi le prix de l'électricité <span className="text-gradient-violet">change toutes les heures</span> ?
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground">
            Et comment en faire un atout, pas une menace.
          </motion.p>
        </div>
      </section>

      {/* 1. Marché aux poissons */}
      <Section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <Fish className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">Imaginez le marché aux poissons</h2>
        </div>
        <div className="glass rounded-3xl p-6 md:p-8 space-y-4 text-lg leading-relaxed">
          <p>Imaginez un marché aux poissons. Chaque matin à 6h, les pêcheurs ramènent leur prise. Si la mer a été généreuse, il y a beaucoup de poissons et le prix baisse. Si la météo a été mauvaise, peu de poissons et le prix monte.</p>
          <p>L'électricité, c'est exactement pareil. Il y a des moments où il y en a beaucoup à vendre — il fait du vent, le soleil brille fort, les centrales tournent plein régime. <span className="text-primary-light font-semibold">Le prix s'effondre.</span></p>
          <p>Et il y a des moments où tout le monde veut en consommer en même temps — 19h le soir d'hiver, tout le monde rentre chez soi, allume la lumière, le chauffage, fait à manger. <span className="text-accent font-semibold">Le prix grimpe en flèche.</span></p>
        </div>
      </Section>

      {/* 2. 96 prix par jour */}
      <Section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-warm flex items-center justify-center">
            <Clock className="w-6 h-6 text-accent-foreground" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">Le prix change <span className="text-gradient-gold">96 fois par jour</span></h2>
        </div>
        <div className="space-y-6">
          <PriceCurve data={SPOT} label="EPEX Spot — journée type (€/MWh)" />
          <div className="glass rounded-3xl p-6 md:p-8 space-y-4 text-lg leading-relaxed">
            <p>En France, le prix de l'électricité est fixé par un marché qu'on appelle <span className="font-mono text-primary-light">EPEX Spot</span>. Toutes les 15 minutes, un nouveau prix est calculé en fonction de l'offre et de la demande.</p>
            <p className="font-mono text-2xl font-black text-gradient-gold">96 prix par jour. 4 par heure.</p>
            <p>Le prix peut être de 5 centimes le kilowattheure à 3h du matin, et de 35 centimes à 19h le même jour. <span className="font-semibold">Sept fois plus cher.</span></p>
            <p>La plupart des gens paient un prix moyen toute la journée — qu'on appelle le "tarif réglementé" ou TRV. C'est confortable, mais ça veut dire qu'on paie cher l'énergie même quand elle est presque gratuite à 3h du matin.</p>
          </div>
        </div>
      </Section>

      {/* 3. HP/HC */}
      <Section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">Le piège des heures pleines / heures creuses</h2>
        </div>
        <div className="glass rounded-3xl p-6 md:p-8 space-y-4 text-lg leading-relaxed">
          <p>Vous connaissez peut-être l'option "Heures pleines / Heures creuses" : 8h par jour à un prix réduit, 16h à un prix plus élevé.</p>
          <p>C'est un peu mieux que le tarif réglementé classique. Mais c'est encore une <span className="text-accent font-semibold">moyenne sur 8h</span>. Et pendant ces 8h dites "creuses", il y a des moments où l'électricité ne coûte presque rien — et d'autres où elle coûte plus cher que prévu.</p>
          <p>La tarification dynamique, c'est <span className="text-primary-light font-semibold">précis au quart d'heure</span>. Pas une moyenne sur 8h.</p>
        </div>
      </Section>

      {/* 4. Prix négatif */}
      <Section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-destructive/30 flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">Le <span className="text-destructive">prix négatif</span></h2>
        </div>
        <div className="space-y-6">
          <PriceCurve data={NEG} showNeg label="Journée avec prix négatifs (€/MWh)" />
          <div className="glass rounded-3xl p-6 md:p-8 space-y-4 text-lg leading-relaxed">
            <p>Et parfois — de plus en plus souvent — le prix devient <span className="text-destructive font-semibold">négatif</span>. Oui, négatif. Cela veut dire que les producteurs paient pour qu'on consomme leur électricité.</p>
            <p>Pourquoi ? Parce que arrêter une centrale nucléaire ou stopper des éoliennes coûte plus cher que d'offrir l'électricité gratuitement pendant quelques heures.</p>
            <p>En 2024, il y a eu <span className="font-mono font-black text-gradient-gold">plus de 350 heures à prix négatif</span> sur le marché EPEX en France. Cette tendance ne fait que croître avec le développement du solaire et de l'éolien.</p>
            <p>Si vous savez consommer ces heures-là — ou stocker cette énergie quasi gratuite pour la consommer plus tard — vous avez un avantage massif.</p>
          </div>
        </div>
      </Section>

      {/* 5. On ne peut pas tout déplacer */}
      <Section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
            <Battery className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">Le problème : on ne peut pas tout déplacer</h2>
        </div>
        <div className="glass rounded-3xl p-6 md:p-8 space-y-4 text-lg leading-relaxed">
          <p>Le service de votre restaurant est à 13h. Le pic de votre boulangerie est à 7h. La douche de vos clients d'hôtel est à 8h.</p>
          <p className="italic text-muted-foreground">Vous ne pouvez pas dire à vos clients : "Revenez à 3h du matin, le tarif sera meilleur."</p>
          <p>C'est là que la <span className="text-primary-light font-semibold">batterie change tout</span>. Elle achète l'électricité pas chère la nuit, et la restitue à l'heure où vous en avez besoin.</p>
          <p className="text-2xl font-black">Vous consommez quand vous voulez. <span className="text-gradient-gold">Au prix de la nuit.</span></p>
        </div>
      </Section>

      {/* 6. Algorithme */}
      <Section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-warm flex items-center justify-center">
            <Brain className="w-6 h-6 text-accent-foreground" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">L'algorithme qui prend les bonnes décisions</h2>
        </div>
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6 md:p-8 space-y-4 text-lg leading-relaxed">
            <p>Mais une batterie, c'est juste une boîte. Elle ne sait pas quand acheter, ni quand vendre.</p>
            <p>Notre algorithme analyse <span className="font-semibold">chaque jour à 13h les 96 prix de l'électricité du lendemain</span>. Il identifie les moments où l'électricité est la moins chère et les moments où elle est la plus chère. Il calcule la stratégie optimale pour votre profil de consommation. Il programme la batterie.</p>
            <p>Le lendemain, votre batterie exécute le plan. <span className="text-primary-light font-semibold">Vous ne faites rien. Vous économisez.</span></p>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { t: "13h chaque jour", d: "EPEX publie les prix de demain" },
              { t: "Algorithme", d: "Calcule la stratégie optimale" },
              { t: "Minuit", d: "Batterie programmée et autonome" },
            ].map((s, i) => (
              <div key={i} className="glass rounded-2xl p-5 text-center">
                <div className="font-mono text-xs text-accent uppercase tracking-wider mb-1">Étape {i + 1}</div>
                <div className="font-bold mb-1">{s.t}</div>
                <div className="text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 7. Pourquoi peu de gens en profitent */}
      <Section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            <EyeOff className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black">Pourquoi peu de gens en profitent</h2>
        </div>
        <div className="glass rounded-3xl p-6 md:p-8 space-y-4 text-lg leading-relaxed">
          <p>Les fournisseurs traditionnels n'ont pas intérêt à vous proposer la tarification dynamique. Ils gagnent leur marge sur l'écart entre votre prix fixe et le prix réel du marché. Si vous payez le prix réel, leur marge fond.</p>
          <p>Quelques nouveaux fournisseurs en France proposent enfin ces offres dynamiques. Mais sans batterie pour absorber les variations, vous prenez le risque de payer 35 centimes le kilowattheure à 19h. Pas terrible.</p>
          <p>La combinaison <span className="text-primary-light font-semibold">batterie + tarif dynamique + algorithme</span>, c'est ça qui débloque tout. Le client ne voit qu'une chose : <span className="text-gradient-gold font-bold">sa facture baisse de 30%</span>. Sans changer ses habitudes.</p>
        </div>
      </Section>

      {/* 8. Résumé */}
      <Section>
        <h2 className="text-3xl md:text-4xl font-black text-center mb-10">En résumé</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "L'électricité a un prix qui change toutes les 15 minutes (parfois négatif)",
            "Vous ne pouvez pas déplacer vos heures de consommation (vos clients viennent quand ils veulent)",
            "Une batterie pilotée intelligemment achète quand c'est gratuit, restitue quand c'est cher",
            "Vous économisez 30% sans rien changer à votre activité",
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-1" />
              <span className="text-lg">{t}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6">Voir combien <span className="text-gradient-gold">vous pouvez économiser</span></h2>
          <Button asChild size="lg" className="bg-gradient-to-r from-accent to-accent-warm text-accent-foreground font-bold h-14 px-8 glow-gold">
            <Link to="/particulier">Lancer la simulation<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default TarificationDynamique;
