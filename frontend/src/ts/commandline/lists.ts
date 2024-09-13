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
import LiveSpeedStyleCommands from "./lists/live-speed-style";
import LiveAccStyleCommands from "./lists/live-acc-style";
import LiveBurstStyleCommands from "./lists/live-burst-style";
import ShowAverageCommands from "./lists/show-average";
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
import KeymapSizeCommands from "./lists/keymap-size";
import EnableAdsCommands from "./lists/enable-ads";
import MonkeyPowerLevelCommands from "./lists/monkey-power-level";
import BailOutCommands from "./lists/bail-out";
import QuoteFavoriteCommands from "./lists/quote-favorites";
import ResultSavingCommands from "./lists/result-saving";
import NavigationCommands from "./lists/navigation";
import FontSizeCommands from "./lists/font-size";
import MaxLineWidthCommands from "./lists/max-line-width";
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
import * as JSONData from "../utils/json-data";
import { randomizeTheme } from "../controllers/theme-controller";
import * as CustomTextPopup from "../modals/custom-text";
import * as Settings from "../pages/settings";
import * as Notifications from "../elements/notifications";
import * as VideoAdPopup from "../popups/video-ad-popup";
import * as ShareTestSettingsPopup from "../modals/share-test-settings";
import * as TestStats from "../test/test-stats";
import * as QuoteSearchModal from "../modals/quote-search";
import * as FPSCounter from "../elements/fps-counter";
import { migrateConfig } from "../utils/config";
import { PartialConfigSchema } from "@monkeytype/contracts/schemas/configs";

const layoutsPromise = JSONData.getLayoutsList();
layoutsPromise
  .then((layouts) => {
    updateLayoutsCommands(layouts);
    updateKeymapLayoutsCommands(layouts);
  })
  .catch((e: unknown) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update layouts commands")
    );
  });

const languagesPromise = JSONData.getLanguageList();
languagesPromise
  .then((languages) => {
    updateLanguagesCommands(languages);
  })
  .catch((e: unknown) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update language commands")
    );
  });

const funboxPromise = JSONData.getFunboxList();
funboxPromise
  .then((funboxes) => {
    updateFunboxCommands(funboxes);
    if (FunboxCommands[0]?.subgroup) {
      FunboxCommands[0].subgroup.beforeList = (): void => {
        updateFunboxCommands(funboxes);
      };
    }
  })
  .catch((e: unknown) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update funbox commands")
    );
  });

const fontsPromise = JSONData.getFontsList();
fontsPromise
  .then((fonts) => {
    updateFontFamilyCommands(fonts);
  })
  .catch((e: unknown) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update fonts commands")
    );
  });

const themesPromise = JSONData.getThemesList();
themesPromise
  .then((themes) => {
    updateThemesCommands(themes);
  })
  .catch((e: unknown) => {
    console.error(
      Misc.createErrorMessage(e, "Failed to update themes commands")
    );
  });

