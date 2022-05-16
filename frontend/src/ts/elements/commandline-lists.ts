import * as DB from "../db";
import * as Misc from "../utils/misc";
import * as Notifications from "./notifications";
import * as Sound from "../controllers/sound-controller";
import * as ThemeController from "../controllers/theme-controller";
import * as CustomTextPopup from "../popups/custom-text-popup";
import * as ManualRestart from "../test/manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
import * as PractiseWords from "../test/practise-words";
import * as TestUI from "../test/test-ui";
import * as TestLogic from "../test/test-logic";
import * as Funbox from "../test/funbox";
import * as TagController from "../controllers/tag-controller";
import * as PresetController from "../controllers/preset-controller";
import * as CustomText from "../test/custom-text";
import * as Settings from "../pages/settings";
import * as ChallengeController from "../controllers/challenge-controller";
import * as PaceCaret from "../test/pace-caret";
import * as TestInput from "../test/test-input";
import * as ModesNotice from "../elements/modes-notice";
import * as ConfigEvent from "../observables/config-event";
import * as ShareTestSettingsPopup from "../popups/share-test-settings-popup";
import { Auth } from "../firebase";
import * as PageController from "../controllers/page-controller";
import * as EditPresetPopup from "../popups/edit-preset-popup";
import * as EditTagPopup from "../popups/edit-tags-popup";

export let current: MonkeyTypes.CommandsGroup[] = [];

function canBailOut(): boolean {
  return (
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      (CustomText.word >= 5000 || CustomText.word == 0)) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      CustomText.text.length >= 5000) ||
    (Config.mode === "custom" &&
      CustomText.isTimeRandom &&
      (CustomText.time >= 3600 || CustomText.time == 0)) ||
    (Config.mode === "words" && Config.words >= 5000) ||
    Config.words === 0 ||
    (Config.mode === "time" && (Config.time >= 3600 || Config.time === 0)) ||
    Config.mode == "zen"
  );
}

const commandsLayouts: MonkeyTypes.CommandsGroup = {
  title: "Layout emulator...",
  configKey: "layout",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

Misc.getLayoutsList().then((layouts) => {
  commandsLayouts.list = [];
  commandsLayouts.list.push({
    id: "changeLayoutDefault",
    display: "off",
    configValue: "default",
    exec: (): void => {
      UpdateConfig.setLayout("default");
      TestLogic.restart();
    },
  });
  Object.keys(layouts).forEach((layout) => {
    commandsLayouts.list.push({
      id: "changeLayout" + Misc.capitalizeFirstLetterOfEachWord(layout),
      display: layout === "default" ? "off" : layout.replace(/_/g, " "),
      configValue: layout,
      exec: (): void => {
        // UpdateConfig.setSavedLayout(layout);
        UpdateConfig.setLayout(layout);
        TestLogic.restart();
      },
    });
  });
});

export const commandsKeymapLayouts: MonkeyTypes.CommandsGroup = {
  title: "Change keymap layout...",
  configKey: "keymapLayout",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};
Misc.getLayoutsList().then((layouts) => {
  commandsKeymapLayouts.list = [];
  commandsKeymapLayouts.list.push({
    id: "changeKeymapLayoutOverrideSync",
    display: "emulator sync",
    configValue: "overrideSync",
    exec: (): void => {
      UpdateConfig.setKeymapLayout("overrideSync");
      TestLogic.restart();
    },
  });
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      commandsKeymapLayouts.list.push({
        id: "changeKeymapLayout" + Misc.capitalizeFirstLetterOfEachWord(layout),
        display: layout.replace(/_/g, " "),
        configValue: layout,
        exec: (): void => {
          UpdateConfig.setKeymapLayout(layout);
          TestLogic.restart();
        },
      });
    }
  });
});

const commandsLanguages: MonkeyTypes.CommandsGroup = {
  title: "Language...",
  configKey: "language",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the languages list :(",
    },
  ],
};

commandsLanguages.list = [];
Misc.getLanguageList().then((languages) => {
  languages.forEach((language) => {
    commandsLanguages.list.push({
      id: "changeLanguage" + Misc.capitalizeFirstLetterOfEachWord(language),
      display: language.replace(/_/g, " "),
      configValue: language,
      exec: (): void => {
        UpdateConfig.setLanguage(language);
        TestLogic.restart();
      },
    });
  });
});

const commandsFunbox: MonkeyTypes.CommandsGroup = {
  title: "Funbox...",
  configKey: "funbox",
  list: [
    {
      id: "changeFunboxNone",
      display: "none",
      configValue: "none",
      alias: "off",
      exec: (): void => {
        if (Funbox.setFunbox("none", null)) {
          TestLogic.restart();
        }
      },
    },
  ],
};

Misc.getFunboxList().then((funboxes) => {
  funboxes.forEach((funbox) => {
    commandsFunbox.list.push({
      id: "changeFunbox" + funbox.name,
      display: funbox.name.replace(/_/g, " "),
      configValue: funbox.name,
      exec: (): void => {
        if (Funbox.setFunbox(funbox.name, funbox.type)) {
          TestLogic.restart();
        }
      },
    });
  });
});

const commandsFonts: MonkeyTypes.CommandsGroup = {
  title: "Font family...",
  configKey: "fontFamily",
  list: [],
};

Misc.getFontsList().then((fonts) => {
  fonts.forEach((font) => {
    const configVal = font.name.replace(/ /g, "_");
    commandsFonts.list.push({
      id: "changeFont" + font.name.replace(/ /g, "_"),
      display: font.display !== undefined ? font.display : font.name,
      configValue: configVal,
      hover: (): void => {
        UpdateConfig.previewFontFamily(font.name);
      },
      exec: (): void => {
        UpdateConfig.setFontFamily(font.name.replace(/ /g, "_"));
      },
    });
  });
  commandsFonts.list.push({
    id: "setFontFamilyCustom",
    display: "custom...",
    input: true,
    hover: (): void => {
      UpdateConfig.previewFontFamily(Config.fontFamily);
    },
    exec: (name) => {
      if (!name) return;
      UpdateConfig.setFontFamily(name.replace(/\s/g, "_"));
      // Settings.groups.fontFamily.updateInput();
    },
  });
});

const commandsTags: MonkeyTypes.CommandsGroup = {
  title: "Change tags...",
  list: [],
};

export function updateTagCommands(): void {
  const snapshot = DB.getSnapshot();
  commandsTags.list = [];
  if (!snapshot || !snapshot.tags || snapshot.tags.length === 0) return;
  commandsTags.list.push({
    id: "clearTags",
    display: `Clear tags`,
    icon: "fa-times",
    exec: (): void => {
      const snapshot = DB.getSnapshot();

      snapshot.tags = snapshot.tags?.map((tag) => {
        tag.active = false;

        return tag;
      });

      DB.setSnapshot(snapshot);
      ModesNotice.update();
      TagController.saveActiveToLocalStorage();
    },
  });

  DB.getSnapshot().tags?.forEach((tag) => {
    let dis = tag.display;

    if (tag.active === true) {
      dis = '<i class="fas fa-fw fa-check"></i>' + dis;
    } else {
      dis = '<i class="fas fa-fw"></i>' + dis;
    }

    commandsTags.list.push({
      id: "toggleTag" + tag._id,
      noIcon: true,
      display: dis,
      sticky: true,
      exec: (): void => {
        TagController.toggle(tag._id);
        ModesNotice.update();

        if (Config.paceCaret === "average") {
          PaceCaret.init();
          ModesNotice.update();
        }

        let txt = tag.display;

        if (tag.active === true) {
          txt = '<i class="fas fa-fw fa-check"></i>' + txt;
        } else {
          txt = '<i class="fas fa-fw"></i>' + txt;
        }
        if ($("#commandLine").hasClass("allCommands")) {
          $(
            `#commandLine .suggestions .entry[command='toggleTag${tag._id}']`
          ).html(
            `<div class="icon"><i class="fas fa-fw fa-tag"></i></div><div>Tags  > ` +
              txt
          );
        } else {
          $(
            `#commandLine .suggestions .entry[command='toggleTag${tag._id}']`
          ).html(txt);
        }
      },
    });
  });
  commandsTags.list.push({
    id: "createTag",
    display: "Create tag",
    icon: "fa-plus",
    exec: (): void => {
      EditTagPopup.show("add");
    },
  });
}

const commandsPresets: MonkeyTypes.CommandsGroup = {
  title: "Presets...",
  list: [],
};

export function updatePresetCommands(): void {
  const snapshot = DB.getSnapshot();
  commandsPresets.list = [];
  if (!snapshot || !snapshot.presets || snapshot.presets.length === 0) return;
  snapshot.presets.forEach((preset: MonkeyTypes.Preset) => {
    const dis = preset.display;

    commandsPresets.list.push({
      id: "applyPreset" + preset._id,
      display: dis,
      exec: (): void => {
        Settings.setEventDisabled(true);
        PresetController.apply(preset._id);
        Settings.setEventDisabled(false);
        Settings.update();
        ModesNotice.update();
      },
    });
  });
  commandsPresets.list.push({
    id: "createPreset",
    display: "Create preset",
    icon: "fa-plus",
    exec: (): void => {
      EditPresetPopup.show("add");
    },
  });
}

