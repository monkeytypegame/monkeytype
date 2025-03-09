import Config, * as UpdateConfig from "../../config";
import { randomTheme } from "../../controllers/theme-controller";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "addThemeToFavorite",
    display: "Add current theme to favorite",
    icon: "fa-heart",
    available: (): boolean => {
      return (
        !Config.customTheme &&
        !Config.favThemes.includes(randomTheme ?? Config.theme)
      );
    },
    exec: (): void => {
      const { theme, favThemes, customTheme } = Config;
      const themeToUpdate = randomTheme ?? theme;
      if (!customTheme && !favThemes.includes(themeToUpdate)) {
        UpdateConfig.setFavThemes([...favThemes, themeToUpdate]);
      }
    },
  },
  {
    id: "removeThemeFromFavorite",
    display: "Remove current theme from favorite",
    icon: "fa-heart-broken",
    available: (): boolean => {
      return (
        !Config.customTheme &&
        Config.favThemes.includes(randomTheme ?? Config.theme)
      );
    },
    exec: (): void => {
      const { theme, favThemes, customTheme } = Config;
      const themeToUpdate = randomTheme ?? theme;
      if (!customTheme && favThemes.includes(themeToUpdate)) {
        UpdateConfig.setFavThemes([
          ...favThemes.filter((t) => t !== themeToUpdate),
        ]);
      }
    },
  },
];

export default commands;
