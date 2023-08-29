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

  if (DB.getSnapshot()?.customThemes.length === 0) {
    return;
  }
  DB.getSnapshot()?.customThemes.forEach((theme) => {
    subgroup.list.push({
      id: "setCustomThemeId" + theme._id,
      display: theme.name.replace(/_/gi, " "),
      configValue: theme._id,
      hover: (): void => {
        ThemeController.preview(theme._id, true);
      },
      exec: (): void => {
        // UpdateConfig.setCustomThemeId(theme._id);
        UpdateConfig.setCustomTheme(true);
        ThemeController.set(theme._id, true);
      },
    });
  });
}

export default commands;
