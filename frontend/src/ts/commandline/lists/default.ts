import PunctuationCommands from "./punctuation";
import ModeCommands from "./mode";
import TimeCommands from "./time";
import WordsCommands from "./words";
import ConfidenceModeCommands from "./words";
import QuoteLengthCommands from "./quote-length";
import StopOnErrorCommands from "./stop-on-error";
import NumbersCommands from "./numbers";
import SmoothCaretCommands from "./smooth-caret";
import QuickRestartCommands from "./quick-restart";
import RepeatQuotesCommands from "./repeat-quotes";
import LiveWpmCommands from "./live-wpm";
import LiveAccCommands from "./live-acc";
import LiveBurstCommands from "./live-burst";
import ShowAverageCommands from "./show-average";
import ShowTimerCommands from "./show-timer";
import KeyTipsCommands from "./key-tips";
import FreedomModeCommands from "./freedom-mode";
import StrictSpaceCommands from "./strict-space";
import BlindModeCommands from "./blind-mode";
import ShowWordsHistoryCommands from "./show-words-history";
import IndicateTyposCommands from "./indicate-typos";
import HideExtraLettersCommands from "./hide-extra-letters";
import QuickEndCommands from "./quick-end";
import OppositeShiftModeCommands from "./opposite-shift-mode";
import SoundOnErrorCommands from "./sound-on-error";
import SoundVolumeCommands from "./sound-volume";
import FlipTestColorsCommands from "./flip-test-colors";
import SmoothLineScrollCommands from "./smooth-line-scroll";
import AlwaysShowDecimalCommands from "./always-show-decimal";
import AlwaysShowCpmCommands from "./always-show-cpm";
import StartGraphsAtZeroCommands from "./start-graphs-at-zero";
import LazyModeCommands from "./lazy-mode";
import ShowAllLinesCommands from "./show-all-lines";
import ColorfulModeCommands from "./colorful-mode";
import OutOfFocusWarningCommands from "./out-of-focus-warning";
import SingleListCommandlineCommands from "./single-list-commandline";
import CapsLockWarningCommands from "./caps-lock-warning";
import SoundOnClickCommands from "./sound-on-click";

import TagsCommands, { update as updateTagsCommands } from "./tags";
import PresetsCommands, { update as updatePresetCommands } from "./presets";
import LayoutsCommands, { update as updateLayoutsCommands } from "./layouts";
import FunboxCommands, { update as updateFunboxCommands } from "./funbox";
import FontFamilyCommands, {
  update as updateFontFamilyCommands,
} from "./font-family";
import LanguagesCommands, {
  update as updateLanguagesCommands,
} from "./languages";
import KeymapLayoutsCommands, {
  update as updateKeymapLayoutsCommands,
} from "./layouts";
import { Auth } from "../../firebase";
import Config from "../../config";
import * as CustomText from "../../test/custom-text";
import * as Misc from "../../utils/misc";

Misc.getLayoutsList().then((layouts) => {
  updateLayoutsCommands(layouts);
  updateKeymapLayoutsCommands(layouts);
});

Misc.getLanguageList().then((languages) => {
  updateLanguagesCommands(languages);
});

Misc.getFunboxList().then((funboxes) => {
  updateFunboxCommands(funboxes);
});

Misc.getFontsList().then((fonts) => {
  updateFontFamilyCommands(fonts);
});

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

