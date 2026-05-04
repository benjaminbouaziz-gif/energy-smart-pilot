export type ProspectStatut = "brouillon" | "en_cours" | "devis_envoye" | "vendu" | "perdu";
export type ProspectConfig = "PETIT" | "MOYEN";

export const STATUT_LABEL: Record<ProspectStatut, string> = {
  brouillon: "Brouillon",
  en_cours: "En cours",
  devis_envoye: "Devis envoyé",
  vendu: "Vendu",
  perdu: "Perdu",
};

export const STATUT_COLOR: Record<ProspectStatut, string> = {
  brouillon: "bg-[#9CA3AF] text-white",
  en_cours: "bg-[#3B82F6] text-white",
  devis_envoye: "bg-[#F97316] text-white",
  vendu: "bg-[#10B981] text-white",
  perdu: "bg-[#EF4444] text-white",
};
