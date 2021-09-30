import * as DB from "./db";
import * as Misc from "./misc";
import layouts from "./layouts";
import * as Notifications from "./notifications";
import * as Sound from "./sound";
import * as ThemeController from "./theme-controller";
import * as CustomTextPopup from "./custom-text-popup";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as PractiseWords from "./practise-words";
import * as TestUI from "./test-ui";
import * as TestLogic from "./test-logic";
import * as Funbox from "./funbox";
import * as TagController from "./tag-controller";
import * as PresetController from "./preset-controller";
import * as Commandline from "./commandline";
import * as CustomText from "./custom-text";
import * as Settings from "./settings";
import * as ChallengeController from "./challenge-controller";

export let current = [];

function canBailOut() {
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

let commandsLayouts = {
  title: "Layout...",
  configKey: "layout",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

if (Object.keys(layouts).length > 0) {
  commandsLayouts.list = [];
  Object.keys(layouts).forEach((layout) => {
    commandsLayouts.list.push({
      id: "changeLayout" + Misc.capitalizeFirstLetter(layout),
      display: layout.replace(/_/g, " "),
      configValue: layout,
      exec: () => {
        // UpdateConfig.setSavedLayout(layout);
        UpdateConfig.setLayout(layout);
        TestLogic.restart();
      },
    });
  });
}

export let commandsKeymapLayouts = {
  title: "Change keymap layout...",
  configKey: "keymapLayout",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

if (Object.keys(layouts).length > 0) {
  commandsKeymapLayouts.list = [];
  commandsKeymapLayouts.list.push({
    id: "changeKeymapLayoutOverrideSync",
    display: "override sync",
    configValue: "overrideSync",
    exec: () => {
      UpdateConfig.setKeymapLayout("overrideSync");
      TestLogic.restart();
    },
  });
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      commandsKeymapLayouts.list.push({
        id: "changeKeymapLayout" + Misc.capitalizeFirstLetter(layout),
        display: layout.replace(/_/g, " "),
        configValue: layout,
        exec: () => {
          UpdateConfig.setKeymapLayout(layout);
          TestLogic.restart();
        },
      });
    }
  });
}

let commandsLanguages = {
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
      id: "changeLanguage" + Misc.capitalizeFirstLetter(language),
      display: language.replace(/_/g, " "),
      configValue: language,
      exec: () => {
        UpdateConfig.setLanguage(language);
        TestLogic.restart();
      },
    });
  });
});

let commandsFunbox = {
  title: "Funbox...",
  configKey: "funbox",
  list: [
    {
      id: "changeFunboxNone",
      display: "none",
      configValue: "none",
      alias: "off",
      exec: () => {
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
      exec: () => {
        if (Funbox.setFunbox(funbox.name, funbox.type)) {
          TestLogic.restart();
        }
      },
    });
  });
});

let commandsFonts = {
  title: "Font family...",
  configKey: "fontFamily",
  list: [],
};

Misc.getFontsList().then((fonts) => {
  fonts.forEach((font) => {
    commandsFonts.list.push({
      id: "changeFont" + font.name.replace(/ /g, "_"),
      display: font.display !== undefined ? font.display : font.name,
      configValue: font.name,
      hover: () => {
        UpdateConfig.previewFontFamily(font.name);
      },
      exec: () => {
        UpdateConfig.setFontFamily(font.name.replace(/ /g, "_"));
      },
    });
  });
  commandsFonts.list.push({
    id: "setFontFamilyCustom",
    display: "custom...",
    input: true,
    hover: () => {
      UpdateConfig.previewFontFamily(Config.fontFamily);
    },
    exec: (name) => {
      UpdateConfig.setFontFamily(name.replace(/\s/g, "_"));
      // Settings.groups.fontFamily.updateButton();
    },
  });
});

let commandsTags = {
  title: "Change tags...",
  list: [],
};

export function updateTagCommands() {
  if (DB.getSnapshot()?.tags?.length > 0) {
    commandsTags.list = [];

    commandsTags.list.push({
      id: "clearTags",
      display: `Clear tags`,
      icon: "fa-times",
      exec: () => {
        DB.getSnapshot().tags.forEach((tag) => {
          tag.active = false;
        });
        TestUI.updateModesNotice();
        TagController.saveActiveToLocalStorage();
      },
    });

    DB.getSnapshot().tags.forEach((tag) => {
      let dis = tag.name;

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
        exec: () => {
          TagController.toggle(tag._id);
          TestUI.updateModesNotice();
          let txt = tag.name;

          if (tag.active === true) {
            txt = '<i class="fas fa-fw fa-check"></i>' + txt;
          } else {
            txt = '<i class="fas fa-fw"></i>' + txt;
          }
          if (Commandline.isSingleListCommandLineActive()) {
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
    // defaultCommands.list[4].visible = true;
  }
}

let commandsPresets = {
  title: "Presets...",
  list: [],
};

export function updatePresetCommands() {
  if (DB.getSnapshot()?.presets?.length > 0) {
    commandsPresets.list = [];

    DB.getSnapshot().presets.forEach((preset) => {
      let dis = preset.name;

      commandsPresets.list.push({
        id: "applyPreset" + preset._id,
        display: dis,
        exec: () => {
          PresetController.apply(preset._id);
          TestUI.updateModesNotice();
        },
      });
    });
  }
}

let commandsRepeatQuotes = {
  title: "Repeat quotes...",
  configKey: "repeatQuotes",
  list: [
    {
      id: "setRepeatQuotesOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setRepeatQuotes("off");
      },
    },
    {
      id: "setRepeatQuotesTyping",
      display: "typing",
      configValue: "typing",
      exec: () => {
        UpdateConfig.setRepeatQuotes("typing");
      },
    },
  ],
};

let commandsLiveWpm = {
  title: "Live WPM...",
  configKey: "showLiveWpm",
  list: [
    {
      id: "setLiveWpmOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowLiveWpm(false);
      },
    },
    {
      id: "setLiveWpmOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowLiveWpm(true);
      },
    },
  ],
};

let commandsLiveAcc = {
  title: "Live accuracy...",
  configKey: "showLiveAcc",
  list: [
    {
      id: "setLiveAccOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowLiveAcc(false);
      },
    },
    {
      id: "setLiveAccOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowLiveAcc(true);
      },
    },
  ],
};

