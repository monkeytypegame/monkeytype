export type Predicate<Args extends unknown[]> = (...args: Args) => boolean;
/**
 * Negates a predicate function, returning a new function that returns the opposite boolean result.
 *
 * @param  predicate - The function to negate.
 * @returns A new function that returns the negated boolean result.
 */
export function not<T extends unknown[]>(
  predicate: Predicate<T>
): Predicate<T> {
  return (...args: T) => !predicate(...args);
}
