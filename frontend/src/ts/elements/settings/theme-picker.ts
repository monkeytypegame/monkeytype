import Config, { setConfig, saveFullConfigToLocalStorage } from "../../config";
import * as ThemeController from "../../controllers/theme-controller";
import * as Misc from "../../utils/misc";
import * as Colors from "../../utils/colors";
import * as Notifications from "../notifications";
import * as Loader from "../loader";
import * as DB from "../../db";
import * as ConfigEvent from "../../observables/config-event";
import { isAuthenticated } from "../../firebase";
import { getActivePage } from "../../signals/core";
import { ThemeName } from "@monkeytype/schemas/configs";
import { captureException } from "../../sentry";
import { ColorName, ThemesListSorted } from "../../constants/themes";
import { qs, qsa, qsr } from "../../utils/dom";
import { getThemeColors, updateThemeColor } from "../../signals/theme";

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
      `.pageSettings .section.themes .theme[theme='${activeThemeName}']`,
    )
    ?.classList.add("active");
}

function updateColors(
  key: ColorName,
  color: string,
  props?: { convertColor?: boolean; noThemeUpdate?: boolean },
): void {
  console.log("### update colors", { key, color, props });
  const colorPicker = qsr(`.colorPicker[data-key="${key}"]`);

  if (props?.convertColor) {
    color = convertColorToHex(color) ?? "error";
    console.log("converted value", color);
  }

  if (!props?.noThemeUpdate) {
    updateThemeColor(key, color);
  }

  const pickerButton = colorPicker.qsr<HTMLLabelElement>("label");
  pickerButton.setAttribute("value", color);
  if (key !== "bg") {
    //don't update the color for the background picker
    pickerButton.setStyle({ backgroundColor: color });
  }
  colorPicker.qsr<HTMLInputElement>("input.input").setValue(color);
  colorPicker.qsr("input.color").setAttribute("value", color);
}

export async function fillPresetButtons(): Promise<void> {
  // Update theme buttons
  const favThemesEl = document.querySelector<HTMLElement>(
    ".pageSettings .section.themes .favThemes.buttons",
  );
  const themesEl = document.querySelector<HTMLElement>(
    ".pageSettings .section.themes .allThemes.buttons",
  );

  if (favThemesEl === null || themesEl === null) {
    const msg =
      "Failed to fill preset theme buttons: favThemes or allThemes element not found";
    Notifications.add(msg, -1);
    void captureException(new Error(msg));
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
        }' style="background: ${theme.bg}; color: ${
          theme.main
        };outline: 0 solid ${theme.main};">
          <div class="favButton active"><i class="fas fa-star"></i></div>
          <div class="text">${theme.name.replace(/_/g, " ")}</div>
          <div class="themeBubbles" style="background: ${
            theme.bg
          };outline: 0.25rem solid ${theme.bg};">
            <div class="themeBubble" style="background: ${theme.main}"></div>
            <div class="themeBubble" style="background: ${theme.sub}"></div>
            <div class="themeBubble" style="background: ${theme.text}"></div>
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
    }' style="background: ${theme.bg}; color: ${
      theme.main
    };outline: 0 solid ${theme.main};">
      <div class="favButton"><i class="far fa-star"></i></div>
      <div class="text">${theme.name.replace(/_/g, " ")}</div>
      <div class="themeBubbles" style="background: ${
        theme.bg
      };outline: 0.25rem solid ${theme.bg};">
        <div class="themeBubble" style="background: ${theme.main}"></div>
        <div class="themeBubble" style="background: ${theme.sub}"></div>
        <div class="themeBubble" style="background: ${theme.text}"></div>
      </div>
      </div>
      `;
  }
  themesEl.innerHTML = themesElHTML;
}

export async function fillCustomButtons(): Promise<void> {
  // Update custom theme buttons
  const customThemesEl = $(
    ".pageSettings .section.themes .allCustomThemes.buttons",
  ).empty();
  const addButton = $(".pageSettings .section.themes .addCustomThemeButton");
  const saveButton = $(
    ".pageSettings .section.themes .tabContent.customTheme #saveCustomThemeButton",
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
      </div>`,
    );
  }
}

export function setCustomInputs(): void {
  const theme = ThemeController.convertCustomColorsToTheme(
    Config.customThemeColors,
  );
  qsa<HTMLInputElement>(
    ".pageSettings .section.themes .tabContainer .customTheme .colorPicker",
  ).forEach((element) => {
    const key = element.getAttribute("data-key") as ColorName;
    const color = theme[key] as string;
    updateColors(key, color, { convertColor: false, noThemeUpdate: true });
  });
}

function toggleFavourite(themeName: ThemeName): void {
  if (Config.favThemes.includes(themeName)) {
    // already favourite, remove
    setConfig(
      "favThemes",
      Config.favThemes.filter((t) => t !== themeName),
    );
  } else {
    // add to favourites
    const newList: ThemeName[] = Config.favThemes;
    newList.push(themeName);
    setConfig("favThemes", newList);
  }
  saveFullConfigToLocalStorage();
}

function saveCustomThemeColors(): void {
  const colors = ThemeController.convertThemeToCustomColors(getThemeColors());

  setConfig("customThemeColors", colors);
  Notifications.add("Custom theme saved", 1);
}

