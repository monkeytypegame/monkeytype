import Config, * as UpdateConfig from "../../config";
import { capitalizeFirstLetterOfEachWord } from "../../utils/misc";
import * as ThemeController from "../../controllers/theme-controller";

export const commands: MonkeyTypes.CommandsGroup = {
  title: "Theme...",
  configKey: "theme",
  list: [],
};

function update(themes: MonkeyTypes.Theme[]): void {
  commands.list = [];
  if (Config.favThemes.length > 0) {
    Config.favThemes.forEach((theme: string) => {
      commands.list.push({
        id: "changeTheme" + capitalizeFirstLetterOfEachWord(theme),
        display: theme.replace(/_/g, " "),
        hover: (): void => {
          // previewTheme(theme);
          ThemeController.preview(theme, false);
        },
        exec: (): void => {
          UpdateConfig.setTheme(theme);
        },
      });
    });
  }
  themes.forEach((theme) => {
    if ((Config.favThemes as string[]).includes(theme.name)) return;
    commands.list.push({
      id: "changeTheme" + capitalizeFirstLetterOfEachWord(theme.name),
      display: theme.name.replace(/_/g, " "),
      hover: (): void => {
        // previewTheme(theme.name);
        ThemeController.preview(theme.name, false);
      },
      exec: (): void => {
        UpdateConfig.setTheme(theme.name);
      },
    });
  });
}

export default commands;
export { update };
