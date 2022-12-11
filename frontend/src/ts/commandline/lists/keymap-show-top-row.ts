import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
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

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeKeymapShowTopRow",
    display: "Keymap show top row...",
    alias: "keyboard",
    icon: "fa-keyboard",
    subgroup,
  },
];

export default commands;
