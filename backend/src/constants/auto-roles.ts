import { getChallenges } from "@monkeytype/challenges";

export default getChallenges()
  .filter((it) => it.autoRole)
  .map((it) => it.name);
