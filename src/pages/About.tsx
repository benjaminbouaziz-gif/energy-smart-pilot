import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Target, Eye, Heart, Users, Zap, Leaf, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const VALUES = [
  { icon: Target, title: "Mission", desc: "Rendre l'énergie résidentielle et professionnelle accessible, prévisible et 30% moins chère — sans subvention, sans changement d'habitudes." },
  { icon: Eye, title: "Vision", desc: "Devenir l'opérateur de référence du pilotage énergétique intelligent en France et en Europe d'ici 2030." },
  { icon: Heart, title: "Valeurs", desc: "Transparence radicale sur la facture, performance mesurable, technologie sobre, et engagement long terme avec nos clients." },
];

const NUMBERS = [
  { value: "30%", label: "Économies moyennes" },
  { value: "1,8 an", label: "ROI moyen pro" },
  { value: "10 ans", label: "Garantie hardware" },
  { value: "100%", label: "Made in EU" },
];

const AboutPage = () => {
  useEffect(() => {
    document.title = "À propos — Dynawatt, opérateur d'énergie intelligente";
  }, []);

  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono">
            <Users className="w-3 h-3 text-gold" />Notre histoire
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-black mb-6">
            On ne vend pas des batteries.<br />On <span className="text-gradient-gold">dynamite</span> votre facture.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Dynawatt est né d'un constat simple : le marché de l'énergie est devenu volatil, mais les outils pour en profiter restent réservés aux grands industriels. On démocratise.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="glass rounded-3xl p-8 md:p-12 space-y-5 text-muted-foreground leading-relaxed">
            <p className="text-foreground text-lg font-semibold">L'origine.</p>
            <p>En 2022, la facture électrique de millions de foyers et de PME explose. Pendant ce temps, le prix spot EPEX devient parfois <span className="text-gold font-semibold">négatif</span> en pleine journée. Une absurdité économique.</p>
            <p>Notre conviction : combiner une <span className="text-foreground">batterie résidentielle robuste</span>, un <span className="text-foreground">contrat d'énergie dynamique</span> et un <span className="text-foreground">algorithme propriétaire</span> permet à n'importe quel client de capturer cette volatilité — sans rien y connaître.</p>
            <p className="text-foreground text-lg font-semibold pt-4">Aujourd'hui.</p>
            <p>Dynawatt opère pour des hôtels, restaurants, campings, boulangeries et particuliers en France. Notre algorithme tourne 24/7 et économise en moyenne <span className="text-gold font-semibold">30% de la facture annuelle</span>, avec un ROI de 1,8 an pour les pros.</p>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NUMBERS.map((n, i) => (
              <motion.div key={n.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-6 text-center">
                <div className="font-mono text-3xl md:text-4xl font-black text-gradient-gold">{n.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">{n.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Ce qui nous anime</div>
            <h2 className="text-4xl md:text-5xl font-black">Mission, vision, <span className="text-gradient-violet">valeurs</span>.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-primary-light" />
                </div>
                <h3 className="font-bold text-xl mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="glass rounded-3xl p-8 md:p-12 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-gold uppercase tracking-widest mb-4">
              <Zap className="w-3 h-3" />Partenaire technologique
            </div>
            <h3 className="text-3xl md:text-4xl font-black mb-3">Tigo Energy</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">Leader mondial des onduleurs et batteries hybrides résidentielles. Hardware certifié, garantie constructeur 10 ans, plus de 1,5M d'installations dans le monde.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Leaf className="w-10 h-10 text-gold mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black mb-6">Rejoignez les clients qui ont <span className="text-gradient-gold">repris le contrôle</span>.</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-gold to-gold-warm text-background font-bold h-14 px-8 glow-gold">
              <Link to="/pro">Solution pro<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 border-primary/40 hover:bg-primary/10">
              <Link to="/particulier">Solution particulier</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default AboutPage;
