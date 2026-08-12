import type { CardTier, TierDefinition } from '@/types';

/** Rarity ladder. Ranges come straight from the product spec. */
export const TIERS: TierDefinition[] = [
  { id: 'bronze', name: 'Bronze', min: 0, max: 49 },
  { id: 'silver', name: 'Silver', min: 50, max: 59 },
  { id: 'gold', name: 'Gold', min: 60, max: 69 },
  { id: 'platinum', name: 'Platinum', min: 70, max: 79 },
  { id: 'diamond', name: 'Diamond', min: 80, max: 89 },
  { id: 'elite', name: 'Elite', min: 90, max: 94 },
  { id: 'legendary', name: 'Legendary', min: 95, max: 99 },
];

export const TIER_BY_ID: Record<CardTier, TierDefinition> = TIERS.reduce(
  (acc, t) => ({ ...acc, [t.id]: t }),
  {} as Record<CardTier, TierDefinition>,
);

export const TIER_ORDER: CardTier[] = TIERS.map((t) => t.id);
