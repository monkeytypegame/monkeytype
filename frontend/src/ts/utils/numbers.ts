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
 * Converts a value in rem units to pixels based on the root element's font size.
 * https://stackoverflow.com/questions/36532307/rem-px-in-javascript
 * @param rem The value in rem units to convert to pixels.
 * @returns The equivalent value in pixels.
 */
export function convertRemToPixels(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

/**
 * Formats a number with spaces for thousands separator.
 * @param x The number to format.
 * @returns The formatted number as a string with spaces for thousands separator.
 */
export function numberWithSpaces(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
 * Converts a number into a rounded form with its order of magnitude.
 * @param num The number to convert.
 * @returns An object containing the rounded number, rounded to 2 decimal places,
 * and the order of magnitude (e.g., thousand, million, billion).
 */
export function getNumberWithMagnitude(num: number): {
  rounded: number;
  roundedTo2: number;
  orderOfMagnitude: string;
} {
  const units = [
    "",
    "thousand",
    "million",
    "billion",
    "trillion",
    "quadrillion",
    "quintillion",
    "sextillion",
    "septillion",
    "octillion",
    "nonillion",
    "decillion",
  ];
  let unitIndex = 0;
  let roundedNum = num;

  while (roundedNum >= 1000) {
    roundedNum /= 1000;
    unitIndex++;
  }

  const unit = units[unitIndex] ?? "unknown";

  return {
    rounded: Math.round(roundedNum),
    roundedTo2: roundTo2(roundedNum),
    orderOfMagnitude: unit,
  };
}

/**
 * Abbreviates a large number with a suffix (k, m, b, etc.) representing its order of magnitude.
 * @param num The number to abbreviate.
 * @param decimalPoints The number of decimal points to include in the result. Default is 1.
 * @returns The abbreviated number as a string with the appropriate suffix.
 */
export function abbreviateNumber(num: number, decimalPoints = 1): string {
  if (num < 1000) {
    return num.toFixed(decimalPoints);
  }

  const exp = Math.floor(Math.log(num) / Math.log(1000));
  const pre = "kmbtqQsSond".charAt(exp - 1);
  return (num / Math.pow(1000, exp)).toFixed(decimalPoints) + pre;
}

/**
 * Finds the line of best fit (least squares regression line) for a set of y-values.
 * @param values_y An array of y-values.
 * @returns An array of two points representing the line (start and end points),
 * or null if the array is empty.
 */
export function findLineByLeastSquares(
  values_y: number[]
): [[number, number], [number, number]] | null {
  let sum_x = 0;
  let sum_y = 0;
  let sum_xy = 0;
  let sum_xx = 0;
  let count = 0;

  /*
   * We'll use those letiables for faster read/write access.
   */
  let x = 0;
  let y = 0;
  const values_length = values_y.length;

  /*
   * Nothing to do.
   */
  if (values_length === 0) {
    return null;
  }

  /*
   * Calculate the sum for each of the parts necessary.
   */
  for (let v = 0; v < values_length; v++) {
    x = v + 1;
    y = values_y[v] as number;
    sum_x += x;
    sum_y += y;
    sum_xx += x * x;
    sum_xy += x * y;
    count++;
  }

  /*
   * Calculate m and b for the formula:
   * y = x * m + b
   */
  const m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);
  const b = sum_y / count - (m * sum_x) / count;

  const returnpoint1 = [1, 1 * m + b] as [number, number];
  const returnpoint2 = [values_length, values_length * m + b] as [
    number,
    number
  ];
  return [returnpoint1, returnpoint2];
}