const commandsRepeatQuotes: MonkeyTypes.CommandsGroup = {
  title: "Repeat quotes...",
  configKey: "repeatQuotes",
  list: [
    {
      id: "setRepeatQuotesOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setRepeatQuotes("off");
      },
    },
    {
      id: "setRepeatQuotesTyping",
      display: "typing",
      configValue: "typing",
      exec: (): void => {
        UpdateConfig.setRepeatQuotes("typing");
      },
    },
  ],
};

const commandsLiveWpm: MonkeyTypes.CommandsGroup = {
  title: "Live WPM...",
  configKey: "showLiveWpm",
  list: [
    {
      id: "setLiveWpmOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowLiveWpm(false);
      },
    },
    {
      id: "setLiveWpmOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowLiveWpm(true);
      },
    },
  ],
};

const commandsShowAverage: MonkeyTypes.CommandsGroup = {
  title: "Show average...",
  configKey: "showAverage",
  list: [
    {
      id: "setShowAverageOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setShowAverage("off");
      },
    },
    {
      id: "setShowAverageSpeed",
      display: "wpm",
      configValue: "wpm",
      exec: (): void => {
        UpdateConfig.setShowAverage("wpm");
      },
    },
    {
      id: "setShowAverageAcc",
      display: "accuracy",
      configValue: "acc",
      exec: (): void => {
        UpdateConfig.setShowAverage("acc");
      },
    },
    {
      id: "setShowAverageBoth",
      display: "both",
      configValue: "both",
      exec: (): void => {
        UpdateConfig.setShowAverage("both");
      },
    },
  ],
};

const commandsLiveAcc: MonkeyTypes.CommandsGroup = {
  title: "Live accuracy...",
  configKey: "showLiveAcc",
  list: [
    {
      id: "setLiveAccOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowLiveAcc(false);
      },
    },
    {
      id: "setLiveAccOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowLiveAcc(true);
      },
    },
  ],
};

const commandsLiveBurst: MonkeyTypes.CommandsGroup = {
  title: "Live burst...",
  configKey: "showLiveBurst",
  list: [
    {
      id: "setLiveBurstOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowLiveBurst(false);
      },
    },
    {
      id: "setLiveBurstOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowLiveBurst(true);
      },
    },
  ],
};

const commandsShowTimer: MonkeyTypes.CommandsGroup = {
  title: "Timer/progress...",
  configKey: "showTimerProgress",
  list: [
    {
      id: "setTimerProgressOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowTimerProgress(false);
      },
    },
    {
      id: "setTimerProgressOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowTimerProgress(true);
      },
    },
  ],
};

const commandsKeyTips: MonkeyTypes.CommandsGroup = {
  title: "Key tips...",
  configKey: "showKeyTips",
  list: [
    {
      id: "setKeyTipsOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setKeyTips(false);
      },
    },
    {
      id: "setKeyTipsOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setKeyTips(true);
      },
    },
  ],
};

const commandsFreedomMode: MonkeyTypes.CommandsGroup = {
  title: "Freedom mode...",
  configKey: "freedomMode",
  list: [
    {
      id: "setfreedomModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setFreedomMode(false);
      },
    },
    {
      id: "setfreedomModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setFreedomMode(true);
      },
    },
  ],
};

const commandsStrictSpace: MonkeyTypes.CommandsGroup = {
  title: "Strict space...",
  configKey: "strictSpace",
  list: [
    {
      id: "setStrictSpaceOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setStrictSpace(false);
      },
    },
    {
      id: "setStrictSpaceOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setStrictSpace(true);
      },
    },
  ],
};

const commandsBlindMode: MonkeyTypes.CommandsGroup = {
  title: "Blind mode...",
  configKey: "blindMode",
  list: [
    {
      id: "setBlindModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setBlindMode(false);
      },
    },
    {
      id: "setBlindModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setBlindMode(true);
      },
    },
  ],
};

const commandsShowWordsHistory: MonkeyTypes.CommandsGroup = {
  title: "Always show words history...",
  configKey: "alwaysShowWordsHistory",
  list: [
    {
      id: "setAlwaysShowWordsHistoryOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setAlwaysShowWordsHistory(false);
      },
    },
    {
      id: "setAlwaysShowWordsHistoryOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setAlwaysShowWordsHistory(true);
      },
    },
  ],
};

const commandsIndicateTypos: MonkeyTypes.CommandsGroup = {
  title: "Indicate typos...",
  configKey: "indicateTypos",
  list: [
    {
      id: "setIndicateTyposOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("off");
      },
    },
    {
      id: "setIndicateTyposBelow",
      display: "below",
      configValue: "below",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("below");
      },
    },
    {
      id: "setIndicateTyposReplace",
      display: "replace",
      configValue: "replace",
      exec: (): void => {
        UpdateConfig.setIndicateTypos("replace");
      },
    },
  ],
};

const commandsHideExtraLetters: MonkeyTypes.CommandsGroup = {
  title: "Hide extra letters...",
  configKey: "hideExtraLetters",
  list: [
    {
      id: "setHideExtraLettersOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setHideExtraLetters(false);
      },
    },
    {
      id: "setHideExtraLettersOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setHideExtraLetters(true);
      },
    },
  ],
};

const commandsQuickEnd: MonkeyTypes.CommandsGroup = {
  title: "Quick end...",
  configKey: "quickEnd",
  list: [
    {
      id: "setQuickEndOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setQuickEnd(false);
      },
    },
    {
      id: "setQuickEndOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setQuickEnd(true);
      },
    },
  ],
};

const commandsOppositeShiftMode: MonkeyTypes.CommandsGroup = {
  title: "Change opposite shift mode...",
  configKey: "oppositeShiftMode",
  list: [
    {
      id: "setOppositeShiftModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setOppositeShiftMode("off");
        ModesNotice.update();
      },
    },
    {
      id: "setOppositeShiftModeOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setOppositeShiftMode("on");
        ModesNotice.update();
      },
    },
    {
      id: "setOppositeShiftModeKeymap",
      display: "keymap",
      configValue: "keymap",
      exec: (): void => {
        UpdateConfig.setOppositeShiftMode("keymap");
        ModesNotice.update();
      },
    },
  ],
};

const commandsSoundOnError: MonkeyTypes.CommandsGroup = {
  title: "Sound on error...",
  configKey: "playSoundOnError",
  list: [
    {
      id: "setPlaySoundOnErrorOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setPlaySoundOnError(false);
      },
    },
    {
      id: "setPlaySoundOnErrorOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setPlaySoundOnError(true);
        Sound.playError();
      },
    },
  ],
};

const commandsSoundVolume: MonkeyTypes.CommandsGroup = {
  title: "Sound volume...",
  configKey: "soundVolume",
  list: [
    {
      id: "setSoundVolume0.1",
      display: "quiet",
      configValue: "0.1",
      exec: (): void => {
        UpdateConfig.setSoundVolume("0.1");
        Sound.playClick();
      },
    },
    {
      id: "setSoundVolume0.5",
      display: "medium",
      configValue: "0.5",
      exec: (): void => {
        UpdateConfig.setSoundVolume("0.5");
        Sound.playClick();
      },
    },
    {
      id: "setSoundVolume1.0",
      display: "loud",
      configValue: "1.0",
      exec: (): void => {
        UpdateConfig.setSoundVolume("1.0");
        Sound.playClick();
      },
    },
  ],
};

const commandsFlipTestColors: MonkeyTypes.CommandsGroup = {
  title: "Flip test colors...",
  configKey: "flipTestColors",
  list: [
    {
      id: "setFlipTestColorsOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setFlipTestColors(false);
      },
    },
    {
      id: "setFlipTestColorsOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setFlipTestColors(true);
      },
    },
  ],
};

const commandsSmoothLineScroll: MonkeyTypes.CommandsGroup = {
  title: "Smooth line scroll...",
  configKey: "smoothLineScroll",
  list: [
    {
      id: "setSmoothLineScrollOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setSmoothLineScroll(false);
      },
    },
    {
      id: "setSmoothLineScrollOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setSmoothLineScroll(true);
      },
    },
  ],
};

const commandsAlwaysShowDecimal: MonkeyTypes.CommandsGroup = {
  title: "Always show decimal places...",
  configKey: "alwaysShowDecimalPlaces",
  list: [
    {
      id: "setAlwaysShowDecimalPlacesOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setAlwaysShowDecimalPlaces(false);
      },
    },
    {
      id: "setAlwaysShowDecimalPlacesOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setAlwaysShowDecimalPlaces(true);
      },
    },
  ],
};

