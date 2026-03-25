import type { TanStackDevtoolsSolidPlugin } from "@tanstack/solid-devtools";

import { createEffect, createSignal, For, JSXElement, on } from "solid-js";

import { getConfig } from "../../config/store";
import { getBanners } from "../../states/banners";
import { bp } from "../../states/breakpoints";
import {
  getActivePage,
  getVersion,
  getThemeIndicator,
  getCommandlineSubgroup,
  getGlobalOffsetTop,
  getIsScreenshotting,
  getUserId,
  isLoggedIn,
  getSelectedProfileName,
} from "../../states/core";
import {
  getAnimatedLevel,
  getAccountButtonSpinner,
  getXpBarData,
} from "../../states/header";
import { hotkeys } from "../../states/hotkeys";
import {
  getSelection,
  getPage,
  getGoToUserPage,
} from "../../states/leaderboard-selection";
import { getLoaderBarSignal } from "../../states/loader-bar";
import { getLoginPageInputsEnabled } from "../../states/login";
import { modalState } from "../../states/modals";
import {
  getNotifications,
  getNotificationHistory,
} from "../../states/notifications";
import { getPsas } from "../../states/psas";
import { currentQuote, quoteStats } from "../../states/quote-rate";
import { quoteId } from "../../states/quote-report";
import { simpleModalConfig } from "../../states/simple-modal";
import { getSnapshot, getLastResult } from "../../states/snapshot";
import {
  wordsHaveNewline,
  wordsHaveTab,
  getLoadedChallenge,
  getResultVisible,
  getFocus,
} from "../../states/test";
import { getTheme } from "../../states/theme";

type SignalEntry = { name: string; get: () => unknown };
type SignalGroup = { file: string; signals: SignalEntry[] };

