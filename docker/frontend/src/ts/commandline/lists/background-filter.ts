import Config, { setConfig } from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Custom background filter...",
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
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        const newFilters = Config.customBackgroundFilter;
        newFilters[0] = parseFloat(input);
        setConfig("customBackgroundFilter", newFilters);
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
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        const newFilters = Config.customBackgroundFilter;
        newFilters[1] = parseFloat(input);
        setConfig("customBackgroundFilter", newFilters);
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
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        const newFilters = Config.customBackgroundFilter;
        newFilters[2] = parseFloat(input);
        setConfig("customBackgroundFilter", newFilters);
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
      exec: ({ input }): void => {
        if (input === undefined || input === "") return;
        const newFilters = Config.customBackgroundFilter;
        newFilters[3] = parseFloat(input);
        setConfig("customBackgroundFilter", newFilters);
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "setCustomBackgroundFilter",
    display: "Custom background filter...",
    icon: "fa-image",
    subgroup,
  },
];

export default commands;