export function updateActiveTab(): void {
  // Set force to true only when some change for the active tab has taken place
  // Prevent theme buttons from being added twice by doing an update only when the state has changed
  $(".pageSettings .section.themes .tabs button").removeClass("active");
  $(
    `.pageSettings .section.themes .tabs button[data-tab="${
      Config.customTheme ? "custom" : "preset"
    }"]`,
  ).addClass("active");

  if (Config.customTheme) {
    void Misc.swapElements(
      qs('.pageSettings [tabContent="preset"]'),
      qs('.pageSettings [tabContent="custom"]'),
      250,
    );
  } else {
    void Misc.swapElements(
      qs('.pageSettings [tabContent="custom"]'),
      qs('.pageSettings [tabContent="preset"]'),
      250,
    );
  }
}

// separated to avoid repeated calls
export async function updateThemeUI(): Promise<void> {
  await fillPresetButtons();
  updateActiveButton();
}

/**
 *  some system color pickers return rgb or hsl values. We need to convert them to hex before storing
 * @param color as hex, hsl or rgb
 * @returns  hex color
 */
function convertColorToHex(color: string): string | undefined {
  const input = color.trim().toLocaleLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(input)) {
    return input;
  }

  const rgbMatch =
    input.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/) ??
    input.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);

  if (rgbMatch !== null) {
    const clamp = (n: string): number =>
      Math.max(0, Math.min(255, Number.parseFloat(n)));

    const r = clamp(rgbMatch[1] as string);
    const g = clamp(rgbMatch[2] as string);
    const b = clamp(rgbMatch[3] as string);
    return Colors.rgbNumbersToHex(r, g, b);
  }

  const hslMatch =
    input.match(/^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/) ??
    input.match(/^(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%$/);

  if (hslMatch) {
    const clamp = (n: string): number =>
      Math.max(0, Math.min(255, Number.parseFloat(n)));
    const h = Number.parseFloat(hslMatch[1] as string) % 360;
    const s = clamp(hslMatch[2] as string) / 100;
    const l = clamp(hslMatch[3] as string) / 100;
    const { r, g, b } = Colors.hslToRgb(h, s, l);
    return Colors.rgbNumbersToHex(r, g, b);
  }
  return undefined;
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
    setConfig("customTheme", false);
  } else {
    setConfig("customTheme", true);
  }
});

// Handle click on custom theme button
$(".pageSettings").on("click", " .section.themes .customTheme.button", (e) => {
  // Do not apply if user wanted to delete it
  if ($(e.target).hasClass("delButton")) return;
  if ($(e.target).hasClass("editButton")) return;
  const customThemeId = $(e.currentTarget).attr("customThemeId") ?? "";
  const theme = DB.getSnapshot()?.customThemes?.find(
    (e) => e._id === customThemeId,
  );

  if (theme === undefined) {
    //this shouldnt happen but typescript needs this check
    console.error(
      "Could not find custom theme in snapshot for id ",
      customThemeId,
    );
    return;
  }

  setConfig("customThemeColors", theme.colors);
});

// Handle click on favorite preset theme button
$(".pageSettings").on("click", ".section.themes .theme .favButton", (e) => {
  const theme = $(e.currentTarget)
    .parents(".theme.button")
    .attr("theme") as ThemeName;
  if (theme !== undefined) {
    toggleFavourite(theme);
  } else {
    console.error(
      "Could not find the theme attribute attached to the button clicked!",
    );
  }
});

// Handle click on preset theme button
$(".pageSettings").on("click", ".section.themes .theme.button", (e) => {
  const theme = $(e.currentTarget).attr("theme") as ThemeName;
  if (!$(e.target).hasClass("favButton") && theme !== undefined) {
    setConfig("theme", theme);
  }
});

function handleColorInput(props?: {
  convertColor: boolean;
}): (e: Event) => void {
  return (e) => {
    const target = e.currentTarget as HTMLInputElement;
    const key = target
      ?.closest(".colorPicker")
      ?.getAttribute("data-key") as ColorName;

    updateColors(key, target.value, {
      convertColor: props?.convertColor ?? true,
    });
  };
}

qsa(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]",
)
  .on("input", handleColorInput({ convertColor: false }))
  .on("change", handleColorInput());

qsa(".pageSettings .section.themes .tabContainer .customTheme input.input")
  .on("blur", (e) => {
    if ((e.target as HTMLInputElement).id === "name") return;
    handleColorInput()(e);
  })
  .on("keypress", function (e) {
    const target = e.target as HTMLInputElement;
    if (target.id === "name") return;
    if (e.code === "Enter") {
      target.setAttribute("disabled", "disabled");
      handleColorInput()(e);
      target.removeAttribute("disabled");
    }
  });

$(".pageSettings #loadCustomColorsFromPreset").on("click", async () => {
  ThemeController.applyPreset(Config.theme);
  const themeColors = getThemeColors();

  Misc.typedKeys(themeColors)
    .filter((it) => it !== "hasCss")
    .forEach((key) => updateColors(key, themeColors[key]));
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
  void fillCustomButtons();
});

ConfigEvent.subscribe(({ key }) => {
  if (key === "theme" && getActivePage() === "settings") {
    updateActiveButton();
  }
  if (key === "favThemes" && getActivePage() === "settings") {
    void fillPresetButtons();
  }
});
