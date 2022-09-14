import PunctuationCommands from "./lists/punctuation";
import ModeCommands from "./lists/mode";
import TimeCommands from "./lists/time";
import WordsCommands from "./lists/words";
import ConfidenceModeCommands from "./lists/words";
import QuoteLengthCommands from "./lists/quote-length";
import StopOnErrorCommands from "./lists/stop-on-error";
import NumbersCommands from "./lists/numbers";
import SmoothCaretCommands from "./lists/smooth-caret";
import QuickRestartCommands from "./lists/quick-restart";
import RepeatQuotesCommands from "./lists/repeat-quotes";
import LiveWpmCommands from "./lists/live-wpm";
import LiveAccCommands from "./lists/live-acc";
import LiveBurstCommands from "./lists/live-burst";
import ShowAverageCommands from "./lists/show-average";
import ShowTimerCommands from "./lists/show-timer";
import KeyTipsCommands from "./lists/key-tips";
import FreedomModeCommands from "./lists/freedom-mode";
import StrictSpaceCommands from "./lists/strict-space";
import BlindModeCommands from "./lists/blind-mode";
import ShowWordsHistoryCommands from "./lists/show-words-history";
import IndicateTyposCommands from "./lists/indicate-typos";
import HideExtraLettersCommands from "./lists/hide-extra-letters";
import QuickEndCommands from "./lists/quick-end";
import OppositeShiftModeCommands from "./lists/opposite-shift-mode";
import SoundOnErrorCommands from "./lists/sound-on-error";
import SoundVolumeCommands from "./lists/sound-volume";
import FlipTestColorsCommands from "./lists/flip-test-colors";
import SmoothLineScrollCommands from "./lists/smooth-line-scroll";
import AlwaysShowDecimalCommands from "./lists/always-show-decimal";
import AlwaysShowCpmCommands from "./lists/always-show-cpm";
import StartGraphsAtZeroCommands from "./lists/start-graphs-at-zero";
import LazyModeCommands from "./lists/lazy-mode";
import ShowAllLinesCommands from "./lists/show-all-lines";
import ColorfulModeCommands from "./lists/colorful-mode";
import OutOfFocusWarningCommands from "./lists/out-of-focus-warning";
import SingleListCommandlineCommands from "./lists/single-list-commandline";
import CapsLockWarningCommands from "./lists/caps-lock-warning";
import SoundOnClickCommands from "./lists/sound-on-click";
import MinWpmCommands from "./lists/min-wpm";
import MinAccCommands from "./lists/min-acc";
import MinBurstCommands from "./lists/min-burst";
import CustomThemeCommands from "./lists/custom-theme";
import RandomThemeCommands from "./lists/random-theme";
import DifficultyCommands from "./lists/difficulty";
import PaceCaretStyleCommands from "./lists/pace-caret-style";
import PaceCaretModeCommands from "./lists/pace-caret";
import CaretStyleCommands from "./lists/caret-style";
import RepeatedPaceCommands from "./lists/repeated-pace";
import TimerStyleCommands from "./lists/timer-style";
import TimerColorCommands from "./lists/timer-color";
import TimerOpacityCommands from "./lists/timer-opacity";
import HighlightModeCommands from "./lists/highlight-mode";
import TapeModeCommands from "./lists/tape-mode";
import BritishEnglishCommands from "./lists/british-english";
import KeymapModeCommands from "./lists/keymap-mode";
import KeymapStyleCommands from "./lists/keymap-style";
import KeymapLegendStyleCommands from "./lists/keymap-legend-style";
import KeymapShowTopRowCommands from "./lists/keymap-show-top-row";
import PageWidthCommands from "./lists/page-width";
import EnableAdsCommands from "./lists/enable-ads";
import PractiseWordsCommands from "./lists/practise-words";
import MonkeyPowerLevelCommands from "./lists/monkey-power-level";
import CopyWordsToClipboardCommands from "./lists/copy-words-to-clipboard";

import TagsCommands, { update as updateTagsCommands } from "./lists/tags";
import CustomThemesListCommands, {
  update as updateCustomThemesListCommands,
} from "./lists/tags";
import PresetsCommands, {
  update as updatePresetCommands,
} from "./lists/presets";
import LayoutsCommands, {
  update as updateLayoutsCommands,
} from "./lists/layouts";
import FunboxCommands, { update as updateFunboxCommands } from "./lists/funbox";
import ThemesCommands, { update as updateThemesCommands } from "./lists/themes";
import LoadChallengeCommands, {
  update as updateLoadChallengeCommands,
} from "./lists/load-challenge";
import FontFamilyCommands, {
  update as updateFontFamilyCommands,
} from "./lists/font-family";
import LanguagesCommands, {
  update as updateLanguagesCommands,
} from "./lists/languages";
import KeymapLayoutsCommands, {
  update as updateKeymapLayoutsCommands,
} from "./lists/layouts";

import { Auth } from "../firebase";
import Config, * as UpdateConfig from "../config";
import * as CustomText from "../test/custom-text";
import * as Misc from "../utils/misc";
import * as TestLogic from "../test/test-logic";
import * as TestInput from "../test/test-input";
import * as TestUI from "../test/test-ui";
import * as TestState from "../test/test-state";
import { randomizeTheme } from "../controllers/theme-controller";
import { navigate } from "../controllers/route-controller";
import * as CustomTextPopup from "../popups/custom-text-popup";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";
import * as ModesNotice from "../elements/modes-notice";
import * as VideoAdPopup from "../popups/video-ad-popup";
import * as ShareTestSettingsPopup from "../popups/share-test-settings-popup";
import * as ConfigEvent from "../observables/config-event";

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