const challengesPromise = JSONData.getChallengeList();
challengesPromise
  .then((challenges) => {
    updateLoadChallengeCommands(challenges);
  })
  .catch((e: unknown) => {
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
        void QuoteSearchModal.show();
      },
      shouldFocusTestUI: false,
    },
    ...QuoteFavoriteCommands,
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
      exec: ({ input }): void => {
        if (input === undefined) return;
        void UpdateConfig.setCustomLayoutfluid(input);
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
    ...LiveSpeedStyleCommands,
    ...LiveAccStyleCommands,
    ...LiveBurstStyleCommands,

    ...TimerColorCommands,
    ...TimerOpacityCommands,
    ...HighlightModeCommands,
    ...TapeModeCommands,
    ...SmoothLineScrollCommands,
    ...ShowAllLinesCommands,
    ...TypingSpeedUnitCommands,
    ...AlwaysShowDecimalCommands,
    ...StartGraphsAtZeroCommands,
    ...MaxLineWidthCommands,
    ...FontSizeCommands,
    ...FontFamilyCommands,
    ...KeymapModeCommands,
    ...KeymapStyleCommands,
    ...KeymapLegendStyleCommands,
    ...KeymapSizeCommands,
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
      exec: ({ input }): void => {
        UpdateConfig.setCustomBackground(input ?? "");
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
        void VideoAdPopup.show();
      },
    },
    {
      id: "importSettingsJSON",
      display: "Import settings JSON",
      icon: "fa-cog",
      alias: "import config",
      input: true,
      exec: async ({ input }): Promise<void> => {
        if (input === undefined || input === "") return;
        try {
          const parsedConfig = PartialConfigSchema.strip().parse(
            JSON.parse(input)
          );
          await UpdateConfig.apply(migrateConfig(parsedConfig));
          UpdateConfig.saveFullConfigToLocalStorage();
          void Settings.update();
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
          .catch((e: unknown) => {
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
  keymapLayouts: KeymapLayoutsCommands[0]?.subgroup,
  enableAds: EnableAdsCommands[0]?.subgroup,
  customThemesList: CustomThemesListCommands[0]?.subgroup,
  themes: ThemesCommands[0]?.subgroup,
  loadChallenge: LoadChallengeCommands[0]?.subgroup,
  languages: LanguagesCommands[0]?.subgroup,
  difficulty: DifficultyCommands[0]?.subgroup,
  lazyMode: LazyModeCommands[0]?.subgroup,
  paceCaretMode: PaceCaretModeCommands[0]?.subgroup,
  showAverage: ShowAverageCommands[0]?.subgroup,
  minWpm: MinWpmCommands[0]?.subgroup,
  minAcc: MinAccCommands[0]?.subgroup,
  minBurst: MinBurstCommands[0]?.subgroup,
  funbox: FunboxCommands[0]?.subgroup,
  confidenceMode: ConfidenceModeCommands[0]?.subgroup,
  stopOnError: StopOnErrorCommands[0]?.subgroup,
  layouts: LayoutsCommands[0]?.subgroup,
  oppositeShiftMode: OppositeShiftModeCommands[0]?.subgroup,
  tags: TagsCommands[0]?.subgroup,
  resultSaving: ResultSavingCommands[0]?.subgroup,
  blindMode: BlindModeCommands[0]?.subgroup,
};

export function doesListExist(listName: string): boolean {
  return lists[listName as ListsObjectKeys] !== undefined;
}

export async function getList(
  listName: ListsObjectKeys
): Promise<MonkeyTypes.CommandsSubgroup> {
  await Promise.allSettled([
    layoutsPromise,
    languagesPromise,
    funboxPromise,
    fontsPromise,
    themesPromise,
    challengesPromise,
  ]);
  const list = lists[listName];
  if (!list) {
    Notifications.add(`List not found: ${listName}`, -1);
    throw new Error(`List ${listName} not found`);
  }
  return list;
}

let stack: MonkeyTypes.CommandsSubgroup[] = [];

stack = [commands];

export function getStackLength(): number {
  return stack.length;
}

export type ListsObjectKeys = keyof typeof lists;

export function setStackToDefault(): void {
  setStack([commands]);
}

export function setStack(val: MonkeyTypes.CommandsSubgroup[]): void {
  stack = val;
}

export function pushToStack(val: MonkeyTypes.CommandsSubgroup): void {
  stack.push(val);
}

export function popFromStack(): void {
  stack.pop();
}

export function getTopOfStack(): MonkeyTypes.CommandsSubgroup {
  return stack[stack.length - 1] as MonkeyTypes.CommandsSubgroup;
}

let singleList: MonkeyTypes.CommandsSubgroup | undefined;
export async function getSingleSubgroup(): Promise<MonkeyTypes.CommandsSubgroup> {
  await Promise.allSettled([
    layoutsPromise,
    languagesPromise,
    funboxPromise,
    fontsPromise,
    themesPromise,
    challengesPromise,
  ]);

  const singleCommands: MonkeyTypes.Command[] = [];
  for (const command of commands.list) {
    const ret = buildSingleListCommands(command);
    singleCommands.push(...ret);
  }

  singleList = {
    title: "All commands",
    list: singleCommands,
  };
  return singleList;
}

function buildSingleListCommands(
  command: MonkeyTypes.Command,
  parentCommand?: MonkeyTypes.Command
): MonkeyTypes.Command[] {
  const commands: MonkeyTypes.Command[] = [];
  if (command.subgroup) {
    if (command.subgroup.beforeList) {
      command.subgroup.beforeList();
    }
    const currentCommand = {
      ...command,
      subgroup: {
        ...command.subgroup,
        list: [],
      },
    };
    for (const cmd of command.subgroup.list) {
      commands.push(...buildSingleListCommands(cmd, currentCommand));
    }
  } else {
    if (parentCommand) {
      const parentCommandDisplay = parentCommand.display.replace(
        /\s?\.\.\.$/g,
        ""
      );
      const singleListDisplay =
        parentCommandDisplay +
        '<i class="fas fa-fw fa-chevron-right chevronIcon"></i>' +
        command.display;

      const singleListDisplayNoIcon =
        parentCommandDisplay + " " + command.display;

      let newAlias: string | undefined = undefined;

      if ((parentCommand.alias ?? "") || (command.alias ?? "")) {
        newAlias = [parentCommand.alias, command.alias]
          .filter(Boolean)
          .join(" ");
      }

      const newCommand = {
        ...command,
        singleListDisplay,
        singleListDisplayNoIcon,
        configKey: parentCommand.subgroup?.configKey,
        icon: parentCommand.icon,
        alias: newAlias,
        visible: (parentCommand.visible ?? true) && (command.visible ?? true),
        available: (): boolean => {
          return (
            (parentCommand?.available?.() ?? true) &&
            (command?.available?.() ?? true)
          );
        },
      };
      commands.push(newCommand);
    } else {
      commands.push(command);
    }
  }
  return commands;
}
