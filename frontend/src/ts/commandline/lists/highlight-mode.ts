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
    {
      id: "setHighlightModeNextWord",
      display: "next word",
      configValue: "next_word",
      exec: (): void => {
        UpdateConfig.setHighlightMode("next_word");
      },
    },
    {
      id: "setHighlightModeNextTwoWords",
      display: "next two words",
      configValue: "next_two_words",
      exec: (): void => {
        UpdateConfig.setHighlightMode("next_two_words");
      },
    },
    {
      id: "setHighlightModeNextThreeWords",
      display: "next three words",
      configValue: "next_three_words",
      exec: (): void => {
        UpdateConfig.setHighlightMode("next_three_words");
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
