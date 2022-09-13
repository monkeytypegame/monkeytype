import * as UpdateConfig from "../../config";
import { capitalizeFirstLetterOfEachWord } from "../../utils/misc";
import * as ThemeController from "../../controllers/theme-controller";

export const commands: MonkeyTypes.CommandsGroup = {
  title: "Theme...",
  configKey: "theme",
  list: [],
};

function update(themes: MonkeyTypes.Theme[]): void {
  commands.list = [];
  themes.forEach((theme) => {
    commands.list.push({
      id: "changeTheme" + capitalizeFirstLetterOfEachWord(theme.name),
      display: theme.name.replace(/_/g, " "),
      configValue: theme.name,
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
