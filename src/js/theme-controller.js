import * as ThemeColors from "./theme-colors";
import * as ChartController from "./chart-controller";
import * as Misc from "./misc";
import Config from "./config";
import * as UI from "./ui";
import tinycolor from "tinycolor2";
import * as BackgroundFilter from "./custom-background-filter";

let isPreviewingTheme = false;
export let randomTheme = null;

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

function updateFavicon(size, curveSize) {
  setTimeout(async () => {
    let maincolor, bgcolor;
    bgcolor = await ThemeColors.get("bg");
    maincolor = await ThemeColors.get("main");
    if (bgcolor == maincolor) {
      bgcolor = "#111";
      maincolor = "#eee";
    }
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    let ctx = canvas.getContext("2d");
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

function clearCustomTheme() {
  colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });
}

let loadStyle = function (name) {
  return new Promise((resolve, reject) => {
    let link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.id = "currentTheme";
    link.onload = () => {
      resolve();
    };
    link.href = `themes/${name}.css`;

    let headScript = document.querySelector("#currentTheme");
    headScript.replaceWith(link);
  });
};

export function apply(themeName, isPreview = false) {
  clearCustomTheme();

  let name = "serika_dark";
  if (themeName !== "custom") {
    name = themeName;
    UI.swapElements(
      $('.pageSettings [tabContent="custom"]'),
      $('.pageSettings [tabContent="preset"]'),
      250
    );
  } else {
    //is custom
    UI.swapElements(
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
      ThemeColors.get().then((colors) => {
        $(".current-theme .text").text(themeName.replace(/_/g, " "));
        $(".keymap-key").attr("style", "");
        ChartController.updateAllChartColors();
        updateFavicon(128, 32);
        $("#metaThemeColor").attr("content", colors.bg);
      });
    }
  });
}

export function preview(themeName, randomTheme = false) {
  isPreviewingTheme = true;
  apply(themeName, true && !randomTheme);
}

export function set(themeName) {
  apply(themeName);
}

export function clearPreview() {
  if (isPreviewingTheme) {
    isPreviewingTheme = false;
    if (Config.customTheme) {
      apply("custom");
    } else {
      apply(Config.theme);
    }
  }
}

export function randomizeTheme() {
  var randomList;
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

export function clearRandom() {
  randomTheme = null;
}

export function applyCustomBackgroundSize() {
  if (Config.customBackgroundSize == "max") {
    $(".customBackground img").css({
      // width: "calc(100%)",
      // height: "calc(100%)",
      objectFit: "",
    });
  } else if (Config.customBackgroundSize != "") {
    $(".customBackground img").css({
      objectFit: Config.customBackgroundSize,
    });
  }
}

export function applyCustomBackground() {
  // $(".customBackground").css({
  //   backgroundImage: `url(${Config.customBackground})`,
  //   backgroundAttachment: "fixed",
  // });
  if (Config.customBackground === "") {
    $("#words").removeClass("noErrorBorder");
    $(".customBackground img").remove();
  } else {
    $("#words").addClass("noErrorBorder");
    let $img = $("<img>", {
      src: Config.customBackground,
    });
    $(".customBackground").html($img);
    BackgroundFilter.apply();
    applyCustomBackgroundSize();
  }
}
