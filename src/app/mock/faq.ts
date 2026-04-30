// Base FAQ Tigo + Dynawatt — 30 articles
export type FaqCategory = "battery" | "inverter" | "junction" | "ev" | "pilotage" | "billing";

export const FAQ_CATEGORIES: { id: FaqCategory; label: string; icon: string; desc: string }[] = [
  { id: "battery", label: "Batterie GO Battery", icon: "🔋", desc: "Modules LFP 3,6 kWh, cycles, autonomie" },
  { id: "inverter", label: "Onduleur EI Inverter", icon: "⚡", desc: "Tigo TSI mono/triphasé, sécurité" },
  { id: "junction", label: "GO Junction (PAC)", icon: "🌡️", desc: "Pilotage pompe à chaleur" },
  { id: "ev", label: "GO EV Charger", icon: "🔌", desc: "Borne 7 kW à 22 kW triphasé" },
  { id: "pilotage", label: "Pilotage Dynawatt", icon: "🤖", desc: "Algorithme J-1, EPEX, modes" },
  { id: "billing", label: "Facturation & contrat", icon: "💰", desc: "Économies, mensualités, engagement" },
];

export type FaqArticle = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  views: number;
  helpful: number;
};

export const FAQ_ARTICLES: FaqArticle[] = [
  // BATTERY
  { id: "b1", category: "battery", question: "Comment fonctionne ma batterie GO Battery ?", answer: "Votre batterie est composée de modules LFP (Lithium-Fer-Phosphate) de 3,6 kWh empilables. Chaque module est piloté par notre algorithme via l'onduleur Tigo. La nuit ou en heures creuses, elle se charge depuis le réseau au prix le plus bas. En période de prix élevés, elle se décharge pour alimenter votre installation et éviter de payer le prix fort.", views: 1284, helpful: 142 },
  { id: "b2", category: "battery", question: "Combien de cycles puis-je faire ?", answer: "Votre batterie est garantie 6 000 cycles complets sur 11 ans, soit environ 1,5 cycles/jour en moyenne. L'algorithme Dynawatt optimise pour rester dans cette limite tout en maximisant vos économies. À ce rythme, votre batterie tiendra largement au-delà de la période de garantie.", views: 967, helpful: 118 },
  { id: "b3", category: "battery", question: "Que se passe-t-il en cas de coupure de courant ?", answer: "Avec l'option Backup activée, votre batterie bascule en moins de 20 ms sur les circuits prioritaires que vous avez définis lors de l'installation (frigos professionnels, éclairage, caisse, serveurs…). Vous configurez votre réserve minimum dans les Préférences de confort.", views: 845, helpful: 102 },
  { id: "b4", category: "battery", question: "Comment l'état de santé (SOH) est-il mesuré ?", answer: "Tigo mesure en continu la capacité réelle de chaque module et la compare à sa capacité nominale. Le SOH est mis à jour quotidiennement. Une dégradation normale est de 1-2% par an. Vous voyez votre SOH en temps réel sur la page Mon installation.", views: 612, helpful: 78 },
  { id: "b5", category: "battery", question: "Puis-je ajouter des modules plus tard ?", answer: "Oui — votre rack Tigo accepte jusqu'à 12 modules (43,2 kWh max). L'ajout est non-invasif : 2h d'intervention, aucune coupure prolongée, recalibrage automatique de l'algorithme.", views: 534, helpful: 67 },
  { id: "b6", category: "battery", question: "À quelle température fonctionne la batterie ?", answer: "Les modules LFP sont stables entre -10°C et +50°C. Pour des performances optimales, l'idéal est 15-30°C. Le local doit être ventilé. Tigo arrête automatiquement la charge si la température sort de la plage sécurisée.", views: 312, helpful: 41 },

  // INVERTER
  { id: "i1", category: "inverter", question: "Quelle est la différence entre charge et décharge ?", answer: "En charge, l'onduleur prend de l'énergie du réseau (ou du solaire) pour stocker dans la batterie. En décharge, il convertit l'énergie de la batterie pour alimenter vos équipements. Tout est piloté automatiquement par notre algorithme selon les prix EPEX.", views: 723, helpful: 89 },
  { id: "i2", category: "inverter", question: "Comment l'onduleur protège-t-il mes équipements ?", answer: "Le Tigo TSI dispose de protections intégrées contre les surtensions, courts-circuits, et sur-températures. Il est conforme aux normes CE, NF EN 62109 et CEI 61727. En cas d'anomalie, il se met en sécurité et nous envoie une alerte automatique.", views: 458, helpful: 54 },
  { id: "i3", category: "inverter", question: "Que faire en cas d'alerte sur l'onduleur ?", answer: "Notre équipe reçoit l'alerte en temps réel et vous contacte sous 2h ouvrées. Pour les alertes critiques, intervention sous 24h. Vous pouvez aussi déclencher un ticket vous-même depuis l'onglet Support.", views: 387, helpful: 48 },
  { id: "i4", category: "inverter", question: "Quel est le rendement de l'onduleur Tigo ?", answer: "Le Tigo TSI a un rendement européen de 97,5% en mode décharge et 96,8% en mode charge. C'est l'un des meilleurs du marché pour cette gamme de puissance.", views: 289, helpful: 38 },

  // JUNCTION
  { id: "j1", category: "junction", question: "Quels équipements sont compatibles avec GO Junction ?", answer: "GO Junction pilote les pompes à chaleur SG Ready (95% du marché actuel), les ballons d'eau chaude sanitaire, les climatisations Daikin/Mitsubishi/Atlantic via API, et les systèmes domotiques KNX/Modbus. Compatible avec la majorité des installations < 5 ans.", views: 542, helpful: 71 },
  { id: "j2", category: "junction", question: "Comment piloter ma PAC efficacement ?", answer: "L'algorithme augmente légèrement la consigne (+1°C) pendant les heures creuses pour stocker de la chaleur dans le bâtiment, puis la réduit (-1°C) pendant les heures de pointe. Vous gardez un confort identique tout en consommant aux meilleurs moments.", views: 431, helpful: 56 },
  { id: "j3", category: "junction", question: "Et si ma PAC n'est pas SG Ready ?", answer: "GO Junction peut piloter via un module relais externe (fourni 89€) qui simule une consigne externe. Compatible avec 99% des PAC du marché. À discuter lors de l'audit technique.", views: 312, helpful: 39 },
  { id: "j4", category: "junction", question: "Le pilotage PAC affecte-t-il son SCOP ?", answer: "Au contraire : l'algorithme privilégie les plages où la PAC est la plus efficiente (températures extérieures douces). Gain SCOP moyen mesuré : +8% sur 12 mois sur notre flotte.", views: 198, helpful: 27 },

  // EV
  { id: "ev1", category: "ev", question: "À quelle vitesse charge le GO EV Charger ?", answer: "Le GO EV Charger existe en 7 kW (mono) et 22 kW (tri). En 22 kW, vous récupérez ~120 km d'autonomie par heure de charge sur la majorité des VE actuels.", views: 678, helpful: 84 },
  { id: "ev2", category: "ev", question: "Puis-je charger pendant les heures de pointe quand même ?", answer: "Oui, vous gardez toujours la main. Mais l'algorithme vous suggère le meilleur créneau (ex : 'charge complète en 3h à partir de 23h, économie 4,80 €'). Vous pouvez accepter ou forcer la charge immédiate.", views: 523, helpful: 67 },
  { id: "ev3", category: "ev", question: "Comment partager la borne avec mes clients (hôtel/restau) ?", answer: "Activez le mode Partagé : badge RFID ou QR code, facturation automatique au tarif que vous fixez (ex : 0,40 €/kWh), reversement mensuel. Compatible Mobi, Chargemap, eBorn.", views: 412, helpful: 52 },
  { id: "ev4", category: "ev", question: "Le GO EV Charger fonctionne-t-il avec la batterie en backup ?", answer: "Oui, mais à puissance réduite (3,7 kW max) pour préserver la batterie. Idéal pour repartir le lendemain en cas de coupure prolongée.", views: 234, helpful: 31 },

  // PILOTAGE
  { id: "p1", category: "pilotage", question: "Comment l'algorithme prend-il ses décisions ?", answer: "À 13h chaque jour, EPEX publie les 96 prix du lendemain (1 par quart d'heure). En 4 secondes, notre algorithme MILP calcule le plan optimal de charge/décharge sous contraintes : capacité batterie, cycles disponibles, prévisions météo, et vos préférences de confort.", views: 1456, helpful: 187 },
  { id: "p2", category: "pilotage", question: "Puis-je désactiver le pilotage automatique ?", answer: "Oui, à tout moment depuis l'onglet Pilotage. En mode manuel, vous pilotez vous-même les charges/décharges. Attention : vous perdez en moyenne 60% des économies vs le mode auto.", views: 678, helpful: 82 },
  { id: "p3", category: "pilotage", question: "Que se passe-t-il si je modifie mes préférences ?", answer: "Le plan du lendemain est instantanément recalculé. Si vous activez le mode Vacances, par exemple, l'algorithme réduit l'activité et privilégie la longévité de la batterie.", views: 534, helpful: 68 },
  { id: "p4", category: "pilotage", question: "L'algorithme apprend-il de mes habitudes ?", answer: "Oui — au bout de 30 jours, il intègre votre profil de consommation par jour de la semaine et par saison. Au bout de 6 mois, il anticipe vos pics récurrents (rush du midi pour un restau, week-ends d'événementiel pour un hôtel).", views: 612, helpful: 79 },
  { id: "p5", category: "pilotage", question: "Que se passe-t-il en cas de panne EPEX ?", answer: "Notre infrastructure dispose d'un fallback : si EPEX ne publie pas à 13h, nous utilisons une moyenne glissante 30 jours pondérée par notre modèle prédictif. Vous gardez ~85% des économies vs un jour normal.", views: 234, helpful: 31 },

  // BILLING
  { id: "bi1", category: "billing", question: "Comment sont calculées mes économies ?", answer: "Chaque jour, nous calculons : (votre coût avec Dynawatt) vs (votre coût hypothétique au TRV / Tempo / Tarif Jaune selon votre profil). La différence, c'est votre économie. Méthodologie auditable et transparente, factures détaillées disponibles.", views: 892, helpful: 112 },
  { id: "bi2", category: "billing", question: "Puis-je changer de fournisseur d'énergie ?", answer: "Notre solution est compatible avec tout fournisseur d'électricité proposant un contrat indexé spot. Si vous changez, l'algorithme s'adapte automatiquement à votre nouveau tarif (à condition qu'il soit dynamique).", views: 567, helpful: 71 },
  { id: "bi3", category: "billing", question: "Quelle est la durée d'engagement ?", answer: "L'abonnement Dynawatt est sans engagement, résiliable à tout moment avec 2 mois de préavis. Le hardware vous appartient (achat ou leasing 60 mois). Pas de mauvaise surprise.", views: 456, helpful: 58 },
  { id: "bi4", category: "billing", question: "Comment récupérer mes données de facturation ?", answer: "Onglet Économies → bouton 'Exporter en CSV' ou 'Télécharger rapport PDF'. Vous récupérez le détail jour par jour, créneau par créneau si nécessaire. Bilans mensuels signés disponibles pour votre comptable.", views: 389, helpful: 49 },
  { id: "bi5", category: "billing", question: "Y a-t-il un coût caché ?", answer: "Non — le prix annoncé inclut hardware + algorithme + maintenance + monitoring + intervention sous 24h sur les alertes critiques. La consommation d'électricité reste payée à votre fournisseur (au tarif spot indexé).", views: 312, helpful: 42 },
];
