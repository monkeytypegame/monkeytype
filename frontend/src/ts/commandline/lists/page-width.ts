import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Page width...",
  configKey: "pageWidth",
  list: [
    {
      id: "setPageWidth100",
      display: "100",
      configValue: "100",
      exec: (): void => {
        UpdateConfig.setPageWidth("100");
      },
    },
    {
      id: "setPageWidth125",
      display: "125",
      configValue: "125",
      exec: (): void => {
        UpdateConfig.setPageWidth("125");
      },
    },
    {
      id: "setPageWidth150",
      display: "150",
      configValue: "150",
      exec: (): void => {
        UpdateConfig.setPageWidth("150");
      },
    },
    {
      id: "setPageWidth200",
      display: "200",
      configValue: "200",
      exec: (): void => {
        UpdateConfig.setPageWidth("200");
      },
    },
    {
      id: "setPageWidthMax",
      display: "max",
      configValue: "max",
      exec: (): void => {
        UpdateConfig.setPageWidth("max");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changePageWidth",
    display: "Page width...",
    icon: "fa-arrows-alt-h",
    subgroup,
  },
];

export default commands;
