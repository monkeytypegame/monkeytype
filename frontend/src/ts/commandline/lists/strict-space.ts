import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Strict space...",
  configKey: "strictSpace",
  list: [
    {
      id: "setStrictSpaceOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setStrictSpace(false);
      },
    },
    {
      id: "setStrictSpaceOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setStrictSpace(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeStrictSpace",
    display: "Strict space...",
    icon: "fa-minus",
    subgroup,
  },
];

export default commands;
