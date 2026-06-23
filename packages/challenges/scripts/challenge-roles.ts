import { Challenges } from "../src/index";

const known: Record<string, string> = Object.fromEntries(
  Object.entries(Challenges)
    .filter(([, def]) => def.discordRoleId !== undefined)
    .map(([name, def]) => [name, def.discordRoleId] as [string, string]),
);

const missing = Object.entries(Challenges)
  .filter(([, def]) => def.discordRoleId === undefined)
  .map(([name]) => name);

console.log("roleid mapping");
console.log(JSON.stringify(known, null, 2));
console.log("missing challenges");
console.log(JSON.stringify(missing, null, 2));
