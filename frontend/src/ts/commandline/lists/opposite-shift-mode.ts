import * as UpdateConfig from "../../config";
import * as ModesNotice from "./../../elements/modes-notice";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Change opposite shift mode...",
  configKey: "oppositeShiftMode",
  list: [
    {
      id: "setOppositeShiftModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setOppositeShiftMode("off");
        ModesNotice.update();
      },
    },
    {
      id: "setOppositeShiftModeOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setOppositeShiftMode("on");
        ModesNotice.update();
      },
    },
    {
      id: "setOppositeShiftModeKeymap",
      display: "keymap",
      configValue: "keymap",
      exec: (): void => {
        UpdateConfig.setOppositeShiftMode("keymap");
        ModesNotice.update();
      },
    },
  ],
};

export default commands;
