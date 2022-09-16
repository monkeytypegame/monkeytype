import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Always show CPM...",
  configKey: "alwaysShowCPM",
  list: [
    {
      id: "setAlwaysShowCPMOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setAlwaysShowCPM(false);
      },
    },
    {
      id: "setAlwaysShowCPMOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setAlwaysShowCPM(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeAlwaysShowCPM",
    display: "Always show CPM...",
    icon: "fa-tachometer-alt",
    subgroup,
  },
];

export default commands;
