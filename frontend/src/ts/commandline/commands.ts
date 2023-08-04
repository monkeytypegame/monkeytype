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
import TypingSpeedUnitCommands from "./lists/typing-speed-unit";
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
import MonkeyPowerLevelCommands from "./lists/monkey-power-level";
import BailOutCommands from "./lists/bail-out";
import ResultSavingCommands from "./lists/result-saving";
import NavigationCommands from "./lists/navigation";
import FontSizeCommands from "./lists/font-size";
import ResultScreenCommands from "./lists/result-screen";
import CustomBackgroundSizeCommands from "./lists/background-size";
import CustomBackgroundFilterCommands from "./lists/background-filter";
import AddOrRemoveThemeToFavorite from "./lists/add-or-remove-theme-to-favorites";

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
} from "./lists/keymap-layouts";

import Config, * as UpdateConfig from "../config";
import * as Misc from "../utils/misc";
import { randomizeTheme } from "../controllers/theme-controller";
import * as CustomTextPopup from "../popups/custom-text-popup";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";
import * as VideoAdPopup from "../popups/video-ad-popup";
import * as ShareTestSettingsPopup from "../popups/share-test-settings-popup";
import * as TestStats from "../test/test-stats";
import * as QuoteSearchPopup from "../popups/quote-search-popup";
import * as FPSCounter from "../elements/fps-counter";

Misc.getLayoutsList()
  .then((layouts) => {
    updateLayoutsCommands(layouts);
    updateKeymapLayoutsCommands(layouts);
  })
  .catch((e) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update layouts commands")
    );
  });

Misc.getLanguageList()
  .then((languages) => {
    updateLanguagesCommands(languages);
  })
  .catch((e) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update language commands")
    );
  });

Misc.getFunboxList()
  .then((funboxes) => {
    updateFunboxCommands(funboxes);
    if (FunboxCommands[0].subgroup) {
      FunboxCommands[0].subgroup.beforeList = (): void => {
        updateFunboxCommands(funboxes);
      };
    }
  })
  .catch((e) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update funbox commands")
    );
  });

Misc.getFontsList()
  .then((fonts) => {
    updateFontFamilyCommands(fonts);
  })
  .catch((e) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update fonts commands")
    );
  });

Misc.getThemesList()
  .then((themes) => {
    updateThemesCommands(themes);
  })
  .catch((e) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update themes commands")
    );
  });

Misc.getChallengeList()
  .then((challenges) => {
    updateLoadChallengeCommands(challenges);
  })
  .catch((e) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update challenges commands")
    );
  });

