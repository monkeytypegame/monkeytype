// @ts-ignore
import SettingsGroup from "../settings/settings-group";
// @ts-ignore
import Config, * as UpdateConfig from "../config";
// @ts-ignore
import * as Sound from "../controllers/sound-controller";
// @ts-ignore
import * as Misc from "../misc";
// @ts-ignore
import layouts from "../test/layouts";
// @ts-ignore
import * as LanguagePicker from "../settings/language-picker";
// @ts-ignore
import * as DB from "../db";
// @ts-ignore
import * as Funbox from "../test/funbox";
// @ts-ignore
import * as TagController from "../controllers/tag-controller";
// @ts-ignore
import * as PresetController from "../controllers/preset-controller";
// @ts-ignore
import * as ThemePicker from "../settings/theme-picker";
import * as Notifications from "../elements/notifications";
import * as ImportExportSettingsPopup from "../popups/import-export-settings-popup";
import * as CustomThemePopup from "../popups/custom-theme-popup";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";
import Page from "./page";
import * as Types from "../types/interfaces";

//todo remove once settings group is converted to ts
type Group = {
  configName: string;
  configFunction: () => void;
  mode: string;
  setCallback: () => void;
  updateCallback: () => void;
  updateInput: () => void;
  setValue: (string: string) => void;
};

type Groups = {
  [key: string]: Group;
};

