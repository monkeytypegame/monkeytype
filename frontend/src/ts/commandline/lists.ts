import MinBurstCommands from "./lists/min-burst";
import BailOutCommands from "./lists/bail-out";
import QuoteFavoriteCommands from "./lists/quote-favorites";
import ResultSavingCommands from "./lists/result-saving";
import NavigationCommands from "./lists/navigation";
import ResultScreenCommands from "./lists/result-screen";
import CustomBackgroundCommands from "./lists/custom-background";
import FontFamilyCommands from "./lists/font-family";
import CustomBackgroundFilterCommands from "./lists/background-filter";
import AddOrRemoveThemeToFavorite from "./lists/add-or-remove-theme-to-favorites";
import TagsCommands from "./lists/tags";
import CustomThemesListCommands from "./lists/custom-themes-list";
import PresetsCommands from "./lists/presets";
import FunboxCommands from "./lists/funbox";
import ThemesCommands from "./lists/themes";
import LoadChallengeCommands, {
  update as updateLoadChallengeCommands,
} from "./lists/load-challenge";

import Config, * as UpdateConfig from "../config";
import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import { randomizeTheme } from "../controllers/theme-controller";
import * as CustomTextPopup from "../modals/custom-text";
import * as Notifications from "../elements/notifications";
import * as VideoAdPopup from "../popups/video-ad-popup";
import * as ShareTestSettingsPopup from "../modals/share-test-settings";
import * as TestStats from "../test/test-stats";
import * as QuoteSearchModal from "../modals/quote-search";
import * as FPSCounter from "../elements/fps-counter";
import { Command, CommandsSubgroup } from "./types";
import { buildCommandForConfigKey } from "./util";
import { CommandlineConfigMetadataObject } from "./commandline-metadata";

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

const languageCommand = buildCommandForConfigKey("language");
const difficultyCommand = buildCommandForConfigKey("difficulty");
const blindModeCommand = buildCommandForConfigKey("blindMode");
const oppositeShiftModeCommand = buildCommandForConfigKey("oppositeShiftMode");
const stopOnErrorCommand = buildCommandForConfigKey("stopOnError");
const confidenceModeCommand = buildCommandForConfigKey("confidenceMode");
const lazyModeCommand = buildCommandForConfigKey("lazyMode");
const layoutCommand = buildCommandForConfigKey("layout");
const showAverageCommand = buildCommandForConfigKey("showAverage");
const keymapLayoutCommand = buildCommandForConfigKey("keymapLayout");
const customThemeCommand = buildCommandForConfigKey("customTheme");
const adsCommand = buildCommandForConfigKey("ads");
const minSpeedCommand = buildCommandForConfigKey("minWpm");
const minAccCommand = buildCommandForConfigKey("minAcc");
const paceCaretCommand = buildCommandForConfigKey("paceCaret");

