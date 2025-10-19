/**
 * Detects if two words differ only by a single character swap (transposition).
 * A swap is defined as exactly two adjacent characters being swapped.
 *
 * Examples:
 * - "tpye" and "type" -> true (p and y swapped)
 * - "hte" and "the" -> true (h and t swapped)
 * - "ytpe" and "type" -> false (multiple differences)
 * - "tpe" and "type" -> false (missing character, not a swap)
 * - "typo" and "type" -> false (different character, not a swap)
 *
 * @param inputWord - The word typed by the user
 * @param targetWord - The correct word
 * @returns true if the words differ by exactly one adjacent character swap
 */
export function isSingleSwapError(
  inputWord: string,
  targetWord: string
): boolean {
  // Must be same length for a swap
  if (inputWord.length !== targetWord.length) {
    return false;
  }

  // Must be at least 2 characters to have a swap
  if (inputWord.length < 2) {
    return false;
  }

  // If words are identical, no error
  if (inputWord === targetWord) {
    return false;
  }

  // Find all positions where characters differ
  const diffPositions: number[] = [];
  for (let i = 0; i < inputWord.length; i++) {
    if (inputWord[i] !== targetWord[i]) {
      diffPositions.push(i);
    }
  }

  // For a single swap, exactly 2 positions should differ
  if (diffPositions.length !== 2) {
    return false;
  }

  const pos1 = diffPositions[0] as number;
  const pos2 = diffPositions[1] as number;

  // The two positions must be adjacent
  if (pos2 - pos1 !== 1) {
    return false;
  }

  // Check if swapping characters at these positions makes them match
  if (
    inputWord[pos1] === targetWord[pos2] &&
    inputWord[pos2] === targetWord[pos1]
  ) {
    return true;
  }

  return false;
}
