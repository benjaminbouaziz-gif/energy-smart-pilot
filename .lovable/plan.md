# Brique Switchgrid — Récupération courbe Linky 12 mois

Brique autonome qui collecte un consentement Enedis via Switchgrid, récupère la courbe de charge horaire sur 12 mois et produit un JSON réutilisable. Tout passe par Lovable Cloud (backend déjà connecté), aucune clé API n'apparaît côté navigateur.

## Backend (Lovable Cloud)

### Migration SQL
Table `public.switchgrid_sessions` :
- `id uuid PK`, `prm`, `ask_id`, `consent_id`, `order_id`, `loadcurve_request_id`
- `status text` (machine à états : INIT → PENDING_CONSENT → CONSENT_ACCEPTED → FETCHING → READY | FAILED)
- `error_message`, `signer_first_name`, `signer_last_name`, `signer_genre`, `address`
- `created_at`, `updated_at` + trigger d'auto-update
- Index sur `ask_id` et `order_id`
- RLS activé avec policies publiques (phase brique sans auth)

### Secrets backend (déjà ajoutés ou à hardcoder)
- `SWITCHGRID_API_KEY` ✅ ajouté
- `SWITCHGRID_BASE_URL` = `https://app.switchgrid.tech/enedis/v2` (en dur dans les fonctions)
- `SWITCHGRID_TEST_MODE` = `true` (en dur, ajoute le header `switchgrid-test-env: true`)
- `APP_URL` : utilisera `req.headers.origin` côté edge function pour construire le `redirectUrl` dynamiquement (évite la config manuelle)

### 5 Edge Functions Deno (toutes avec CORS, `cache: "no-store"`)

1. **`switchgrid-search-contract`** (POST) — recherche par PRM (regex `^\d{14}$`) ou par nom+adresse via `GET /search_contract`. Normalise la réponse en `{ contracts: [{ id, prm, signerName, address, segment }] }`.

2. **`switchgrid-create-ask`** (POST) — parse l'adresse string en objet `{ street, postalCode, city, country: "FR" }` via regex `^(.+?)[\s,]+(\d{5})\s+(.+)$`, construit `POST /ask` avec `heldBy.genre` obligatoire, `purposes: ["SOLAR_INSTALLATION_SIZING"]`, `consentDuration: "1 year"`, `redirectUrl` vers `/switchgrid/callback?sessionId=...`. Met à jour la session (`status='PENDING_CONSENT'`, `ask_id`).

3. **`switchgrid-poll-ask`** (GET `?askId=`) — `GET /ask/{askId}` avec `cache:"no-store"`. Extrait `consentId` via `Object.values(response.consentIds)[0]`. Renvoie `{ status, consentId? }`. Met à jour la session si ACCEPTED.

4. **`switchgrid-create-order`** (POST) — formate les dates au format `YYYY-MM-DDTHH:mm:ss[Europe/Paris]`, fenêtre 365j, `POST /order` avec requests LOADCURVE (CONSUMPTION + `enedisRetryAfterLoadcurveActivation: true`) + C68. Stocke `order_id` et `loadcurve_request_id` (extrait par `type === "LOADCURVE"`).

5. **`switchgrid-poll-order`** (GET `?orderId=&sessionId=`) — `GET /order/{orderId}`. SUCCESS ou (SOME_REQUESTS_FAILED + loadcurve OK) → appelle `GET /request/{loadcurve_request_id}/data?format=json`, parse `period` ISO 8601 (regex `^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$`), convertit watts → Wh (`powerW * periodMin/60`), construit `LoadCurvePoint[]`. **Aucune persistance de la courbe.** Renvoie `{ status: "READY", loadCurve }`.

Tous les `supabase/config.toml` de ces fonctions : `verify_jwt = false`.

## Frontend React

### Helper `src/lib/switchgrid/transformer.ts`
Fonction `switchgridToHourlyKwh(loadCurve)` :
- Bucketise les points par heure pleine UTC (somme des Wh, /1000 → kWh)
- Fenêtre = `[max(timestamp) arrondi - 365j, max(timestamp) arrondi]`
- Trous ≤ 4h consécutives → interpolation linéaire ; > 4h → 0 + warning `GAP_LARGE: <h> heures à <ISO>`
- `qualityScore` = heures réellement connues / heures totales
- Retourne `{ hourlyKwh[], timestamps[], qualityScore, totalKwh, windowStart, windowEnd, warnings }`

