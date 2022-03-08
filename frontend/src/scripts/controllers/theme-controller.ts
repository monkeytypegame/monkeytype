import * as ThemeColors from "../elements/theme-colors";
import * as ChartController from "./chart-controller";
import * as Misc from "../misc";
import Config from "../config";
import tinycolor from "tinycolor2";
import * as BackgroundFilter from "../elements/custom-background-filter";
import * as ConfigEvent from "../observables/config-event";

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

export function apply(themeName: string, isPreview = false): void {
  clearCustomTheme();

  let name = "serika_dark";
  if (themeName !== "custom") {
    name = themeName;
    Misc.swapElements(
      $('.pageSettings [tabContent="custom"]'),
      $('.pageSettings [tabContent="preset"]'),
      250
    );
  } else {
    //is custom
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
    if (themeName === "custom") {
      colorVars.forEach((e, index) => {
        document.documentElement.style.setProperty(
          e,
          Config.customThemeColors[index]
        );
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
        $(".current-theme .text").text(themeName.replace(/_/g, " "));
        $(".keymap-key").attr("style", "");
        ChartController.updateAllChartColors();
        updateFavicon(128, 32);
        $("#metaThemeColor").attr("content", colors.bg);
      });
    }
  });
}

export function preview(themeName: string, randomTheme = false): void {
  isPreviewingTheme = true;
  apply(themeName, true && !randomTheme);
}

export function set(themeName: string): void {
  apply(themeName);
}

export function clearPreview(): void {
  if (isPreviewingTheme) {
    isPreviewingTheme = false;
    randomTheme = null;
    if (Config.customTheme) {
      apply("custom");
    } else {
      apply(Config.theme);
    }
  }
}

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

    const previousTheme = randomTheme;
    randomTheme = randomList[Math.floor(Math.random() * randomList.length)];

    preview(randomTheme, true);

    if (previousTheme != randomTheme) {
      // Notifications.add(randomTheme.replace(/_/g, " "), 0);
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
      set(Config.themeDark);
    } else {
      set(Config.themeLight);
    }
  });

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (eventKey === "customTheme")
    eventValue ? set("custom") : set(Config.theme);
  if (eventKey === "theme") {
    clearPreview();
    set(eventValue as string);
  }
  if (eventKey === "setThemes") {
    clearPreview();
    if (eventValue) {
      set("custom");
    } else {
      if (Config.autoSwitchTheme) {
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          set(Config.themeDark);
        } else {
          set(Config.themeLight);
        }
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
        set(Config.themeDark);
      } else {
        set(Config.themeLight);
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
    set(Config.themeLight);
  }
  if (
    eventKey === "themeDark" &&
    Config.autoSwitchTheme &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches &&
    !nosave
  ) {
    set(Config.themeDark);
  }
});
