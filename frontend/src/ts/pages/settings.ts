import SettingsGroup from "../settings/settings-group";
import Config, * as UpdateConfig from "../config";
import * as Sound from "../controllers/sound-controller";
import * as Misc from "../utils/misc";
import * as DB from "../db";
import { toggleFunbox } from "../test/funbox/funbox";
import * as TagController from "../controllers/tag-controller";
import * as PresetController from "../controllers/preset-controller";
import * as ThemePicker from "../settings/theme-picker";
import * as Notifications from "../elements/notifications";
import * as ImportExportSettingsPopup from "../popups/import-export-settings-popup";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";
import * as ApeKeysPopup from "../popups/ape-keys-popup";
import * as CookiePopup from "../popups/cookie-popup";
import Page from "./page";
import { Auth } from "../firebase";
import Ape from "../ape";
import { areFunboxesCompatible } from "../test/funbox/funbox-validation";
import * as Skeleton from "../popups/skeleton";

interface SettingsGroups {
  [key: string]: SettingsGroup;
}

export const groups: SettingsGroups = {};

async function initGroups(): Promise<void> {
  await UpdateConfig.loadPromise;
  groups["smoothCaret"] = new SettingsGroup(
    "smoothCaret",
    UpdateConfig.setSmoothCaret,
    "button"
  );
  groups["difficulty"] = new SettingsGroup(
    "difficulty",
    UpdateConfig.setDifficulty,
    "button"
  );
  groups["quickRestart"] = new SettingsGroup(
    "quickRestart",
    UpdateConfig.setQuickRestartMode,
    "button"
  );
  groups["showLiveWpm"] = new SettingsGroup(
    "showLiveWpm",
    UpdateConfig.setShowLiveWpm,
    "button",
    () => {
      groups["keymapMode"].updateInput();
    }
  );
  groups["showLiveAcc"] = new SettingsGroup(
    "showLiveAcc",
    UpdateConfig.setShowLiveAcc,
    "button"
  );
  groups["showLiveBurst"] = new SettingsGroup(
    "showLiveBurst",
    UpdateConfig.setShowLiveBurst,
    "button"
  );
  groups["showTimerProgress"] = new SettingsGroup(
    "showTimerProgress",
    UpdateConfig.setShowTimerProgress,
    "button"
  );
  groups["showAverage"] = new SettingsGroup(
    "showAverage",
    UpdateConfig.setShowAverage,
    "button"
  );
  groups["keymapMode"] = new SettingsGroup(
    "keymapMode",
    UpdateConfig.setKeymapMode,
    "button",
    () => {
      groups["showLiveWpm"].updateInput();
    },
    () => {
      if (Config.keymapMode === "off") {
        $(".pageSettings .section.keymapStyle").addClass("hidden");
        $(".pageSettings .section.keymapLayout").addClass("hidden");
        $(".pageSettings .section.keymapLegendStyle").addClass("hidden");
        $(".pageSettings .section.keymapShowTopRow").addClass("hidden");
      } else {
        $(".pageSettings .section.keymapStyle").removeClass("hidden");
        $(".pageSettings .section.keymapLayout").removeClass("hidden");
        $(".pageSettings .section.keymapLegendStyle").removeClass("hidden");
        $(".pageSettings .section.keymapShowTopRow").removeClass("hidden");
      }
    }
  );
  groups["keymapMatrix"] = new SettingsGroup(
    "keymapStyle",
    UpdateConfig.setKeymapStyle,
    "button"
  );
  groups["keymapLayout"] = new SettingsGroup(
    "keymapLayout",
    UpdateConfig.setKeymapLayout,
    "select"
  );
  groups["keymapLegendStyle"] = new SettingsGroup(
    "keymapLegendStyle",
    UpdateConfig.setKeymapLegendStyle,
    "button"
  );
  groups["keymapShowTopRow"] = new SettingsGroup(
    "keymapShowTopRow",
    UpdateConfig.setKeymapShowTopRow,
    "button"
  );
  groups["showKeyTips"] = new SettingsGroup(
    "showKeyTips",
    UpdateConfig.setKeyTips,
    "button",
    undefined,
    () => {
      if (Config.showKeyTips) {
        $(".pageSettings .tip").removeClass("hidden");
      } else {
        $(".pageSettings .tip").addClass("hidden");
      }
    }
  );
  groups["freedomMode"] = new SettingsGroup(
    "freedomMode",
    UpdateConfig.setFreedomMode,
    "button",
    () => {
      groups["confidenceMode"].updateInput();
    }
  );
  groups["strictSpace"] = new SettingsGroup(
    "strictSpace",
    UpdateConfig.setStrictSpace,
    "button"
  );
  groups["oppositeShiftMode"] = new SettingsGroup(
    "oppositeShiftMode",
    UpdateConfig.setOppositeShiftMode,
    "button"
  );
  groups["confidenceMode"] = new SettingsGroup(
    "confidenceMode",
    UpdateConfig.setConfidenceMode,
    "button",
    () => {
      groups["freedomMode"].updateInput();
      groups["stopOnError"].updateInput();
    }
  );
  groups["indicateTypos"] = new SettingsGroup(
    "indicateTypos",
    UpdateConfig.setIndicateTypos,
    "button"
  );
  groups["hideExtraLetters"] = new SettingsGroup(
    "hideExtraLetters",
    UpdateConfig.setHideExtraLetters,
    "button"
  );
  groups["blindMode"] = new SettingsGroup(
    "blindMode",
    UpdateConfig.setBlindMode,
    "button"
  );
  groups["quickEnd"] = new SettingsGroup(
    "quickEnd",
    UpdateConfig.setQuickEnd,
    "button"
  );
  groups["repeatQuotes"] = new SettingsGroup(
    "repeatQuotes",
    UpdateConfig.setRepeatQuotes,
    "button"
  );
  groups["ads"] = new SettingsGroup("ads", UpdateConfig.setAds, "button");
  groups["alwaysShowWordsHistory"] = new SettingsGroup(
    "alwaysShowWordsHistory",
    UpdateConfig.setAlwaysShowWordsHistory,
    "button"
  );
  groups["britishEnglish"] = new SettingsGroup(
    "britishEnglish",
    UpdateConfig.setBritishEnglish,
    "button"
  );
  groups["singleListCommandLine"] = new SettingsGroup(
    "singleListCommandLine",
    UpdateConfig.setSingleListCommandLine,
    "button"
  );
  groups["capsLockWarning"] = new SettingsGroup(
    "capsLockWarning",
    UpdateConfig.setCapsLockWarning,
    "button"
  );
  groups["flipTestColors"] = new SettingsGroup(
    "flipTestColors",
    UpdateConfig.setFlipTestColors,
    "button"
  );
  groups["showOutOfFocusWarning"] = new SettingsGroup(
    "showOutOfFocusWarning",
    UpdateConfig.setShowOutOfFocusWarning,
    "button"
  );
  groups["colorfulMode"] = new SettingsGroup(
    "colorfulMode",
    UpdateConfig.setColorfulMode,
    "button"
  );
  groups["startGraphsAtZero"] = new SettingsGroup(
    "startGraphsAtZero",
    UpdateConfig.setStartGraphsAtZero,
    "button"
  );
  groups["autoSwitchTheme"] = new SettingsGroup(
    "autoSwitchTheme",
    UpdateConfig.setAutoSwitchTheme,
    "button"
  );
  groups["randomTheme"] = new SettingsGroup(
    "randomTheme",
    UpdateConfig.setRandomTheme,
    "button"
  );
  groups["stopOnError"] = new SettingsGroup(
    "stopOnError",
    UpdateConfig.setStopOnError,
    "button",
    () => {
      groups["confidenceMode"].updateInput();
    }
  );
  groups["soundVolume"] = new SettingsGroup(
    "soundVolume",
    UpdateConfig.setSoundVolume,
    "button"
  );
  groups["playSoundOnError"] = new SettingsGroup(
    "playSoundOnError",
    UpdateConfig.setPlaySoundOnError,
    "button",
    () => {
      if (Config.playSoundOnError) Sound.playError();
    }
  );
  groups["playSoundOnClick"] = new SettingsGroup(
    "playSoundOnClick",
    UpdateConfig.setPlaySoundOnClick,
    "button",
    () => {
      if (Config.playSoundOnClick !== "off") Sound.playClick("KeyQ");
    }
  );
  groups["showAllLines"] = new SettingsGroup(
    "showAllLines",
    UpdateConfig.setShowAllLines,
    "button"
  );
  groups["paceCaret"] = new SettingsGroup(
    "paceCaret",
    UpdateConfig.setPaceCaret,
    "button"
  );
  groups["repeatedPace"] = new SettingsGroup(
    "repeatedPace",
    UpdateConfig.setRepeatedPace,
    "button"
  );
  groups["minWpm"] = new SettingsGroup(
    "minWpm",
    UpdateConfig.setMinWpm,
    "button"
  );
  groups["minAcc"] = new SettingsGroup(
    "minAcc",
    UpdateConfig.setMinAcc,
    "button"
  );
  groups["minBurst"] = new SettingsGroup(
    "minBurst",
    UpdateConfig.setMinBurst,
    "button"
  );
  groups["smoothLineScroll"] = new SettingsGroup(
    "smoothLineScroll",
    UpdateConfig.setSmoothLineScroll,
    "button"
  );
  groups["lazyMode"] = new SettingsGroup(
    "lazyMode",
    UpdateConfig.setLazyMode,
    "button"
  );
  groups["layout"] = new SettingsGroup(
    "layout",
    UpdateConfig.setLayout,
    "select"
  );
  groups["language"] = new SettingsGroup(
    "language",
    UpdateConfig.setLanguage,
    "select"
  );
  groups["fontSize"] = new SettingsGroup(
    "fontSize",
    UpdateConfig.setFontSize,
    "button"
  );
  groups["pageWidth"] = new SettingsGroup(
    "pageWidth",
    UpdateConfig.setPageWidth,
    "button"
  );
  groups["caretStyle"] = new SettingsGroup(
    "caretStyle",
    UpdateConfig.setCaretStyle,
    "button"
  );
  groups["paceCaretStyle"] = new SettingsGroup(
    "paceCaretStyle",
    UpdateConfig.setPaceCaretStyle,
    "button"
  );
  groups["timerStyle"] = new SettingsGroup(
    "timerStyle",
    UpdateConfig.setTimerStyle,
    "button"
  );
  groups["highlightMode"] = new SettingsGroup(
    "highlightMode",
    UpdateConfig.setHighlightMode,
    "button"
  );
  groups["tapeMode"] = new SettingsGroup(
    "tapeMode",
    UpdateConfig.setTapeMode,
    "button"
  );
  groups["timerOpacity"] = new SettingsGroup(
    "timerOpacity",
    UpdateConfig.setTimerOpacity,
    "button"
  );
  groups["timerColor"] = new SettingsGroup(
    "timerColor",
    UpdateConfig.setTimerColor,
    "button"
  );
  groups["fontFamily"] = new SettingsGroup(
    "fontFamily",
    UpdateConfig.setFontFamily,
    "button",
    undefined,
    () => {
      const customButton = $(
        ".pageSettings .section.fontFamily .buttons .custom"
      );
      if (
        $(".pageSettings .section.fontFamily .buttons .active").length === 0
      ) {
        customButton.addClass("active");
        customButton.text(`Custom (${Config.fontFamily.replace(/_/g, " ")})`);
      } else {
        customButton.text("Custom");
      }
    }
  );
  groups["alwaysShowDecimalPlaces"] = new SettingsGroup(
    "alwaysShowDecimalPlaces",
    UpdateConfig.setAlwaysShowDecimalPlaces,
    "button"
  );
  groups["alwaysShowCPM"] = new SettingsGroup(
    "alwaysShowCPM",
    UpdateConfig.setAlwaysShowCPM,
    "button"
  );
  groups["customBackgroundSize"] = new SettingsGroup(
    "customBackgroundSize",
    UpdateConfig.setCustomBackgroundSize,
    "button"
  );
  // groups.customLayoutfluid = new SettingsGroup(
  //   "customLayoutfluid",
  //   UpdateConfig.setCustomLayoutfluid
  // );
}

