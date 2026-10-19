import { PaceCaret } from "@monkeytype/schemas/configs";
import { Configuration } from "@monkeytype/schemas/configuration";

import { get as getServerConfiguration } from "../ape/server-configuration";
import { isAuthenticated } from "../states/core";

/**
 * Whether the mode can be selected. Leaderboard modes only show a caret when
 * the test qualifies for the targeted leaderboard, which is checked on init.
 */
export function isPaceCaretModeAvailable(
  mode: PaceCaret,
  serverConfiguration: Configuration | undefined = getServerConfiguration(),
): boolean {
  if (mode !== "next" && mode !== "nextDaily") return true;
  if (!isAuthenticated()) return false;
  if (mode === "next") return true;

  return serverConfiguration?.dailyLeaderboards.enabled ?? false;
}
