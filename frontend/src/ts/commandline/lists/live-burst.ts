import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Live burst...",
  configKey: "showLiveBurst",
  list: [
    {
      id: "setLiveBurstOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowLiveBurst(false);
      },
    },
    {
      id: "setLiveBurstOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowLiveBurst(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeLiveBurst",
    display: "Live burst...",
    icon: "fa-fire-alt",
    subgroup,
  },
];

export default commands;