export function reset(): void {
  $(".pageSettings .section.themes .favThemes.buttons").empty();
  $(".pageSettings .section.themes .allThemes.buttons").empty();
  $(".pageSettings .section.themes .allCustomThemes.buttons").empty();
  $(".pageSettings .section.languageGroups .buttons").empty();
  $(".pageSettings select").empty().select2("destroy");
  $(".pageSettings .section.funbox .buttons").empty();
  $(".pageSettings .section.fontFamily .buttons").empty();
}

let groupsInitialized = false;
export async function fillSettingsPage(): Promise<void> {
  if (Config.showKeyTips) {
    $(".pageSettings .tip").removeClass("hidden");
  } else {
    $(".pageSettings .tip").addClass("hidden");
  }

  // Language Selection Combobox
  const languageEl = document.querySelector(
    ".pageSettings .section.language select"
  ) as HTMLSelectElement;
  languageEl.innerHTML = "";
  let languageElHTML = "";

  let languageGroups;
  try {
    languageGroups = await Misc.getLanguageGroups();
  } catch (e) {
    console.error(
      Misc.createErrorMessage(
        e,
        "Failed to initialize settings language picker"
      )
    );
  }

  if (languageGroups) {
    for (const group of languageGroups) {
      let langComboBox = `<optgroup label="${group.name}">`;
      group.languages.forEach((language: string) => {
        langComboBox += `<option value="${language}">
        ${language.replace(/_/g, " ")}
      </option>`;
      });
      langComboBox += `</optgroup>`;
      languageElHTML += langComboBox;
    }
    languageEl.innerHTML = languageElHTML;
  }
  $(languageEl).select2({
    width: "100%",
  });

  await Misc.sleep(0);

  const layoutEl = document.querySelector(
    ".pageSettings .section.layout select"
  ) as HTMLSelectElement;
  layoutEl.innerHTML = `<option value='default'>off</option>`;
  let layoutElHTML = "";

  const keymapEl = document.querySelector(
    ".pageSettings .section.keymapLayout select"
  ) as HTMLSelectElement;
  keymapEl.innerHTML = `<option value='overrideSync'>emulator sync</option>`;
  let keymapElHTML = "";

  let layoutsList;
  try {
    layoutsList = await Misc.getLayoutsList();
  } catch (e) {
    console.error(Misc.createErrorMessage(e, "Failed to refresh keymap"));
  }

  if (layoutsList) {
    for (const layout of Object.keys(layoutsList)) {
      if (layout.toString() !== "korean") {
        layoutElHTML += `<option value='${layout}'>${layout.replace(
          /_/g,
          " "
        )}</option>`;
      }
      if (layout.toString() != "default") {
        keymapElHTML += `<option value='${layout}'>${layout.replace(
          /_/g,
          " "
        )}</option>`;
      }
    }
    layoutEl.innerHTML += layoutElHTML;
    keymapEl.innerHTML += keymapElHTML;
  }
  $(layoutEl).select2({
    width: "100%",
  });
  $(keymapEl).select2({
    width: "100%",
  });

  await Misc.sleep(0);

  const themeEl1 = document.querySelector(
    ".pageSettings .section.autoSwitchThemeInputs select.light"
  ) as HTMLSelectElement;
  themeEl1.innerHTML = "";
  let themeEl1HTML = "";

  const themeEl2 = document.querySelector(
    ".pageSettings .section.autoSwitchThemeInputs select.dark"
  ) as HTMLSelectElement;
  themeEl2.innerHTML = "";
  let themeEl2HTML = "";

  let themes;
  try {
    themes = await Misc.getThemesList();
  } catch (e) {
    console.error(
      Misc.createErrorMessage(e, "Failed to load themes into dropdown boxes")
    );
  }

  if (themes) {
    for (const theme of themes) {
      themeEl1HTML += `<option value='${theme.name}'>${theme.name.replace(
        /_/g,
        " "
      )}</option>`;
      themeEl2HTML += `<option value='${theme.name}'>${theme.name.replace(
        /_/g,
        " "
      )}</option>`;
    }
    themeEl1.innerHTML = themeEl1HTML;
    themeEl2.innerHTML = themeEl2HTML;
  }
  $(themeEl1).select2({
    width: "100%",
  });
  $(themeEl2).select2({
    width: "100%",
  });

  await Misc.sleep(0);

  $(`.pageSettings .section.autoSwitchThemeInputs select.light`)
    .val(Config.themeLight)
    .trigger("change.select2");
  $(`.pageSettings .section.autoSwitchThemeInputs select.dark`)
    .val(Config.themeDark)
    .trigger("change.select2");

  const funboxEl = document.querySelector(
    ".pageSettings .section.funbox .buttons"
  ) as HTMLDivElement;
  funboxEl.innerHTML = `<div class="funbox button" funbox='none'>none</div>`;
  let funboxElHTML = "";

  let funboxList;
  try {
    funboxList = await Misc.getFunboxList();
  } catch (e) {
    console.error(Misc.createErrorMessage(e, "Failed to get funbox list"));
  }

  if (funboxList) {
    for (const funbox of funboxList) {
      if (funbox.name === "mirror") {
        funboxElHTML += `<div class="funbox button" funbox='${
          funbox.name
        }' aria-label="${
          funbox.info
        }" data-balloon-pos="up" data-balloon-length="fit" style="transform:scaleX(-1);">${funbox.name.replace(
          /_/g,
          " "
        )}</div>`;
      } else if (funbox.name === "upside_down") {
        funboxElHTML += `<div class="funbox button" funbox='${
          funbox.name
        }' aria-label="${
          funbox.info
        }" data-balloon-pos="up" data-balloon-length="fit" style="transform:scaleX(-1) scaleY(-1);">${funbox.name.replace(
          /_/g,
          " "
        )}</div>`;
      } else {
        funboxElHTML += `<div class="funbox button" funbox='${
          funbox.name
        }' aria-label="${
          funbox.info
        }" data-balloon-pos="up" data-balloon-length="fit">${funbox.name.replace(
          /_/g,
          " "
        )}</div>`;
      }
    }
    funboxEl.innerHTML = funboxElHTML;
  }

  await Misc.sleep(0);

  let isCustomFont = true;
  const fontsEl = document.querySelector(
    ".pageSettings .section.fontFamily .buttons"
  ) as HTMLDivElement;
  fontsEl.innerHTML = "";

  let fontsElHTML = "";

  let fontsList;
  try {
    fontsList = await Misc.getFontsList();
  } catch (e) {
    console.error(
      Misc.createErrorMessage(e, "Failed to update fonts settings buttons")
    );
  }

  if (fontsList) {
    for (const font of fontsList) {
      if (Config.fontFamily === font.name) isCustomFont = false;
      fontsElHTML += `<div class="button${
        Config.fontFamily === font.name ? " active" : ""
      }" style="font-family:${
        font.display !== undefined ? font.display : font.name
      }" fontFamily="${font.name.replace(/ /g, "_")}" tabindex="0"
        onclick="this.blur();">${
          font.display !== undefined ? font.display : font.name
        }</div>`;
    }

    fontsElHTML += isCustomFont
      ? `<div class="button no-auto-handle custom active" onclick="this.blur();">Custom (${Config.fontFamily.replace(
          /_/g,
          " "
        )})</div>`
      : '<div class="button no-auto-handle custom" onclick="this.blur();">Custom</div>';

    fontsEl.innerHTML = fontsElHTML;
  }

  $(".pageSettings .section.customBackgroundSize input").val(
    Config.customBackground
  );

  $(".pageSettings .section.fontSize input").val(Config.fontSize);

  $(".pageSettings .section.customLayoutfluid input").val(
    Config.customLayoutfluid.replace(/#/g, " ")
  );

  await Misc.sleep(0);
  setEventDisabled(true);
  if (!groupsInitialized) {
    await initGroups();
    groupsInitialized = true;
  } else {
    for (const groupKey of Object.keys(groups)) {
      groups[groupKey].updateInput();
    }
  }
  setEventDisabled(false);
  await Misc.sleep(0);
  await ThemePicker.refreshButtons();
  await UpdateConfig.loadPromise;
}

// export let settingsFillPromise = fillSettingsPage();

export function hideAccountSection(): void {
  $(`.sectionGroupTitle[group='account']`).addClass("hidden");
  $(`.settingsGroup.account`).addClass("hidden");
  $(`.pageSettings .section.needsAccount`).addClass("hidden");
}

export function updateDiscordSection(): void {
  //no code and no discord
  if (Auth?.currentUser == null) {
    $(".pageSettings .section.discordIntegration").addClass("hidden");
  } else {
    if (!DB.getSnapshot()) return;
    $(".pageSettings .section.discordIntegration").removeClass("hidden");

    if (DB.getSnapshot()?.discordId == undefined) {
      //show button
      $(".pageSettings .section.discordIntegration .buttons").removeClass(
        "hidden"
      );
      $(".pageSettings .section.discordIntegration .info").addClass("hidden");
    } else {
      $(".pageSettings .section.discordIntegration .buttons").addClass(
        "hidden"
      );
      $(".pageSettings .section.discordIntegration .info").removeClass(
        "hidden"
      );
    }
  }
}

export function updateAuthSections(): void {
  $(".pageSettings .section.passwordAuthSettings .button").addClass("hidden");
  $(".pageSettings .section.googleAuthSettings .button").addClass("hidden");

  const user = Auth?.currentUser;
  if (!user) return;

  const passwordProvider = user.providerData.find(
    (provider) => provider.providerId === "password"
  );
  const googleProvider = user.providerData.find(
    (provider) => provider.providerId === "google.com"
  );

  if (passwordProvider) {
    $(
      ".pageSettings .section.passwordAuthSettings #emailPasswordAuth"
    ).removeClass("hidden");
    $(
      ".pageSettings .section.passwordAuthSettings #passPasswordAuth"
    ).removeClass("hidden");
  } else {
    $(
      ".pageSettings .section.passwordAuthSettings #addPasswordAuth"
    ).removeClass("hidden");
  }

  if (googleProvider) {
    $(
      ".pageSettings .section.googleAuthSettings #removeGoogleAuth"
    ).removeClass("hidden");
    if (passwordProvider) {
      $(
        ".pageSettings .section.googleAuthSettings #removeGoogleAuth"
      ).removeClass("disabled");
    } else {
      $(".pageSettings .section.googleAuthSettings #removeGoogleAuth").addClass(
        "disabled"
      );
    }
  } else {
    $(".pageSettings .section.googleAuthSettings #addGoogleAuth").removeClass(
      "hidden"
    );
  }
}

function setActiveFunboxButton(): void {
  $(`.pageSettings .section.funbox .button`).removeClass("active");
  $(`.pageSettings .section.funbox .button`).removeClass("disabled");
  Misc.getFunboxList().then((funboxModes) => {
    funboxModes.forEach((funbox) => {
      if (
        !areFunboxesCompatible(Config.funbox, funbox.name) &&
        !Config.funbox.split("#").includes(funbox.name)
      ) {
        $(
          `.pageSettings .section.funbox .button[funbox='${funbox.name}']`
        ).addClass("disabled");
      }
    });
  });
  Config.funbox.split("#").forEach((funbox) => {
    $(`.pageSettings .section.funbox .button[funbox='${funbox}']`).addClass(
      "active"
    );
  });
}

function refreshTagsSettingsSection(): void {
  if (Auth?.currentUser && DB.getSnapshot() !== null) {
    const tagsEl = $(".pageSettings .section.tags .tagsList").empty();
    DB.getSnapshot()?.tags?.forEach((tag) => {
      // let tagPbString = "No PB found";
      // if (tag.pb != undefined && tag.pb > 0) {
      //   tagPbString = `PB: ${tag.pb}`;
      // }
      tagsEl.append(`

      <div class="buttons tag" id="${tag._id}">
        <div class="button tagButton ${tag.active ? "active" : ""}" active="${
        tag.active
      }">
          <div class="title">${tag.display}</div>
        </div>
        <div class="clearPbButton button">
          <i class="fas fa-crown fa-fw"></i>
        </div>
        <div class="editButton button">
          <i class="fas fa-pen fa-fw"></i>
        </div>
        <div class="removeButton button">
          <i class="fas fa-trash fa-fw"></i>
        </div>
      </div>

      `);
    });
    $(".pageSettings .section.tags").removeClass("hidden");
  } else {
    $(".pageSettings .section.tags").addClass("hidden");
  }
}

function refreshPresetsSettingsSection(): void {
  if (Auth?.currentUser && DB.getSnapshot() !== null) {
    const presetsEl = $(".pageSettings .section.presets .presetsList").empty();
    DB.getSnapshot()?.presets?.forEach((preset: MonkeyTypes.Preset) => {
      presetsEl.append(`
      <div class="buttons preset" id="${preset._id}">
        <div class="button presetButton">
          <div class="title">${preset.display}</div>
        </div>
        <div class="editButton button">
          <i class="fas fa-pen fa-fw"></i>
        </div>
        <div class="removeButton button">
          <i class="fas fa-trash fa-fw"></i>
        </div>
      </div>
      
      `);
    });
    $(".pageSettings .section.presets").removeClass("hidden");
  } else {
    $(".pageSettings .section.presets").addClass("hidden");
  }
}

export function showAccountSection(): void {
  $(`.sectionGroupTitle[group='account']`).removeClass("hidden");
  $(`.settingsGroup.account`).removeClass("hidden");
  $(`.pageSettings .section.needsAccount`).removeClass("hidden");
  refreshTagsSettingsSection();
  refreshPresetsSettingsSection();
  updateDiscordSection();

  if (DB.getSnapshot()?.lbOptOut === true) {
    $(".pageSettings .section.optOutOfLeaderboards").remove();
  }
}

export async function update(groupUpdate = true): Promise<void> {
  // Object.keys(groups).forEach((group) => {
  if (groupUpdate) {
    for (const group of Object.keys(groups)) {
      groups[group].updateInput();
    }
  }

  refreshTagsSettingsSection();
  refreshPresetsSettingsSection();
  // LanguagePicker.setActiveGroup(); Shifted from grouped btns to combo-box
  setActiveFunboxButton();
  updateDiscordSection();
  updateAuthSections();
  await Misc.sleep(0);
  ThemePicker.updateActiveTab(true);
  ThemePicker.setCustomInputs(true);
  // ThemePicker.updateActiveButton();

  $(".pageSettings .section.paceCaret input.customPaceCaretSpeed").val(
    Config.paceCaretCustomSpeed
  );
  $(".pageSettings .section.minWpm input.customMinWpmSpeed").val(
    Config.minWpmCustomSpeed
  );
  $(".pageSettings .section.minAcc input.customMinAcc").val(
    Config.minAccCustom
  );
  $(".pageSettings .section.minBurst input.customMinBurst").val(
    Config.minBurstCustomSpeed
  );

  if (Config.autoSwitchTheme) {
    $(".pageSettings .section.autoSwitchThemeInputs").removeClass("hidden");
  } else {
    $(".pageSettings .section.autoSwitchThemeInputs").addClass("hidden");
  }

  if (Config.customBackground !== "") {
    $(".pageSettings .section.customBackgroundFilter").removeClass("hidden");
  } else {
    $(".pageSettings .section.customBackgroundFilter").addClass("hidden");
  }

  if (Auth?.currentUser) {
    showAccountSection();
  } else {
    hideAccountSection();
  }

  const modifierKey = window.navigator.userAgent.toLowerCase().includes("mac")
    ? "cmd"
    : "ctrl";
  if (Config.quickRestart === "esc") {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (<key>${modifierKey}</key>+<key>shift</key>+<key>p</key>)`);
  } else {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (<key>esc</key> or <key>${modifierKey}</key>+<key>shift</key>+<key>p</key>)`);
  }
}

