let counter = 0;

/** Collision-safe-enough local id. Replaced by server ids once a backend exists. */
export function createId(prefix = 'id'): string {
  counter += 1;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${time}${counter.toString(36)}${rand}`;
}
