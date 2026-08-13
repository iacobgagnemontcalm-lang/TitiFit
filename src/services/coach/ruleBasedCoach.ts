import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import { TESTS, OFFICIAL_TEST_IDS } from '@/data/tests';
import { TIER_BY_ID } from '@/data/tiers';
import { calculateFastestPath } from '@/services/fastestPath';
import { strongestCategory, weakestCategory, nextTierThreshold } from '@/services/ratingEngine';
import { streakMessage } from '@/services/streakEngine';
import { formatMetric } from '@/utils/format';
import { ATHLETE_TYPE_BY_ID } from '@/data/athleteTypes';

import type { CoachAnswer, CoachContext, CoachProvider, CoachQuestion } from './types';

/**
 * A coach that can show its work.
 *
 * Every sentence it produces is derived from the same engines the screens use,
 * so it can never quote a number the app does not actually hold. That is the
 * whole point: an assistant that invents a plausible 5 km time would be worse
 * than no assistant.
 */

const QUESTIONS: CoachQuestion[] = [
  {
    id: 'improve_overall',
    label: 'Comment améliorer mon Overall?',
    keywords: ['overall', 'améliorer', 'progresser', 'monter', 'augmenter', 'ovr'],
  },
  { id: 'weakness', label: 'Quel est mon point faible?', keywords: ['faible', 'faiblesse', 'pire', 'point faible'] },
  { id: 'strength', label: 'Quel est mon point fort?', keywords: ['fort', 'force', 'meilleur', 'point fort'] },
  { id: 'week_plan', label: 'Que faire cette semaine?', keywords: ['semaine', 'plan', 'programme', 'entraîner', 'faire'] },
  { id: 'next_tier', label: 'Comment monter de rareté?', keywords: ['rareté', 'carte', 'diamond', 'elite', 'palier', 'tier'] },
  { id: 'missing_tests', label: 'Quels tests me manquent?', keywords: ['manque', 'tests', 'compléter', 'incomplet'] },
  { id: 'archetype', label: 'Pourquoi cet archétype?', keywords: ['archétype', 'type', 'athlète', 'engine', 'powerhouse'] },
];

const pct = (n: number | null | undefined) => (n == null ? '—' : `P${Math.round(n)}`);

export class RuleBasedCoach implements CoachProvider {
  readonly id = 'rule-based-v1';
  readonly label = 'Coach TitiFit — analyse déterministe';

  suggestions(): CoachQuestion[] {
    return QUESTIONS;
  }

  async ask(question: string, context: CoachContext): Promise<CoachAnswer> {
    const normalized = question
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

    const matched = QUESTIONS.find((q) =>
      q.keywords.some((k) =>
        normalized.includes(k.normalize('NFD').replace(/[̀-ͯ]/g, '')),
      ),
    );

    switch (matched?.id) {
      case 'weakness':
        return this.weakness(context);
      case 'strength':
        return this.strength(context);
      case 'week_plan':
        return this.weekPlan(context);
      case 'next_tier':
        return this.nextTier(context);
      case 'missing_tests':
        return this.missingTests(context);
      case 'archetype':
        return this.archetype(context);
      case 'improve_overall':
      default:
        return this.improveOverall(context, matched == null);
    }
  }

  // -------------------------------------------------------------------------

