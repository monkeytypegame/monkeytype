import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Smooth caret...",
  configKey: "smoothCaret",
  list: [
    {
      id: "changeSmoothCaretoff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setSmoothCaret("off");
      },
    },
    {
      id: "changeSmoothCaretSlow",
      display: "slow",
      configValue: "slow",
      exec: (): void => {
        UpdateConfig.setSmoothCaret("slow");
      },
    },
    {
      id: "changeSmoothCaretMedium",
      display: "medium",
      configValue: "medium",
      exec: (): void => {
        UpdateConfig.setSmoothCaret("medium");
      },
    },
    {
      id: "changeSmoothCaretFast",
      display: "fast",
      configValue: "fast",
      exec: (): void => {
        UpdateConfig.setSmoothCaret("fast");
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
