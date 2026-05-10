import type {
  SimulateurSwitchTarifConcurrent,
  SimulateurSwitchFactureConcurrent,
} from "../SimulateurSwitchContext";
import type { FactureActuelle } from "@/lib/dynawatt-engine-bis";

/**
 * Build a FactureActuelle (engine input) from the user's competitor tariff.
 * For HC/HP and Super-creuses contracts we compute a weighted average price
 * from the actual hourly distribution computed in Step 4.
 */
export function buildFactureActuelle(
  tarif: SimulateurSwitchTarifConcurrent,
  facture: SimulateurSwitchFactureConcurrent | undefined,
  fournisseurFallback = "Fournisseur actuel"
): FactureActuelle {
  let prix_kwh_ht = 0;
  if (tarif.structure === "BASE") {
    prix_kwh_ht = Number(tarif.prixKwhHt ?? 0);
  } else if (facture && facture.annual.conso_kwh > 0) {
    prix_kwh_ht = facture.annual.cost_variable_ht / facture.annual.conso_kwh;
  } else {
    // weighted from configured slot ranges, fallback to HP price
    prix_kwh_ht = Number(tarif.prixHpHt ?? tarif.prixHcHt ?? 0);
  }
  return {
    fournisseur: tarif.fournisseur || fournisseurFallback,
    prix_kwh_ht,
    abonnement_mensuel_ht: Number(tarif.abonnementMensuelHt ?? 0),
    structure_tarifaire: tarif.structure,
  };
}
