## Passage en Mode Réel Switchgrid

Actuellement, les 5 edge functions Switchgrid envoient toutes le header `switchgrid-test-env: true` car la constante `SWITCHGRID_TEST_MODE` est hardcodée à `"true"` dans chaque fichier. En mode réel, ce header ne doit plus être envoyé du tout.

### Changements

Dans chacune des 5 edge functions :
- `supabase/functions/switchgrid-search-contract/index.ts`
- `supabase/functions/switchgrid-create-ask/index.ts`
- `supabase/functions/switchgrid-poll-ask/index.ts`
- `supabase/functions/switchgrid-create-order/index.ts`
- `supabase/functions/switchgrid-poll-order/index.ts`

Passer `const SWITCHGRID_TEST_MODE = "true"` à `"false"`. Le code existant n'ajoute le header `switchgrid-test-env` que si la valeur est `"true"`, donc le simple basculement suffit — aucune autre logique à modifier.

### Points d'attention (à confirmer)

1. **Données réelles** : une fois en mode réel, chaque consentement déclenchera de vrais appels Enedis facturés. Le PDL `21329667109093` utilisé jusqu'ici est un PDL de test fictif et **ne fonctionnera pas en réel**. Il faudra refaire un test avec un vrai compteur Linky et signer un vrai consentement Enedis.

2. **Redéploiement** : les 5 fonctions seront redéployées automatiquement.

3. **RGPD** : aucun changement, on continue à ne rien persister de la courbe.

### Hors scope

- Pas de bascule dynamique test/réel via secret (on hardcode `"false"`). Si tu veux un toggle propre via le secret `SWITCHGRID_TEST_MODE` déjà mentionné dans le plan initial, dis-le et je le branche sur `Deno.env.get` à la place.
