import * as Arrays from "../utils/arrays";
import { isColorDark, isColorLight } from "../utils/colors";
import Config, { setConfig } from "../config";
import * as BackgroundFilter from "../elements/custom-background-filter";
import * as ConfigEvent from "../observables/config-event";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import { debounce } from "throttle-debounce";
import { CustomThemeColors, ThemeName } from "@monkeytype/schemas/configs";
import { Theme, themes, ThemesList } from "../constants/themes";
import fileStorage from "../utils/file-storage";
import { qs } from "../utils/dom";
import { setThemeIndicator } from "../signals/core";
import { setTheme, ThemeIdentifier } from "../signals/theme";

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

  if (isColorDark(themeColors.bg)) {
    qs("body")?.addClass("darkMode");
  } else {
    qs("body")?.removeClass("darkMode");
  }
}

function updateThemeIndicator(nameOverride?: string): void {
  //text
  let str: string = Config.theme;
  if (randomTheme !== null) str = randomTheme;
  if (Config.customTheme) str = "custom";
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

  if (!isAutoSwitch && Config.autoSwitchTheme) {
    setConfig("autoSwitchTheme", false);
    Notifications.add("Auto switch theme disabled", 0);
  }
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
  } else if (Config.randomTheme === "custom" && DB.getSnapshot()) {
    themesList = DB.getSnapshot()?.customThemes?.map((ct) => ct._id) ?? [];
  }
  Arrays.shuffle(themesList);
  randomThemeIndex = 0;
}

export async function randomizeTheme(): Promise<void> {
  if (themesList.length === 0) {
    await changeThemeList();
    if (themesList.length === 0) return;
  }

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
    const theme = DB.getSnapshot()?.customThemes?.find(
      (ct) => ct._id === randomTheme,
    );
    colorsOverride = theme?.colors;
    randomTheme = "custom";
  }

  setConfig("customTheme", false, {
    nosave: true,
  });
  await apply(randomTheme, colorsOverride);

  if (randomThemeIndex >= themesList.length) {
    let name = randomTheme.replace(/_/g, " ");
    if (Config.randomTheme === "custom") {
      name = (
        DB.getSnapshot()?.customThemes?.find((ct) => ct._id === randomTheme)
          ?.name ?? "custom"
      ).replace(/_/g, " ");
    }
    Notifications.add(name, 0);
  }
}

async function clearRandom(): Promise<void> {
  if (randomTheme === null) return;
  randomTheme = null;
  if (Config.customTheme) {
    await apply("custom");
  } else {
    await apply(Config.theme);
  }
}

function applyCustomBackgroundSize(): void {
  if (Config.customBackgroundSize === "max") {
    qs(".customBackground img")?.setStyle({
      objectFit: "",
    });
  } else {
    qs(".customBackground img")?.setStyle({
      objectFit: Config.customBackgroundSize,
    });
  }
}

export async function applyCustomBackground(): Promise<void> {
  let backgroundUrl = Config.customBackground;
  qs<HTMLInputElement>(
    ".pageSettings .section[data-config-name='customBackgroundSize'] input[type='text']",
  )?.setValue(backgroundUrl);

  //if there is a localBackgroundFile available, use it.
  const localBackgroundFile = await fileStorage.getFile("LocalBackgroundFile");

  if (localBackgroundFile !== undefined) {
    backgroundUrl = localBackgroundFile;
  }

  // hide the filter section initially and always
  qs(
    ".pageSettings .section[data-config-name='customBackgroundFilter']",
  )?.hide();

  if (backgroundUrl === "") {
    qs("#words")?.removeClass("noErrorBorder");
    qs("#resultWordsHistory")?.removeClass("noErrorBorder");
    qs(".customBackground img")?.remove();
  } else {
    qs("#words")?.addClass("noErrorBorder");
    qs("#resultWordsHistory")?.addClass("noErrorBorder");

    //use setAttribute for possible unsafe customBackground value
    const container = document.querySelector(".customBackground");
    const img = document.createElement("img");

    img.setAttribute("src", backgroundUrl);
    img.setAttribute(
      "onError",
      "javascript:this.style.display='none'; window.dispatchEvent(new Event('customBackgroundFailed'))",
    );
    img.onload = () => {
      // show the filter section only if the image loads successfully
      qs(
        ".pageSettings .section[data-config-name='customBackgroundFilter']",
      )?.show();
    };

    container?.replaceChildren(img);

    BackgroundFilter.apply();
    applyCustomBackgroundSize();
  }
}

