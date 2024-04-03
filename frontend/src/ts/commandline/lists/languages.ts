import * as UpdateConfig from "../../config";
import {
  capitalizeFirstLetterOfEachWord,
  getLanguageDisplayString,
} from "../../utils/strings";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Language...",
  configKey: "language",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the languages list :(",
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeLanguage",
    display: "Language...",
    icon: "fa-language",
    subgroup,
  },
];

function update(languages: string[]): void {
  subgroup.list = [];
  languages.forEach((language) => {
    subgroup.list.push({
      id: "changeLanguage" + capitalizeFirstLetterOfEachWord(language),
      display: getLanguageDisplayString(language),
      configValue: language,
      exec: (): void => {
        UpdateConfig.setLanguage(language);
      },
    });
  });
}

export default commands;
export { update };