const commandsAlwaysShowCPM: MonkeyTypes.CommandsGroup = {
  title: "Always show CPM...",
  configKey: "alwaysShowCPM",
  list: [
    {
      id: "setAlwaysShowCPMOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setAlwaysShowCPM(false);
      },
    },
    {
      id: "setAlwaysShowCPMOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setAlwaysShowCPM(true);
      },
    },
  ],
};

const commandsStartGraphsAtZero: MonkeyTypes.CommandsGroup = {
  title: "Start graphs at zero...",
  configKey: "startGraphsAtZero",
  list: [
    {
      id: "setStartGraphsAtZeroOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setStartGraphsAtZero(false);
      },
    },
    {
      id: "setStartGraphsAtZeroOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setStartGraphsAtZero(true);
      },
    },
  ],
};

const commandsLazyMode: MonkeyTypes.CommandsGroup = {
  title: "Lazy mode...",
  configKey: "lazyMode",
  list: [
    {
      id: "setLazyModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setLazyMode(false);
        TestLogic.restart();
      },
    },
    {
      id: "setLazyModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setLazyMode(true);
        TestLogic.restart();
      },
    },
  ],
};

const commandsSwapEscAndTab: MonkeyTypes.CommandsGroup = {
  title: "Swap esc and tab...",
  configKey: "swapEscAndTab",
  list: [
    {
      id: "setSwapEscAndTabOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setSwapEscAndTab(false);
      },
    },
    {
      id: "setSwapEscAndTabOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setSwapEscAndTab(true);
      },
    },
  ],
};

const commandsShowAllLines: MonkeyTypes.CommandsGroup = {
  title: "Show all lines...",
  configKey: "showAllLines",
  list: [
    {
      id: "setShowAllLinesOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowAllLines(false);
      },
    },
    {
      id: "setShowAllLinesOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowAllLines(true);
      },
    },
  ],
};

const commandsColorfulMode: MonkeyTypes.CommandsGroup = {
  title: "Colorful mode...",
  configKey: "colorfulMode",
  list: [
    {
      id: "setColorfulModeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setColorfulMode(false);
      },
    },
    {
      id: "setColorfulModeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setColorfulMode(true);
      },
    },
  ],
};

const commandsOutOfFocusWarning: MonkeyTypes.CommandsGroup = {
  title: "Colorful mode...",
  configKey: "showOutOfFocusWarning",
  list: [
    {
      id: "setShowOutOfFocusWarningOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setShowOutOfFocusWarning(false);
      },
    },
    {
      id: "setShowOutOfFocusWarningOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setShowOutOfFocusWarning(true);
      },
    },
  ],
};

const commandsKeymapMode: MonkeyTypes.CommandsGroup = {
  title: "Keymap mode...",
  configKey: "keymapMode",
  list: [
    {
      id: "setKeymapModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setKeymapMode("off");
      },
    },
    {
      id: "setKeymapModeStatic",
      display: "static",
      configValue: "static",
      exec: (): void => {
        UpdateConfig.setKeymapMode("static");
      },
    },
    {
      id: "setKeymapModeNext",
      display: "next",
      configValue: "next",
      exec: (): void => {
        UpdateConfig.setKeymapMode("next");
      },
    },
    {
      id: "setKeymapModeReact",
      display: "react",
      alias: "flash",
      configValue: "react",
      exec: (): void => {
        UpdateConfig.setKeymapMode("react");
      },
    },
  ],
};

const commandsSoundOnClick: MonkeyTypes.CommandsGroup = {
  title: "Sound on click...",
  configKey: "playSoundOnClick",
  list: [
    {
      id: "setSoundOnClickOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("off");
      },
    },
    {
      id: "setSoundOnClick1",
      display: "click",
      configValue: "1",
      hover: (): void => {
        Sound.previewClick("1");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("1");
        Sound.playClick();
      },
    },
    {
      id: "setSoundOnClick2",
      display: "beep",
      configValue: "2",
      hover: (): void => {
        Sound.previewClick("2");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("2");
        Sound.playClick();
      },
    },
    {
      id: "setSoundOnClick3",
      display: "pop",
      configValue: "3",
      hover: (): void => {
        Sound.previewClick("3");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("3");
        Sound.playClick();
      },
    },
    {
      id: "setSoundOnClick4",
      display: "nk creams",
      configValue: "4",
      hover: (): void => {
        Sound.previewClick("4");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("4");
        Sound.playClick();
      },
    },
    {
      id: "setSoundOnClick5",
      display: "typewriter",
      configValue: "5",
      hover: (): void => {
        Sound.previewClick("5");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("5");
        Sound.playClick();
      },
    },
    {
      id: "setSoundOnClick6",
      display: "osu",
      configValue: "6",
      hover: (): void => {
        Sound.previewClick("6");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("6");
        Sound.playClick();
      },
    },
    {
      id: "setSoundOnClick7",
      display: "hitmarker",
      configValue: "7",
      hover: (): void => {
        Sound.previewClick("7");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("7");
        Sound.playClick();
      },
    },
  ],
};

const commandsRandomTheme: MonkeyTypes.CommandsGroup = {
  title: "Random theme...",
  configKey: "randomTheme",
  list: [
    {
      id: "setRandomOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setRandomTheme("off");
      },
    },
    {
      id: "setRandomOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setRandomTheme("on");
      },
    },
    {
      id: "setRandomFav",
      display: "fav",
      configValue: "fav",
      exec: (): void => {
        UpdateConfig.setRandomTheme("fav");
      },
    },
    {
      id: "setRandomLight",
      display: "light",
      configValue: "light",
      exec: (): void => {
        UpdateConfig.setRandomTheme("light");
      },
    },
    {
      id: "setRandomDark",
      display: "dark",
      configValue: "dark",
      exec: (): void => {
        UpdateConfig.setRandomTheme("dark");
      },
    },
    {
      id: "setRandomCustom",
      display: "custom",
      configValue: "custom",
      exec: (): void => {
        if (Auth.currentUser === null) {
          Notifications.add(
            "Multiple custom themes are available to logged in users only",
            0
          );
          return;
        }
        UpdateConfig.setRandomTheme("custom");
      },
    },
  ],
};

const commandsDifficulty: MonkeyTypes.CommandsGroup = {
  title: "Difficulty...",
  configKey: "difficulty",
  list: [
    {
      id: "setDifficultyNormal",
      display: "normal",
      configValue: "normal",
      exec: (): void => {
        UpdateConfig.setDifficulty("normal");
      },
    },
    {
      id: "setDifficultyExpert",
      display: "expert",
      configValue: "expert",
      exec: (): void => {
        UpdateConfig.setDifficulty("expert");
      },
    },
    {
      id: "setDifficultyMaster",
      display: "master",
      configValue: "master",
      exec: (): void => {
        UpdateConfig.setDifficulty("master");
      },
    },
  ],
};

export const commandsEnableAds: MonkeyTypes.CommandsGroup = {
  title: "Set enable ads...",
  configKey: "enableAds",
  list: [
    {
      id: "setEnableAdsOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setEnableAds("off");
      },
    },
    {
      id: "setEnableAdsOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setEnableAds("on");
      },
    },
    {
      id: "setEnableMax",
      display: "sellout",
      configValue: "max",
      exec: (): void => {
        UpdateConfig.setEnableAds("max");
      },
    },
  ],
};

export const customThemeCommands: MonkeyTypes.CommandsGroup = {
  title: "Custom theme",
  configKey: "customTheme",
  list: [
    {
      id: "setCustomThemeOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setCustomTheme(false);
      },
    },
    {
      id: "setCustomThemeOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setCustomTheme(true);
      },
    },
  ],
};

export const customThemeListCommands: MonkeyTypes.CommandsGroup = {
  title: "Custom themes list...",
  // configKey: "customThemeId",
  list: [],
};

export function updateCustomThemeListCommands(): void {
  if (Auth.currentUser === null) {
    return;
  }

  customThemeListCommands.list = [];

  const snapshot = DB.getSnapshot();

  if (!snapshot) return;

  if (DB.getSnapshot().customThemes.length < 0) {
    Notifications.add("You need to create a custom theme first", 0);
    return;
  }
  DB.getSnapshot().customThemes.forEach((theme) => {
    customThemeListCommands.list.push({
      id: "setCustomThemeId" + theme._id,
      display: theme.name,
      configValue: theme._id,
      hover: (): void => {
        ThemeController.preview(theme._id, true);
      },
      exec: (): void => {
        // UpdateConfig.setCustomThemeId(theme._id);
        UpdateConfig.setCustomTheme(true);
        ThemeController.set(theme._id, true);
      },
    });
  });
  return;
}

