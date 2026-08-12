/**
 * THE TITIFIT GAUNTLET — official Hybrid protocol v1.
 *
 * Design constraints that shaped it:
 *  - reproducible anywhere (one pull-up bar + 800 m of measurable ground);
 *  - loads all four hybrid qualities: cardio, muscular endurance, strength
 *    endurance and functional movement, *in that order of fatigue*;
 *  - a single scalar score (total elapsed time) so it ranks cleanly;
 *  - the closing 800 m is what makes it a fatigue test rather than a circuit.
 *
 * Scoring: total elapsed seconds, continuous clock, no rest allowed between
 * stations (resting is permitted but the clock never stops). Lower is better.
 */

export interface GauntletStation {
  order: number;
  name: string;
  detail: string;
  standard: string;
}

export const GAUNTLET_VERSION = 'v1.0';

export const GAUNTLET_STATIONS: GauntletStation[] = [
  {
    order: 1,
    name: '800 m course',
    detail: 'Départ à froid, effort maximal contrôlé',
    standard: 'Distance mesurée (piste, GPS ou tapis à 1 % d’inclinaison).',
  },
  {
    order: 2,
    name: '40 burpees',
    detail: 'Enchaînés immédiatement après la course',
    standard: 'Poitrine au sol en bas, saut avec extension complète des hanches en haut.',
  },
  {
    order: 3,
    name: '50 air squats',
    detail: 'Sans charge',
    standard: 'Pli de hanche sous le genou, extension complète des hanches en haut.',
  },
  {
    order: 4,
    name: '30 push-ups',
    detail: 'Sous fatigue',
    standard: 'Corps gainé en ligne, poitrine à hauteur de poing, coudes verrouillés en haut.',
  },
  {
    order: 5,
    name: '20 pull-ups',
    detail: 'Kipping autorisé ici (contrairement au test Bodyweight)',
    standard: 'Bras tendus en bas, menton au-dessus de la barre.',
  },
  {
    order: 6,
    name: '800 m course',
    detail: 'La partie qui fait le test',
    standard: 'Même parcours que la station 1.',
  },
];

export const GAUNTLET_RULES: string[] = [
  'Chronomètre continu du départ de la première course jusqu’à la fin de la seconde.',
  'Aucune pause imposée : tu peux te reposer, mais le temps continue de courir.',
  'Les stations doivent être complétées dans l’ordre, sans répétition partielle.',
  'Toute répétition non conforme au standard doit être refaite.',
  'Refais le test dans les mêmes conditions (même parcours, même surface) pour que ta progression soit comparable.',
];

/** Reference band used for on-screen coaching copy, in seconds. */
export const GAUNTLET_TIME_BANDS = [
  { label: 'Elite', maxSeconds: 900 },
  { label: 'Avancé', maxSeconds: 1140 },
  { label: 'Intermédiaire', maxSeconds: 1500 },
  { label: 'Débutant', maxSeconds: Number.POSITIVE_INFINITY },
] as const;

export function gauntletBand(seconds: number): string {
  return GAUNTLET_TIME_BANDS.find((b) => seconds <= b.maxSeconds)?.label ?? 'Débutant';
}
