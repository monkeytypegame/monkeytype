import { initContract } from "@ts-rest/core";
import { configsContract } from "./configs";
import { presetsContract } from "./presets";
import { apeKeysContract } from "./ape-keys";

const c = initContract();

export const contract = c.router({
  apeKeys: apeKeysContract,
  configs: configsContract,
  presets: presetsContract,
});
