import Config, * as UpdateConfig from "../../config";
import * as ThemeController from "../../controllers/theme-controller";
import * as Misc from "../../utils/misc";
import * as Colors from "../../utils/colors";
import * as Notifications from "../notifications";
import * as ThemeColors from "../theme-colors";
import * as ChartController from "../../controllers/chart-controller";
import * as Loader from "../loader";
import * as DB from "../../db";
import * as ConfigEvent from "../../observables/config-event";
import { isAuthenticated } from "../../firebase";
import * as ActivePage from "../../states/active-page";
import {
  CustomThemeColors,
  ThemeName,
} from "@monkeytype/contracts/schemas/configs";
import { captureException } from "../../sentry";
import { ThemesListSorted } from "../../constants/themes";

function updateActiveButton(): void {
  let activeThemeName: string = Config.theme;
  if (
    Config.randomTheme !== "off" &&
    Config.randomTheme !== "custom" &&
    ThemeController.randomTheme !== null
  ) {
    activeThemeName = ThemeController.randomTheme;
  }

  document
    .querySelectorAll(".pageSettings .section.themes .theme")
    .forEach((el) => {
      el.classList.remove("active");
    });
  document
    .querySelector(
      `.pageSettings .section.themes .theme[theme='${activeThemeName}']`
    )
    ?.classList.add("active");
}

