import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Stop on error...",
  configKey: "stopOnError",
  list: [
    {
      id: "changeStopOnErrorOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setStopOnError("off");
      },
    },
    {
      id: "changeStopOnErrorLetter",
      display: "letter",
      configValue: "letter",
      exec: (): void => {
        UpdateConfig.setStopOnError("letter");
      },
    },
    {
      id: "changeStopOnErrorWord",
      display: "word",
      configValue: "word",
      exec: (): void => {
        UpdateConfig.setStopOnError("word");
      },
    },
  ],
};

export default commands;
