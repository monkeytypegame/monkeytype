import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Freedom mode...",
  configKey: "freedomMode",
  list: [
    {
      id: "setfreedomModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setFreedomMode(false);
      },
    },
    {
      id: "setfreedomModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setFreedomMode(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeFreedomMode",
    display: "Freedom mode...",
    icon: "fa-feather-alt",
    subgroup,
  },
];

export default commands;
