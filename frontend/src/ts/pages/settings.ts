import SettingsGroup from "../elements/settings/settings-group";
import Config, * as UpdateConfig from "../config";
import * as Sound from "../controllers/sound-controller";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as JSONData from "../utils/json-data";
import * as DB from "../db";
import * as Funbox from "../test/funbox/funbox";
import * as TagController from "../controllers/tag-controller";
import * as PresetController from "../controllers/preset-controller";
import * as ThemePicker from "../elements/settings/theme-picker";
import * as Notifications from "../elements/notifications";
import * as ImportExportSettingsModal from "../modals/import-export-settings";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";
import Page from "./page";
import { isAuthenticated } from "../firebase";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import SlimSelect from "slim-select";
import * as Skeleton from "../utils/skeleton";
import * as CustomBackgroundFilter from "../elements/custom-background-filter";
import {
  ConfigValue,
  CustomBackgroundSchema,
  ThemeName,
  CustomLayoutFluid,
  FunboxName,
} from "@monkeytype/contracts/schemas/configs";
import { getAllFunboxes, checkCompatibility } from "@monkeytype/funbox";
import { getActiveFunboxNames } from "../test/funbox/list";
import { SnapshotPreset } from "../constants/default-snapshot";
import { LayoutsList } from "../constants/layouts";
import { DataArrayPartial, Optgroup, OptionOptional } from "slim-select/store";
import { tryCatch } from "@monkeytype/util/trycatch";
import { Theme, ThemesList } from "../constants/themes";
import { areSortedArraysEqual, areUnsortedArraysEqual } from "../utils/arrays";
import { LayoutName } from "@monkeytype/contracts/schemas/layouts";
import { LanguageGroupNames, LanguageGroups } from "../constants/languages";
import { Language } from "@monkeytype/contracts/schemas/languages";

let settingsInitialized = false;

type SettingsGroups<T extends ConfigValue> = Record<string, SettingsGroup<T>>;
let customLayoutFluidSelect: SlimSelect | undefined;
let customPolyglotSelect: SlimSelect | undefined;

export const groups: SettingsGroups<ConfigValue> = {};

