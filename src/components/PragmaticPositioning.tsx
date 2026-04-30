import { Wallet, Building, CalendarClock } from "lucide-react";
import { PragmaticAdvantage } from "./PragmaticAdvantage";

export const PragmaticPositioning = () => (
  <PragmaticAdvantage
    eyebrow="Pour qui c'est fait"
    title="L'alternative pragmatique au solaire complet"
    intro="Le solaire avec batterie reste une excellente solution si vous avez 30 000 à 70 000 € à investir, une toiture exposée plein sud, et 18 mois devant vous. Pour les autres, il existe Dynawatt."
    items={[
      {
        icon: Wallet,
        title: "Sans investissement massif",
        description:
          "De 6 000 à 15 000 € selon votre profil. Trois à cinq fois moins qu'une installation solaire complète. Finançable en leasing 7 ans avec cash flow positif dès le premier mois.",
      },
      {
        icon: Building,
        title: "Sans contrainte d'installation",
        description:
          "Pas besoin de toiture exposée. Pas de démarches Enedis. Pas de modification structurelle. Installation au tableau électrique en une journée. Dans n'importe quel bâtiment, locataire ou propriétaire.",
      },
      {
        icon: CalendarClock,
        title: "Sans attendre 18 mois",
        description:
          "De la signature à la mise en service : six semaines maximum. Le pilotage Dynawatt s'active dès le jour de l'installation. Vos premières économies arrivent sur la facture du mois suivant.",
      },
    ]}
    outro="Pour le tiers du budget, vous capturez les deux tiers des économies d'un système solaire complet. Sans le complexe."
  />
);