let commandsLiveBurst = {
  title: "Live burst...",
  configKey: "showLiveBurst",
  list: [
    {
      id: "setLiveBurstOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowLiveBurst(false);
      },
    },
    {
      id: "setLiveBurstOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowLiveBurst(true);
      },
    },
  ],
};

let commandsShowTimer = {
  title: "Timer/progress...",
  configKey: "showTimerProgress",
  list: [
    {
      id: "setTimerProgressOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowTimerProgress(false);
      },
    },
    {
      id: "setTimerProgressOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowTimerProgress(true);
      },
    },
  ],
};

let commandsKeyTips = {
  title: "Key tips...",
  configKey: "showKeyTips",
  list: [
    {
      id: "setKeyTipsOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setKeyTips(false);
      },
    },
    {
      id: "setKeyTipsOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setKeyTips(true);
      },
    },
  ],
};

let commandsFreedomMode = {
  title: "Freedom mode...",
  configKey: "freedomMode",
  list: [
    {
      id: "setfreedomModeOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setFreedomMode(false);
      },
    },
    {
      id: "setfreedomModeOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setFreedomMode(true);
      },
    },
  ],
};

let commandsStrictSpace = {
  title: "Strict space...",
  configKey: "strictSpace",
  list: [
    {
      id: "setStrictSpaceOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setStrictSpace(false);
      },
    },
    {
      id: "setStrictSpaceOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setStrictSpace(true);
      },
    },
  ],
};

let commandsBlindMode = {
  title: "Blind mode...",
  configKey: "blindMode",
  list: [
    {
      id: "setBlindModeOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setBlindMode(false);
      },
    },
    {
      id: "setBlindModeOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setBlindMode(true);
      },
    },
  ],
};

let commandsShowWordsHistory = {
  title: "Always show words history...",
  configKey: "alwaysShowWordsHistory",
  list: [
    {
      id: "setAlwaysShowWordsHistoryOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setAlwaysShowWordsHistory(false);
      },
    },
    {
      id: "setAlwaysShowWordsHistoryOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setAlwaysShowWordsHistory(true);
      },
    },
  ],
};

let commandsIndicateTypos = {
  title: "Indicate typos...",
  configKey: "indicateTypos",
  list: [
    {
      id: "setIndicateTyposOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setIndicateTypos(false);
      },
    },
    {
      id: "setIndicateTyposOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setIndicateTypos(true);
      },
    },
  ],
};

let commandsHideExtraLetters = {
  title: "Hide extra letters...",
  configKey: "hideExtraLetters",
  list: [
    {
      id: "setHideExtraLettersOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setHideExtraLetters(false);
      },
    },
    {
      id: "setHideExtraLettersOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setHideExtraLetters(true);
      },
    },
  ],
};

let commandsQuickEnd = {
  title: "Quick end...",
  configKey: "quickEnd",
  list: [
    {
      id: "setQuickEndOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setQuickEnd(false);
      },
    },
    {
      id: "setQuickEndOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setQuickEnd(true);
      },
    },
  ],
};

let commandsOppositeShiftMode = {
  title: "Change opposite shift mode...",
  configKey: "oppositeShiftMode",
  list: [
    {
      id: "setOppositeShiftModeOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setOppositeShiftMode("off");
        TestUI.updateModesNotice();
      },
    },
    {
      id: "setOppositeShiftModeOn",
      display: "on",
      configValue: "on",
      exec: () => {
        UpdateConfig.setOppositeShiftMode("on");
        TestUI.updateModesNotice();
      },
    },
  ],
};

let commandsSoundOnError = {
  title: "Sound on error...",
  configKey: "playSoundOnError",
  list: [
    {
      id: "setPlaySoundOnErrorOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setPlaySoundOnError(false);
      },
    },
    {
      id: "setPlaySoundOnErrorOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setPlaySoundOnError(true);
      },
    },
  ],
};

let commandsFlipTestColors = {
  title: "Flip test colors...",
  configKey: "flipTestColors",
  list: [
    {
      id: "setFlipTestColorsOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setFlipTestColors(false);
      },
    },
    {
      id: "setFlipTestColorsOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setFlipTestColors(true);
      },
    },
  ],
};