const commandsCaretStyle: MonkeyTypes.CommandsGroup = {
  title: "Change caret style...",
  configKey: "caretStyle",
  list: [
    {
      id: "setCaretStyleOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setCaretStyle("off");
      },
    },
    {
      id: "setCaretStyleDefault",
      display: "line",
      configValue: "default",
      exec: (): void => {
        UpdateConfig.setCaretStyle("default");
      },
    },
    {
      id: "setCaretStyleBlock",
      display: "block",
      configValue: "block",
      exec: (): void => {
        UpdateConfig.setCaretStyle("block");
      },
    },
    {
      id: "setCaretStyleOutline",
      display: "outline-block",
      configValue: "outline",
      exec: (): void => {
        UpdateConfig.setCaretStyle("outline");
      },
    },
    {
      id: "setCaretStyleUnderline",
      display: "underline",
      configValue: "underline",
      exec: (): void => {
        UpdateConfig.setCaretStyle("underline");
      },
    },
    {
      id: "setCaretStyleCarrot",
      display: "carrot",
      configValue: "carrot",
      visible: false,
      exec: (): void => {
        UpdateConfig.setCaretStyle("carrot");
      },
    },
    {
      id: "setCaretStyleBanana",
      display: "banana",
      configValue: "banana",
      visible: false,
      exec: (): void => {
        UpdateConfig.setCaretStyle("banana");
      },
    },
  ],
};

const commandsPaceCaretStyle: MonkeyTypes.CommandsGroup = {
  title: "Change pace caret style...",
  configKey: "paceCaretStyle",
  list: [
    {
      id: "setPaceCaretStyleDefault",
      display: "line",
      configValue: "default",
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("default");
      },
    },
    {
      id: "setPaceCaretStyleBlock",
      display: "block",
      configValue: "block",
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("block");
      },
    },
    {
      id: "setPaceCaretStyleOutline",
      display: "outline-block",
      configValue: "outline",
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("outline");
      },
    },
    {
      id: "setPaceCaretStyleUnderline",
      display: "underline",
      configValue: "underline",
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("underline");
      },
    },
    {
      id: "setPaceCaretStyleCarrot",
      display: "carrot",
      configValue: "carrot",
      visible: false,
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("carrot");
      },
    },
    {
      id: "setPaceCaretStyleBanana",
      display: "banana",
      configValue: "banana",
      visible: false,
      exec: (): void => {
        UpdateConfig.setPaceCaretStyle("banana");
      },
    },
  ],
};

const commandsRepeatedPace: MonkeyTypes.CommandsGroup = {
  title: "Repeated pace...",
  configKey: "repeatedPace",
  list: [
    {
      id: "setRepeatedPaceOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setRepeatedPace(false);
      },
    },
    {
      id: "setRepeatedPaceOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setRepeatedPace(true);
      },
    },
  ],
};

const commandsPaceCaret: MonkeyTypes.CommandsGroup = {
  title: "Pace caret mode...",
  configKey: "paceCaret",
  list: [
    {
      id: "setPaceCaretOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setPaceCaret("off");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretPb",
      display: "pb",
      configValue: "pb",
      exec: (): void => {
        UpdateConfig.setPaceCaret("pb");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretAverage",
      display: "average",
      configValue: "average",
      exec: (): void => {
        UpdateConfig.setPaceCaret("average");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setPaceCaretCustomSpeed(parseInt(input));
        UpdateConfig.setPaceCaret("custom");
        TestLogic.restart();
      },
    },
  ],
};

const commandsMinWpm: MonkeyTypes.CommandsGroup = {
  title: "Change min wpm mode...",
  configKey: "minWpm",
  list: [
    {
      id: "setMinWpmOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinWpm("off");
      },
    },
    {
      id: "setMinWpmCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMinWpmCustomSpeed(parseInt(input));
        UpdateConfig.setMinWpm("custom");
      },
    },
  ],
};

const commandsMinAcc: MonkeyTypes.CommandsGroup = {
  title: "Change min accuracy mode...",
  configKey: "minAcc",
  list: [
    {
      id: "setMinAccOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinAcc("off");
      },
    },
    {
      id: "setMinAccCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMinAccCustom(parseInt(input));
        UpdateConfig.setMinAcc("custom");
      },
    },
  ],
};

const commandsMinBurst: MonkeyTypes.CommandsGroup = {
  title: "Change min burst mode...",
  configKey: "minBurst",
  list: [
    {
      id: "setMinBurstOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setMinBurst("off");
      },
    },
    {
      id: "setMinBurstFixed",
      display: "fixed...",
      configValue: "fixed",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMinBurst("fixed");
        UpdateConfig.setMinBurstCustomSpeed(parseInt(input));
      },
    },
    {
      id: "setMinBurstFlex",
      display: "flex...",
      configValue: "flex",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMinBurst("flex");
        UpdateConfig.setMinBurstCustomSpeed(parseInt(input));
      },
    },
  ],
};

const commandsKeymapStyle: MonkeyTypes.CommandsGroup = {
  title: "Keymap style...",
  configKey: "keymapStyle",
  list: [
    {
      id: "setKeymapStyleStaggered",
      display: "staggered",
      configValue: "staggered",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("staggered");
      },
    },
    {
      id: "setKeymapStyleAlice",
      display: "alice",
      configValue: "alice",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("alice");
      },
    },
    {
      id: "setKeymapStyleMatrix",
      display: "matrix",
      configValue: "matrix",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("matrix");
      },
    },
    {
      id: "setKeymapStyleSplit",
      display: "split",
      configValue: "split",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("split");
      },
    },
    {
      id: "setKeymapStyleSplitMatrix",
      display: "split matrix",
      configValue: "split_matrix",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("split_matrix");
      },
    },
  ],
};

const commandsKeymapLegendStyle: MonkeyTypes.CommandsGroup = {
  title: "Keymap legend style...",
  configKey: "keymapLegendStyle",
  list: [
    {
      id: "setKeymapLegendStyleLowercase",
      display: "lowercase",
      configValue: "lowercase",
      exec: (): void => {
        UpdateConfig.setKeymapLegendStyle("lowercase");
      },
    },
    {
      id: "setKeymapLegendStyleUppercase",
      display: "uppercase",
      configValue: "uppercase",
      exec: (): void => {
        UpdateConfig.setKeymapLegendStyle("uppercase");
      },
    },
    {
      id: "setKeymapLegendStyleBlank",
      display: "blank",
      configValue: "blank",
      exec: (): void => {
        UpdateConfig.setKeymapLegendStyle("blank");
      },
    },
    {
      id: "setKeymapLegendStyleDynamic",
      display: "dynamic",
      configValue: "dynamic",
      exec: (): void => {
        UpdateConfig.setKeymapLegendStyle("dynamic");
      },
    },
  ],
};

const commandsBritishEnglish: MonkeyTypes.CommandsGroup = {
  title: "British english...",
  configKey: "britishEnglish",
  list: [
    {
      id: "setBritishEnglishOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setBritishEnglish(false);
        TestLogic.restart();
      },
    },
    {
      id: "setBritishEnglishOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setBritishEnglish(true);
        TestLogic.restart();
      },
    },
  ],
};

const commandsHighlightMode: MonkeyTypes.CommandsGroup = {
  title: "Highlight mode...",
  configKey: "highlightMode",
  list: [
    {
      id: "setHighlightModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setHighlightMode("off");
      },
    },
    {
      id: "setHighlightModeLetter",
      display: "letter",
      configValue: "letter",
      exec: (): void => {
        UpdateConfig.setHighlightMode("letter");
      },
    },
    {
      id: "setHighlightModeWord",
      display: "word",
      configValue: "word",
      exec: (): void => {
        UpdateConfig.setHighlightMode("word");
      },
    },
  ],
};

const commandsTapeMode: MonkeyTypes.CommandsGroup = {
  title: "Tape mode...",
  configKey: "tapeMode",
  list: [
    {
      id: "setTapeModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setTapeMode("off");
      },
    },
    {
      id: "setTapeModeLetter",
      display: "letter",
      configValue: "letter",
      exec: (): void => {
        UpdateConfig.setTapeMode("letter");
      },
    },
    {
      id: "setTapeModeWord",
      display: "word",
      configValue: "word",
      exec: (): void => {
        UpdateConfig.setTapeMode("word");
      },
    },
  ],
};

const commandsTimerStyle: MonkeyTypes.CommandsGroup = {
  title: "Timer/progress style...",
  configKey: "timerStyle",
  list: [
    {
      id: "setTimerStyleBar",
      display: "bar",
      configValue: "bar",
      exec: (): void => {
        UpdateConfig.setTimerStyle("bar");
      },
    },
    {
      id: "setTimerStyleText",
      display: "text",
      configValue: "text",
      exec: (): void => {
        UpdateConfig.setTimerStyle("text");
      },
    },
    {
      id: "setTimerStyleMini",
      display: "mini",
      configValue: "mini",
      exec: (): void => {
        UpdateConfig.setTimerStyle("mini");
      },
    },
  ],
};

