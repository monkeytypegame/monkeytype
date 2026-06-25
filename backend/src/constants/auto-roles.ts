import { getChallenges } from "@monkeytype/challenges";

export default getChallenges()
  .filter((it) => it.settings?.autoRole)
  .map((it) => it.name);