let commandsSmoothLineScroll = {
  title: "Smooth line scroll...",
  configKey: "smoothLineScroll",
  list: [
    {
      id: "setSmoothLineScrollOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setSmoothLineScroll(false);
      },
    },
    {
      id: "setSmoothLineScrollOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setSmoothLineScroll(true);
      },
    },
  ],
};

let commandsAlwaysShowDecimal = {
  title: "Always show decimal places...",
  configKey: "alwaysShowDecimalPlaces",
  list: [
    {
      id: "setAlwaysShowDecimalPlacesOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setAlwaysShowDecimalPlaces(false);
      },
    },
    {
      id: "setAlwaysShowDecimalPlacesOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setAlwaysShowDecimalPlaces(true);
      },
    },
  ],
};

let commandsAlwaysShowCPM = {
  title: "Always show CPM...",
  configKey: "alwaysShowCPM",
  list: [
    {
      id: "setAlwaysShowCPMOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setAlwaysShowCPM(false);
      },
    },
    {
      id: "setAlwaysShowCPMOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setAlwaysShowCPM(true);
      },
    },
  ],
};

let commandsStartGraphsAtZero = {
  title: "Start graphs at zero...",
  configKey: "startGraphsAtZero",
  list: [
    {
      id: "setStartGraphsAtZeroOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setStartGraphsAtZero(false);
      },
    },
    {
      id: "setStartGraphsAtZeroOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setStartGraphsAtZero(true);
      },
    },
  ],
};

let commandsLazyMode = {
  title: "Lazy mode...",
  configKey: "lazyMode",
  list: [
    {
      id: "setLazyModeOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setLazyMode(false);
        TestLogic.restart();
      },
    },
    {
      id: "setLazyModeOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setLazyMode(true);
        TestLogic.restart();
      },
    },
  ],
};

let commandsSwapEscAndTab = {
  title: "Swap esc and tab...",
  configKey: "swapEscAndTab",
  list: [
    {
      id: "setSwapEscAndTabOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setSwapEscAndTab(false);
      },
    },
    {
      id: "setSwapEscAndTabOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setSwapEscAndTab(true);
      },
    },
  ],
};

let commandsShowAllLines = {
  title: "Show all lines...",
  configKey: "showAllLines",
  list: [
    {
      id: "setShowAllLinesOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowAllLines(false);
      },
    },
    {
      id: "setShowAllLinesOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowAllLines(true);
      },
    },
  ],
};

let commandsColorfulMode = {
  title: "Colorful mode...",
  configKey: "colorfulMode",
  list: [
    {
      id: "setColorfulModeOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setColorfulMode(false);
      },
    },
    {
      id: "setColorfulModeOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setColorfulMode(true);
      },
    },
  ],
};

let commandsOutOfFocusWarning = {
  title: "Colorful mode...",
  configKey: "showOutOfFocusWarning",
  list: [
    {
      id: "setShowOutOfFocusWarningOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowOutOfFocusWarning(false);
      },
    },
    {
      id: "setShowOutOfFocusWarningOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowOutOfFocusWarning(true);
      },
    },
  ],
};

let commandsKeymapMode = {
  title: "Keymap mode...",
  configKey: "keymapMode",
  list: [
    {
      id: "setKeymapModeOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setKeymapMode("off");
      },
    },
    {
      id: "setKeymapModeStatic",
      display: "static",
      configValue: "static",
      exec: () => {
        UpdateConfig.setKeymapMode("static");
      },
    },
    {
      id: "setKeymapModeNext",
      display: "next",
      configValue: "next",
      exec: () => {
        UpdateConfig.setKeymapMode("next");
      },
    },
    {
      id: "setKeymapModeReact",
      display: "react",
      configValue: "react",
      exec: () => {
        UpdateConfig.setKeymapMode("react");
      },
    },
  ],
};

let commandsSoundOnClick = {
  title: "Sound on click...",
  configKey: "playSoundOnClick",
  list: [
    {
      id: "setSoundOnClickOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("off");
      },
    },
    {
      id: "setSoundOnClick1",
      display: "click",
      configValue: "1",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("1");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick2",
      display: "beep",
      configValue: "2",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("2");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick3",
      display: "pop",
      configValue: "3",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("3");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick4",
      display: "nk creams",
      configValue: "4",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("4");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick5",
      display: "typewriter",
      configValue: "5",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("5");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick6",
      display: "osu",
      configValue: "6",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("6");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick7",
      display: "hitmarker",
      configValue: "7",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("7");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
  ],
};

let commandsRandomTheme = {
  title: "Random theme...",
  configKey: "randomTheme",
  list: [
    {
      id: "setRandomOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setRandomTheme("off");
      },
    },
    {
      id: "setRandomOn",
      display: "on",
      configValue: "on",
      exec: () => {
        UpdateConfig.setRandomTheme("on");
      },
    },
    {
      id: "setRandomFav",
      display: "fav",
      configValue: "fav",
      exec: () => {
        UpdateConfig.setRandomTheme("fav");
      },
    },
    {
      id: "setRandomLight",
      display: "light",
      configValue: "light",
      exec: () => {
        UpdateConfig.setRandomTheme("light");
      },
    },
    {
      id: "setRandomDark",
      display: "dark",
      configValue: "dark",
      exec: () => {
        UpdateConfig.setRandomTheme("dark");
      },
    },
  ],
};

