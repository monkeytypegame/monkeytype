import { Challenges } from "@monkeytype/challenges";

export default Object.entries(Challenges)
  .filter(([_, challenge]) => challenge.autoRole)
  .map(([name]) => name);
