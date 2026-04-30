import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Snowflake,
  Home,
  Store,
  CheckCircle2,
  XCircle,
  Phone,
  Lightbulb,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

interface NonOptimalProfileProps {
  icon: LucideIcon;
  index: number;
  title: string;
  profileType: string[];
  whyText: string[];
  numbers: { label: string; value: string }[];
  recommendation: string;
  bonus?: string;
  reverse?: boolean;
}

const NonOptimalProfile = ({
  icon: Icon,
  index,
  title,
  profileType,
  whyText,
  numbers,
  recommendation,
  bonus,
  reverse = false,
}: NonOptimalProfileProps) => (
  <section className="py-16 md:py-24">
    <div className="container mx-auto px-4">
      <div className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, x: reverse ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="aspect-square max-w-md mx-auto glass rounded-3xl p-10 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-destructive/10" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-destructive/20 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="text-9xl font-black text-gradient-violet opacity-30">0{index}</div>
              <Icon className="w-32 h-32 text-primary-light" strokeWidth={1.2} />
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: reverse ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="text-xs font-mono uppercase tracking-widest text-destructive mb-3">
            Profil non optimal #{index}
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">{title}</h2>

          <div className="mb-6">
            <div className="text-sm font-semibold text-primary-light mb-3">Profil type</div>
            <ul className="space-y-2">
              {profileType.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary-light mt-1.5 w-1 h-1 rounded-full bg-primary-light shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6 space-y-3">
            <div className="text-sm font-semibold text-primary-light">Pourquoi notre solution est moins rentable pour vous</div>
            {whyText.map((t, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{t}</p>
            ))}
          </div>

          {numbers.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {numbers.map((n, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">{n.label}</div>
                  <div className="text-xl font-black text-gradient-gold">{n.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border-l-4 border-accent bg-accent/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-accent" />
              <div className="text-sm font-bold text-accent">Notre recommandation</div>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{recommendation}</p>
            {bonus && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border/40">
                {bonus}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const goodProfiles = [
  "Restaurants midi + soir",
  "Hôtels avec petit-déjeuner",
  "Boulangeries (cuisson)",
  "Campings (sanitaires + piscine)",
  "Maisons du Sud (clim + piscine)",
  "Pros avec PAC + VE + équipements pilotables",
];

const badProfiles = [
  "Studios chauffés au gaz collectif",
  "Petits commerces sans pics de conso",
  "Bureaux administratifs plats",
  "Conso annuelle inférieure à 1 500 €",
  "Maisons du Nord avec chauffage massif (sans isolation)",
  "Activité saisonnière très courte (< 2 mois)",
];

const QuiNestPasConcerne = () => {
  useEffect(() => {
    document.title = "Qui n'est pas concerné par Dynawatt ? | Notre engagement de transparence";
    const desc = "Dynawatt n'est pas une solution universelle. Voici les 3 profils pour qui notre solution batterie + contrat dynamique n'est pas optimale. Soyons honnêtes.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}/comprendre/qui-n-est-pas-concerne`);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      {/* HERO */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs font-mono uppercase tracking-widest text-primary-light mb-5"
          >
            Notre engagement de transparence
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05]"
          >
            Soyons honnêtes : Dynawatt{" "}
            <span className="text-gradient-gold">n'est pas pour tout le monde.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl md:text-2xl text-foreground/80 mb-8 leading-snug"
          >
            On préfère vous le dire avant que vous signiez. Voici les 3 profils pour qui notre solution n'est pas optimale.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="glass rounded-2xl p-6 md:p-8 text-base text-muted-foreground leading-relaxed"
          >
            La plupart des fournisseurs d'énergie vous diront que leur offre est universellement profitable. Ce n'est pas vrai. La rentabilité de la solution Dynawatt dépend de votre profil de consommation. Si votre consommation tombe massivement aux heures où le marché électrique est tendu, votre retour sur investissement sera plus long que la moyenne. Voici les cas où nous vous recommanderons d'attendre, ou de regarder une autre solution.
          </motion.div>
        </div>
      </section>

      {/* PROFIL 1 */}
      <NonOptimalProfile
        icon={Snowflake}
        index={1}
        title="Vous chauffez beaucoup, vous habitez le Nord ou l'Est"
        profileType={[
          "Particuliers ou professionnels dans les régions à hivers rigoureux (Nord, Hauts-de-France, Grand Est, Bourgogne, Champagne-Ardenne)",
          "Chauffage électrique massif : PAC, convecteurs, plancher chauffant",
          "60 % ou plus de la conso annuelle concentrée sur novembre-mars",
          "Pic quotidien à 18h-22h (retour à la maison, chauffage à fond, cuisine, télé)",
        ]}
        whyText={[
          "Le marché spot de l'électricité est extrêmement tendu en hiver entre 17h et 22h. C'est le moment où la France entière chauffe en même temps. Les prix peuvent grimper à 0,30 voire 0,40 €/kWh — bien au-dessus du Tarif Réglementé.",
          "Notre solution Sobry + Batterie capture des économies massives en lissant cette courbe : on stocke quand l'énergie est moins chère, on restitue quand elle est chère. Mais quand votre consommation est concentrée à 70 % sur les heures de pointe hivernales, la batterie ne peut pas tout absorber — elle a une capacité finie.",
        ]}
        numbers={[
          { label: "Foyer Nord, PAC, 32 000 kWh/an", value: "1 250 €/an" },
          { label: "ROI estimé", value: "4 à 5 ans" },
        ]}
        recommendation="Si votre consommation est très hivernale, attendez d'avoir un projet d'isolation thermique en parallèle. Une fois votre conso lissée, notre solution deviendra beaucoup plus rentable. Ou regardez du côté du solaire thermique pour le chauffage si vous êtes propriétaire."
        bonus="Si vous insistez : notre solution reste rentable, juste plus lentement. On peut vous accompagner mais on préfère que vous le sachiez."
      />

      {/* PROFIL 2 */}
      <NonOptimalProfile
        icon={Home}
        index={2}
        title="Votre facture d'électricité est inférieure à 1 200 € par an"
        reverse
        profileType={[
          "Particuliers en appartement chauffé au gaz collectif",
          "Studios et T1 avec consommation faible",
          "Petites entreprises tertiaires sans cuisine ni climatisation",
          "Conso annuelle inférieure à 5 000 kWh",
        ]}
        whyText={[
          "Notre offre repose sur l'installation d'une batterie physique. Le hardware coûte un certain montant fixe quel que soit votre niveau de consommation. Pour que l'investissement soit rentable, il faut que les économies annuelles soient suffisantes pour amortir la batterie en moins de 7 ans.",
          "Sur une facture de 800 € par an, même si nous vous économisons 30 %, ça ne fait que 240 €/an. Le ROI dépasse 20 ans, c'est-à-dire la durée de vie de la batterie elle-même. Économiquement, ça n'a pas de sens.",
        ]}
        numbers={[
          { label: "Seuil de rentabilité", value: "1 500 €/an TTC" },
          { label: "ROI sous ce seuil", value: "> 20 ans" },
        ]}
        recommendation="Comparez les offres d'électricité sans batterie. Beaucoup de fournisseurs vous proposeront -10 à -15 % sur le TRV sans investissement. Pour votre profil, c'est probablement le meilleur compromis."
        bonus="Quand revenir nous voir : si votre activité grandit, si vous achetez une maison, si vous installez une climatisation ou un véhicule électrique. À ce moment-là votre profil change et notre solution redevient pertinente."
      />

      {/* PROFIL 3 */}
      <NonOptimalProfile
        icon={Store}
        index={3}
        title="Votre consommation est plate et régulière toute la journée"
        profileType={[
          "Petits commerces de proximité (supérette, kiosque, tabac-presse)",
          "Bureaux administratifs avec horaires 8h-18h très réguliers",
          "Pharmacies, cabinets médicaux",
          "Conso quasi-identique d'heure en heure",
          "Aucun équipement à forte inertie thermique pilotable",
        ]}
        whyText={[
          "L'algorithme Dynawatt fonctionne en exploitant les écarts entre les heures bon marché et les heures chères. Pour qu'une batterie soit rentable, il faut qu'il y ait quelque chose à arbitrer.",
          "Si votre conso est totalement plate à 5 kW de 8h du matin à 18h tous les jours, il n'y a pas grand chose à optimiser. La batterie peut décaler quelques kilowattheures vers les heures moins chères, mais le gain reste modeste.",
          "Les meilleurs profils pour notre solution sont ceux avec : des pics marqués (restaurant, boulangerie, hôtel), des charges flexibles (PAC, ECS, climatisation, VE, piscine), des creux exploitables (commerce fermé la nuit, pas de service le matin).",
        ]}
        numbers={[
          { label: "Profil ultra-plat 30 000 kWh/an", value: "≈ 800 €/an" },
          { label: "ROI", value: "6 à 8 ans" },
        ]}
        recommendation="Si vous avez la possibilité d'ajouter une charge flexible (par exemple installer un chauffe-eau électrique, ou faire passer votre flotte de véhicules à l'électrique), revenez nous voir. Sans ça, notre solution est moins pertinente que pour vos voisins."
      />

      {/* TABLEAU RÉCAPITULATIF */}
      <section className="py-20 md:py-28 relative">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="text-xs font-mono uppercase tracking-widest text-primary-light mb-3">Récapitulatif</div>
            <h2 className="text-3xl md:text-5xl font-black">
              Pour qui notre solution est-elle <span className="text-gradient-violet">vraiment faite</span> ?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Bons profils */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass rounded-3xl p-6 md:p-8 border-l-4 border-accent"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-black">Profils idéaux</h3>
              </div>
              <ul className="space-y-3">
                {goodProfiles.map((p, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex items-start gap-3 text-sm md:text-base"
                  >
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Mauvais profils */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass rounded-3xl p-6 md:p-8 border-l-4 border-destructive"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-xl font-black">Profils non optimaux</h3>
              </div>
              <ul className="space-y-3">
                {badProfiles.map((p, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex items-start gap-3 text-sm md:text-base text-muted-foreground"
                  >
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ENGAGEMENT */}
      <section className="py-20 md:py-28 relative">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="text-xs font-mono uppercase tracking-widest text-primary-light mb-3 text-center">Notre engagement</div>
            <h2 className="text-3xl md:text-5xl font-black text-center mb-10">
              Pourquoi nous vous le disons
            </h2>
            <div className="glass rounded-3xl p-8 md:p-12 space-y-5 text-foreground/85 leading-relaxed">
              <p>
                Notre modèle repose sur la durée. Quand un client signe avec nous, il reste en moyenne 10 à 15 ans dans notre écosystème. Si nous vendons notre solution à un client pour qui elle est mal adaptée, ce client va se rendre compte au bout de 2 ans que ses économies sont inférieures à ses attentes. Il sera mécontent. Il en parlera autour de lui. Il nous coûtera plus cher en SAV qu'il ne nous rapportera.
              </p>
              <p>
                Donc nous avons un intérêt direct à ne signer que les profils pour qui notre solution est réellement performante. C'est aussi simple que ça.
              </p>
              <p className="text-foreground font-medium">
                Si vous lisez cette page et que vous vous reconnaissez dans un des trois profils décrits, voici ce qu'on vous propose : on fait quand même une simulation gratuite et on vous donne le chiffre exact de votre ROI. Si c'est rentable on vous le dit. Si ça ne l'est pas, on vous le dit aussi. Vous décidez.
              </p>
            </div>

            {/* Liens internes */}
            <div className="flex flex-wrap gap-3 justify-center mt-8 text-sm">
              <Link to="/comprendre/tarification-dynamique" className="glass rounded-full px-4 py-2 hover:text-primary-light transition-colors flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5" /> Comprendre la tarification dynamique
              </Link>
              <Link to="/pilotage" className="glass rounded-full px-4 py-2 hover:text-primary-light transition-colors flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5" /> Le pilotage Premium
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 md:py-28 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl glass p-10 md:p-16 text-center max-w-3xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-gold/20" />
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-gold/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/40 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-4">
                Lever le doute en <span className="text-gradient-gold">3 minutes</span>.
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Décrivez-nous brièvement votre profil de consommation. On vous répond honnêtement si notre solution est faite pour vous, ou pas.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-accent to-accent-warm text-accent-foreground hover:opacity-90 font-bold h-14 px-8 text-base glow-gold animate-pulse-glow">
                  <Link to="/pro">Je suis professionnel — Calculer mon ROI<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="glass border-primary/40 hover:bg-primary/10 h-14 px-8 text-base font-semibold">
                  <Link to="/particulier">Je suis particulier — Calculer mon ROI</Link>
                </Button>
              </div>
              <div className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                Pas envie de remplir un formulaire ?{" "}
                <Link to="/contact" className="text-primary-light hover:underline ml-1">Appelez-nous</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QuiNestPasConcerne;
