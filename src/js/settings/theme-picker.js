import Config, * as UpdateConfig from "./config";
import * as ThemeController from "./theme-controller";
import * as Misc from "./misc";
import * as Notifications from "./notifications";
import * as CommandlineLists from "./commandline-lists";
import * as ThemeColors from "./theme-colors";
import * as ChartController from "./chart-controller";
import * as UI from "./ui";

export function updateActiveButton() {
  $(`.pageSettings .section.themes .theme`).removeClass("active");
  $(`.pageSettings .section.themes .theme[theme=${Config.theme}]`).addClass(
    "active"
  );
}

export function refreshButtons() {
  let favThemesEl = $(
    ".pageSettings .section.themes .favThemes.buttons"
  ).empty();
  let themesEl = $(".pageSettings .section.themes .allThemes.buttons").empty();

  let activeThemeName = Config.theme;
  if (Config.randomTheme !== "off" && ThemeController.randomTheme !== null) {
    activeThemeName = ThemeController.randomTheme;
  }

  Misc.getSortedThemesList().then((themes) => {
    //first show favourites
    if (Config.favThemes.length > 0) {
      favThemesEl.css({ paddingBottom: "1rem" });
      themes.forEach((theme) => {
        if (Config.favThemes.includes(theme.name)) {
          let activeTheme = activeThemeName === theme.name ? "active" : "";
          favThemesEl.append(
            `<div class="theme button" theme='${theme.name}' style="color:${
              theme.textColor
            };background:${theme.bgColor}">
          <div class="activeIndicator ${activeTheme}"><i class="fas fa-circle"></i></div>
          <div class="text">${theme.name.replace(/_/g, " ")}</div>
          <div class="favButton active"><i class="fas fa-star"></i></div></div>`
          );
        }
      });
    } else {
      favThemesEl.css({ paddingBottom: "0" });
    }
    //then the rest
    themes.forEach((theme) => {
      if (!Config.favThemes.includes(theme.name)) {
        let activeTheme = activeThemeName === theme.name ? "active" : "";
        themesEl.append(
          `<div class="theme button" theme='${theme.name}' style="color:${
            theme.textColor
          };background:${theme.bgColor}">
          <div class="activeIndicator ${activeTheme}"><i class="fas fa-circle"></i></div>
          <div class="text">${theme.name.replace(/_/g, " ")}</div>
          <div class="favButton"><i class="far fa-star"></i></div></div>`
        );
      }
    });
    updateActiveButton();
  });
}

export function setCustomInputs() {
  $(
    ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
  ).each((n, index) => {
    let currentColor =
      Config.customThemeColors[
        ThemeController.colorVars.indexOf($(index).attr("id"))
      ];
    $(index).val(currentColor);
    $(index).attr("value", currentColor);
    $(index).prev().text(currentColor);
  });
}

function toggleFavourite(themename) {
  if (Config.favThemes.includes(themename)) {
    //already favourite, remove
    UpdateConfig.setFavThemes(
      Config.favThemes.filter((t) => {
        if (t !== themename) {
          return t;
        }
      })
    );
  } else {
    //add to favourites
    let newlist = Config.favThemes;
    newlist.push(themename);
    UpdateConfig.setFavThemes(newlist);
  }
  UpdateConfig.saveToLocalStorage();
  refreshButtons();
  // showFavouriteThemesAtTheTop();
  CommandlineLists.updateThemeCommands();
}

export function updateActiveTab() {
  $(".pageSettings .section.themes .tabs .button").removeClass("active");
  if (!Config.customTheme) {
    $(".pageSettings .section.themes .tabs .button[tab='preset']").addClass(
      "active"
    );

    UI.swapElements(
      $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
      $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
      250
    );
  } else {
    $(".pageSettings .section.themes .tabs .button[tab='custom']").addClass(
      "active"
    );

    UI.swapElements(
      $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
      $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
      250
    );
  }
}

