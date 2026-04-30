import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ComparativeTable } from "@/components/ComparativeTable";
import { ArrowRight, Sun, Home, Utensils, Hotel, CheckCircle2, AlertCircle } from "lucide-react";

const PROFILES = [
  {
    icon: Home,
    name: "Particulier Nord — maison classique",
    rows: [
      { label: "Conso annuelle", alternative: "9 000 kWh", dynawatt: "9 000 kWh" },
      { label: "Coût installation", alternative: "22 000 €", dynawatt: "7 500 €", highlight: true },
      { label: "Économies / an", alternative: "1 200 €", dynawatt: "950 €" },
      { label: "ROI", alternative: "≈ 18 ans", dynawatt: "≈ 8 ans", highlight: true },
    ],
    verdict:
      "Si la toiture est exposée plein sud et que vous restez 20 ans, le solaire reste pertinent. Sinon, Dynawatt est largement préférable.",
  },
  {
    icon: Sun,
    name: "Particulier Sud — villa piscine + clim + VE",
    rows: [
      { label: "Conso annuelle", alternative: "18 000 kWh", dynawatt: "18 000 kWh" },
      { label: "Coût installation", alternative: "32 000 €", dynawatt: "8 000 €", highlight: true },
      { label: "Économies / an", alternative: "1 800 €", dynawatt: "1 300 €" },
      { label: "ROI", alternative: "≈ 17 ans", dynawatt: "≈ 6 ans", highlight: true },
    ],
    verdict:
      "Le solaire est intéressant mais long et lourd. Dynawatt capture 70% des économies dès le premier mois. Les deux sont d'ailleurs combinables plus tard.",
  },
  {
    icon: Utensils,
    name: "Pro restaurant moyen",
    rows: [
      { label: "Conso annuelle", alternative: "57 000 kWh", dynawatt: "57 000 kWh" },
      { label: "Coût installation", alternative: "55 000 €", dynawatt: "11 000 €", highlight: true },
      { label: "Économies / an", alternative: "5 200 €", dynawatt: "6 250 €" },
      { label: "ROI", alternative: "≈ 11 ans", dynawatt: "≈ 1,8 an", highlight: true },
    ],
    verdict:
      "La majorité des restaurateurs sont locataires des murs. Dynawatt est non seulement plus rapide, il rapporte aussi davantage par l'arbitrage tarifaire.",
  },
  {
    icon: Hotel,
    name: "Pro hôtel urbain",
    rows: [
      { label: "Conso annuelle", alternative: "100 000 kWh", dynawatt: "100 000 kWh" },
      { label: "Coût installation", alternative: "70 000 €", dynawatt: "14 500 €", highlight: true },
      { label: "Économies / an", alternative: "7 500 €", dynawatt: "8 900 €" },
      { label: "ROI", alternative: "≈ 10 ans", dynawatt: "≈ 1,6 an", highlight: true },
    ],
    verdict:
      "Toiture parisienne en zone classée, contraintes ABF, copropriété : impossible d'installer du solaire complet. Dynawatt est la seule solution réellement déployable.",
  },
];

const VsSolaire = () => {
  useEffect(() => {
    document.title = "Dynawatt vs Solaire — Comparaison honnête";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Comparaison honnête Dynawatt vs solaire complet sur 4 profils types. Coûts, ROI, économies — pas de marketing, juste des faits."
    );
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}/comprendre/vs-solaire`);
  }, []);

  return (
    <main>
      <Navbar />

      <section className="pt-32 pb-12 md:pt-40">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono"
          >
            <Sun className="w-3 h-3 text-gold" />Comparaison honnête
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-6"
          >
            Dynawatt vs <span className="text-gradient-violet">solaire complet</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground"
          >
            Voici les chiffres exacts pour 4 profils types. Pas de marketing, juste des faits.
          </motion.p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          {PROFILES.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <p.icon className="w-5 h-5 text-primary-light" />
                </div>
                <h2 className="text-xl md:text-2xl font-black">{p.name}</h2>
              </div>
              <ComparativeTable rows={p.rows} />
              <div className="mt-4 p-4 rounded-xl bg-gold/10 border border-gold/30 text-sm">
                <span className="font-bold text-gold">Verdict honnête : </span>
                {p.verdict}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl grid md:grid-cols-2 gap-6">
          <div className="glass rounded-3xl p-8 border-gold/30">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-gold" />
              <h3 className="text-xl font-black">Quand le solaire reste meilleur</h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Maison individuelle avec toiture sud impeccable",
                "Propriétaire long terme, 15 à 20 ans dans le bâtiment",
                "Budget disponible 30 000 € et plus",
                "Volonté forte d'autonomie énergétique",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-3xl p-8 border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-primary-light" />
              <h3 className="text-xl font-black">Quand Dynawatt est le bon choix</h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Locataires (particuliers ou pros)",
                "Toiture inadaptée ou ombrée",
                "Budget limité ou approche pragmatique",
                "Projet à moyen terme (5-10 ans)",
                "Copropriété — la seule solution réellement déployable",
                "Bâtiments tertiaires sans toiture exploitable",
                "Toute situation où la rapidité de déploiement compte",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-light shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Vous voulez vérifier <span className="text-gradient-gold">votre profil</span> ?
          </h2>
          <p className="text-muted-foreground mb-8">
            Calculez votre simulation gratuite. 3 minutes. Sans engagement.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-gold to-gold-warm text-background font-bold h-14 px-8 glow-gold">
              <Link to="/particulier#simulation">Je suis particulier<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 border-primary/40 hover:bg-primary/10">
              <Link to="/pro#simulation">Je suis pro</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default VsSolaire;
