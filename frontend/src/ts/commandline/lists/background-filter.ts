import Config, * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "custom background filter...",
  configKey: "customBackgroundFilter",
  list: [
    {
      id: "setCustomBackgroundBlur",
      display: "blur...",
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
      display: "brightness...",
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
      display: "saturation...",
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
      display: "opacity...",
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
    display: "custom background filter...",
    icon: "fa-image",
    subgroup,
  },
];

export default commands;
