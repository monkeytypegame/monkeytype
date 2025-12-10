import SettingsGroup from "../elements/settings/settings-group";
import Config, * as UpdateConfig from "../config";
import * as Sound from "../controllers/sound-controller";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as DB from "../db";
import * as Funbox from "../test/funbox/funbox";
import * as TagController from "../controllers/tag-controller";
import * as PresetController from "../controllers/preset-controller";
import * as ThemePicker from "../elements/settings/theme-picker";
import * as Notifications from "../elements/notifications";
import * as ImportExportSettingsModal from "../modals/import-export-settings";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";
import { PageWithUrlParams } from "./page";
import { isAuthenticated } from "../firebase";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import SlimSelect from "slim-select";
import * as Skeleton from "../utils/skeleton";
import * as CustomBackgroundFilter from "../elements/custom-background-filter";
import {
  ThemeName,
  CustomLayoutFluid,
  FunboxName,
  ConfigKeySchema,
  ConfigKey,
} from "@monkeytype/schemas/configs";
import { getAllFunboxes, checkCompatibility } from "@monkeytype/funbox";
import { getActiveFunboxNames } from "../test/funbox/list";
import { SnapshotPreset } from "../constants/default-snapshot";
import { LayoutsList } from "../constants/layouts";
import { DataArrayPartial, Optgroup, OptionOptional } from "slim-select/store";
import { Theme, ThemesList } from "../constants/themes";
import { areSortedArraysEqual, areUnsortedArraysEqual } from "../utils/arrays";
import { LayoutName } from "@monkeytype/schemas/layouts";
import { LanguageGroupNames, LanguageGroups } from "../constants/languages";
import { Language } from "@monkeytype/schemas/languages";
import FileStorage from "../utils/file-storage";
import { z } from "zod";
import { handleConfigInput } from "../elements/input-validation";
import { Fonts } from "../constants/fonts";
import * as CustomBackgroundPicker from "../elements/settings/custom-background-picker";
import * as CustomFontPicker from "../elements/settings/custom-font-picker";
import * as AuthEvent from "../observables/auth-event";
import * as FpsLimitSection from "../elements/settings/fps-limit-section";

let settingsInitialized = false;

type SettingsGroups = Partial<{ [K in ConfigKey]: SettingsGroup<K> }>;
let customLayoutFluidSelect: SlimSelect | undefined;
let customPolyglotSelect: SlimSelect | undefined;

export const groups: SettingsGroups = {};

const HighlightSchema = ConfigKeySchema.or(
  z.enum([
    "resetSettings",
    "updateCookiePreferences",
    "importexportSettings",
    "theme",
    "presets",
    "tags",
  ]),
);
type Highlight = z.infer<typeof HighlightSchema>;

const StateSchema = z
  .object({
    highlight: HighlightSchema,
  })
  .partial();

