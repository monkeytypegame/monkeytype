import { navigate } from "../../controllers/route-controller";
import * as ChallengeController from "../../controllers/challenge-controller";
import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/misc";

export const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Load challenge...",
  list: [],
};

function update(challenges: MonkeyTypes.Challenge[]): void {
  challenges.forEach((challenge) => {
    commands.list.push({
      id: "loadChallenge" + capitalizeFirstLetterOfEachWord(challenge.name),
      noIcon: true,
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
