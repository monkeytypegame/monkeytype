import MinBurstCommands from "./lists/min-burst";
import BailOutCommands from "./lists/bail-out";
import QuoteFavoriteCommands from "./lists/quote-favorites";
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
import LoadChallengeCommands from "./lists/load-challenge";

import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import { randomizeTheme } from "../controllers/theme-controller";
import { showModal } from "../states/modals";
import {
  showErrorNotification,
  clearAllNotifications,
  showSuccessNotification,
} from "../states/notifications";
import { Command, CommandlineListKey, CommandsSubgroup } from "./types";
import { buildCommandForConfigKey } from "./util";
import { CommandlineConfigKey } from "../config/metadata";
import { isAuthAvailable, signOut } from "../firebase";
import { isAuthenticated } from "../states/core";
import { ConfigKey } from "@monkeytype/schemas/configs";
import {
  hideFpsCounter,
  showFpsCounter,
} from "../components/layout/overlays/FpsCounter";
import { applyConfigFromJson } from "../config/lifecycle";
import { fixSkillIssue } from "../components/layout/overlays/SkillIssueFix";
import { getLastEventLog } from "../states/test";

const adsCommands = buildCommands("ads");

export const commands: CommandsSubgroup = {
  title: "",
  list: [
    //result
    ...ResultScreenCommands,

    //test screen
    ...buildCommands(
      "punctuation",
      "numbers",
      "mode",
      "time",
      "words",
      "quoteLength",
      "language",
    ),
    {
      id: "changeCustomModeText",
      display: "Change custom text",
      fa: { icon: "fa-align-left" },
      exec: (): void => {
        showModal("CustomText");
      },
    },
    {
      id: "viewQuoteSearchPopup",
      display: "Search for quotes",
      fa: { icon: "fa-search" },
      exec: (): void => {
        setConfig("mode", "quote");
        showModal("QuoteSearch");
      },
      shouldFocusTestUI: false,
    },
    {
      id: "viewLyricsSearchPopup",
      display: "Search for lyrics",
      fa: { icon: "fa-music" },
      exec: (): void => {
        showModal("LyricsSearch");
      },
      shouldFocusTestUI: false,
    },
    ...QuoteFavoriteCommands,
    ...BailOutCommands,
    {
      id: "shareTestSettings",
      display: "Share test settings",
      fa: { icon: "fa-share" },
      exec: (): void => {
        showModal("ShareTestSettings");
      },
    },

    //account
    ...TagsCommands,
    ...PresetsCommands,

    //behavior
    ...buildCommands(
      "resultSaving",
      "difficulty",
      "quickRestart",
      "repeatQuotes",
      "blindMode",
      "alwaysShowWordsHistory",
      "singleListCommandLine",
      "minWpm",
      "minAcc",
      ...MinBurstCommands,
      "britishEnglish",
      ...FunboxCommands,
      "customLayoutfluid",
      "customPolyglot",
    ),

    //input
    ...buildCommands(
      "freedomMode",
      "strictSpace",
      "oppositeShiftMode",
      "stopOnError",
      "deleteOnError",
      "confidenceMode",
      "quickEnd",
      "indicateTypos",
      "compositionDisplay",
      "hideExtraLetters",
      "lazyMode",
      "layout",
      "codeUnindentOnBackspace",
    ),

    //sound
    ...buildCommands(
      "soundVolume",
      "playSoundOnClick",
      "playSoundOnError",
      "playTimeWarning",
    ),

    //caret
    ...buildCommands(
      "smoothCaret",
      "caretStyle",
      "paceCaret",
      "repeatedPace",
      "paceCaretStyle",
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
      "typedEffect",

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
      "keymapLayout",
      "keymapKeys",
    ),

    //theme
    ...buildCommands(
      ...ThemesCommands,
      "customTheme",

      ...CustomThemesListCommands,
      "flipTestColors",
      "colorfulMode",
      ...AddOrRemoveThemeToFavorite,
      ...CustomBackgroundCommands,
      "customBackgroundSize",
      ...CustomBackgroundFilterCommands,
      "randomTheme",
    ),

    {
      id: "randomizeTheme",
      display: "Next random theme",
      fa: { icon: "fa-random" },
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
      "showAverage",
      "showPb",
      "monkeyPowerLevel",
      "monkey",
    ),

    //danger zone
    ...adsCommands,

    //other
    ...LoadChallengeCommands,
    ...NavigationCommands,
    {
      id: "importSettingsJSON",
      display: "Import settings JSON",
      fa: { icon: "fa-cog" },
      alias: "import config",
      input: true,
      exec: async ({ input }): Promise<void> => {
        if (input === undefined || input === "") return;
        await applyConfigFromJson(input);
      },
    },
    {
      id: "exportSettingsJSON",
      display: "Export settings JSON",
      fa: { icon: "fa-cog" },
      alias: "export config",
      input: true,
      defaultValue: (): string => {
        return JSON.stringify(Config);
      },
    },
    {
      id: "clearNotifications",
      display: "Clear all notifications",
      fa: { icon: "fa-trash-alt" },
      alias: "dismiss",
      exec: async (): Promise<void> => {
        clearAllNotifications();
      },
    },
    {
      id: "clearSwCache",
      display: "Clear SW cache",
      fa: { icon: "fa-cog" },
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
      fa: { icon: "fa-cog" },
      exec: async (): Promise<void> => {
        alert(await caches.keys());
      },
    },
    {
      id: "copyResultStats",
      display: "Copy last event log (result data)",
      alias: "stats events",
      fa: { icon: "fa-cog" },
      visible: false,
      available: (): boolean => {
        return getLastEventLog() !== null;
      },
      exec: async (): Promise<void> => {
        navigator.clipboard
          .writeText(JSON.stringify(getLastEventLog()))
          .then(() => {
            showSuccessNotification("Copied to clipboard");
          })
          .catch((e: unknown) => {
            showErrorNotification("Failed to copy to clipboard", { error: e });
          });
      },
    },
    {
      id: "fpsCounter",
      display: "FPS counter...",
      fa: { icon: "fa-cog" },
      visible: false,
      subgroup: {
        title: "FPS counter...",
        list: [
          {
            id: "startFpsCounter",
            display: "show",
            fa: { icon: "fa-cog" },
            exec: (): void => {
              showFpsCounter();
            },
          },
          {
            id: "stopFpsCounter",
            display: "hide",
            fa: { icon: "fa-cog" },
            exec: (): void => {
              hideFpsCounter();
            },
          },
        ],
      },
    },
    {
      id: "fixSkillIssue",
      display: "Fix skill issue",
      fa: { icon: "fa-wrench" },
      visible: false,
      exec: (): void => {
        fixSkillIssue();
      },
    },
    {
      id: "joinDiscord",
      display: "Join the Discord server",
      fa: { icon: "fa-users" },
      exec: (): void => {
        window.open("https://discord.gg/monkeytype");
      },
    },
    {
      id: "signOut",
      display: "Sign out",
      fa: { icon: "fa-sign-out-alt" },
      exec: (): void => {
        void signOut();
      },
      available: () => {
        return isAuthAvailable() && isAuthenticated();
      },
    },
  ],
};

