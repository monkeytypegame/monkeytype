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
function getXpForLevel(level: number): number {
  return 49 * (level - 1) + 100;
}

/**
 * Calculates the total experience points to reach the given level.
 * @param level The level.
 * @returns The total experience points required to reach the level.
 */
function getTotalXpOfLastLevelling(level: number): number {
  return (49 * Math.pow(level, 2) + 53 * level - 102) / 2;
}

/**
 * Calculates the details of experience points based on given total xp.
 * @param totalXp The total experience points.
 * @returns An object with the following properties: calculated level (floored),
 *  partial xp of the level, and required xp for level completion.
 */
export function getXpDetails(totalXp: number): {
  level: number;
  levelXp: number;
  requiredXpForLevel: number;
} {
  const level = Math.floor(getLevel(totalXp));
  return {
    level: level,
    levelXp: totalXp - getTotalXpOfLastLevelling(level),
    requiredXpForLevel: getXpForLevel(level),
  };
}
