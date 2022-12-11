import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Quick end...",
  configKey: "quickEnd",
  list: [
    {
      id: "setQuickEndOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setQuickEnd(false);
      },
    },
    {
      id: "setQuickEndOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setQuickEnd(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeQuickEnd",
    display: "Quick end...",
    icon: "fa-step-forward",
    subgroup,
  },
];

export default commands;
