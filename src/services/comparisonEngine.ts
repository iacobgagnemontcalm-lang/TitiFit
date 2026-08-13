import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import type {
  AthleteComparison,
  AthleteSummary,
  CategoryDuel,
  CategoryId,
  OverallRating,
  User,
} from '@/types';
import { levelFromTotalXP } from '@/services/xpEngine';

/**
 * ATHLETE VS — five duels, one per category, decided independently.
 *
 * Deliberately *not* decided on Overall: two athletes with the same 84 can
 * have opposite shapes, and the interesting question is which one wins where.
 * A category neither has tested is a tie and counts for nobody.
 */

const TIE_THRESHOLD = 0.5;

export function buildComparison(
  a: AthleteSummary,
  b: AthleteSummary,
): AthleteComparison {
  const duels: CategoryDuel[] = CATEGORY_ORDER.map((categoryId) => {
    const ratingA = a.categories[categoryId];
    const ratingB = b.categories[categoryId];

    let winner: CategoryDuel['winner'] = 'tie';
    if (ratingA != null && ratingB == null) winner = 'a';
    else if (ratingB != null && ratingA == null) winner = 'b';
    else if (ratingA != null && ratingB != null) {
      if (Math.abs(ratingA - ratingB) < TIE_THRESHOLD) winner = 'tie';
      else winner = ratingA > ratingB ? 'a' : 'b';
    }

    return { categoryId, a: ratingA, b: ratingB, winner };
  });

  const scoreA = duels.filter((d) => d.winner === 'a').length;
  const scoreB = duels.filter((d) => d.winner === 'b').length;

  return {
    a,
    b,
    duels,
    scoreA,
    scoreB,
    winner: scoreA === scoreB ? 'tie' : scoreA > scoreB ? 'a' : 'b',
  };
}

/** Turns the signed-in athlete into the same shape as a rival. */
export function summaryFromAthlete(
  user: User,
  overall: OverallRating,
  totalXP: number,
): AthleteSummary {
  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUri: user.avatarUri,
    overall: overall.value ?? 0,
    tier: overall.tier,
    athleteType: overall.athleteType,
    level: levelFromTotalXP(totalXP).level,
    categories: CATEGORY_ORDER.reduce(
      (acc, id) => ({ ...acc, [id]: overall.categories[id].rating }),
      {} as Record<CategoryId, number | null>,
    ),
  };
}

/** The single sentence that explains the result. */
export function comparisonSummary(comparison: AthleteComparison): string {
  const { a, b, scoreA, scoreB, winner, duels } = comparison;

  if (winner === 'tie') {
    return `Égalité ${scoreA}–${scoreB}. Deux profils différents, même bilan.`;
  }

  const champion = winner === 'a' ? a : b;
  const challenger = winner === 'a' ? b : a;
  const championScore = Math.max(scoreA, scoreB);
  const challengerScore = Math.min(scoreA, scoreB);

  // The challenger's best win is the most useful thing to name.
  const challengerWins = duels.filter((d) => d.winner === (winner === 'a' ? 'b' : 'a'));
  const biggest = challengerWins.sort((x, y) => {
    const gapX = Math.abs((x.a ?? 0) - (x.b ?? 0));
    const gapY = Math.abs((y.a ?? 0) - (y.b ?? 0));
    return gapY - gapX;
  })[0];

  const tail = biggest
    ? ` ${challenger.displayName} garde l’avantage en ${CATEGORIES[biggest.categoryId].name}.`
    : '';

  return `${champion.displayName.toUpperCase()} GAGNE ${championScore}–${challengerScore}.${tail}`;
}
