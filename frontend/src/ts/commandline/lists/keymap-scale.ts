import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeKeymapScale",
    display: "Keymap scale...",
    icon: "fa-keyboard",
    alias: "keyboard",
    input: true,
    defaultValue: (): string => {
      return Config.keymapScale.toString();
    },
    exec: ({ input }): void => {
      if (input === undefined || input === "") return;
      UpdateConfig.setKeymapScale(parseFloat(input));
    },
  },
];
export default commands;
