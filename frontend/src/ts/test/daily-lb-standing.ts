import { LeaderboardEntry } from "@monkeytype/schemas/leaderboards";
import { Language } from "@monkeytype/schemas/languages";
import { Mode, Mode2 } from "@monkeytype/schemas/shared";

import Ape from "../ape";
import { tryCatch } from "@monkeytype/util/trycatch";

// Daily leaderboards only exist for these modes. This is a client-side
// pre-filter to avoid pointless requests - the server still validates against
// its own configuration and responds with an error for unsupported modes.
export function canHaveDailyLeaderboard(
  mode: Mode,
  mode2: Mode2<Mode>,
): boolean {
  return mode === "time" && (mode2 === "15" || mode2 === "60");
}

/**
 * Get the current user's standing on today's daily leaderboard, regardless of
 * whether the last completed test improved it.
 * @returns the leaderboard entry, or null if the user has no entry today, the
 * mode has no daily leaderboard or the request failed.
 */
export async function getCurrentStanding(
  mode: Mode,
  mode2: Mode2<Mode>,
  language: Language,
): Promise<LeaderboardEntry | null> {
  if (!canHaveDailyLeaderboard(mode, mode2)) {
    return null;
  }

  const { data: response, error } = await tryCatch(
    Ape.leaderboards.getDailyRank({
      query: { mode, mode2, language },
    }),
  );

  if (error !== null || response.status !== 200) {
    return null;
  }

  return response.body.data;
}
