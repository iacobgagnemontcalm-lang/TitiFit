# TitiFit

**Découvre quel athlète tu es.**

Application mobile de profil athlétique gamifiée : l'utilisateur entre ses
performances, l'app produit un **Overall Rating /100**, des percentiles, un
archétype d'athlète, des niveaux, de l'XP, des achievements et une carte
d'athlète partageable.

> État actuel : **Toutes les phases livrées.** Home, carte d'athlète, catégories,
> détail de test, ADD RESULT de bout en bout, historique, progression,
> classement, réglages, comptes Firebase + synchronisation.
> Projet Firebase : `titifit-ff0a6`.

---

## Stack

React Native · Expo SDK 57 · TypeScript · Expo Router · Zustand ·
Firebase (Auth + Firestore) · Reanimated 4 · react-native-svg ·
expo-linear-gradient

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir les clés Firebase (optionnel)
npm start                    # puis i / a / w
npm run typecheck            # tsc --noEmit
```

**Sans clés Firebase, l'app démarre quand même** : elle bascule sur le backend
local (AsyncStorage) et les comptes sont désactivés. Rien n'est bloqué, sauf la
synchronisation.

---

## Comptes & synchronisation

Le suivi est continu : le profil, les résultats, l'XP et les achievements
vivent dans un compte, pas dans une session.

### Connecter un projet Firebase

TitiFit utilise le **SDK JavaScript** de Firebase, pas `react-native-firebase`.
Conséquence importante : il faut créer une application **Web** (`</>`) dans la
console, et **aucun** `google-services.json` / `GoogleService-Info.plist` n'est
nécessaire, même pour iOS et Android.

**1. Récupérer la configuration**

Console Firebase → ⚙️ *Paramètres du projet* → *Tes applications*.
S'il n'y a pas encore d'app Web, clique sur l'icône `</>`, donne-lui un nom
(« TitiFit »), et ignore l'étape « Firebase Hosting ». Tu obtiens un bloc :

```js
const firebaseConfig = {
  apiKey: "AIzaSy…",
  authDomain: "mon-projet.firebaseapp.com",
  projectId: "mon-projet",
  storageBucket: "mon-projet.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123",
};
```

**2. Le recopier dans `.env.local`**

```bash
cp .env.example .env.local
```

Le fichier est déjà pré-rempli pour le projet **`titifit-ff0a6`** : `projectId`,
`authDomain` et `storageBucket` se déduisent de l'ID de projet. Il ne reste que
trois champs à coller depuis la console :

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy…
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123
```

Pas de guillemets, pas d'espaces autour du `=`. `.env.local` est ignoré par git.

`.firebaserc` est versionné avec le projet, donc `firebase deploy` fonctionne
sans `firebase use`. L'ID de projet n'est pas un secret : il est de toute façon
inclus dans le bundle.

**3. Vérifier avant de lancer quoi que ce soit**

```bash
npm run check:firebase
```

Le script lit les fichiers `.env` comme le fait Expo et rapporte exactement ce
que l'app verra, sans jamais afficher une clé en entier. Il détecte les erreurs
courantes : app Android/iOS au lieu de Web, `authDomain` et `projectId` de deux
projets différents, clé collée au mauvais endroit.

**4. Activer les services dans la console**

