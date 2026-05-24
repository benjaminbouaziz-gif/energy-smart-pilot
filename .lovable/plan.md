## Objectif

Dans Step 7 (TRV), afficher l'économie ventilée en **deux composantes** au lieu d'un seul total, pour qu'on voie clairement que la part « batterie » est identique à celle de Step 6.

## Changements

**Fichier unique** : `src/simulateur-switch/steps/Step7AnimationTRV.tsx`

### 1. Cartes "Économie / mois" et "Économie / an" (lignes 358-383)

Remplacer les 2 chips actuels par un bloc à 3 colonnes :
- **Contrat** (Sobry vs TRV sélectionné) — `economieSobry` mensuelle / annuelle
- **Batterie** (pilotage) — `economiePilotage` mensuelle / annuelle (identique à Step 6)
- **Total** — somme des deux

Conserver le code couleur vert/rouge selon signe du total.

### 2. Carte "Économies du jour" (lignes 530-545)

Sous le grand chiffre `econoDuJour.total`, ajouter une ligne de ventilation discrète :
```
Contrat: +X,XX € · Batterie: +Y,YY €
```

### 3. Calculs

`dayEconomies` (ligne 57-75) expose déjà `sobry` et `pilotage` — il suffit de les agréger annuellement en parallèle de `total` :

```ts
const { economieAnnuelle, economieMensuelle,
        ecoContratAnnuelle, ecoContratMensuelle,
        ecoBatterieAnnuelle, ecoBatterieMensuelle } = useMemo(() => {
  const totalP   = dayEconomies.reduce((s, e) => s + e.total, 0);
  const sobryP   = dayEconomies.reduce((s, e) => s + e.sobry, 0);
  const pilotP   = dayEconomies.reduce((s, e) => s + e.pilotage, 0);
  const n = dayEconomies.length || 1;
  const annT = (totalP / n) * 365;
  const annS = (sobryP / n) * 365;
  const annP = (pilotP / n) * 365;
  return {
    economieAnnuelle: annT, economieMensuelle: annT / 12,
    ecoContratAnnuelle: annS, ecoContratMensuelle: annS / 12,
    ecoBatterieAnnuelle: annP, ecoBatterieMensuelle: annP / 12,
  };
}, [dayEconomies]);
```

## Verrous

- Aucun calcul modifié (réutilise `dayEconomies.sobry` et `dayEconomies.pilotage` déjà calculés).
- Aucun autre fichier touché.
- `gainJour` reste lu tel quel depuis `result.planJours` → la cohérence avec Step 6 est garantie par construction.

## Résultat attendu

L'utilisateur voit dans Step 7 la part « Batterie » en €/mois et €/an, et peut la comparer directement avec celle affichée dans Step 6 — elles doivent être strictement identiques (à l'arrondi près).
