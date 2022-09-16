import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Keymap mode...",
  configKey: "keymapMode",
  list: [
    {
      id: "setKeymapModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setKeymapMode("off");
      },
    },
    {
      id: "setKeymapModeStatic",
      display: "static",
      configValue: "static",
      exec: (): void => {
        UpdateConfig.setKeymapMode("static");
      },
    },
    {
      id: "setKeymapModeNext",
      display: "next",
      configValue: "next",
      exec: (): void => {
        UpdateConfig.setKeymapMode("next");
      },
    },
    {
      id: "setKeymapModeReact",
      display: "react",
      alias: "flash",
      configValue: "react",
      exec: (): void => {
        UpdateConfig.setKeymapMode("react");
      },
    },
  ],
};

export default commands;
