import Config, { setConfig } from "../../config";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import * as ThemeController from "../../controllers/theme-controller";
import { Command, CommandsSubgroup } from "../types";
import { ThemesList, ThemeWithName } from "../../constants/themes";
import { not } from "@monkeytype/util/predicates";
import * as ConfigEvent from "../../observables/config-event";
import * as Misc from "../../utils/misc";

const isFavorite = (theme: ThemeWithName): boolean =>
  Config.favThemes.includes(theme.name);

/**
 * creates a theme command object for the given theme
 * @param theme the theme to create a command for
 * @returns a command object for the theme
 */
const createThemeCommand = (theme: ThemeWithName): Command => {
  return {
    id: "changeTheme" + capitalizeFirstLetterOfEachWord(theme.name),
    display: theme.name.replace(/_/g, " "),
    configValue: theme.name,
    // customStyle: `color:${theme.main};background:${theme.bg};`,
    customData: {
      main: theme.main,
      bg: theme.bg,
      sub: theme.sub,
      text: theme.text,
      isFavorite: isFavorite(theme),
    },
    hover: (): void => {
      // previewTheme(theme.name);
      ThemeController.preview(theme.name);
    },
    exec: (): void => {
      setConfig("theme", theme.name);
    },
  };
};

/**
 * sorts themes with favorites first, then non-favorites
 * @param themes the themes to sort
 * @returns sorted array of themes
 */
const sortThemesByFavorite = (themes: ThemeWithName[]): ThemeWithName[] => [
  ...themes.filter(isFavorite),
  ...themes.filter(not(isFavorite)),
];

const subgroup: CommandsSubgroup = {
  title: "Theme...",
  configKey: "theme",
  list: sortThemesByFavorite(ThemesList).map((theme) =>
    createThemeCommand(theme),
  ),
};

const commands: Command[] = [
  {
    id: "changeTheme",
    display: "Theme...",
    icon: "fa-palette",
    subgroup,
  },
];

export function update(themes: ThemeWithName[]): void {
  // clear the current list
  subgroup.list = [];

  // rebuild with favorites first, then non-favorites
  subgroup.list = sortThemesByFavorite(themes).map((theme) =>
    createThemeCommand(theme),
  );
}

// subscribe to theme-related config events to update the theme command list
ConfigEvent.subscribe(({ key }) => {
  if (key === "favThemes") {
    // update themes list when favorites change
    try {
      update(ThemesList);
    } catch (e: unknown) {
      console.error(
        Misc.createErrorMessage(e, "Failed to update themes commands"),
      );
    }
  }
});

export default commands;
