import { Utensils, Dumbbell, Shirt, Croissant, Hotel, Tent, Building2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface SectorData {
  slug: string;
  name: string;
  icon: LucideIcon;
  hero: { title: ReactNode; subtitle: string };
  seo: { title: string; description: string };
  profile: { annualKwh: string; power: string; schedule: string; mainLoads: string; extra?: string };
  loadCurve: number[];
  annotations: { hour: number; label: string; type?: "peak" | "valley" }[];
  levers: { title: string; desc: string }[];
  caseStudy: {
    realClient: boolean;
    name: string;
    description: string;
    metrics: { label: string; value: string; unit?: string; highlight?: boolean }[];
    summary: string;
  };
  config: { name: string; details: string; price: string };
  faq: { q: string; a: string }[];
  extraSection?: { title: string; bullets: string[] };
}

const restaurantCurve = [3,2,2,2,2,3,5,7,9,12,15,18,16,12,8,6,5,7,14,18,16,10,6,4];
const sportCurve = [4,3,3,3,3,5,12,18,16,14,15,16,17,17,16,17,19,22,24,22,18,12,8,5];
const pressingCurve = [2,2,2,2,2,3,8,16,20,22,21,20,19,20,21,20,18,12,4,3,2,2,2,2];
const boulCurve = [3,18,22,24,22,20,18,16,12,10,8,7,6,6,6,5,5,5,4,4,4,3,3,3];
const hotelCurve = [12,10,9,9,10,12,18,24,22,18,16,16,16,16,17,18,20,22,24,23,22,20,16,14];
const campingCurve = [8,7,6,6,7,9,12,16,18,20,22,24,25,24,22,20,22,28,32,30,26,20,14,10];
const coproCurve = [14,12,11,11,12,14,18,22,20,18,17,17,18,18,18,18,19,20,22,22,20,18,16,15];

export const SECTORS: SectorData[] = [
  {
    slug: "restaurant",
    name: "Restaurant",
    icon: Utensils,
    hero: {
      title: (<>Restaurant : <span className="text-gradient-gold">30% d'économies</span> sur l'électricité, sans changer un service.</>),
      subtitle: "Vos pics de consommation tombent aux heures les plus chères. Notre batterie inverse ça.",
    },
    seo: {
      title: "Économies d'énergie restaurant avec batterie pilotée | Dynawatt",
      description: "Restaurants & pizzerias : 30% d'économies sur la facture électrique. Cas client réel : 6 254 €/an économisés. ROI 1,4 an.",
    },
    profile: {
      annualKwh: "30 000 à 80 000 kWh",
      power: "36 à 60 kVA (C4 BTSUPCU4)",
      schedule: "Pics 11h-14h (midi) et 19h-22h (soir)",
      mainLoads: "Cuisson, chambres froides, ventilation, vitrines, ECS",
      extra: "Profil idéal pour 2 cycles de batterie par jour",
    },
    loadCurve: restaurantCurve,
    annotations: [
      { hour: 4, label: "creuse", type: "valley" },
      { hour: 11, label: "service midi", type: "peak" },
      { hour: 19, label: "service soir", type: "peak" },
    ],
    levers: [
      { title: "Arbitrage tarifaire midi+soir", desc: "Charge la batterie en fin de matinée et fin d'après-midi (heures creuses), décharge sur les services." },
      { title: "Pilotage chambre froide", desc: "Acceptation d'une variation de 1-2°C pour décaler la conso aux heures creuses." },
      { title: "Effacement des pointes de puissance", desc: "Évite les dépassements de puissance souscrite (pénalités)." },
    ],
    caseStudy: {
      realClient: true,
      name: "JC & Co — Restaurant Sushi",
      description: "Rosny-sous-Bois — 37 kVA",
      metrics: [
        { label: "Conso annuelle", value: "57 578", unit: "kWh" },
        { label: "Facture TRV", value: "14 040 €", unit: "TTC/an" },
        { label: "Avec Dynawatt", value: "7 786 €", unit: "TTC/an", highlight: true },
        { label: "ROI", value: "1,4 an", unit: "+411 €/mois", highlight: true },
      ],
      summary: "6 254 € d'économies annuelles — leasing 110 €/mois, cash flow positif dès M1 : +411 €/mois.",
    },
    config: { name: "Config 2 — Tri 6kW + 10,8 kWh", details: "Onduleur triphasé 6 kW + 3 modules batterie 3,6 kWh", price: "À partir de 8 000 € TTC installé" },
    faq: [
      { q: "Et si la batterie tombe en panne pendant un service ?", a: "Le réseau prend automatiquement le relais. Aucun arrêt d'activité." },
      { q: "Faut-il fermer le restaurant pendant l'installation ?", a: "Non. Installation en 1 journée, en dehors des heures de service." },
      { q: "Est-ce compatible avec une cuisine au gaz ?", a: "Oui. Tout l'électrique pilotable suffit (frigos, ventilation, lumière, ECS)." },
    ],
  },
  {
    slug: "salle-de-sport",
    name: "Salle de sport",
    icon: Dumbbell,
    hero: {
      title: (<>Salle de sport : votre énergie, <span className="text-gradient-violet">optimisée 24h/24</span>.</>),
      subtitle: "Climatisation, ventilation, équipements connectés. Vos coûts énergétiques peuvent grimper jusqu'à 25% du budget. Inversez la tendance.",
    },
    seo: {
      title: "Économies d'énergie salle de sport avec batterie pilotée | Dynawatt",
      description: "Salles de fitness : pilotage CVC + ECS. 7 995 €/an d'économies, ROI 1,7 an. Sans impact sur le confort.",
    },
    profile: {
      annualKwh: "50 000 à 200 000 kWh",
      power: "60 à 250 kVA",
      schedule: "Étalé 6h-23h, pic 6h30-22h",
      mainLoads: "Climatisation/chauffage, ventilation, machines connectées, ECS douches",
      extra: "Saisonnalité forte (clim été, chauffage hiver)",
    },
    loadCurve: sportCurve,
    annotations: [
      { hour: 3, label: "creuse", type: "valley" },
      { hour: 7, label: "matin", type: "peak" },
      { hour: 18, label: "soir", type: "peak" },
    ],
    levers: [
      { title: "Pilotage CVC", desc: "Les heures les moins chères servent à pré-conditionner les volumes d'air." },
      { title: "Décalage ECS", desc: "Préchauffage des ballons d'eau chaude la nuit pour les douches du matin." },
      { title: "Compensation des pointes du soir", desc: "Forte affluence 18h-21h = pic conso = batterie qui décharge." },
    ],
    caseStudy: {
      realClient: false,
      name: "Cas type : Salle de fitness 800m²",
      description: "250 abonnés actifs",
      metrics: [
        { label: "Conso annuelle", value: "95 000", unit: "kWh" },
        { label: "Tarif Jaune", value: "24 225 €", unit: "TTC/an" },
        { label: "Avec Dynawatt", value: "16 230 €", unit: "TTC/an", highlight: true },
        { label: "ROI", value: "1,7 an", highlight: true },
      ],
      summary: "7 995 €/an d'économies — pilotage CVC, ECS et pointes de soirée intégrés.",
    },
    config: { name: "Config 4 — Tri 10kW + 22 kWh + GO Junction", details: "Pilotage CVC inclus", price: "À partir de 13 500 € TTC" },
    faq: [
      { q: "Cela impacte-t-il la température en salle ?", a: "Non. Le pilotage anticipe les besoins via préchauffage/prérefroidissement." },
      { q: "Et pendant les pics de fréquentation ?", a: "La batterie est dimensionnée pour absorber les pointes, sans coupure." },
    ],
  },
  {
    slug: "pressing",
    name: "Pressing",
    icon: Shirt,
    hero: {
      title: (<>Pressing : la chaleur qui coûte cher devient votre <span className="text-gradient-gold">meilleur allié</span>.</>),
      subtitle: "Sécheurs, repasseuses, vapeur. Tous fonctionnent en cycle thermique long. Idéal pour le pilotage.",
    },
    seo: {
      title: "Économies d'énergie pressing avec batterie pilotée | Dynawatt",
      description: "Pressings artisanaux : 5 465 €/an d'économies sur sécheurs et générateurs vapeur. ROI 1,5 an.",
    },
    profile: {
      annualKwh: "40 000 à 90 000 kWh",
      power: "36 à 60 kVA",
      schedule: "7h-19h, fermé dimanche",
      mainLoads: "Sécheurs gros porteurs, générateurs vapeur, repasseuses, ECS",
      extra: "Charges très thermiques = forte capacité d'inertie = idéal pour le pilotage",
    },
    loadCurve: pressingCurve,
    annotations: [
      { hour: 3, label: "creuse", type: "valley" },
      { hour: 9, label: "pic matin", type: "peak" },
      { hour: 14, label: "plateau", type: "peak" },
    ],
    levers: [
      { title: "Préchauffe des séchoirs aux heures creuses", desc: "Démarrage anticipé sur les premières fournées." },
      { title: "Lissage de la vapeur", desc: "Génération continue plutôt que pics." },
      { title: "Décalage des cycles", desc: "Quelques heures de tolérance possibles sur les commandes longues." },
    ],
    caseStudy: {
      realClient: false,
      name: "Cas type : Pressing artisanal 80m²",
      description: "1 propriétaire + 2 salariés",
      metrics: [
        { label: "Conso annuelle", value: "65 000", unit: "kWh" },
        { label: "Tarif Jaune", value: "16 575 €", unit: "TTC/an" },
        { label: "Avec Dynawatt", value: "11 110 €", unit: "TTC/an", highlight: true },
        { label: "ROI", value: "1,5 an", highlight: true },
      ],
      summary: "5 465 €/an d'économies — pilotage sécheurs, vapeur et cycles longs.",
    },
    config: { name: "Config 3 — Tri 10kW + 14,4 kWh", details: "4 modules batterie 3,6 kWh", price: "À partir de 9 500 € TTC" },
    faq: [
      { q: "Mes machines ont besoin d'une montée en température rapide. Compatible ?", a: "Oui. La batterie restitue la pleine puissance instantanément si besoin." },
      { q: "Si je décide d'agrandir, comment ça évolue ?", a: "On ajoute des modules batterie (3,6 kWh chacun) sans changer le système." },
    ],
  },
  {
    slug: "boulangerie",
    name: "Boulangerie",
    icon: Croissant,
    hero: {
      title: (<>Boulangerie : vos fours coûtent cher la nuit. <span className="text-gradient-gold">Plus maintenant.</span></>),
      subtitle: "La cuisson de 2h à 9h tombe sur les heures les moins chères du marché. La batterie capture le double avantage.",
    },
    seo: {
      title: "Économies d'énergie boulangerie avec batterie pilotée | Dynawatt",
      description: "Boulangeries artisanales : 6 048 €/an d'économies sur fours et chambres froides. ROI 1,6 an.",
    },
    profile: {
      annualKwh: "50 000 à 100 000 kWh",
      power: "36 à 60 kVA",
      schedule: "Pic massif 2h-9h (cuisson)",
      mainLoads: "Fours électriques (65%), chambres froides (22%), pétrins (8%), éclairage et caisse (5%)",
      extra: "Très peu de saisonnalité",
    },
    loadCurve: boulCurve,
    annotations: [
      { hour: 3, label: "cuisson", type: "peak" },
      { hour: 14, label: "creux PM", type: "valley" },
      { hour: 22, label: "nuit", type: "valley" },
    ],
    levers: [
      { title: "Cuisson aux heures les moins chères", desc: "Naturellement déjà aligné, à amplifier avec la batterie." },
      { title: "Pilotage chambres froides", desc: "Décalage des cycles de réfrigération." },
      { title: "Préchauffage anticipé", desc: "Montée en température des fours en heures creuses étendues." },
    ],
    caseStudy: {
      realClient: false,
      name: "Cas type : Boulangerie artisanale",
      description: "1 four 12m² + chambre froide + vitrine",
      metrics: [
        { label: "Conso annuelle", value: "72 000", unit: "kWh" },
        { label: "Tarif Jaune", value: "18 360 €", unit: "TTC/an" },
        { label: "Avec Dynawatt", value: "12 312 €", unit: "TTC/an", highlight: true },
        { label: "ROI", value: "1,6 an", highlight: true },
      ],
      summary: "6 048 €/an d'économies — capture du double avantage : prix bas + pilotage four.",
    },
    config: { name: "Config 3 — Tri 10kW + 14,4 kWh", details: "Mode backup 2-4h disponible", price: "À partir de 9 500 € TTC" },
    faq: [
      { q: "La cuisson nécessite des kW disponibles instantanément. Compatible ?", a: "Oui. La batterie restitue jusqu'à 10 kW instantanément en complément du réseau." },
      { q: "Et les pannes de courant ?", a: "Mode backup disponible : la batterie alimente vos équipements critiques pendant 2-4 heures." },
    ],
  },
  {
    slug: "hotel",
    name: "Hôtel",
    icon: Hotel,
    hero: {
      title: (<>Hôtel : 39 chambres, 100 000 kWh, <span className="text-gradient-gold">7 400 €/an</span>.</>),
      subtitle: "Pour un hôtel urbain, le pilotage d'énergie représente 30% d'économies dès la première année.",
    },
    seo: {
      title: "Économies d'énergie hôtel avec batterie pilotée | Dynawatt",
      description: "Hôtels urbains : 8 978 €/an d'économies. Cas client Hotel America Opera Paris. ROI 1,5 an.",
    },
    profile: {
      annualKwh: "80 000 à 250 000 kWh",
      power: "90 à 250 kVA",
      schedule: "Pic petit-déjeuner 7h-9h, plateau 10h-22h",
      mainLoads: "Chauffage/climatisation centralisée, ECS collective, restauration, blanchisserie, éclairage permanent",
      extra: "Saisonnalité urbaine : pic hiver (chauffage)",
    },
    loadCurve: hotelCurve,
    annotations: [
      { hour: 3, label: "creuse", type: "valley" },
      { hour: 7, label: "petit-déj", type: "peak" },
      { hour: 19, label: "soirée", type: "peak" },
    ],
    levers: [
      { title: "Pilotage CVC centralisé", desc: "Préchauffage/prérefroidissement aux heures creuses." },
      { title: "ECS collective", desc: "Très grandes capacités d'inertie thermique pilotables." },
      { title: "Backup éclairage et sécurité", desc: "Continuité en cas de coupure." },
    ],
    caseStudy: {
      realClient: true,
      name: "Hotel America Opera",
      description: "Paris 8e — 39 chambres + bar — 156 kVA",
      metrics: [
        { label: "Conso annuelle", value: "106 688", unit: "kWh" },
        { label: "Tarif Jaune", value: "27 205 €", unit: "TTC/an" },
        { label: "Avec Dynawatt", value: "18 228 €", unit: "TTC/an", highlight: true },
        { label: "ROI", value: "1,5 an", unit: "+747 €/mois", highlight: true },
      ],
      summary: "8 978 €/an d'économies — investissement 13 341 € TTC, cash flow positif dès M1 : +747 €/mois.",
    },
    config: { name: "Config 5 — Tri 15kW + 29 kWh + GO Junction + GO EV Charger 22kW", details: "Recharge VE intégrée pour les clients", price: "À partir de 14 500 € TTC" },
    faq: [
      { q: "Possible de proposer la recharge VE à mes clients ?", a: "Oui, avec le GO EV Charger intégré. Pilotage automatique selon les prix." },
      { q: "Et la garantie de continuité de service ?", a: "La batterie garantit 4-6h de backup sur l'éclairage de sécurité et les frigos critiques." },
    ],
  },
  {
    slug: "camping",
    name: "Camping",
    icon: Tent,
    hero: {
      title: (<>Camping été : 150 000 kWh en 4 mois. Dynawatt <span className="text-gradient-gold">rentabilise votre saison</span>.</>),
      subtitle: "Forte conso saisonnière + nuits fraîches estivales = profil idéal pour la batterie.",
    },
    seo: {
      title: "Économies d'énergie camping avec batterie pilotée | Dynawatt",
      description: "Campings saisonniers : 9 200 €/an d'économies. Pilotage ECS, piscine, bornes VE. ROI 1,7 an.",
    },
    profile: {
      annualKwh: "40 000 à 200 000 kWh",
      power: "60 à 250 kVA",
      schedule: "80% de la conso entre juin et septembre",
      mainLoads: "Sanitaires (douches), ECS centralisée, restaurant/snack, piscine, bornes mobil-home",
      extra: "Pic estival 18h-22h (douches après plage)",
    },
    loadCurve: campingCurve,
    annotations: [
      { hour: 3, label: "creuse", type: "valley" },
      { hour: 12, label: "midi", type: "peak" },
      { hour: 18, label: "douches", type: "peak" },
    ],
    levers: [
      { title: "ECS sanitaires", desc: "Préchauffage la nuit pour les douches matin/soir." },
      { title: "Filtration piscine", desc: "Décalage des heures de filtration vers les heures creuses." },
      { title: "Bornes recharge VE/camping-cars", desc: "Pilotage automatique selon les prix." },
    ],
    caseStudy: {
      realClient: false,
      name: "Cas type : Camping 80 emplacements",
      description: "+ 30 mobil-homes + piscine",
      metrics: [
        { label: "Conso annuelle", value: "110 000", unit: "kWh (juin-sept)" },
        { label: "Tarif Jaune", value: "28 050 €", unit: "TTC/an" },
        { label: "Avec Dynawatt", value: "18 850 €", unit: "TTC/an", highlight: true },
        { label: "ROI", value: "1,7 an", highlight: true },
      ],
      summary: "9 200 €/an d'économies — concentrées sur la saison haute, amorties en moins de 2 ans.",
    },
    config: { name: "Config 5 — Tri 15kW + 29 kWh + GO Junction + GO EV Charger", details: "Borne VE 22kW tri intégrée", price: "À partir de 15 000 € TTC" },
    faq: [
      { q: "Et hors saison, la batterie sert à quoi ?", a: "Maintenance des sanitaires en mode minimum. Pas d'usure inutile." },
      { q: "Bornes VE pour mes campeurs : c'est compatible ?", a: "Oui. GO EV Charger 22kW tri intégré, pilotage selon les prix EPEX." },
    ],
  },
  {
    slug: "copropriete",
    name: "Copropriété",
    icon: Building2,
    hero: {
      title: (<>Copropriété tertiaire : la <span className="text-gradient-violet">seule solution énergétique</span> réaliste.</>),
      subtitle: "Pas de toiture commune à équiper. Pas d'AG impossible à convoquer. Décision du conseil syndical, installation en 1 journée.",
    },
    seo: {
      title: "Économies d'énergie copropriété avec batterie pilotée | Dynawatt",
      description: "Copropriétés : 5 465 €/an d'économies sur les charges communes. Décision conseil syndical, installation 1 jour.",
    },
    profile: {
      annualKwh: "30 000 à 150 000 kWh",
      power: "Variable selon la taille",
      schedule: "Profil très stable, peu de saisonnalité (sauf chauffage)",
      mainLoads: "Chauffage collectif, ECS commune, éclairage parties communes, ascenseurs, ventilation parking",
      extra: "Le solaire ne marche pas en copro — Dynawatt s'installe au tableau des parties communes uniquement",
    },
    loadCurve: coproCurve,
    annotations: [
      { hour: 3, label: "creuse", type: "valley" },
      { hour: 8, label: "matin", type: "peak" },
      { hour: 19, label: "soir", type: "peak" },
    ],
    levers: [
      { title: "Pilotage chauffage collectif", desc: "Le plus gros poste, le plus pilotable." },
      { title: "ECS commune", desc: "Préchauffage aux heures creuses." },
      { title: "Éclairage et ventilation 24/7", desc: "Forte continuité = batterie très utilisée." },
    ],
    caseStudy: {
      realClient: false,
      name: "Cas type : Copropriété 80 lots",
      description: "Chauffage collectif gaz + ECS électrique collective",
      metrics: [
        { label: "Conso parties communes", value: "65 000", unit: "kWh/an" },
        { label: "Tarif Jaune", value: "16 575 €", unit: "TTC/an" },
        { label: "Avec Dynawatt", value: "11 110 €", unit: "TTC/an", highlight: true },
        { label: "ROI", value: "1,8 an", unit: "68 €/lot/an", highlight: true },
      ],
      summary: "5 465 €/an d'économies — répercutées immédiatement sur les charges communes.",
    },
    config: { name: "Config 3 ou 4 — Tri 10kW + 14,4 à 22 kWh", details: "Au tableau des parties communes", price: "À partir de 9 500 € TTC" },
    extraSection: {
      title: "Pour les syndics et conseils syndicaux",
      bullets: [
        "Template de présentation prêt pour assemblée générale",
        "Modalités de financement : leasing, autofinancement par les charges, MaPrimeRénov copropriété",
        "Reporting trimestriel des économies pour transparence vers les copropriétaires",
      ],
    },
    faq: [
      { q: "Faut-il une assemblée générale ?", a: "Non, le conseil syndical peut décider seul si l'investissement est inférieur à 10% du budget annuel des charges communes (variable selon les copros)." },
      { q: "Comment les économies sont-elles redistribuées ?", a: "Directement sur les charges communes votées chaque année." },
      { q: "Quelle durée d'engagement ?", a: "Aucune. La batterie reste la propriété de la copro après le leasing." },
    ],
  },
];

export const getSector = (slug: string) => SECTORS.find((s) => s.slug === slug);
