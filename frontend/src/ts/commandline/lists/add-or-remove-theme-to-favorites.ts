import { ThemeName } from "@monkeytype/schemas/configs";
import { getConfig } from "../../config/store";
import { setConfig } from "../../config/setters";
import { getRandomTheme } from "../../theme/state";
import { Command } from "../types";

const getCurrentTheme = (): ThemeName =>
  (getRandomTheme()?.name as ThemeName | undefined) ?? getConfig.theme;

const commands: Command[] = [
  {
    id: "addThemeToFavorite",
    display: "Add current theme to favorite",
    fa: { icon: "fa-star" },
    available: (): boolean => {
      return (
        !getConfig.customTheme &&
        !getConfig.favThemes.includes(getCurrentTheme())
      );
    },
    exec: (): void => {
      const { favThemes, customTheme } = getConfig;
      const themeToUpdate = getCurrentTheme();
      if (!customTheme && !favThemes.includes(themeToUpdate)) {
        setConfig("favThemes", [...favThemes, themeToUpdate]);
      }
    },
  },
  {
    id: "removeThemeFromFavorite",
    display: "Remove current theme from favorite",
    fa: { icon: "fa-star", variant: "regular" },
    available: (): boolean => {
      return (
        !getConfig.customTheme &&
        getConfig.favThemes.includes(getCurrentTheme())
      );
    },
    exec: (): void => {
      const { favThemes, customTheme } = getConfig;
      const themeToUpdate = getCurrentTheme();
      if (!customTheme && favThemes.includes(themeToUpdate)) {
        setConfig("favThemes", [
          ...favThemes.filter((t) => t !== themeToUpdate),
        ]);
      }
    },
  },
];

export default commands;
