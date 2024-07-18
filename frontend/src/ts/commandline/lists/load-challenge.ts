import { navigate } from "../../controllers/route-controller.js";
import * as ChallengeController from "../../controllers/challenge-controller.js";
import * as TestLogic from "../../test/test-logic.js";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings.js";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Load challenge...",
  list: [],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "loadChallenge",
    display: "Load challenge...",
    icon: "fa-award",
    subgroup,
  },
];

function update(challenges: MonkeyTypes.Challenge[]): void {
  challenges.forEach((challenge) => {
    subgroup.list.push({
      id: "loadChallenge" + capitalizeFirstLetterOfEachWord(challenge.name),
      display: challenge.display,
      exec: async (): Promise<void> => {
        navigate("/");
        await ChallengeController.setup(challenge.name);
        TestLogic.restart({
          nosave: true,
        });
      },
    });
  });
}

export default commands;
export { update };