async function initGroups(): Promise<void> {
  groups["smoothCaret"] = new SettingsGroup(
    "smoothCaret",
    UpdateConfig.setSmoothCaret,
    "button",
  );
  groups["codeUnindentOnBackspace"] = new SettingsGroup(
    "codeUnindentOnBackspace",
    UpdateConfig.setCodeUnindentOnBackspace,
    "button",
  );
  groups["difficulty"] = new SettingsGroup(
    "difficulty",
    UpdateConfig.setDifficulty,
    "button",
  );
  groups["quickRestart"] = new SettingsGroup(
    "quickRestart",
    UpdateConfig.setQuickRestartMode,
    "button",
  );
  groups["showAverage"] = new SettingsGroup(
    "showAverage",
    UpdateConfig.setShowAverage,
    "button",
  );
  groups["keymapMode"] = new SettingsGroup(
    "keymapMode",
    UpdateConfig.setKeymapMode,
    "button",
    {
      updateCallback: () => {
        if (Config.keymapMode === "off") {
          $(".pageSettings .section[data-config-name='keymapStyle']").addClass(
            "hidden",
          );
          $(".pageSettings .section[data-config-name='keymapLayout']").addClass(
            "hidden",
          );
          $(
            ".pageSettings .section[data-config-name='keymapLegendStyle']",
          ).addClass("hidden");
          $(
            ".pageSettings .section[data-config-name='keymapShowTopRow']",
          ).addClass("hidden");
          $(".pageSettings .section[data-config-name='keymapSize']").addClass(
            "hidden",
          );
        } else {
          $(
            ".pageSettings .section[data-config-name='keymapStyle']",
          ).removeClass("hidden");
          $(
            ".pageSettings .section[data-config-name='keymapLayout']",
          ).removeClass("hidden");
          $(
            ".pageSettings .section[data-config-name='keymapLegendStyle']",
          ).removeClass("hidden");
          $(
            ".pageSettings .section[data-config-name='keymapShowTopRow']",
          ).removeClass("hidden");
          $(
            ".pageSettings .section[data-config-name='keymapSize']",
          ).removeClass("hidden");
        }
      },
    },
  );
  groups["keymapStyle"] = new SettingsGroup(
    "keymapStyle",
    UpdateConfig.setKeymapStyle,
    "button",
  );
  groups["keymapLayout"] = new SettingsGroup(
    "keymapLayout",
    UpdateConfig.setKeymapLayout,
    "select",
  );
  groups["keymapLegendStyle"] = new SettingsGroup(
    "keymapLegendStyle",
    UpdateConfig.setKeymapLegendStyle,
    "button",
  );
  groups["keymapShowTopRow"] = new SettingsGroup(
    "keymapShowTopRow",
    UpdateConfig.setKeymapShowTopRow,
    "button",
  );
  groups["keymapSize"] = new SettingsGroup(
    "keymapSize",
    UpdateConfig.setKeymapSize,
    "range",
  );
  groups["showKeyTips"] = new SettingsGroup(
    "showKeyTips",
    UpdateConfig.setKeyTips,
    "button",
  );
  groups["freedomMode"] = new SettingsGroup(
    "freedomMode",
    UpdateConfig.setFreedomMode,
    "button",
    {
      setCallback: () => {
        groups["confidenceMode"]?.updateUI();
      },
    },
  );
  groups["strictSpace"] = new SettingsGroup(
    "strictSpace",
    UpdateConfig.setStrictSpace,
    "button",
  );
  groups["oppositeShiftMode"] = new SettingsGroup(
    "oppositeShiftMode",
    UpdateConfig.setOppositeShiftMode,
    "button",
  );
  groups["confidenceMode"] = new SettingsGroup(
    "confidenceMode",
    UpdateConfig.setConfidenceMode,
    "button",
    {
      setCallback: () => {
        groups["freedomMode"]?.updateUI();
        groups["stopOnError"]?.updateUI();
      },
    },
  );
  groups["indicateTypos"] = new SettingsGroup(
    "indicateTypos",
    UpdateConfig.setIndicateTypos,
    "button",
  );
  groups["compositionDisplay"] = new SettingsGroup(
    "compositionDisplay",
    UpdateConfig.setCompositionDisplay,
    "button",
  );
  groups["hideExtraLetters"] = new SettingsGroup(
    "hideExtraLetters",
    UpdateConfig.setHideExtraLetters,
    "button",
  );
  groups["blindMode"] = new SettingsGroup(
    "blindMode",
    UpdateConfig.setBlindMode,
    "button",
  );
  groups["quickEnd"] = new SettingsGroup(
    "quickEnd",
    UpdateConfig.setQuickEnd,
    "button",
  );
  groups["repeatQuotes"] = new SettingsGroup(
    "repeatQuotes",
    UpdateConfig.setRepeatQuotes,
    "button",
  );
  groups["ads"] = new SettingsGroup("ads", UpdateConfig.setAds, "button");
  groups["alwaysShowWordsHistory"] = new SettingsGroup(
    "alwaysShowWordsHistory",
    UpdateConfig.setAlwaysShowWordsHistory,
    "button",
  );
  groups["britishEnglish"] = new SettingsGroup(
    "britishEnglish",
    UpdateConfig.setBritishEnglish,
    "button",
  );
  groups["singleListCommandLine"] = new SettingsGroup(
    "singleListCommandLine",
    UpdateConfig.setSingleListCommandLine,
    "button",
  );
  groups["capsLockWarning"] = new SettingsGroup(
    "capsLockWarning",
    UpdateConfig.setCapsLockWarning,
    "button",
  );
  groups["flipTestColors"] = new SettingsGroup(
    "flipTestColors",
    UpdateConfig.setFlipTestColors,
    "button",
  );
  groups["showOutOfFocusWarning"] = new SettingsGroup(
    "showOutOfFocusWarning",
    UpdateConfig.setShowOutOfFocusWarning,
    "button",
  );
  groups["colorfulMode"] = new SettingsGroup(
    "colorfulMode",
    UpdateConfig.setColorfulMode,
    "button",
  );
  groups["startGraphsAtZero"] = new SettingsGroup(
    "startGraphsAtZero",
    UpdateConfig.setStartGraphsAtZero,
    "button",
  );
  groups["autoSwitchTheme"] = new SettingsGroup(
    "autoSwitchTheme",
    UpdateConfig.setAutoSwitchTheme,
    "button",
  );
  groups["randomTheme"] = new SettingsGroup(
    "randomTheme",
    UpdateConfig.setRandomTheme,
    "button",
  );
  groups["stopOnError"] = new SettingsGroup(
    "stopOnError",
    UpdateConfig.setStopOnError,
    "button",
    {
      setCallback: () => {
        groups["confidenceMode"]?.updateUI();
      },
    },
  );
  groups["soundVolume"] = new SettingsGroup(
    "soundVolume",
    UpdateConfig.setSoundVolume,
    "range",
  );
  groups["playTimeWarning"] = new SettingsGroup(
    "playTimeWarning",
    UpdateConfig.setPlayTimeWarning,
    "button",
    {
      setCallback: () => {
        if (Config.playTimeWarning !== "off") void Sound.playTimeWarning();
      },
    },
  );
  groups["playSoundOnError"] = new SettingsGroup(
    "playSoundOnError",
    UpdateConfig.setPlaySoundOnError,
    "button",
    {
      setCallback: () => {
        if (Config.playSoundOnError !== "off") void Sound.playError();
      },
    },
  );
  groups["playSoundOnClick"] = new SettingsGroup(
    "playSoundOnClick",
    UpdateConfig.setPlaySoundOnClick,
    "button",
    {
      setCallback: () => {
        if (Config.playSoundOnClick !== "off") void Sound.playClick("KeyQ");
      },
    },
  );
  groups["showAllLines"] = new SettingsGroup(
    "showAllLines",
    UpdateConfig.setShowAllLines,
    "button",
  );
  groups["paceCaret"] = new SettingsGroup(
    "paceCaret",
    UpdateConfig.setPaceCaret,
    "button",
  );
  groups["repeatedPace"] = new SettingsGroup(
    "repeatedPace",
    UpdateConfig.setRepeatedPace,
    "button",
  );
  groups["minWpm"] = new SettingsGroup(
    "minWpm",
    UpdateConfig.setMinWpm,
    "button",
  );
  groups["minAcc"] = new SettingsGroup(
    "minAcc",
    UpdateConfig.setMinAcc,
    "button",
  );
  groups["minBurst"] = new SettingsGroup(
    "minBurst",
    UpdateConfig.setMinBurst,
    "button",
  );
  groups["smoothLineScroll"] = new SettingsGroup(
    "smoothLineScroll",
    UpdateConfig.setSmoothLineScroll,
    "button",
  );
  groups["lazyMode"] = new SettingsGroup(
    "lazyMode",
    UpdateConfig.setLazyMode,
    "button",
  );
  groups["layout"] = new SettingsGroup(
    "layout",
    UpdateConfig.setLayout,
    "select",
  );
  groups["language"] = new SettingsGroup(
    "language",
    UpdateConfig.setLanguage,
    "select",
  );
  groups["fontSize"] = new SettingsGroup(
    "fontSize",
    UpdateConfig.setFontSize,
    "input",
    { validation: { schema: true, inputValueConvert: Number } },
  );
  groups["maxLineWidth"] = new SettingsGroup(
    "maxLineWidth",
    UpdateConfig.setMaxLineWidth,
    "input",
    { validation: { schema: true, inputValueConvert: Number } },
  );
  groups["caretStyle"] = new SettingsGroup(
    "caretStyle",
    UpdateConfig.setCaretStyle,
    "button",
  );
  groups["paceCaretStyle"] = new SettingsGroup(
    "paceCaretStyle",
    UpdateConfig.setPaceCaretStyle,
    "button",
  );
  groups["timerStyle"] = new SettingsGroup(
    "timerStyle",
    UpdateConfig.setTimerStyle,
    "button",
  );
  groups["liveSpeedStyle"] = new SettingsGroup(
    "liveSpeedStyle",
    UpdateConfig.setLiveSpeedStyle,
    "button",
  );
  groups["liveAccStyle"] = new SettingsGroup(
    "liveAccStyle",
    UpdateConfig.setLiveAccStyle,
    "button",
  );
  groups["liveBurstStyle"] = new SettingsGroup(
    "liveBurstStyle",
    UpdateConfig.setLiveBurstStyle,
    "button",
  );
  groups["highlightMode"] = new SettingsGroup(
    "highlightMode",
    UpdateConfig.setHighlightMode,
    "button",
  );
  groups["tapeMode"] = new SettingsGroup(
    "tapeMode",
    UpdateConfig.setTapeMode,
    "button",
  );
  groups["tapeMargin"] = new SettingsGroup(
    "tapeMargin",
    UpdateConfig.setTapeMargin,
    "input",
    { validation: { schema: true, inputValueConvert: Number } },
  );
  groups["timerOpacity"] = new SettingsGroup(
    "timerOpacity",
    UpdateConfig.setTimerOpacity,
    "button",
  );
  groups["timerColor"] = new SettingsGroup(
    "timerColor",
    UpdateConfig.setTimerColor,
    "button",
  );
  groups["fontFamily"] = new SettingsGroup(
    "fontFamily",
    UpdateConfig.setFontFamily,
    "button",
    {
      updateCallback: () => {
        const customButton = $(
          ".pageSettings .section[data-config-name='fontFamily'] .buttons button[data-config-value='custom']",
        );

        if (
          $(
            ".pageSettings .section[data-config-name='fontFamily'] .buttons .active",
          ).length === 0
        ) {
          customButton.addClass("active");
          customButton.text(`Custom (${Config.fontFamily.replace(/_/g, " ")})`);
        } else {
          customButton.text("Custom");
        }
      },
    },
  );
  groups["alwaysShowDecimalPlaces"] = new SettingsGroup(
    "alwaysShowDecimalPlaces",
    UpdateConfig.setAlwaysShowDecimalPlaces,
    "button",
  );
  groups["typingSpeedUnit"] = new SettingsGroup(
    "typingSpeedUnit",
    UpdateConfig.setTypingSpeedUnit,
    "button",
  );
  groups["customBackgroundSize"] = new SettingsGroup(
    "customBackgroundSize",
    UpdateConfig.setCustomBackgroundSize,
    "button",
  );
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
        layoutToOption,
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
    ".pageSettings .section[data-config-name='funbox'] .buttons",
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
        " ",
      )}</button>`;
    } else if (funbox.name === "upside_down") {
      funboxElHTML += `<button class="funbox" data-funbox-name="upside_down" data-config-value='${
        funbox.name
      }' aria-label="${
        funbox.description
      }" data-balloon-pos="up" data-balloon-length="fit" style="transform:scaleX(-1) scaleY(-1); z-index:1;">${funbox.name.replace(
        /_/g,
        " ",
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
        " ",
      )}</button>`;
    }
  }
  funboxEl.innerHTML = funboxElHTML;

  const fontsEl = document.querySelector(
    ".pageSettings .section[data-config-name='fontFamily'] .buttons",
  ) as HTMLDivElement;

  if (fontsEl.innerHTML === "") {
    let fontsElHTML = "";

    for (const name of Misc.typedKeys(Fonts).sort((a, b) =>
      (Fonts[a].display ?? a.replace(/_/g, " ")).localeCompare(
        Fonts[b].display ?? b.replace(/_/g, " "),
      ),
    )) {
      const font = Fonts[name];
      let fontFamily = name.replace(/_/g, " ");

      if (!font.systemFont) {
        fontFamily += " Preview";
      }
      const activeClass = Config.fontFamily === name ? " active" : "";
      const display = font.display ?? name.replace(/_/g, " ");

      fontsElHTML += `<button class="${activeClass}" style="font-family:'${fontFamily}'" data-config-value="${name}">${display}</button>`;
    }

    fontsElHTML +=
      '<button class="no-auto-handle" data-config-value="custom"">Custom</button>';

    fontsEl.innerHTML = fontsElHTML;
  }

  customLayoutFluidSelect = new SlimSelect({
    select:
      ".pageSettings .section[data-config-name='customLayoutfluid'] select",
    settings: { keepOrder: true, minSelected: 2 },
    events: {
      afterChange: (newVal): void => {
        const customLayoutfluid = newVal.map(
          (it) => it.value,
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
    settings: { minSelected: 2 },
    data: getLanguageDropdownData((language) =>
      Config.customPolyglot.includes(language),
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

  handleConfigInput({
    input: document.querySelector(
      ".pageSettings .section[data-config-name='minWpm'] input",
    ),
    configName: "minWpmCustomSpeed",
    validation: {
      schema: true,
      inputValueConvert: (it) =>
        getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
          new Number(it).valueOf(),
        ),
    },
  });

  handleConfigInput({
    input: document.querySelector(
      ".pageSettings .section[data-config-name='minAcc'] input",
    ),
    configName: "minAccCustom",
    validation: {
      schema: true,
      inputValueConvert: Number,
    },
  });

  handleConfigInput({
    input: document.querySelector(
      ".pageSettings .section[data-config-name='minBurst'] input",
    ),
    configName: "minBurstCustomSpeed",
    validation: {
      schema: true,
      inputValueConvert: (it) =>
        getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(
          new Number(it).valueOf(),
        ),
    },
  });

  handleConfigInput({
    input: document.querySelector(
      ".pageSettings .section[data-config-name='paceCaret'] input",
    ),
    configName: "paceCaretCustomSpeed",
    validation: {
      schema: true,
      inputValueConvert: Number,
    },
  });

  handleConfigInput({
    input: document.querySelector(
      ".pageSettings .section[data-config-name='customBackgroundSize'] input[type='text']",
    ),
    configName: "customBackground",
    validation: {
      schema: true,
      resetIfEmpty: false,
    },
  });

  setEventDisabled(true);

  await initGroups();
  await ThemePicker.fillCustomButtons();

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
    `.pageSettings .section[data-config-name='funbox'] button`,
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

export async function updateFilterSectionVisibility(): Promise<void> {
  const hasBackgroundUrl =
    Config.customBackground !== "" ||
    (await FileStorage.hasFile("LocalBackgroundFile"));
  const isImageVisible = $(".customBackground img").is(":visible");

  if (hasBackgroundUrl && isImageVisible) {
    $(
      ".pageSettings .section[data-config-name='customBackgroundFilter']",
    ).removeClass("hidden");
  } else {
    $(
      ".pageSettings .section[data-config-name='customBackgroundFilter']",
    ).addClass("hidden");
  }
}

export async function update(
  options: {
    eventKey?: ConfigEvent.ConfigEventKey;
  } = {},
): Promise<void> {
  if (ActivePage.get() !== "settings") {
    return;
  }

  if (Config.showKeyTips) {
    $(".pageSettings .tip").removeClass("hidden");
  } else {
    $(".pageSettings .tip").addClass("hidden");
  }

  for (const group of Object.values(groups)) {
    if ("updateUI" in group) {
      group.updateUI();
    }
  }

  refreshTagsSettingsSection();
  refreshPresetsSettingsSection();
  // LanguagePicker.setActiveGroup(); Shifted from grouped btns to combo-box
  setActiveFunboxButton();
  await Misc.sleep(0);
  ThemePicker.updateActiveTab();
  ThemePicker.setCustomInputs(true);
  await CustomBackgroundPicker.updateUI();
  await updateFilterSectionVisibility();
  await CustomFontPicker.updateUI();
  FpsLimitSection.update();

  const setInputValue = (
    key: ConfigKey,
    query: string,
    value: string | number,
  ): void => {
    if (options.eventKey === undefined || options.eventKey === key) {
      const element = document.querySelector(query) as HTMLInputElement;
      if (element === null) {
        throw new Error("Unknown input element " + query);
      }

      element.value = new String(value).toString();
      element.dispatchEvent(new Event("input"));
    }
  };

  setInputValue(
    "paceCaret",
    ".pageSettings .section[data-config-name='paceCaret'] input.customPaceCaretSpeed",
    getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(
      Config.paceCaretCustomSpeed,
    ),
  );

  setInputValue(
    "minWpmCustomSpeed",
    ".pageSettings .section[data-config-name='minWpm'] input.customMinWpmSpeed",
    getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(
      Config.minWpmCustomSpeed,
    ),
  );

  setInputValue(
    "minAccCustom",
    ".pageSettings .section[data-config-name='minAcc'] input.customMinAcc",
    Config.minAccCustom,
  );

  setInputValue(
    "minBurstCustomSpeed",
    ".pageSettings .section[data-config-name='minBurst'] input.customMinBurst",
    getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(
      Config.minBurstCustomSpeed,
    ),
  );

  if (Config.autoSwitchTheme) {
    $(
      ".pageSettings .section[data-config-name='autoSwitchThemeInputs']",
    ).removeClass("hidden");
  } else {
    $(
      ".pageSettings .section[data-config-name='autoSwitchThemeInputs']",
    ).addClass("hidden");
  }

  setInputValue(
    "fontSize",
    ".pageSettings .section[data-config-name='fontSize'] input",
    Config.fontSize,
  );

  setInputValue(
    "maxLineWidth",
    ".pageSettings .section[data-config-name='maxLineWidth'] input",
    Config.maxLineWidth,
  );

  setInputValue(
    "keymapSize",
    ".pageSettings .section[data-config-name='keymapSize'] input",
    Config.keymapSize,
  );

  setInputValue(
    "tapeMargin",
    ".pageSettings .section[data-config-name='tapeMargin'] input",
    Config.tapeMargin,
  );

  setInputValue(
    "customBackground",
    ".pageSettings .section[data-config-name='customBackgroundSize'] input[type='text']",
    Config.customBackground,
  );

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
      Config.customLayoutfluid,
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
      Config.customPolyglot,
    )
  ) {
    customPolyglotSelect.setSelected(Config.customPolyglot);
  }
}
function toggleSettingsGroup(groupName: string): void {
  //The highlight is repeated/broken when toggling the group
  handleHighlightSection(undefined);

  const groupEl = $(`.pageSettings .settingsGroup.${groupName}`);
  groupEl.stop(true, true).slideToggle(250).toggleClass("slideup");
  if (groupEl.hasClass("slideup")) {
    $(`.pageSettings .sectionGroupTitle[group=${groupName}]`).addClass(
      "rotateIcon",
    );
  } else {
    $(`.pageSettings .sectionGroupTitle[group=${groupName}]`).removeClass(
      "rotateIcon",
    );
  }
}

//funbox
$(".pageSettings .section[data-config-name='funbox'] .buttons").on(
  "click",
  "button",
  (e) => {
    const funbox = $(e.currentTarget).attr("data-config-value") as FunboxName;
    Funbox.toggleFunbox(funbox);
    setActiveFunboxButton();
  },
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
  },
);

$(".pageSettings .section.presets").on(
  "click",
  ".presetsList .preset .presetButton",
  async (e) => {
    const target = e.currentTarget as HTMLElement;
    const presetid = $(target).parent(".preset").attr("data-id") as string;
    await PresetController.apply(presetid);
    void update();
  },
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
    },
  );
});

$(".pageSettings .sectionGroupTitle").on("click", (e) => {
  toggleSettingsGroup($(e.currentTarget).attr("group") as string);
});

$(
  ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton button.save",
).on("click", () => {
  const didConfigSave = UpdateConfig.setKeymapSize(
    parseFloat(
      $(
        ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
      ).val() as string,
    ),
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

$(
  ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
).on("focusout", () => {
  const didConfigSave = UpdateConfig.setKeymapSize(
    parseFloat(
      $(
        ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
      ).val() as string,
    ),
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

$(
  ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
).on("keypress", (e) => {
  if (e.key === "Enter") {
    const didConfigSave = UpdateConfig.setKeymapSize(
      parseFloat(
        $(
          ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
        ).val() as string,
      ),
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
    "slideup",
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
  isActive: (val: Language) => boolean,
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
      }) as Optgroup,
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
  isActive: (theme: Theme) => boolean,
): DataArrayPartial {
  return ThemesList.map((theme) => ({
    value: theme.name,
    text: theme.name.replace(/_/g, " "),
    selected: isActive(theme),
  }));
}

function handleHighlightSection(highlight: Highlight | undefined): void {
  if (highlight === undefined) {
    const element = document.querySelector(".section.highlight");
    if (element !== null) {
      element.classList.remove("highlight");
    }
    return;
  }

  const element = document.querySelector(
    `[data-config-name="${highlight}"] .groupTitle,[data-section-id="${highlight}"] .groupTitle`,
  );

  if (element !== null) {
    setTimeout(() => {
      element.scrollIntoView({ block: "center", behavior: "auto" });
      element.parentElement?.classList.remove("highlight");
      element.parentElement?.classList.add("highlight");
    }, 250);
  }
}

$(".pageSettings .section .groupTitle button").on("click", (e) => {
  const section = e.target.parentElement?.parentElement;
  const configName = (section?.dataset?.["configName"] ??
    section?.dataset?.["sectionId"]) as Highlight | undefined;
  if (configName === undefined) {
    return;
  }

  page.setUrlParams({ highlight: configName });

  navigator.clipboard
    .writeText(window.location.toString())
    .then(() => {
      Notifications.add("Link copied to clipboard", 1);
    })
    .catch((e: unknown) => {
      const msg = Misc.createErrorMessage(e, "Failed to copy to clipboard");
      Notifications.add(msg, -1);
    });
});

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "fullConfigChange") setEventDisabled(true);
  if (eventKey === "fullConfigChangeFinished") setEventDisabled(false);
  if (eventKey === "themeLight") {
    $(
      `.pageSettings .section[data-config-name='autoSwitchThemeInputs'] select.light option[value="${eventValue}"]`,
    ).attr("selected", "true");
  } else if (eventKey === "themeDark") {
    $(
      `.pageSettings .section[data-config-name='autoSwitchThemeInputs'] select.dark option[value="${eventValue}"]`,
    ).attr("selected", "true");
  }
  //make sure the page doesnt update a billion times when applying a preset/config at once
  if (configEventDisabled || eventKey === "saveToLocalStorage") return;
  if (ActivePage.get() === "settings" && eventKey !== "theme") {
    void (eventKey === "customBackground"
      ? updateFilterSectionVisibility()
      : update({ eventKey }));
  }
});

AuthEvent.subscribe((event) => {
  if (event.type === "authStateChanged") {
    if (event.data.isUserSignedIn) {
      showAccountSection();
    } else {
      hideAccountSection();
    }
  }
});

export const page = new PageWithUrlParams({
  id: "settings",
  element: $(".page.pageSettings"),
  path: "/settings",
  urlParamsSchema: StateSchema,
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageSettings");
  },
  beforeShow: async (options): Promise<void> => {
    Skeleton.append("pageSettings", "main");
    await UpdateConfig.loadPromise;
    await fillSettingsPage();
    await update();
    // theme UI updates manually to avoid duplication
    await ThemePicker.updateThemeUI();

    handleHighlightSection(options.urlParams?.highlight);
  },
});

$(async () => {
  Skeleton.save("pageSettings");
});
