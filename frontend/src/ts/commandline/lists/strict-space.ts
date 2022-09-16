import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
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

export default commands;