  private improveOverall(context: CoachContext, fallback = false): CoachAnswer {
    const { user, state } = context;
    const plan = calculateFastestPath(state.officialBests, state.subject, { units: user.units });
    const top = plan.steps.slice(0, 3);
    const weakest = weakestCategory(state.overall.categories);

    const paragraphs: string[] = [];
    if (fallback) {
      paragraphs.push(
        'Je n’ai pas reconnu ta question avec certitude — voici l’analyse la plus utile par défaut.',
      );
    }

    if (top.length === 0) {
      return {
        headline: 'Complète d’abord quelques tests officiels.',
        paragraphs: [
          'Sans résultat, je n’ai rien à analyser. Commence par un test dans deux catégories différentes : ça suffit pour révéler la forme de ton profil.',
        ],
        actions: OFFICIAL_TEST_IDS.slice(0, 3).map((id) => `Compléter : ${TESTS[id].name}`),
        citations: [],
        source: this.label,
      };
    }

    const best = top[0]!;
    const bestTest = TESTS[best.testId];

    paragraphs.push(
      `Ton point faible relatif est actuellement ${weakest ? CATEGORIES[weakest].name.toLowerCase() : 'difficile à isoler'}. ` +
        'C’est mécanique : chaque catégorie vaut 20 % de ton Overall, donc un point gagné là où tu es le plus bas coûte moins d’effort qu’un point gagné là où tu es déjà haut.',
    );

    paragraphs.push(
      `Concrètement, passer ton ${bestTest.name.toLowerCase()} de ${best.label} ferait passer son rating d’environ ${Math.round(best.currentRating)} à ${Math.round(best.targetRating)} ` +
        `et ajouterait à peu près ${best.overallGain.toFixed(1)} point${best.overallGain >= 2 ? 's' : ''} à ton Overall.`,
    );

    if (top.length > 1) {
      paragraphs.push(
        'Les autres pistes rapportent moins par unité d’effort : ' +
          top
            .slice(1)
            .map((s) => `${TESTS[s.testId].name} (${s.label}, +${s.overallGain.toFixed(1)})`)
            .join(', ') +
          '.',
      );
    }

    return {
      headline: `Priorité : ${bestTest.name}.`,
      paragraphs,
      actions: [
        `Viser ${best.label.split('→')[1]?.trim() ?? 'le prochain palier'} au ${bestTest.name}`,
        weakest ? `Deux séances par semaine orientées ${CATEGORIES[weakest].name.toLowerCase()}` : 'Deux séances ciblées par semaine',
        'Re-tester dans 4 à 6 semaines, dans les mêmes conditions',
      ],
      citations: [
        { label: 'Overall actuel', value: `${state.overall.value ?? '—'}` },
        ...(weakest
          ? [
              {
                label: CATEGORIES[weakest].name,
                value: `${Math.round(state.overall.categories[weakest].rating ?? 0)}`,
              },
            ]
          : []),
        { label: bestTest.name, value: best.label },
      ],
      source: this.label,
    };
  }