const commandsTimerColor: MonkeyTypes.CommandsGroup = {
  title: "Timer/progress color...",
  configKey: "timerColor",
  list: [
    {
      id: "setTimerColorBlack",
      display: "black",
      configValue: "black",
      exec: (): void => {
        UpdateConfig.setTimerColor("black");
      },
    },
    {
      id: "setTimerColorSub",
      display: "sub",
      configValue: "sub",
      exec: (): void => {
        UpdateConfig.setTimerColor("sub");
      },
    },
    {
      id: "setTimerColorText",
      display: "text",
      configValue: "text",
      exec: (): void => {
        UpdateConfig.setTimerColor("text");
      },
    },
    {
      id: "setTimerColorMain",
      display: "main",
      configValue: "main",
      exec: (): void => {
        UpdateConfig.setTimerColor("main");
      },
    },
  ],
};

const commandsSingleListCommandLine: MonkeyTypes.CommandsGroup = {
  title: "Single list command line...",
  configKey: "singleListCommandLine",
  list: [
    {
      id: "singleListCommandLineManual",
      display: "manual",
      configValue: "manual",
      exec: (): void => {
        UpdateConfig.setSingleListCommandLine("manual");
      },
    },
    {
      id: "singleListCommandLineOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setSingleListCommandLine("on");
      },
    },
  ],
};

const commandsCapsLockWarning: MonkeyTypes.CommandsGroup = {
  title: "Caps lock warning...",
  configKey: "capsLockWarning",
  list: [
    {
      id: "capsLockWarningOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setCapsLockWarning(true);
      },
    },
    {
      id: "capsLockWarningOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setCapsLockWarning(false);
      },
    },
  ],
};

const commandsTimerOpacity: MonkeyTypes.CommandsGroup = {
  title: "Timer/progress opacity...",
  configKey: "timerOpacity",
  list: [
    {
      id: "setTimerOpacity.25",
      display: ".25",
      configValue: 0.25,
      exec: (): void => {
        UpdateConfig.setTimerOpacity("0.25");
      },
    },
    {
      id: "setTimerOpacity.5",
      display: ".5",
      configValue: 0.5,
      exec: (): void => {
        UpdateConfig.setTimerOpacity("0.5");
      },
    },
    {
      id: "setTimerOpacity.75",
      display: ".75",
      configValue: 0.75,
      exec: (): void => {
        UpdateConfig.setTimerOpacity("0.75");
      },
    },
    {
      id: "setTimerOpacity1",
      display: "1",
      configValue: 1,
      exec: (): void => {
        UpdateConfig.setTimerOpacity("1");
      },
    },
  ],
};

const commandsWordCount: MonkeyTypes.CommandsGroup = {
  title: "Change word count...",
  configKey: "words",
  list: [
    {
      id: "changeWordCount10",
      display: "10",
      configValue: 10,
      exec: (): void => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount(10);
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount25",
      display: "25",
      configValue: 25,
      exec: (): void => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount(25);
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount50",
      display: "50",
      configValue: 50,
      exec: (): void => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount(50);
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount100",
      display: "100",
      configValue: 100,
      exec: (): void => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount(100);
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount200",
      display: "200",
      configValue: 200,
      exec: (): void => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount(200);
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCountCustom",
      display: "custom...",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount(parseInt(input));
        TestLogic.restart();
      },
    },
  ],
};

const commandsQuoteLengthConfig: MonkeyTypes.CommandsGroup = {
  title: "Change quote length...",
  configKey: "quoteLength",
  list: [
    {
      id: "changeQuoteLengthAll",
      display: "all",
      configValue: [0, 1, 2, 3],
      exec: (): void => {
        UpdateConfig.setMode("quote");
        UpdateConfig.setQuoteLength([0, 1, 2, 3]);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthShort",
      display: "short",
      configValue: 0,
      configValueMode: "include",
      exec: (): void => {
        UpdateConfig.setMode("quote");
        UpdateConfig.setQuoteLength(0);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthMedium",
      display: "medium",
      configValue: 1,
      configValueMode: "include",
      exec: (): void => {
        UpdateConfig.setMode("quote");
        UpdateConfig.setQuoteLength(1);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthLong",
      display: "long",
      configValue: 2,
      configValueMode: "include",
      exec: (): void => {
        UpdateConfig.setMode("quote");
        UpdateConfig.setQuoteLength(2);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthThicc",
      display: "thicc",
      configValue: 3,
      configValueMode: "include",
      exec: (): void => {
        UpdateConfig.setMode("quote");
        UpdateConfig.setQuoteLength(3);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthFavorite",
      display: "favorite",
      configValue: -3,
      configValueMode: "include",
      available: (): boolean => {
        return !!Auth.currentUser;
      },
      exec: (): void => {
        UpdateConfig.setMode("quote");
        UpdateConfig.setQuoteLength(-3);
        TestLogic.restart();
      },
    },
  ],
};

const commandsPunctuation: MonkeyTypes.CommandsGroup = {
  title: "Change punctuation...",
  configKey: "punctuation",
  list: [
    {
      id: "changePunctuationOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setPunctuation(true);
        TestLogic.restart();
      },
    },
    {
      id: "changePunctuationOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setPunctuation(false);
        TestLogic.restart();
      },
    },
  ],
};

const commandsNumbers: MonkeyTypes.CommandsGroup = {
  title: "Numbers...",
  configKey: "numbers",
  list: [
    {
      id: "changeNumbersOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setNumbers(true);
        TestLogic.restart();
      },
    },
    {
      id: "changeNumbersOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setNumbers(false);
        TestLogic.restart();
      },
    },
  ],
};

const commandsSmoothCaret: MonkeyTypes.CommandsGroup = {
  title: "Smooth caret...",
  configKey: "smoothCaret",
  list: [
    {
      id: "changeSmoothCaretOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setSmoothCaret(true);
      },
    },
    {
      id: "changeSmoothCaretOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setSmoothCaret(false);
      },
    },
  ],
};

const commandsQuickTab: MonkeyTypes.CommandsGroup = {
  title: "Quick tab...",
  configKey: "quickTab",
  list: [
    {
      id: "changeQuickTabOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setQuickTabMode(true);
      },
    },
    {
      id: "changeQuickTabOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setQuickTabMode(false);
      },
    },
  ],
};

