import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.Command[] = [
  {
    id: "addThemeToFavorite",
    display: "Add current theme to favorite...",
    icon: "fa-heart",
    available: (): boolean => {
      return !Config.favThemes.includes(Config.theme);
    },
    exec: (): void => {
      const { theme, favThemes, customTheme } = Config;
      if (!customTheme && !favThemes.includes(theme)) {
        UpdateConfig.setFavThemes([...favThemes, theme]);
      }
    },
  },
];

export default commands;
