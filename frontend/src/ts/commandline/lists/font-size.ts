import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeFontSize",
    display: "Font size...",
    icon: "fa-font",
    input: true,
    defaultValue: (): string => {
      return Config.fontSize.toString();
    },
    exec: ({ input }): void => {
      if (input === undefined || input === "") return;
      UpdateConfig.setFontSize(parseFloat(input));
    },
  },
];
export default commands;
