import { randomIntFromRange } from "./numbers";

/**
 * Applies a smoothing algorithm to an array of numbers.
 * @param arr The input array of numbers.
 * @param windowSize The size of the window used for smoothing.
 * @param getter An optional function to extract values from the array elements. Defaults to the identity function.
 * @returns An array of smoothed values, where each value is the average of itself and its neighbors within the window.
 */
export function smooth(
  arr: number[],
  windowSize: number,
  getter = (value: number): number => value
): number[] {
  const get = getter;
  const result = [];

  for (let i = 0; i < arr.length; i += 1) {
    const leftOffeset = i - windowSize;
    const from = leftOffeset >= 0 ? leftOffeset : 0;
    const to = i + windowSize + 1;

    let count = 0;
    let sum = 0;
    for (let j = from; j < to && j < arr.length; j += 1) {
      sum += get(arr[j] as number);
      count += 1;
    }

    result[i] = sum / count;
  }

  return result;
}

/**
 * Shuffle an array of elements using the Fisher–Yates algorithm.
 * This function mutates the input array.
 * @param elements
 */
export function shuffle<T>(elements: T[]): void {
  for (let i = elements.length - 1; i > 0; --i) {
    const j = randomIntFromRange(0, i);
    const temp = elements[j];
    elements[j] = elements[i] as T;
    elements[i] = temp as T;
  }
}

/**
 * Returns the last element of an array.
 * @param array The input array.
 * @returns The last element of the array, or undefined if the array is empty.
 */
export function lastElementFromArray<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * Checks if two unsorted arrays are equal, i.e., they have the same elements regardless of order.
 * @param a The first array.
 * @param b The second array.
 * @returns True if the arrays are equal, false otherwise.
 */
export function areUnsortedArraysEqual(a: unknown[], b: unknown[]): boolean {
  return a.length === b.length && a.every((v) => b.includes(v));
}

/**
 * Checks if two sorted arrays are equal, i.e., they have the same elements in the same order.
 * @param a The first array.
 * @param b The second array.
 * @returns True if the arrays are equal, false otherwise.
 */
export function areSortedArraysEqual(a: unknown[], b: unknown[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Returns a random element from an array.
 * @param array The input array.
 * @returns A random element from the array.
 */
export function randomElementFromArray<T>(array: T[]): T {
  return array[randomIntFromRange(0, array.length - 1)] as T;
}

/**
 * Returns the element at the specified index from an array.
 * Negative index values count from the end of the array.
 * @param array The input array.
 * @param index The index of the element to return.
 * @returns The element at the specified index, or undefined if the index is out of bounds.
 */
export function nthElementFromArray<T>(
  array: T[],
  index: number
): T | undefined {
  index = index < 0 ? array.length + index : index;
  return array[index];
}

/**
 * Returns the intersection of two arrays, i.e., the elements that are present in both arrays.
 * @param a First array.
 * @param b Second array.
 * @returns An array containing the elements that are present in both input arrays.
 */
export function intersect<T>(a: T[], b: T[], removeDuplicates = false): T[] {
  let t;
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  if (b.length > a.length) (t = b), (b = a), (a = t); // indexOf to loop over shorter
  const filtered = a.filter(function (e) {
    return b.includes(e);
  });
  return removeDuplicates ? [...new Set(filtered)] : filtered;
}