function toggleSettingsGroup(groupName: string): void {
  $(`.pageSettings .settingsGroup.${groupName}`)
    .stop(true, true)
    .slideToggle(250)
    .toggleClass("slideup");
  if ($(`.pageSettings .settingsGroup.${groupName}`).hasClass("slideup")) {
    $(`.pageSettings .sectionGroupTitle[group=${groupName}] .fas`)
      .stop(true, true)
      .animate(
        {
          deg: -90,
        },
        {
          duration: 250,
          step: function (now) {
            $(this).css({
              transform: "rotate(" + now + "deg)",
            });
          },
        }
      );
  } else {
    $(`.pageSettings .sectionGroupTitle[group=${groupName}] .fas`)
      .stop(true, true)
      .animate(
        {
          deg: 0,
        },
        {
          duration: 250,
          step: function (now) {
            $(this).css({
              transform: "rotate(" + now + "deg)",
            });
          },
        }
      );
  }
}

$(".pageSettings .section.paceCaret").on(
  "focusout",
  "input.customPaceCaretSpeed",
  () => {
    UpdateConfig.setPaceCaretCustomSpeed(
      parseInt(
        $(
          ".pageSettings .section.paceCaret input.customPaceCaretSpeed"
        ).val() as string
      )
    );
  }
);

