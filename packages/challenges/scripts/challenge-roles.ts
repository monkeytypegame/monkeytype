import { getChallenges } from "../src/index";

const known = Object.fromEntries(
  getChallenges().map((it) => [it.name, it.discordRoleId]),
);

console.log("roleid mapping");
console.log(JSON.stringify(known, null, 2));
