import * as ThemeColors from "../elements/theme-colors";
import * as ChartController from "./chart-controller";
import * as Misc from "../misc";
import Config, * as UpdateConfig from "../config";
import tinycolor from "tinycolor2";
import * as BackgroundFilter from "../elements/custom-background-filter";
import * as ConfigEvent from "../observables/config-event";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";

let isPreviewingTheme = false;
export let randomTheme: string | null = null;

export const colorVars = [
  "--bg-color",
  "--main-color",
  "--caret-color",
  "--sub-color",
  "--text-color",
  "--error-color",
  "--error-extra-color",
  "--colorful-error-color",
  "--colorful-error-extra-color",
];

async function updateFavicon(size: number, curveSize: number): Promise<void> {
  setTimeout(async () => {
    let maincolor, bgcolor;
    bgcolor = await ThemeColors.get("bg");
    maincolor = await ThemeColors.get("main");
    if (window.location.hostname === "localhost") {
      const swap = maincolor;
      maincolor = bgcolor;
      bgcolor = swap;
    }
    if (bgcolor == maincolor) {
      bgcolor = "#111";
      maincolor = "#eee";
    }
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.beginPath();
    ctx.moveTo(0, curveSize);
    //top left
    ctx.quadraticCurveTo(0, 0, curveSize, 0);
    ctx.lineTo(size - curveSize, 0);
    //top right
    ctx.quadraticCurveTo(size, 0, size, curveSize);
    ctx.lineTo(size, size - curveSize);
    ctx.quadraticCurveTo(size, size, size - curveSize, size);
    ctx.lineTo(curveSize, size);
    ctx.quadraticCurveTo(0, size, 0, size - curveSize);
    ctx.fillStyle = bgcolor;
    ctx.fill();
    ctx.font = "900 " + (size / 2) * 1.2 + "px Lexend Deca";
    ctx.textAlign = "center";
    ctx.fillStyle = maincolor;
    ctx.fillText("mt", size / 2 + 1, (size / 3) * 2.1);
    // $("body").prepend(canvas);
    $("#favicon").attr("href", canvas.toDataURL("image/png"));
  }, 125);
}

function clearCustomTheme(): void {
  colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });
}

const loadStyle = async function (name: string): Promise<void> {
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.id = "currentTheme";
    link.onload = (): void => {
      resolve();
    };
    link.href = `themes/${name}.css`;

    const headScript = document.querySelector("#currentTheme") as Element;
    headScript.replaceWith(link);
  });
};

export async function apply_custom(
  themeId: string,
  isPreview = false
): Promise<void> {
  clearCustomTheme();
  if (!DB.getSnapshot()) return; // The user has not yet loaded or is not signed in
  if (themeId.trim() === "" || themeId.trim() === "") {
    apply_preset("", isPreview);
    // Rizwan TODO: Remove this if statement later
    Notifications.add("apply_custom got an empty value. This shouldn't happen");
  }

  const customThemes = DB.getSnapshot().customThemes;
  const customTheme = customThemes
    ? customThemes.find((t) => t._id === themeId)
    : undefined;
  if (!customTheme) {
    console.log(Config.customThemeId);
    Notifications.add(`No custom theme with id: ${themeId}`, 0);
    if (customThemes && customThemes.length > 1)
      UpdateConfig.setCustomThemeId(customThemes[0]._id);
    else UpdateConfig.setCustomThemeId("");
    return;
  }
  const themeName = customTheme.name;
  Misc.swapElements(
    $('.pageSettings [tabContent="preset"]'),
    $('.pageSettings [tabContent="custom"]'),
    250
  );

  ThemeColors.reset();
  await loadStyle("serika_dark");
  colorVars.forEach((e, index) => {
    document.documentElement.style.setProperty(e, customTheme.colors[index]);
  });
  ThemeColors.update();

  try {
    firebase.analytics().logEvent("changedCustomTheme", { theme: themeName });
  } catch (e) {
    console.log("Analytics unavailable");
  }
  if (isPreview) return;

  UpdateConfig.setCustomThemeColors([...customTheme.colors]);
  const colors = await ThemeColors.getAll();
  $(".current-theme .text").text("custom: " + themeName.replace(/_/g, " "));
  $(".keymap-key").attr("style", "");
  ChartController.updateAllChartColors();
  updateFavicon(128, 32);
  $("#metaThemeColor").attr("content", colors.bg);
}

