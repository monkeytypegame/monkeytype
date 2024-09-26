import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Quick restart...",
  configKey: "quickRestart",
  list: [
    {
      id: "changeQuickRestartEnter",
      display: "enter",
      configValue: "enter",
      exec: (): void => {
        UpdateConfig.setQuickRestartMode("enter");
      },
    },
    {
      id: "changeQuickRestartTab",
      display: "tab",
      configValue: "tab",
      exec: (): void => {
        UpdateConfig.setQuickRestartMode("tab");
      },
    },
    {
      id: "changeQuickRestartEsc",
      display: "esc",
      configValue: "esc",
      exec: (): void => {
        UpdateConfig.setQuickRestartMode("esc");
      },
    },
    {
      id: "changeQuickRestartOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setQuickRestartMode("off");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeQuickRestart",
    display: "Quick restart...",
    icon: "fa-redo-alt",
    subgroup,
  },
];

export default commands;
