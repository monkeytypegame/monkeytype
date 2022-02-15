import Config, * as UpdateConfig from "../config";
import * as ThemeController from "../controllers/theme-controller";
import * as Misc from "../misc";
import * as Notifications from "../elements/notifications";
import * as ThemeColors from "../elements/theme-colors";
import * as ChartController from "../controllers/chart-controller";

export function updateActiveButton(): void {
  let activeThemeName = Config.theme;
  if (Config.randomTheme !== "off" && ThemeController.randomTheme !== null) {
    activeThemeName = ThemeController.randomTheme;
  }
  $(`.pageSettings .section.themes .theme`).removeClass("active");
  $(`.pageSettings .section.themes .theme[theme=${activeThemeName}]`).addClass(
    "active"
  );
}

function updateColors(
  colorPicker: JQuery<HTMLElement>,
  color: string,
  onlyStyle = false,
  noThemeUpdate = false
): void {
  if (onlyStyle) {
    const colorID = colorPicker.find("input[type=color]").attr("id");
    if (colorID === undefined) console.error("Could not find color ID!");
    if (!noThemeUpdate && colorID !== undefined)
      document.documentElement.style.setProperty(colorID, color);
    const pickerButton = colorPicker.find("label");
    pickerButton.val(color);
    pickerButton.attr("value", color);
    if (pickerButton.attr("for") !== "--bg-color")
      pickerButton.css("background-color", color);
    colorPicker.find("input[type=text]").val(color);
    colorPicker.find("input[type=color]").attr("value", color);
    return;
  }
  const colorREGEX = [
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

  for (const regex of colorREGEX) {
    if (color.match(regex.rule)) {
      color = regex.start + color + regex.end;
      break;
    }
  }

  $(".colorConverter").css("color", color);
  const hexColor: string | undefined = Misc.convertRGBtoHEX(
    $(".colorConverter").css("color")
  );
  if (hexColor === undefined) {
    return;
  }

  color = hexColor;

  const colorID = colorPicker.find("input[type=color]").attr("id");

  if (colorID === undefined) console.error("Could not find color ID!");
  if (!noThemeUpdate && colorID !== undefined)
    document.documentElement.style.setProperty(colorID, color);

  const pickerButton = colorPicker.find("label");

  pickerButton.val(color);
  pickerButton.attr("value", color);
  if (pickerButton.attr("for") !== "--bg-color")
    pickerButton.css("background-color", color);
  colorPicker.find("input[type=text]").val(color);
  colorPicker.find("input[type=color]").attr("value", color);
}

export async function refreshButtons(): Promise<void> {
  const favThemesEl = $(
    ".pageSettings .section.themes .favThemes.buttons"
  ).empty();
  const themesEl = $(
    ".pageSettings .section.themes .allThemes.buttons"
  ).empty();

  let activeThemeName = Config.theme;
  if (Config.randomTheme !== "off" && ThemeController.randomTheme !== null) {
    activeThemeName = ThemeController.randomTheme;
  }

  const themes = await Misc.getSortedThemesList();
  //first show favourites
  if (Config.favThemes.length > 0) {
    favThemesEl.css({ paddingBottom: "1rem" });
    themes.forEach((theme) => {
      // @ts-ignore TODO: Remove this comment once the config.js is converted to ts
      if (Config.favThemes.includes(theme.name)) {
        const activeTheme = activeThemeName === theme.name ? "active" : "";
        favThemesEl.append(
          `<div class="theme button ${activeTheme}" theme='${
            theme.name
          }' style="color:${theme.mainColor};background:${theme.bgColor}">
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
    // @ts-ignore TODO: Remove this comment once the config.js is converted to ts
    if (!Config.favThemes.includes(theme.name)) {
      const activeTheme = activeThemeName === theme.name ? "active" : "";
      themesEl.append(
        `<div class="theme button ${activeTheme}" theme='${
          theme.name
        }' style="color:${theme.mainColor};background:${theme.bgColor}">
        <div class="activeIndicator"><i class="fas fa-circle"></i></div>
        <div class="text">${theme.name.replace(/_/g, " ")}</div>
        <div class="favButton"><i class="far fa-star"></i></div></div>`
      );
    }
  });
  updateActiveButton();
}

export function setCustomInputs(noThemeUpdate = false): void {
  $(
    ".pageSettings .section.themes .tabContainer .customTheme .colorPicker"
  ).each((_, element: HTMLElement) => {
    const currentColor =
      Config.customThemeColors[
        ThemeController.colorVars.indexOf(
          // @ts-ignore TODO: Remove this before merging
          $(element).find("input[type=color]").attr("id")
        )
      ];

    //todo check if needed
    // $(index).find("input[type=color]").val(currentColor);
    // $(index).find("input[type=color]").attr("value", currentColor);
    // $(index).find("input[type=text]").val(currentColor);
    updateColors($(element), currentColor, false, noThemeUpdate);
  });
}

function toggleFavourite(themeName: string): void {
  // @ts-ignore TODO: Remove this comment once config.js is converted to typescript
  if (Config.favThemes.includes(themeName)) {
    // already favourite, remove
    UpdateConfig.setFavThemes(Config.favThemes.filter((t) => t !== themeName));
  } else {
    // add to favourites
    const newList: Array<string> = Config.favThemes;
    newList.push(themeName);
    UpdateConfig.setFavThemes(newList);
  }
  UpdateConfig.saveToLocalStorage();
  refreshButtons();
}

export function updateActiveTab(): void {
  $(".pageSettings .section.themes .tabs .button").removeClass("active");
  if (!Config.customTheme) {
    $(".pageSettings .section.themes .tabs .button[tab='preset']").addClass(
      "active"
    );

    // Misc.swapElements(
    //   $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
    //   $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
    //   250
    // );
  } else {
    $(".pageSettings .section.themes .tabs .button[tab='custom']").addClass(
      "active"
    );

    // Misc.swapElements(
    //   $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
    //   $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
    //   250
    // );
  }
}

// Add events to the DOM

$(".pageSettings .section.themes .tabs .button").on("click", (e) => {
  $(".pageSettings .section.themes .tabs .button").removeClass("active");
  const $target = $(e.currentTarget);
  $target.addClass("active");
  setCustomInputs();
  if ($target.attr("tab") == "preset") {
    UpdateConfig.setCustomTheme(false);
    // ThemeController.set(Config.theme);
    // applyCustomThemeColors();
    // Misc.swapElements(
    //   $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
    //   $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
    //   250
    // );
  } else {
    UpdateConfig.setCustomTheme(true);
    // ThemeController.set("custom");
    // applyCustomThemeColors();
    // Misc.swapElements(
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
    const theme = $(e.currentTarget).parents(".theme.button").attr("theme");
    if (theme !== undefined) toggleFavourite(theme);
    else
      console.error(
        "Could not find the theme attribute attached to the button clicked!"
      );
  }
);

$(document).on("click", ".pageSettings .section.themes .theme.button", (e) => {
  const theme = $(e.currentTarget).attr("theme");
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
  const $colorVar = $(e.currentTarget).attr("id") as string;
  const $pickedColor = $(e.currentTarget).val() as string;

  updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor, true);
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
  //   const $colorVar = $(e.currentTarget).attr("id").replace("-txt", "");
  //   const $pickedColor = $(e.currentTarget).val();

  //   document.documentElement.style.setProperty($colorVar, $pickedColor);
  //   $(".colorPicker #" + $colorVar).attr("value", $pickedColor);
  //   $(".colorPicker #" + $colorVar).val($pickedColor);
  //   $(".colorPicker #" + $colorVar + "-txt").val($pickedColor);
});

$(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
).on("change", (e) => {
  // UpdateConfig.setCustomTheme(true, true);
  const $colorVar = $(e.currentTarget).attr("id") as string;
  const $pickedColor = $(e.currentTarget).val() as string;

  updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
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
  //   const $colorVar = $(e.currentTarget).attr("id").replace("-txt", "");
  //   const $pickedColor = $(e.currentTarget).val();

  //   document.documentElement.style.setProperty($colorVar, $pickedColor);
  //   $(".colorPicker #" + $colorVar).attr("value", $pickedColor);
  //   $(".colorPicker #" + $colorVar).val($pickedColor);
  //   $(".colorPicker #" + $colorVar + "-txt").val($pickedColor);
});

$(".pageSettings .section.themes .tabContainer .customTheme input[type=text]")
  .on("blur", (e) => {
    const $colorVar = $(e.currentTarget).attr("id") as string;
    const $pickedColor = $(e.currentTarget).val() as string;

    updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
  })
  .on("keypress", function (e) {
    if (e.code === "Enter") {
      $(this).attr("disabled", "disabled");
      const $colorVar = $(e.currentTarget).attr("id") as string;
      const $pickedColor = $(e.currentTarget).val() as string;

      updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
      $(this).removeAttr("disabled");
    }
  });

$(".pageSettings .saveCustomThemeButton").on("click", () => {
  const save: Array<string> = [];
  $.each(
    $(".pageSettings .section.customTheme [type='color']"),
    (_, element) => {
      save.push($(element).attr("value") as string);
    }
  );
  UpdateConfig.setCustomThemeColors(save);
  ThemeController.set("custom");
  Notifications.add("Custom theme colors saved", 1);
});

$(".pageSettings #loadCustomColorsFromPreset").on("click", () => {
  // previewTheme(Config.theme);
  $("#currentTheme").attr("href", `themes/${Config.theme}.css`);

  ThemeController.colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });

  setTimeout(async () => {
    ChartController.updateAllChartColors();

    const themeColors = await ThemeColors.get();

    ThemeController.colorVars.forEach((colorName) => {
      let color;
      if (colorName === "--bg-color") {
        color = themeColors.bg;
      } else if (colorName === "--main-color") {
        color = themeColors.main;
      } else if (colorName === "--sub-color") {
        color = themeColors.sub;
      } else if (colorName === "--caret-color") {
        color = themeColors.caret;
      } else if (colorName === "--text-color") {
        color = themeColors.text;
      } else if (colorName === "--error-color") {
        color = themeColors.error;
      } else if (colorName === "--error-extra-color") {
        color = themeColors.errorExtra;
      } else if (colorName === "--colorful-error-color") {
        color = themeColors.colorfulError;
      } else if (colorName === "--colorful-error-extra-color") {
        color = themeColors.colorfulErrorExtra;
      }

      updateColors($(".colorPicker #" + colorName).parent(), color);
    });
  }, 250);
});
