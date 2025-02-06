/**
 * Rounds a number to one decimal places.
 * @param num The number to round.
 * @returns The input number rounded to one decimal places.
 */
export function roundTo1(num: number): number {
  return Math.round((num + Number.EPSILON) * 10) / 10;
}

/**
 * Rounds a number to two decimal places.
 * @param num The number to round.
 * @returns The input number rounded to two decimal places.
 */
export function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates the standard deviation of an array of numbers.
 * @param array An array of numbers.
 * @returns The standard deviation of the input array.
 */
export function stdDev(array: number[]): number {
  try {
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(
      array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
    );
  } catch (e) {
    return 0;
  }
}

/**
 * Calculates the mean (average) of an array of numbers.
 * @param array An array of numbers.
 * @returns The mean of the input array.
 */
export function mean(array: number[]): number {
  try {
    return (
      array.reduce((previous, current) => (current += previous)) / array.length
    );
  } catch (e) {
    return 0;
  }
}

/**
 * Calculates the median of an array of numbers.
 * https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-88.php
 * @param arr An array of numbers.
 * @returns The median of the input array.
 */
export function median(arr: number[]): number {
  try {
    const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0
      ? (nums[mid] as number)
      : ((nums[mid - 1] as number) + (nums[mid] as number)) / 2;
  } catch (e) {
    return 0;
  }
}

/**
 * Calculates consistency by mapping COV from [0, +infinity) to [100, 0).
 * The mapping function is a version of the sigmoid function tanh(x) that is closer to the identity function tanh(arctanh(x)) in [0, 1).
 * @param cov The coefficient of variation of an array of numbers (standard deviation / mean).
 * @returns Consistency
 */
export function kogasa(cov: number): number {
  return (
    100 * (1 - Math.tanh(cov + Math.pow(cov, 3) / 3 + Math.pow(cov, 5) / 5))
  );
}

/**
 * Gets an integer between min and max, both are inclusive.
 * @param min
 * @param max
 * @returns Random integer betwen min and max.
 */
export function randomIntFromRange(min: number, max: number): number {
  const minNorm = Math.ceil(min);
  const maxNorm = Math.floor(max);
  return Math.floor(Math.random() * (maxNorm - minNorm + 1) + minNorm);
}

/**
 * Maps a value from one range to another.
 * @param value The value to map.
 * @param inMin Input range minimum.
 * @param inMax Input range maximum.
 * @param outMin Output range minimum.
 * @param outMax Output range maximum.
 * @param clamp If true, the result is clamped to the output range. Default true.
 * @returns The mapped value.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clamp = true
): number {
  if (inMin === inMax) {
    return outMin;
  }

  const result =
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  if (clamp) {
    if (outMin < outMax) {
      return Math.min(Math.max(result, outMin), outMax);
    } else {
      return Math.max(Math.min(result, outMin), outMax);
    }
  }

  return result;
}