function updateColors(
  colorPicker: JQuery,
  color: string,
  onlyStyle = false,
  noThemeUpdate = false
): void {
  if (onlyStyle) {
    const colorID = colorPicker.find("input.color").attr("id");
    if (colorID === undefined) console.error("Could not find color ID!");
    if (!noThemeUpdate && colorID !== undefined) {
      document.documentElement.style.setProperty(colorID, color);
    }
    const pickerButton = colorPicker.find("label");
    pickerButton.val(color);
    pickerButton.attr("value", color);
    if (pickerButton.attr("for") !== "--bg-color") {
      pickerButton.css("background-color", color);
    }
    colorPicker.find("input.input").val(color);
    colorPicker.find("input.color").attr("value", color);
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
  const hexColor: string | undefined = Colors.rgbStringtoHex(
    $(".colorConverter").css("color")
  );
  if (hexColor === undefined) {
    return;
  }

  color = hexColor;

  const colorID = colorPicker.find("input.color").attr("id");

  if (colorID === undefined) console.error("Could not find color ID!");
  if (!noThemeUpdate && colorID !== undefined) {
    document.documentElement.style.setProperty(colorID, color);
  }

  const pickerButton = colorPicker.find("label");

  pickerButton.val(color);
  pickerButton.attr("value", color);
  if (pickerButton.attr("for") !== "--bg-color") {
    pickerButton.css("background-color", color);
  }
  colorPicker.find("input.input").val(color);
  colorPicker.find("input.color").attr("value", color);
}

export async function refreshPresetButtons(): Promise<void> {
  // Update theme buttons
  const favThemesEl = document.querySelector<HTMLElement>(
    ".pageSettings .section.themes .favThemes.buttons"
  );
  const themesEl = document.querySelector<HTMLElement>(
    ".pageSettings .section.themes .allThemes.buttons"
  );

  if (favThemesEl === null || themesEl === null) {
    const msg =
      "Failed to fill preset theme buttons: favThemes or allThemes element not found";
    Notifications.add(msg, -1);
    captureException(new Error(msg));
    console.error(msg, { favThemesEl, themesEl });
    return;
  }

  favThemesEl.innerHTML = "";
  themesEl.innerHTML = "";

  let favThemesElHTML = "";
  let themesElHTML = "";

  let activeThemeName: string = Config.theme;
  if (
    Config.randomTheme !== "off" &&
    Config.randomTheme !== "custom" &&
    ThemeController.randomTheme !== null
  ) {
    activeThemeName = ThemeController.randomTheme;
  }

  const themes = ThemesListSorted;

  //first show favourites
  if (Config.favThemes.length > 0) {
    favThemesEl.style.marginBottom = "1rem";
    for (const theme of themes) {
      if (Config.favThemes.includes(theme.name)) {
        const activeTheme = activeThemeName === theme.name ? "active" : "";
        favThemesElHTML += `<div class="theme button ${activeTheme}" theme='${
          theme.name
        }' style="background: ${theme.bgColor}; color: ${
          theme.mainColor
        };outline: 0 solid ${theme.mainColor};">
          <div class="favButton active"><i class="fas fa-star"></i></div>
          <div class="text">${theme.name.replace(/_/g, " ")}</div>
          <div class="themeBubbles" style="background: ${
            theme.bgColor
          };outline: 0.25rem solid ${theme.bgColor};">
            <div class="themeBubble" style="background: ${
              theme.mainColor
            }"></div>
            <div class="themeBubble" style="background: ${
              theme.subColor
            }"></div>
            <div class="themeBubble" style="background: ${
              theme.textColor
            }"></div>
          </div>
          </div>
          `;
      }
    }
    favThemesEl.innerHTML = favThemesElHTML;
  } else {
    favThemesEl.style.marginBottom = "0";
  }
  //then the rest
  for (const theme of themes) {
    if (Config.favThemes.includes(theme.name)) {
      continue;
    }

    const activeTheme = activeThemeName === theme.name ? "active" : "";
    themesElHTML += `<div class="theme button ${activeTheme}" theme='${
      theme.name
    }' style="background: ${theme.bgColor}; color: ${
      theme.mainColor
    };outline: 0 solid ${theme.mainColor};">
      <div class="favButton"><i class="far fa-star"></i></div>
      <div class="text">${theme.name.replace(/_/g, " ")}</div>
      <div class="themeBubbles" style="background: ${
        theme.bgColor
      };outline: 0.25rem solid ${theme.bgColor};">
        <div class="themeBubble" style="background: ${theme.mainColor}"></div>
        <div class="themeBubble" style="background: ${theme.subColor}"></div>
        <div class="themeBubble" style="background: ${theme.textColor}"></div>
      </div>
      </div>
      `;
  }
  themesEl.innerHTML = themesElHTML;
}

export async function refreshCustomButtons(): Promise<void> {
  // Update custom theme buttons
  const customThemesEl = $(
    ".pageSettings .section.themes .allCustomThemes.buttons"
  ).empty();
  const addButton = $(".pageSettings .section.themes .addCustomThemeButton");
  const saveButton = $(
    ".pageSettings .section.themes .customThemeEdit #saveCustomThemeButton"
  );

  if (!isAuthenticated()) {
    saveButton.text("save");
    addButton.addClass("hidden");
    customThemesEl.css("margin-bottom", "0");
    return;
  }

  saveButton.text("save as new");
  addButton.removeClass("hidden");

  const customThemes = DB.getSnapshot()?.customThemes ?? [];

  if (customThemes.length === 0) {
    customThemesEl.css("margin-bottom", "0");
  } else {
    customThemesEl.css("margin-bottom", "1rem");
  }

  for (const customTheme of customThemes) {
    const bgColor = customTheme.colors[0];
    const mainColor = customTheme.colors[1];

    customThemesEl.append(
      `<div class="customTheme button" customThemeId='${customTheme._id}' 
      style="color:${mainColor};background:${bgColor}">
      <div class="editButton"><i class="fas fa-pen"></i></div>
      <div class="text">${customTheme.name.replace(/_/g, " ")}</div>
      <div class="delButton"><i class="fas fa-trash fa-fw"></i></div>
      </div>`
    );
  }
}

export function setCustomInputs(noThemeUpdate = false): void {
  $(
    ".pageSettings .section.themes .tabContainer .customTheme .colorPicker"
  ).each((_index, element: HTMLElement) => {
    const currentColor = Config.customThemeColors[
      ThemeController.colorVars.indexOf(
        $(element).find("input.color").attr("id") as string
      )
    ] as string;
    updateColors($(element), currentColor, false, noThemeUpdate);
  });
}

function toggleFavourite(themeName: ThemeName): void {
  if (Config.favThemes.includes(themeName)) {
    // already favourite, remove
    UpdateConfig.setFavThemes(Config.favThemes.filter((t) => t !== themeName));
  } else {
    // add to favourites
    const newList: ThemeName[] = Config.favThemes;
    newList.push(themeName);
    UpdateConfig.setFavThemes(newList);
  }
  UpdateConfig.saveFullConfigToLocalStorage();
}

function saveCustomThemeColors(): void {
  const newColors: string[] = [];
  for (const color of ThemeController.colorVars) {
    newColors.push(
      $(
        `.pageSettings .customTheme .customThemeEdit #${color}[type='color']`
      ).attr("value") as string
    );
  }
  UpdateConfig.setCustomThemeColors(newColors as CustomThemeColors);
  Notifications.add("Custom theme saved", 1);
}

export function updateActiveTab(): void {
  // Set force to true only when some change for the active tab has taken place
  // Prevent theme buttons from being added twice by doing an update only when the state has changed
  $(".pageSettings .section.themes .tabs button").removeClass("active");
  $(
    `.pageSettings .section.themes .tabs button[data-tab="${
      Config.customTheme ? "custom" : "preset"
    }"]`
  ).addClass("active");

  if (Config.customTheme) {
    void Misc.swapElements(
      $('.pageSettings [tabContent="preset"]'),
      $('.pageSettings [tabContent="custom"]'),
      250
    );
  } else {
    void Misc.swapElements(
      $('.pageSettings [tabContent="custom"]'),
      $('.pageSettings [tabContent="preset"]'),
      250
    );
  }
}

// Add events to the DOM

// Handle click on theme: preset or custom tab
$(".pageSettings .section.themes .tabs button").on("click", (e) => {
  $(".pageSettings .section.themes .tabs button").removeClass("active");
  const $target = $(e.currentTarget);
  $target.addClass("active");
  // setCustomInputs();
  //test
  if ($target.attr("data-tab") === "preset") {
    UpdateConfig.setCustomTheme(false);
  } else {
    UpdateConfig.setCustomTheme(true);
  }
});

// Handle click on custom theme button
$(".pageSettings").on("click", " .section.themes .customTheme.button", (e) => {
  // Do not apply if user wanted to delete it
  if ($(e.target).hasClass("delButton")) return;
  if ($(e.target).hasClass("editButton")) return;
  const customThemeId = $(e.currentTarget).attr("customThemeId") ?? "";
  const theme = DB.getSnapshot()?.customThemes?.find(
    (e) => e._id === customThemeId
  );

  if (theme === undefined) {
    //this shouldnt happen but typescript needs this check
    console.error(
      "Could not find custom theme in snapshot for id ",
      customThemeId
    );
    return;
  }

  UpdateConfig.setCustomThemeColors(theme.colors);
});

// Handle click on favorite preset theme button
$(".pageSettings").on("click", ".section.themes .theme .favButton", (e) => {
  const theme = $(e.currentTarget)
    .parents(".theme.button")
    .attr("theme") as ThemeName;
  if (theme !== undefined) {
    toggleFavourite(theme);
    void refreshPresetButtons();
  } else {
    console.error(
      "Could not find the theme attribute attached to the button clicked!"
    );
  }
});

// Handle click on preset theme button
$(".pageSettings").on("click", ".section.themes .theme.button", (e) => {
  const theme = $(e.currentTarget).attr("theme") as ThemeName;
  if (!$(e.target).hasClass("favButton") && theme !== undefined) {
    UpdateConfig.setTheme(theme);
  }
});

$(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
).on("input", (e) => {
  const $colorVar = $(e.currentTarget).attr("id") as string;
  const $pickedColor = $(e.currentTarget).val() as string;

  updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor, true);
});

