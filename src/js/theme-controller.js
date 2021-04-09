import * as ThemeColors from "./theme-colors";
import * as ChartController from "./chart-controller";
import * as Misc from "./misc";
import * as Notifications from "./notifications";
import Config from "./config";
import * as UI from "./ui";

let isPreviewingTheme = false;
let randomTheme = null;

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
  let maincolor, bgcolor;

  bgcolor = ThemeColors.bg;
  maincolor = ThemeColors.main;

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
  ctx.font = "900 " + (size / 2) * 1.2 + "px Roboto Mono";
  ctx.textAlign = "center";
  ctx.fillStyle = maincolor;
  ctx.fillText("mt", size / 2 + size / 32, (size / 3) * 2.1);
  $("#favicon").attr("href", canvas.toDataURL("image/png"));
}

function clearCustomTheme() {
  colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });
}

export function apply(themeName) {
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

  $(".keymap-key").attr("style", "");
  $("#currentTheme").attr("href", `themes/${name}.css`);
  $(".current-theme").text(themeName.replace("_", " "));

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
  setTimeout(() => {
    $(".keymap-key").attr("style", "");
    ChartController.updateAllChartColors();
    updateFavicon(32, 14);
    $("#metaThemeColor").attr("content", ThemeColors.main);
  }, 500);
}

export function preview(themeName) {
  isPreviewingTheme = true;
  apply(themeName);
}

export function set(themeName) {
  apply(themeName);
}

export function clearPreview() {
  if (isPreviewingTheme) {
    isPreviewingTheme = false;
    apply(Config.theme);
  }
}

export function randomiseTheme() {
  var randomList;
  Misc.getThemesList().then((themes) => {
    randomList = themes.map((t) => {
      return t.name;
    });

    if (Config.randomTheme === "fav" && Config.favThemes.length > 0)
      randomList = Config.favThemes;

    const previousTheme = randomTheme;
    randomTheme = randomList[Math.floor(Math.random() * randomList.length)];

    preview(randomTheme);

    if (previousTheme != randomTheme) {
      Notifications.add(randomTheme.replace(/_/g, " "), 0);
    }
  });
}

export function clearRandom() {
  randomTheme = null;
}

export function applyCustomBackground() {
  $(".customBackground").css({
    backgroundImage: `url(${Config.customBackground})`,
    backgroundAttachment: "fixed",
  });
  if (Config.customBackground === "") {
    $("#words").removeClass("noErrorBorder");
  } else {
    $("#words").addClass("noErrorBorder");
  }
}

export function applyCustomBackgroundSize() {
  if (Config.customBackgroundSize == "max") {
    $(".customBackground").css({
      backgroundSize: "100% 100%",
    });
  } else if (Config.customBackgroundSize != "") {
    $(".customBackground").css({
      backgroundSize: Config.customBackgroundSize,
    });
  }
}