let commandsDifficulty = {
  title: "Difficulty...",
  configKey: "difficulty",
  list: [
    {
      id: "setDifficultyNormal",
      display: "normal",
      configValue: "normal",
      exec: () => {
        UpdateConfig.setDifficulty("normal");
      },
    },
    {
      id: "setDifficultyExpert",
      display: "expert",
      configValue: "expert",
      exec: () => {
        UpdateConfig.setDifficulty("expert");
      },
    },
    {
      id: "setDifficultyMaster",
      display: "master",
      configValue: "master",
      exec: () => {
        UpdateConfig.setDifficulty("master");
      },
    },
  ],
};

export let commandsEnableAds = {
  title: "Set enable ads...",
  configKey: "enableAds",
  list: [
    {
      id: "setEnableAdsOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setEnableAds("off");
      },
    },
    {
      id: "setEnableAdsOn",
      display: "on",
      configValue: "on",
      exec: () => {
        UpdateConfig.setEnableAds("on");
      },
    },
    {
      id: "setEnableMax",
      display: "sellout",
      configValue: "max",
      exec: () => {
        UpdateConfig.setEnableAds("max");
      },
    },
  ],
};

let commandsCustomTheme = {
  title: "Custom theme...",
  configKey: "customTheme",
  list: [
    {
      id: "setCustomThemeOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setCustomTheme(false);
      },
    },
    {
      id: "setCustomThemeOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setCustomTheme(true);
      },
    },
  ],
};

let commandsCaretStyle = {
  title: "Change caret style...",
  configKey: "caretStyle",
  list: [
    {
      id: "setCaretStyleOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setCaretStyle("off");
      },
    },
    {
      id: "setCaretStyleDefault",
      display: "line",
      configValue: "default",
      exec: () => {
        UpdateConfig.setCaretStyle("default");
      },
    },
    {
      id: "setCaretStyleBlock",
      display: "block",
      configValue: "block",
      exec: () => {
        UpdateConfig.setCaretStyle("block");
      },
    },
    {
      id: "setCaretStyleOutline",
      display: "outline-block",
      configValue: "outline",
      exec: () => {
        UpdateConfig.setCaretStyle("outline");
      },
    },
    {
      id: "setCaretStyleUnderline",
      display: "underline",
      configValue: "underliner",
      exec: () => {
        UpdateConfig.setCaretStyle("underline");
      },
    },
    {
      id: "setCaretStyleCarrot",
      display: "carrot",
      configValue: "carrot",
      visible: false,
      exec: () => {
        UpdateConfig.setCaretStyle("carrot");
      },
    },
    {
      id: "setCaretStyleBanana",
      display: "banana",
      configValue: "banana",
      visible: false,
      exec: () => {
        UpdateConfig.setCaretStyle("banana");
      },
    },
  ],
};

let commandsPaceCaretStyle = {
  title: "Change pace caret style...",
  configKey: "paceCaretStyle",
  list: [
    {
      id: "setPaceCaretStyleDefault",
      display: "line",
      configValue: "default",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("default");
      },
    },
    {
      id: "setPaceCaretStyleBlock",
      display: "block",
      configValue: "block",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("block");
      },
    },
    {
      id: "setPaceCaretStyleOutline",
      display: "outline-block",
      configValue: "outline",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("outline");
      },
    },
    {
      id: "setPaceCaretStyleUnderline",
      display: "underline",
      configValue: "underline",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("underline");
      },
    },
    {
      id: "setPaceCaretStyleCarrot",
      display: "carrot",
      configValue: "carrot",
      visible: false,
      exec: () => {
        UpdateConfig.setPaceCaretStyle("carrot");
      },
    },
    {
      id: "setPaceCaretStyleBanana",
      display: "banana",
      configValue: "banana",
      visible: false,
      exec: () => {
        UpdateConfig.setPaceCaretStyle("banana");
      },
    },
  ],
};

let commandsRepeatedPace = {
  title: "Repeated pace...",
  configKey: "repeatedPace",
  list: [
    {
      id: "setRepeatedPaceOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setRepeatedPace(false);
      },
    },
    {
      id: "setRepeatedPaceOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setRepeatedPace(true);
      },
    },
  ],
};

let commandsPaceCaret = {
  title: "Pace caret mode...",
  configKey: "paceCaret",
  list: [
    {
      id: "setPaceCaretOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setPaceCaret("off");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretPb",
      display: "pb",
      configValue: "pb",
      exec: () => {
        UpdateConfig.setPaceCaret("pb");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretAverage",
      display: "average",
      configValue: "average",
      exec: () => {
        UpdateConfig.setPaceCaret("average");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: (input) => {
        UpdateConfig.setPaceCaretCustomSpeed(input);
        UpdateConfig.setPaceCaret("custom");
        TestLogic.restart();
      },
    },
  ],
};

let commandsMinWpm = {
  title: "Change min wpm mode...",
  configKey: "minWpm",
  list: [
    {
      id: "setMinWpmOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setMinWpm("off");
      },
    },
    {
      id: "setMinWpmCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: (input) => {
        UpdateConfig.setMinWpmCustomSpeed(input);
        UpdateConfig.setMinWpm("custom");
      },
    },
  ],
};