const commandsMode: MonkeyTypes.CommandsGroup = {
  title: "Change mode...",
  configKey: "mode",
  list: [
    {
      id: "changeModeTime",
      display: "time",
      configValue: "time",
      exec: (): void => {
        UpdateConfig.setMode("time");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeWords",
      display: "words",
      configValue: "words",
      exec: (): void => {
        UpdateConfig.setMode("words");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeQuote",
      display: "quote",
      configValue: "quote",
      exec: (): void => {
        UpdateConfig.setMode("quote");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeCustom",
      display: "custom",
      configValue: "custom",
      exec: (): void => {
        UpdateConfig.setMode("custom");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeZen",
      display: "zen",
      configValue: "zen",
      exec: (): void => {
        UpdateConfig.setMode("zen");
        ManualRestart.set();
        TestLogic.restart();
      },
    },
  ],
};

const commandsTimeConfig: MonkeyTypes.CommandsGroup = {
  title: "Change time config...",
  configKey: "time",
  list: [
    {
      id: "changeTimeConfig15",
      display: "15",
      configValue: 15,
      exec: (): void => {
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig(15);
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig30",
      display: "30",
      configValue: 30,
      exec: (): void => {
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig(30);
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig60",
      display: "60",
      configValue: 60,
      exec: (): void => {
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig(60);
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig120",
      display: "120",
      configValue: 120,
      exec: (): void => {
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig(120);
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfigCustom",
      display: "custom...",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig(parseInt(input));
        TestLogic.restart();
      },
    },
  ],
};

const commandsConfidenceMode: MonkeyTypes.CommandsGroup = {
  title: "Confidence mode...",
  configKey: "confidenceMode",
  list: [
    {
      id: "changeConfidenceModeOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setConfidenceMode("off");
      },
    },
    {
      id: "changeConfidenceModeOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setConfidenceMode("on");
      },
    },
    {
      id: "changeConfidenceModeMax",
      display: "max",
      configValue: "max",
      exec: (): void => {
        UpdateConfig.setConfidenceMode("max");
      },
    },
  ],
};

const commandsStopOnError: MonkeyTypes.CommandsGroup = {
  title: "Stop on error...",
  configKey: "stopOnError",
  list: [
    {
      id: "changeStopOnErrorOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setStopOnError("off");
      },
    },
    {
      id: "changeStopOnErrorLetter",
      display: "letter",
      configValue: "letter",
      exec: (): void => {
        UpdateConfig.setStopOnError("letter");
      },
    },
    {
      id: "changeStopOnErrorWord",
      display: "word",
      configValue: "word",
      exec: (): void => {
        UpdateConfig.setStopOnError("word");
      },
    },
  ],
};

const commandsFontSize: MonkeyTypes.CommandsGroup = {
  title: "Font size...",
  configKey: "fontSize",
  list: [
    {
      id: "changeFontSize1",
      display: "1x",
      configValue: "1",
      exec: (): void => {
        UpdateConfig.setFontSize("1");
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize125",
      display: "1.25x",
      configValue: "125",
      exec: (): void => {
        UpdateConfig.setFontSize("125");
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize15",
      display: "1.5x",
      configValue: "15",
      exec: (): void => {
        UpdateConfig.setFontSize("15");
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize2",
      display: "2x",
      configValue: "2",
      exec: (): void => {
        UpdateConfig.setFontSize("2");
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize3",
      display: "3x",
      configValue: "3",
      exec: (): void => {
        UpdateConfig.setFontSize("3");
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize4",
      display: "4x",
      configValue: "4",
      exec: (): void => {
        UpdateConfig.setFontSize("4");
        TestLogic.restart();
      },
    },
  ],
};

const commandsPageWidth: MonkeyTypes.CommandsGroup = {
  title: "Page width...",
  configKey: "pageWidth",
  list: [
    {
      id: "setPageWidth100",
      display: "100",
      configValue: "100",
      exec: (): void => {
        UpdateConfig.setPageWidth("100");
      },
    },
    {
      id: "setPageWidth125",
      display: "125",
      configValue: "125",
      exec: (): void => {
        UpdateConfig.setPageWidth("125");
      },
    },
    {
      id: "setPageWidth150",
      display: "150",
      configValue: "150",
      exec: (): void => {
        UpdateConfig.setPageWidth("150");
      },
    },
    {
      id: "setPageWidth200",
      display: "200",
      configValue: "200",
      exec: (): void => {
        UpdateConfig.setPageWidth("200");
      },
    },
    {
      id: "setPageWidthMax",
      display: "max",
      configValue: "max",
      exec: (): void => {
        UpdateConfig.setPageWidth("max");
      },
    },
  ],
};

const commandsPractiseWords: MonkeyTypes.CommandsGroup = {
  title: "Practice words...",
  list: [
    {
      id: "practiseWordsMissed",
      display: "missed",
      noIcon: true,
      exec: (): void => {
        PractiseWords.init(true, false);
        TestLogic.restart(false, false, undefined, true);
      },
    },
    {
      id: "practiseWordsSlow",
      display: "slow",
      noIcon: true,
      exec: (): void => {
        PractiseWords.init(false, true);
        TestLogic.restart(false, false, undefined, true);
      },
    },
    {
      id: "practiseWordsBoth",
      display: "both",
      noIcon: true,
      exec: (): void => {
        PractiseWords.init(true, true);
        TestLogic.restart(false, false, undefined, true);
      },
    },
  ],
};

export const themeCommands: MonkeyTypes.CommandsGroup = {
  title: "Theme...",
  configKey: "theme",
  list: [],
};

Misc.getThemesList().then((themes) => {
  themes.forEach((theme) => {
    themeCommands.list.push({
      id: "changeTheme" + Misc.capitalizeFirstLetterOfEachWord(theme.name),
      display: theme.name.replace(/_/g, " "),
      configValue: theme.name,
      hover: (): void => {
        // previewTheme(theme.name);
        ThemeController.preview(theme.name, false);
      },
      exec: (): void => {
        UpdateConfig.setTheme(theme.name);
      },
    });
  });
});

export const commandsChallenges: MonkeyTypes.CommandsGroup = {
  title: "Load challenge...",
  list: [],
};

Misc.getChallengeList().then((challenges) => {
  challenges.forEach((challenge) => {
    commandsChallenges.list.push({
      id:
        "loadChallenge" + Misc.capitalizeFirstLetterOfEachWord(challenge.name),
      noIcon: true,
      display: challenge.display,
      exec: (): void => {
        PageController.change("test");
        ChallengeController.setup(challenge.name);
        TestLogic.restart(false, true);
      },
    });
  });
});

// export function showFavouriteThemesAtTheTop() {
export function updateThemeCommands(): void {
  if (Config.favThemes.length > 0) {
    themeCommands.list = [];
    Config.favThemes.forEach((theme: string) => {
      themeCommands.list.push({
        id: "changeTheme" + Misc.capitalizeFirstLetterOfEachWord(theme),
        display: theme.replace(/_/g, " "),
        hover: (): void => {
          // previewTheme(theme);
          ThemeController.preview(theme, false);
        },
        exec: (): void => {
          UpdateConfig.setTheme(theme);
        },
      });
    });
    Misc.getThemesList().then((themes) => {
      themes.forEach((theme) => {
        if ((Config.favThemes as string[]).includes(theme.name)) return;
        themeCommands.list.push({
          id: "changeTheme" + Misc.capitalizeFirstLetterOfEachWord(theme.name),
          display: theme.name.replace(/_/g, " "),
          hover: (): void => {
            // previewTheme(theme.name);
            ThemeController.preview(theme.name, false);
          },
          exec: (): void => {
            UpdateConfig.setTheme(theme.name);
          },
        });
      });
    });
  }
}

const commandsCopyWordsToClipboard: MonkeyTypes.CommandsGroup = {
  title: "Are you sure...",
  list: [
    {
      id: "copyNo",
      display: "Nevermind",
    },
    {
      id: "copyYes",
      display: "Yes, I am sure",
      exec: (): void => {
        const words = Misc.getWords();

        navigator.clipboard.writeText(words).then(
          () => {
            Notifications.add("Copied to clipboard", 1);
          },
          () => {
            Notifications.add("Failed to copy!", -1);
          }
        );
      },
    },
  ],
};

const commandsMonkeyPowerLevel: MonkeyTypes.CommandsGroup = {
  title: "Power mode...",
  configKey: "monkeyPowerLevel",
  list: [
    {
      id: "monkeyPowerLevelOff",
      display: "off",
      configValue: "off",
      exec: () => UpdateConfig.setMonkeyPowerLevel("off"),
    },
    {
      id: "monkeyPowerLevel1",
      display: "mellow",
      configValue: "1",
      exec: () => UpdateConfig.setMonkeyPowerLevel("1"),
    },
    {
      id: "monkeyPowerLevel2",
      display: "high",
      configValue: "2",
      exec: () => UpdateConfig.setMonkeyPowerLevel("2"),
    },
    {
      id: "monkeyPowerLevel3",
      display: "ultra",
      configValue: "3",
      exec: () => UpdateConfig.setMonkeyPowerLevel("3"),
    },
    {
      id: "monkeyPowerLevel4",
      display: "over 9000",
      configValue: "4",
      exec: () => UpdateConfig.setMonkeyPowerLevel("4"),
    },
  ],
};

export const defaultCommands: MonkeyTypes.CommandsGroup = {
  title: "",
  list: [
    {
      id: "changePunctuation",
      display: "Punctuation...",
      icon: "!?",
      subgroup: commandsPunctuation,
    },
    {
      id: "changeMode",
      display: "Mode...",
      icon: "fa-bars",
      subgroup: commandsMode,
    },
    {
      id: "changeTimeConfig",
      display: "Time...",
      icon: "fa-clock",
      subgroup: commandsTimeConfig,
    },
    {
      id: "changeWordCount",
      display: "Words...",
      alias: "words",
      icon: "fa-font",
      subgroup: commandsWordCount,
    },
    {
      id: "changeQuoteLength",
      display: "Quote length...",
      icon: "fa-quote-right",
      alias: "quotes",
      subgroup: commandsQuoteLengthConfig,
    },
    {
      visible: false,
      id: "changeTags",
      display: "Tags...",
      icon: "fa-tag",
      subgroup: commandsTags,
      beforeSubgroup: (): void => {
        updateTagCommands();
      },
      available: (): boolean => {
        return !!Auth.currentUser;
      },
      // exec: (): void => {
      //   updateTagCommands();
      //   current.push();
      //   Commandline.show();
      // },
    },
    {
      visible: false,
      id: "applyPreset",
      display: "Presets...",
      icon: "fa-sliders-h",
      subgroup: commandsPresets,
      beforeSubgroup: (): void => {
        updatePresetCommands();
      },
      available: (): boolean => {
        return !!Auth.currentUser;
      },
      // exec: (): void => {
      //   updatePresetCommands();
      //   current.push(commandsPresets);
      //   Commandline.show();
      // },
    },
    {
      id: "changeConfidenceMode",
      display: "Confidence mode...",
      icon: "fa-backspace",
      subgroup: commandsConfidenceMode,
    },
    {
      id: "changeStopOnError",
      display: "Stop on error...",
      icon: "fa-hand-paper",
      subgroup: commandsStopOnError,
    },
    {
      id: "changeNumbers",
      display: "Numbers...",
      icon: "15",
      subgroup: commandsNumbers,
    },
    {
      id: "changeSmoothCaret",
      display: "Smooth caret...",
      icon: "fa-i-cursor",
      subgroup: commandsSmoothCaret,
    },
    {
      id: "changeQuickTab",
      display: "Quick tab...",
      icon: "fa-redo-alt",
      subgroup: commandsQuickTab,
    },
    {
      id: "changeRepeatQuotes",
      display: "Repeat quotes...",
      icon: "fa-sync-alt",
      subgroup: commandsRepeatQuotes,
    },
    {
      id: "changeLiveWpm",
      display: "Live WPM...",
      icon: "fa-tachometer-alt",
      subgroup: commandsLiveWpm,
    },
    {
      id: "changeLiveAcc",
      display: "Live accuracy...",
      icon: "fa-percentage",
      subgroup: commandsLiveAcc,
    },
    {
      id: "changeLiveBurst",
      display: "Live burst...",
      icon: "fa-fire-alt",
      subgroup: commandsLiveBurst,
    },
    {
      id: "changeShowTimer",
      display: "Timer/progress...",
      icon: "fa-clock",
      subgroup: commandsShowTimer,
    },
    {
      id: "changeKeyTips",
      display: "Key tips...",
      icon: "fa-question",
      subgroup: commandsKeyTips,
    },
    {
      id: "changeFreedomMode",
      display: "Freedom mode...",
      subgroup: commandsFreedomMode,
    },
    {
      id: "changeStrictSpace",
      display: "Strict space...",
      icon: "fa-minus",
      subgroup: commandsStrictSpace,
    },
    {
      id: "changeBlindMode",
      display: "Blind mode...",
      icon: "fa-eye-slash",
      subgroup: commandsBlindMode,
    },
    {
      id: "changeShowWordsHistory",
      display: "Always show words history...",
      icon: "fa-align-left",
      subgroup: commandsShowWordsHistory,
    },
    {
      id: "changeIndicateTypos",
      display: "Indicate typos...",
      icon: "fa-exclamation",
      subgroup: commandsIndicateTypos,
    },
    {
      id: "changeHideExtraLetters",
      display: "Hide extra letters...",
      icon: "fa-eye-slash",
      subgroup: commandsHideExtraLetters,
    },
    {
      id: "changeQuickEnd",
      display: "Quick end...",
      icon: "fa-step-forward",
      subgroup: commandsQuickEnd,
    },
    {
      id: "singleListCommandLine",
      display: "Single list command line...",
      icon: "fa-list",
      subgroup: commandsSingleListCommandLine,
    },
    {
      id: "capsLockWarning",
      display: "Caps lock warning...",
      icon: "fa-exclamation-triangle",
      subgroup: commandsCapsLockWarning,
    },
    {
      id: "changeMinWpm",
      display: "Minimum wpm...",
      alias: "minimum",
      icon: "fa-bomb",
      subgroup: commandsMinWpm,
    },
    {
      id: "changeMinAcc",
      display: "Minimum accuracy...",
      alias: "minimum",
      icon: "fa-bomb",
      subgroup: commandsMinAcc,
    },
    {
      id: "changeMinBurst",
      display: "Minimum burst...",
      alias: "minimum",
      icon: "fa-bomb",
      subgroup: commandsMinBurst,
    },
    {
      id: "changeOppositeShiftMode",
      display: "Change opposite shift mode...",
      icon: "fa-exchange-alt",
      subgroup: commandsOppositeShiftMode,
    },
    {
      id: "changeSoundOnClick",
      display: "Sound on click...",
      icon: "fa-volume-up",
      subgroup: commandsSoundOnClick,
    },
    {
      id: "changeSoundOnError",
      display: "Sound on error...",
      icon: "fa-volume-mute",
      subgroup: commandsSoundOnError,
    },
    {
      id: "changeSoundVolume",
      display: "Sound volume...",
      icon: "fa-volume-down",
      subgroup: commandsSoundVolume,
    },
    {
      id: "changeFlipTestColors",
      display: "Flip test colors...",
      icon: "fa-adjust",
      subgroup: commandsFlipTestColors,
    },
    {
      id: "changeSmoothLineScroll",
      display: "Smooth line scroll...",
      icon: "fa-align-left",
      subgroup: commandsSmoothLineScroll,
    },
    {
      id: "changeAlwaysShowDecimal",
      display: "Always show decimal places...",
      icon: "00",
      subgroup: commandsAlwaysShowDecimal,
    },
    {
      id: "changeAlwaysShowCPM",
      display: "Always show CPM...",
      icon: "fa-tachometer-alt",
      subgroup: commandsAlwaysShowCPM,
    },
    {
      id: "changeStartGraphsAtZero",
      display: "Start graphs at zero...",
      icon: "fa-chart-line",
      subgroup: commandsStartGraphsAtZero,
    },
    {
      id: "changeSwapEscAndTab",
      display: "Swap esc and tab...",
      icon: "fa-exchange-alt",
      subgroup: commandsSwapEscAndTab,
    },
    {
      id: "changeLazyMode",
      display: "Lazy mode...",
      icon: "fa-couch",
      subgroup: commandsLazyMode,
    },
    {
      id: "changeShowAllLines",
      display: "Show all lines...",
      icon: "fa-align-left",
      subgroup: commandsShowAllLines,
    },
    {
      id: "changeColorfulMode",
      display: "Colorful mode...",
      icon: "fa-fill-drip",
      subgroup: commandsColorfulMode,
    },
    {
      id: "changeOutOfFocusWarning",
      display: "Out of focus warning...",
      icon: "fa-exclamation",
      subgroup: commandsOutOfFocusWarning,
    },
    {
      id: "setEnableAds",
      display: "Enable ads...",
      icon: "fa-ad",
      subgroup: commandsEnableAds,
    },
    {
      id: "changeTheme",
      display: "Theme...",
      icon: "fa-palette",
      subgroup: themeCommands,
    },
    {
      id: "setCustomTheme",
      display: "Custom theme...",
      icon: "fa-palette",
      subgroup: customThemeCommands,
    },
    {
      id: "setCustomThemeId",
      display: "Custom themes...",
      icon: "fa-palette",
      subgroup: customThemeListCommands,
      beforeSubgroup: (): void => updateCustomThemeListCommands(),
      available: (): boolean => {
        return Auth.currentUser !== null;
      },
    },
    {
      id: "changeRandomTheme",
      display: "Random theme...",
      icon: "fa-random",
      subgroup: commandsRandomTheme,
    },
    {
      id: "randomizeTheme",
      display: "Next random theme",
      icon: "fa-random",
      exec: (): void => ThemeController.randomizeTheme(),
      available: (): boolean => {
        return Config.randomTheme !== "off";
      },
    },
    {
      id: "changeDifficulty",
      display: "Difficulty...",
      icon: "fa-star",
      subgroup: commandsDifficulty,
    },
    {
      id: "changeCaretStyle",
      display: "Caret style...",
      icon: "fa-i-cursor",
      subgroup: commandsCaretStyle,
    },
    {
      id: "changePaceCaret",
      display: "Pace caret mode...",
      icon: "fa-i-cursor",
      subgroup: commandsPaceCaret,
    },
    {
      id: "changePaceCaretStyle",
      display: "Pace caret style...",
      icon: "fa-i-cursor",
      subgroup: commandsPaceCaretStyle,
    },
    {
      id: "changeRepeatedPace",
      display: "Repeated pace...",
      icon: "fa-i-cursor",
      subgroup: commandsRepeatedPace,
    },
    {
      id: "changeTimerStyle",
      display: "Timer/progress style...",
      icon: "fa-clock",
      subgroup: commandsTimerStyle,
    },
    {
      id: "changeTimerColor",
      display: "Timer/progress color...",
      icon: "fa-clock",
      subgroup: commandsTimerColor,
    },
    {
      id: "changeTimerOpacity",
      display: "Timer/progress opacity...",
      icon: "fa-clock",
      subgroup: commandsTimerOpacity,
    },
    {
      id: "changeHighlightMode",
      display: "Highlight mode...",
      icon: "fa-highlighter",
      subgroup: commandsHighlightMode,
    },
    {
      id: "changeTapeMode",
      display: "Tape mode...",
      icon: "fa-tape",
      subgroup: commandsTapeMode,
    },
    {
      id: "changeShowAverage",
      display: "Show average...",
      icon: "fa-chart-bar",
      subgroup: commandsShowAverage,
    },
    {
      id: "changeCustomBackground",
      display: "Custom background...",
      icon: "fa-image",
      defaultValue: "",
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setCustomBackground(input);
      },
    },
    {
      id: "changeLanguage",
      display: "Language...",
      icon: "fa-language",
      subgroup: commandsLanguages,
    },
    {
      id: "changeBritishEnglish",
      display: "British english...",
      icon: "fa-language",
      subgroup: commandsBritishEnglish,
    },
    {
      id: "changeFunbox",
      display: "Funbox...",
      alias: "fun box",
      icon: "fa-gamepad",
      subgroup: commandsFunbox,
    },
    {
      id: "changeLayout",
      display: "Layout emulator...",
      icon: "fa-keyboard",
      subgroup: commandsLayouts,
    },
    {
      id: "toggleKeymap",
      display: "Keymap mode...",
      icon: "fa-keyboard",
      alias: "keyboard",
      subgroup: commandsKeymapMode,
    },
    {
      id: "changeKeymapStyle",
      display: "Keymap style...",
      alias: "keyboard",
      icon: "fa-keyboard",
      subgroup: commandsKeymapStyle,
    },
    {
      id: "changeKeymapLegendStyle",
      display: "Keymap legend style...",
      alias: "keyboard",
      icon: "fa-keyboard",
      subgroup: commandsKeymapLegendStyle,
    },
    {
      id: "changeKeymapLayout",
      display: "Keymap layout...",
      alias: "keyboard",
      icon: "fa-keyboard",
      subgroup: commandsKeymapLayouts,
    },
    {
      id: "changeCustomLayoutfluid",
      display: "Custom layoutfluid...",
      defaultValue: "qwerty dvorak colemak",
      input: true,
      icon: "fa-tint",
      exec: (input): void => {
        if (input === undefined) return;
        UpdateConfig.setCustomLayoutfluid(
          input as MonkeyTypes.CustomLayoutFluidSpaces
        );
        if (Config.funbox === "layoutfluid") TestLogic.restart();
        // UpdateConfig.setLayout(
        //   Config.customLayoutfluid
        //     ? Config.customLayoutfluid.split("_")[0]
        //     : "qwerty"
        // );
        // UpdateConfig.setKeymapLayout(
        //   Config.customLayoutfluid
        //     ? Config.customLayoutfluid.split("_")[0]
        //     : "qwerty"
        // );
      },
    },
    {
      id: "changeFontSize",
      display: "Font size...",
      icon: "fa-font",
      subgroup: commandsFontSize,
    },
    {
      id: "changeFontFamily",
      display: "Font family...",
      icon: "fa-font",
      subgroup: commandsFonts,
    },
    {
      id: "changePageWidth",
      display: "Page width...",
      icon: "fa-arrows-alt-h",
      subgroup: commandsPageWidth,
    },
    {
      id: "viewTypingPage",
      display: "View Typing Page",
      alias: "start begin type test",
      icon: "fa-keyboard",
      exec: (): void => {
        $("#top #menu .text-button.view-start").trigger("click");
      },
    },
    {
      id: "viewLeaderboards",
      display: "View Leaderboards Page",
      icon: "fa-crown",
      exec: (): void => {
        $("#top #menu .text-button.view-leaderboards").trigger("click");
      },
    },
    {
      id: "viewAbout",
      display: "View About Page",
      icon: "fa-info",
      exec: (): void => {
        $("#top #menu .text-button.view-about").trigger("click");
      },
    },
    {
      id: "viewSettings",
      display: "View Settings Page",
      icon: "fa-cog",
      exec: (): void => {
        $("#top #menu .text-button.view-settings").trigger("click");
      },
    },
    {
      id: "viewQuoteSearchPopup",
      display: "Search for quotes",
      icon: "fa-search",
      exec: (): void => {
        UpdateConfig.setMode("quote");
        $("#quote-search-button").trigger("click");
      },
      shouldFocusTestUI: false,
    },
    {
      id: "viewAccount",
      display: "View Account Page",
      icon: "fa-user",
      alias: "stats",
      exec: (): void => {
        $("#top #menu .text-button.view-account").hasClass("hidden")
          ? $("#top #menu .text-button.view-login").trigger("click")
          : $("#top #menu .text-button.view-account").trigger("click");
      },
    },
    {
      id: "toggleFullscreen",
      display: "Toggle Fullscreen",
      icon: "fa-expand",
      exec: (): void => {
        Misc.toggleFullscreen();
      },
    },
    {
      id: "bailOut",
      display: "Bail out...",
      icon: "fa-running",
      subgroup: {
        title: "Are you sure...",
        list: [
          {
            id: "bailOutNo",
            display: "Nevermind",
            available: (): boolean => {
              return canBailOut();
            },
          },
          {
            id: "bailOutForSure",
            display: "Yes, I am sure",
            exec: (): void => {
              TestInput.setBailout(true);
              TestLogic.finish();
            },
            available: (): boolean => {
              return canBailOut();
            },
          },
        ],
      },
      visible: false,
      available: (): boolean => {
        return canBailOut();
      },
    },
    {
      id: "loadChallenge",
      display: "Load challenge...",
      icon: "fa-award",
      subgroup: commandsChallenges,
    },
    {
      id: "joinDiscord",
      display: "Join the Discord server",
      icon: "fa-users",
      exec: (): void => {
        window.open("https://discord.gg/monkeytype");
      },
    },
    {
      id: "repeatTest",
      display: "Repeat test",
      icon: "fa-sync-alt",
      exec: (): void => {
        TestLogic.restart(true);
      },
      available: (): boolean => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "practiseWords",
      display: "Practice words...",
      icon: "fa-exclamation-triangle",
      subgroup: commandsPractiseWords,
      available: (): boolean => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "toggleWordHistory",
      display: "Toggle word history",
      icon: "fa-align-left",
      exec: (): void => {
        TestUI.toggleResultWords();
      },
      available: (): boolean => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "saveScreenshot",
      display: "Save screenshot",
      icon: "fa-image",
      alias: "ss picture",
      exec: (): void => {
        setTimeout(() => {
          TestUI.screenshot();
        }, 500);
      },
      available: (): boolean => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "changeCustomModeText",
      display: "Change custom text",
      icon: "fa-align-left",
      exec: (): void => {
        CustomTextPopup.show();
      },
    },
    {
      id: "toggleMonkey",
      display: "Toggle Monkey",
      icon: "fa-egg",
      visible: false,
      exec: (): void => {
        UpdateConfig.setMonkey(!Config.monkey);
      },
    },
    {
      id: "copyWordsToClipboard",
      display: "Copy words to clipboard",
      icon: "fa-copy",
      subgroup: true,
      exec: (): void => {
        current.push(commandsCopyWordsToClipboard);
      },
    },
    {
      id: "importSettingsJSON",
      display: "Import settings JSON",
      icon: "fa-cog",
      alias: "import config",
      input: true,
      exec: (input): void => {
        if (!input) return;
        try {
          UpdateConfig.apply(JSON.parse(input));
          UpdateConfig.saveFullConfigToLocalStorage();
          Settings.update();
          Notifications.add("Done", 1);
        } catch (e) {
          Notifications.add(
            "An error occured while importing settings: " + e,
            -1
          );
        }
      },
    },
    {
      id: "exportSettingsJSON",
      display: "Export settings JSON",
      icon: "fa-cog",
      alias: "export config",
      input: true,
      defaultValue: "",
    },
    {
      id: "monkeyPower",
      display: "Power mode...",
      alias: "powermode",
      icon: "fa-egg",
      visible: false,
      subgroup: commandsMonkeyPowerLevel,
    },
    {
      id: "shareTestSettings",
      display: "Share test settings",
      icon: "fa-share",
      exec: async (): Promise<void> => {
        ShareTestSettingsPopup.show();
      },
    },
    {
      id: "clearSwCache",
      display: "Clear SW cache",
      icon: "fa-cog",
      exec: async (): Promise<void> => {
        const clist = await caches.keys();
        for (const name of clist) {
          await caches.delete(name);
        }
        window.location.reload();
      },
    },
    {
      id: "getSwCache",
      display: "Get SW cache",
      icon: "fa-cog",
      exec: async (): Promise<void> => {
        alert(await caches.keys());
      },
    },
  ],
};

current = [defaultCommands];

export function setCurrent(val: MonkeyTypes.CommandsGroup[]): void {
  current = val;
}

export function pushCurrent(val: MonkeyTypes.CommandsGroup): void {
  current.push(val);
}

const listsObject = {
  commandsChallenges,
  commandsLanguages,
  commandsDifficulty,
  commandsLazyMode,
  commandsPaceCaret,
  commandsShowAverage,
  commandsMinWpm,
  commandsMinAcc,
  commandsMinBurst,
  commandsFunbox,
  commandsConfidenceMode,
  commandsStopOnError,
  commandsLayouts,
  commandsOppositeShiftMode,
  commandsTags,
};

export type ListsObjectKeys = keyof typeof listsObject;

export function getList(list: ListsObjectKeys): MonkeyTypes.CommandsGroup {
  return listsObject[list];
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "saveToLocalStorage") {
    defaultCommands.list.filter(
      (command) => command.id == "exportSettingsJSON"
    )[0].defaultValue = eventValue as string;
  }
  if (eventKey === "customBackground") {
    defaultCommands.list.filter(
      (command) => command.id == "changeCustomBackground"
    )[0].defaultValue = eventValue as string;
  }
  if (eventKey === "customLayoutFluid") {
    defaultCommands.list.filter(
      (command) => command.id == "changeCustomLayoutfluid"
    )[0].defaultValue = (eventValue as string)?.replace(/#/g, " ");
  }
});