export const commands: MonkeyTypes.CommandsSubgroup = {
  title: "",
  list: [
    //result
    ...ResultScreenCommands,

    //test screen
    ...PunctuationCommands,
    ...NumbersCommands,
    ...ModeCommands,
    ...TimeCommands,
    ...WordsCommands,
    ...QuoteLengthCommands,
    {
      id: "changeCustomModeText",
      display: "Change custom text",
      icon: "fa-align-left",
      exec: (): void => {
        CustomTextPopup.show();
      },
    },
    {
      id: "viewQuoteSearchPopup",
      display: "Search for quotes",
      icon: "fa-search",
      exec: (): void => {
        UpdateConfig.setMode("quote");
        QuoteSearchPopup.show();
      },
      shouldFocusTestUI: false,
    },
    ...BailOutCommands,
    {
      id: "shareTestSettings",
      display: "Share test settings",
      icon: "fa-share",
      exec: async (): Promise<void> => {
        ShareTestSettingsPopup.show();
      },
    },

    //account
    ...TagsCommands,
    ...PresetsCommands,
    ...ResultSavingCommands,

    //behavior
    ...DifficultyCommands,
    ...QuickRestartCommands,
    ...RepeatQuotesCommands,
    ...BlindModeCommands,
    ...ShowWordsHistoryCommands,
    ...SingleListCommandlineCommands,
    ...MinWpmCommands,
    ...MinAccCommands,
    ...MinBurstCommands,
    ...LanguagesCommands,
    ...BritishEnglishCommands,
    ...FunboxCommands,
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
      },
    },

    //input
    ...FreedomModeCommands,
    ...StrictSpaceCommands,
    ...OppositeShiftModeCommands,
    ...StopOnErrorCommands,
    ...ConfidenceModeCommands,
    ...QuickEndCommands,
    ...IndicateTyposCommands,
    ...HideExtraLettersCommands,
    ...LazyModeCommands,
    ...LayoutsCommands,

    //sound
    ...SoundVolumeCommands,
    ...SoundOnClickCommands,
    ...SoundOnErrorCommands,

    //caret
    ...SmoothCaretCommands,
    ...CaretStyleCommands,
    ...PaceCaretModeCommands,
    ...RepeatedPaceCommands,
    ...PaceCaretStyleCommands,

    //appearence
    ...TimerStyleCommands,
    ...TimerColorCommands,
    ...TimerOpacityCommands,
    ...HighlightModeCommands,
    ...TapeModeCommands,
    ...SmoothLineScrollCommands,
    ...ShowAllLinesCommands,
    ...TypingSpeedUnitCommands,
    ...AlwaysShowDecimalCommands,
    ...StartGraphsAtZeroCommands,
    ...FontSizeCommands,
    ...FontFamilyCommands,
    ...PageWidthCommands,
    ...KeymapModeCommands,
    ...KeymapStyleCommands,
    ...KeymapLegendStyleCommands,
    ...KeymapLayoutsCommands,
    ...KeymapShowTopRowCommands,

    //theme
    ...ThemesCommands,
    ...CustomThemeCommands,
    ...CustomThemesListCommands,
    ...FlipTestColorsCommands,
    ...ColorfulModeCommands,
    ...AddOrRemoveThemeToFavorite,
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
    ...CustomBackgroundSizeCommands,
    ...CustomBackgroundFilterCommands,
    ...RandomThemeCommands,
    {
      id: "randomizeTheme",
      display: "Next random theme",
      icon: "fa-random",
      exec: async (): Promise<void> => randomizeTheme(),
      available: (): boolean => {
        return Config.randomTheme !== "off";
      },
    },

    //showhide elements
    ...LiveWpmCommands,
    ...LiveAccCommands,
    ...LiveBurstCommands,
    ...ShowTimerCommands,
    ...KeyTipsCommands,
    ...OutOfFocusWarningCommands,
    ...CapsLockWarningCommands,
    ...ShowAverageCommands,
    ...MonkeyPowerLevelCommands,
    {
      id: "toggleMonkey",
      display: "Toggle Monkey",
      icon: "fa-egg",
      visible: false,
      exec: (): void => {
        UpdateConfig.setMonkey(!Config.monkey);
      },
    },

    //danger zone
    ...EnableAdsCommands,

    //other
    ...LoadChallengeCommands,
    ...NavigationCommands,
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
      id: "clearNotifications",
      display: "Clear all notifications",
      icon: "fa-trash-alt",
      exec: async (): Promise<void> => {
        Notifications.clearAllNotifications();
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
    {
      id: "copyResultStats",
      display: "Copy result stats",
      icon: "fa-cog",
      visible: false,
      exec: async (): Promise<void> => {
        navigator.clipboard
          .writeText(JSON.stringify(TestStats.getStats()))
          .then(() => {
            Notifications.add("Copied to clipboard", 1);
          })
          .catch((e) => {
            Notifications.add("Failed to copy to clipboard: " + e, -1);
          });
      },
    },
    {
      id: "fpsCounter",
      display: "FPS counter...",
      icon: "fa-cog",
      visible: false,
      subgroup: {
        title: "FPS counter...",
        list: [
          {
            id: "startFpsCounter",
            display: "show",
            icon: "fa-cog",
            exec: (): void => {
              FPSCounter.start();
            },
          },
          {
            id: "stopFpsCounter",
            display: "hide",
            icon: "fa-cog",
            exec: (): void => {
              FPSCounter.stop();
            },
          },
        ],
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
  ],
};

const lists = {
  keymapLayouts: KeymapLayoutsCommands[0].subgroup,
  enableAds: EnableAdsCommands[0].subgroup,
  customThemesList: CustomThemesListCommands[0].subgroup,
  themes: ThemesCommands[0].subgroup,
  loadChallenge: LoadChallengeCommands[0].subgroup,
  languages: LanguagesCommands[0].subgroup,
  difficulty: DifficultyCommands[0].subgroup,
  lazyMode: LazyModeCommands[0].subgroup,
  paceCaretMode: PaceCaretModeCommands[0].subgroup,
  showAverage: ShowAverageCommands[0].subgroup,
  minWpm: MinWpmCommands[0].subgroup,
  minAcc: MinAccCommands[0].subgroup,
  minBurst: MinBurstCommands[0].subgroup,
  funbox: FunboxCommands[0].subgroup,
  confidenceMode: ConfidenceModeCommands[0].subgroup,
  stopOnError: StopOnErrorCommands[0].subgroup,
  layouts: LayoutsCommands[0].subgroup,
  oppositeShiftMode: OppositeShiftModeCommands[0].subgroup,
  tags: TagsCommands[0].subgroup,
  resultSaving: ResultSavingCommands[0].subgroup,
  blindMode: BlindModeCommands[0].subgroup,
};

export function getList(
  listName: ListsObjectKeys
): MonkeyTypes.CommandsSubgroup {
  const list = lists[listName];
  if (!list) {
    Notifications.add(`List not found: ${listName}`, -1);
    throw new Error(`List ${listName} not found`);
  }
  return list;
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