- *Authentication* → *Sign-in method* → activer **E-mail/Mot de passe**.
  (Le mode *Anonyme* n'est pas requis : aucun écran ne l'utilise pour l'instant.)
- *Firestore Database* → *Créer une base de données* → mode **production**,
  région la plus proche de tes utilisateurs.

**5. Déployer les règles de sécurité — avant le premier test**

En mode production, Firestore refuse tout tant que les règles ne sont pas
déployées. Sans cette étape, la première synchronisation échoue avec
`permission-denied`.

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

Le projet cible vient de `.firebaserc` (`titifit-ff0a6`), déjà versionné.

**6. Relancer Expo en vidant le cache — `--clear` est obligatoire**

```bash
npx expo start --clear
```

Les variables `EXPO_PUBLIC_*` sont **inlinées au moment de la transformation
Babel**, et Metro met ces transformations en cache. Le cache ne tient pas
compte de la valeur des variables : après avoir rempli `.env.local`, un
redémarrage normal réutilise le bundle précédent, où les clés étaient encore
vides.

Le piège est silencieux — Expo affiche bien `env: load .env.local` et
`env: export EXPO_PUBLIC_FIREBASE_...`, mais le bundle servi ne contient
toujours rien. Vérifié : sans `--clear`, zéro occurrence des clés dans le
bundle ; avec `--clear`, elles y sont.

Même règle pour les exports : `npx expo export --clear`.

**Vérifier que ça marche :** ouvre *Réglages* dans l'app. Le bloc « Compte &
synchronisation » doit proposer *Créer un compte / se connecter* au lieu de
*Comptes indisponibles*, et afficher **`Projet Firebase : titifit-ff0a6`**.
Cette ligne lit la variable telle qu'elle est réellement présente dans le
bundle en cours d'exécution : c'est la preuve que le cache a bien été vidé.
Après un `sign-up`, un document apparaît dans `users/{uid}` côté console.

### Dépannage

| Symptôme | Cause la plus probable |
|---|---|
| « Comptes indisponibles » persiste malgré des clés correctes | **Cache Metro.** Relancer avec `npx expo start --clear`. `npm run check:firebase` peut afficher « complète et cohérente » alors que le bundle, lui, est périmé |
| « Comptes indisponibles » et variables listées comme manquantes | Fichier nommé `.env` au lieu de `.env.local`, ou valeurs entre guillemets |
| `auth/operation-not-allowed` | E-mail/Mot de passe pas activé dans *Authentication* |
| `permission-denied` à la synchro | Règles non déployées (étape 5) |
| `auth/unauthorized-domain` sur web | Ajouter le domaine dans *Authentication → Settings → Authorized domains* (`localhost` y est par défaut) |
| `auth/network-request-failed` | Pas de réseau, ou `authDomain` incorrect |

### Émulateurs (optionnel)

`firebase.json` configure les émulateurs Auth et Firestore. `firebase emulators:start`
les lance ; il faudra brancher `connectAuthEmulator` / `connectFirestoreEmulator`
dans `src/services/backend/firebase/app.ts` pour les utiliser.

### Modèle Firestore

```
users/{uid}                      profil + réglages + updatedAt
users/{uid}/results/{resultId}   un document par résultat
users/{uid}/xp/{txId}            un document par transaction d'XP
users/{uid}/achievements/{id}    un document par achievement débloqué
publicCards/{uid}                projection publique (classements, Athlete VS)
```

Des sous-collections plutôt qu'un gros document : les écritures restent
incrémentales et l'historique ne bute jamais sur la limite de 1 Mo par
document.

### Stratégie de synchronisation

- **Offline-first.** AsyncStorage est toujours la copie de travail ; le réseau
  n'est qu'une réconciliation d'arrière-plan. Perdre le signal ne bloque
  jamais l'interface.
- **Fusion, pas écrasement.** Résultats, XP et achievements sont unionés par
  id : enregistrer hors ligne sur un téléphone puis ouvrir l'app sur une
  tablette conserve les deux ensembles. Le profil et les réglages sont
  résolus par `updatedAt` — la dernière modification gagne.
- **Les données démo ne montent jamais.** Un profil `isDemo` est jeté dès
  qu'un vrai compte se connecte.
- **Écriture débouncée** (2,5 s) après chaque mutation, plus un bouton
  « Synchroniser maintenant » dans les réglages.
- **Profil public opt-out.** `settings.publicProfile` à false ⇒ la carte
  publique n'est jamais écrite.

La logique de fusion est isolée dans `src/services/syncMerge.ts` (pure, sans
import de store ni de réseau).

### Images

Les photos de profil et de résultat sont téléversées vers Firebase Storage à
la première synchronisation, puis le chemin local (`file://…`) est remplacé par
l'URL de téléchargement — sans quoi une photo prise sur un téléphone pointerait
vers un fichier inexistant sur tout autre appareil.

L'échec d'un téléversement est volontairement non bloquant : une photo qui ne
monte pas ne doit jamais empêcher les *données* de l'athlète de se synchroniser.
Les règles sont dans `storage.rules` (8 Mo max, images seulement, écriture
limitée à son propre préfixe).

```bash
firebase deploy --only storage
```

### Changer de backend

Tout passe par `BackendAdapter` (`src/services/backend/types.ts`). Passer à
Supabase = écrire une classe et ajouter une branche dans
`src/services/backend/index.ts`. Aucun écran ne connaît Firebase.

---

## Héberger la version web

Expo exporte une SPA statique dans `dist/`. Deux cibles sont configurées ;
les deux ont été testées.

| | Firebase Hosting | GitHub Pages |
|---|---|---|
| URL | `titifit-ff0a6.web.app` | `iacobgagnemontcalm-lang.github.io/TitiFit/` |
| Déploiement | `npm run deploy:web` | automatique à chaque push sur `main` |
| Outils requis | Firebase CLI + login | aucun |
| Connexion Firebase | **marche d'emblée** | domaine à autoriser à la main |
| Routes profondes | vraies réécritures | contournement via `404.html` |

**Recommandation : commence par Firebase.** Pas pour la simplicité du
déploiement — les deux sont simples — mais parce que `*.web.app` est déjà dans
les domaines autorisés de Firebase Authentication. Sur GitHub Pages, oublier
cette étape fait échouer la connexion en `auth/unauthorized-domain`, et l'erreur
n'a rien d'évident.

---

### Option A — Firebase Hosting

**Une seule fois :**

1. Activer Hosting dans la console :
   [console.firebase.google.com/u/0/project/titifit-ff0a6/hosting](https://console.firebase.google.com/u/0/project/titifit-ff0a6/hosting)
   → *Commencer*, puis passer toutes les étapes CLI (déjà faites dans le dépôt).
2. Installer et se connecter :
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

**À chaque fois :**

```bash
npm run deploy:web
```

C'est-à-dire : `expo export --clear --platform web` puis
`firebase deploy --only hosting`. La CLI affiche l'URL à la fin.

Le projet cible vient de `.firebaserc`, déjà versionné — pas de `firebase use`.

### Option B — GitHub Pages

**Une seule fois :**

1. *Settings → Pages* → **Source : GitHub Actions**
2. *Settings → Secrets and variables → Actions* → ajouter les six secrets :
   `EXPO_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`,
   `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID`
   (mêmes valeurs que `.env.local` ; sans eux le site se déploie quand même,
   mais en mode local sans comptes)
3. *Firebase Authentication → Settings → Authorized domains* → ajouter
   `iacobgagnemontcalm-lang.github.io`

**Ensuite :** chaque push sur `main` déploie tout seul
(`.github/workflows/deploy-pages.yml`), ou *Actions → Deploy web to GitHub
Pages → Run workflow*.

Trois particularités de Pages sont gérées dans le workflow :

- **Sous-chemin.** Le site vit sous `/TitiFit/`, pas à la racine, donc le build
  passe `EXPO_BASE_URL=/TitiFit` (voir `app.config.ts`) pour préfixer chaque
  asset. Sans ça, la page charge mais le bundle renvoie 404.
- **Pas de réécriture.** `index.html` est copié en `404.html` : Pages sert ce
  fichier pour toute route inconnue, l'app démarre et le routeur reprend la
  main.
- **Jekyll.** Pages ignore les dossiers commençant par `_` — donc `_expo/`,
  c'est-à-dire le bundle entier, disparaîtrait silencieusement. Un fichier
  `.nojekyll` le désactive.

### Prévisualiser avant de déployer

```bash
npm run build:web
npm run preview:web     # http://localhost:3000
```

### Ce que la version web ne fait pas

C'est une app mobile servie dans un navigateur, cadrée à une largeur de
téléphone (`WebFrame`) plutôt qu'étirée sur tout l'écran.

| Fonction | Sur le web |
|---|---|
| Retour haptique | silencieusement ignoré |
| Choisir une photo | ouvre le sélecteur de fichiers du navigateur |
| Partager | dépend de `navigator.share` — absent sur la plupart des navigateurs desktop |
| Données locales | par navigateur : Chrome et Safari = deux appareils distincts tant qu'on n'est pas connecté |

⚠️ Les clés `EXPO_PUBLIC_FIREBASE_*` sont inlinées dans le bundle publié. C'est
attendu : une clé API Firebase Web est un identifiant public, la sécurité repose
sur les règles Firestore et Storage, pas sur le secret de la clé.

---

## Architecture

```
app/                     Routes Expo Router (fichier = écran)
  _layout.tsx            Stack racine + providers
  (tabs)/_layout.tsx     Navigation basse + bouton + central
  (tabs)/index.tsx       → HomeScreen

src/
  theme/                 Couleurs, gradients, typo, spacing, glow
  types/                 Tous les types du domaine
  data/                  Données statiques (tests, catégories, achievements…)
    benchmarks/          ⚠️ Tables de percentiles SIMULÉES
    mock/                Athlète démo + rivaux
  benchmarkEngine/       Percentiles & inversion — couche remplaçable
  services/              Moteurs purs (rating, XP, streak, beer, path…)
  store/                 Zustand + persistance AsyncStorage
  services/backend/      BackendAdapter: local (hors ligne) + Firebase
  hooks/                 useAthlete (état dérivé mémoïsé)
  components/ui/         Primitives (Text, Card, RatingCircle, Badges…)
  components/cards/      Cartes composites (OverallHero, XPCard…)
  components/navigation/ TabBar custom
  features/              Écrans, un dossier par domaine
  utils/                 Unités, dates, maths, formatage
```

**Règle structurante :** rien de dérivé n'est stocké. Le store ne garde que ce
que l'athlète a *saisi* (profil, résultats, XP, achievements débloqués,
réglages). Ratings, catégories, Overall, niveau, série, Beer Earned, journey et
projection sont recalculés à chaque rendu par `useAthlete()` →
`computeAthleteState()`. Impossible d'afficher un rating périmé, et la
migration vers un backend ne touche que la couche store.

---

## Le calcul de l'Overall

```
Overall = Force×0.20 + Bodyweight×0.20 + Hybrid×0.20 + Speed×0.20 + Endurance×0.20
```

| Catégorie | Tests officiels | Formule |
|---|---|---|
| **Force** | Deadlift, Back Squat, Bench Press | moyenne des 3 ratings |
| **Bodyweight** | Pull-ups stricts, Push-ups /60 s | moyenne des 2 ratings |
| **Hybrid** | TitiFit Gauntlet | rating du test |
| **Speed** | 400 m | rating du test |
| **Endurance** | 5 km | rating du test |

Une catégorie sans aucune donnée n'est **pas** comptée comme zéro : son poids
est redistribué et l'Overall est marqué `isProvisional`. L'UI l'affiche
explicitement (« Overall provisoire — 5/8 tests complétés »).

Les tests secondaires (300 m, 10 km, dips, planche…) sont enregistrés et
affichés, mais ne touchent jamais un rating officiel.

### Le test Hybrid : **TitiFit Gauntlet**

Protocole standardisé, chronomètre continu, un pull-up bar et 800 m de terrain
mesurable suffisent :

```
800 m course → 40 burpees → 50 air squats → 30 push-ups → 20 pull-ups → 800 m course
```

Score = temps total. Le deuxième 800 m est ce qui en fait un test de *fatigue*
plutôt qu'un simple circuit. Standards détaillés dans
`src/data/hybridProtocol.ts`.

---

## Benchmark Engine

```ts
import { getPercentile } from '@/benchmarkEngine';

getPercentile({ testId: 'deadlift', sex: 'male', age: 29, bodyWeightKg: 82, value: 199 });
// → { percentile: 86.9, rating: 87, comparisonGroup: 'H 25-29 ans · actifs', isSimulated: true, … }
```

Pipeline pour chaque test :

1. **normalisation** — barres = 1RM ÷ poids de corps ; le reste = valeur brute ;
2. **espace performance** — les temps sont inversés en vitesse, ce qui permet
   d'appliquer les mêmes ajustements à tous les tests ;
3. **ajustement âge** — courbe de performance par qualité (force / puissance /
   endurance / endurance musculaire) ;
4. **ajustement poids de corps** — mise à l'échelle allométrique `perf ∝ BW^b`
   (b = −1/3 pour les barres, −0.7 pour les pull-ups, etc.), bornée ;
5. **lecture du percentile** — interpolation linéaire par morceaux entre les
   ancres, extrapolation par la pente extérieure, bornage à [1, 99] ;
6. **percentile → rating** — P50≈50, P75≈75, P90≈90, P95≈95, P99≈99.

### ⚠️ Les benchmarks actuels sont SIMULÉS

Toutes les distributions de `src/data/benchmarks/` sont des ordres de grandeur
plausibles pour une population **entraînée**, écrits à la main. Elles ne
viennent d'aucun jeu de données réel. Chaque distribution porte
`source.kind: 'simulated'`, ce qui affiche un badge « Benchmarks simulés » dans
l'app.

**Pour brancher de vraies données**, aucun écran n'est à modifier :

```ts
import { setBenchmarkProvider } from '@/benchmarkEngine';

setBenchmarkProvider(new SupabaseBenchmarkProvider()); // implémente BenchmarkProvider
```

Voir `src/data/benchmarks/README.md`.

---

## Moteurs (`src/services/`)

| Fichier | Rôle |
|---|---|
| `ratingEngine.ts` | `calculateOverallRating`, `calculateCategoryRating`, `calculateAthleteType`, `calculateCardTier` |
| `repMax.ts` | 1RM estimé (moyenne Epley / Brzycki) |
| `xpEngine.ts` | `calculateXPReward`, courbe de niveaux `475·L^1.35` |
| `achievementEngine.ts` | Évaluation déclarative des conditions d'achievement |
| `streakEngine.ts` | Semaines actives, seuil configurable |
| `beerEngine.ts` | Beer Earned 🍺 (estimation kcal → bières) |
| `challengeEngine.ts` | Progression des défis |
| `fastestPath.ts` | `calculateFastestPath` — simule chaque test pour classer les gains |
| `progressionEngine.ts` | Athlete Journey, `projectRating`, stats de carrière |
| `addResultFlow.ts` | Le pipeline ADD RESULT complet, pur |
| `athleteService.ts` | `computeAthleteState` — agrège tout en une passe |

### Archétypes

Matchés sur la **forme** du profil (écart de chaque catégorie à la moyenne de
l'athlète), pas sur les valeurs absolues — un athlète à 62 OVR peut être un
Powerhouse autant qu'un athlète à 88. Des seuils de dispersion séparent les
spécialistes des profils équilibrés.

### Fastest Path

Pour chaque test officiel : « si ce chiffre bougeait de +3 rating, combien
d'Overall ça vaudrait ? » La réponse est obtenue en **rejouant réellement le
rating engine** sur une copie mutée des records, donc elle reste juste même
quand l'Overall est provisoire. Le classement se fait sur
`gain × atteignabilité`, pas sur le gain brut.

### Beer Earned 🍺

Fonction volontairement humoristique : équivalent énergétique de l'entraînement
en bières de référence (165 kcal). **Ce n'est pas une recommandation de
consommation** — le disclaimer est sur la carte, et
`settings.hideBeerEarned` la masque complètement.

---

## Roadmap

- [x] **Phase 1** — architecture, thème, types, navigation, données mock, `benchmarkEngine`, `ratingEngine`
- [x] **Phase 1b** — écran Home complet
- [x] **Phase 2a** — comptes Firebase, synchronisation cloud, Welcome / Sign in / Sign up / Onboarding
- [x] **Phase 3** — flow ADD RESULT de bout en bout avec résumé animé
- [x] **Phase 2b** — Historique global filtrable, Réglages complets
- [x] **Phase 2c** — Athlete Card partageable, Catégories, Détail de catégorie et de test, Progression (XP, achievements, journey), Leaderboard
- [x] **Phase 4** — Fastest Path (écran complet), Athlete VS, Challenges
- [x] **Phase 5** — Combine, Athlete Wrapped, Coach explicable, couche d'import santé
- [x] **Dette** — upload des images vers Firebase Storage

## Intégrations futures

Trois coutures sont déjà en place : `BenchmarkProvider` (statistiques),
`BackendAdapter` (comptes et stockage) et `TestResult.calories` (données
importées d'Apple Health / Garmin / Strava, qui remplaceront l'estimation MET
du `beerEngine`).
