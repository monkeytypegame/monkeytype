import SettingsGroup from "../elements/settings/settings-group";
import Config, { setConfig, configLoadPromise } from "../config";
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
import { getActivePage } from "../signals/core";
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
import { ThemesList, ThemeWithName } from "../constants/themes";
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
import { qs, qsa, qsr, onDOMReady } from "../utils/dom";
import { showPopup } from "../modals/simple-modals-base";

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
  groups["smoothCaret"] = new SettingsGroup("smoothCaret", "button");
  groups["codeUnindentOnBackspace"] = new SettingsGroup(
    "codeUnindentOnBackspace",
    "button",
  );
  groups["difficulty"] = new SettingsGroup("difficulty", "button");
  groups["quickRestart"] = new SettingsGroup("quickRestart", "button");
  groups["resultSaving"] = new SettingsGroup("resultSaving", "button");
  groups["showAverage"] = new SettingsGroup("showAverage", "button");
  groups["keymapMode"] = new SettingsGroup("keymapMode", "button", {
    updateCallback: () => {
      if (Config.keymapMode === "off") {
        qs(".pageSettings .section[data-config-name='keymapStyle']")?.hide();
        qs(".pageSettings .section[data-config-name='keymapLayout']")?.hide();
        qs(
          ".pageSettings .section[data-config-name='keymapLegendStyle']",
        )?.hide();
        qs(
          ".pageSettings .section[data-config-name='keymapShowTopRow']",
        )?.hide();
        qs(".pageSettings .section[data-config-name='keymapSize']")?.hide();
      } else {
        qs(".pageSettings .section[data-config-name='keymapStyle']")?.show();
        qs(".pageSettings .section[data-config-name='keymapLayout']")?.show();
        qs(
          ".pageSettings .section[data-config-name='keymapLegendStyle']",
        )?.show();
        qs(
          ".pageSettings .section[data-config-name='keymapShowTopRow']",
        )?.show();
        qs(".pageSettings .section[data-config-name='keymapSize']")?.show();
      }
    },
  });
  groups["keymapStyle"] = new SettingsGroup("keymapStyle", "button");
  groups["keymapLayout"] = new SettingsGroup("keymapLayout", "select");
  groups["keymapLegendStyle"] = new SettingsGroup(
    "keymapLegendStyle",
    "button",
  );
  groups["keymapShowTopRow"] = new SettingsGroup("keymapShowTopRow", "button");
  groups["keymapSize"] = new SettingsGroup("keymapSize", "range");
  groups["showKeyTips"] = new SettingsGroup("showKeyTips", "button");
  groups["freedomMode"] = new SettingsGroup("freedomMode", "button", {
    setCallback: () => {
      groups["confidenceMode"]?.updateUI();
    },
  });
  groups["strictSpace"] = new SettingsGroup("strictSpace", "button");
  groups["oppositeShiftMode"] = new SettingsGroup(
    "oppositeShiftMode",
    "button",
  );
  groups["confidenceMode"] = new SettingsGroup("confidenceMode", "button", {
    setCallback: () => {
      groups["freedomMode"]?.updateUI();
      groups["stopOnError"]?.updateUI();
    },
  });
  groups["indicateTypos"] = new SettingsGroup("indicateTypos", "button");
  groups["compositionDisplay"] = new SettingsGroup(
    "compositionDisplay",
    "button",
  );
  groups["hideExtraLetters"] = new SettingsGroup("hideExtraLetters", "button");
  groups["blindMode"] = new SettingsGroup("blindMode", "button");
  groups["quickEnd"] = new SettingsGroup("quickEnd", "button");
  groups["repeatQuotes"] = new SettingsGroup("repeatQuotes", "button");
  groups["ads"] = new SettingsGroup("ads", "button");
  groups["alwaysShowWordsHistory"] = new SettingsGroup(
    "alwaysShowWordsHistory",
    "button",
  );
  groups["britishEnglish"] = new SettingsGroup("britishEnglish", "button");
  groups["singleListCommandLine"] = new SettingsGroup(
    "singleListCommandLine",
    "button",
  );
  groups["capsLockWarning"] = new SettingsGroup("capsLockWarning", "button");
  groups["flipTestColors"] = new SettingsGroup("flipTestColors", "button");
  groups["showOutOfFocusWarning"] = new SettingsGroup(
    "showOutOfFocusWarning",
    "button",
  );
  groups["colorfulMode"] = new SettingsGroup("colorfulMode", "button");
  groups["startGraphsAtZero"] = new SettingsGroup(
    "startGraphsAtZero",
    "button",
  );
  groups["autoSwitchTheme"] = new SettingsGroup("autoSwitchTheme", "button");
  groups["randomTheme"] = new SettingsGroup("randomTheme", "button");
  groups["stopOnError"] = new SettingsGroup("stopOnError", "button", {
    setCallback: () => {
      groups["confidenceMode"]?.updateUI();
    },
  });
  groups["soundVolume"] = new SettingsGroup("soundVolume", "range");
  groups["playTimeWarning"] = new SettingsGroup("playTimeWarning", "button", {
    setCallback: () => {
      if (Config.playTimeWarning !== "off") void Sound.playTimeWarning();
    },
  });
  groups["playSoundOnError"] = new SettingsGroup("playSoundOnError", "button", {
    setCallback: () => {
      if (Config.playSoundOnError !== "off") void Sound.playError();
    },
  });
  groups["playSoundOnClick"] = new SettingsGroup("playSoundOnClick", "button", {
    setCallback: () => {
      if (Config.playSoundOnClick !== "off") void Sound.playClick("KeyQ");
    },
  });
  groups["showAllLines"] = new SettingsGroup("showAllLines", "button");
  groups["paceCaret"] = new SettingsGroup("paceCaret", "button");
  groups["repeatedPace"] = new SettingsGroup("repeatedPace", "button");
  groups["minWpm"] = new SettingsGroup("minWpm", "button");
  groups["minAcc"] = new SettingsGroup("minAcc", "button");
  groups["minBurst"] = new SettingsGroup("minBurst", "button");
  groups["smoothLineScroll"] = new SettingsGroup("smoothLineScroll", "button");
  groups["lazyMode"] = new SettingsGroup("lazyMode", "button");
  groups["layout"] = new SettingsGroup("layout", "select");
  groups["language"] = new SettingsGroup("language", "select");
  groups["fontSize"] = new SettingsGroup("fontSize", "input", {
    validation: { schema: true, inputValueConvert: Number },
  });
  groups["maxLineWidth"] = new SettingsGroup("maxLineWidth", "input", {
    validation: { schema: true, inputValueConvert: Number },
  });
  groups["caretStyle"] = new SettingsGroup("caretStyle", "button");
  groups["paceCaretStyle"] = new SettingsGroup("paceCaretStyle", "button");
  groups["timerStyle"] = new SettingsGroup("timerStyle", "button");
  groups["liveSpeedStyle"] = new SettingsGroup("liveSpeedStyle", "button");
  groups["liveAccStyle"] = new SettingsGroup("liveAccStyle", "button");
  groups["liveBurstStyle"] = new SettingsGroup("liveBurstStyle", "button");
  groups["highlightMode"] = new SettingsGroup("highlightMode", "button");
  groups["typedEffect"] = new SettingsGroup("typedEffect", "button");
  groups["tapeMode"] = new SettingsGroup("tapeMode", "button");
  groups["tapeMargin"] = new SettingsGroup("tapeMargin", "input", {
    validation: { schema: true, inputValueConvert: Number },
  });
  groups["timerOpacity"] = new SettingsGroup("timerOpacity", "button");
  groups["timerColor"] = new SettingsGroup("timerColor", "button");
  groups["fontFamily"] = new SettingsGroup("fontFamily", "button", {
    updateCallback: () => {
      const customButton = qs(
        ".pageSettings .section[data-config-name='fontFamily'] .buttons button[data-config-value='custom']",
      );

      if (
        qsa(
          ".pageSettings .section[data-config-name='fontFamily'] .buttons .active",
        ).length === 0
      ) {
        customButton?.addClass("active");
        customButton?.setText(
          `Custom (${Config.fontFamily.replace(/_/g, " ")})`,
        );
      } else {
        customButton?.setText("Custom");
      }
    },
  });
  groups["alwaysShowDecimalPlaces"] = new SettingsGroup(
    "alwaysShowDecimalPlaces",
    "button",
  );
  groups["typingSpeedUnit"] = new SettingsGroup("typingSpeedUnit", "button");
  groups["customBackgroundSize"] = new SettingsGroup(
    "customBackgroundSize",
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
        setConfig("themeLight", newVal[0]?.value as ThemeName);
      },
    },
  });

  new SlimSelect({
    select:
      ".pageSettings .section[data-config-name='autoSwitchThemeInputs'] select.dark",
    data: getThemeDropdownData((theme) => theme.name === Config.themeDark),
    events: {
      afterChange: (newVal): void => {
        setConfig("themeDark", newVal[0]?.value as ThemeName);
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
          void setConfig("customLayoutfluid", customLayoutfluid);
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
          void setConfig("customPolyglot", customPolyglot);
        }
      },
    },
  });

  handleConfigInput({
    input: qsr(".pageSettings .section[data-config-name='minWpm'] input"),
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
    input: qsr(".pageSettings .section[data-config-name='minAcc'] input"),
    configName: "minAccCustom",
    validation: {
      schema: true,
      inputValueConvert: Number,
    },
  });

  handleConfigInput({
    input: qsr(".pageSettings .section[data-config-name='minBurst'] input"),
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
    input: qsr(".pageSettings .section[data-config-name='paceCaret'] input"),
    configName: "paceCaretCustomSpeed",
    validation: {
      schema: true,
      inputValueConvert: Number,
    },
  });

  handleConfigInput({
    input: qsr(
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
  qsa(`.pageSettings .section.needsAccount`)?.hide();
}

function showAccountSection(): void {
  qsa(`.pageSettings .section.needsAccount`)?.show();
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
    const tagsEl = qs(".pageSettings .section.tags .tagsList")?.empty();
    DB.getSnapshot()?.tags?.forEach((tag) => {
      // let tagPbString = "No PB found";
      // if (tag.pb !== undefined && tag.pb > 0) {
      //   tagPbString = `PB: ${tag.pb}`;
      // }
      tagsEl?.appendHtml(`

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
    qs(".pageSettings .section.tags")?.show();
  } else {
    qs(".pageSettings .section.tags")?.hide();
  }
}

function refreshPresetsSettingsSection(): void {
  if (isAuthenticated() && DB.getSnapshot()) {
    const presetsEl = qs(
      ".pageSettings .section.presets .presetsList",
    )?.empty();
    DB.getSnapshot()?.presets?.forEach((preset: SnapshotPreset) => {
      presetsEl?.appendHtml(`
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
    qs(".pageSettings .section.presets")?.show();
  } else {
    qs(".pageSettings .section.presets")?.hide();
  }
}

export async function updateFilterSectionVisibility(): Promise<void> {
  const hasBackgroundUrl =
    Config.customBackground !== "" ||
    (await FileStorage.hasFile("LocalBackgroundFile"));
  const isImageVisible = qs(".customBackground img")?.isVisible();

  if (hasBackgroundUrl && isImageVisible) {
    qs(
      ".pageSettings .section[data-config-name='customBackgroundFilter']",
    )?.show();
  } else {
    qs(
      ".pageSettings .section[data-config-name='customBackgroundFilter']",
    )?.hide();
  }
}

export async function update(
  options: {
    eventKey?: ConfigEvent.ConfigEventKey;
  } = {},
): Promise<void> {
  if (getActivePage() !== "settings") {
    return;
  }

  if (Config.showKeyTips) {
    qs(".pageSettings .tip")?.show();
  } else {
    qs(".pageSettings .tip")?.hide();
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
  ThemePicker.setCustomInputs();
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
    qs(
      ".pageSettings .section[data-config-name='autoSwitchThemeInputs']",
    )?.show();
  } else {
    qs(
      ".pageSettings .section[data-config-name='autoSwitchThemeInputs']",
    )?.hide();
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
  qs(".pageSettings .tip")?.setHtml(`
    tip: You can also change all these settings quickly using the
    command line (<kbd>${commandKey}</kbd> or <kbd>${modifierKey}</kbd> + <kbd>shift</kbd> + <kbd>p</kbd>)`);

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

  const groupEl = qs(`.pageSettings .settingsGroup.${groupName}`);
  if (!groupEl?.hasClass("slideup")) {
    void groupEl?.slideUp(250, {
      hide: false,
    });
    groupEl?.addClass("slideup");
    qs(`.pageSettings .sectionGroupTitle[group=${groupName}]`)?.addClass(
      "rotateIcon",
    );
  } else {
    void groupEl?.slideDown(250);
    groupEl?.removeClass("slideup");
    qs(`.pageSettings .sectionGroupTitle[group=${groupName}]`)?.removeClass(
      "rotateIcon",
    );
  }
}

//funbox
qs(".pageSettings .section[data-config-name='funbox'] .buttons")?.onChild(
  "click",
  "button",
  (e) => {
    const target = e.childTarget as HTMLElement;
    const funbox = target?.getAttribute("data-config-value") as FunboxName;
    Funbox.toggleFunbox(funbox);
    setActiveFunboxButton();
  },
);

//tags
qs(".pageSettings .section.tags")?.onChild(
  "click",
  ".tagsList .tag .tagButton",
  (e) => {
    const target = e.childTarget as HTMLElement;
    const tagid = target.parentElement?.getAttribute("data-id") as string;
    TagController.toggle(tagid);
    target.classList.toggle("active");
  },
);

qs(".pageSettings .section.presets")?.onChild(
  "click",
  ".presetsList .preset .presetButton",
  async (e) => {
    const target = e.childTarget as HTMLElement;
    const presetid = target.parentElement?.getAttribute("data-id") as string;
    await PresetController.apply(presetid);
    void update();
  },
);

qs("#importSettingsButton")?.on("click", () => {
  ImportExportSettingsModal.show("import");
});

qs("#exportSettingsButton")?.on("click", () => {
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

qsa(".pageSettings .sectionGroupTitle")?.on("click", (e) => {
  const target = e.currentTarget as HTMLElement;
  toggleSettingsGroup(target.getAttribute("group") as string);
});

qs(
  ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton button.save",
)?.on("click", () => {
  const didConfigSave = setConfig(
    "keymapSize",
    parseFloat(
      qs<HTMLInputElement>(
        ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
      )?.getValue() as string,
    ),
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

qs(
  ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
)?.on("focusout", () => {
  const didConfigSave = setConfig(
    "keymapSize",
    parseFloat(
      qs<HTMLInputElement>(
        ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
      )?.getValue() as string,
    ),
  );
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
});

qs(
  ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
)?.on("keypress", (e) => {
  if (e.key === "Enter") {
    const didConfigSave = setConfig(
      "keymapSize",
      parseFloat(
        qs<HTMLInputElement>(
          ".pageSettings .section[data-config-name='keymapSize'] .inputAndButton input",
        )?.getValue() as string,
      ),
    );
    if (didConfigSave) {
      Notifications.add("Saved", 1, {
        duration: 1,
      });
    }
  }
});

qsa(".pageSettings .quickNav .links a")?.on("click", (e) => {
  const target = e.currentTarget as HTMLAnchorElement;
  const href = target.getAttribute("href") ?? "";
  if (!href.startsWith("#group_")) return;
  const settingsGroup = href.slice("#group_".length);
  if (settingsGroup === "") return;
  const isClosed = qs(
    `.pageSettings .settingsGroup.${settingsGroup}`,
  )?.hasClass("slideup");
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
  isActive: (theme: ThemeWithName) => boolean,
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

qsa(".pageSettings .section .groupTitle button")?.on("click", (e) => {
  const target = e.currentTarget as HTMLElement;
  const section = target.parentElement?.parentElement;
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

qs(".pageSettings")?.onChild(
  "click",
  ".section.themes .customTheme .delButton",
  (e) => {
    const parentElement = (e.childTarget as HTMLElement | null)?.closest(
      ".customTheme.button",
    );
    const customThemeId = parentElement?.getAttribute(
      "customThemeId",
    ) as string;
    showPopup("deleteCustomTheme", [customThemeId]);
  },
);

qs(".pageSettings")?.onChild(
  "click",
  ".section.themes .customTheme .editButton",
  (e) => {
    const parentElement = (e.childTarget as HTMLElement | null)?.closest(
      ".customTheme.button",
    );
    const customThemeId = parentElement?.getAttribute(
      "customThemeId",
    ) as string;
    showPopup("updateCustomTheme", [customThemeId], {
      focusFirstInput: "focusAndSelect",
    });
  },
);

qs(".pageSettings")?.onChild(
  "click",
  ".section[data-config-name='fontFamily'] button[data-config-value='custom']",
  () => {
    showPopup("applyCustomFont");
  },
);

qs(".pageSettings #resetSettingsButton")?.on("click", () => {
  showPopup("resetSettings");
});

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "fullConfigChange") setEventDisabled(true);
  if (key === "fullConfigChangeFinished") setEventDisabled(false);
  if (key === "themeLight") {
    qs(
      `.pageSettings .section[data-config-name='autoSwitchThemeInputs'] select.light option[value="${newValue}"]`,
    )?.setAttribute("selected", "true");
  } else if (key === "themeDark") {
    qs(
      `.pageSettings .section[data-config-name='autoSwitchThemeInputs'] select.dark option[value="${newValue}"]`,
    )?.setAttribute("selected", "true");
  }
  //make sure the page doesnt update a billion times when applying a preset/config at once
  if (configEventDisabled) return;
  if (getActivePage() === "settings" && key !== "theme") {
    void (key === "customBackground"
      ? updateFilterSectionVisibility()
      : update({ eventKey: key }));
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
  element: qsr(".page.pageSettings"),
  path: "/settings",
  urlParamsSchema: StateSchema,
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageSettings");
  },
  beforeShow: async (options): Promise<void> => {
    Skeleton.append("pageSettings", "main");
    await configLoadPromise;
    await fillSettingsPage();
    await update();
    // theme UI updates manually to avoid duplication
    await ThemePicker.updateThemeUI();

    handleHighlightSection(options.urlParams?.highlight);
  },
});

onDOMReady(async () => {
  Skeleton.save("pageSettings");
});
