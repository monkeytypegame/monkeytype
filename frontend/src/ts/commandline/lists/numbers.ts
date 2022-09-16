import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Numbers...",
  configKey: "numbers",
  list: [
    {
      id: "changeNumbersOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setNumbers(true);
        TestLogic.restart();
      },
    },
    {
      id: "changeNumbersOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setNumbers(false);
        TestLogic.restart();
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeNumbers",
    display: "Numbers...",
    icon: "fa-hashtag",
    subgroup,
  },
];

export default commands;
