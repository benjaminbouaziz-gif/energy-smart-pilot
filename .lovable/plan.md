# Plan — Fix TVA + Forçage MOYEN + Fusion économies Step 6/7

Modifications sur **4 fichiers** (Step5 ajouté après ta validation, 1 ligne seulement).

## 1. `src/lib/dynawatt-engine-bis.ts` — Fix bug HT/TTC

Dans `simulerJournee`, helper `gainCycle` (~ligne 230) :
- Multiplier le retour par `(1 + CONSTANTES.TVA)` pour cohérence avec `executerSimulation` qui traite `gainJour` comme TTC.

Idem dans `gainOfSecondCycle` (~ligne 280) : multiplier par `(1 + CONSTANTES.TVA)`.

Aucune autre modification de l'engine (suggerConfig inchangé).

## 2. `src/simulateur-switch/steps/Step5Comparaison.tsx` — Forçage MOYEN (1 ligne)

Avant la ligne 149 (`executerSimulation(monthlyJsons, configBatterie, facture)`), forcer :
```ts
// FORCE: produit MOYEN imposé pour le Simulateur Switch (décision commerciale)
const configKeyForce: ConfigKey = "MOYEN";
const simulationResult = executerSimulation(monthlyJsons, configKeyForce, facture);
```
(Import `ConfigKey` ajouté si nécessaire — il est probablement déjà tiré du même module.)

Aucune autre ligne du fichier modifiée.

## 3. `src/simulateur-switch/steps/Step6Animation.tsx` — Fusion économies

Bloc `motion.div` "Gain Dynawatt ce jour" (~ligne 235) :
- Remplacer le label par "Économies Dynawatt"
- Supprimer la décomposition Sobry / Pilotage
- Garder le total + le compteur de cycles

Le calcul `econoDuJour` reste inchangé.

## 4. `src/simulateur-switch/steps/Step7Financement.tsx` — Section économies unique

(a) Remplacer le calcul (~ligne 105) :
```ts
const economieTotaleTtc = result.economieAnnuelleTtc; // source unique 12 mois réels
const gainAnnuelTtc = economieTotaleTtc;
const gainMensuelTtc = gainAnnuelTtc / 12;
```
Supprimer `economieSobryTtc` et `economieBatterieTtc`.

(b) Remplacer le bloc "Vos économies annuelles" (3 cartes) par une seule carte centrée gold, label "Économies Dynawatt", sous-titre "sur les 12 derniers mois — base du cashflow ci-dessous".

(c) `handleSave` : `economie_annuelle: economieTotaleTtc` reste valide (pointe maintenant sur `result.economieAnnuelleTtc`). Reste inchangé.

## Vérifications

- TypeScript compile (build auto)
- Step 6 : un seul bloc total sans décomposition
- Step 7 : une seule carte gold centrée
- PDF + sauvegarde Supabase non cassés (structures conservées)

## Notes

- `suggerConfig` non modifiée (utilisée potentiellement ailleurs).
- `battery-simulation.ts` non modifié (utilise déjà `suggerConfig` mais n'est pas dans le flow actif Step5→Step7).
- Aucun autre fichier touché.
