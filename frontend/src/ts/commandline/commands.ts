import PunctuationCommands from "./lists/punctuation";
import ModeCommands from "./lists/mode";
import TimeCommands from "./lists/time";
import WordsCommands from "./lists/words";
import ConfidenceModeCommands from "./lists/confidence-mode";
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
import BailOutCommands from "./lists/bail-out";
import ResultSavingCommands from "./lists/result-saving";

import TagsCommands from "./lists/tags";
import CustomThemesListCommands from "./lists/custom-themes-list";
import PresetsCommands from "./lists/presets";
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

import Config, * as UpdateConfig from "../config";
import * as Misc from "../utils/misc";
import * as TestLogic from "../test/test-logic";
import * as TestUI from "../test/test-ui";
import { randomizeTheme } from "../controllers/theme-controller";
import { navigate } from "../controllers/route-controller";
import * as CustomTextPopup from "../popups/custom-text-popup";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";
import * as VideoAdPopup from "../popups/video-ad-popup";
import * as ShareTestSettingsPopup from "../popups/share-test-settings-popup";

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

export const commands: MonkeyTypes.CommandsSubgroup = {
  title: "",
  list: [
    ...PunctuationCommands,
    ...ModeCommands,
    ...TimeCommands,
    ...WordsCommands,
    ...QuoteLengthCommands,
    ...TagsCommands,
    ...PresetsCommands,
    ...ConfidenceModeCommands,
    ...StopOnErrorCommands,
    ...NumbersCommands,
    ...SmoothCaretCommands,
    ...QuickRestartCommands,
    ...RepeatQuotesCommands,
    ...LiveWpmCommands,
    ...LiveAccCommands,
    ...LiveBurstCommands,
    ...ShowTimerCommands,
    ...KeyTipsCommands,
    ...FreedomModeCommands,
    ...StrictSpaceCommands,
    ...BlindModeCommands,
    ...ShowWordsHistoryCommands,
    ...IndicateTyposCommands,
    ...HideExtraLettersCommands,
    ...QuickEndCommands,
    ...SingleListCommandlineCommands,
    ...CapsLockWarningCommands,
    ...MinWpmCommands,
    ...MinAccCommands,
    ...MinBurstCommands,
    ...OppositeShiftModeCommands,
    ...SoundOnClickCommands,
    ...SoundOnErrorCommands,
    ...SoundVolumeCommands,
    ...FlipTestColorsCommands,
    ...SmoothLineScrollCommands,
    ...AlwaysShowDecimalCommands,
    ...AlwaysShowCpmCommands,
    ...StartGraphsAtZeroCommands,
    ...LazyModeCommands,
    ...ShowAllLinesCommands,
    ...ColorfulModeCommands,
    ...OutOfFocusWarningCommands,
    ...ThemesCommands,
    ...CustomThemeCommands,
    ...CustomThemesListCommands,
    ...RandomThemeCommands,
    ...DifficultyCommands,
    ...CaretStyleCommands,
    ...PaceCaretModeCommands,
    ...PaceCaretStyleCommands,
    ...RepeatedPaceCommands,
    ...TimerStyleCommands,
    ...TimerColorCommands,
    ...TimerOpacityCommands,
    ...HighlightModeCommands,
    ...TapeModeCommands,
    ...ShowAverageCommands,
    ...LanguagesCommands,
    ...BritishEnglishCommands,
    ...FunboxCommands,
    ...LayoutsCommands,
    ...KeymapModeCommands,
    ...KeymapStyleCommands,
    ...KeymapLegendStyleCommands,
    ...KeymapLayoutsCommands,
    ...KeymapShowTopRowCommands,
    ...FontFamilyCommands,
    ...PageWidthCommands,
    ...BailOutCommands,
    ...LoadChallengeCommands,
    ...EnableAdsCommands,
    ...PractiseWordsCommands,
    ...CopyWordsToClipboardCommands,
    ...MonkeyPowerLevelCommands,
    ...ResultSavingCommands,
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
      id: "changeCustomBackground",
      display: "Custom background...",
      icon: "fa-image",
      defaultValue: (): string => {
        return Config.customBackground;
      },
      input: true,
      exec: (input): void => {
        if (!input) input = "";
        UpdateConfig.setCustomBackground(input);
      },
    },

    {
      id: "changeCustomLayoutfluid",
      display: "Custom layoutfluid...",
      defaultValue: (): string => {
        return Config.customLayoutfluid;
      },
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
      defaultValue: (): string => {
        return Config.fontSize.toString();
      },
      exec: (input): void => {
        if (!input) return;
        UpdateConfig.setFontSize(parseFloat(input));
        setTimeout(() => {
          TestUI.updateWordsHeight();
        }, 0); //honestly no clue why it i need to wait for the next event loop to do this
      },
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
      defaultValue: (): string => {
        return JSON.stringify(Config);
      },
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
  keymapLayouts: KeymapLayoutsCommands,
  enableAds: EnableAdsCommands,
  customThemesList: CustomThemesListCommands,
  themes: ThemesCommands,
  loadChallange: LoadChallengeCommands,
  languages: LanguagesCommands,
  difficulty: DifficultyCommands,
  lazyMode: LazyModeCommands,
  paceCaretMode: PaceCaretModeCommands,
  showAverage: ShowAverageCommands,
  minWpm: MinWpmCommands,
  minAcc: MinAccCommands,
  minBurst: MinBurstCommands,
  funbox: FunboxCommands,
  confidenceMode: ConfidenceModeCommands,
  stopOnError: StopOnErrorCommands,
  layouts: LayoutsCommands,
  oppositeShiftMode: OppositeShiftModeCommands,
  tags: TagsCommands,
};

export function getList(
  listName: ListsObjectKeys
): MonkeyTypes.CommandsSubgroup {
  return lists[listName];
}

export let current: MonkeyTypes.CommandsSubgroup[] = [];

current = [commands];

export type ListsObjectKeys = keyof typeof lists;

export function setCurrent(val: MonkeyTypes.CommandsSubgroup[]): void {
  current = val;
}

export function pushCurrent(val: MonkeyTypes.CommandsSubgroup): void {
  current.push(val);
}