export const groups: Groups = {};
async function initGroups(): Promise<void> {
  await UpdateConfig.loadPromise;
  groups.smoothCaret = new SettingsGroup(
    "smoothCaret",
    UpdateConfig.setSmoothCaret,
    "button"
  );
  groups.difficulty = new SettingsGroup(
    "difficulty",
    UpdateConfig.setDifficulty,
    "button"
  );
  groups.quickTab = new SettingsGroup(
    "quickTab",
    UpdateConfig.setQuickTabMode,
    "button"
  );
  groups.showLiveWpm = new SettingsGroup(
    "showLiveWpm",
    UpdateConfig.setShowLiveWpm,
    "button",
    () => {
      groups.keymapMode.updateInput();
    }
  );
  groups.showLiveAcc = new SettingsGroup(
    "showLiveAcc",
    UpdateConfig.setShowLiveAcc,
    "button"
  );
  groups.showLiveBurst = new SettingsGroup(
    "showLiveBurst",
    UpdateConfig.setShowLiveBurst,
    "button"
  );
  groups.showTimerProgress = new SettingsGroup(
    "showTimerProgress",
    UpdateConfig.setShowTimerProgress,
    "button"
  );
  groups.keymapMode = new SettingsGroup(
    "keymapMode",
    UpdateConfig.setKeymapMode,
    "button",
    () => {
      groups.showLiveWpm.updateInput();
    },
    () => {
      if (Config.keymapMode === "off") {
        $(".pageSettings .section.keymapStyle").addClass("hidden");
        $(".pageSettings .section.keymapLayout").addClass("hidden");
        $(".pageSettings .section.keymapLegendStyle").addClass("hidden");
      } else {
        $(".pageSettings .section.keymapStyle").removeClass("hidden");
        $(".pageSettings .section.keymapLayout").removeClass("hidden");
        $(".pageSettings .section.keymapLegendStyle").removeClass("hidden");
      }
    }
  );
  groups.keymapMatrix = new SettingsGroup(
    "keymapStyle",
    UpdateConfig.setKeymapStyle,
    "button"
  );
  groups.keymapLayout = new SettingsGroup(
    "keymapLayout",
    UpdateConfig.setKeymapLayout,
    "select"
  );
  groups.keymapLegendStyle = new SettingsGroup(
    "keymapLegendStyle",
    UpdateConfig.setKeymapLegendStyle,
    "button"
  );
  groups.showKeyTips = new SettingsGroup(
    "showKeyTips",
    UpdateConfig.setKeyTips,
    "button",
    null,
    () => {
      if (Config.showKeyTips) {
        $(".pageSettings .tip").removeClass("hidden");
      } else {
        $(".pageSettings .tip").addClass("hidden");
      }
    }
  );
  groups.freedomMode = new SettingsGroup(
    "freedomMode",
    UpdateConfig.setFreedomMode,
    "button",
    () => {
      groups.confidenceMode.updateInput();
    }
  );
  groups.strictSpace = new SettingsGroup(
    "strictSpace",
    UpdateConfig.setStrictSpace,
    "button"
  );
  groups.oppositeShiftMode = new SettingsGroup(
    "oppositeShiftMode",
    UpdateConfig.setOppositeShiftMode,
    "button"
  );
  groups.confidenceMode = new SettingsGroup(
    "confidenceMode",
    UpdateConfig.setConfidenceMode,
    "button",
    () => {
      groups.freedomMode.updateInput();
      groups.stopOnError.updateInput();
    }
  );
  groups.indicateTypos = new SettingsGroup(
    "indicateTypos",
    UpdateConfig.setIndicateTypos,
    "button"
  );
  groups.hideExtraLetters = new SettingsGroup(
    "hideExtraLetters",
    UpdateConfig.setHideExtraLetters,
    "button"
  );
  groups.blindMode = new SettingsGroup(
    "blindMode",
    UpdateConfig.setBlindMode,
    "button"
  );
  groups.quickEnd = new SettingsGroup(
    "quickEnd",
    UpdateConfig.setQuickEnd,
    "button"
  );
  groups.repeatQuotes = new SettingsGroup(
    "repeatQuotes",
    UpdateConfig.setRepeatQuotes,
    "button"
  );
  groups.enableAds = new SettingsGroup(
    "enableAds",
    UpdateConfig.setEnableAds,
    "button"
  );
  groups.alwaysShowWordsHistory = new SettingsGroup(
    "alwaysShowWordsHistory",
    UpdateConfig.setAlwaysShowWordsHistory,
    "button"
  );
  groups.britishEnglish = new SettingsGroup(
    "britishEnglish",
    UpdateConfig.setBritishEnglish,
    "button"
  );
  groups.singleListCommandLine = new SettingsGroup(
    "singleListCommandLine",
    UpdateConfig.setSingleListCommandLine,
    "button"
  );
  groups.capsLockWarning = new SettingsGroup(
    "capsLockWarning",
    UpdateConfig.setCapsLockWarning,
    "button"
  );
  groups.flipTestColors = new SettingsGroup(
    "flipTestColors",
    UpdateConfig.setFlipTestColors,
    "button"
  );
  groups.swapEscAndTab = new SettingsGroup(
    "swapEscAndTab",
    UpdateConfig.setSwapEscAndTab,
    "button"
  );
  groups.showOutOfFocusWarning = new SettingsGroup(
    "showOutOfFocusWarning",
    UpdateConfig.setShowOutOfFocusWarning,
    "button"
  );
  groups.colorfulMode = new SettingsGroup(
    "colorfulMode",
    UpdateConfig.setColorfulMode,
    "button"
  );
  groups.startGraphsAtZero = new SettingsGroup(
    "startGraphsAtZero",
    UpdateConfig.setStartGraphsAtZero,
    "button"
  );
  groups.randomTheme = new SettingsGroup(
    "randomTheme",
    UpdateConfig.setRandomTheme,
    "button"
  );
  groups.stopOnError = new SettingsGroup(
    "stopOnError",
    UpdateConfig.setStopOnError,
    "button",
    () => {
      groups.confidenceMode.updateInput();
    }
  );
  groups.soundVolume = new SettingsGroup(
    "soundVolume",
    UpdateConfig.setSoundVolume,
    "button"
  );
  groups.playSoundOnError = new SettingsGroup(
    "playSoundOnError",
    UpdateConfig.setPlaySoundOnError,
    "button",
    () => {
      if (Config.playSoundOnError) Sound.playError();
    }
  );
  groups.playSoundOnClick = new SettingsGroup(
    "playSoundOnClick",
    UpdateConfig.setPlaySoundOnClick,
    "button",
    () => {
      if (Config.playSoundOnClick !== "off")
        Sound.playClick(Config.playSoundOnClick);
    }
  );
  groups.showAllLines = new SettingsGroup(
    "showAllLines",
    UpdateConfig.setShowAllLines,
    "button"
  );
  groups.paceCaret = new SettingsGroup(
    "paceCaret",
    UpdateConfig.setPaceCaret,
    "button"
  );
  groups.repeatedPace = new SettingsGroup(
    "repeatedPace",
    UpdateConfig.setRepeatedPace,
    "button"
  );
  groups.minWpm = new SettingsGroup("minWpm", UpdateConfig.setMinWpm, "button");
  groups.minAcc = new SettingsGroup("minAcc", UpdateConfig.setMinAcc, "button");
  groups.minBurst = new SettingsGroup(
    "minBurst",
    UpdateConfig.setMinBurst,
    "button"
  );
  groups.smoothLineScroll = new SettingsGroup(
    "smoothLineScroll",
    UpdateConfig.setSmoothLineScroll,
    "button"
  );
  groups.lazyMode = new SettingsGroup(
    "lazyMode",
    UpdateConfig.setLazyMode,
    "button"
  );
  groups.layout = new SettingsGroup("layout", UpdateConfig.setLayout, "select");
  groups.language = new SettingsGroup(
    "language",
    UpdateConfig.setLanguage,
    "select"
  );
  groups.fontSize = new SettingsGroup(
    "fontSize",
    UpdateConfig.setFontSize,
    "button"
  );
  groups.pageWidth = new SettingsGroup(
    "pageWidth",
    UpdateConfig.setPageWidth,
    "button"
  );
  groups.caretStyle = new SettingsGroup(
    "caretStyle",
    UpdateConfig.setCaretStyle,
    "button"
  );
  groups.paceCaretStyle = new SettingsGroup(
    "paceCaretStyle",
    UpdateConfig.setPaceCaretStyle,
    "button"
  );
  groups.timerStyle = new SettingsGroup(
    "timerStyle",
    UpdateConfig.setTimerStyle,
    "button"
  );
  groups.highlighteMode = new SettingsGroup(
    "highlightMode",
    UpdateConfig.setHighlightMode,
    "button"
  );
  groups.timerOpacity = new SettingsGroup(
    "timerOpacity",
    UpdateConfig.setTimerOpacity,
    "button"
  );
  groups.timerColor = new SettingsGroup(
    "timerColor",
    UpdateConfig.setTimerColor,
    "button"
  );
  groups.fontFamily = new SettingsGroup(
    "fontFamily",
    UpdateConfig.setFontFamily,
    "button",
    null,
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
  groups.alwaysShowDecimalPlaces = new SettingsGroup(
    "alwaysShowDecimalPlaces",
    UpdateConfig.setAlwaysShowDecimalPlaces,
    "button"
  );
  groups.alwaysShowCPM = new SettingsGroup(
    "alwaysShowCPM",
    UpdateConfig.setAlwaysShowCPM,
    "button"
  );
  groups.customBackgroundSize = new SettingsGroup(
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
  $(".pageSettings .section.languageGroups .buttons").empty();
  $(".pageSettings .section.layout select").empty().select2("destroy");
  $(".pageSettings .section.keymapLayout select").empty().select2("destroy");
  $(".pageSettings .section.language select").empty().select2("destroy");
  $(".pageSettings .section.funbox .buttons").empty();
  $(".pageSettings .section.fontFamily .buttons").empty();
}

export async function fillSettingsPage(): Promise<void> {
  if (Config.showKeyTips) {
    $(".pageSettings .tip").removeClass("hidden");
  } else {
    $(".pageSettings .tip").addClass("hidden");
  }

  const languageEl = $(".pageSettings .section.language select").empty();
  const groups = await Misc.getLanguageGroups();
  groups.forEach((group) => {
    let append = `<optgroup label="${group.name}">`;
    group.languages.forEach((language) => {
      append += `<option value="${language}">${language.replace(
        /_/g,
        " "
      )}</option>`;
    });
    append += `</optgroup>`;
    languageEl.append(append);
  });
  languageEl.select2();

  const layoutEl = $(".pageSettings .section.layout select").empty();
  Object.keys(layouts).forEach((layout) => {
    layoutEl.append(
      `<option value='${layout}'>${
        layout === "default" ? "off" : layout.replace(/_/g, " ")
      }</option>`
    );
  });
  layoutEl.select2();

  const keymapEl = $(".pageSettings .section.keymapLayout select").empty();
  keymapEl.append(`<option value='overrideSync'>emulator sync</option>`);
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      keymapEl.append(
        `<option value='${layout}'>${layout.replace(/_/g, " ")}</option>`
      );
    }
  });
  keymapEl.select2();

  const funboxEl = $(".pageSettings .section.funbox .buttons").empty();
  funboxEl.append(`<div class="funbox button" funbox='none'>none</div>`);
  Misc.getFunboxList().then((funboxModes) => {
    funboxModes.forEach((funbox) => {
      if (funbox.name === "mirror") {
        funboxEl.append(
          `<div class="funbox button" funbox='${funbox.name}' aria-label="${
            funbox.info
          }" data-balloon-pos="up" data-balloon-length="fit" type="${
            funbox.type
          }" style="transform:scaleX(-1);">${funbox.name.replace(
            /_/g,
            " "
          )}</div>`
        );
      } else {
        funboxEl.append(
          `<div class="funbox button" funbox='${funbox.name}' aria-label="${
            funbox.info
          }" data-balloon-pos="up" data-balloon-length="fit" type="${
            funbox.type
          }">${funbox.name.replace(/_/g, " ")}</div>`
        );
      }
    });
  });

  let isCustomFont = true;
  const fontsEl = $(".pageSettings .section.fontFamily .buttons").empty();
  Misc.getFontsList().then((fonts) => {
    fonts.forEach((font) => {
      if (Config.fontFamily === font.name) isCustomFont = false;
      fontsEl.append(
        `<div class="button${
          Config.fontFamily === font.name ? " active" : ""
        }" style="font-family:${
          font.display !== undefined ? font.display : font.name
        }" fontFamily="${font.name.replace(/ /g, "_")}" tabindex="0"
        onclick="this.blur();">${
          font.display !== undefined ? font.display : font.name
        }</div>`
      );
    });

    fontsEl.append(
      isCustomFont
        ? `<div class="button no-auto-handle custom active" onclick="this.blur();">Custom (${Config.fontFamily.replace(
            /_/g,
            " "
          )})</div>`
        : '<div class="button no-auto-handle custom" onclick="this.blur();">Custom</div>'
    );
  });

  $(".pageSettings .section.customBackgroundSize input").val(
    Config.customBackground
  );

  $(".pageSettings .section.customLayoutfluid input").val(
    Config.customLayoutfluid.replace(/#/g, " ")
  );

  setEventDisabled(true);
  await initGroups();
  setEventDisabled(false);
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
  if (firebase.auth().currentUser == null) {
    $(".pageSettings .section.discordIntegration").addClass("hidden");
  } else {
    if (DB.getSnapshot() == null) return;
    $(".pageSettings .section.discordIntegration").removeClass("hidden");

    if (DB.getSnapshot().discordId == undefined) {
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

  const user = firebase.auth().currentUser;
  if (!user) return;

  const passwordProvider = user.providerData.find(
    //@ts-ignore todo remove then firebase is initialised in code rather than with a script tag
    (provider) => provider.providerId === "password"
  );
  const googleProvider = user.providerData.find(
    //@ts-ignore
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
  $(
    `.pageSettings .section.funbox .button[funbox='${Config.funbox}']`
  ).addClass("active");
}

function refreshTagsSettingsSection(): void {
  if (firebase.auth().currentUser !== null && DB.getSnapshot() !== null) {
    const tagsEl = $(".pageSettings .section.tags .tagsList").empty();
    DB.getSnapshot().tags.forEach((tag: Types.Tag) => {
      // let tagPbString = "No PB found";
      // if (tag.pb != undefined && tag.pb > 0) {
      //   tagPbString = `PB: ${tag.pb}`;
      // }
      tagsEl.append(`

      <div class="buttons tag" id="${tag._id}">
        <div class="button tagButton ${tag.active ? "active" : ""}" active="${
        tag.active
      }">
          <div class="title">${tag.name}</div>
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
  if (firebase.auth().currentUser !== null && DB.getSnapshot() !== null) {
    const presetsEl = $(".pageSettings .section.presets .presetsList").empty();
    DB.getSnapshot().presets.forEach((preset: Types.Preset) => {
      presetsEl.append(`
      <div class="buttons preset" id="${preset._id}">
        <div class="button presetButton">
          <div class="title">${preset.name}</div>
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
}

export function update(): void {
  Object.keys(groups).forEach((group) => {
    groups[group].updateInput();
  });

  refreshTagsSettingsSection();
  refreshPresetsSettingsSection();
  LanguagePicker.setActiveGroup();
  setActiveFunboxButton();
  ThemePicker.updateActiveTab();
  ThemePicker.setCustomInputs(true);
  updateDiscordSection();
  updateAuthSections();
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

$(document).on(
  "focusout",
  ".pageSettings .section.paceCaret input.customPaceCaretSpeed",
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

$(document).on("click", ".pageSettings .section.paceCaret .button.save", () => {
  UpdateConfig.setPaceCaretCustomSpeed(
    parseInt(
      $(
        ".pageSettings .section.paceCaret input.customPaceCaretSpeed"
      ).val() as string
    )
  );
});

$(document).on(
  "focusout",
  ".pageSettings .section.minWpm input.customMinWpmSpeed",
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

$(document).on("click", ".pageSettings .section.minWpm .button.save", () => {
  UpdateConfig.setMinWpmCustomSpeed(
    parseInt(
      $(".pageSettings .section.minWpm input.customMinWpmSpeed").val() as string
    )
  );
});

$(document).on(
  "focusout",
  ".pageSettings .section.minAcc input.customMinAcc",
  () => {
    UpdateConfig.setMinAccCustom(
      parseInt(
        $(".pageSettings .section.minAcc input.customMinAcc").val() as string
      )
    );
  }
);

$(document).on("click", ".pageSettings .section.minAcc .button.save", () => {
  UpdateConfig.setMinAccCustom(
    parseInt(
      $(".pageSettings .section.minAcc input.customMinAcc").val() as string
    )
  );
});

$(document).on(
  "focusout",
  ".pageSettings .section.minBurst input.customMinBurst",
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

$(document).on("click", ".pageSettings .section.minBurst .button.save", () => {
  UpdateConfig.setMinBurstCustomSpeed(
    parseInt(
      $(".pageSettings .section.minBurst input.customMinBurst").val() as string
    )
  );
});

$(document).on(
  "click",
  ".pageSettings .section.languageGroups .button",
  (e) => {
    const group = $(e.currentTarget).attr("group");
    LanguagePicker.setActiveGroup(group, true);
  }
);

//funbox
$(document).on("click", ".pageSettings .section.funbox .button", (e) => {
  const funbox = $(e.currentTarget).attr("funbox");
  const type = $(e.currentTarget).attr("type");
  Funbox.setFunbox(funbox, type);
  setActiveFunboxButton();
});

//tags
$(document).on(
  "click",
  ".pageSettings .section.tags .tagsList .tag .tagButton",
  (e) => {
    const target = e.currentTarget;
    const tagid = $(target).parent(".tag").attr("id");
    TagController.toggle(tagid);
    $(target).toggleClass("active");
  }
);

$(document).on(
  "click",
  ".pageSettings .section.presets .presetsList .preset .presetButton",
  (e) => {
    const target = e.currentTarget;
    const presetid = $(target).parent(".preset").attr("id");
    console.log("Applying Preset");
    configEventDisabled = true;
    PresetController.apply(presetid);
    configEventDisabled = false;
    update();
  }
);

$("#importSettingsButton").click(() => {
  ImportExportSettingsPopup.show("import");
});

$("#exportSettingsButton").click(() => {
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

$("#shareCustomThemeButton").click(() => {
  const share: string[] = [];
  $.each(
    $(".pageSettings .section.customTheme [type='color']"),
    (index, element) => {
      share.push($(element).attr("value") as string);
    }
  );

  const url =
    "https://monkeytype.com?" +
    Misc.objectToQueryString({ customTheme: share });

  navigator.clipboard.writeText(url).then(
    function () {
      Notifications.add("URL Copied to clipboard", 0);
    },
    function () {
      CustomThemePopup.show(url);
    }
  );
});

$(".pageSettings .sectionGroupTitle").click((e) => {
  toggleSettingsGroup($(e.currentTarget).attr("group") as string);
});

$(".pageSettings .section.customBackgroundSize .inputAndButton .save").on(
  "click",
  () => {
    UpdateConfig.setCustomBackground(
      $(
        ".pageSettings .section.customBackgroundSize .inputAndButton input"
      ).val()
    );
  }
);

$(".pageSettings .section.customBackgroundSize .inputAndButton input").keypress(
  (e) => {
    if (e.keyCode == 13) {
      UpdateConfig.setCustomBackground(
        $(
          ".pageSettings .section.customBackgroundSize .inputAndButton input"
        ).val()
      );
    }
  }
);

$(".pageSettings .section.customLayoutfluid .inputAndButton .save").on(
  "click",
  () => {
    UpdateConfig.setCustomLayoutfluid(
      $(".pageSettings .section.customLayoutfluid .inputAndButton input").val()
    );
    Notifications.add("Custom layoutfluid saved", 1);
  }
);

$(".pageSettings .section.customLayoutfluid .inputAndButton .input").keypress(
  (e) => {
    if (e.keyCode == 13) {
      UpdateConfig.setCustomLayoutfluid(
        $(
          ".pageSettings .section.customLayoutfluid .inputAndButton input"
        ).val()
      );
      Notifications.add("Custom layoutfluid saved", 1);
    }
  }
);

$(".quickNav .links a").on("click", (e) => {
  const settingsGroup = e.target.innerText;
  const isOpen = $(`.pageSettings .settingsGroup.${settingsGroup}`).hasClass(
    "slideup"
  );
  isOpen && toggleSettingsGroup(settingsGroup);
});

let configEventDisabled = false;
export function setEventDisabled(value: boolean): void {
  configEventDisabled = value;
}
ConfigEvent.subscribe((eventKey) => {
  if (configEventDisabled || eventKey === "saveToLocalStorage") return;
  if (ActivePage.get() === "settings") {
    update();
  }
});

export const page = new Page(
  "settings",
  $(".page.pageSettings"),
  "/settings",
  () => {
    //
  },
  async () => {
    reset();
  },
  async () => {
    await fillSettingsPage();
    update();
  },
  () => {
    //
  }
);
