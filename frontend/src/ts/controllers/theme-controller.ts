import { createMemo, createRoot } from "solid-js";
import * as Arrays from "../utils/arrays";
import { isColorDark, isColorLight } from "../utils/colors";

import { Config, getConfig } from "../config/store";
import { setConfig } from "../config/setters";
import { createEffectOn } from "../hooks/effects";
import * as CustomThemes from "../collections/custom-themes";
import { showNoticeNotification } from "../states/notifications";
import { debounce } from "throttle-debounce";
import { CustomThemeColors, ThemeName } from "@monkeytype/schemas/configs";
import { Theme, themes, ThemesList } from "../constants/themes";
import { setThemeIndicator } from "../states/core";
import {
  cacheThemeColors,
  getTheme,
  setTheme,
  ThemeIdentifier,
} from "../states/theme";

export let randomTheme: ThemeIdentifier | null = null;
let isPreviewingTheme = false;
let randomThemeIndex = 0;

export function applyPreset(name: ThemeName): void {
  void apply(name);
}

export function convertCustomColorsToTheme(colors: CustomThemeColors): Theme {
  return {
    bg: colors[0],
    main: colors[1],
    caret: colors[2],
    sub: colors[3],
    subAlt: colors[4],
    text: colors[5],
    error: colors[6],
    errorExtra: colors[7],
    colorfulError: colors[8],
    colorfulErrorExtra: colors[9],
  };
}
export function convertThemeToCustomColors(theme: Theme): CustomThemeColors {
  return [
    theme.bg,
    theme.main,
    theme.caret,
    theme.sub,
    theme.subAlt,
    theme.text,
    theme.error,
    theme.errorExtra,
    theme.colorfulError,
    theme.colorfulErrorExtra,
  ];
}

async function apply(
  themeName: ThemeIdentifier,
  customColorsOverride?: CustomThemeColors,
  isPreview = false,
): Promise<void> {
  console.debug(`Theme controller applying theme ${themeName}`, {
    customColorsOverride,
    isPreview,
  });

  const isCustom = themeName === "custom";

  const themeColors = isCustom
    ? convertCustomColorsToTheme(
        customColorsOverride ?? Config.customThemeColors,
      )
    : themes[themeName];

  setTheme({ ...themeColors, name: themeName });

  updateThemeIndicator(isPreview ? themeName : undefined);
}

function updateThemeIndicator(nameOverride?: string): void {
  //text
  let str: string = Config.theme;
  if (randomTheme !== null) str = randomTheme;

  if (Config.customTheme && nameOverride === undefined) {
    // Match current custom theme by colors since Config does not store custom theme IDs
    const matchedTheme = CustomThemes.__nonReactive
      .getCustomThemes()
      .find((ct) =>
        Arrays.areSortedArraysEqual(ct.colors, Config.customThemeColors),
      );

    if (matchedTheme) {
      str = `${matchedTheme.name} (custom)`;
    } else {
      str = "custom";
    }
  }

  if (nameOverride !== undefined && nameOverride !== "") str = nameOverride;
  str = str.replace(/_/g, " ");

  //fav icon
  const currentTheme = nameOverride ?? randomTheme ?? Config.theme;
  const isFavorite =
    !Config.customTheme &&
    currentTheme !== null &&
    Config.favThemes.includes(currentTheme as ThemeName);

  setThemeIndicator({ text: str, isFavorite });
}

type PreviewState = {
  theme: ThemeIdentifier;
  colors?: CustomThemeColors;
} | null;

let previewState: PreviewState = null;

export function preview(
  themeIdentifier: ThemeIdentifier,
  customColorsOverride?: CustomThemeColors,
): void {
  previewState = { theme: themeIdentifier, colors: customColorsOverride };
  debouncedPreview();
}

const debouncedPreview = debounce<() => void>(250, () => {
  if (previewState) {
    isPreviewingTheme = true;
    void apply(previewState.theme, previewState.colors, true);
  }
});

async function set(
  themeIdentifier: ThemeIdentifier,
  isAutoSwitch = false,
): Promise<void> {
  console.debug("Theme controller setting theme", themeIdentifier, {
    isAutoSwitch,
  });
  await apply(themeIdentifier, undefined, isAutoSwitch);
  cacheThemeColors(getTheme());
}

