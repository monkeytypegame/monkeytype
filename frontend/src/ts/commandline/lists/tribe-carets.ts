import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";
import { getTribeMode } from "../../utils/misc";

const subgroup: CommandsSubgroup = {
  title: "Tribe carets...",
  configKey: "tribeCarets",
  list: [
    {
      id: "setTribeCaretsOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setConfig("tribeCarets", "off");
      },
    },
    {
      id: "setTribeCaretsNoNames",
      display: "no names",
      configValue: "noNames",
      exec: (): void => {
        UpdateConfig.setConfig("tribeCarets", "noNames");
      },
    },
    {
      id: "setTribeCaretsOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setConfig("tribeCarets", "on");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeTribeCarets",
    display: "Tribe carets...",
    icon: "fa-i-cursor",
    minimumSearchQuery: "tribe",
    subgroup,
    available: (): boolean => getTribeMode() !== "disabled",
  },
];

export default commands;
