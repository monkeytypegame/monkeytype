import Config from "./config";
import * as ThemeController from "./theme-controller";
import * as Misc from "./misc";
import * as Notifications from "./notifications";

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
