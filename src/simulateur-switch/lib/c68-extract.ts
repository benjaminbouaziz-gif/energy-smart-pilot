import type { SimulateurSwitchContractDetails } from "../SimulateurSwitchContext";

// Recursive limited-depth search for a key (case-insensitive, fuzzy substring).
function findDeep(obj: any, needles: string[], depth = 0): any {
  if (obj == null || depth > 6) return undefined;
  if (typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findDeep(item, needles, depth + 1);
      if (r !== undefined) return r;
    }
    return undefined;
  }
  for (const key of Object.keys(obj)) {
    const lk = key.toLowerCase();
    if (needles.some((n) => lk === n || lk.includes(n))) {
      const v = obj[key];
      if (v !== null && typeof v !== "object") return v;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        // sometimes the value is wrapped, e.g. { valeur: "..."} — try unwrap
        if ("valeur" in v) return (v as any).valeur;
        if ("value" in v) return (v as any).value;
      }
      if (v !== undefined) return v;
    }
  }
  for (const key of Object.keys(obj)) {
    const r = findDeep(obj[key], needles, depth + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

function toNumber(v: any): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function toStr(v: any): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  return undefined;
}

export function extractContractDetailsFromC68(raw: any): SimulateurSwitchContractDetails | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const prm = toStr(findDeep(raw, ["prm", "pointid", "pointreference", "identifiant"]));
  const titulaire = toStr(
    findDeep(raw, ["titulaire", "nomtitulaire", "denomination", "raisonsociale"])
  );
  const segment = toStr(findDeep(raw, ["segment", "segmentclientele"]));
  const domaineTension = toStr(findDeep(raw, ["domainetension", "tension"]));
  const puissanceSouscriteKva = toNumber(
    findDeep(raw, ["puissancesouscrite", "puissance_souscrite"])
  );
  const optionTarifaire = toStr(
    findDeep(raw, ["optiontarifaire", "formuletarifaire", "calendrierfrn"])
  );
  const typeCompteur = toStr(findDeep(raw, ["typecompteur", "modelecompteur", "compteur"]));
  const dateMiseEnService = toStr(
    findDeep(raw, ["datemiseenservice", "datemes", "datedebutcontrat"])
  );

  const ftaRaw = findDeep(raw, ["formulestarifairesactives", "formulestarifaires"]);
  let formulesTarifairesActives: string[] | undefined;
  if (Array.isArray(ftaRaw)) {
    formulesTarifairesActives = ftaRaw
      .map((x) => (typeof x === "string" ? x : toStr(x?.libelle) ?? toStr(x?.code)))
      .filter((x): x is string => !!x);
  }

  return {
    raw,
    prm,
    titulaire,
    segment,
    domaineTension,
    puissanceSouscriteKva,
    optionTarifaire,
    formulesTarifairesActives,
    typeCompteur,
    dateMiseEnService,
  };
}
