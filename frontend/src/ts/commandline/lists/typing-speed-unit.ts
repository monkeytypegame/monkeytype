import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Typing speed unit...",
  configKey: "typingSpeedUnit",
  list: [
    {
      id: "setTypingSpeedUnitWpm",
      display: "wpm",
      configValue: "wpm",
      exec: (): void => {
        UpdateConfig.setTypingSpeedUnit("wpm");
      },
    },
    {
      id: "setTypingSpeedUnitCpm",
      display: "cpm",
      configValue: "cpm",
      exec: (): void => {
        UpdateConfig.setTypingSpeedUnit("cpm");
      },
    },
    {
      id: "setTypingSpeedUnitWps",
      display: "wps",
      configValue: "wps",
      exec: (): void => {
        UpdateConfig.setTypingSpeedUnit("wps");
      },
    },
    {
      id: "setTypingSpeedUnitCps",
      display: "cps",
      configValue: "cps",
      exec: (): void => {
        UpdateConfig.setTypingSpeedUnit("cps");
      },
    },
    {
      id: "setTypingSpeedUnitWph",
      display: "wph",
      configValue: "wph",
      visible: false,
      exec: (): void => {
        UpdateConfig.setTypingSpeedUnit("wph");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeTypingSpeedUnit",
    display: "Typing speed unit...",
    icon: "fa-tachometer-alt",
    subgroup,
  },
];

export default commands;
