import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Smooth caret...",
  configKey: "smoothCaret",
  list: [
    {
      id: "changeSmoothCaretOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setSmoothCaret(true);
      },
    },
    {
      id: "changeSmoothCaretOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setSmoothCaret(false);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeSmoothCaret",
    display: "Smooth caret...",
    icon: "fa-i-cursor",
    subgroup,
  },
];

export default commands;
