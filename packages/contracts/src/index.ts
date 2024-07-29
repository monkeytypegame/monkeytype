import { initContract } from "@ts-rest/core";
import { configsContract } from "./configs";

const c = initContract();

export const contract = c.router({
  configs: configsContract,
});

console.log("hello\\o");