const commands: MonkeyTypes.CommandsGroup = {
  title: "",
  list: [
    {
      id: "changePunctuation",
      display: "Punctuation...",
      icon: "fa-at",
      subgroup: PunctuationCommands,
    },
    {
      id: "changeMode",
      display: "Mode...",
      icon: "fa-bars",
      subgroup: ModeCommands,
    },
    {
      id: "changeTimeConfig",
      display: "Time...",
      icon: "fa-clock",
      subgroup: TimeCommands,
    },
    {
      id: "changeWordCount",
      display: "Words...",
      alias: "words",
      icon: "fa-font",
      subgroup: WordsCommands,
    },
    {
      id: "changeQuoteLength",
      display: "Quote length...",
      icon: "fa-quote-right",
      alias: "quotes",
      subgroup: QuoteLengthCommands,
    },
    {
      visible: false,
      id: "changeTags",
      display: "Tags...",
      icon: "fa-tag",
      subgroup: TagsCommands,
      beforeSubgroup: (): void => {
        updateTagsCommands();
      },
      available: (): boolean => {
        return !!Auth.currentUser;
      },
    },
    {
      visible: false,
      id: "applyPreset",
      display: "Presets...",
      icon: "fa-sliders-h",
      subgroup: PresetsCommands,
      beforeSubgroup: (): void => {
        updatePresetCommands();
      },
      available: (): boolean => {
        return !!Auth.currentUser;
      },
    },
    {
      id: "changeConfidenceMode",
      display: "Confidence mode...",
      icon: "fa-backspace",
      subgroup: ConfidenceModeCommands,
    },
    {
      id: "changeStopOnError",
      display: "Stop on error...",
      icon: "fa-hand-paper",
      subgroup: StopOnErrorCommands,
    },
    {
      id: "changeNumbers",
      display: "Numbers...",
      icon: "fa-hashtag",
      subgroup: NumbersCommands,
    },
    {
      id: "changeSmoothCaret",
      display: "Smooth caret...",
      icon: "fa-i-cursor",
      subgroup: SmoothCaretCommands,
    },
    {
      id: "changeQuickRestart",
      display: "Quick restart...",
      icon: "fa-redo-alt",
      subgroup: QuickRestartCommands,
    },
    {
      id: "changeRepeatQuotes",
      display: "Repeat quotes...",
      icon: "fa-sync-alt",
      subgroup: RepeatQuotesCommands,
    },
    {
      id: "changeLiveWpm",
      display: "Live WPM...",
      icon: "fa-tachometer-alt",
      subgroup: LiveWpmCommands,
    },
    {
      id: "changeLiveAcc",
      display: "Live accuracy...",
      icon: "fa-percentage",
      subgroup: LiveAccCommands,
    },
    {
      id: "changeLiveBurst",
      display: "Live burst...",
      icon: "fa-fire-alt",
      subgroup: LiveBurstCommands,
    },
    {
      id: "changeShowTimer",
      display: "Timer/progress...",
      icon: "fa-clock",
      subgroup: ShowTimerCommands,
    },
    {
      id: "changeKeyTips",
      display: "Key tips...",
      icon: "fa-question",
      subgroup: KeyTipsCommands,
    },
    {
      id: "changeFreedomMode",
      display: "Freedom mode...",
      subgroup: FreedomModeCommands,
    },
    {
      id: "changeStrictSpace",
      display: "Strict space...",
      icon: "fa-minus",
      subgroup: StrictSpaceCommands,
    },
    {
      id: "changeBlindMode",
      display: "Blind mode...",
      icon: "fa-eye-slash",
      subgroup: BlindModeCommands,
    },
    {
      id: "changeShowWordsHistory",
      display: "Always show words history...",
      icon: "fa-align-left",
      subgroup: ShowWordsHistoryCommands,
    },
    {
      id: "changeIndicateTypos",
      display: "Indicate typos...",
      icon: "fa-exclamation",
      subgroup: IndicateTyposCommands,
    },
    {
      id: "changeHideExtraLetters",
      display: "Hide extra letters...",
      icon: "fa-eye-slash",
      subgroup: HideExtraLettersCommands,
    },
    {
      id: "changeQuickEnd",
      display: "Quick end...",
      icon: "fa-step-forward",
      subgroup: QuickEndCommands,
    },
    {
      id: "singleListCommandLine",
      display: "Single list command line...",
      icon: "fa-list",
      subgroup: SingleListCommandlineCommands,
    },
    {
      id: "capsLockWarning",
      display: "Caps lock warning...",
      icon: "fa-exclamation-triangle",
      subgroup: CapsLockWarningCommands,
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
      subgroup: OppositeShiftModeCommands,
    },
    {
      id: "changeSoundOnClick",
      display: "Sound on click...",
      icon: "fa-volume-up",
      subgroup: SoundOnClickCommands,
    },
    {
      id: "changeSoundOnError",
      display: "Sound on error...",
      icon: "fa-volume-mute",
      subgroup: SoundOnErrorCommands,
    },
    {
      id: "changeSoundVolume",
      display: "Sound volume...",
      icon: "fa-volume-down",
      subgroup: SoundVolumeCommands,
    },
    {
      id: "changeFlipTestColors",
      display: "Flip test colors...",
      icon: "fa-adjust",
      subgroup: FlipTestColorsCommands,
    },
    {
      id: "changeSmoothLineScroll",
      display: "Smooth line scroll...",
      icon: "fa-align-left",
      subgroup: SmoothLineScrollCommands,
    },
    {
      id: "changeAlwaysShowDecimal",
      display: "Always show decimal places...",
      icon: "00",
      subgroup: AlwaysShowDecimalCommands,
    },
    {
      id: "changeAlwaysShowCPM",
      display: "Always show CPM...",
      icon: "fa-tachometer-alt",
      subgroup: AlwaysShowCpmCommands,
    },
    {
      id: "changeStartGraphsAtZero",
      display: "Start graphs at zero...",
      icon: "fa-chart-line",
      subgroup: StartGraphsAtZeroCommands,
    },
    {
      id: "changeLazyMode",
      display: "Lazy mode...",
      icon: "fa-couch",
      subgroup: LazyModeCommands,
    },
    {
      id: "changeShowAllLines",
      display: "Show all lines...",
      icon: "fa-align-left",
      subgroup: ShowAllLinesCommands,
    },
    {
      id: "changeColorfulMode",
      display: "Colorful mode...",
      icon: "fa-fill-drip",
      subgroup: ColorfulModeCommands,
    },
    {
      id: "changeOutOfFocusWarning",
      display: "Out of focus warning...",
      icon: "fa-exclamation",
      subgroup: OutOfFocusWarningCommands,
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
      exec: (): Promise<void> => ThemeController.randomizeTheme(),
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
      subgroup: ShowAverageCommands,
    },
    {
      id: "changeCustomBackground",
      display: "Custom background...",
      icon: "fa-image",
      defaultValue: "",
      input: true,
      exec: (input): void => {
        if (!input) input = "";
        UpdateConfig.setCustomBackground(input);
      },
    },
    {
      id: "changeLanguage",
      display: "Language...",
      icon: "fa-language",
      subgroup: LanguagesCommands,
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
      subgroup: FunboxCommands,
    },
    {
      id: "changeLayout",
      display: "Layout emulator...",
      icon: "fa-keyboard",
      subgroup: LayoutsCommands,
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
      subgroup: KeymapLayoutsCommands,
    },
    {
      id: "changeKeymapShowTopRow",
      display: "Keymap show top row...",
      alias: "keyboard",
      icon: "fa-keyboard",
      subgroup: commandsKeymapShowTopRow,
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
      input: true,
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setFontSize(parseFloat(input));
        setTimeout(() => {
          TestUI.updateWordsHeight();
        }, 0); //honestly no clue why it i need to wait for the next event loop to do this
      },
    },
    {
      id: "changeFontFamily",
      display: "Font family...",
      icon: "fa-font",
      subgroup: FontFamilyCommands,
    },
    {
      id: "changePageWidth",
      display: "Page width...",
      icon: "fa-arrows-alt-h",
      subgroup: commandsPageWidth,
    },
    {
      id: "nextTest",
      display: "Next test",
      alias: "restart start begin type test typing",
      icon: "fa-chevron-right",
      available: (): boolean => {
        return TestUI.resultVisible;
      },
      exec: (): void => {
        TestLogic.restart();
      },
    },
    {
      id: "viewTypingPage",
      display: "View Typing Page",
      alias: "start begin type test",
      icon: "fa-keyboard",
      exec: (): void => {
        navigate("/");
      },
    },
    {
      id: "viewLeaderboards",
      display: "View Leaderboards",
      icon: "fa-crown",
      exec: (): void => {
        $("#top #menu .textButton.view-leaderboards").trigger("click");
      },
    },
    {
      id: "viewAbout",
      display: "View About Page",
      icon: "fa-info",
      exec: (): void => {
        navigate("/about");
      },
    },
    {
      id: "viewSettings",
      display: "View Settings Page",
      icon: "fa-cog",
      exec: (): void => {
        navigate("/settings");
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
        $("#top #menu .textButton.view-account").hasClass("hidden")
          ? navigate("/login")
          : navigate("/account");
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
        TestLogic.restart({
          withSameWordset: true,
        });
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
      id: "watchVideoAd",
      display: "Watch video ad",
      alias: "support donate",
      icon: "fa-ad",
      exec: (): void => {
        VideoAdPopup.show();
      },
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
      id: "setResultSaving",
      display: "Result saving...",
      icon: "fa-save",
      alias: "results",
      subgroup: {
        title: "Result saving...",
        list: [
          {
            id: "setResultSavingOff",
            display: "off",
            alias: "disabled",
            exec: (): void => {
              TestState.setSaving(false);
              ModesNotice.update();
            },
          },
          {
            id: "setResultSavingOn",
            display: "on",
            alias: "enabled",
            exec: (): void => {
              TestState.setSaving(true);
              ModesNotice.update();
            },
          },
        ],
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

export default commands;