let commandsMinAcc = {
  title: "Change min accuracy mode...",
  configKey: "minAcc",
  list: [
    {
      id: "setMinAccOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setMinAcc("off");
      },
    },
    {
      id: "setMinAccCustom",
      display: "custom...",
      configValue: "custom",
      input: true,
      exec: (input) => {
        UpdateConfig.setMinAccCustom(input);
        UpdateConfig.setMinAcc("custom");
      },
    },
  ],
};

let commandsMinBurst = {
  title: "Change min burst mode...",
  configKey: "minBurst",
  list: [
    {
      id: "setMinBurstOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setMinBurst("off");
      },
    },
    {
      id: "setMinBurstFixed",
      display: "fixed...",
      configValue: "fixed",
      input: true,
      exec: (input) => {
        UpdateConfig.setMinBurst("fixed");
        UpdateConfig.setMinBurstCustomSpeed(input);
      },
    },
    {
      id: "setMinBurstFlex",
      display: "flex...",
      configValue: "flex",
      input: true,
      exec: (input) => {
        UpdateConfig.setMinBurst("flex");
        UpdateConfig.setMinBurstCustomSpeed(input);
      },
    },
  ],
};

let commandsKeymapStyle = {
  title: "Keymap style...",
  configKey: "keymapStyle",
  list: [
    {
      id: "setKeymapStyleStaggered",
      display: "staggered",
      configValue: "staggered",
      exec: () => {
        UpdateConfig.setKeymapStyle("staggered");
      },
    },
    {
      id: "setKeymapStyleMatrix",
      display: "matrix",
      configValue: "matrix",
      exec: () => {
        UpdateConfig.setKeymapStyle("matrix");
      },
    },
    {
      id: "setKeymapStyleSplit",
      display: "split",
      configValue: "split",
      exec: () => {
        UpdateConfig.setKeymapStyle("split");
      },
    },
    {
      id: "setKeymapStyleSplitMatrix",
      display: "split matrix",
      configValue: "split_matrix",
      exec: () => {
        UpdateConfig.setKeymapStyle("split_matrix");
      },
    },
  ],
};

let commandsKeymapLegendStyle = {
  title: "Keymap legend style...",
  configKey: "keymapLegendStyle",
  list: [
    {
      id: "setKeymapLegendStyleLowercase",
      display: "lowercase",
      configValue: "lowercase",
      exec: () => {
        UpdateConfig.setKeymapLegendStyle("lowercase");
      },
    },
    {
      id: "setKeymapLegendStyleUppercase",
      display: "uppercase",
      configValue: "uppercase",
      exec: () => {
        UpdateConfig.setKeymapLegendStyle("uppercase");
      },
    },
    {
      id: "setKeymapLegendStyleBlank",
      display: "blank",
      configValue: "blank",
      exec: () => {
        UpdateConfig.setKeymapLegendStyle("blank");
      },
    },
  ],
};

let commandsBritishEnglish = {
  title: "British english...",
  configKey: "britishEnglish",
  list: [
    {
      id: "setBritishEnglishOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setBritishEnglish(false);
        TestLogic.restart();
      },
    },
    {
      id: "setBritishEnglishOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setBritishEnglish(true);
        TestLogic.restart();
      },
    },
  ],
};

let commandsHighlightMode = {
  title: "Highlight mode...",
  configKey: "highlightMode",
  list: [
    {
      id: "setHighlightModeOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setHighlightMode("off");
      },
    },
    {
      id: "setHighlightModeLetter",
      display: "letter",
      configValue: "letter",
      exec: () => {
        UpdateConfig.setHighlightMode("letter");
      },
    },
    {
      id: "setHighlightModeWord",
      display: "word",
      configValue: "word",
      exec: () => {
        UpdateConfig.setHighlightMode("word");
      },
    },
  ],
};

let commandsTimerStyle = {
  title: "Timer/progress style...",
  configKey: "timerStyle",
  list: [
    {
      id: "setTimerStyleBar",
      display: "bar",
      configValue: "bar",
      exec: () => {
        UpdateConfig.setTimerStyle("bar");
      },
    },
    {
      id: "setTimerStyleText",
      display: "text",
      configValue: "text",
      exec: () => {
        UpdateConfig.setTimerStyle("text");
      },
    },
    {
      id: "setTimerStyleMini",
      display: "mini",
      configValue: "mini",
      exec: () => {
        UpdateConfig.setTimerStyle("mini");
      },
    },
  ],
};

let commandsTimerColor = {
  title: "Timer/progress color...",
  configKey: "timerColor",
  list: [
    {
      id: "setTimerColorBlack",
      display: "black",
      configValue: "black",
      exec: () => {
        UpdateConfig.setTimerColor("bar");
      },
    },
    {
      id: "setTimerColorSub",
      display: "sub",
      configValue: "sub",
      exec: () => {
        UpdateConfig.setTimerColor("sub");
      },
    },
    {
      id: "setTimerColorText",
      display: "text",
      configValue: "text",
      exec: () => {
        UpdateConfig.setTimerColor("text");
      },
    },
    {
      id: "setTimerColorMain",
      display: "main",
      configValue: "main",
      exec: () => {
        UpdateConfig.setTimerColor("main");
      },
    },
  ],
};

