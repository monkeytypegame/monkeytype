import { roundTo2 } from "@monkeytype/util/numbers";
import { PerCharStats } from "@monkeytype/schemas/results";

export type CharStatsBreakdown = PerCharStats & {
  total: number;
};

export type CharacterStat = CharStatsBreakdown & {
  char: string;
  accuracy: number;
  errorRate: number;
};

export type CharacterGroupStats = {
  letters: CharStatsBreakdown;
  numbers: CharStatsBreakdown;
  punctuation: CharStatsBreakdown;
  spaces: CharStatsBreakdown;
  other: CharStatsBreakdown;
};

/**
 * Safely extract character statistics breakdown from charStats tuple
 */
export function getCharStatsBreakdown(
  charStats: [number, number, number, number] | undefined
): CharStatsBreakdown | null {
  if (!charStats || charStats.length !== 4) {
    return null;
  }

  const [correct, incorrect, missed, extra] = charStats;
  const total = correct + incorrect + missed + extra;

  return {
    correct,
    incorrect,
    missed,
    extra,
    total,
  };
}

/**
 * Process detailed character statistics into sorted array
 */
export function processDetailedCharStats(
  detailedCharStats: Record<string, PerCharStats> | undefined
): CharacterStat[] {
  if (!detailedCharStats) {
    return [];
  }

  const stats: CharacterStat[] = [];

  for (const [char, stat] of Object.entries(detailedCharStats)) {
    const correct = stat.correct;
    const incorrect = stat.incorrect;
    const missed = stat.missed;
    const extra = stat.extra;
    const total = correct + incorrect + missed + extra;

    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const errorRate =
      total > 0 ? ((incorrect + missed + extra) / total) * 100 : 0;

    stats.push({
      char,
      total,
      correct,
      incorrect,
      missed,
      extra,
      accuracy: roundTo2(accuracy),
      errorRate: roundTo2(errorRate),
    });
  }

  // Sort by error rate (descending), then by total (descending)
  return stats.sort((a, b) => {
    if (b.errorRate !== a.errorRate) {
      return b.errorRate - a.errorRate;
    }
    return b.total - a.total;
  });
}

/**
 * Group characters by type and calculate statistics
 */
export function groupCharactersByType(
  detailedCharStats: Record<string, PerCharStats> | undefined
): CharacterGroupStats {
  const defaultGroup: CharStatsBreakdown = {
    correct: 0,
    incorrect: 0,
    missed: 0,
    extra: 0,
    total: 0,
  };

  const groups: CharacterGroupStats = {
    letters: { ...defaultGroup },
    numbers: { ...defaultGroup },
    punctuation: { ...defaultGroup },
    spaces: { ...defaultGroup },
    other: { ...defaultGroup },
  };

  if (!detailedCharStats) {
    return groups;
  }

  for (const [char, stat] of Object.entries(detailedCharStats)) {
    let group: keyof CharacterGroupStats = "other";

    if (/[a-zA-Z]/.test(char)) {
      group = "letters";
    } else if (/[0-9]/.test(char)) {
      group = "numbers";
    } else if (/[\s]/.test(char)) {
      group = "spaces";
    } else if (/[^\w\s]/.test(char)) {
      group = "punctuation";
    }

    groups[group].correct += stat.correct;
    groups[group].incorrect += stat.incorrect;
    groups[group].missed += stat.missed;
    groups[group].extra += stat.extra;
    groups[group].total +=
      stat.correct + stat.incorrect + stat.missed + stat.extra;
  }

  return groups;
}

/**
 * Get top problematic characters (highest error rate)
 */
export function getTopProblematicChars(
  detailedCharStats: Record<string, PerCharStats> | undefined,
  limit: number = 10
): CharacterStat[] {
  const stats = processDetailedCharStats(detailedCharStats);
  return stats.filter((s) => s.total > 0 && s.errorRate > 0).slice(0, limit);
}

/**
 * Get most accurate characters
 */
export function getMostAccurateChars(
  detailedCharStats: Record<string, PerCharStats> | undefined,
  limit: number = 10
): CharacterStat[] {
  const stats = processDetailedCharStats(detailedCharStats);
  return stats
    .filter((s) => s.total > 0)
    .sort((a, b) => {
      if (b.accuracy !== a.accuracy) {
        return b.accuracy - a.accuracy;
      }
      return b.total - a.total;
    })
    .slice(0, limit);
}
