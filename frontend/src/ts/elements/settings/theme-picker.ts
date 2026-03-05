import Config, { setConfig, saveFullConfigToLocalStorage } from "../../config";
import * as ThemeController from "../../controllers/theme-controller";
import * as Misc from "../../utils/misc";
import * as Colors from "../../utils/colors";
import * as Notifications from "../notifications";
import { showLoaderBar, hideLoaderBar } from "../../signals/loader-bar";
import * as DB from "../../db";
import * as ConfigEvent from "../../observables/config-event";
import { isAuthenticated } from "../../firebase";
import { getActivePage } from "../../signals/core";
import { ThemeName } from "@monkeytype/schemas/configs";
import { captureException } from "../../sentry";
import { ColorName, ThemesListSorted } from "../../constants/themes";
import { qs, qsa, qsr } from "../../utils/dom";
import { getTheme, updateThemeColor } from "../../signals/theme";

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

function updateColorPicker(key: ColorName, color: string): void {
  const colorPicker = qsr(`.colorPicker[data-key="${key}"]`);
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
  const customThemesEl = qs(
    ".pageSettings .section.themes .allCustomThemes.buttons",
  )?.empty();
  const addButton = qs(".pageSettings .section.themes .addCustomThemeButton");
  const saveButton = qs(
    ".pageSettings .section.themes .tabContent.customTheme #saveCustomThemeButton",
  );

  if (!isAuthenticated()) {
    saveButton?.setText("save");
    addButton?.hide();
    customThemesEl?.setStyle({ marginBottom: "0" });
    return;
  }

  saveButton?.setText("save as new");
  addButton?.show();

  const customThemes = DB.getSnapshot()?.customThemes ?? [];

  if (customThemes.length === 0) {
    customThemesEl?.setStyle({ marginBottom: "0" });
  } else {
    customThemesEl?.setStyle({ marginBottom: "1rem" });
  }

  for (const customTheme of customThemes) {
    const bgColor = customTheme.colors[0];
    const mainColor = customTheme.colors[1];

    customThemesEl?.appendHtml(
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
    const color = Colors.convertStringToHex(theme[key]);
    updateColorPicker(key, color);
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
  const colors = ThemeController.convertThemeToCustomColors(getTheme());

  setConfig("customThemeColors", colors);
  Notifications.add("Custom theme saved", 1);
}

export function updateActiveTab(): void {
  // Set force to true only when some change for the active tab has taken place
  // Prevent theme buttons from being added twice by doing an update only when the state has changed
  qsa(".pageSettings .section.themes .tabs button")?.removeClass("active");
  qs(
    `.pageSettings .section.themes .tabs button[data-tab="${
      Config.customTheme ? "custom" : "preset"
    }"]`,
  )?.addClass("active");

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

// Add events to the DOM

// Handle click on theme: preset or custom tab
qsa(".pageSettings .section.themes .tabs button")?.on("click", (e) => {
  qsa(".pageSettings .section.themes .tabs button")?.removeClass("active");
  (e.currentTarget as HTMLElement).classList.add("active");
  if ((e.currentTarget as HTMLElement).getAttribute("data-tab") === "preset") {
    setConfig("customTheme", false);
  } else {
    setConfig("customTheme", true);
  }
});

// Handle click on custom theme button
qs(".pageSettings")?.onChild(
  "click",
  ".section.themes .customTheme.button",
  (e) => {
    // Do not apply if user wanted to delete it

    const target = e.childTarget as HTMLElement;

    if ((e.target as HTMLElement).classList.contains("delButton")) return;
    if ((e.target as HTMLElement).classList.contains("editButton")) return;
    const customThemeId = target.getAttribute("customThemeId") ?? "";
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
  },
);

// Handle click on favorite preset theme button
qs(".pageSettings")?.onChild(
  "click",
  ".section.themes .theme .favButton",
  (e) => {
    const theme = (e.childTarget as HTMLElement)
      .closest(".theme.button")
      ?.getAttribute("theme") as ThemeName;
    if (theme !== undefined) {
      toggleFavourite(theme);
    } else {
      console.error(
        "Could not find the theme attribute attached to the button clicked!",
      );
    }
  },
);

// Handle click on preset theme button
qs(".pageSettings")?.onChild("click", ".section.themes .theme.button", (e) => {
  const theme = (e.childTarget as HTMLElement).getAttribute(
    "theme",
  ) as ThemeName;
  if (
    !(e.childTarget as HTMLElement).classList.contains("favButton") &&
    theme !== undefined
  ) {
    setConfig("theme", theme);
  }
});

function handleColorInput(options: {
  convertColor: boolean;
}): (e: Event) => void {
  return (e) => {
    const target = e.target as HTMLInputElement;
    const key = target
      ?.closest(".colorPicker")
      ?.getAttribute("data-key") as ColorName;

    let color: string;

    if (options.convertColor) {
      try {
        color = Colors.convertStringToHex(target.value);
      } catch {
        Notifications.add("Invalid color format", 0);
        color = "#000000";
      }
    } else {
      color = target.value;
    }

    updateColorPicker(key, color);
    updateThemeColor(key, color);
  };
}

const convertColorAndUpdate = handleColorInput({ convertColor: true });
/*const pickerInputDebounced = debounce(
  100,
  handleColorInput({ convertColor: false }),
);
*/
const pickerInputDebounced = handleColorInput({ convertColor: false });

qsa(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]",
)
  .on("input", pickerInputDebounced)
  .on("change", convertColorAndUpdate);

qsa(".pageSettings .section.themes .tabContainer .customTheme input.input")
  .on("blur", (e) => {
    if ((e.target as HTMLInputElement).id === "name") return;
    convertColorAndUpdate(e);
  })
  .on("keypress", function (e) {
    const target = e.target as HTMLInputElement;
    if (target.id === "name") return;
    if (e.code === "Enter") {
      target.setAttribute("disabled", "disabled");
      convertColorAndUpdate(e);
      target.removeAttribute("disabled");
    }
  });

qs(".pageSettings #loadCustomColorsFromPreset")?.on("click", async () => {
  ThemeController.applyPreset(Config.theme);
  const themeColors = getTheme();

  Misc.typedKeys(themeColors)
    .filter((key) => key !== "hasCss" && key !== "name")
    .forEach((key) =>
      updateColorPicker(key, Colors.convertStringToHex(themeColors[key])),
    );
});

qs(".pageSettings #saveCustomThemeButton")?.on("click", async () => {
  saveCustomThemeColors();
  if (isAuthenticated()) {
    const newCustomTheme = {
      name: "custom",
      colors: Config.customThemeColors,
    };

    showLoaderBar();
    await DB.addCustomTheme(newCustomTheme);
    hideLoaderBar();
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
