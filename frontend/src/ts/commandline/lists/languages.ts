import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/misc";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Language...",
  configKey: "language",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the languages list :(",
    },
  ],
};

function update(languages: string[]): void {
  commands.list = [];
  languages.forEach((language) => {
    commands.list.push({
      id: "changeLanguage" + capitalizeFirstLetterOfEachWord(language),
      display: language.replace(/_/g, " "),
      configValue: language,
      exec: (): void => {
        UpdateConfig.setLanguage(language);
        TestLogic.restart();
      },
    });
  });
}

export default commands;
export { update };
