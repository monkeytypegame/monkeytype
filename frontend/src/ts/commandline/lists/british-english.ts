import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "British english...",
  configKey: "britishEnglish",
  list: [
    {
      id: "setBritishEnglishOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setBritishEnglish(false);
        TestLogic.restart();
      },
    },
    {
      id: "setBritishEnglishOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setBritishEnglish(true);
        TestLogic.restart();
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeBritishEnglish",
    display: "British english...",
    icon: "fa-language",
    subgroup,
  },
];

export default commands;
