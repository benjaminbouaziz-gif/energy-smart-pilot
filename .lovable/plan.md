## Constat

La référence de calibration (`Simulateur_Batterie_Sobry.xlsx`) donne pour un onduleur 5 kW :
**982 €/an**, soit 196,45 €/kW × 5 kW, avec 1,608 cycles/j et spread moyen 0,094 €/kWh.

- **Step 7 (et Step 6)** affichent **982 €/an** via `Σ planJours[].gainJour` → **conformes** à la base de calibration.
- **Step 5** affiche **1 593 €/an** via `roi.gainTtcAn = capacité × 638,75 × 0,0866` → **incohérent** : utilise la capacité (28,8 kWh) au lieu de la puissance onduleur (5 kW), et un nombre de cycles théorique (1,75/j) au lieu de celui simulé (1,608/j).

## Changement

**Fichier unique** : `src/lib/dynawatt-engine-bis.ts`

Remplacer la formule fixe de `calculerROI` par la valeur **réellement simulée** par le moteur, qui est déjà calculée et accessible via `stats.totalGainAn` (somme des `gainJour` projetée sur 365 j).

```ts
export function calculerROI(stats: AnnualStats, configKey: ConfigKey) {
  const config = CONFIGS[configKey];
  // Aligné sur la simulation horaire réelle (cohérent avec Step 6 / Step 7)
  const gainTtcAn = stats.totalGainAn;
  const gainNetAn = gainTtcAn / (1 + CONSTANTES.TVA);
  const paybackAns = config.prix_ttc / Math.max(gainTtcAn, 1);
  const roi7Ans = gainTtcAn * 7 - config.prix_ttc;
  return { paybackAns, roi7Ans, gainNetAn, gainTtcAn };
}
```

Les constantes `CYCLES_PAR_AN_FIXE` et `SPREAD_NET_TTC_PAR_KWH` peuvent être conservées (commentées comme « valeurs cibles brochure ») ou supprimées — à ton choix.

## Impact attendu sur Step 5 (pack MOYEN, exemple courbe actuelle)

| Métrique | Avant | Après |
|---|---|---|
| Économies annuelles brutes | 1 593 € | ~982 € |
| Économies nettes annuelles | 1 328 € | ~818 € |
| Retour sur investissement | 9,0 ans | ~14,7 ans |
| ROI sur 7 ans | −3 248 € | ~−7 526 € |

→ Step 5, 6 et 7 deviennent strictement cohérents, et tous alignés sur ta base Excel.

## Vérifications avant build
1. Confirmer que `stats.totalGainAn` est bien projeté à 365 j (sinon adapter).
2. Vérifier que rien d'autre ne dépend de `CYCLES_PAR_AN_FIXE` / `SPREAD_NET_TTC_PAR_KWH` (sinon les conserver pour ne pas casser).

## Verrous
- Aucun changement de logique de simulation (les `gainJour` restent ce qu'ils sont).
- Touche uniquement `calculerROI` → impacte la carte ROI de Step 5 et tout consommateur de `sim.roi.gainTtcAn`.
- Si tu veux conserver la valeur « cible commerciale » de 1 593 € pour la brochure tout en affichant la valeur simulée, on peut afficher les deux en Step 5 — dis-le-moi.

## Question avant exécution

Veux-tu :
- **A.** Aligner Step 5 sur la simulation réelle (982 €) — recommandé pour cohérence.
- **B.** Garder la formule fixe (1 593 €) et juste ajouter un disclaimer.
- **C.** Afficher les deux côte-à-côte (« valeur cible » vs « valeur simulée »).