let commandsSingleListCommandLine = {
  title: "Single list command line...",
  configKey: "singleListCommandLine",
  list: [
    {
      id: "singleListCommandLineManual",
      display: "manual",
      configValue: "manual",
      exec: () => {
        UpdateConfig.setSingleListCommandLine("manual");
      },
    },
    {
      id: "singleListCommandLineOn",
      display: "on",
      configValue: "on",
      exec: () => {
        UpdateConfig.setSingleListCommandLine("on");
      },
    },
  ],
};

let commandsTimerOpacity = {
  title: "Timer/progress opacity...",
  configKey: "timerOpacity",
  list: [
    {
      id: "setTimerOpacity.25",
      display: ".25",
      configValue: 0.25,
      exec: () => {
        UpdateConfig.setTimerOpacity(0.25);
      },
    },
    {
      id: "setTimerOpacity.5",
      display: ".5",
      configValue: 0.5,
      exec: () => {
        UpdateConfig.setTimerOpacity(0.5);
      },
    },
    {
      id: "setTimerOpacity.75",
      display: ".75",
      configValue: 0.75,
      exec: () => {
        UpdateConfig.setTimerOpacity(0.75);
      },
    },
    {
      id: "setTimerOpacity1",
      display: "1",
      configValue: 1,
      exec: () => {
        UpdateConfig.setTimerOpacity(1);
      },
    },
  ],
};

let commandsWordCount = {
  title: "Change word count...",
  configKey: "words",
  list: [
    {
      id: "changeWordCount10",
      display: "10",
      configValue: 10,
      exec: () => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount("10");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount25",
      display: "25",
      configValue: 25,
      exec: () => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount("25");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount50",
      display: "50",
      configValue: 50,
      exec: () => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount("50");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount100",
      display: "100",
      configValue: 100,
      exec: () => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount("100");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount200",
      display: "200",
      configValue: 200,
      exec: () => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount("200");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCountCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setMode("words");
        UpdateConfig.setWordCount(input);
        TestLogic.restart();
      },
    },
  ],
};

let commandsQuoteLengthConfig = {
  title: "Change quote length...",
  configKey: "quoteLength",
  list: [
    {
      id: "changeQuoteLengthAll",
      display: "all",
      configValue: [0, 1, 2, 3],
      exec: () => {
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
      exec: () => {
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
      exec: () => {
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
      exec: () => {
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
      exec: () => {
        UpdateConfig.setMode("quote");
        UpdateConfig.setQuoteLength(3);
        TestLogic.restart();
      },
    },
  ],
};

let commandsPunctuation = {
  title: "Change punctuation...",
  configKey: "punctuation",
  list: [
    {
      id: "changePunctuationOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setPunctuation(true);
        TestLogic.restart();
      },
    },
    {
      id: "changePunctuationOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setPunctuation(false);
        TestLogic.restart();
      },
    },
  ],
};

let commandsNumbers = {
  title: "Numbers...",
  configKey: "numbers",
  list: [
    {
      id: "changeNumbersOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setNumbers(true);
        TestLogic.restart();
      },
    },
    {
      id: "changeNumbersOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setNumbers(false);
        TestLogic.restart();
      },
    },
  ],
};

let commandsSmoothCaret = {
  title: "Smooth caret...",
  configKey: "smoothCaret",
  list: [
    {
      id: "changeSmoothCaretOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setSmoothCaret(true);
      },
    },
    {
      id: "changeSmoothCaretOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setSmoothCaret(false);
      },
    },
  ],
};

let commandsQuickTab = {
  title: "Quick tab...",
  configKey: "quickTab",
  list: [
    {
      id: "changeQuickTabOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setQuickTabMode(true);
      },
    },
    {
      id: "changeQuickTabOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setQuickTabMode(false);
      },
    },
  ],
};