export const commands: CommandsSubgroup = {
  title: "",
  list: [
    //result
    ...ResultScreenCommands,

    //test screen
    buildCommandForConfigKey("punctuation"),
    buildCommandForConfigKey("numbers"),
    buildCommandForConfigKey("mode"),
    buildCommandForConfigKey("time"),
    buildCommandForConfigKey("words"),
    buildCommandForConfigKey("quoteLength"),
    languageCommand,
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
    ...buildCommands(
      difficultyCommand,
      "quickRestart",
      "repeatQuotes",
      blindModeCommand,
      "alwaysShowWordsHistory",
      "singleListCommandLine",
      minSpeedCommand,
      minAccCommand,
      ...MinBurstCommands,
      "britishEnglish",
      ...FunboxCommands,
      "customLayoutfluid",
      "customPolyglot"
    ),

    //input
    ...buildCommands(
      "freedomMode",
      "strictSpace",
      oppositeShiftModeCommand,
      stopOnErrorCommand,
      confidenceModeCommand,
      "quickEnd",
      "indicateTypos",
      "hideExtraLetters",
      lazyModeCommand,
      layoutCommand,
      "codeUnindentOnBackspace"
    ),

    //sound
    ...buildCommands(
      "soundVolume",
      "playSoundOnClick",
      "playSoundOnError",
      "playTimeWarning"
    ),

    //caret
    ...buildCommands(
      "smoothCaret",
      "caretStyle",
      paceCaretCommand,
      "repeatedPace",
      "paceCaretStyle"
    ),

    //appearence
    ...buildCommands(
      "timerStyle",
      "liveSpeedStyle",
      "liveAccStyle",
      "liveBurstStyle",

      "timerColor",
      "timerOpacity",
      "highlightMode",

      "tapeMode",
      "tapeMargin",
      "smoothLineScroll",
      "showAllLines",
      "typingSpeedUnit",
      "alwaysShowDecimalPlaces",
      "startGraphsAtZero",
      "maxLineWidth",
      "fontSize",
      ...FontFamilyCommands,
      "keymapMode",
      "keymapStyle",
      "keymapLegendStyle",
      "keymapSize",
      keymapLayoutCommand,
      "keymapShowTopRow"
    ),

    //theme
    ...buildCommands(
      ...ThemesCommands,
      customThemeCommand,

      ...CustomThemesListCommands,
      "flipTestColors",
      "colorfulMode",
      ...AddOrRemoveThemeToFavorite,
      ...CustomBackgroundCommands,
      "customBackgroundSize",
      ...CustomBackgroundFilterCommands,
      "randomTheme"
    ),

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
    ...buildCommands(
      "showKeyTips",
      "showOutOfFocusWarning",
      "capsLockWarning",
      showAverageCommand,
      "monkeyPowerLevel",
      "monkey"
    ),

    //danger zone
    adsCommand,

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
        await UpdateConfig.applyFromJson(input);
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
      alias: "dismiss",
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
  keymapLayouts: keymapLayoutCommand.subgroup,
  enableAds: adsCommand.subgroup,
  customThemesList: customThemeCommand.subgroup,
  themes: ThemesCommands[0]?.subgroup,
  loadChallenge: LoadChallengeCommands[0]?.subgroup,
  languages: languageCommand.subgroup,
  difficulty: difficultyCommand.subgroup,
  lazyMode: lazyModeCommand.subgroup,
  paceCaretMode: paceCaretCommand.subgroup,
  showAverage: showAverageCommand.subgroup,
  minWpm: minSpeedCommand.subgroup,
  minAcc: minAccCommand.subgroup,
  minBurst: MinBurstCommands[0]?.subgroup,
  funbox: FunboxCommands[0]?.subgroup,
  confidenceMode: confidenceModeCommand.subgroup,
  stopOnError: stopOnErrorCommand.subgroup,
  layouts: layoutCommand.subgroup,
  oppositeShiftMode: oppositeShiftModeCommand.subgroup,
  tags: TagsCommands[0]?.subgroup,
  resultSaving: ResultSavingCommands[0]?.subgroup,
  blindMode: blindModeCommand.subgroup,
};

export function doesListExist(listName: string): boolean {
  return lists[listName as ListsObjectKeys] !== undefined;
}

export async function getList(
  listName: ListsObjectKeys
): Promise<CommandsSubgroup> {
  await Promise.allSettled([challengesPromise]);

  const list = lists[listName];
  if (!list) {
    Notifications.add(`List not found: ${listName}`, -1);
    throw new Error(`List ${listName} not found`);
  }
  return list;
}

let stack: CommandsSubgroup[] = [];

stack = [commands];

export function getStackLength(): number {
  return stack.length;
}

export type ListsObjectKeys = keyof typeof lists;

export function setStackToDefault(): void {
  setStack([commands]);
}

export function setStack(val: CommandsSubgroup[]): void {
  stack = val;
}

export function pushToStack(val: CommandsSubgroup): void {
  stack.push(val);
}

export function popFromStack(): void {
  stack.pop();
}

export function getTopOfStack(): CommandsSubgroup {
  return stack[stack.length - 1] as CommandsSubgroup;
}

let singleList: CommandsSubgroup | undefined;
export async function getSingleSubgroup(): Promise<CommandsSubgroup> {
  await Promise.allSettled([challengesPromise]);
  const singleCommands: Command[] = [];
  for (const command of commands.list) {
    const ret = buildSingleListCommands(command);
    singleCommands.push(...ret);
  }

  singleList = {
    title: "",
    list: singleCommands,
  };
  return singleList;
}

function buildSingleListCommands(
  command: Command,
  parentCommand?: Command
): Command[] {
  const commands: Command[] = [];
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
        available: async (): Promise<boolean> => {
          return (
            ((await parentCommand?.available?.()) ?? true) &&
            ((await command?.available?.()) ?? true)
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

function buildCommands(
  ...commands: (Command | keyof CommandlineConfigMetadataObject)[]
): Command[] {
  return commands.map((it) =>
    typeof it === "string" ? buildCommandForConfigKey(it) : it
  );
}
