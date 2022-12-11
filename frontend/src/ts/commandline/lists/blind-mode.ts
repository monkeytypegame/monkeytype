import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Blind mode...",
  configKey: "blindMode",
  list: [
    {
      id: "setBlindModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setBlindMode(false);
      },
    },
    {
      id: "setBlindModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setBlindMode(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeBlindMode",
    display: "Blind mode...",
    icon: "fa-eye-slash",
    subgroup,
  },
];

export default commands;
