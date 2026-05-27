import type { SimulateurSwitchContractDetails } from "../SimulateurSwitchContext";

function deduireTypeContrat(
  calendrierFrnLibelle: string | undefined,
  calendrierFrnCode: string | undefined,
  formuleAcheminementLibelle: string | undefined,
  domaineTensionLibelle: string | undefined
): string | undefined {
  if (!calendrierFrnLibelle && !calendrierFrnCode && !formuleAcheminementLibelle) {
    return undefined;
  }
  const libelleUpper = (calendrierFrnLibelle ?? "").toUpperCase();
  const codeUpper = (calendrierFrnCode ?? "").toUpperCase();
  const acheminementUpper = (formuleAcheminementLibelle ?? "").toUpperCase();
  const tensionUpper = (domaineTensionLibelle ?? "").toUpperCase();

  if (
    libelleUpper.includes("MARCHE") ||
    libelleUpper.includes("MARCHÉ") ||
    libelleUpper.startsWith("MA ") ||
    libelleUpper.startsWith("MA-") ||
    codeUpper.startsWith("MA") ||
    codeUpper.startsWith("OF") ||
    codeUpper.startsWith("EM")
  ) {
    return `Offre de marché — ${calendrierFrnLibelle ?? "structure inconnue"}`;
  }

  if (codeUpper.startsWith("FC")) {
    if (tensionUpper.includes("BT<=36") || tensionUpper.includes("BT≤36")) {
      if (libelleUpper.includes("HEURES PLEINES")) return "TRV Bleu HPHC (EDF présumé)";
      if (libelleUpper.includes("BASE")) return "TRV Bleu Base (EDF présumé)";
      return `TRV Bleu (EDF présumé) — ${calendrierFrnLibelle ?? ""}`;
    }
    if (tensionUpper.includes("BT>36") || tensionUpper.includes("BT > 36")) {
      return `TRV Jaune (EDF présumé) — ${calendrierFrnLibelle ?? ""}`;
    }
    if (tensionUpper.includes("HTA")) {
      return `TRV Vert / HTA (EDF présumé) — ${calendrierFrnLibelle ?? ""}`;
    }
    return `TRV présumé — ${calendrierFrnLibelle ?? ""}`;
  }

  if (!calendrierFrnLibelle && acheminementUpper.includes("BT>36")) {
    return "Tarif Jaune (TRV ou marché — indéterminé)";
  }
  if (!calendrierFrnLibelle && acheminementUpper.includes("HTA")) {
    return "Tarif Vert / HTA (TRV ou marché — indéterminé)";
  }

  return `Indéterminé — ${calendrierFrnLibelle ?? ""}`;
}

export function extractContractDetailsFromC68(raw: any): SimulateurSwitchContractDetails {
  const point = raw?.point ?? raw;
  const dg = point?.donneesGenerales ?? {};
  const sc = point?.situationComptage ?? {};
  const sa = point?.situationAlimentation?.alimentationPrincipale ?? {};
  const stc = point?.situationContractuelle?.structureTarifaire ?? {};

  const adresse = dg.adresseInstallation
    ? [
        dg.adresseInstallation.numeroEtNomVoie,
        dg.adresseInstallation.codePostal,
        dg.adresseInstallation.commune?.libelle,
      ]
        .filter(Boolean)
        .join(" ")
    : undefined;

  const dateAug = dg.dateDerniereAugmentationPuissanceSouscrite;
  const dateAugClean = dateAug ? String(dateAug).slice(0, 10) : undefined;

  const parseKva = (v: any): number | undefined => {
    const n = Number(v?.valeur ?? v);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    raw,
    prm: point?.attributes?.id,
    segmentCode: dg.segment?.attributes?.code,
    segmentLibelle: dg.segment?.libelle,
    etatContractuel: dg.etatContractuel?.libelle,
    adresseInstallation: adresse,
    domaineTensionLibelle: sa.domaineTension?.libelle,
    domaineTensionCode: sa.domaineTension?.attributes?.code,
    puissanceSouscriteKva: parseKva(stc.puissanceSouscriteMax),
    puissanceRaccordementKva: parseKva(sa.puissanceRaccordementSoutirage),
    formuleTarifaireCode: stc.formuleTarifaireAcheminement?.attributes?.code,
    formuleTarifaireLibelle: stc.formuleTarifaireAcheminement?.libelle,
    calendrierFrnLibelle: stc.calendrierFrn?.libelle,
    plagesHeuresCreuses: sc.dispositifComptage?.relais?.plageHeuresCreuses,
    futuresPlagesHeuresCreuses: sc.futuresPlagesHeuresCreuses?.libelle,
    typeComptageLibelle: sc.dispositifComptage?.typeComptage?.libelle,
    calibreDisjoncteur: sc.dispositifComptage?.disjoncteur?.calibre?.libelle,
    periodiciteReleve: sc.caracteristiquesReleve?.periodicite?.libelle,
    dateDerniereAugmentationPuissance: dateAugClean,
    typeContratLabel: deduireTypeContrat(
      stc.calendrierFrn?.libelle,
      stc.calendrierFrn?.attributes?.code,
      stc.formuleTarifaireAcheminement?.libelle,
      sa.domaineTension?.libelle
    ),
    localisationCompteur: sc.dispositifComptage?.compteurs?.compteur?.[0]?.localisation?.libelle,
  };
}
