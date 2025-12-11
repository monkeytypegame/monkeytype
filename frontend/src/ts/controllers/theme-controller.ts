import * as ThemeColors from "../elements/theme-colors";
import * as ChartController from "./chart-controller";
import * as Misc from "../utils/misc";
import * as Arrays from "../utils/arrays";
import { isColorDark, isColorLight } from "../utils/colors";
import Config, { setConfig, setCustomTheme } from "../config";
import * as BackgroundFilter from "../elements/custom-background-filter";
import * as ConfigEvent from "../observables/config-event";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
import { debounce } from "throttle-debounce";
import { ThemeName } from "@monkeytype/schemas/configs";
import { themes, ThemesList } from "../constants/themes";
import fileStorage from "../utils/file-storage";
import { qs, qsa } from "../utils/dom";

export let randomTheme: ThemeName | string | null = null;
let isPreviewingTheme = false;
let randomThemeIndex = 0;

export const colorVars = [
  "--bg-color",
  "--main-color",
  "--caret-color",
  "--sub-color",
  "--sub-alt-color",
  "--text-color",
  "--error-color",
  "--error-extra-color",
  "--colorful-error-color",
  "--colorful-error-extra-color",
];

async function updateFavicon(): Promise<void> {
  setTimeout(async () => {
    let maincolor, bgcolor;
    bgcolor = await ThemeColors.get("bg");
    maincolor = await ThemeColors.get("main");
    if (Misc.isDevEnvironment()) {
      [maincolor, bgcolor] = [bgcolor, maincolor];
    }
    if (bgcolor === maincolor) {
      bgcolor = "#111";
      maincolor = "#eee";
    }

    const svgPre = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <style>
    #bg{fill:${bgcolor};}
    path{fill:${maincolor};}
  </style>
  <g>
    <path id="bg" d="M0 16Q0 0 16 0h32q16 0 16 16v32q0 16-16 16H16Q0 64 0 48"/>
    <path d="M9.09 24.1v21.2h5.12V33.1q.256-4.61 4.48-4.61 3.46.384 3.46 3.84v12.9h5.12v-11.5q-.128-5.25 4.48-5.25 3.46.384 3.46 3.84v12.9h5.12v-12.2q0-9.47-7.04-9.47-4.22 0-7.04 3.46-2.18-3.46-6.02-3.46-3.46 0-6.02 2.43v-2.05M47 18.9v5.12h-4.61v5.12H47v16.1h5.12v-16.1h4.61v-5.12h-4.61V18.9"/>
  </g>
</svg>`;

    qs("#favicon")?.setAttribute(
      "href",
      "data:image/svg+xml;base64," + btoa(svgPre),
    );
  }, 125);
}

function clearCustomTheme(): void {
  console.debug("Theme controller clearing custom theme");
  for (const e of colorVars) {
    document.documentElement.style.setProperty(e, "");
  }
}

let loadStyleLoaderTimeouts: NodeJS.Timeout[] = [];

export async function loadStyle(name: string): Promise<void> {
  return new Promise((resolve) => {
    function swapCurrentToNext(): void {
      console.debug("Theme controller swapping elements");
      const current = qs("#currentTheme");
      const next = qs("#nextTheme");
      if (current === null || next === null) {
        console.debug(
          "Theme controller failed to swap elements, next or current is missing",
        );
        return;
      }
      current.remove();
      next.setAttribute("id", "currentTheme");
    }

    console.debug("Theme controller loading style", name);
    loadStyleLoaderTimeouts.push(
      setTimeout(() => {
        Loader.show();
      }, 100),
    );
    qs("#nextTheme")?.remove();
    const headScript = document.querySelector("#currentTheme");
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.id = "nextTheme";
    link.onload = (): void => {
      console.debug("Theme controller loaded style", name);
      Loader.hide();
      swapCurrentToNext();
      loadStyleLoaderTimeouts.map((t) => clearTimeout(t));
      loadStyleLoaderTimeouts = [];
      qsa("#keymap .keymapKey")?.setStyle({});
      resolve();
    };
    link.onerror = (e): void => {
      console.debug("Theme controller failed to load style", name, e);
      console.error(`Failed to load theme ${name}`, e);
      Loader.hide();
      Notifications.add("Failed to load theme", 0);
      swapCurrentToNext();
      loadStyleLoaderTimeouts.map((t) => clearTimeout(t));
      loadStyleLoaderTimeouts = [];
      qsa("#keymap .keymapKey")?.setStyle({});
      resolve();
    };
    if (name === "custom") {
      link.href = `/themes/serika_dark.css`;
    } else {
      link.href = `/themes/${name}.css`;
    }

    if (headScript === null) {
      console.debug("Theme controller appending link to the head", link);
      document.head.appendChild(link);
    } else {
      console.debug(
        "Theme controller inserting link after current theme",
        link,
      );
      headScript.after(link);
    }
  });
}

// export function changeCustomTheme(themeId: string, nosave = false): void {
//   const customThemes = DB.getSnapshot().customThemes;
//   const colors = customThemes.find((e) => e._id === themeId)
//     ?.colors as string[];
//   UpdateConfig.setCustomThemeColors(colors, nosave);
// }

async function apply(
  themeName: string,
  customColorsOverride?: string[],
  isPreview = false,
): Promise<void> {
  console.debug(
    "Theme controller applying theme",
    themeName,
    customColorsOverride,
    isPreview,
  );

  const name = customColorsOverride ? "custom" : themeName;

  if ((Config.customTheme && !isPreview) || customColorsOverride) {
    const colors = customColorsOverride ?? Config.customThemeColors;

    for (let i = 0; i < colorVars.length; i++) {
      const colorVar = colorVars[i] as string;
      document.documentElement.style.setProperty(colorVar, colors[i] as string);
    }
  }

  ThemeColors.reset();

  qsa("#keymap .keymapKey")?.setStyle({});
  await loadStyle(name);

  if (name !== "custom") {
    clearCustomTheme();
  }

  ThemeColors.update();

  // if (!isPreview) {
  const colors = await ThemeColors.getAll();
  qsa("#keymap .keymapKey")?.setStyle({});
  ChartController.updateAllChartColors();
  void updateFavicon();
  qs("#metaThemeColor")?.setAttribute("content", colors.bg);
  updateFooterIndicator(isPreview ? themeName : undefined);

  if (isColorDark(await ThemeColors.get("bg"))) {
    qs("body")?.addClass("darkMode");
  } else {
    qs("body")?.removeClass("darkMode");
  }
}

function updateFooterIndicator(nameOverride?: string): void {
  const indicator = document.querySelector<HTMLElement>(
    "footer .right .current-theme",
  );
  const text = indicator?.querySelector<HTMLElement>(".text");
  const favIcon = indicator?.querySelector<HTMLElement>(".favIndicator");

  if (
    !(indicator instanceof HTMLElement) ||
    !(text instanceof HTMLElement) ||
    !(favIcon instanceof HTMLElement)
  ) {
    return;
  }

  //text
  let str: string = Config.theme;
  if (randomTheme !== null) str = randomTheme;
  if (Config.customTheme) str = "custom";
  if (nameOverride !== undefined && nameOverride !== "") str = nameOverride;
  str = str.replace(/_/g, " ");
  text.innerText = str;

  //fav icon
  const isCustom = Config.customTheme;
  // hide the favorite icon completely for custom themes
  if (isCustom) {
    favIcon.style.display = "none";
    return;
  }
  favIcon.style.display = "";
  const currentTheme = nameOverride ?? randomTheme ?? Config.theme;
  const isFavorite =
    currentTheme !== null &&
    Config.favThemes.includes(currentTheme as ThemeName);

  if (isFavorite) {
    favIcon.style.display = "block";
  } else {
    favIcon.style.display = "none";
  }
}

type PreviewState = {
  theme: string;
  colors?: string[];
} | null;

let previewState: PreviewState = null;

export function preview(
  themeIdentifier: string,
  customColorsOverride?: string[],
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
  themeIdentifier: string,
  isAutoSwitch = false,
): Promise<void> {
  console.debug(
    "Theme controller setting theme",
    themeIdentifier,
    isAutoSwitch,
  );
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
    themesList = themes
      .filter((t) => isColorLight(t.bgColor))
      .map((t) => t.name);
  } else if (Config.randomTheme === "dark") {
    themesList = themes
      .filter((t) => isColorDark(t.bgColor))
      .map((t) => t.name);
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
    randomTheme = themesList[randomThemeIndex] as string;
    nextTheme = themes[themesList[randomThemeIndex] as ThemeName];
    randomThemeIndex++;
    if (randomThemeIndex >= themesList.length) {
      Arrays.shuffle(themesList);
      randomThemeIndex = 0;
    }
  } while (!filter(nextTheme.bgColor));

  let colorsOverride: string[] | undefined;

  if (Config.randomTheme === "custom") {
    const theme = DB.getSnapshot()?.customThemes?.find(
      (ct) => ct._id === randomTheme,
    );
    colorsOverride = theme?.colors;
    randomTheme = "custom";
  }

  setCustomTheme(false, true);
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
  )?.addClass("hidden");

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
      )?.removeClass("hidden");
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

ConfigEvent.subscribe(async (eventKey, eventValue, nosave) => {
  if (eventKey === "fullConfigChange") {
    ignoreConfigEvent = true;
  }
  if (eventKey === "fullConfigChangeFinished") {
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

  if (eventKey === "randomTheme") {
    void changeThemeList();
  }
  if (eventKey === "customTheme") {
    (eventValue as boolean) ? await set("custom") : await set(Config.theme);
  }
  if (eventKey === "customThemeColors") {
    nosave ? preview("custom") : await set("custom");
  }
  if (eventKey === "theme") {
    await clearRandom();
    await clearPreview(false);
    await set(eventValue as string);
  }
  if (eventKey === "randomTheme" && eventValue === "off") await clearRandom();
  if (eventKey === "customBackground") await applyCustomBackground();

  if (eventKey === "customBackgroundSize") applyCustomBackgroundSize();
  if (eventKey === "autoSwitchTheme") {
    if (eventValue as boolean) {
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
    eventKey === "themeLight" &&
    Config.autoSwitchTheme &&
    !prefersColorSchemeDark() &&
    !nosave
  ) {
    await set(Config.themeLight, true);
  }
  if (
    eventKey === "themeDark" &&
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
    ].includes(eventKey)
  ) {
    updateFooterIndicator();
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
