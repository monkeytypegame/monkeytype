import * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Keymap show top row...",
  configKey: "keymapShowTopRow",
  list: [
    {
      id: "keymapShowTopRowAlways",
      display: "always",
      configValue: "always",
      exec: (): void => {
        UpdateConfig.setKeymapShowTopRow("always");
      },
    },
    {
      id: "keymapShowTopRowLayout",
      display: "layout dependent",
      configValue: "layout",
      exec: (): void => {
        UpdateConfig.setKeymapShowTopRow("layout");
      },
    },
    {
      id: "keymapShowTopRowNever",
      display: "never",
      configValue: "never",
      exec: (): void => {
        UpdateConfig.setKeymapShowTopRow("never");
      },
    },
  ],
};

export default commands;