$(".pageSettings .section.paceCaret").on("click", ".button.save", () => {
  UpdateConfig.setPaceCaretCustomSpeed(
    parseInt(
      $(
        ".pageSettings .section.paceCaret input.customPaceCaretSpeed"
      ).val() as string
    )
  );
});

$(".pageSettings .section.minWpm").on(
  "focusout",
  "input.customMinWpmSpeed",
  () => {
    UpdateConfig.setMinWpmCustomSpeed(
      parseInt(
        $(
          ".pageSettings .section.minWpm input.customMinWpmSpeed"
        ).val() as string
      )
    );
  }
);

$(".pageSettings .section.minWpm").on("click", ".button.save", () => {
  UpdateConfig.setMinWpmCustomSpeed(
    parseInt(
      $(".pageSettings .section.minWpm input.customMinWpmSpeed").val() as string
    )
  );
});

$(".pageSettings .section.minAcc").on("focusout", "input.customMinAcc", () => {
  UpdateConfig.setMinAccCustom(
    parseInt(
      $(".pageSettings .section.minAcc input.customMinAcc").val() as string
    )
  );
});

$(".pageSettings .section.minAcc").on("click", ".button.save", () => {
  UpdateConfig.setMinAccCustom(
    parseInt(
      $(".pageSettings .section.minAcc input.customMinAcc").val() as string
    )
  );
});