export async function applyFontFamily(): Promise<void> {
  let font = Config.fontFamily.replace(/_/g, " ");

  const localFont = await fileStorage.getFile("LocalFontFamilyFile");
  if (localFont === undefined) {
    //use config font
    qs(".customFont")?.empty();
  } else {
    font = "LOCALCUSTOM";

    qs(".customFont")?.setHtml(`
      @font-face{ 
        font-family: LOCALCUSTOM;
        src: url(${localFont});
        font-weight: 400;
        font-style: normal;
        font-display: block;
      }`);
  }

  document.documentElement.style.setProperty(
    "--font",
    `"${font}", "Roboto Mono", "Vazirmatn", monospace`,
  );
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

let ignoreConfigEvent = false;

ConfigEvent.subscribe(async ({ key, newValue, nosave }) => {
  if (key === "fullConfigChange") {
    ignoreConfigEvent = true;
  }
  if (key === "fullConfigChangeFinished") {
    ignoreConfigEvent = false;

    await clearRandom();
    await clearPreview(false);
    if (Config.autoSwitchTheme) {
      if (prefersColorSchemeDark()) {
        await set(Config.themeDark, true);
      } else {
        await set(Config.themeLight, true);
      }
    } else {
      if (Config.customTheme) {
        await set("custom");
      } else {
        await set(Config.theme);
      }
    }
    await applyCustomBackground();
  }

  // this is here to prevent calling set / preview multiple times during a full config loading
  // once the full config is loaded, we can apply everything once
  if (ignoreConfigEvent) return;

  if (key === "randomTheme") {
    void changeThemeList();
  }
  if (key === "customTheme") {
    newValue ? await set("custom") : await set(Config.theme);
  }
  if (key === "customThemeColors") {
    nosave ? preview("custom") : await set("custom");
  }
  if (key === "theme") {
    await clearRandom();
    await clearPreview(false);
    await set(newValue);
  }
  if (key === "randomTheme" && newValue === "off") await clearRandom();
  if (key === "customBackground") await applyCustomBackground();

  if (key === "customBackgroundSize") applyCustomBackgroundSize();
  if (key === "autoSwitchTheme") {
    if (newValue) {
      if (prefersColorSchemeDark()) {
        await set(Config.themeDark, true);
      } else {
        await set(Config.themeLight, true);
      }
    } else {
      await set(Config.theme);
    }
  }
  if (
    key === "themeLight" &&
    Config.autoSwitchTheme &&
    !prefersColorSchemeDark() &&
    !nosave
  ) {
    await set(Config.themeLight, true);
  }
  if (
    key === "themeDark" &&
    Config.autoSwitchTheme &&
    window.matchMedia !== undefined &&
    window.matchMedia("(prefers-color-scheme: dark)").matches &&
    !nosave
  ) {
    await set(Config.themeDark, true);
  }
  if (
    [
      "theme",
      "customTheme",
      "customThemeColors",
      "randomTheme",
      "favThemes",
    ].includes(key)
  ) {
    updateThemeIndicator();
  }
});

window.addEventListener("customBackgroundFailed", () => {
  Notifications.add(
    "Custom background link is either temporarily unavailable or expired. Please make sure the URL is correct or change it",
    0,
    { duration: 5 },
  );
});

function prefersColorSchemeDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}
