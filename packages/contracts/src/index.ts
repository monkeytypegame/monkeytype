import { initContract } from "@ts-rest/core";
import { adminContract } from "./admin";
import { apeKeysContract } from "./ape-keys";
import { configsContract } from "./configs";
import { presetsContract } from "./presets";
import { psasContract } from "./psas";
import { publicContract } from "./public";
import { leaderboardsContract } from "./leaderboards";
import { resultsContract } from "./results";
import { configurationContract } from "./configuration";
import { devContract } from "./dev";
import { usersContract } from "./users";
import { quotesContract } from "./quotes";
import { webhooksContract } from "./webhooks";

const c = initContract();

export const contract = c.router({
  admin: adminContract,
  apeKeys: apeKeysContract,
  configs: configsContract,
  presets: presetsContract,
  psas: psasContract,
  public: publicContract,
  leaderboards: leaderboardsContract,
  results: resultsContract,
  configuration: configurationContract,
  dev: devContract,
  users: usersContract,
  quotes: quotesContract,
  webhooks: webhooksContract,
});

/**
 * Whenever there is a breaking change with old frontend clients increase this number.
 * This will inform the frontend to refresh.
 */
export const COMPATIBILITY_CHECK = 2;
export const COMPATIBILITY_CHECK_HEADER = "X-Compatibility-Check";