const lists: Record<CommandlineListKey, CommandsSubgroup | undefined> = {
  themes: ThemesCommands[0]?.subgroup,
  loadChallenge: LoadChallengeCommands[0]?.subgroup,
  minBurst: MinBurstCommands[0]?.subgroup,
  funbox: FunboxCommands[0]?.subgroup,
  tags: TagsCommands[0]?.subgroup,
  ads: adsCommands[0]?.subgroup,
};

const subgroupByConfigKey = Object.fromEntries(
  commands.list
    .filter((it) => it.subgroup?.configKey !== undefined)
    .map((it) => [it.subgroup?.configKey, it.subgroup]),
) as Record<string, CommandsSubgroup>;

export function doesListExist(listName: string): boolean {
  if (subgroupByConfigKey[listName] !== undefined) {
    return true;
  }

  return lists[listName as CommandlineListKey] !== undefined;
}

export async function getList(
  listName: CommandlineListKey | ConfigKey,
): Promise<CommandsSubgroup> {
  const subGroup = subgroupByConfigKey[listName];
  if (subGroup !== undefined) {
    return subGroup;
  }

  const list = lists[listName as CommandlineListKey];
  if (!list) {
    showErrorNotification(`List not found: ${listName}`);
    throw new Error(`List ${listName} not found`);
  }
  return list;
}

let stack: CommandsSubgroup[] = [];

stack = [commands];

export function getStackLength(): number {
  return stack.length;
}

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
  parentCommand?: Command,
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
        "",
      );
      const singleListDisplayNoIcon = `${parentCommandDisplay} ${command.display}`;

      let newAlias: string | undefined = undefined;

      if ((parentCommand.alias ?? "") || (command.alias ?? "")) {
        newAlias = [parentCommand.alias, command.alias]
          .filter(Boolean)
          .join(" ");
      }

      const newCommand = {
        ...command,
        singleListParentDisplay: parentCommandDisplay,
        singleListDisplayNoIcon,
        configKey: parentCommand.subgroup?.configKey,
        fa: parentCommand.fa,
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
  ...commands: (Command | CommandlineConfigKey)[]
): Command[] {
  return commands.map((it) =>
    typeof it === "string" ? buildCommandForConfigKey(it) : it,
  );
}
