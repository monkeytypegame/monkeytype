import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Tribe delta...",
  configKey: "tribeDelta",
  list: [
    {
      id: "setTribeDeltaOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setTribeDelta("off");
      },
    },
    {
      id: "setTribeDeltaText",
      display: "text",
      configValue: "text",
      exec: (): void => {
        UpdateConfig.setTribeDelta("text");
      },
    },
    {
      id: "setTribeDeltaBar",
      display: "bar",
      configValue: "bar",
      exec: (): void => {
        UpdateConfig.setTribeDelta("bar");
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
  },
];

export default commands;
