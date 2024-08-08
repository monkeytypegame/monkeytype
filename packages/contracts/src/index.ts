import { initContract } from "@ts-rest/core";
import { adminContract } from "./admin";
import { apeKeysContract } from "./ape-keys";
import { configsContract } from "./configs";
import { presetsContract } from "./presets";

const c = initContract();

export const contract = c.router({
  admin: adminContract,
  apeKeys: apeKeysContract,
  configs: configsContract,
  presets: presetsContract,
});