let commandsMode = {
  title: "Change mode...",
  configKey: "mode",
  list: [
    {
      id: "changeModeTime",
      display: "time",
      configValue: "time",
      exec: () => {
        UpdateConfig.setMode("time");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeWords",
      display: "words",
      configValue: "words",
      exec: () => {
        UpdateConfig.setMode("words");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeQuote",
      display: "quote",
      configValue: "quote",
      exec: () => {
        UpdateConfig.setMode("quote");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeCustom",
      display: "custom",
      configValue: "custom",
      exec: () => {
        UpdateConfig.setMode("custom");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeZen",
      display: "zen",
      configValue: "zen",
      exec: () => {
        UpdateConfig.setMode("zen");
        ManualRestart.set();
        TestLogic.restart();
      },
    },
  ],
};

let commandsTimeConfig = {
  title: "Change time config...",
  configKey: "time",
  list: [
    {
      id: "changeTimeConfig15",
      display: "15",
      configValue: 15,
      exec: () => {
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig("15");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig30",
      display: "30",
      configValue: 30,
      exec: () => {
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig("30");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig60",
      display: "60",
      configValue: 60,
      exec: () => {
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig("60");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig120",
      display: "120",
      configValue: 120,
      exec: () => {
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig("120");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfigCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setMode("time");
        UpdateConfig.setTimeConfig(input);
        TestLogic.restart();
      },
    },
  ],
};

let commandsConfidenceMode = {
  title: "Confidence mode...",
  configKey: "confidenceMode",
  list: [
    {
      id: "changeConfidenceModeOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setConfidenceMode("off");
      },
    },
    {
      id: "changeConfidenceModeOn",
      display: "on",
      configValue: "on",
      exec: () => {
        UpdateConfig.setConfidenceMode("on");
      },
    },
    {
      id: "changeConfidenceModeMax",
      display: "max",
      configValue: "max",
      exec: () => {
        UpdateConfig.setConfidenceMode("max");
      },
    },
  ],
};

let commandsStopOnError = {
  title: "Stop on error...",
  configKey: "stopOnError",
  list: [
    {
      id: "changeStopOnErrorOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setStopOnError("off");
      },
    },
    {
      id: "changeStopOnErrorLetter",
      display: "letter",
      configValue: "letter",
      exec: () => {
        UpdateConfig.setStopOnError("letter");
      },
    },
    {
      id: "changeStopOnErrorWord",
      display: "word",
      configValue: "word",
      exec: () => {
        UpdateConfig.setStopOnError("word");
      },
    },
  ],
};

let commandsFontSize = {
  title: "Font size...",
  configKey: "fontSize",
  list: [
    {
      id: "changeFontSize1",
      display: "1x",
      configValue: 1,
      exec: () => {
        UpdateConfig.setFontSize(1);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize125",
      display: "1.25x",
      configValue: 125,
      exec: () => {
        UpdateConfig.setFontSize(125);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize15",
      display: "1.5x",
      configValue: 15,
      exec: () => {
        UpdateConfig.setFontSize(15);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize2",
      display: "2x",
      configValue: 2,
      exec: () => {
        UpdateConfig.setFontSize(2);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize3",
      display: "3x",
      configValue: 3,
      exec: () => {
        UpdateConfig.setFontSize(3);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize4",
      display: "4x",
      configValue: 4,
      exec: () => {
        UpdateConfig.setFontSize(4);
        TestLogic.restart();
      },
    },
  ],
};

let commandsPageWidth = {
  title: "Page width...",
  configKey: "pageWidth",
  list: [
    {
      id: "setPageWidth100",
      display: "100",
      configValue: "100",
      exec: () => {
        UpdateConfig.setPageWidth("100");
      },
    },
    {
      id: "setPageWidth125",
      display: "125",
      configValue: "125",
      exec: () => {
        UpdateConfig.setPageWidth("125");
      },
    },
    {
      id: "setPageWidth150",
      display: "150",
      configValue: "150",
      exec: () => {
        UpdateConfig.setPageWidth("150");
      },
    },
    {
      id: "setPageWidth200",
      display: "200",
      configValue: "200",
      exec: () => {
        UpdateConfig.setPageWidth("200");
      },
    },
    {
      id: "setPageWidthMax",
      display: "max",
      configValue: "max",
      exec: () => {
        UpdateConfig.setPageWidth("max");
      },
    },
  ],
};

let commandsPractiseWords = {
  title: "Practice words...",
  list: [
    {
      id: "practiseWordsMissed",
      display: "missed",
      noIcon: true,
      exec: () => {
        PractiseWords.init(true, false);
      },
    },
    {
      id: "practiseWordsSlow",
      display: "slow",
      noIcon: true,
      exec: () => {
        PractiseWords.init(false, true);
      },
    },
    {
      id: "practiseWordsBoth",
      display: "both",
      noIcon: true,
      exec: () => {
        PractiseWords.init(true, true);
      },
    },
  ],
};

export let themeCommands = {
  title: "Theme...",
  configKey: "theme",
  list: [],
};

Misc.getThemesList().then((themes) => {
  themes.forEach((theme) => {
    themeCommands.list.push({
      id: "changeTheme" + Misc.capitalizeFirstLetter(theme.name),
      display: theme.name.replace(/_/g, " "),
      configValue: theme.name,
      hover: () => {
        // previewTheme(theme.name);
        ThemeController.preview(theme.name);
      },
      exec: () => {
        UpdateConfig.setTheme(theme.name);
      },
    });
  });
});

export let commandsChallenges = {
  title: "Load challenge...",
  list: [],
};

Misc.getChallengeList().then((challenges) => {
  challenges.forEach((challenge) => {
    commandsChallenges.list.push({
      id: "loadChallenge" + Misc.capitalizeFirstLetter(challenge.name),
      noIcon: true,
      display: challenge.display,
      exec: () => {
        ChallengeController.setup(challenge.name);
      },
    });
  });
});

// export function showFavouriteThemesAtTheTop() {
export function updateThemeCommands() {
  if (Config.favThemes.length > 0) {
    themeCommands.list = [];
    Config.favThemes.forEach((theme) => {
      themeCommands.list.push({
        id: "changeTheme" + Misc.capitalizeFirstLetter(theme),
        display: theme.replace(/_/g, " "),
        hover: () => {
          // previewTheme(theme);
          ThemeController.preview(theme);
        },
        exec: () => {
          UpdateConfig.setTheme(theme);
        },
      });
    });
    Misc.getThemesList().then((themes) => {
      themes.forEach((theme) => {
        if (Config.favThemes.includes(theme.name)) return;
        themeCommands.list.push({
          id: "changeTheme" + Misc.capitalizeFirstLetter(theme.name),
          display: theme.name.replace(/_/g, " "),
          hover: () => {
            // previewTheme(theme.name);
            ThemeController.preview(theme.name);
          },
          exec: () => {
            UpdateConfig.setTheme(theme.name);
          },
        });
      });
    });
  }
}

let commandsCopyWordsToClipboard = {
  title: "Are you sure...",
  list: [
    {
      id: "copyNo",
      display: "Nevermind",
      exec: () => {},
    },
    {
      id: "copyYes",
      display: "Yes, I am sure",
      exec: () => {
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

let commandsMonkeyPowerLevel = {
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

export let defaultCommands = {
  title: "",
  list: [
    {
      id: "changePunctuation",
      display: "Punctuation...",
      subgroup: commandsPunctuation,
      icon: "!?",
      shift: {
        display: "Toggle punctuation",
        exec: () => {
          UpdateConfig.togglePunctuation();
        },
      },
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
      beforeSubgroup: () => {
        updateTagCommands();
      },
      // exec: () => {
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
      beforeSubgroup: () => {
        updatePresetCommands();
      },
      // exec: () => {
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
      id: "changeSoundOnClick",
      display: "Sound on click...",
      icon: "fa-volume-up",
      subgroup: commandsSoundOnClick,
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
      id: "changeSoundOnError",
      display: "Sound on error...",
      icon: "fa-volume-mute",
      subgroup: commandsSoundOnError,
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
      subgroup: commandsCustomTheme,
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
      exec: () => ThemeController.randomizeTheme(),
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
      id: "changeCustomBackground",
      display: "Custom background...",
      icon: "fa-image",
      defaultValue: "",
      input: true,
      exec: (input) => {
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
      display: "Layout...",
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
      exec: (input) => {
        UpdateConfig.setCustomLayoutfluid(input);
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
      exec: () => $("#top #menu .icon-button.view-start").click(),
    },
    {
      id: "viewLeaderboards",
      display: "View Leaderboards Page",
      icon: "fa-crown",
      exec: () => $("#top #menu .icon-button.view-leaderboards").click(),
    },
    {
      id: "viewAbout",
      display: "View About Page",
      icon: "fa-info",
      exec: () => $("#top #menu .icon-button.view-about").click(),
    },
    {
      id: "viewSettings",
      display: "View Settings Page",
      icon: "fa-cog",
      exec: () => $("#top #menu .icon-button.view-settings").click(),
    },
    {
      id: "viewAccount",
      display: "View Account Page",
      icon: "fa-user",
      alias: "stats",
      exec: () =>
        $("#top #menu .icon-button.view-account").hasClass("hidden")
          ? $("#top #menu .icon-button.view-login").click()
          : $("#top #menu .icon-button.view-account").click(),
    },
    {
      id: "toggleFullscreen",
      display: "Toggle Fullscreen",
      icon: "fa-expand",
      exec: () => {
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
            exec: () => {},
            available: () => {
              return canBailOut();
            },
          },
          {
            id: "bailOutForSure",
            display: "Yes, I am sure",
            exec: () => {
              TestLogic.setBailout(true);
              TestLogic.finish();
            },
            available: () => {
              return canBailOut();
            },
          },
        ],
      },
      visible: false,
      available: () => {
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
      exec: () => {
        window.open("https://discord.gg/monkeytype");
      },
    },
    {
      id: "repeatTest",
      display: "Repeat test",
      icon: "fa-sync-alt",
      exec: () => {
        TestLogic.restart(true);
      },
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "practiseWords",
      display: "Practice words...",
      icon: "fa-exclamation-triangle",
      subgroup: commandsPractiseWords,
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "toggleWordHistory",
      display: "Toggle word history",
      icon: "fa-align-left",
      exec: () => {
        TestUI.toggleResultWords();
      },
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "saveScreenshot",
      display: "Save screenshot",
      icon: "fa-image",
      alias: "ss picture",
      exec: () => {
        setTimeout(() => {
          TestUI.screenshot();
        }, 500);
      },
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "changeCustomModeText",
      display: "Change custom text",
      icon: "fa-align-left",
      exec: () => {
        CustomTextPopup.show();
      },
    },
    {
      id: "toggleMonkey",
      display: "Toggle Monkey",
      icon: "fa-egg",
      visible: false,
      exec: () => {
        UpdateConfig.toggleMonkey();
      },
    },
    {
      id: "copyWordsToClipboard",
      display: "Copy words to clipboard",
      icon: "fa-copy",
      subgroup: true,
      exec: () => {
        current.push(commandsCopyWordsToClipboard);
        Commandline.show();
      },
    },
    {
      id: "importSettingsJSON",
      display: "Import settings JSON",
      icon: "fa-cog",
      input: true,
      exec: (input) => {
        try {
          UpdateConfig.apply(JSON.parse(input));
          UpdateConfig.saveToLocalStorage();
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
      input: true,
      defaultValue: "",
      exec: () => {},
    },
    {
      id: "monkeyPower",
      display: "Power mode...",
      alias: "powermode",
      icon: "fa-egg",
      visible: false,
      subgroup: commandsMonkeyPowerLevel,
    },
  ],
};

current = [defaultCommands];

export function setCurrent(val) {
  current = val;
}

export function pushCurrent(val) {
  current.push(val);
}

export function getList(list) {
  return eval(list);
}
