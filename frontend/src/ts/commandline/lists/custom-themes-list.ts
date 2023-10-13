import * as UpdateConfig from "../../config";
import { Auth } from "../../firebase";
import * as DB from "../../db";
import * as ThemeController from "../../controllers/theme-controller";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Custom themes list...",
  // configKey: "customThemeId",
  beforeList: (): void => update(),
  list: [],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "setCustomThemeId",
    display: "Custom themes...",
    icon: "fa-palette",
    subgroup,
    available: (): boolean => {
      return !!Auth?.currentUser;
    },
  },
];

export function update(): void {
  if (!Auth?.currentUser) {
    return;
  }

  subgroup.list = [];

  const snapshot = DB.getSnapshot();

  if (!snapshot) return;

  if (snapshot.customThemes.length === 0) {
    return;
  }
  snapshot.customThemes.forEach((theme) => {
    subgroup.list.push({
      id: "setCustomThemeId" + theme._id,
      display: theme.name.replace(/_/gi, " "),
      configValue: theme._id,
      hover: (): void => {
        ThemeController.preview("custom", theme.colors);
      },
      exec: (): void => {
        // UpdateConfig.setCustomThemeId(theme._id);
        UpdateConfig.setCustomTheme(true);
        UpdateConfig.setCustomThemeColors(theme.colors);
      },
    });
  });
}

export default commands;
