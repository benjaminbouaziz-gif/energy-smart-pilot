## Objectif

Ajouter un bouton **"Exporter calcul exhaustif heure par heure"** dans `Step7AnimationTRV.tsx`, à gauche du bouton "Précédent" en bas de page. Au clic, génération d'un fichier Excel `.xlsx` 1 feuille / 1 ligne par heure / 24 colonnes, exposant toutes les composantes du calcul (Sobry, TRV sélectionné, batterie, comparaison).

## Changements

### 1. Dépendance

Installer `xlsx` (SheetJS) — pas encore présent dans `node_modules`.

```
bun add xlsx
```

### 2. Édition unique : `src/simulateur-switch/steps/Step7AnimationTRV.tsx`

**Imports additionnels :**
- `import * as XLSX from "xlsx";`
- Ajouter `Download` à l'import `lucide-react`.
- Importer les grilles depuis `@/lib/tarifs-trv` : `TRV_BLEU_BASE`, `TRV_BLEU_HPHC`, `TRV_JAUNE_CU`.

**Récupérer `factureSobry`** depuis `useSimulateurSwitch()` (déjà exposé dans le contexte, type `details_horaires: any[]`).

**Pré-calcul map des plans jour** (mémo) :
```ts
const dayMap = useMemo(() => new Map(days.map((d:any) => [d.date, d])), [days]);
```

**Helpers locaux (pure, dans le fichier)** :
- `plageTRV(date, hour, type)` → réplique exacte de la logique de `prixTRV_TTC` mais renvoie le **nom de la plage** ("HPH"/"HCH"/"HPE"/"HCE"/"HP"/"HC"/"BASE").
- `periodeBareme(date, type)` → renvoie la `GrilleTRVPeriode` qui contient la date, plus libellé `"01/02/2025→31/07/2025"` (avec `∞` si `dateFin === null`). Format date FR `DD/MM/YYYY`.
- `actionBatterie(dayPlan, hour)` → `"charge" | "decharge" | ""` en testant `cycle1`/`cycle2` (mêmes bornes que la logique existante de `hourly`).
- `gainBatterieHeure(dayPlan, hour)` → recalcule le `gainCycle` par cycle (formule de l'engine : `max(0, spread * RTE_BATTERIE * DEGRADATION * min(capacite, sum(conso pendant décharge)) * (1+TVA))`), puis répartit ce gain au prorata de `conso24h[h] / Σconso24h sur fenêtre de décharge` pour les heures de décharge du cycle correspondant. Heures de charge et heures hors cycle : `0`. Importer `CONSTANTES` (déjà importé) et `result.config.capacite`.

**Handler `handleExport`** :
1. Construire `rows: any[][]` avec 2 lignes d'en-tête (labels FR + unités) puis une ligne par entrée de `factureSobry.details_horaires`.
2. Pour chaque heure `h` :
   - Parser `h.timestamp` pour obtenir `date` (YYYY-MM-DD), `hour` (0-23), `dayOfWeek` (0=dim…6=sam) via `new Date(h.timestamp)`.
   - Calculer les 24 colonnes selon la spec exacte du prompt utilisateur :
     - col 10 "Autres" = `(cost_total/conso) - spot - turpe_var - accise` si `conso>0` sinon `0`
     - col 11 Sobry HT = `cost_total/conso` (0 si conso 0)
     - col 12 Sobry TTC = col11 × `(1+TVA)`
     - col 13 Coût Sobry TTC = col12 × conso
     - col 14 plage TRV via `plageTRV`
     - col 15 bornes barème via `periodeBareme`
     - col 16 prix TRV HTVA = `periode.composantes[plage]` (ou vide si TRV non disponible → null)
     - col 17 prix TRV TTC = col16 × `(1+TVA)` (ou vide)
     - col 18 coût TRV TTC = col17 × conso (ou vide)
     - col 19 = col17 − col12
     - col 20 = col18 − col13
     - cols 21-23 batterie via helpers ci-dessus
     - col 24 = col20 + col23
3. Ligne TOTAL : `["TOTAL", "", "", "", Σconso, "", "", "", "", "", "", "", Σcout_sobry, "", "", "", "", Σcout_trv, "", Σeco_sobry, "", "", Σgain_batt, Σeco_totale]`.
4. Écrire le fichier :
```ts
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, "Calcul détaillé");
XLSX.writeFile(wb, `simulateur-switch-calcul-exhaustif-${selectedTRV}-${new Date().toISOString().slice(0,10)}.xlsx`);
```

**Bouton** : ajouter dans le `<div className="container ... flex justify-between">` final, encapsuler "Précédent" + bouton export dans un sous-div à gauche :
```tsx
<div className="flex gap-2">
  <Button variant="outline" onClick={prev} className="gap-2">
    <ChevronLeft className="w-4 h-4" /> Précédent
  </Button>
  <Button
    variant="outline"
    onClick={handleExport}
    disabled={!factureSobry?.details_horaires?.length}
    className="gap-2"
  >
    <Download className="w-4 h-4" /> Exporter calcul exhaustif heure par heure
  </Button>
</div>
```
Le bouton "Voir le financement" reste à droite, le `justify-between` du conteneur est conservé.

## Verrous respectés

- Aucune modification de calcul existant (`dayEconomies`, `hourly`, `soc`, `heatmap` inchangés).
- Aucune modification des grilles TRV, des helpers `prixTRV_TTC`, du moteur batterie.
- Aucun autre fichier touché sauf `package.json`/`bun.lockb` du fait de l'install xlsx.
- Bouton désactivé si `factureSobry` absent ou `details_horaires` vide.

## Vérifications

- `bunx tsc --noEmit` doit passer.
- Build Vite OK (xlsx est compatible Vite côté navigateur via `XLSX.writeFile`).
