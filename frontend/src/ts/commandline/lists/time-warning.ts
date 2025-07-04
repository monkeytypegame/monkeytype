import * as UpdateConfig from "../../config";
import * as SoundController from "../../controllers/sound-controller";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Time warning...",
  configKey: "playTimeWarning",
  list: [
    {
      id: "setPlayTimeWarningOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setPlayTimeWarning("off");
      },
    },
    {
      id: "setPlayTimeWarning1",
      display: "1 second",
      configValue: "1",
      exec: (): void => {
        UpdateConfig.setPlayTimeWarning("1");
        void SoundController.playTimeWarning();
      },
    },
    {
      id: "setPlayTimeWarning3",
      display: "3 seconds",
      configValue: "3",
      exec: (): void => {
        UpdateConfig.setPlayTimeWarning("3");
        void SoundController.playTimeWarning();
      },
    },
    {
      id: "setPlayTimeWarning5",
      display: "5 seconds",
      configValue: "5",
      exec: (): void => {
        UpdateConfig.setPlayTimeWarning("5");
        void SoundController.playTimeWarning();
      },
    },
    {
      id: "setPlayTimeWarning10",
      display: "10 seconds",
      configValue: "10",
      exec: (): void => {
        UpdateConfig.setPlayTimeWarning("10");
        void SoundController.playTimeWarning();
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changePlayTimeWarning",
    display: "Time warning...",
    icon: "fa-exclamation-triangle",
    subgroup,
  },
];

export default commands;
