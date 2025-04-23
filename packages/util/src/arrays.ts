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
