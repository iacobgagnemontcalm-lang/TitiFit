# Benchmark data

> ⚠️ **Toutes les distributions de ce dossier sont SIMULÉES.**
> Ce sont des ordres de grandeur plausibles pour une population **entraînée**
> (pas la population générale), assemblés à la main pour le prototype.
> Elles ne proviennent d'aucun jeu de données réel et ne doivent pas être
> présentées comme des normes scientifiques.

Chaque distribution est marquée `source.kind === 'simulated'`, ce qui fait
apparaître un badge « données simulées » partout dans l'app.

## Comment remplacer par de vraies données

Rien dans l'UI ni dans le `ratingEngine` ne lit ce dossier directement. Tout
passe par `BenchmarkProvider` (`src/types/benchmark.ts`) :

```ts
interface BenchmarkProvider {
  readonly id: string;
  getDistribution(testId: TestId, sex: Sex): BenchmarkDistribution | undefined;
}
```

Pour brancher une vraie base :

1. écrire un provider (`SupabaseBenchmarkProvider`, `RestBenchmarkProvider`, …)
   qui implémente cette interface ;
2. appeler `setBenchmarkProvider(monProvider)` au démarrage
   (`src/benchmarkEngine/index.ts`) ;
3. mettre `source.kind` à `'measured'` — les badges « simulé » disparaissent
   automatiquement.

Aucun écran n'a besoin d'être modifié.

## Modèle statistique

Une distribution = une liste d'ancres `(percentile, valeur)` exprimées sur la
**métrique normalisée** du test :

| Test | Métrique normalisée |
|---|---|
| Deadlift / Squat / Bench | 1RM (kg) ÷ poids de corps (kg) |
| Pull-ups / Push-ups 60 s | répétitions |
| 400 m / 5 km / Gauntlet | secondes |

Les ancres sont définies pour un athlète de **référence** (âge et poids donnés
par `referenceAge` / `referenceBodyWeightKg`). L'engine applique ensuite deux
ajustements avant de chercher le percentile :

- **âge** — courbe de performance par qualité (force, vitesse, endurance) ;
- **poids de corps** — mise à l'échelle allométrique `performance ∝ BW^b`.

Ces deux ajustements sont eux aussi des heuristiques (voir
`src/data/benchmarks/adjustments.ts`) et devront être recalibrés avec de
vraies données.
