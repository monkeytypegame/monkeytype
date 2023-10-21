import * as ThemeColors from "../elements/theme-colors";
import * as ChartController from "./chart-controller";
import * as Misc from "../utils/misc";
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
  colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });
}

let loadStyleLoaderTimeouts: NodeJS.Timeout[] = [];

export async function loadStyle(name: string): Promise<void> {
  return new Promise((resolve) => {
    loadStyleLoaderTimeouts.push(
      setTimeout(() => {
        Loader.show();
      }, 100)
    );
    $("#nextTheme").remove();
    const headScript = document.querySelector("#currentTheme") as Element;
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.id = "nextTheme";
    link.onload = (): void => {
      Loader.hide();
      $("#currentTheme").remove();
      $("#nextTheme").attr("id", "currentTheme");
      loadStyleLoaderTimeouts.map((t) => clearTimeout(t));
      loadStyleLoaderTimeouts = [];
      $("#keymap .keymapKey").stop(true, true).removeAttr("style");
      resolve();
    };
    link.onerror = (): void => {
      Loader.hide();
      Notifications.add("Failed to load theme", 0);
      $("#currentTheme").remove();
      $("#nextTheme").attr("id", "currentTheme");
      loadStyleLoaderTimeouts.map((t) => clearTimeout(t));
      loadStyleLoaderTimeouts = [];
      $("#keymap .keymapKey").stop(true, true).removeAttr("style");
      resolve();
    };
    if (name === "custom") {
      link.href = `/./themes/serika_dark.css`;
    } else {
      link.href = `/./themes/${name}.css`;
    }

    if (!headScript) {
      document.head.appendChild(link);
    } else {
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

function apply(
  themeName: string,
  customColorsOverride?: string[],
  isPreview = false
): void {
  clearCustomTheme();
  const name = customColorsOverride ? "custom" : themeName;

  ThemeColors.reset();

  $(".keymapKey").attr("style", "");
  // $("#currentTheme").attr("href", `themes/${name}.css`);
  loadStyle(name).then(() => {
    ThemeColors.update();

    if ((Config.customTheme && !isPreview) || customColorsOverride) {
      const colors = customColorsOverride ?? Config.customThemeColors;

      colorVars.forEach((e, index) => {
        document.documentElement.style.setProperty(e, colors[index]);
      });
    }

    AnalyticsController.log("changedTheme", { theme: name });
    // if (!isPreview) {
    ThemeColors.getAll().then((colors) => {
      $(".keymapKey").attr("style", "");
      ChartController.updateAllChartColors();
      updateFavicon();
      $("#metaThemeColor").attr("content", colors.bg);
    });
    // }
    updateFooterThemeName(isPreview ? themeName : undefined);
  });
}

function updateFooterThemeName(nameOverride?: string): void {
  let str = Config.theme;
  if (Config.customTheme) str = "custom";
  if (nameOverride) str = nameOverride;
  str = str.replace(/_/g, " ");
  $(".current-theme .text").text(str);
}

export function preview(
  themeIdentifier: string,
  customColorsOverride?: string[]
): void {
  debouncedPreview(themeIdentifier, customColorsOverride);
}

const debouncedPreview = debounce(
  250,
  (themeIdenfitier, customColorsOverride) => {
    isPreviewingTheme = true;
    apply(themeIdenfitier, customColorsOverride, true);
  }
);

function set(themeIdentifier: string, isAutoSwitch = false): void {
  apply(themeIdentifier, undefined, isAutoSwitch);

  if (!isAutoSwitch && Config.autoSwitchTheme) {
    setAutoSwitchTheme(false);
    Notifications.add("Auto switch theme disabled", 0);
  }
}

export function clearPreview(applyTheme = true): void {
  if (isPreviewingTheme) {
    isPreviewingTheme = false;
    randomTheme = null;
    if (applyTheme) {
      if (Config.customTheme) {
        apply("custom");
      } else {
        apply(Config.theme);
      }
    }
  }
}

let themesList: string[] = [];

async function changeThemeList(): Promise<void> {
  let themes;
  try {
    themes = await Misc.getThemesList();
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
      .filter((t) => Misc.isColorLight(t.bgColor))
      .map((t) => t.name);
  } else if (Config.randomTheme === "dark") {
    themesList = themes
      .filter((t) => Misc.isColorDark(t.bgColor))
      .map((t) => t.name);
  } else if (Config.randomTheme === "on") {
    themesList = themes.map((t) => {
      return t.name;
    });
  } else if (Config.randomTheme === "custom" && DB.getSnapshot()) {
    themesList = DB.getSnapshot()?.customThemes.map((ct) => ct._id) ?? [];
  }
  Misc.shuffle(themesList);
  randomThemeIndex = 0;
}

export async function randomizeTheme(): Promise<void> {
  if (themesList.length === 0) {
    await changeThemeList();
    if (themesList.length === 0) return;
  }
  randomTheme = themesList[randomThemeIndex];
  randomThemeIndex++;

  if (randomThemeIndex >= themesList.length) {
    Misc.shuffle(themesList);
    randomThemeIndex = 0;
  }

  let colorsOverride: string[] | undefined;

  if (Config.randomTheme === "custom") {
    const theme = DB.getSnapshot()?.customThemes.find(
      (ct) => ct._id === randomTheme
    );
    colorsOverride = theme?.colors;
    randomTheme = "custom";
  }

  preview(randomTheme, colorsOverride);

  if (randomThemeIndex >= themesList.length) {
    let name = randomTheme.replace(/_/g, " ");
    if (Config.randomTheme === "custom") {
      name = (
        DB.getSnapshot()?.customThemes.find((ct) => ct._id === randomTheme)
          ?.name ?? "custom"
      ).replace(/_/g, " ");
    }
    Notifications.add(name, 0);
  }
}

function clearRandom(): void {
  if (randomTheme === null) return;
  randomTheme = null;
  if (Config.customTheme) {
    apply("custom");
  } else {
    apply(Config.theme);
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
      `<img src="${Config.customBackground}" alt="" />`
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
      set(Config.themeDark, true);
    } else {
      set(Config.themeLight, true);
    }
  });

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (eventKey === "randomTheme") {
    changeThemeList();
  }
  if (eventKey === "customTheme") {
    eventValue ? set("custom") : set(Config.theme);
  }
  if (eventKey === "customThemeColors") {
    nosave ? preview("custom") : set("custom");
  }
  if (eventKey === "theme") {
    clearPreview(false);
    set(eventValue as string);
  }
  if (eventKey === "setThemes") {
    clearPreview(false);
    if (Config.autoSwitchTheme) {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        set(Config.themeDark, true);
      } else {
        set(Config.themeLight, true);
      }
    } else {
      if (eventValue) {
        set("custom");
      } else {
        set(Config.theme);
      }
    }
  }
  if (eventKey === "randomTheme" && eventValue === "off") clearRandom();
  if (eventKey === "customBackground") applyCustomBackground();
  if (eventKey === "customBackgroundSize") applyCustomBackgroundSize();
  if (eventKey === "autoSwitchTheme") {
    if (eventValue) {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        set(Config.themeDark, true);
      } else {
        set(Config.themeLight, true);
      }
    } else {
      set(Config.theme);
    }
  }
  if (
    eventKey === "themeLight" &&
    Config.autoSwitchTheme &&
    !(
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) &&
    !nosave
  ) {
    set(Config.themeLight, true);
  }
  if (
    eventKey === "themeDark" &&
    Config.autoSwitchTheme &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches &&
    !nosave
  ) {
    set(Config.themeDark, true);
  }
});