export async function clearPreview(applyTheme = true): Promise<void> {
  previewState = null;

  if (isPreviewingTheme) {
    isPreviewingTheme = false;
    if (applyTheme) {
      if (randomTheme !== null) {
        await apply(randomTheme);
      } else if (Config.customTheme) {
        await apply("custom");
      } else {
        await apply(Config.theme);
      }
    }
  }
}

let themesList: (ThemeName | string)[] = [];

async function changeThemeList(): Promise<void> {
  const themes = ThemesList;
  if (Config.randomTheme === "fav" && Config.favThemes.length > 0) {
    themesList = Config.favThemes;
  } else if (Config.randomTheme === "light") {
    themesList = themes.filter((t) => isColorLight(t.bg)).map((t) => t.name);
  } else if (Config.randomTheme === "dark") {
    themesList = themes.filter((t) => isColorDark(t.bg)).map((t) => t.name);
  } else if (Config.randomTheme === "on" || Config.randomTheme === "auto") {
    themesList = themes.map((t) => {
      return t.name;
    });
  } else if (Config.randomTheme === "custom") {
    themesList = CustomThemes.__nonReactive
      .getCustomThemes()
      .map((ct) => ct._id);
  }
  Arrays.shuffle(themesList);
  randomThemeIndex = 0;
}

export async function randomizeTheme(): Promise<void> {
  if (themesList.length === 0) {
    await changeThemeList();
    if (themesList.length === 0) return;
  }

  // before picking: the configured theme effect clears the random theme
  setConfig("customTheme", false, {
    nosave: true,
  });

  let filter = (_: string): boolean => true;
  if (Config.randomTheme === "auto") {
    filter = prefersColorSchemeDark() ? isColorDark : isColorLight;
  }

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
    const theme = CustomThemes.__nonReactive.getCustomTheme(randomTheme);
    colorsOverride = theme?.colors;
    randomTheme = "custom";
  }

  await apply(randomTheme, colorsOverride);

  if (randomThemeIndex >= themesList.length) {
    let name = randomTheme.replace(/_/g, " ");
    if (Config.randomTheme === "custom") {
      name = (
        CustomThemes.__nonReactive.getCustomTheme(randomTheme)?.name ?? "custom"
      ).replace(/_/g, " ");
    }
    showNoticeNotification(name);
  }
}

// theme pickers call this: re-picking the configured theme changes no config
// value, so the configured theme effect does not run to clear it
export async function clearRandom(): Promise<void> {
  if (randomTheme === null) return;
  randomTheme = null;
  if (Config.customTheme) {
    await apply("custom");
  } else {
    await apply(Config.theme);
  }
}

window
  .matchMedia?.("(prefers-color-scheme: dark)")
  ?.addEventListener?.("change", (event) => {
    if (!Config.autoSwitchTheme || Config.customTheme) return;
    if (event.matches) {
      void set(Config.themeDark, true);
    } else {
      void set(Config.themeLight, true);
    }
  });

// a root so the effects are owned, they live as long as the page
createRoot(() => {
  const getConfiguredTheme = createMemo((): ThemeIdentifier => {
    if (getConfig.autoSwitchTheme) {
      return prefersColorSchemeDark()
        ? getConfig.themeDark
        : getConfig.themeLight;
    }
    return getConfig.customTheme ? "custom" : getConfig.theme;
  });

  createEffectOn(
    [getConfiguredTheme, () => [...getConfig.customThemeColors]] as const,
    ([theme]) => {
      // not awaited: they apply synchronously, so randomizeTheme applying
      // right after its customTheme write is not overwritten a tick later
      void clearRandom();
      void clearPreview(false);
      void set(theme, getConfig.autoSwitchTheme);
    },
    { defer: true },
  );

  createEffectOn(
    () => getConfig.randomTheme,
    (value) => {
      void changeThemeList();
      if (value === "off") void clearRandom();
    },
    { defer: true },
  );

  createEffectOn(
    [
      () => getConfig.theme,
      () => getConfig.customTheme,
      () => [...getConfig.customThemeColors],
      () => getConfig.randomTheme,
      () => [...getConfig.favThemes],
    ],
    () => updateThemeIndicator(),
    { defer: true },
  );
});

function prefersColorSchemeDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}
