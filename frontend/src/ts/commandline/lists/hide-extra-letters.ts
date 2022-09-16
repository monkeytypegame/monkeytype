import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Hide extra letters...",
  configKey: "hideExtraLetters",
  list: [
    {
      id: "setHideExtraLettersOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setHideExtraLetters(false);
      },
    },
    {
      id: "setHideExtraLettersOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setHideExtraLetters(true);
      },
    },
  ],
};

export default commands;
