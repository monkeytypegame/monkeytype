import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Power mode...",
  configKey: "monkeyPowerLevel",
  list: [
    {
      id: "monkeyPowerLevelOff",
      display: "off",
      configValue: "off",
      exec: () => UpdateConfig.setMonkeyPowerLevel("off"),
    },
    {
      id: "monkeyPowerLevel1",
      display: "mellow",
      configValue: "1",
      exec: () => UpdateConfig.setMonkeyPowerLevel("1"),
    },
    {
      id: "monkeyPowerLevel2",
      display: "high",
      configValue: "2",
      exec: () => UpdateConfig.setMonkeyPowerLevel("2"),
    },
    {
      id: "monkeyPowerLevel3",
      display: "ultra",
      configValue: "3",
      exec: () => UpdateConfig.setMonkeyPowerLevel("3"),
    },
    {
      id: "monkeyPowerLevel4",
      display: "over 9000",
      configValue: "4",
      exec: () => UpdateConfig.setMonkeyPowerLevel("4"),
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "monkeyPower",
    display: "Power mode...",
    alias: "powermode",
    icon: "fa-egg",
    visible: false,
    subgroup,
  },
];

export default commands;
