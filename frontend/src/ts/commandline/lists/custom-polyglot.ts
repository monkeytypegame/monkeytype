import * as UpdateConfig from "../../config";
import { LanguageList } from "../../constants/languages";

import * as TestLogic from "../../test/test-logic";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Polyglot languages",
  configKey: "customPolyglot",
  excludeFromSingleList: true,
  list: LanguageList.map((language) => ({
    id: "changeCustomPolyglot" + capitalizeFirstLetterOfEachWord(language),
    display: language.replace(/_/g, " "),
    configValue: language,
    configValueMode: "include",
    sticky: true,
    exec: (): void => {
      UpdateConfig.toggleCustomPolyglot(language);
      TestLogic.restart();
    },
  })),
};

const commands: Command[] = [
  {
    id: "changeCustomPolyglot",
    display: "Polyglot languages...",
    icon: "fa-language",
    subgroup,
  },
];

export default commands;
