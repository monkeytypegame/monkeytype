import * as UpdateConfig from "../../config";
import { LanguageList } from "../../constants/languages";
import {
  capitalizeFirstLetterOfEachWord,
  getLanguageDisplayString,
} from "../../utils/strings";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Language...",
  configKey: "language",
  list: LanguageList.map((language) => ({
    id: "changeLanguage" + capitalizeFirstLetterOfEachWord(language),
    display: getLanguageDisplayString(language),
    configValue: language,
    exec: (): void => {
      UpdateConfig.setLanguage(language);
    },
  })),
};

const commands: Command[] = [
  {
    id: "changeLanguage",
    display: "Language...",
    icon: "fa-language",
    subgroup,
  },
];

export default commands;
