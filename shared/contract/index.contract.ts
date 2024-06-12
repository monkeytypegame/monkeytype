import { initContract } from "@ts-rest/core";
import { configsContract } from "./configs.contract";

const c = initContract();

export const contract = c.router({
  configs: configsContract,
});
