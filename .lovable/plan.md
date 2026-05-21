## Analyse du prompt — 3 choses qui clochent

### 🔴 Bloquant : le contenu JSX du fichier (B) est cassé
Le bloc `---DEBUT FICHIER--- … ---FIN FICHIER---` pour `Step7AnimationTRV.tsx` a été collé depuis un rendu markdown : toutes les balises JSX (`<div>`, `<p>`, `<button>`, `<ResponsiveContainer>`, `<AreaChart>`, etc.) ont été supprimées. Il reste des fragments comme :
```
          
            Étape 7 / 8
          
            Économies Dynawatt face aux Tarifs EDF
```
Impossible à utiliser tel quel — ça ne compile pas.

**Solution** : je vais **cloner `Step6Animation.tsx` réel** (353 lignes, déjà en context) et l'adapter point par point selon ta spec (filtre TRV, `prixTRV_TTC`, badges worst/best, init worst case via `useState(() => ...)`, titre, bouton "Voir le financement"). C'est ce que tu voulais — j'utilise juste la vraie source comme base.

### 🟡 Note (pas un bug, conséquence attendue) : Step1/Step2 vont aussi passer en "/8"
Step1Identite et Step2Switchgrid utilisent déjà `Étape X / {TOTAL_STEPS}` (dynamique). Quand on passe `TOTAL_STEPS` à 8, ils afficheront automatiquement "1 / 8" et "2 / 8". C'est cohérent avec ton objectif (sinon ça serait incohérent visuellement). Je le mentionne car ta liste "NE PAS toucher" inclut Step1/Step2 — pas besoin de les toucher, mais leur affichage change *gratuitement*. OK ?

### 🟡 Mineur : typage du `useState` initializer
```ts
const [selectedTRV, setSelectedTRV] = useState(() => {
  if (!days.length) return isC4 ? "JAUNE_CU" : "BLEU_BASE";
  return findWorstCaseTRV(days, CONSTANTES.TVA);
});
```
Sans annotation, TS l'infère en `string`, ce qui cassera `setSelectedTRV(t)` où `t: TarifTRVType`. À typer explicitement : `useState<TarifTRVType>(() => ...)`.

---

## Plan d'exécution (une fois validé)

1. **CRÉER** `src/lib/tarifs-trv.ts` — verbatim depuis le prompt (ce fichier-là est sain).
2. **CRÉER** `src/simulateur-switch/steps/Step7AnimationTRV.tsx` — clone réel de `Step6Animation.tsx` avec ces diffs :
   - Imports : remplacer `buildFactureActuelle` par les helpers de `@/lib/tarifs-trv`.
   - Retirer `facture`, `tarifAncienTtc`, `aboAncienTtcJour`.
   - Ajouter `kvaClient`, `isC4`, `selectedTRV` (typé `TarifTRVType`, init = `findWorstCaseTRV`), `worstCaseTarif`, `bestCaseTarif`.
   - Remplacer dans `dayEconomies` / `hourly` / `econoTotale` les références à `tarifAncienTtc`/`aboAncienTtcJour` par `prixTRV_TTC(d.date, h, selectedTRV, CONSTANTES.TVA)` (avec gestion `null` → on skip cette heure ; pas d'abonnement TRV).
   - Ajouter le bloc UI "Filtre TRV + kVA" (3 toggles avec badges worst/best/non-appli).
   - Badge `Étape 7 / 8`, titre `Économies Dynawatt face aux Tarifs EDF`.
   - Bouton next : `Voir le financement` (Step 8 = Financement).
3. **MODIFIER** `SimulateurSwitchContext.tsx` : `TOTAL_STEPS = 7` → `8`.
4. **MODIFIER** `WizardHeader.tsx` : ajouter `{ n: 7, label: "TRV EDF" }`, renuméroter Leasing en 8.
5. **MODIFIER** `Step6Animation.tsx` : `"Étape 6 / 7"` → `"Étape 6 / 8"`, `"Voir le financement"` → `"Voir vs Tarifs EDF"`.
6. **MODIFIER** `Step7Financement.tsx` : `"Étape 7 / 7"` → `"Étape 8 / 8"` (pas de rename).
7. **MODIFIER** `src/pages/SimulateurSwitch.tsx` : ajouter import + `step === 7 && <Step7AnimationTRV />` et `step === 8 && <Step7Financement />`.

Confirme et je l'implémente — surtout sur le point 🔴 (je clone Step6 réel au lieu du blob cassé).