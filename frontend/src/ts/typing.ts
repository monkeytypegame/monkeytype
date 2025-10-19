/**
 * Typing utilities for Monkeytype.
 * Imported by the typing pipeline to classify word-level errors.
 */

/**
 * Detects whether two strings differ by exactly one swap of two ADJACENT characters.
 * Non-adjacent swaps are NOT considered minor errors.
 * Underscores and all other characters are treated literally (required for heatmap).
 *
 * Valid adjacent swaps (return true):
 * - isMinorSwap("type", "tpye") === true   // 'y' and 'p' swapped at positions 1-2
 * - isMinorSwap("from", "form") === true   // 'r' and 'o' swapped at positions 1-2
 * - isMinorSwap("high", "hihg") === true   // 'g' and 'h' swapped at positions 2-3
 * - isMinorSwap("ab_c", "ac_b") === true   // includes underscore, positions 1-2
 *
 * Invalid cases (return false):
 * - isMinorSwap("course", "crouse") === false  // non-adjacent swap (positions 1 and 3)
 * - isMinorSwap("type", "type") === false      // identical, no swap
 * - isMinorSwap("typo", "type") === false      // different characters
 * - isMinorSwap("tpe", "type") === false       // different length
 * - isMinorSwap("tpey", "type") === false      // multiple errors
 */
export function isMinorSwap(actual: string, expected: string): boolean {
  // Must be same length for a swap
  if (actual.length !== expected.length) {
    return false;
  }

  // Must be at least 2 characters to have an adjacent swap
  if (actual.length < 2) {
    return false;
  }

  // If strings are identical, no swap occurred
  if (actual === expected) {
    return false;
  }

  // Find all positions where characters differ
  const diffPositions: number[] = [];
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      diffPositions.push(i);
      if (diffPositions.length > 2) {
        return false;
      }
    }
  }

  // For an adjacent swap, exactly 2 positions should differ
  if (diffPositions.length !== 2) {
    return false;
  }

  const pos1 = diffPositions[0] as number;
  const pos2 = diffPositions[1] as number;

  // The two positions must be adjacent (differ by 1)
  if (pos2 - pos1 !== 1) {
    return false;
  }

  // Verify that swapping characters at these positions makes them match
  return actual[pos1] === expected[pos2] && actual[pos2] === expected[pos1];
}
