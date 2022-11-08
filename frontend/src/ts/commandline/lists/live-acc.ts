import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live accuracy...",
  configKey: "showLiveAcc",
  list: [
    {
      id: "setLiveAccOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowLiveAcc(false);
      },
    },
    {
      id: "setLiveAccOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowLiveAcc(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeLiveAcc",
    display: "Live accuracy...",
    icon: "fa-percentage",
    subgroup,
  },
];

export default commands;
