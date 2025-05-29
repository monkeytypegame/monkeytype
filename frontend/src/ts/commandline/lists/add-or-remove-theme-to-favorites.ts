import { ThemeName } from "@monkeytype/contracts/schemas/configs";
import Config, * as UpdateConfig from "../../config";
import { randomTheme } from "../../controllers/theme-controller";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "addThemeToFavorite",
    display: "Add current theme to favorite",
    icon: "fa-star",
    available: (): boolean => {
      return (
        !Config.customTheme &&
        !Config.favThemes.includes((randomTheme as ThemeName) ?? Config.theme)
      );
    },
    exec: (): void => {
      const { theme, favThemes, customTheme } = Config;
      const themeToUpdate = randomTheme ?? theme;
      if (!customTheme && !favThemes.includes(themeToUpdate as ThemeName)) {
        UpdateConfig.setFavThemes([...favThemes, themeToUpdate as ThemeName]);
      }
    },
  },
  {
    id: "removeThemeFromFavorite",
    display: "Remove current theme from favorite",
    icon: "fa-star",
    iconType: "regular",
    available: (): boolean => {
      return (
        !Config.customTheme &&
        Config.favThemes.includes((randomTheme as ThemeName) ?? Config.theme)
      );
    },
    exec: (): void => {
      const { theme, favThemes, customTheme } = Config;
      const themeToUpdate = (randomTheme as ThemeName) ?? theme;
      if (!customTheme && favThemes.includes(themeToUpdate)) {
        UpdateConfig.setFavThemes([
          ...favThemes.filter((t) => t !== themeToUpdate),
        ]);
      }
    },
  },
];

export default commands;
