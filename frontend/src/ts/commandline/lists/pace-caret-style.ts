import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Change pace caret style...",
  configKey: "paceCaretStyle",
  list: [
    {
      id: "setPaceCaretStyleOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("off");
      },
    },
    {
      id: "setPaceCaretStyleDefault",
      display: "line",
      configValue: "default",
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("default");
      },
    },
    {
      id: "setPaceCaretStyleBlock",
      display: "block",
      configValue: "block",
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("block");
      },
    },
    {
      id: "setPaceCaretStyleOutline",
      display: "outline-block",
      configValue: "outline",
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("outline");
      },
    },
    {
      id: "setPaceCaretStyleUnderline",
      display: "underline",
      configValue: "underline",
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("underline");
      },
    },
    {
      id: "setPaceCaretStyleCarrot",
      display: "carrot",
      configValue: "carrot",
      visible: false,
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("carrot");
      },
    },
    {
      id: "setPaceCaretStyleBanana",
      display: "banana",
      configValue: "banana",
      visible: false,
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("banana");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changePaceCaretStyle",
    display: "Pace caret style...",
    icon: "fa-i-cursor",
    subgroup,
  },
];

export default commands;
