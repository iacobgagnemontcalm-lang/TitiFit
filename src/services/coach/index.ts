import { RuleBasedCoach } from './ruleBasedCoach';
import type { CoachProvider } from './types';

export * from './types';
export { RuleBasedCoach } from './ruleBasedCoach';

/**
 * Swappable like every other engine in the app. Registering an LLM-backed
 * provider here is the only change needed to upgrade the coach — the screen
 * consumes the interface, not the implementation.
 */
let provider: CoachProvider = new RuleBasedCoach();

export const getCoach = (): CoachProvider => provider;
export const setCoach = (next: CoachProvider): void => {
  provider = next;
};
