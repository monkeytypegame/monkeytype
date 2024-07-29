import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeKeymapSize",
    display: "Keymap size...",
    icon: "fa-keyboard",
    alias: "keyboard",
    input: true,
    defaultValue: (): string => {
      return Config.keymapSize.toString();
    },
    exec: ({ input }): void => {
      if (input === undefined || input === "") return;
      UpdateConfig.setKeymapSize(parseFloat(input));
    },
  },
];
export default commands;
