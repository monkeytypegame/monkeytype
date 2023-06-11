import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.Command[] = [
  {
    id: "smoothCaretSpeed",
    display: "Smooth Caret Speed...",
    icon: "fa-i-cursor",
    input: true,
    defaultValue: (): string => {
      return Config.smoothCaretSpeed.toString();
    },
    exec: (input): void => {
      if (!input) return;
      UpdateConfig.setSmoothCaretSpeed(parseFloat(input));
    },
  },
];

export default commands;
