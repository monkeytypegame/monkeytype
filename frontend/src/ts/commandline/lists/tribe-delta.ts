import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";
import { isTribeEnabled } from "../../utils/misc";

const subgroup: CommandsSubgroup = {
  title: "Tribe delta...",
  configKey: "tribeDelta",
  list: [
    {
      id: "setTribeDeltaOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setConfig("tribeDelta", "off");
      },
    },
    {
      id: "setTribeDeltaText",
      display: "text",
      configValue: "text",
      exec: (): void => {
        UpdateConfig.setConfig("tribeDelta", "text");
      },
    },
    {
      id: "setTribeDeltaBar",
      display: "bar",
      configValue: "bar",
      exec: (): void => {
        UpdateConfig.setConfig("tribeDelta", "bar");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeTribeDelta",
    display: "Tribe delta...",
    icon: "fa-exchange-alt",
    subgroup,
    available: (): boolean => isTribeEnabled(),
  },
];

export default commands;
