import { Challenges } from "../src/index";

const known: Record<string, string> = Object.fromEntries(
  Object.entries(Challenges).map(
    ([name, def]) => [name, def.discordRoleId] as [string, string],
  ),
);

console.log("roleid mapping");
console.log(JSON.stringify(known, null, 2));