export async function apply_preset(
  themeName: string,
  isPreview = false
): Promise<void> {
  clearCustomTheme();

  if (themeName.trim() === "") themeName = Config.theme;
  Misc.swapElements(
    $('.pageSettings [tabContent="custom"]'),
    $('.pageSettings [tabContent="preset"]'),
    250
  );
  ThemeColors.reset();
  await loadStyle(themeName);
  ThemeColors.update();

  try {
    firebase.analytics().logEvent("changedTheme", { theme: themeName });
  } catch (e) {
    console.log("Analytics unavailable");
  }

  if (isPreview) return;

  const colors = await ThemeColors.getAll();
  $(".current-theme .text").text(themeName.replace(/_/g, " "));
  $(".keymap-key").attr("style", "");
  ChartController.updateAllChartColors();
  updateFavicon(128, 32);
  $("#metaThemeColor").attr("content", colors.bg);
}

export const apply = async (
  custom: boolean,
  themeIdentifier: string,
  isPreview = false
): Promise<void> => {
  if (!themeIdentifier) {
    // Rizwan TODO: Investigate why themeName is undefined / null and remove this if statement later
    console.log("Investigate these");
    console.log(themeIdentifier);
    return;
  }
  if (custom === true && themeIdentifier !== "")
    apply_custom(themeIdentifier, isPreview);
  else
    apply_preset(
      themeIdentifier !== "" ? themeIdentifier : Config.theme,
      isPreview
    );
};

export function preview(
  custom: boolean,
  themeIdentifier: string,
  randomTheme = false
): void {
  apply(custom, themeIdentifier, !randomTheme);
  isPreviewingTheme = true;
}

export const set = async (
  custom: boolean,
  themeIdentifier: string
): Promise<void> => apply(custom, themeIdentifier);

export const clearPreview = (): void => {
  if (!isPreviewingTheme) return;

  isPreviewingTheme = false;
  randomTheme = null;
  if (Config.customThemeId !== "") apply_custom(Config.customThemeId);
  else apply_preset(Config.theme);
};

export function randomizeTheme(): void {
  let randomList;
  Misc.getThemesList().then((themes) => {
    if (Config.randomTheme === "fav" && Config.favThemes.length > 0) {
      randomList = Config.favThemes;
    } else if (Config.randomTheme === "light") {
      randomList = themes
        .filter((t) => tinycolor(t.bgColor).isLight())
        .map((t) => t.name);
    } else if (Config.randomTheme === "dark") {
      randomList = themes
        .filter((t) => tinycolor(t.bgColor).isDark())
        .map((t) => t.name);
    } else {
      randomList = themes.map((t) => {
        return t.name;
      });
    }

    // const previousTheme = randomTheme;
    randomTheme = randomList[Math.floor(Math.random() * randomList.length)];

    preview(false, randomTheme, true);

    // if (previousTheme != randomTheme) {
    //   // Notifications.add(randomTheme.replace(/_/g, " "), 0);
    // }
  });
}

export function clearRandom(): void {
  randomTheme = null;
}

export function applyCustomBackgroundSize(): void {
  if (Config.customBackgroundSize == "max") {
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

export function applyCustomBackground(): void {
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
    $(".customBackground").html(`<img src="${Config.customBackground}" />`);
    BackgroundFilter.apply();
    applyCustomBackgroundSize();
  }
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  ?.addEventListener("change", (event) => {
    if (!Config.autoSwitchTheme || Config.customThemeId !== "") return;
    if (event.matches) {
      set(false, Config.themeDark);
    } else {
      set(false, Config.themeLight);
    }
  });

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (eventKey === "customThemeId") {
    set(true, eventValue);
  }
  if (eventKey === "theme") {
    clearPreview();
    set(false, eventValue);
  }
  if (eventKey === "setThemes") {
    clearPreview();
    if (eventValue) {
      set(true, eventValue);
    } else {
      if (Config.autoSwitchTheme) {
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          set(false, Config.themeDark);
        } else {
          set(false, Config.themeLight);
        }
      } else {
        set(false, Config.theme);
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
        set(false, Config.themeDark);
      } else {
        set(false, Config.themeLight);
      }
    } else {
      set(false, Config.theme);
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
    set(false, Config.themeLight);
  }
  if (
    eventKey === "themeDark" &&
    Config.autoSwitchTheme &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches &&
    !nosave
  ) {
    set(false, Config.themeDark);
  }
});
