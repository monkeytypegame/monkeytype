import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Highlight mode...",
  configKey: "highlightMode",
  list: [
    {
      id: "setHighlightModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setHighlightMode("off");
      },
    },
    {
      id: "setHighlightModeLetter",
      display: "letter",
      configValue: "letter",
      exec: (): void => {
        UpdateConfig.setHighlightMode("letter");
      },
    },
    {
      id: "setHighlightModeWord",
      display: "word",
      configValue: "word",
      exec: (): void => {
        UpdateConfig.setHighlightMode("word");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeHighlightMode",
    display: "Highlight mode...",
    icon: "fa-highlighter",
    subgroup,
  },
];

export default commands;
