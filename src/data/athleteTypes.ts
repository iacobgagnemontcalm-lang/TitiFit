import type { AthleteTypeDefinition, AthleteTypeId } from '@/types';

/**
 * Archetypes are matched on the *shape* of a profile (each category's deviation
 * from the athlete's own mean), not on absolute ratings — so a 62 OVR athlete
 * can be a Powerhouse just as much as an 88 OVR one. `minOverall` is only used
 * by the two "elite" archetypes, which are meant to be earned.
 */
export const ATHLETE_TYPES: AthleteTypeDefinition[] = [
  {
    id: 'powerhouse',
    name: 'The Powerhouse',
    description:
      'Ta force maximale écrase le reste de ton profil. Tu déplaces des charges que peu de gens touchent.',
    emphasis: { strength: 1, bodyweight: 0.2, hybrid: 0, speed: -0.4, endurance: -0.6 },
    minSpread: 6,
    icon: 'barbell',
  },
  {
    id: 'engine',
    name: 'The Engine',
    description:
      'Ton moteur aérobie est ta signature. Tu tiens un rythme là où les autres décrochent.',
    emphasis: { endurance: 1, hybrid: 0.4, speed: 0.1, strength: -0.6, bodyweight: -0.2 },
    minSpread: 6,
    icon: 'pulse',
  },
  {
    id: 'speedster',
    name: 'The Speedster',
    description:
      'Explosif et rapide. Sur 400 m, tu es dans une autre catégorie que ton entourage.',
    emphasis: { speed: 1, endurance: 0.2, bodyweight: 0.1, strength: -0.2, hybrid: -0.2 },
    minSpread: 6,
    icon: 'flash',
  },
  {
    id: 'gymnast',
    name: 'The Gymnast',
    description:
      'Force relative exceptionnelle. Ton corps est ton meilleur outil de travail.',
    emphasis: { bodyweight: 1, hybrid: 0.3, strength: 0, speed: 0, endurance: -0.3 },
    minSpread: 6,
    icon: 'body',
  },
  {
    id: 'workhorse',
    name: 'The Workhorse',
    description:
      'Tu performes quand ça fait mal. Sous fatigue, ton rendement baisse moins vite que celui des autres.',
    emphasis: { hybrid: 1, endurance: 0.4, bodyweight: 0.3, strength: 0, speed: -0.2 },
    minSpread: 5,
    icon: 'flame',
  },
  {
    id: 'power_hybrid',
    name: 'The Power Hybrid',
    description:
      'Puissant, polyvalent et capable de maintenir de bonnes performances sous fatigue.',
    emphasis: { strength: 0.9, hybrid: 0.9, bodyweight: 0.3, speed: 0, endurance: -0.3 },
    minSpread: 4,
    icon: 'flash',
  },
  {
    id: 'all_rounder',
    name: 'The All-Rounder',
    description:
      'Aucun trou dans ton profil. Cinq catégories, cinq niveaux comparables — rare et difficile à bâtir.',
    emphasis: {},
    maxSpread: 5,
    icon: 'apps',
  },
  {
    id: 'hybrid_elite',
    name: 'The Hybrid Elite',
    description:
      'Un profil complet à haut niveau : fort, rapide, endurant et redoutable sous fatigue.',
    emphasis: { hybrid: 0.6, strength: 0.4, endurance: 0.4, speed: 0.3, bodyweight: 0.3 },
    maxSpread: 8,
    minOverall: 85,
    icon: 'trophy',
  },
];

export const ATHLETE_TYPE_BY_ID: Record<AthleteTypeId, AthleteTypeDefinition> = {
  ...ATHLETE_TYPES.reduce(
    (acc, t) => ({ ...acc, [t.id]: t }),
    {} as Record<AthleteTypeId, AthleteTypeDefinition>,
  ),
  unranked: {
    id: 'unranked',
    name: 'Unranked',
    description:
      'Complète au moins un test officiel pour révéler ton archétype d’athlète.',
    emphasis: {},
    icon: 'help-circle',
  },
};
