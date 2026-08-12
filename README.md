# TitiFit

**Découvre quel athlète tu es.**

Application mobile de profil athlétique gamifiée : l'utilisateur entre ses
performances, l'app produit un **Overall Rating /100**, des percentiles, un
archétype d'athlète, des niveaux, de l'XP, des achievements et une carte
d'athlète partageable.

> État actuel : **Phase 1 terminée + écran Home fonctionnel.**

---

## Stack

React Native · Expo SDK 57 · TypeScript · Expo Router · Zustand ·
Reanimated 4 · react-native-svg · expo-linear-gradient

## Démarrer

```bash
npm install
npm start          # puis i / a / w
npm run typecheck  # tsc --noEmit
```

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
- [ ] **Phase 2** — Athlete Card, Catégories, Détail de test, Add Result, Progression, Leaderboard
- [ ] **Phase 3** — flow ADD RESULT branché de bout en bout avec résumé animé
- [ ] **Phase 4** — Fastest Path (écran complet), Athlete VS, Challenges, Settings
- [ ] **Phase 5** — Combine, Athlete Wrapped, Coach IA, intégrations Apple Health / Garmin / Strava

Le pipeline ADD RESULT (Phase 3) est **déjà implémenté et testé** dans
`addResultFlow.ts` — il ne manque que l'écran de saisie.

## Backend futur

Le prototype ne dépend d'aucun backend. Trois coutures sont prévues :
`BenchmarkProvider` (statistiques), le store Zustand (persistance) et
`TestResult.calories` (données importées d'Apple Health / Garmin / Strava).
