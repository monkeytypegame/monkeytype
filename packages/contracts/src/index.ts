import { initContract } from "@ts-rest/core";
import { adminContract } from "./admin";
import { apeKeysContract } from "./ape-keys";
import { configsContract } from "./configs";
import { presetsContract } from "./presets";
import { psasContract } from "./psas";
import { publicContract } from "./public";
import { leaderboardsContract } from "./leaderboards";
import { resultsContract } from "./results";
import { configurationsContract } from "./configurations";

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
  configuration: configurationsContract,
});
