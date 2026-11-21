import { setConfig } from "../../config/setters";
import { isAuthenticated } from "../../auth/state";
import { previewTheme } from "../../theme";
import { getCustomThemes } from "../../queries/custom-themes";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Custom themes list...",
  // configKey: "customThemeId",
  beforeList: (): void => update(),
  list: [],
};

const commands: Command[] = [
  {
    id: "setCustomThemeId",
    display: "Custom themes...",
    fa: { icon: "fa-palette" },
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

  const customThemes = getCustomThemes();
  for (const theme of customThemes) {
    subgroup.list.push({
      id: `setCustomThemeId${theme._id}`,
      display: theme.name.replace(/_/gi, " "),
      configValue: theme._id,
      hover: (): void => {
        previewTheme("custom", [...theme.colors]);
      },
      exec: (): void => {
        setConfig("customTheme", true);
        setConfig("customThemeColors", [...theme.colors]);
      },
    });
  }
}

export default commands;