$(".pageSettings .section.minBurst").on(
  "focusout",
  "input.customMinBurst",
  () => {
    UpdateConfig.setMinBurstCustomSpeed(
      parseInt(
        $(
          ".pageSettings .section.minBurst input.customMinBurst"
        ).val() as string
      )
    );
  }
);

$(".pageSettings .section.minBurst").on("click", ".button.save", () => {
  UpdateConfig.setMinBurstCustomSpeed(
    parseInt(
      $(".pageSettings .section.minBurst input.customMinBurst").val() as string
    )
  );
});

//funbox
$(".pageSettings .section.funbox").on("click", ".button", (e) => {
  const funbox = <string>$(e.currentTarget).attr("funbox");
  toggleFunbox(funbox);
  setActiveFunboxButton();
});

//tags
$(".pageSettings .section.tags").on(
  "click",
  ".tagsList .tag .tagButton",
  (e) => {
    const target = e.currentTarget;
    const tagid = $(target).parent(".tag").attr("id") as string;
    TagController.toggle(tagid);
    $(target).toggleClass("active");
  }
);

$(".pageSettings .section.presets").on(
  "click",
  ".presetsList .preset .presetButton",
  (e) => {
    const target = e.currentTarget;
    const presetid = $(target).parent(".preset").attr("id") as string;
    console.log("Applying Preset");
    configEventDisabled = true;
    PresetController.apply(presetid);
    configEventDisabled = false;
    update();
  }
);

