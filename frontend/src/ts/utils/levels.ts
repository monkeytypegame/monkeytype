/**
 * Calculates the level based on the XP.
 * @param xp The experience points.
 * @returns The calculated level.
 */
export function getLevel(xp: number): number {
  return (1 / 98) * (-151 + Math.sqrt(392 * xp + 22801)) + 1;
}

/**
 * Calculates the experience points required for a given level.
 * @param level The level.
 * @returns The experience points required for the level.
 */
export function getXpForLevel(level: number): number {
  return 49 * (level - 1) + 100;
}