async function initGroups(): Promise<void> {
  groups["smoothCaret"] = new SettingsGroup(
    "smoothCaret",
    UpdateConfig.setSmoothCaret,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["codeUnindentOnBackspace"] = new SettingsGroup(
    "codeUnindentOnBackspace",
    UpdateConfig.setCodeUnindentOnBackspace,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["difficulty"] = new SettingsGroup(
    "difficulty",
    UpdateConfig.setDifficulty,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["quickRestart"] = new SettingsGroup(
    "quickRestart",
    UpdateConfig.setQuickRestartMode,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["showAverage"] = new SettingsGroup(
    "showAverage",
    UpdateConfig.setShowAverage,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["keymapMode"] = new SettingsGroup(
    "keymapMode",
    UpdateConfig.setKeymapMode,
    "button",
    () => {
      groups["showLiveWpm"]?.updateUI();
    },
    () => {
      if (Config.keymapMode === "off") {
        $(".pageSettings .section[data-config-name='keymapStyle']").addClass(
          "hidden"
        );
        $(".pageSettings .section[data-config-name='keymapLayout']").addClass(
          "hidden"
        );
        $(
          ".pageSettings .section[data-config-name='keymapLegendStyle']"
        ).addClass("hidden");
        $(
          ".pageSettings .section[data-config-name='keymapShowTopRow']"
        ).addClass("hidden");
        $(".pageSettings .section[data-config-name='keymapSize']").addClass(
          "hidden"
        );
      } else {
        $(".pageSettings .section[data-config-name='keymapStyle']").removeClass(
          "hidden"
        );
        $(
          ".pageSettings .section[data-config-name='keymapLayout']"
        ).removeClass("hidden");
        $(
          ".pageSettings .section[data-config-name='keymapLegendStyle']"
        ).removeClass("hidden");
        $(
          ".pageSettings .section[data-config-name='keymapShowTopRow']"
        ).removeClass("hidden");
        $(".pageSettings .section[data-config-name='keymapSize']").removeClass(
          "hidden"
        );
      }
    }
  ) as SettingsGroup<ConfigValue>;
  groups["keymapMatrix"] = new SettingsGroup(
    "keymapStyle",
    UpdateConfig.setKeymapStyle,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["keymapLayout"] = new SettingsGroup(
    "keymapLayout",
    UpdateConfig.setKeymapLayout,
    "select"
  ) as SettingsGroup<ConfigValue>;
  groups["keymapLegendStyle"] = new SettingsGroup(
    "keymapLegendStyle",
    UpdateConfig.setKeymapLegendStyle,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["keymapShowTopRow"] = new SettingsGroup(
    "keymapShowTopRow",
    UpdateConfig.setKeymapShowTopRow,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["keymapSize"] = new SettingsGroup(
    "keymapSize",
    UpdateConfig.setKeymapSize,
    "range"
  ) as SettingsGroup<ConfigValue>;
  groups["showKeyTips"] = new SettingsGroup(
    "showKeyTips",
    UpdateConfig.setKeyTips,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["freedomMode"] = new SettingsGroup(
    "freedomMode",
    UpdateConfig.setFreedomMode,
    "button",
    () => {
      groups["confidenceMode"]?.updateUI();
    }
  ) as SettingsGroup<ConfigValue>;
  groups["strictSpace"] = new SettingsGroup(
    "strictSpace",
    UpdateConfig.setStrictSpace,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["oppositeShiftMode"] = new SettingsGroup(
    "oppositeShiftMode",
    UpdateConfig.setOppositeShiftMode,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["confidenceMode"] = new SettingsGroup(
    "confidenceMode",
    UpdateConfig.setConfidenceMode,
    "button",
    () => {
      groups["freedomMode"]?.updateUI();
      groups["stopOnError"]?.updateUI();
    }
  ) as SettingsGroup<ConfigValue>;
  groups["indicateTypos"] = new SettingsGroup(
    "indicateTypos",
    UpdateConfig.setIndicateTypos,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["hideExtraLetters"] = new SettingsGroup(
    "hideExtraLetters",
    UpdateConfig.setHideExtraLetters,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["blindMode"] = new SettingsGroup(
    "blindMode",
    UpdateConfig.setBlindMode,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["quickEnd"] = new SettingsGroup(
    "quickEnd",
    UpdateConfig.setQuickEnd,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["repeatQuotes"] = new SettingsGroup(
    "repeatQuotes",
    UpdateConfig.setRepeatQuotes,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["ads"] = new SettingsGroup(
    "ads",
    UpdateConfig.setAds,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["alwaysShowWordsHistory"] = new SettingsGroup(
    "alwaysShowWordsHistory",
    UpdateConfig.setAlwaysShowWordsHistory,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["britishEnglish"] = new SettingsGroup(
    "britishEnglish",
    UpdateConfig.setBritishEnglish,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["singleListCommandLine"] = new SettingsGroup(
    "singleListCommandLine",
    UpdateConfig.setSingleListCommandLine,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["capsLockWarning"] = new SettingsGroup(
    "capsLockWarning",
    UpdateConfig.setCapsLockWarning,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["flipTestColors"] = new SettingsGroup(
    "flipTestColors",
    UpdateConfig.setFlipTestColors,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["showOutOfFocusWarning"] = new SettingsGroup(
    "showOutOfFocusWarning",
    UpdateConfig.setShowOutOfFocusWarning,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["colorfulMode"] = new SettingsGroup(
    "colorfulMode",
    UpdateConfig.setColorfulMode,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["startGraphsAtZero"] = new SettingsGroup(
    "startGraphsAtZero",
    UpdateConfig.setStartGraphsAtZero,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["autoSwitchTheme"] = new SettingsGroup(
    "autoSwitchTheme",
    UpdateConfig.setAutoSwitchTheme,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["randomTheme"] = new SettingsGroup(
    "randomTheme",
    UpdateConfig.setRandomTheme,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["stopOnError"] = new SettingsGroup(
    "stopOnError",
    UpdateConfig.setStopOnError,
    "button",
    () => {
      groups["confidenceMode"]?.updateUI();
    }
  ) as SettingsGroup<ConfigValue>;
  groups["soundVolume"] = new SettingsGroup(
    "soundVolume",
    UpdateConfig.setSoundVolume,
    "range"
  ) as SettingsGroup<ConfigValue>;
  groups["playSoundOnError"] = new SettingsGroup(
    "playSoundOnError",
    UpdateConfig.setPlaySoundOnError,
    "button",
    () => {
      if (Config.playSoundOnError !== "off") void Sound.playError();
    }
  ) as SettingsGroup<ConfigValue>;
  groups["playSoundOnClick"] = new SettingsGroup(
    "playSoundOnClick",
    UpdateConfig.setPlaySoundOnClick,
    "button",
    () => {
      if (Config.playSoundOnClick !== "off") void Sound.playClick("KeyQ");
    }
  ) as SettingsGroup<ConfigValue>;
  groups["showAllLines"] = new SettingsGroup(
    "showAllLines",
    UpdateConfig.setShowAllLines,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["paceCaret"] = new SettingsGroup(
    "paceCaret",
    UpdateConfig.setPaceCaret,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["repeatedPace"] = new SettingsGroup(
    "repeatedPace",
    UpdateConfig.setRepeatedPace,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["minWpm"] = new SettingsGroup(
    "minWpm",
    UpdateConfig.setMinWpm,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["minAcc"] = new SettingsGroup(
    "minAcc",
    UpdateConfig.setMinAcc,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["minBurst"] = new SettingsGroup(
    "minBurst",
    UpdateConfig.setMinBurst,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["smoothLineScroll"] = new SettingsGroup(
    "smoothLineScroll",
    UpdateConfig.setSmoothLineScroll,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["lazyMode"] = new SettingsGroup(
    "lazyMode",
    UpdateConfig.setLazyMode,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["layout"] = new SettingsGroup(
    "layout",
    UpdateConfig.setLayout,
    "select"
  ) as SettingsGroup<ConfigValue>;
  groups["language"] = new SettingsGroup(
    "language",
    UpdateConfig.setLanguage,
    "select"
  ) as SettingsGroup<ConfigValue>;
  groups["fontSize"] = new SettingsGroup(
    "fontSize",
    UpdateConfig.setFontSize,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["maxLineWidth"] = new SettingsGroup(
    "maxLineWidth",
    UpdateConfig.setMaxLineWidth,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["caretStyle"] = new SettingsGroup(
    "caretStyle",
    UpdateConfig.setCaretStyle,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["paceCaretStyle"] = new SettingsGroup(
    "paceCaretStyle",
    UpdateConfig.setPaceCaretStyle,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["timerStyle"] = new SettingsGroup(
    "timerStyle",
    UpdateConfig.setTimerStyle,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["liveSpeedStyle"] = new SettingsGroup(
    "liveSpeedStyle",
    UpdateConfig.setLiveSpeedStyle,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["liveAccStyle"] = new SettingsGroup(
    "liveAccStyle",
    UpdateConfig.setLiveAccStyle,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["liveBurstStyle"] = new SettingsGroup(
    "liveBurstStyle",
    UpdateConfig.setLiveBurstStyle,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["highlightMode"] = new SettingsGroup(
    "highlightMode",
    UpdateConfig.setHighlightMode,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["tapeMode"] = new SettingsGroup(
    "tapeMode",
    UpdateConfig.setTapeMode,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["tapeMargin"] = new SettingsGroup(
    "tapeMargin",
    UpdateConfig.setTapeMargin,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["timerOpacity"] = new SettingsGroup(
    "timerOpacity",
    UpdateConfig.setTimerOpacity,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["timerColor"] = new SettingsGroup(
    "timerColor",
    UpdateConfig.setTimerColor,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["fontFamily"] = new SettingsGroup(
    "fontFamily",
    UpdateConfig.setFontFamily,
    "button",
    undefined,
    () => {
      const customButton = $(
        ".pageSettings .section[data-config-name='fontFamily'] .buttons button[data-config-value='custom']"
      );

      if (
        $(
          ".pageSettings .section[data-config-name='fontFamily'] .buttons .active"
        ).length === 0
      ) {
        customButton.addClass("active");
        customButton.text(`Custom (${Config.fontFamily.replace(/_/g, " ")})`);
      } else {
        customButton.text("Custom");
      }
    }
  ) as SettingsGroup<ConfigValue>;
  groups["alwaysShowDecimalPlaces"] = new SettingsGroup(
    "alwaysShowDecimalPlaces",
    UpdateConfig.setAlwaysShowDecimalPlaces,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["typingSpeedUnit"] = new SettingsGroup(
    "typingSpeedUnit",
    UpdateConfig.setTypingSpeedUnit,
    "button"
  ) as SettingsGroup<ConfigValue>;
  groups["customBackgroundSize"] = new SettingsGroup(
    "customBackgroundSize",
    UpdateConfig.setCustomBackgroundSize,
    "button"
  ) as SettingsGroup<ConfigValue>;
}

async function fillSettingsPage(): Promise<void> {
  if (settingsInitialized) {
    return;
  }
  // Language Selection Combobox
  new SlimSelect({
    select: ".pageSettings .section[data-config-name='language'] select",
    data: getLanguageDropdownData((language) => language === Config.language),
    settings: {
      searchPlaceholder: "search",
    },
  });

  const layoutToOption: (layout: LayoutName) => OptionOptional = (layout) => ({
    value: layout,
    text: layout.replace(/_/g, " "),
  });

  new SlimSelect({
    select: ".pageSettings .section[data-config-name='layout'] select",
    data: [
      { text: "off", value: "default" },
      ...LayoutsList.filter((layout) => layout !== "korean").map(
        layoutToOption
      ),
    ],
  });

  new SlimSelect({
    select: ".pageSettings .section[data-config-name='keymapLayout'] select",
    data: [
      { text: "emulator sync", value: "overrideSync" },
      ...LayoutsList.map(layoutToOption),
    ],
  });

  new SlimSelect({
    select:
      ".pageSettings .section[data-config-name='autoSwitchThemeInputs'] select.light",
    data: getThemeDropdownData((theme) => theme.name === Config.themeLight),
    events: {
      afterChange: (newVal): void => {
        UpdateConfig.setThemeLight(newVal[0]?.value as ThemeName);
      },
    },
  });

  new SlimSelect({
    select:
      ".pageSettings .section[data-config-name='autoSwitchThemeInputs'] select.dark",
    data: getThemeDropdownData((theme) => theme.name === Config.themeDark),
    events: {
      afterChange: (newVal): void => {
        UpdateConfig.setThemeDark(newVal[0]?.value as ThemeName);
      },
    },
  });

  const funboxEl = document.querySelector(
    ".pageSettings .section[data-config-name='funbox'] .buttons"
  ) as HTMLDivElement;
  let funboxElHTML = "";

  for (const funbox of getAllFunboxes()) {
    if (funbox.name === "mirror") {
      funboxElHTML += `<button class="funbox" data-funbox-name="mirror" data-config-value='${
        funbox.name
      }' aria-label="${
        funbox.description
      }" data-balloon-pos="up" data-balloon-length="fit" style="transform:scaleX(-1);">${funbox.name.replace(
        /_/g,
        " "
      )}</button>`;
    } else if (funbox.name === "upside_down") {
      funboxElHTML += `<button class="funbox" data-funbox-name="upside_down" data-config-value='${
        funbox.name
      }' aria-label="${
        funbox.description
      }" data-balloon-pos="up" data-balloon-length="fit" style="transform:scaleX(-1) scaleY(-1); z-index:1;">${funbox.name.replace(
        /_/g,
        " "
      )}</button>`;
    } else if (funbox.name === "underscore_spaces") {
      // Display as "underscore_spaces". Does not replace underscores with spaces.
      funboxElHTML += `<button class="funbox" data-funbox-name="underscore_spaces" data-config-value='${funbox.name}' aria-label="${funbox.description}" data-balloon-pos="up" data-balloon-length="fit">${funbox.name}</button>`;
    } else {
      funboxElHTML += `<button class="funbox" data-funbox-name="${
        funbox.name
      }" data-config-value='${funbox.name}' aria-label="${
        funbox.description
      }" data-balloon-pos="up" data-balloon-length="fit">${funbox.name.replace(
        /_/g,
        " "
      )}</button>`;
    }
  }
  funboxEl.innerHTML = funboxElHTML;

  const fontsEl = document.querySelector(
    ".pageSettings .section[data-config-name='fontFamily'] .buttons"
  ) as HTMLDivElement;

  if (fontsEl.innerHTML === "") {
    let fontsElHTML = "";

    const { data: fontsList, error: getFontsListError } = await tryCatch(
      JSONData.getFontsList()
    );
    if (getFontsListError) {
      console.error(
        Misc.createErrorMessage(
          getFontsListError,
          "Failed to update fonts settings buttons"
        )
      );
    }

    if (fontsList) {
      for (const font of fontsList) {
        let fontFamily = font.name;
        if (fontFamily === "Helvetica") {
          fontFamily = "Comic Sans MS";
        }
        if ((font.systemFont ?? false) === false) {
          fontFamily += " Preview";
        }
        const activeClass = Config.fontFamily === font.name ? " active" : "";
        const display = font.display !== undefined ? font.display : font.name;

        fontsElHTML += `<button class="${activeClass}" style="font-family:${fontFamily}" data-config-value="${font.name.replace(
          / /g,
          "_"
        )}">${display}</button>`;
      }

      fontsElHTML +=
        '<button class="no-auto-handle" data-config-value="custom"">Custom</button>';

      fontsEl.innerHTML = fontsElHTML;
    }
  }

  customLayoutFluidSelect = new SlimSelect({
    select:
      ".pageSettings .section[data-config-name='customLayoutfluid'] select",
    settings: { keepOrder: true, minSelected: 1 },
    events: {
      afterChange: (newVal): void => {
        const customLayoutfluid = newVal.map(
          (it) => it.value
        ) as CustomLayoutFluid;
        //checking equal with order, because customLayoutfluid is ordered
        if (
          !areSortedArraysEqual(customLayoutfluid, Config.customLayoutfluid)
        ) {
          void UpdateConfig.setCustomLayoutfluid(customLayoutfluid);
        }
      },
    },
  });

  customPolyglotSelect = new SlimSelect({
    select: ".pageSettings .section[data-config-name='customPolyglot'] select",
    settings: { minSelected: 1 },
    data: getLanguageDropdownData((language) =>
      Config.customPolyglot.includes(language)
    ),
    events: {
      afterChange: (newVal): void => {
        const customPolyglot = newVal.map((it) => it.value) as Language[];
        //checking equal without order, because customPolyglot is not ordered
        if (!areUnsortedArraysEqual(customPolyglot, Config.customPolyglot)) {
          void UpdateConfig.setCustomPolyglot(customPolyglot);
        }
      },
    },
  });

  setEventDisabled(true);

  await initGroups();
  await ThemePicker.refreshCustomButtons();
  await ThemePicker.refreshPresetButtons();

  setEventDisabled(false);
  settingsInitialized = true;
}

// export let settingsFillPromise = fillSettingsPage();

export function hideAccountSection(): void {
  $(`.pageSettings .section.needsAccount`).addClass("hidden");
}

function showAccountSection(): void {
  $(`.pageSettings .section.needsAccount`).removeClass("hidden");
  refreshTagsSettingsSection();
  refreshPresetsSettingsSection();
}

function setActiveFunboxButton(): void {
  const buttons = document.querySelectorAll(
    `.pageSettings .section[data-config-name='funbox'] button`
  );

  for (const button of buttons) {
    button.classList.remove("active");
    button.classList.remove("disabled");

    const configValue = button.getAttribute("data-config-value");
    const funboxName = button.getAttribute("data-funbox-name");

    if (configValue === null || funboxName === null) {
      continue;
    }

    if (Config.funbox.includes(funboxName as FunboxName)) {
      button.classList.add("active");
    } else if (
      !checkCompatibility(getActiveFunboxNames(), funboxName as FunboxName)
    ) {
      button.classList.add("disabled");
    }
  }
}

function refreshTagsSettingsSection(): void {
  if (isAuthenticated() && DB.getSnapshot()) {
    const tagsEl = $(".pageSettings .section.tags .tagsList").empty();
    DB.getSnapshot()?.tags?.forEach((tag) => {
      // let tagPbString = "No PB found";
      // if (tag.pb !== undefined && tag.pb > 0) {
      //   tagPbString = `PB: ${tag.pb}`;
      // }
      tagsEl.append(`

      <div class="buttons tag" data-id="${tag._id}" data-name="${
        tag.name
      }" data-display="${tag.display}">
        <button class="tagButton ${tag.active ? "active" : ""}" active="${
        tag.active
      }">
          ${tag.display}
        </button>
        <button class="clearPbButton" aria-label="clear tags personal bests" data-balloon-pos="left" >
          <i class="fas fa-crown fa-fw"></i>
        </button>
        <button class="editButton" aria-label="rename tag" data-balloon-pos="left" >
          <i class="fas fa-pen fa-fw"></i>
        </button>
        <button class="removeButton" aria-label="remove tag"  data-balloon-pos="left" >
          <i class="fas fa-trash fa-fw"></i>
        </button>
      </div>

      `);
    });
    $(".pageSettings .section.tags").removeClass("hidden");
  } else {
    $(".pageSettings .section.tags").addClass("hidden");
  }
}

function refreshPresetsSettingsSection(): void {
  if (isAuthenticated() && DB.getSnapshot()) {
    const presetsEl = $(".pageSettings .section.presets .presetsList").empty();
    DB.getSnapshot()?.presets?.forEach((preset: SnapshotPreset) => {
      presetsEl.append(`
      <div class="buttons preset" data-id="${preset._id}" data-name="${preset.name}" data-display="${preset.display}">
        <button class="presetButton">${preset.display}</button>
        <button class="editButton">
          <i class="fas fa-pen fa-fw"></i>
        </button>
        <button class="removeButton">
          <i class="fas fa-trash fa-fw"></i>
        </button>
      </div>
      
      `);
    });
    $(".pageSettings .section.presets").removeClass("hidden");
  } else {
    $(".pageSettings .section.presets").addClass("hidden");
  }
}

export async function update(): Promise<void> {
  if (Config.showKeyTips) {
    $(".pageSettings .tip").removeClass("hidden");
  } else {
    $(".pageSettings .tip").addClass("hidden");
  }

  for (const group of Object.keys(groups)) {
    groups[group]?.updateUI();
  }

  refreshTagsSettingsSection();
  refreshPresetsSettingsSection();
  // LanguagePicker.setActiveGroup(); Shifted from grouped btns to combo-box
  setActiveFunboxButton();
  await Misc.sleep(0);
  ThemePicker.updateActiveTab();
  ThemePicker.setCustomInputs(true);
  // ThemePicker.updateActiveButton();

  $(
    ".pageSettings .section[data-config-name='paceCaret'] input.customPaceCaretSpeed"
  ).val(
    getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(
      Config.paceCaretCustomSpeed
    )
  );

  $(
    ".pageSettings .section[data-config-name='minWpm'] input.customMinWpmSpeed"
  ).val(
    getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(Config.minWpmCustomSpeed)
  );
  $(".pageSettings .section[data-config-name='minAcc'] input.customMinAcc").val(
    Config.minAccCustom
  );
  $(
    ".pageSettings .section[data-config-name='minBurst'] input.customMinBurst"
  ).val(
    getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(
      Config.minBurstCustomSpeed
    )
  );

  if (Config.autoSwitchTheme) {
    $(
      ".pageSettings .section[data-config-name='autoSwitchThemeInputs']"
    ).removeClass("hidden");
  } else {
    $(
      ".pageSettings .section[data-config-name='autoSwitchThemeInputs']"
    ).addClass("hidden");
  }

  if (Config.customBackground !== "") {
    $(
      ".pageSettings .section[data-config-name='customBackgroundFilter']"
    ).removeClass("hidden");
  } else {
    $(
      ".pageSettings .section[data-config-name='customBackgroundFilter']"
    ).addClass("hidden");
  }
  updateCustomBackgroundRemoveButtonVisibility();

  $(".pageSettings .section[data-config-name='fontSize'] input").val(
    Config.fontSize
  );

  $(".pageSettings .section[data-config-name='maxLineWidth'] input").val(
    Config.maxLineWidth
  );

  $(".pageSettings .section[data-config-name='keymapSize'] input").val(
    Config.keymapSize
  );

  $(".pageSettings .section[data-config-name='tapeMargin'] input").val(
    Config.tapeMargin
  );

  $(
    ".pageSettings .section[data-config-name='customBackgroundSize'] input"
  ).val(Config.customBackground);

  if (isAuthenticated()) {
    showAccountSection();
  } else {
    hideAccountSection();
  }

  CustomBackgroundFilter.updateUI();

  const userAgent = window.navigator.userAgent.toLowerCase();
  const modifierKey =
    userAgent.includes("mac") && !userAgent.includes("firefox")
      ? "cmd"
      : "ctrl";

  const commandKey = Config.quickRestart === "esc" ? "tab" : "esc";
  $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (<key>${commandKey}</key> or <key>${modifierKey}</key> + <key>shift</key> + <key>p</key>)`);

  if (
    customLayoutFluidSelect !== undefined &&
    //checking equal with order, because customLayoutFluid is ordered
    !areSortedArraysEqual(
      customLayoutFluidSelect.getSelected(),
      Config.customLayoutfluid
    )
  ) {
    //replace the data because the data is ordered. do not use setSelected
    customLayoutFluidSelect.setData(getLayoutfluidDropdownData());
  }

  if (
    customPolyglotSelect !== undefined &&
    //checking equal without order, because customPolyglot is not ordered
    !areUnsortedArraysEqual(
      customPolyglotSelect.getSelected(),
      Config.customPolyglot
    )
  ) {
    customPolyglotSelect.setSelected(Config.customPolyglot);
  }
}
function toggleSettingsGroup(groupName: string): void {
  const groupEl = $(`.pageSettings .settingsGroup.${groupName}`);
  groupEl.stop(true, true).slideToggle(250).toggleClass("slideup");
  if (groupEl.hasClass("slideup")) {
    $(`.pageSettings .sectionGroupTitle[group=${groupName}]`).addClass(
      "rotateIcon"
    );
  } else {
    $(`.pageSettings .sectionGroupTitle[group=${groupName}]`).removeClass(
      "rotateIcon"
    );
  }
}

function updateCustomBackgroundRemoveButtonVisibility(): void {
  const button = $(
    ".pageSettings .section[data-config-name='customBackgroundSize'] button.remove"
  );
  if (
    Config.customBackground !== undefined &&
    Config.customBackground.length > 0
  ) {
    button.removeClass("hidden");
  } else {
    button.addClass("hidden");
  }
}

$(".pageSettings .section[data-config-name='paceCaret']").on(
  "focusout",
  "input.customPaceCaretSpeed",
  () => {
    const inputValue = parseInt(
      $(
        ".pageSettings .section[data-config-name='paceCaret'] input.customPaceCaretSpeed"
      ).val() as string
    );
    const newConfigValue = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
      inputValue
    );
    UpdateConfig.setPaceCaretCustomSpeed(newConfigValue);
  }
);

$(".pageSettings .section[data-config-name='paceCaret']").on(
  "click",
  "button.save",
  () => {
    const inputValue = parseInt(
      $(
        ".pageSettings .section[data-config-name='paceCaret'] input.customPaceCaretSpeed"
      ).val() as string
    );
    const newConfigValue = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
      inputValue
    );
    UpdateConfig.setPaceCaretCustomSpeed(newConfigValue);
  }
);

$(".pageSettings .section[data-config-name='minWpm']").on(
  "focusout",
  "input.customMinWpmSpeed",
  () => {
    const inputValue = parseInt(
      $(
        ".pageSettings .section[data-config-name='minWpm'] input.customMinWpmSpeed"
      ).val() as string
    );
    const newConfigValue = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
      inputValue
    );
    UpdateConfig.setMinWpmCustomSpeed(newConfigValue);
  }
);

$(".pageSettings .section[data-config-name='minWpm']").on(
  "click",
  "button.save",
  () => {
    const inputValue = parseInt(
      $(
        ".pageSettings .section[data-config-name='minWpm'] input.customMinWpmSpeed"
      ).val() as string
    );
    const newConfigValue = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
      inputValue
    );
    UpdateConfig.setMinWpmCustomSpeed(newConfigValue);
  }
);

$(".pageSettings .section[data-config-name='minAcc']").on(
  "focusout",
  "input.customMinAcc",
  () => {
    UpdateConfig.setMinAccCustom(
      parseInt(
        $(
          ".pageSettings .section[data-config-name='minAcc'] input.customMinAcc"
        ).val() as string
      )
    );
  }
);

$(".pageSettings .section[data-config-name='minAcc']").on(
  "click",
  "button.save",
  () => {
    UpdateConfig.setMinAccCustom(
      parseInt(
        $(
          ".pageSettings .section[data-config-name='minAcc'] input.customMinAcc"
        ).val() as string
      )
    );
  }
);

$(".pageSettings .section[data-config-name='minBurst']").on(
  "focusout",
  "input.customMinBurst",
  () => {
    const inputValue = parseInt(
      $(
        ".pageSettings .section[data-config-name='minBurst'] input.customMinBurst"
      ).val() as string
    );
    const newConfigValue = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
      inputValue
    );
    UpdateConfig.setMinBurstCustomSpeed(newConfigValue);
  }
);

$(".pageSettings .section[data-config-name='minBurst']").on(
  "click",
  "button.save",
  () => {
    const inputValue = parseInt(
      $(
        ".pageSettings .section[data-config-name='minBurst'] input.customMinBurst"
      ).val() as string
    );
    const newConfigValue = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
      inputValue
    );
    UpdateConfig.setMinBurstCustomSpeed(newConfigValue);
  }
);

//funbox
$(".pageSettings .section[data-config-name='funbox']").on(
  "click",
  "button",
  (e) => {
    const funbox = $(e.currentTarget).attr("data-config-value") as FunboxName;
    Funbox.toggleFunbox(funbox);
    setActiveFunboxButton();
  }
);

//tags
$(".pageSettings .section.tags").on(
  "click",
  ".tagsList .tag .tagButton",
  (e) => {
    const target = e.currentTarget as HTMLElement;
    const tagid = $(target).parent(".tag").attr("data-id") as string;
    TagController.toggle(tagid);
    $(target).toggleClass("active");
  }
);

$(".pageSettings .section.presets").on(
  "click",
  ".presetsList .preset .presetButton",
  async (e) => {
    const target = e.currentTarget as HTMLElement;
    const presetid = $(target).parent(".preset").attr("data-id") as string;
    await PresetController.apply(presetid);
    void update();
  }
);

$("#importSettingsButton").on("click", () => {
  ImportExportSettingsModal.show("import");
});

$("#exportSettingsButton").on("click", () => {
  const configJSON = JSON.stringify(Config);
  navigator.clipboard.writeText(configJSON).then(
    function () {
      Notifications.add("JSON Copied to clipboard", 0);
    },
    function () {
      ImportExportSettingsModal.show("export");
    }
  );
});

$(".pageSettings .sectionGroupTitle").on("click", (e) => {
  toggleSettingsGroup($(e.currentTarget).attr("group") as string);
});

$(
  ".pageSettings .section[data-config-name='customBackgroundSize'] .inputAndButton button.save"
).on("click", () => {
  const newVal = $(
    ".pageSettings .section[data-config-name='customBackgroundSize'] .inputAndButton input"
  ).val() as string;

  const parsed = CustomBackgroundSchema.safeParse(newVal);

  if (!parsed.success) {
    Notifications.add(
      `Invalid custom background URL (${parsed.error.issues[0]?.message})`,
      0
    );
    return;
  }

  UpdateConfig.setCustomBackground(newVal);
});

$(
  ".pageSettings .section[data-config-name='customBackgroundSize'] .inputAndButton button.remove"
).on("click", () => {
  UpdateConfig.setCustomBackground("");
});

$(
  ".pageSettings .section[data-config-name='customBackgroundSize'] .inputAndButton input"
).on("keypress", (e) => {
  if (e.key === "Enter") {
    const newVal = $(
      ".pageSettings .section[data-config-name='customBackgroundSize'] .inputAndButton input"
    ).val() as string;

    const parsed = CustomBackgroundSchema.safeParse(newVal);

    if (!parsed.success) {
      Notifications.add(
        `Invalid custom background URL (${parsed.error.issues[0]?.message})`,
        0
      );
      return;
    }

    UpdateConfig.setCustomBackground(newVal);
  }
});

$(
  ".pageSettings .section[data-config-name='fontSize'] .inputAndButton button.save"
).on("click", () => {
  const didConfigSave = UpdateConfig.setFontSize(
    parseFloat(
      $(
        ".pageSettings .section[data-config-name='fontSize'] .inputAndButton input"
      ).val() as string
    )
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

$(
  ".pageSettings .section[data-config-name='fontSize'] .inputAndButton input"
).on("keypress", (e) => {
  if (e.key === "Enter") {
    const didConfigSave = UpdateConfig.setFontSize(
      parseFloat(
        $(
          ".pageSettings .section[data-config-name='fontSize'] .inputAndButton input"
        ).val() as string
      )
    );
    if (didConfigSave) {
      Notifications.add("Saved", 1, {
        duration: 1,
      });
    }
  }
});

$(
  ".pageSettings .section[data-config-name='tapeMargin'] .inputAndButton button.save"
).on("click", () => {
  const didConfigSave = UpdateConfig.setTapeMargin(
    parseFloat(
      $(
        ".pageSettings .section[data-config-name='tapeMargin'] .inputAndButton input"
      ).val() as string
    )
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

$(
  ".pageSettings .section[data-config-name='tapeMargin'] .inputAndButton input"
).on("keypress", (e) => {
  if (e.key === "Enter") {
    const didConfigSave = UpdateConfig.setTapeMargin(
      parseFloat(
        $(
          ".pageSettings .section[data-config-name='tapeMargin'] .inputAndButton input"
        ).val() as string
      )
    );
    if (didConfigSave) {
      Notifications.add("Saved", 1, {
        duration: 1,
      });
    }
  }
});

$(
  ".pageSettings .section[data-config-name='maxLineWidth'] .inputAndButton button.save"
).on("click", () => {
  const didConfigSave = UpdateConfig.setMaxLineWidth(
    parseFloat(
      $(
        ".pageSettings .section[data-config-name='maxLineWidth'] .inputAndButton input"
      ).val() as string
    )
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

$(
  ".pageSettings .section[data-config-name='maxLineWidth'] .inputAndButton input"
).on("focusout", () => {
  const didConfigSave = UpdateConfig.setMaxLineWidth(
    parseFloat(
      $(
        ".pageSettings .section[data-config-name='maxLineWidth'] .inputAndButton input"
      ).val() as string
    )
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

$(
  ".pageSettings .section[data-config-name='maxLineWidth'] .inputAndButton input"
).on("keypress", (e) => {
  if (e.key === "Enter") {
    const didConfigSave = UpdateConfig.setMaxLineWidth(
      parseFloat(
        $(
          ".pageSettings .section[data-config-name='maxLineWidth'] .inputAndButton input"
        ).val() as string
      )
    );
    if (didConfigSave) {
      Notifications.add("Saved", 1, {
        duration: 1,
      });
    }
  }
});

$(
  ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton button.save"
).on("click", () => {
  const didConfigSave = UpdateConfig.setKeymapSize(
    parseFloat(
      $(
        ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input"
      ).val() as string
    )
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

$(
  ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input"
).on("focusout", () => {
  const didConfigSave = UpdateConfig.setKeymapSize(
    parseFloat(
      $(
        ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input"
      ).val() as string
    )
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

$(
  ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input"
).on("keypress", (e) => {
  if (e.key === "Enter") {
    const didConfigSave = UpdateConfig.setKeymapSize(
      parseFloat(
        $(
          ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input"
        ).val() as string
      )
    );
    if (didConfigSave) {
      Notifications.add("Saved", 1, {
        duration: 1,
      });
    }
  }
});

$(".pageSettings .quickNav .links a").on("click", (e) => {
  const settingsGroup = e.target.innerText;
  const isClosed = $(`.pageSettings .settingsGroup.${settingsGroup}`).hasClass(
    "slideup"
  );
  if (isClosed) {
    toggleSettingsGroup(settingsGroup);
  }
});

let configEventDisabled = false;
export function setEventDisabled(value: boolean): void {
  configEventDisabled = value;
}

function getLanguageDropdownData(
  isActive: (val: Language) => boolean
): DataArrayPartial {
  return LanguageGroupNames.map(
    (group) =>
      ({
        label: group,
        options: LanguageGroups[group]?.map((language) => ({
          text: Strings.getLanguageDisplayString(language),
          value: language,
          selected: isActive(language),
        })),
      } as Optgroup)
  );
}

function getLayoutfluidDropdownData(): DataArrayPartial {
  const customLayoutfluidActive = Config.customLayoutfluid;
  return [
    ...customLayoutfluidActive,
    ...LayoutsList.filter((it) => !customLayoutfluidActive.includes(it)),
  ].map((layout) => ({
    text: layout.replace(/_/g, " "),
    value: layout,
    selected: customLayoutfluidActive.includes(layout),
  }));
}

function getThemeDropdownData(
  isActive: (theme: Theme) => boolean
): DataArrayPartial {
  return ThemesList.map((theme) => ({
    value: theme.name,
    text: theme.name.replace(/_/g, " "),
    selected: isActive(theme),
  }));
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "fullConfigChange") setEventDisabled(true);
  if (eventKey === "fullConfigChangeFinished") setEventDisabled(false);
  if (eventKey === "themeLight") {
    $(
      `.pageSettings .section[data-config-name='autoSwitchThemeInputs'] select.light option[value="${eventValue}"]`
    ).attr("selected", "true");
  } else if (eventKey === "themeDark") {
    $(
      `.pageSettings .section[data-config-name='autoSwitchThemeInputs'] select.dark option[value="${eventValue}"]`
    ).attr("selected", "true");
  }
  //make sure the page doesnt update a billion times when applying a preset/config at once
  if (configEventDisabled || eventKey === "saveToLocalStorage") return;
  if (ActivePage.get() === "settings" && eventKey !== "theme") {
    void update();
  }
});

export const page = new Page({
  id: "settings",
  element: $(".page.pageSettings"),
  path: "/settings",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageSettings");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageSettings", "main");
    await UpdateConfig.loadPromise;
    await fillSettingsPage();
    await update();
  },
});

$(async () => {
  Skeleton.save("pageSettings");
});
