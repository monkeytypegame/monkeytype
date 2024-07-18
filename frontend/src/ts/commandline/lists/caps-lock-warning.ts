import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Caps lock warning...",
  configKey: "capsLockWarning",
  list: [
    {
      id: "capsLockWarningOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setCapsLockWarning(true);
      },
    },
    {
      id: "capsLockWarningOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setCapsLockWarning(false);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "capsLockWarning",
    display: "Caps lock warning...",
    icon: "fa-exclamation-triangle",
    subgroup,
  },
];

export default commands;