$("#shareCustomThemeButton").click((e) => {
  if (!e.shiftKey) {
    let share = [];
    $.each(
      $(".pageSettings .section.customTheme [type='color']"),
      (index, element) => {
        share.push($(element).attr("value"));
      }
    );

    let url =
      "https://monkeytype.com?" +
      Misc.objectToQueryString({ customTheme: share });
    navigator.clipboard.writeText(url).then(
      function () {
        Notifications.add("URL Copied to clipboard", 0);
      },
      function (err) {
        Notifications.add(
          "Something went wrong when copying the URL: " + err,
          -1
        );
      }
    );
  }
});

$(".pageSettings .section.themes .tabs .button").click((e) => {
  $(".pageSettings .section.themes .tabs .button").removeClass("active");
  var $target = $(e.currentTarget);
  $target.addClass("active");
  setCustomInputs();
  if ($target.attr("tab") == "preset") {
    UpdateConfig.setCustomTheme(false);
    // ThemeController.set(Config.theme);
    // applyCustomThemeColors();
    // UI.swapElements(
    //   $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
    //   $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
    //   250
    // );
  } else {
    UpdateConfig.setCustomTheme(true);
    // ThemeController.set("custom");
    // applyCustomThemeColors();
    // UI.swapElements(
    //   $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
    //   $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
    //   250
    // );
  }
});

$(document).on(
  "click",
  ".pageSettings .section.themes .theme .favButton",
  (e) => {
    let theme = $(e.currentTarget).parents(".theme.button").attr("theme");
    toggleFavourite(theme);
  }
);

$(document).on("click", ".pageSettings .section.themes .theme.button", (e) => {
  let theme = $(e.currentTarget).attr("theme");
  if (!$(e.target).hasClass("favButton")) {
    UpdateConfig.setTheme(theme);
    // ThemePicker.refreshButtons();
    updateActiveButton();
  }
});

$(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
).on("input", (e) => {
  UpdateConfig.setCustomTheme(true, true);
  let $colorVar = $(e.currentTarget).attr("id");
  let $pickedColor = $(e.currentTarget).val();

  document.documentElement.style.setProperty($colorVar, $pickedColor);
  $(".colorPicker #" + $colorVar).attr("value", $pickedColor);
  $(".colorPicker [for=" + $colorVar + "]").text($pickedColor);
});

$(".pageSettings .saveCustomThemeButton").click((e) => {
  let save = [];
  $.each(
    $(".pageSettings .section.customTheme [type='color']"),
    (index, element) => {
      save.push($(element).attr("value"));
    }
  );
  UpdateConfig.setCustomThemeColors(save);
  ThemeController.set("custom");
  Notifications.add("Custom theme colors saved", 1);
});

$(".pageSettings #loadCustomColorsFromPreset").click((e) => {
  // previewTheme(Config.theme);
  $("#currentTheme").attr("href", `themes/${Config.theme}.css`);

  ThemeController.colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });

  setTimeout(() => {
    ChartController.updateAllChartColors();

    ThemeController.colorVars.forEach((colorName) => {
      let color;
      if (colorName === "--bg-color") {
        color = ThemeColors.bg;
      } else if (colorName === "--main-color") {
        color = ThemeColors.main;
      } else if (colorName === "--sub-color") {
        color = ThemeColors.sub;
      } else if (colorName === "--caret-color") {
        color = ThemeColors.caret;
      } else if (colorName === "--text-color") {
        color = ThemeColors.text;
      } else if (colorName === "--error-color") {
        color = ThemeColors.error;
      } else if (colorName === "--error-extra-color") {
        color = ThemeColors.errorExtra;
      } else if (colorName === "--colorful-error-color") {
        color = ThemeColors.colorfulError;
      } else if (colorName === "--colorful-error-extra-color") {
        color = ThemeColors.colorfulErrorExtra;
      }
      $(".colorPicker #" + colorName).attr("value", color);
      $(".colorPicker #" + colorName).val(color);
      $(".colorPicker [for=" + colorName + "]").text(color);
    });
  }, 250);
});
