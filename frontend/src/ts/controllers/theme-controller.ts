import * as ThemeColors from "../elements/theme-colors";
import * as ChartController from "./chart-controller";
import * as Misc from "../utils/misc";
import * as Arrays from "../utils/arrays";
import * as JSONData from "../utils/json-data";
import { isColorDark, isColorLight } from "../utils/colors";
import Config, { setAutoSwitchTheme } from "../config";
import * as BackgroundFilter from "../elements/custom-background-filter";
import * as ConfigEvent from "../observables/config-event";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
import * as AnalyticsController from "../controllers/analytics-controller";
import { debounce } from "throttle-debounce";

export let randomTheme: string | null = null;
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

    $("#favicon").attr("href", "data:image/svg+xml;base64," + btoa(svgPre));
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
      const current = $("#currentTheme");
      const next = $("#nextTheme");
      if (next.length === 0) {
        console.debug(
          "Theme controller failed to swap elements, next is missing"
        );
        return;
      }
      current.remove();
      next.attr("id", "currentTheme");
    }

    console.debug("Theme controller loading style", name);
    loadStyleLoaderTimeouts.push(
      setTimeout(() => {
        Loader.show();
      }, 100)
    );
    $("#nextTheme").remove();
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
      $("#keymap .keymapKey").stop(true, true).removeAttr("style");
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
      $("#keymap .keymapKey").stop(true, true).removeAttr("style");
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
        link
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
  isPreview = false
): Promise<void> {
  console.debug(
    "Theme controller applying theme",
    themeName,
    customColorsOverride,
    isPreview
  );
  clearCustomTheme();
  const name = customColorsOverride ? "custom" : themeName;

  ThemeColors.reset();

  $(".keymapKey").attr("style", "");
  // $("#currentTheme").attr("href", `themes/${name}.css`);
  await loadStyle(name);
  ThemeColors.update();

  if ((Config.customTheme && !isPreview) || customColorsOverride) {
    const colors = customColorsOverride ?? Config.customThemeColors;

    for (let i = 0; i < colorVars.length; i++) {
      const colorVar = colorVars[i] as string;
      document.documentElement.style.setProperty(colorVar, colors[i] as string);
    }
  }

  void AnalyticsController.log("changedTheme", { theme: name });
  // if (!isPreview) {
  const colors = await ThemeColors.getAll();
  $(".keymapKey").attr("style", "");
  ChartController.updateAllChartColors();
  void updateFavicon();
  $("#metaThemeColor").attr("content", colors.bg);
  // }
  updateFooterThemeName(isPreview ? themeName : undefined);

  if (isColorDark(await ThemeColors.get("bg"))) {
    $("body").addClass("darkMode");
  } else {
    $("body").removeClass("darkMode");
  }
}

function updateFooterThemeName(nameOverride?: string): void {
  let str = Config.theme;
  if (randomTheme !== null) str = randomTheme;
  if (Config.customTheme) str = "custom";
  if (nameOverride !== undefined && nameOverride !== "") str = nameOverride;
  str = str.replace(/_/g, " ");
  $(".current-theme .text").text(str);
}

export function preview(
  themeIdentifier: string,
  customColorsOverride?: string[]
): void {
  debouncedPreview(themeIdentifier, customColorsOverride);
}

const debouncedPreview = debounce<(t: string, c?: string[]) => void>(
  250,
  (themeIdenfitier, customColorsOverride) => {
    isPreviewingTheme = true;
    void apply(themeIdenfitier, customColorsOverride, true);
  }
);

async function set(
  themeIdentifier: string,
  isAutoSwitch = false
): Promise<void> {
  console.debug(
    "Theme controller setting theme",
    themeIdentifier,
    isAutoSwitch
  );
  await apply(themeIdentifier, undefined, isAutoSwitch);

  if (!isAutoSwitch && Config.autoSwitchTheme) {
    setAutoSwitchTheme(false);
    Notifications.add("Auto switch theme disabled", 0);
  }
}

export async function clearPreview(applyTheme = true): Promise<void> {
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

let themesList: string[] = [];

async function changeThemeList(): Promise<void> {
  let themes;
  try {
    themes = await JSONData.getThemesList();
  } catch (e) {
    console.error(
      Misc.createErrorMessage(e, "Failed to update random theme list")
    );
    return;
  }

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
  } else if (Config.randomTheme === "on") {
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
  randomTheme = themesList[randomThemeIndex] as string;
  randomThemeIndex++;

  if (randomThemeIndex >= themesList.length) {
    Arrays.shuffle(themesList);
    randomThemeIndex = 0;
  }

  let colorsOverride: string[] | undefined;

  if (Config.randomTheme === "custom") {
    const theme = DB.getSnapshot()?.customThemes?.find(
      (ct) => ct._id === randomTheme
    );
    colorsOverride = theme?.colors;
    randomTheme = "custom";
  }

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
    $(".customBackground img").css({
      // width: "calc(100%)",
      // height: "calc(100%)",
      objectFit: "",
    });
  } else {
    $(".customBackground img").css({
      objectFit: Config.customBackgroundSize,
    });
  }
}

function applyCustomBackground(): void {
  // $(".customBackground").css({
  //   backgroundImage: `url(${Config.customBackground})`,
  //   backgroundAttachment: "fixed",
  // });
  if (Config.customBackground === "") {
    $("#words").removeClass("noErrorBorder");
    $("#resultWordsHistory").removeClass("noErrorBorder");
    $(".customBackground img").remove();
  } else {
    $("#words").addClass("noErrorBorder");
    $("#resultWordsHistory").addClass("noErrorBorder");
    $(".customBackground").html(
      `<img src="${Config.customBackground}" alt="" onerror="javascript:window.dispatchEvent(new Event('customBackgroundFailed'))" />`
    );
    BackgroundFilter.apply();
    applyCustomBackgroundSize();
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

ConfigEvent.subscribe(async (eventKey, eventValue, nosave) => {
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
  if (eventKey === "setThemes") {
    await clearRandom();
    await clearPreview(false);
    if (Config.autoSwitchTheme) {
      if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        await set(Config.themeDark, true);
      } else {
        await set(Config.themeLight, true);
      }
    } else {
      if (eventValue as boolean) {
        await set("custom");
      } else {
        await set(Config.theme);
      }
    }
  }
  if (eventKey === "randomTheme" && eventValue === "off") await clearRandom();
  if (eventKey === "customBackground") applyCustomBackground();
  if (eventKey === "customBackgroundSize") applyCustomBackgroundSize();
  if (eventKey === "autoSwitchTheme") {
    if (eventValue as boolean) {
      if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
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
    !window.matchMedia?.("(prefers-color-scheme: dark)").matches &&
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
});

window.addEventListener("customBackgroundFailed", () => {
  Notifications.add(
    "Custom background link is either temporairly unavailable or expired. Please make sure the URL is correct or change it",
    0,
    { duration: 5 }
  );
});
