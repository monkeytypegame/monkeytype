import Config, * as UpdateConfig from "../../config";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import * as ThemeController from "../../controllers/theme-controller";
import { Command, CommandsSubgroup } from "../types";
import { Theme, ThemesList } from "../../constants/themes";
import { not } from "@monkeytype/util/predicates";

const isFavorite = (theme: Theme): boolean =>
  Config.favThemes.includes(theme.name);

const subgroup: CommandsSubgroup = {
  title: "Theme...",
  configKey: "theme",
  list: [
    ...ThemesList.filter(isFavorite),
    ...ThemesList.filter(not(isFavorite)),
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

export function update(themes: Theme[]): void {
  // clear the current list
  subgroup.list = [];

  // rebuild with favorites first, then non-favorites
  subgroup.list = [
    ...themes.filter(isFavorite),
    ...themes.filter(not(isFavorite)),
  ].map((theme: Theme) => ({
    id: "changeTheme" + capitalizeFirstLetterOfEachWord(theme.name),
    display: theme.name.replace(/_/g, " "),
    configValue: theme.name,
    // customStyle: `color:${theme.mainColor};background:${theme.bgColor}`,
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
    // custom HTML element for the favorite star
    html: `<div class="themeFavIcon ${isFavorite(theme) ? "active" : ""}">
            <i class="${isFavorite(theme) ? "fas" : "far"} fa-star"></i>
          </div>`,
  }));
}
export default commands;
