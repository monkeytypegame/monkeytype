import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.Command[] = [
  {
    id: "removeThemeToFavorite",
    display: "Remove current theme to favorite...",
    icon: "fa-trash",
    available: (): boolean => {
      return Config.favThemes.includes(Config.theme);
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