$("#importSettingsButton").on("click", () => {
  ImportExportSettingsPopup.show("import");
});

$("#exportSettingsButton").on("click", () => {
  const configJSON = JSON.stringify(Config);
  navigator.clipboard.writeText(configJSON).then(
    function () {
      Notifications.add("JSON Copied to clipboard", 0);
    },
    function () {
      ImportExportSettingsPopup.show("export");
    }
  );
});

$(".pageSettings .sectionGroupTitle").on("click", (e) => {
  toggleSettingsGroup($(e.currentTarget).attr("group") as string);
});

$(".pageSettings .section.apeKeys #showApeKeysPopup").on("click", () => {
  ApeKeysPopup.show();
});

$(".pageSettings .section.customBackgroundSize .inputAndButton .save").on(
  "click",
  () => {
    UpdateConfig.setCustomBackground(
      $(
        ".pageSettings .section.customBackgroundSize .inputAndButton input"
      ).val() as string
    );
  }
);

$(".pageSettings .section.customBackgroundSize .inputAndButton input").keypress(
  (e) => {
    if (e.key === "Enter") {
      UpdateConfig.setCustomBackground(
        $(
          ".pageSettings .section.customBackgroundSize .inputAndButton input"
        ).val() as string
      );
    }
  }
);

$(".pageSettings .section.fontSize .inputAndButton .save").on("click", () => {
  const didConfigSave = UpdateConfig.setFontSize(
    parseFloat(
      $(".pageSettings .section.fontSize .inputAndButton input").val() as string
    )
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

$(".pageSettings .section.fontSize .inputAndButton input").keypress((e) => {
  if (e.key === "Enter") {
    const didConfigSave = UpdateConfig.setFontSize(
      parseFloat(
        $(
          ".pageSettings .section.fontSize .inputAndButton input"
        ).val() as string
      )
    );
    if (didConfigSave === true) {
      Notifications.add("Saved", 1, {
        duration: 1,
      });
    }
  }
});

$(".pageSettings .section.customLayoutfluid .inputAndButton .save").on(
  "click",
  () => {
    UpdateConfig.setCustomLayoutfluid(
      $(
        ".pageSettings .section.customLayoutfluid .inputAndButton input"
      ).val() as MonkeyTypes.CustomLayoutFluidSpaces
    ).then((bool) => {
      if (bool) {
        Notifications.add("Custom layoutfluid saved", 1);
      }
    });
  }
);

$(".pageSettings .section.customLayoutfluid .inputAndButton .input").keypress(
  (e) => {
    if (e.key === "Enter") {
      UpdateConfig.setCustomLayoutfluid(
        $(
          ".pageSettings .section.customLayoutfluid .inputAndButton input"
        ).val() as MonkeyTypes.CustomLayoutFluidSpaces
      ).then((bool) => {
        if (bool) {
          Notifications.add("Custom layoutfluid saved", 1);
        }
      });
    }
  }
);

$(".pageSettings .quickNav .links a").on("click", (e) => {
  const settingsGroup = e.target.innerText;
  const isOpen = $(`.pageSettings .settingsGroup.${settingsGroup}`).hasClass(
    "slideup"
  );
  isOpen && toggleSettingsGroup(settingsGroup);
});

$(".pageSettings .section.updateCookiePreferences .button").on("click", () => {
  CookiePopup.show();
  CookiePopup.showSettings();
});

$(".pageSettings .section.autoSwitchThemeInputs").on(
  "change",
  `select.light`,
  (e) => {
    const target = $(e.currentTarget);
    if (target.hasClass("disabled") || target.hasClass("no-auto-handle")) {
      return;
    }
    UpdateConfig.setThemeLight(target.val() as string);
  }
);

$(".pageSettings .section.autoSwitchThemeInputs").on(
  "change",
  `select.dark`,
  (e) => {
    const target = $(e.currentTarget);
    if (target.hasClass("disabled") || target.hasClass("no-auto-handle")) {
      return;
    }
    UpdateConfig.setThemeDark(target.val() as string);
  }
);

$(".pageSettings .section.discordIntegration .getLinkAndGoToOauth").on(
  "click",
  () => {
    Ape.users.getOauthLink().then((res) => {
      window.open(res.data.url, "_self");
    });
  }
);

let configEventDisabled = false;
export function setEventDisabled(value: boolean): void {
  configEventDisabled = value;
}
ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "fullConfigChange") setEventDisabled(true);
  if (eventKey === "fullConfigChangeFinished") {
    setEventDisabled(false);
  }
  if (configEventDisabled || eventKey === "saveToLocalStorage") return;
  if (ActivePage.get() === "settings" && eventKey !== "theme") {
    update();
  }
});

export const page = new Page(
  "settings",
  $(".page.pageSettings"),
  "/settings",
  async () => {
    //
  },
  async () => {
    Skeleton.remove("pageSettings");
    reset();
  },
  async () => {
    Skeleton.append("pageSettings", "middle");
    await fillSettingsPage();
    await update(false);
  },
  async () => {
    //
  }
);

$(() => {
  Skeleton.save("pageSettings");
});