  private weakness(context: CoachContext): CoachAnswer {
    const { state } = context;
    const weakest = weakestCategory(state.overall.categories);
    if (!weakest) {
      return this.needMoreData();
    }
    const rating = state.overall.categories[weakest];
    const tests = rating.tests.filter((t) => t.rating != null);
    const worstTest = [...tests].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))[0];

    return {
      headline: `Ton point faible est ${CATEGORIES[weakest].name}.`,
      paragraphs: [
        `Tu es à ${Math.round(rating.rating ?? 0)} (${pct(rating.percentile)}) dans cette catégorie, contre ${Math.round(state.overall.value ?? 0)} de moyenne générale.`,
        worstTest
          ? `Dans le détail, c’est le ${TESTS[worstTest.testId].name} qui tire le plus vers le bas, à ${Math.round(worstTest.rating ?? 0)}.`
          : 'Aucun test de cette catégorie n’est encore complété — c’est là que la marge est la plus grande.',
        'Une catégorie faible n’est pas un défaut : c’est l’endroit où le rendement de ton entraînement est le plus élevé.',
      ],
      actions: [
        `Programmer ${CATEGORIES[weakest].name.toLowerCase()} deux fois par semaine`,
        worstTest ? `Re-tester le ${TESTS[worstTest.testId].name} dans 6 semaines` : 'Compléter les tests manquants de cette catégorie',
      ],
      citations: [
        { label: CATEGORIES[weakest].name, value: `${Math.round(rating.rating ?? 0)}` },
        { label: 'Overall', value: `${state.overall.value ?? '—'}` },
      ],
      source: this.label,
    };
  }

  private strength(context: CoachContext): CoachAnswer {
    const { state } = context;
    const strongest = strongestCategory(state.overall.categories);
    if (!strongest) return this.needMoreData();
    const rating = state.overall.categories[strongest];

    return {
      headline: `Ta signature, c’est ${CATEGORIES[strongest].name}.`,
      paragraphs: [
        `${Math.round(rating.rating ?? 0)} de rating, soit ${pct(rating.percentile)} de ton groupe de comparaison.`,
        'Attention au piège : continuer à pousser ta meilleure catégorie rapporte de moins en moins. Plus le rating est haut, plus chaque point supplémentaire demande d’effort — la courbe des percentiles se resserre vers le haut.',
        'Garde-la à niveau avec une séance de maintien par semaine, et investis le reste ailleurs.',
      ],
      actions: [
        `Une séance de maintien ${CATEGORIES[strongest].name.toLowerCase()} par semaine`,
        'Réallouer le volume restant vers ta catégorie la plus basse',
      ],
      citations: [{ label: CATEGORIES[strongest].name, value: `${Math.round(rating.rating ?? 0)}` }],
      source: this.label,
    };
  }

  private weekPlan(context: CoachContext): CoachAnswer {
    const { user, state } = context;
    const weakest = weakestCategory(state.overall.categories);
    const plan = calculateFastestPath(state.officialBests, state.subject, { units: user.units });
    const focus = plan.steps[0];

    return {
      headline: state.streak.weekSecured
        ? 'Ta semaine est déjà sécurisée — voici comment l’utiliser.'
        : `Il te manque ${state.streak.activitiesNeeded} entraînement${state.streak.activitiesNeeded > 1 ? 's' : ''} cette semaine.`,
      paragraphs: [
        streakMessage(state.streak),
        weakest
          ? `Deux séances orientées ${CATEGORIES[weakest].name.toLowerCase()} : c’est ta catégorie la plus basse (${Math.round(state.overall.categories[weakest].rating ?? 0)}), donc celle où le rendement est le meilleur.`
          : 'Répartis tes séances sur au moins deux catégories différentes.',
        focus
          ? `Garde un œil sur le ${TESTS[focus.testId].name} : c’est l’amélioration qui rapporterait le plus (${focus.label}, +${focus.overallGain.toFixed(1)} d’Overall).`
          : 'Complète un test officiel supplémentaire pour affiner ton profil.',
      ],
      actions: [
        weakest ? `2 × ${CATEGORIES[weakest].name}` : '2 séances ciblées',
        '1 séance de maintien sur ton point fort',
        state.streak.weekSecured ? 'Série déjà assurée' : 'Enregistrer un résultat avant dimanche',
      ],
      citations: [
        { label: 'Série', value: `${state.streak.current} sem` },
        { label: 'Cette semaine', value: `${state.streak.activitiesThisWeek} activité(s)` },
      ],
      source: this.label,
    };
  }

  private nextTier(context: CoachContext): CoachAnswer {
    const { state } = context;
    const overall = state.overall.value;
    if (overall == null) return this.needMoreData();

    const next = nextTierThreshold(overall);
    if (!next) {
      return {
        headline: 'Tu es au palier maximal.',
        paragraphs: ['Legendary est le dernier échelon. À ce niveau, chaque point d’Overall se gagne au prix fort.'],
        actions: ['Maintenir', 'Viser 99'],
        citations: [{ label: 'Overall', value: `${overall}` }],
        source: this.label,
      };
    }

    const missing = next.at - overall;
    return {
      headline: `${missing} point${missing > 1 ? 's' : ''} d’Overall avant ${TIER_BY_ID[next.tier].name}.`,
      paragraphs: [
        `Tu es ${TIER_BY_ID[state.overall.tier].name} à ${overall}. Le palier ${TIER_BY_ID[next.tier].name} commence à ${next.at}.`,
        `Comme chaque catégorie pèse 20 %, il faut environ ${(missing * 5).toFixed(0)} points de rating répartis sur une seule catégorie, ou ${missing.toFixed(0)} point${missing > 1 ? 's' : ''} sur chacune des cinq.`,
        'La deuxième option est presque toujours la plus rapide : progresser un peu partout coûte moins qu’un grand bond sur un seul test.',
      ],
      actions: [
        'Ouvrir Fastest Path pour le chemin le plus court',
        'Compléter les tests officiels manquants',
      ],
      citations: [
        { label: 'Overall', value: `${overall}` },
        { label: 'Prochain palier', value: `${TIER_BY_ID[next.tier].name} à ${next.at}` },
      ],
      source: this.label,
    };
  }

  private missingTests(context: CoachContext): CoachAnswer {
    const { state } = context;
    const missing = OFFICIAL_TEST_IDS.filter((id) => state.officialBests[id] == null);

    if (missing.length === 0) {
      return {
        headline: 'Ton profil est complet : les huit tests officiels sont faits.',
        paragraphs: [
          'Ton Overall n’est plus provisoire, il est calculé sur les cinq catégories à poids plein.',
          'La suite consiste à re-tester régulièrement — un record vieux de six mois ne dit plus grand-chose de ton niveau actuel.',
        ],
        actions: ['Re-tester le test le plus ancien', 'Viser le prochain palier de rareté'],
        citations: [{ label: 'Tests complétés', value: `${state.completedTests}/${state.totalTests}` }],
        source: this.label,
      };
    }

    return {
      headline: `${missing.length} test${missing.length > 1 ? 's' : ''} officiel${missing.length > 1 ? 's' : ''} te manque${missing.length > 1 ? 'nt' : ''}.`,
      paragraphs: [
        'Tant qu’une catégorie est vide, son poids de 20 % est redistribué sur les autres et ton Overall est marqué comme provisoire.',
        `Il te manque : ${missing.map((id) => TESTS[id].name).join(', ')}.`,
        'Compléter les huit rapporte aussi 500 XP et l’achievement « Profil complet ».',
      ],
      actions: missing.slice(0, 3).map((id) => `Compléter : ${TESTS[id].name}`),
      citations: [{ label: 'Tests complétés', value: `${state.completedTests}/${state.totalTests}` }],
      source: this.label,
    };
  }

  private archetype(context: CoachContext): CoachAnswer {
    const { state } = context;
    const type = ATHLETE_TYPE_BY_ID[state.overall.athleteType];
    const ranked = CATEGORY_ORDER.filter((id) => state.overall.categories[id].rating != null).sort(
      (a, b) => (state.overall.categories[b].rating ?? 0) - (state.overall.categories[a].rating ?? 0),
    );
    const top = ranked[0];
    const bottom = ranked[ranked.length - 1];

    return {
      headline: `Tu es ${type.name}.`,
      paragraphs: [
        type.description,
        top && bottom
          ? `L’archétype se décide sur la *forme* de ton profil, pas sur ton niveau absolu : ta catégorie la plus haute est ${CATEGORIES[top].name} (${Math.round(state.overall.categories[top].rating ?? 0)}) et la plus basse ${CATEGORIES[bottom].name} (${Math.round(state.overall.categories[bottom].rating ?? 0)}).`
          : 'Complète plus de tests pour que la forme de ton profil se dessine.',
        'Il évolue tout seul : change l’équilibre entre tes catégories et l’archétype suivra.',
      ],
      actions: ['Voir le détail des catégories', 'Ouvrir Fastest Path'],
      citations: ranked.slice(0, 3).map((id) => ({
        label: CATEGORIES[id].name,
        value: `${Math.round(state.overall.categories[id].rating ?? 0)}`,
      })),
      source: this.label,
    };
  }

  private needMoreData(): CoachAnswer {
    return {
      headline: 'Il me faut plus de données.',
      paragraphs: [
        'Complète au moins un test officiel dans deux catégories différentes : c’est le minimum pour que je puisse comparer quoi que ce soit.',
      ],
      actions: ['Ajouter un résultat'],
      citations: [],
      source: this.label,
    };
  }
}
