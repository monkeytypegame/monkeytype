import * as UpdateConfig from "../../config.js";
import { isAuthenticated } from "../../firebase.js";
import * as DB from "../../db.js";
import * as ThemeController from "../../controllers/theme-controller.js";

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
      return isAuthenticated();
    },
  },
];

export function update(): void {
  if (!isAuthenticated()) {
    return;
  }

  subgroup.list = [];

  const snapshot = DB.getSnapshot();

  if (!snapshot) return;

  if (snapshot.customThemes === undefined) {
    return;
  }

  if (snapshot.customThemes?.length === 0) {
    return;
  }
  for (const theme of snapshot.customThemes) {
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
  }
}

export default commands;
