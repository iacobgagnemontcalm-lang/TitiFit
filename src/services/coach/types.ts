import type { AthleteState } from '@/services/athleteService';
import type { User } from '@/types';

/**
 * The coach is defined by an interface, not by an implementation.
 *
 * `RuleBasedCoach` ships today: it reads the same engines the rest of the app
 * uses, so every number it quotes is the athlete's real number and every
 * recommendation can be traced back to a computation. An LLM-backed provider
 * can be registered later without touching the screen — and would be held to
 * the same contract: always state the *why*, never invent a figure.
 */

export interface CoachContext {
  user: User;
  state: AthleteState;
}

export interface CoachCitation {
  /** The figure the advice rests on, e.g. "Endurance 89" or "5 km 20:42". */
  label: string;
  value: string;
}

export interface CoachAnswer {
  /** One-sentence headline answer. */
  headline: string;
  /** The reasoning, in the order a coach would explain it. */
  paragraphs: string[];
  /** Concrete next actions. */
  actions: string[];
  /** Numbers this answer is based on — shown so nothing looks made up. */
  citations: CoachCitation[];
  /** Which provider produced it, surfaced in the UI. */
  source: string;
}

export interface CoachQuestion {
  id: string;
  /** What the athlete taps. */
  label: string;
  /** Keywords matched against free text. */
  keywords: string[];
}

export interface CoachProvider {
  readonly id: string;
  readonly label: string;
  /** Questions offered as chips. */
  suggestions(context: CoachContext): CoachQuestion[];
  ask(question: string, context: CoachContext): Promise<CoachAnswer>;
}
