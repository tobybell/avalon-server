/**
 * Shuffles array in place.
 *
 * @param a items An array containing the items.
 */
export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
