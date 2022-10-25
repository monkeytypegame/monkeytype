import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.Command[] = [
  {
    id: "addThemeToFavorite",
    display: "Add current theme to favorite...",
    icon: "fa-heart",
    exec: (): void => {
      const { theme, favThemes } = Config;
      console.log(theme);
      if (favThemes.includes(theme)) {
        UpdateConfig.setFavThemes([...favThemes.filter((t) => t !== theme)]);
      } else {
        UpdateConfig.setFavThemes([...favThemes, theme]);
      }
    },
  },
];

export default commands;