$(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
).on("change", (e) => {
  const $colorVar = $(e.currentTarget).attr("id") as string;
  const $pickedColor = $(e.currentTarget).val() as string;

  updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
});

$(".pageSettings .section.themes .tabContainer .customTheme input.input")
  .on("blur", (e) => {
    if (e.target.id === "name") return;
    const $colorVar = $(e.currentTarget).attr("id") as string;
    const $pickedColor = $(e.currentTarget).val() as string;

    updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
  })
  .on("keypress", function (e) {
    if (e.target.id === "name") return;
    if (e.code === "Enter") {
      $(this).attr("disabled", "disabled");
      const $colorVar = $(e.currentTarget).attr("id") as string;
      const $pickedColor = $(e.currentTarget).val() as string;

      updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
      $(this).removeAttr("disabled");
    }
  });

$(".pageSettings #loadCustomColorsFromPreset").on("click", async () => {
  // previewTheme(Config.theme);
  // $("#currentTheme").attr("href", `themes/${Config.theme}.css`);
  await ThemeController.loadStyle(Config.theme);

  ThemeController.colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });

  // setTimeout(async () => {
  ChartController.updateAllChartColors();

  const themeColors = await ThemeColors.getAll();

  ThemeController.colorVars.forEach((colorName) => {
    let color;
    if (colorName === "--bg-color") {
      color = themeColors.bg;
    } else if (colorName === "--main-color") {
      color = themeColors.main;
    } else if (colorName === "--sub-color") {
      color = themeColors.sub;
    } else if (colorName === "--sub-alt-color") {
      color = themeColors.subAlt;
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

    updateColors($(".colorPicker #" + colorName).parent(), color as string);
  });
  // }, 250);
});

$(".pageSettings #saveCustomThemeButton").on("click", async () => {
  saveCustomThemeColors();
  if (isAuthenticated()) {
    const newCustomTheme = {
      name: "custom",
      colors: Config.customThemeColors,
    };

    Loader.show();
    await DB.addCustomTheme(newCustomTheme);
    Loader.hide();
  }
  void refreshCustomButtons();
});

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "theme" && ActivePage.get() === "settings") {
    updateActiveButton();
  }
  if (eventKey === "favThemes" && ActivePage.get() === "settings") {
    void refreshPresetButtons();
  }
});
