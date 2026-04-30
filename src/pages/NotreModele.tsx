import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Cpu, Wrench, User, Shield, Network, Info, ArrowRight, MapPin } from "lucide-react";

const COLUMNS = [
  {
    icon: Cpu,
    title: "Dynawatt (nous)",
    color: "from-primary/30 to-primary/5 border-primary/40",
    items: [
      "Édition de l'algorithme de pilotage J-1",
      "Sélection du hardware (Tigo)",
      "Maintenance logicielle",
      "Espace client digital",
      "Optimisation continue de l'algorithme",
    ],
  },
  {
    icon: Wrench,
    title: "Nos distributeurs agréés",
    color: "from-gold/30 to-gold/5 border-gold/40",
    items: [
      "Achat de la batterie chez Dynawatt",
      "Installation chez vous",
      "Service après-vente local",
      "Conseil et accompagnement",
      "Garantie installation",
    ],
  },
  {
    icon: User,
    title: "Vous (le client)",
    color: "from-emerald-500/30 to-emerald-500/5 border-emerald-500/40",
    items: [
      "Vous achetez chez le distributeur",
      "Vous bénéficiez du pilotage Dynawatt",
      "Vous économisez 30%+ sur votre facture",
      "Vous suivez vos économies en direct",
      "Vous restez maître de votre installation",
    ],
  },
];

const REASONS = [
  {
    title: "Notre expertise est dans l'algorithme",
    text: "Construire un algorithme de pilotage qui optimise une batterie au quart d'heure sur le marché EPEX demande une expertise technique pointue. C'est notre cœur de métier. Nous y consacrons toute notre énergie.",
  },
  {
    title: "L'installation est un métier de terrain",
    text: "Installer une batterie de 14 kWh ou 29 kWh dans un restaurant à Lyon ou un hôtel à Marseille demande une présence locale, un savoir-faire électrique et un service après-vente de proximité. Nos distributeurs agréés sont des professionnels expérimentés du secteur énergétique, sélectionnés pour leur sérieux.",
  },
  {
    title: "La proximité crée la confiance",
    text: "Vous avez un interlocuteur unique près de chez vous, qui connaît votre installation et qui peut intervenir rapidement. Pas une hotline anonyme. Un vrai contact humain dans votre région.",
  },
  {
    title: "La technologie reste à pleine performance",
    text: "Pendant ce temps, Dynawatt s'occupe de l'algorithme. Nous le mettons à jour en continu avec les données réelles de centaines d'installations. Plus le réseau grandit, plus l'algorithme s'améliore. Vous bénéficiez automatiquement de chaque amélioration.",
  },
];

const NotreModele = () => {
  useEffect(() => {
    document.title = "Notre modèle — Dynawatt | Éditeur de pilotage + réseau de distributeurs";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute(
      "content",
      "Dynawatt édite l'algorithme de pilotage qui rend votre batterie intelligente. L'installation et le service sont assurés par notre réseau de distributeurs agréés."
    );
    document.head.appendChild(meta);
    const link = document.querySelector('link[rel="canonical"]') || document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", window.location.origin + "/notre-modele");
    document.head.appendChild(link);
  }, []);

  return (
    <main className="relative">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 md:pt-40">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono"
          >
            <Network className="w-3 h-3 text-gold" />
            Notre modèle
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-6 leading-tight"
          >
            Éditeur de pilotage <span className="text-gradient-violet">+</span> réseau de{" "}
            <span className="text-gradient-gold">distributeurs agréés</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Dynawatt n'installe pas directement. Nous éditons l'algorithme qui rend chaque batterie intelligente,
            et nous formons un réseau de distributeurs partenaires qui assurent l'installation et le service de proximité.
          </motion.p>
        </div>
      </section>

      {/* Section 1 — Qui fait quoi */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Qui fait quoi</div>
            <h2 className="text-3xl md:text-4xl font-black">Trois rôles, une même promesse</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {COLUMNS.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-3xl p-7"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} border flex items-center justify-center mb-5`}>
                  <c.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-4">{c.title}</h3>
                <ul className="space-y-2.5">
                  {c.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-gold mt-1">•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2 — Pourquoi ce modèle */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Pourquoi ce modèle</div>
            <h2 className="text-3xl md:text-4xl font-black">Chacun son métier, à fond</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {REASONS.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-3xl p-7"
              >
                <div className="text-3xl font-mono font-black text-muted-foreground/20 mb-2">0{i + 1}</div>
                <h3 className="text-lg font-bold mb-3">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Le pilotage Dynawatt */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 md:p-12 border-gold/30 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono uppercase tracking-wider mb-5">
                <Shield className="w-3 h-3" />
                Le pilotage Dynawatt
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-5">
                Pourquoi le pilotage est inclus la première année
              </h3>
              <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                <p>
                  Quand vous installez votre batterie, l'algorithme Dynawatt est inclus pendant 12 mois.
                  C'est le temps pour vous de constater concrètement les économies, de prendre vos marques
                  avec votre espace client, et de vivre une saison complète d'utilisation.
                </p>
                <p>
                  À partir de la deuxième année, un abonnement Dynawatt mensuel garantit la continuité du
                  pilotage à pleine performance, les mises à jour de l'algorithme, et votre accès à l'espace client.
                </p>
                <p>
                  Si vous décidez de ne pas renouveler, votre batterie continue de fonctionner — mais avec un
                  pilotage basique du fabricant, sans optimisation tarifaire dynamique.
                </p>
              </div>

              <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/30">
                <Info className="w-5 h-5 text-primary-light shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  Vous serez informé en avance avant la fin de votre première année.
                  Aucun engagement automatique sans votre validation explicite.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 4 — Réseau de distributeurs */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Notre réseau</div>
          <h2 className="text-3xl md:text-4xl font-black mb-8">Des distributeurs partout en France</h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-10 md:p-14"
          >
            <MapPin className="w-12 h-12 mx-auto text-primary-light mb-5" />
            <p className="text-lg font-semibold mb-2">Réseau en cours de constitution dans toute la France</p>
            <p className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
              Nous sélectionnons actuellement nos distributeurs partenaires région par région.
              En attendant, c'est Dynawatt qui vous met directement en relation avec l'installateur le plus adapté à votre projet.
            </p>
            <Button asChild variant="outline" className="border-primary/40 hover:bg-primary/10">
              <Link to="/contact">
                Devenir distributeur Dynawatt
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Besoin d'une simulation ?</h2>
          <p className="text-muted-foreground mb-8">
            Décrivez-nous votre projet, on vous recontacte sous 24h avec un audit personnalisé.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-gold to-gold-warm text-background hover:opacity-90 font-bold h-12 px-7">
              <Link to="/contact">Contactez-nous<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 border-primary/40 hover:bg-primary/10">
              <Link to="/particulier">Simulateur particulier</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default NotreModele;
