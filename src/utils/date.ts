/** All date helpers work on ISO `YYYY-MM-DD` strings in local time. */

export const toISODate = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const todayISO = (): string => toISODate(new Date());

export const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.split('T')[0]!.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

export function ageFromBirthDate(birthDate: string, at: Date = new Date()): number {
  const b = parseISODate(birthDate);
  let age = at.getFullYear() - b.getFullYear();
  const monthDiff = at.getMonth() - b.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < b.getDate())) age -= 1;
  return Math.max(0, age);
}

export const daysBetween = (a: string, b: string): number =>
  Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);

/**
 * ISO-week key `YYYY-Www`, optionally shifted for a Sunday week start.
 * Used as the unit of a streak.
 */
export function weekKey(iso: string, weekStartsOn: 0 | 1 = 1): string {
  const d = parseISODate(iso);
  const shift = weekStartsOn === 1 ? 0 : 1;
  const target = new Date(d.getTime() + shift * 86_400_000);
  // Thursday of the current ISO week determines the year.
  const day = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - day + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${target.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}

/** Number of whole weeks between two week keys (b - a). */
export function weeksBetweenKeys(a: string, b: string): number {
  const parse = (k: string) => {
    const [y, w] = k.split('-W');
    return { year: Number(y), week: Number(w) };
  };
  const ka = parse(a);
  const kb = parse(b);
  return (kb.year - ka.year) * 52 + (kb.week - ka.week);
}

export const monthKey = (iso: string): string => iso.slice(0, 7);

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatShortDate(iso: string): string {
  const d = parseISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatMonthYear(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const days = daysBetween(iso, toISODate(now));
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} an${days >= 730 ? 's' : ''}`;
}
