import Config, * as UpdateConfig from "../../config";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import * as ThemeController from "../../controllers/theme-controller";
import { Command, CommandsSubgroup } from "../types";
import { Theme, ThemesList } from "../../constants/themes";

const subgroup: CommandsSubgroup = {
  title: "Theme...",
  configKey: "theme",
  list: [
    ...ThemesList.filter((it) => Config.favThemes.includes(it.name)),
    ...ThemesList.filter((it) => !Config.favThemes.includes(it.name)),
  ].map((theme: Theme) => ({
    id: "changeTheme" + capitalizeFirstLetterOfEachWord(theme.name),
    display: theme.name.replace(/_/g, " "),
    configValue: theme.name,
    // customStyle: `color:${theme.mainColor};background:${theme.bgColor};`,
    customData: {
      mainColor: theme.mainColor,
      bgColor: theme.bgColor,
      subColor: theme.subColor,
      textColor: theme.textColor,
    },
    hover: (): void => {
      // previewTheme(theme.name);
      ThemeController.preview(theme.name);
    },
    exec: (): void => {
      UpdateConfig.setTheme(theme.name);
    },
  })),
};

const commands: Command[] = [
  {
    id: "changeTheme",
    display: "Theme...",
    icon: "fa-palette",
    subgroup,
  },
];

export default commands;
