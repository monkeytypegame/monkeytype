import * as Arrays from "../utils/arrays";
import { isColorDark, isColorLight } from "../utils/colors";
import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import { getCustomTheme, getCustomThemes } from "../queries/custom-themes";
import { showNoticeNotification } from "../states/notifications";
import { CustomThemeColors, ThemeName } from "@monkeytype/schemas/configs";
import { themes, ThemesList } from "../constants/themes";
import {
  prefersDarkScheme,
  setRandomTheme,
  ThemeIdentifier,
} from "../states/theme";

let randomThemeIndex = 0;
let themesList: (ThemeName | string)[] = [];

export function updateThemeList(): void {
  if (Config.randomTheme === "fav" && Config.favThemes.length > 0) {
    themesList = Config.favThemes;
  } else if (Config.randomTheme === "light") {
    themesList = ThemesList.filter((t) => isColorLight(t.bg)).map(
      (t) => t.name,
    );
  } else if (Config.randomTheme === "dark") {
    themesList = ThemesList.filter((t) => isColorDark(t.bg)).map((t) => t.name);
  } else if (Config.randomTheme === "on" || Config.randomTheme === "auto") {
    themesList = ThemesList.map((t) => {
      return t.name;
    });
  } else if (Config.randomTheme === "custom") {
    themesList = getCustomThemes().map((ct) => ct._id);
  }
  Arrays.shuffle(themesList);
  randomThemeIndex = 0;
}

export function randomizeTheme(): void {
  if (themesList.length === 0) {
    updateThemeList();
    if (themesList.length === 0) return;
  }

  // before picking: the configured theme effect clears the random theme
  if (Config.customTheme) {
    setConfig("customTheme", false, {
      nosave: true,
    });
  }

  let filter = (_: string): boolean => true;
  if (Config.randomTheme === "auto") {
    filter = prefersDarkScheme() ? isColorDark : isColorLight;
  }

  let randomTheme: ThemeIdentifier;
  let nextTheme = null;
  do {
    randomTheme = themesList[randomThemeIndex] as ThemeIdentifier;
    nextTheme = themes[themesList[randomThemeIndex] as ThemeName];
    randomThemeIndex++;
    if (randomThemeIndex >= themesList.length) {
      Arrays.shuffle(themesList);
      randomThemeIndex = 0;
    }
  } while (!filter(nextTheme.bg));

  let colorsOverride: CustomThemeColors | undefined;

  if (Config.randomTheme === "custom") {
    const theme = getCustomTheme(randomTheme);
    colorsOverride = theme === undefined ? undefined : [...theme.colors];
    randomTheme = "custom";
  }

  setRandomTheme({ name: randomTheme, colors: colorsOverride });

  if (randomThemeIndex >= themesList.length) {
    let name = randomTheme.replace(/_/g, " ");
    if (Config.randomTheme === "custom") {
      name = (getCustomTheme(randomTheme)?.name ?? "custom").replace(/_/g, " ");
    }
    showNoticeNotification(name);
  }
}
