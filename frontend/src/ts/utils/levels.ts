import { abbreviateNumber } from "./numbers";

/**
 * Calculates the level based on the total XP.
 * This is the inverse of the function getTotalXpToReachLevel()
 * @param totalXp The total experience points.
 * @returns The calculated level.
 */
export function getLevelFromTotalXp(totalXp: number): number {
  return Math.floor((Math.sqrt(392 * totalXp + 22801) - 53) / 98);
}

/**
 * Calculates the experience points required to complete a given level.
 * It does not take into consideration the experience points already gained in that level.
 * @param level The level.
 * @returns The experience points required for the level.
 */
function getLevelMaxXp(level: number): number {
  return 49 * (level - 1) + 100;
}

/**
 * Calculates the total experience points to reach the given level.
 * This is the inverse of the function getLevelFromTotalXp().
 * Calculated as the sum of xp required for all levels up to `level`,
 * where xp required for `level` is calculated using getLevelMaxXp(),
 * and the first level is 1 and it requires 100xp to reach level 2.
 * @param level The level.
 * @returns The total experience points required to reach the level.
 */
function getTotalXpToReachLevel(level: number): number {
  return (49 * Math.pow(level, 2) + 53 * level - 102) / 2;
}

export type XPDetails = {
  level: number;
  levelCurrentXp: number;
  levelMaxXp: number;
};

/**
 * Calculates the details of experience points based on given total xp.
 * @param totalXp The total experience points.
 * @returns An object with the following properties: calculated level (floored),
 *  partial xp of the level, and required xp for level completion.
 */
export function getXpDetails(totalXp: number): XPDetails {
  const level = getLevelFromTotalXp(totalXp);
  return {
    level,
    levelCurrentXp: totalXp - getTotalXpToReachLevel(level),
    levelMaxXp: getLevelMaxXp(level),
  };
}

export function formatXp(xp: number): string {
  if (xp < 1000) {
    return Math.round(xp).toString();
  } else {
    return abbreviateNumber(xp);
  }
}
