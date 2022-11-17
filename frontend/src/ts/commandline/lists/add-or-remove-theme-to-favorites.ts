import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.Command[] = [
  {
    id: "addThemeToFavorite",
    display: "Add current theme to favorite",
    icon: "fa-heart",
    available: (): boolean => {
      return !Config.customTheme && !Config.favThemes.includes(Config.theme);
    },
    exec: (): void => {
      const { theme, favThemes, customTheme } = Config;
      if (!customTheme && !favThemes.includes(theme)) {
        UpdateConfig.setFavThemes([...favThemes, theme]);
      }
    },
  },
  {
    id: "removeThemeFromFavorite",
    display: "Remove current theme from favorite",
    icon: "fa-heart-broken",
    available: (): boolean => {
      return !Config.customTheme && Config.favThemes.includes(Config.theme);
    },
    exec: (): void => {
      const { theme, favThemes, customTheme } = Config;
      if (!customTheme && favThemes.includes(theme)) {
        UpdateConfig.setFavThemes([...favThemes.filter((t) => t !== theme)]);
      }
    },
  },
];

export default commands;