Misc.getThemesList().then((themes) => {
  updateThemesCommands(themes);
});

Misc.getChallengeList().then((challenges) => {
  updateLoadChallengeCommands(challenges);
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
      subgroup: MinWpmCommands,
    },
    {
      id: "changeMinAcc",
      display: "Minimum accuracy...",
      alias: "minimum",
      icon: "fa-bomb",
      subgroup: MinAccCommands,
    },
    {
      id: "changeMinBurst",
      display: "Minimum burst...",
      alias: "minimum",
      icon: "fa-bomb",
      subgroup: MinBurstCommands,
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
      id: "changeTheme",
      display: "Theme...",
      icon: "fa-palette",
      subgroup: ThemesCommands,
    },
    {
      id: "setCustomTheme",
      display: "Custom theme...",
      icon: "fa-palette",
      subgroup: CustomThemeCommands,
    },
    {
      id: "setCustomThemeId",
      display: "Custom themes...",
      icon: "fa-palette",
      subgroup: CustomThemesListCommands,
      beforeSubgroup: (): void => updateCustomThemesListCommands(),
      available: (): boolean => {
        return Auth.currentUser !== null;
      },
    },
    {
      id: "changeRandomTheme",
      display: "Random theme...",
      icon: "fa-random",
      subgroup: RandomThemeCommands,
    },
    {
      id: "randomizeTheme",
      display: "Next random theme",
      icon: "fa-random",
      exec: (): Promise<void> => randomizeTheme(),
      available: (): boolean => {
        return Config.randomTheme !== "off";
      },
    },
    {
      id: "changeDifficulty",
      display: "Difficulty...",
      icon: "fa-star",
      subgroup: DifficultyCommands,
    },
    {
      id: "changeCaretStyle",
      display: "Caret style...",
      icon: "fa-i-cursor",
      subgroup: CaretStyleCommands,
    },
    {
      id: "changePaceCaret",
      display: "Pace caret mode...",
      icon: "fa-i-cursor",
      subgroup: PaceCaretModeCommands,
    },
    {
      id: "changePaceCaretStyle",
      display: "Pace caret style...",
      icon: "fa-i-cursor",
      subgroup: PaceCaretStyleCommands,
    },
    {
      id: "changeRepeatedPace",
      display: "Repeated pace...",
      icon: "fa-i-cursor",
      subgroup: RepeatedPaceCommands,
    },
    {
      id: "changeTimerStyle",
      display: "Timer/progress style...",
      icon: "fa-clock",
      subgroup: TimerStyleCommands,
    },
    {
      id: "changeTimerColor",
      display: "Timer/progress color...",
      icon: "fa-clock",
      subgroup: TimerColorCommands,
    },
    {
      id: "changeTimerOpacity",
      display: "Timer/progress opacity...",
      icon: "fa-clock",
      subgroup: TimerOpacityCommands,
    },
    {
      id: "changeHighlightMode",
      display: "Highlight mode...",
      icon: "fa-highlighter",
      subgroup: HighlightModeCommands,
    },
    {
      id: "changeTapeMode",
      display: "Tape mode...",
      icon: "fa-tape",
      subgroup: TapeModeCommands,
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
      subgroup: BritishEnglishCommands,
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
      subgroup: KeymapModeCommands,
    },
    {
      id: "changeKeymapStyle",
      display: "Keymap style...",
      alias: "keyboard",
      icon: "fa-keyboard",
      subgroup: KeymapStyleCommands,
    },
    {
      id: "changeKeymapLegendStyle",
      display: "Keymap legend style...",
      alias: "keyboard",
      icon: "fa-keyboard",
      subgroup: KeymapLegendStyleCommands,
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
      subgroup: KeymapShowTopRowCommands,
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
      subgroup: PageWidthCommands,
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
      subgroup: LoadChallengeCommands,
    },
    {
      id: "setEnableAds",
      display: "Enable ads...",
      icon: "fa-ad",
      subgroup: EnableAdsCommands,
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
      subgroup: PractiseWordsCommands,
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
      subgroup: CopyWordsToClipboardCommands,
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
      subgroup: MonkeyPowerLevelCommands,
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

const lists = {
  LoadChallengeCommands,
  LanguagesCommands,
  DifficultyCommands,
  LazyModeCommands,
  PaceCaretModeCommands,
  ShowAverageCommands,
  MinWpmCommands,
  MinAccCommands,
  MinBurstCommands,
  FunboxCommands,
  ConfidenceModeCommands,
  StopOnErrorCommands,
  LayoutsCommands,
  OppositeShiftModeCommands,
  TagsCommands,
};

export let current: MonkeyTypes.CommandsGroup[] = [];

current = [commands];

export type ListsObjectKeys = keyof typeof lists;

export function setCurrent(val: ListsObjectKeys): void {
  current = [lists[val]];
}

export function pushCurrent(val: ListsObjectKeys): void {
  current.push(lists[val]);
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "saveToLocalStorage") {
    commands.list.filter(
      (command) => command.id == "exportSettingsJSON"
    )[0].defaultValue = eventValue as string;
  }
  if (eventKey === "customBackground") {
    commands.list.filter(
      (command) => command.id == "changeCustomBackground"
    )[0].defaultValue = eventValue as string;
  }
  if (eventKey === "fontSize") {
    commands.list.filter(
      (command) => command.id == "changeFontSize"
    )[0].defaultValue = eventValue as string;
  }
  if (eventKey === "customLayoutFluid") {
    commands.list.filter(
      (command) => command.id == "changeCustomLayoutfluid"
    )[0].defaultValue = (eventValue as string)?.replace(/#/g, " ");
  }
});

export default commands;
