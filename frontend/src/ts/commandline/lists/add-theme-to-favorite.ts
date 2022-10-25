import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.Command[] = [
  {
    id: "addThemeToFavorite",
    display: "Add current theme to favorite...",
    icon: "fa-heart",
    exec: (): void => {
      const { theme, favThemes } = Config;
      if (!favThemes.includes(theme)) {
        UpdateConfig.setFavThemes([...favThemes, theme]);
      }
    },
  },
];

export default commands;
