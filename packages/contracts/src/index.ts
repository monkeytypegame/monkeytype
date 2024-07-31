import { initContract } from "@ts-rest/core";
import { configsContract } from "./configs";
import { presetsContract } from "./presets";

const c = initContract();

export const contract = c.router({
  configs: configsContract,
  presets: presetsContract,
});
