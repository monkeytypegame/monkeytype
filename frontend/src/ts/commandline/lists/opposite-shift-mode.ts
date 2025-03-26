import * as UpdateConfig from "../../config";
import * as ModesNotice from "./../../elements/modes-notice";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Change opposite shift mode...",
  configKey: "oppositeShiftMode",
  list: [
    {
      id: "setOppositeShiftModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setOppositeShiftMode("off");
        void ModesNotice.update();
      },
    },
    {
      id: "setOppositeShiftModeOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setOppositeShiftMode("on");
        void ModesNotice.update();
      },
    },
    {
      id: "setOppositeShiftModeKeymap",
      display: "keymap",
      configValue: "keymap",
      exec: (): void => {
        UpdateConfig.setOppositeShiftMode("keymap");
        void ModesNotice.update();
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeOppositeShiftMode",
    display: "Change opposite shift mode...",
    icon: "fa-exchange-alt",
    subgroup,
  },
];

export default commands;
