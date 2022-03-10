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
    if (name === "custom") {
      link.href = `themes/serika_dark.css`;
    } else {
      link.href = `themes/${name}.css`;
    }

    const headScript = document.querySelector("#currentTheme") as Element;
    headScript.replaceWith(link);
  });
};

// export function changeCustomTheme(themeId: string, nosave = false): void {
//   const customThemes = DB.getSnapshot().customThemes;
//   const colors = customThemes.find((e) => e._id === themeId)
//     ?.colors as string[];
//   UpdateConfig.setCustomThemeColors(colors, nosave);
// }

function apply(themeName: string, isCustom: boolean, isPreview = false): void {
  clearCustomTheme();

  let name = "serika_dark";
  if (!isCustom) {
    name = themeName;
    Misc.swapElements(
      $('.pageSettings [tabContent="custom"]'),
      $('.pageSettings [tabContent="preset"]'),
      250
    );
  } else {
    name = "custom";
    Misc.swapElements(
      $('.pageSettings [tabContent="preset"]'),
      $('.pageSettings [tabContent="custom"]'),
      250
    );
  }

  ThemeColors.reset();

  $(".keymap-key").attr("style", "");
  // $("#currentTheme").attr("href", `themes/${name}.css`);
  loadStyle(name).then(() => {
    ThemeColors.update();
    if (isCustom) {
      let colorValues = Config.customThemeColors;
      const snapshot = DB.getSnapshot();
      if (isCustom && !isPreview && snapshot) {
        const customColors =
          snapshot.customThemes.find((e) => e._id === themeName)?.colors ?? [];
        if (customColors.length > 0) {
          UpdateConfig.setCustomThemeColors(customColors);
        }
      }
      if (themeName !== "custom" && snapshot) {
        const customThemes = snapshot.customThemes;
        const customThemeById = customThemes.find((e) => e._id === themeName);
        colorValues = customThemeById?.colors as string[];
      }
      colorVars.forEach((e, index) => {
        document.documentElement.style.setProperty(e, colorValues[index]);
      });
    }

    try {
      firebase.analytics().logEvent("changedTheme", {
        theme: themeName,
      });
    } catch (e) {
      console.log("Analytics unavailable");
    }
    if (!isPreview) {
      ThemeColors.getAll().then((colors) => {
        $(".current-theme .text").text(
          isCustom ? "custom" : themeName.replace(/_/g, " ")
        );
        $(".keymap-key").attr("style", "");
        ChartController.updateAllChartColors();
        updateFavicon(128, 32);
        $("#metaThemeColor").attr("content", colors.bg);
      });
    }
  });
}

export function preview(
  themeIdentifier: string,
  isCustom: boolean,
  randomTheme = false
): void {
  isPreviewingTheme = true;
  apply(themeIdentifier, isCustom, !randomTheme);
}

export function set(themeIdentifier: string, isCustom: boolean): void {
  apply(themeIdentifier, isCustom);
}

export function clearPreview(): void {
  if (isPreviewingTheme) {
    isPreviewingTheme = false;
    randomTheme = null;
    if (Config.customTheme) {
      apply("custom", true);
    } else {
      apply(Config.theme, false);
    }
  }
}

export function randomizeTheme(): void {
  let randomList: string[] | MonkeyTypes.CustomTheme[];
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
    } else if (Config.randomTheme === "on") {
      randomList = themes.map((t) => {
        return t.name;
      });
    } else {
      randomList = DB.getSnapshot().customThemes.map((ct) => ct._id);
    }

    const previousTheme = randomTheme;
    randomTheme = randomList[Math.floor(Math.random() * randomList.length)];

    // if (Config.randomTheme === "custom") {
    // changeCustomTheme(randomTheme, true);
    // } else {
    preview(randomTheme, Config.randomTheme === "custom");
    // }

    if (previousTheme != randomTheme) {
      let name = randomTheme.replace(/_/g, " ");
      if (Config.randomTheme === "custom") {
        name = (
          DB.getSnapshot().customThemes.find((ct) => ct._id === randomTheme)
            ?.name ?? "custom"
        ).replace(/_/g, " ");
      }
      Notifications.add(name, 0);
    }
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
    if (!Config.autoSwitchTheme || Config.customTheme) return;
    if (event.matches) {
      set(Config.themeDark, false);
    } else {
      set(Config.themeLight, false);
    }
  });

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (eventKey === "customTheme") {
    eventValue ? set("custom", true) : set(Config.theme, false);
  }
  if (eventKey === "customThemeColors") {
    nosave ? preview("custom", true) : set("custom", true);
  }
  if (eventKey === "theme") {
    clearPreview();
    set(eventValue as string, false);
  }
  if (eventKey === "setThemes") {
    clearPreview();
    if (eventValue) {
      set("custom", true);
    } else {
      if (Config.autoSwitchTheme) {
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          set(Config.themeDark, false);
        } else {
          set(Config.themeLight, false);
        }
      } else {
        set(Config.theme, false);
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
        set(Config.themeDark, false);
      } else {
        set(Config.themeLight, false);
      }
    } else {
      set(Config.theme, false);
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
    set(Config.themeLight, false);
  }
  if (
    eventKey === "themeDark" &&
    Config.autoSwitchTheme &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches &&
    !nosave
  ) {
    set(Config.themeDark, false);
  }
});
