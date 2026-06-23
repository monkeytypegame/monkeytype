import { Challenges } from "@monkeytype/challenges";
import * as ChallengeController from "../../controllers/challenge-controller";
import { navigate } from "../../controllers/route-controller";
import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import { Command, CommandsSubgroup } from "../types";
import { typedEntries } from "@monkeytype/util/objects";

const subgroup: CommandsSubgroup = {
  title: "Load challenge...",
  list: typedEntries(Challenges)
    .filter(([_, challenge]) => challenge.type !== "hidden")
    .map(([name, challenge]) => ({
      id: `loadChallenge${capitalizeFirstLetterOfEachWord(name)}`,
      display: challenge.display,
      exec: async (): Promise<void> => {
        await navigate("/");
        await ChallengeController.setup(name);
        TestLogic.restart({
          nosave: true,
        });
      },
    })),
};

const commands: Command[] = [
  {
    id: "loadChallenge",
    display: "Load challenge...",
    icon: "fa-award",
    subgroup,
  },
];

export default commands;
