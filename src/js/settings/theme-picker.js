import Config, * as UpdateConfig from "./config";
import * as ThemeController from "./theme-controller";
import * as Misc from "./misc";
import * as Notifications from "./notifications";
import * as CommandlineLists from "./commandline-lists";
import * as ThemeColors from "./theme-colors";
import * as ChartController from "./chart-controller";

export function updateActiveButton() {
  $(`.pageSettings .section.themes .theme`).removeClass("active");
  $(`.pageSettings .section.themes .theme[theme=${Config.theme}]`).addClass(
    "active"
  );
}

function updateColors(colorPicker, color, onlyStyle, noThemeUpdate = false) {
  if (onlyStyle) {
    let colorid = colorPicker.find("input[type=color]").attr("id");
    if (!noThemeUpdate)
      document.documentElement.style.setProperty(colorid, color);
    let pickerButton = colorPicker.find("label");
    pickerButton.val(color);
    pickerButton.attr("value", color);
    if (pickerButton.attr("for") !== "--bg-color")
      pickerButton.css("background-color", color);
    colorPicker.find("input[type=text]").val(color);
    colorPicker.find("input[type=color]").attr("value", color);
    return;
  }
  let colorREGEX = [
    {
      rule: /\b[0-9]{1,3},\s?[0-9]{1,3},\s?[0-9]{1,3}\s*\b/,
      start: "rgb(",
      end: ")",
    },
    {
      rule: /\b[A-Z, a-z, 0-9]{6}\b/,
      start: "#",
      end: "",
    },
    {
      rule: /\b[0-9]{1,3},\s?[0-9]{1,3}%,\s?[0-9]{1,3}%?\s*\b/,
      start: "hsl(",
      end: ")",
    },
  ];

  color = color.replace("°", "");

  for (let regex of colorREGEX) {
    if (color.match(regex.rule)) {
      color = regex.start + color + regex.end;
      break;
    }
  }

  $(".colorConverter").css("color", color);
  color = Misc.convertRGBtoHEX($(".colorConverter").css("color"));
  if (!color) {
    return;
  }

  let colorid = colorPicker.find("input[type=color]").attr("id");

  if (!noThemeUpdate)
    document.documentElement.style.setProperty(colorid, color);

  let pickerButton = colorPicker.find("label");

  pickerButton.val(color);
  pickerButton.attr("value", color);
  if (pickerButton.attr("for") !== "--bg-color")
    pickerButton.css("background-color", color);
  colorPicker.find("input[type=text]").val(color);
  colorPicker.find("input[type=color]").attr("value", color);
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
            `<div class="theme button ${activeTheme}" theme='${
              theme.name
            }' style="color:${theme.textColor};background:${theme.bgColor}">
          <div class="activeIndicator"><i class="fas fa-circle"></i></div>
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
          `<div class="theme button ${activeTheme}" theme='${
            theme.name
          }' style="color:${theme.textColor};background:${theme.bgColor}">
          <div class="activeIndicator"><i class="fas fa-circle"></i></div>
          <div class="text">${theme.name.replace(/_/g, " ")}</div>
          <div class="favButton"><i class="far fa-star"></i></div></div>`
        );
      }
    });
    updateActiveButton();
  });
}

export function setCustomInputs(noThemeUpdate) {
  $(
    ".pageSettings .section.themes .tabContainer .customTheme .colorPicker"
  ).each((n, index) => {
    let currentColor =
      Config.customThemeColors[
        ThemeController.colorVars.indexOf(
          $(index).find("input[type=color]").attr("id")
        )
      ];

    //todo check if needed
    // $(index).find("input[type=color]").val(currentColor);
    // $(index).find("input[type=color]").attr("value", currentColor);
    // $(index).find("input[type=text]").val(currentColor);
    updateColors($(index), currentColor, false, noThemeUpdate);
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

    // UI.swapElements(
    //   $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
    //   $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
    //   250
    // );
  } else {
    $(".pageSettings .section.themes .tabs .button[tab='custom']").addClass(
      "active"
    );

    // UI.swapElements(
    //   $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
    //   $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
    //   250
    // );
  }
}

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
  // UpdateConfig.setCustomTheme(true, true);
  let $colorVar = $(e.currentTarget).attr("id");
  let $pickedColor = $(e.currentTarget).val();

  //todo check if needed
  //   document.documentElement.style.setProperty($colorVar, $pickedColor);
  //   $(".colorPicker #" + $colorVar).attr("value", $pickedColor);
  //   $(".colorPicker #" + $colorVar).val($pickedColor);
  //   $(".colorPicker #" + $colorVar + "-txt").val($pickedColor);
  // });

  // $(
  //   ".pageSettings .section.themes .tabContainer .customTheme input[type=text]"
  // ).on("input", (e) => {
  //   // UpdateConfig.setCustomTheme(true, true);
  //   let $colorVar = $(e.currentTarget).attr("id").replace("-txt", "");
  //   let $pickedColor = $(e.currentTarget).val();

  //   document.documentElement.style.setProperty($colorVar, $pickedColor);
  //   $(".colorPicker #" + $colorVar).attr("value", $pickedColor);
  //   $(".colorPicker #" + $colorVar).val($pickedColor);
  //   $(".colorPicker #" + $colorVar + "-txt").val($pickedColor);
  updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor, true);
});

$(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
).on("change", (e) => {
  // UpdateConfig.setCustomTheme(true, true);
  let $colorVar = $(e.currentTarget).attr("id");
  let $pickedColor = $(e.currentTarget).val();

  //todo check if needed
  //   document.documentElement.style.setProperty($colorVar, $pickedColor);
  //   $(".colorPicker #" + $colorVar).attr("value", $pickedColor);
  //   $(".colorPicker #" + $colorVar).val($pickedColor);
  //   $(".colorPicker #" + $colorVar + "-txt").val($pickedColor);
  // });

  // $(
  //   ".pageSettings .section.themes .tabContainer .customTheme input[type=text]"
  // ).on("input", (e) => {
  //   // UpdateConfig.setCustomTheme(true, true);
  //   let $colorVar = $(e.currentTarget).attr("id").replace("-txt", "");
  //   let $pickedColor = $(e.currentTarget).val();

  //   document.documentElement.style.setProperty($colorVar, $pickedColor);
  //   $(".colorPicker #" + $colorVar).attr("value", $pickedColor);
  //   $(".colorPicker #" + $colorVar).val($pickedColor);
  //   $(".colorPicker #" + $colorVar + "-txt").val($pickedColor);
  updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
});

$(".pageSettings .section.themes .tabContainer .customTheme input[type=text]")
  .on("blur", (e) => {
    let $colorVar = $(e.currentTarget).attr("id");
    let $pickedColor = $(e.currentTarget).val();

    updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
  })
  .on("keypress", function (e) {
    if (e.which === 13) {
      $(this).attr("disabled", "disabled");
      let $colorVar = $(e.currentTarget).attr("id");
      let $pickedColor = $(e.currentTarget).val();

      updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
      $(this).removeAttr("disabled");
    }
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

  setTimeout(async () => {
    ChartController.updateAllChartColors();

    let themecolors = await ThemeColors.get();

    ThemeController.colorVars.forEach((colorName) => {
      let color;
      if (colorName === "--bg-color") {
        color = themecolors.bg;
      } else if (colorName === "--main-color") {
        color = themecolors.main;
      } else if (colorName === "--sub-color") {
        color = themecolors.sub;
      } else if (colorName === "--caret-color") {
        color = themecolors.caret;
      } else if (colorName === "--text-color") {
        color = themecolors.text;
      } else if (colorName === "--error-color") {
        color = themecolors.error;
      } else if (colorName === "--error-extra-color") {
        color = themecolors.errorExtra;
      } else if (colorName === "--colorful-error-color") {
        color = themecolors.colorfulError;
      } else if (colorName === "--colorful-error-extra-color") {
        color = themecolors.colorfulErrorExtra;
      }

      updateColors($(".colorPicker #" + colorName).parent(), color);
    });
  }, 250);
});
