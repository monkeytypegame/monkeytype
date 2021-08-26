import * as ThemeColors from "./theme-colors";
import * as ChartController from "./chart-controller";
import * as Misc from "./misc";
import * as Notifications from "./notifications";
import Config from "./config";
import * as UI from "./ui";
import tinycolor from "tinycolor2";

const domtoimage = require("dom-to-image");

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

async function updateFavicon(size, curveSize) {
  setTimeout(() => {
    domtoimage
      .toPng(document.querySelector(".logo .icon"))
      .then(function (dataUrl) {
        // console.log(dataUrl);
        // ctx.drawImage(dataUrl, 0, 0);
        // $('body').prepend(canvas);
        $("#favicon").attr("href", dataUrl);
      });
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
    $(".current-theme .text").text(themeName.replace("_", " "));
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
        $(".keymap-key").attr("style", "");
        ChartController.updateAllChartColors();
        updateFavicon(128, 32);
        $("#metaThemeColor").attr("content", colors.bg);
      });
    }
  });
}

export function preview(themeName) {
  isPreviewingTheme = true;
  apply(themeName, true);
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

    preview(randomTheme);

    if (previousTheme != randomTheme) {
      // Notifications.add(randomTheme.replace(/_/g, " "), 0);
    }
  });
}

export function clearRandom() {
  randomTheme = null;
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
  }
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
