/**
 * Returns the intersection of two arrays, i.e., the elements that are present in both arrays.
 * @param a First array.
 * @param b Second array.
 * @returns An array containing the elements that are present in both input arrays.
 */
export function intersect<T>(a: T[], b: T[], removeDuplicates = false): T[] {
  if (b.length > a.length) {
    [a, b] = [b, a]; // Swap a and b to loop over the shorter array
  }
  const filtered = a.filter(function (e) {
    return b.includes(e);
  });
  return removeDuplicates ? [...new Set(filtered)] : filtered;
}

/**
 * Checks if two unsorted arrays are equal, i.e., they have the same elements regardless of order.
 * @param a The first array.
 * @param b The second array.
 * @returns True if the arrays are equal, false otherwise.
 */
export function areUnsortedArraysEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((v) => b.includes(v));
}

/**
 * Checks if two sorted arrays are equal, i.e., they have the same elements in the same order.
 * @param a The first array.
 * @param b The second array.
 * @returns True if the arrays are equal, false otherwise.
 */
export function areSortedArraysEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
