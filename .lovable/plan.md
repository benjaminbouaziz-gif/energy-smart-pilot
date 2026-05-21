## Objectif
Mettre à jour le fichier `src/lib/tarifs-trv.ts` avec la nouvelle grille Tarif Jaune CU applicable au 01/02/2026.

## Modifications
1. Dans `TRV_JAUNE_CU` :
   - Fermer `dateFin` de l'entrée du 2025-08-01 : `null` → `"2026-01-31"`
   - Ajouter nouvelle entrée 2026-02-01 avec les composantes officielles : `HPH: 0.18808`, `HCH: 0.12751`, `HPE: 0.08839`, `HCE: 0.08056`

## Verrous respectés
- Aucune modification des grilles Bleu Base / Bleu HPHC
- Aucune modification des helpers, types, ou fonctions
- Aucune modification d'autres fichiers

## Validation
- Vérification compilation TypeScript sans erreur
- Vérification manuelle que prixTRV_TTC retourne les bonnes valeurs aux dates clés (15/01/2026 → ancienne grille, 01/03/2026 → nouvelle grille)