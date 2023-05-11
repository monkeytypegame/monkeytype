import Config, * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Custom background filter...",
  configKey: "customBackgroundFilter",
  list: [
    {
      id: "setCustomBackgroundBlur",
      display: "Blur...",
      icon: "fa-image",
      input: true,
      defaultValue: (): string => {
        return Config.customBackgroundFilter[0].toString();
      },
      exec: (input): void => {
        if (!input) return;
        const tempArr = Config.customBackgroundFilter;
        tempArr[0] = parseFloat(input);
        UpdateConfig.setCustomBackgroundFilter(tempArr);
      },
    },
    {
      id: "setCustomBackgroundBrightness",
      display: "Brightness...",
      icon: "fa-image",
      input: true,
      defaultValue: (): string => {
        return Config.customBackgroundFilter[1].toString();
      },
      exec: (input): void => {
        if (!input) return;
        const tempArr = Config.customBackgroundFilter;
        tempArr[1] = parseFloat(input);
        UpdateConfig.setCustomBackgroundFilter(tempArr);
      },
    },
    {
      id: "setCustomBackgroundSaturation",
      display: "Saturation...",
      icon: "fa-image",
      input: true,
      defaultValue: (): string => {
        return Config.customBackgroundFilter[2].toString();
      },
      exec: (input): void => {
        if (!input) return;
        const tempArr = Config.customBackgroundFilter;
        tempArr[2] = parseFloat(input);
        UpdateConfig.setCustomBackgroundFilter(tempArr);
      },
    },
    {
      id: "setCustomBackgroundOpacity",
      display: "Opacity...",
      icon: "fa-image",
      input: true,
      defaultValue: (): string => {
        return Config.customBackgroundFilter[3].toString();
      },
      exec: (input): void => {
        if (!input) return;
        const tempArr = Config.customBackgroundFilter;
        tempArr[3] = parseFloat(input);
        UpdateConfig.setCustomBackgroundFilter(tempArr);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "setCustomBackgroundFilter",
    display: "Custom background filter...",
    icon: "fa-image",
    subgroup,
  },
];

export default commands;
