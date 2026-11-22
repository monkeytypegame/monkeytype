import * as Arrays from "../utils/arrays";
import { isColorDark, isColorLight } from "../utils/colors";
import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import { getCustomTheme, getCustomThemes } from "../queries/custom-themes";
import { ThemeName } from "@monkeytype/schemas/configs";
import { themes, ThemesList } from "../constants/themes";
import { prefersDarkScheme, setRandomTheme } from "./state";

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

  if (Config.randomTheme === "custom") {
    const theme = getCustomTheme(nextFromList());
    setRandomTheme({
      name: "custom",
      colors: theme === undefined ? undefined : [...theme.colors],
    });
    return;
  }

  let filter = (_: string): boolean => true;
  if (Config.randomTheme === "auto") {
    filter = prefersDarkScheme() ? isColorDark : isColorLight;
  }

  let randomTheme: ThemeName;
  do {
    randomTheme = nextFromList() as ThemeName;
  } while (!filter(themes[randomTheme].bg));

  setRandomTheme({ name: randomTheme });
}

/** The next entry of the shuffled list, reshuffling at its end. */
function nextFromList(): string {
  const next = themesList[randomThemeIndex] as string;
  randomThemeIndex++;
  if (randomThemeIndex >= themesList.length) {
    Arrays.shuffle(themesList);
    randomThemeIndex = 0;
  }
  return next;
}
