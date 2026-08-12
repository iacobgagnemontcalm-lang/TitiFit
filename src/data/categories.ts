import type { CategoryDefinition, CategoryId } from '@/types';

/**
 * The five pillars of the Overall Rating. Weights are fixed at 20% each and
 * must always sum to 1.
 */
export const CATEGORIES: Record<CategoryId, CategoryDefinition> = {
  strength: {
    id: 'strength',
    name: 'Force',
    weight: 0.2,
    tagline: 'Ce que tu peux déplacer',
    description:
      'Force maximale sur les trois barres de référence. Chaque lift est comparé en valeur absolue et en ratio poids soulevé / poids de corps.',
    officialTests: ['deadlift', 'back_squat', 'bench_press'],
    icon: 'barbell',
  },
  bodyweight: {
    id: 'bodyweight',
    name: 'Bodyweight',
    weight: 0.2,
    tagline: 'Maîtrise de ton propre corps',
    description:
      'Force relative et endurance musculaire au poids de corps. Répétitions strictes seulement — les standards sont volontairement sévères.',
    officialTests: ['pull_ups', 'push_ups_60s'],
    icon: 'body',
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid',
    weight: 0.2,
    tagline: 'Performance sous fatigue',
    description:
      'Le TitiFit Gauntlet : un test standardisé qui combine cardio, endurance musculaire et mouvements fonctionnels en continu.',
    officialTests: ['hybrid_gauntlet'],
    icon: 'flame',
  },
  speed: {
    id: 'speed',
    name: 'Speed',
    weight: 0.2,
    tagline: 'Vitesse soutenue',
    description:
      'Le 400 m est le seul test officiel de vitesse. Les sprints courts et intervalles sont suivis comme statistiques secondaires.',
    officialTests: ['run_400m'],
    icon: 'flash',
  },
  endurance: {
    id: 'endurance',
    name: 'Endurance',
    weight: 0.2,
    tagline: 'Ton moteur aérobie',
    description:
      'Le 5 km est le test officiel d’endurance. Meilleur temps récent, allure moyenne et record personnel.',
    officialTests: ['run_5k'],
    icon: 'pulse',
  },
};

export const CATEGORY_ORDER: CategoryId[] = [
  'strength',
  'bodyweight',
  'hybrid',
  'speed',
  'endurance',
];

export const CATEGORY_LIST: CategoryDefinition[] = CATEGORY_ORDER.map(
  (id) => CATEGORIES[id],
);
