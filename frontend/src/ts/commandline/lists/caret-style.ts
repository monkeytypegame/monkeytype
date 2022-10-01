import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Caret style...",
  configKey: "caretStyle",
  list: [
    {
      id: "setCaretStyleOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setCaretStyle("off");
      },
    },
    {
      id: "setCaretStyleDefault",
      display: "line",
      configValue: "default",
      exec: (): void => {
        UpdateConfig.setCaretStyle("default");
      },
    },
    {
      id: "setCaretStyleBlock",
      display: "block",
      configValue: "block",
      exec: (): void => {
        UpdateConfig.setCaretStyle("block");
      },
    },
    {
      id: "setCaretStyleOutline",
      display: "outline-block",
      configValue: "outline",
      exec: (): void => {
        UpdateConfig.setCaretStyle("outline");
      },
    },
    {
      id: "setCaretStyleUnderline",
      display: "underline",
      configValue: "underline",
      exec: (): void => {
        UpdateConfig.setCaretStyle("underline");
      },
    },
    {
      id: "setCaretStyleCarrot",
      display: "carrot",
      configValue: "carrot",
      visible: false,
      exec: (): void => {
        UpdateConfig.setCaretStyle("carrot");
      },
    },
    {
      id: "setCaretStyleBanana",
      display: "banana",
      configValue: "banana",
      visible: false,
      exec: (): void => {
        UpdateConfig.setCaretStyle("banana");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeCaretStyle",
    display: "Caret style...",
    icon: "fa-i-cursor",
    subgroup,
  },
];

export default commands;
