import type { SimulateurSwitchContractDetails } from "../SimulateurSwitchContext";

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
  };
}
