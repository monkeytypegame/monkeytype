import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Indicate typos...",
  configKey: "indicateTypos",
  list: [
    {
      id: "setIndicateTyposOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("off");
      },
    },
    {
      id: "setIndicateTyposBelow",
      display: "below",
      configValue: "below",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("below");
      },
    },
    {
      id: "setIndicateTyposReplace",
      display: "replace",
      configValue: "replace",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("replace");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeIndicateTypos",
    display: "Indicate typos...",
    icon: "fa-exclamation",
    subgroup,
  },
];

export default commands;