const groups: SignalGroup[] = [
  {
    file: "banners",
    signals: [{ name: "banners", get: getBanners }],
  },
  {
    file: "breakpoints",
    signals: [{ name: "bp", get: bp }],
  },
  {
    file: "config/store",
    signals: [{ name: "config", get: () => ({ ...getConfig }) }],
  },
  {
    file: "core",
    signals: [
      { name: "activePage", get: getActivePage },
      { name: "version", get: getVersion },
      { name: "themeIndicator", get: getThemeIndicator },
      { name: "commandlineSubgroup", get: getCommandlineSubgroup },
      { name: "globalOffsetTop", get: getGlobalOffsetTop },
      { name: "isScreenshotting", get: getIsScreenshotting },
      { name: "userId", get: getUserId },
      { name: "isLoggedIn", get: isLoggedIn },
      { name: "selectedProfileName", get: getSelectedProfileName },
    ],
  },
  {
    file: "header",
    signals: [
      { name: "animatedLevel", get: getAnimatedLevel },
      { name: "accountButtonSpinner", get: getAccountButtonSpinner },
      { name: "xpBarData", get: getXpBarData },
    ],
  },
  {
    file: "hotkeys",
    signals: [{ name: "hotkeys", get: () => ({ ...hotkeys }) }],
  },
  {
    file: "leaderboard-selection",
    signals: [
      { name: "selection", get: getSelection },
      { name: "page", get: getPage },
      { name: "goToUserPage", get: getGoToUserPage },
    ],
  },
  {
    file: "loader-bar",
    signals: [{ name: "loaderBarSignal", get: getLoaderBarSignal }],
  },
  {
    file: "login",
    signals: [
      { name: "loginPageInputsEnabled", get: getLoginPageInputsEnabled },
    ],
  },
  {
    file: "modals",
    signals: [
      { name: "openModals", get: () => ({ ...modalState.openModals }) },
      { name: "modalStack", get: () => [...modalState.modalStack] },
      { name: "pendingModal", get: () => modalState.pendingModal },
      { name: "pendingIsChained", get: () => modalState.pendingIsChained },
    ],
  },
  {
    file: "notifications",
    signals: [
      { name: "notifications", get: getNotifications },
      { name: "notificationHistory", get: getNotificationHistory },
    ],
  },
  {
    file: "psas",
    signals: [{ name: "psas", get: getPsas }],
  },
  {
    file: "quote-rate",
    signals: [
      { name: "currentQuote", get: currentQuote },
      { name: "quoteStats", get: quoteStats },
    ],
  },
  {
    file: "quote-report",
    signals: [{ name: "quoteId", get: quoteId }],
  },
  {
    file: "simple-modal",
    signals: [{ name: "simpleModalConfig", get: simpleModalConfig }],
  },
  {
    file: "snapshot",
    signals: [
      { name: "snapshot", get: getSnapshot },
      { name: "lastResult", get: getLastResult },
    ],
  },
  {
    file: "theme",
    signals: [{ name: "theme", get: getTheme }],
  },
  {
    file: "test",
    signals: [
      { name: "wordsHaveNewline", get: wordsHaveNewline },
      { name: "wordsHaveTab", get: wordsHaveTab },
      { name: "loadedChallenge", get: getLoadedChallenge },
      { name: "resultVisible", get: getResultVisible },
      { name: "focus", get: getFocus },
    ],
  },
];

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`;
  }
  return JSON.stringify(value);
}

function SignalRow(props: { signal: SignalEntry }): JSXElement {
  const [flashing, setFlashing] = createSignal(false);
  let initialized = false;

  createEffect(
    on(
      () => formatValue(props.signal.get()),
      () => {
        if (!initialized) {
          initialized = true;
          return;
        }
        setFlashing(true);
        setTimeout(() => setFlashing(false), 125);
      },
    ),
  );

  return (
    <tr
      class="border-b transition-colors duration-125"
      style={{
        "border-color": "#292E3D",
        "background-color": flashing() ? "rgba(83, 177, 253, 0.15)" : "",
      }}
    >
      <td class="w-1/3 px-2 py-1 whitespace-nowrap">{props.signal.name}</td>
      <td class="px-2 py-1 break-all">{formatValue(props.signal.get())}</td>
    </tr>
  );
}

function SignalsPanel(): JSXElement {
  const [search, setSearch] = createSignal("");

  const filteredGroups = (): SignalGroup[] => {
    const query = search().toLowerCase();
    if (query === "") return groups;
    return groups
      .map((group) => {
        if (group.file.toLowerCase().includes(query)) return group;
        const filtered = group.signals.filter((s) =>
          s.name.toLowerCase().includes(query),
        );
        return { file: group.file, signals: filtered };
      })
      .filter((group) => group.signals.length > 0);
  };

  return (
    <div class="relative max-h-100 overflow-scroll overflow-y-auto font-mono text-xs text-text">
      <div
        class="sticky top-0 z-10 p-3 pb-0"
        style={{ "background-color": "#1A1C24" }}
      >
        <input
          type="text"
          placeholder="Filter by signal or file name..."
          value={search()}
          onInput={(e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            setSearch(e.currentTarget.value);
          }}
          class="mb-3 w-full rounded border border-sub bg-bg px-2 py-1 text-xs text-text outline-none placeholder:text-sub focus:border-main"
          style={{
            "background-color": "#313749",
            "border-color": "#414962",
          }}
        />
      </div>
      <div class="px-3 pb-3">
        <For each={filteredGroups()}>
          {(group) => (
            <div class="mb-4">
              <div
                class="mb-1 border-b px-2 py-1 text-sm font-bold"
                style={{ color: "#53B1FD", "border-color": "#292E3D" }}
              >
                {group.file}
              </div>
              <table class="w-full border-collapse">
                <tbody>
                  <For each={group.signals}>
                    {(signal) => <SignalRow signal={signal} />}
                  </For>
                </tbody>
              </table>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

export function SignalsDevtoolsPlugin(): TanStackDevtoolsSolidPlugin {
  return {
    id: "core-signals",
    name: "Core Signals",
    render: () => <SignalsPanel />,
  };
}
