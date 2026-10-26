import { createRoot } from "solid-js";
import { Config, getConfig } from "../../config/store";
import { setConfig } from "../../config/setters";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import * as ThemeController from "../../controllers/theme-controller";
import { Command, CommandsSubgroup } from "../types";
import { ThemesList, ThemeWithName } from "../../constants/themes";
import { not } from "@monkeytype/util/predicates";
import { createEffectOn } from "../../hooks/effects";
import * as getErrorMessage from "../../utils/error";

const isFavorite = (theme: ThemeWithName): boolean =>
  Config.favThemes.includes(theme.name);

/**
 * creates a theme command object for the given theme
 * @param theme the theme to create a command for
 * @returns a command object for the theme
 */
const createThemeCommand = (theme: ThemeWithName): Command => {
  return {
    id: `changeTheme${capitalizeFirstLetterOfEachWord(theme.name)}`,
    display: theme.name.replace(/_/g, " "),
    configValue: theme.name,
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
      void ThemeController.clearRandom();
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

// a root so the effect is owned, it lives as long as the page
createRoot(() => {
  // rebuild with the new favorites first
  createEffectOn(
    () => [...getConfig.favThemes],
    () => {
      try {
        update(ThemesList);
      } catch (e: unknown) {
        console.error(
          getErrorMessage.createErrorMessage(
            e,
            "Failed to update themes commands",
          ),
        );
      }
    },
    { defer: true },
  );
});

export default commands;