### Store global Zustand `src/lib/switchgrid/store.ts`
État en mémoire seulement (pas de localStorage, RGPD) : `loadCurve`, `prm`, `setResult()`, `clear()`.

### Routes (ajout dans `src/App.tsx`)
- `/switchgrid` → `SwitchgridForm.tsx`
- `/switchgrid/callback` → `SwitchgridCallback.tsx`
- `/switchgrid/results` → `SwitchgridResults.tsx`

La landing `/` et tout le site existant restent intacts.

### Page `/switchgrid` (formulaire)
- **Section identité** : civilité radio M/Mme, prénom, nom, adresse complète (placeholder `12 rue de la Paix, 75002 Paris`)
- **Section compteur** : segmented control 2 modes
  - **Mode A "J'ai mon PDL"** (défaut) : input avec auto-format `XXXX XXXX XXXX XX`, validation 14 chiffres, bouton "Vérifier" → `switchgrid-search-contract` avec `{ prm }`. Affiche carte verte de validation.
  - **Mode B "Rechercher mon compteur"** : utilise les champs identité + adresse, bouton "Rechercher" → `switchgrid-search-contract` avec `{ firstName, lastName, address }`. Liste de cards radio si plusieurs résultats.
- Au clic "Continuer avec ce compteur" :
  1. Génère `sessionId = crypto.randomUUID()`
  2. INSERT dans `switchgrid_sessions`
  3. Appel `switchgrid-create-ask` → récupère `userUrl`
  4. `window.open(userUrl, "_blank", "noopener,noreferrer")`
  5. `navigate("/switchgrid/callback?sessionId=...")`
- Design : carte centrée max-w-[600px], fond blanc, accent émeraude, inspiration Linear/Vercel

### Page `/switchgrid/callback`
Polling progressif avec UI étapes cochées (4 phases) :
1. **Init** : SELECT session → récupère `ask_id`
2. **Signature en cours** : poll `switchgrid-poll-ask` toutes les 2s (timeout 5 min). Bouton "J'ai signé" force un poll immédiat et passe la fréquence à 500ms.
3. **Demande Enedis** : appel `switchgrid-create-order` → récupère `orderId`
4. **Téléchargement courbe** : poll `switchgrid-poll-order` toutes les 3s (timeout 5 min). Au READY → store Zustand + `navigate("/switchgrid/results")`.
- Erreurs définitives (ADDRESS_CHECK_FAILED, EXPIRED, REVOKED, FAILED) → message + bouton "Recommencer"
- Retry réseau auto x3, timeout global 5 min par phase

### Page `/switchgrid/results`
Lit le store Zustand, applique `switchgridToHourlyKwh()`. Si store vide → redirige `/switchgrid`.
- Bandeau succès vert : PRM formaté, période FR, nb heures (8760/8784), qualityScore %, total annuel kWh
- Recharts AreaChart agrégé par jour (365 points), axes dates / kWh, couleur émeraude
- Tableau récap mensuel 12 lignes : Mois | Total kWh | Pic horaire kWh | Heure du pic
- Bouton primaire "Télécharger JSON" → blob téléchargé `switchgrid-export.json` avec `{ prm, fetchedAt, windowStart, windowEnd, hourlyKwh, qualityScore, totalKwh, warnings }`
- Bouton secondaire "Recommencer" → `clear()` store + `/switchgrid`

## Pièges Switchgrid respectés

1. `cache: "no-store"` sur tous les `fetch` des edge functions
2. Format date `YYYY-MM-DDTHH:mm:ss[Europe/Paris]` construit manuellement
3. `heldBy.genre` toujours envoyé (M/Mme)
4. `address` dans `/ask` envoyé en **objet** parsé, pas en string
5. `consentId` extrait via `Object.values(consentIds)[0]` (dictionnaire)
6. `period` parsé via regex ISO 8601 → minutes
7. `SOME_REQUESTS_FAILED` accepté si LOADCURVE est SUCCESS
8. Conversion watts → Wh : `powerW * (periodMin / 60)`

## RGPD
- Courbe **jamais** persistée en base. Uniquement en réponse de l'edge function `poll-order` puis en mémoire React (Zustand).
- Table `switchgrid_sessions` ne stocke que IDs Switchgrid + métadonnées signer.
- Aucun localStorage pour la courbe.

## Hors scope (explicitement exclus)
- Auth utilisateur, analytics, tracking, export PDF
- Pas de modification du simulateur principal ni des autres pages du site
