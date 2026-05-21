## Ajouter Économies mensuelle et annuelle sur Step 7 (TRV)

Dans le bloc "Comparer Dynawatt face à" du Step 7, ajouter deux indicateurs sous la ligne "Contrat client" :

- **Économie estimée / mois** : moyenne mensuelle calculée à partir de la somme totale annuelle divisée par 12
- **Économie estimée / an** : somme totale des `dayEconomies[i].total` sur tous les jours du planning, extrapolée à 365 jours si la période simulée est plus courte

### Détail technique

Dans `src/simulateur-switch/steps/Step7AnimationTRV.tsx`, juste après le `useMemo` de `dayEconomies`, ajouter :

```ts
const { economieAnnuelle, economieMensuelle } = useMemo(() => {
  const totalPeriode = dayEconomies.reduce((s, e) => s + e.total, 0);
  const nbJours = dayEconomies.length || 1;
  const annuelle = (totalPeriode / nbJours) * 365;
  return { economieAnnuelle: annuelle, economieMensuelle: annuelle / 12 };
}, [dayEconomies]);
```

Puis dans le bloc filtre TRV (lignes 151-162), ajouter à droite du label "Contrat client" deux pastilles affichant les montants, recalculées à chaque changement de `selectedTRV` :

```text
[Comparer Dynawatt face à]            [+ X €/mois]  [+ Y €/an]
[Contrat client : 36 kVA → C5]
[boutons TRV...]
```

Style : pastilles arrondies, vertes si > 0, rouges si < 0, format `+1 234 € / mois` et `+14 800 € / an` (via `fmt(..., 0)`).

### Fichiers modifiés

- `src/simulateur-switch/steps/Step7AnimationTRV.tsx` (un seul fichier)

Aucun changement de calcul backend, aucune autre étape touchée.