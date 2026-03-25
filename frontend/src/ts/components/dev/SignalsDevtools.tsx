import type { TanStackDevtoolsSolidPlugin } from "@tanstack/solid-devtools";

import {
  createEffect,
  createSignal,
  For,
  JSXElement,
  on,
  Show,
} from "solid-js";

import { getConfig } from "../../config/store";
import { getBanners } from "../../states/banners";
import { bp } from "../../states/breakpoints";
import {
  getActivePage,
  setActivePage,
  getVersion,
  setVersion,
  getThemeIndicator,
  setThemeIndicator,
  getCommandlineSubgroup,
  setCommandlineSubgroup,
  getGlobalOffsetTop,
  setGlobalOffsetTop,
  getIsScreenshotting,
  setIsScreenshotting,
  getUserId,
  setUserId,
  isLoggedIn,
  getSelectedProfileName,
  setSelectedProfileName,
} from "../../states/core";
import {
  getAnimatedLevel,
  setAnimatedLevel,
  getAccountButtonSpinner,
  setAccountButtonSpinner,
  getXpBarData,
  setXpBarData,
} from "../../states/header";
import { hotkeys } from "../../states/hotkeys";
import {
  getSelection,
  getPage,
  setPage,
  getGoToUserPage,
  setGoToUserPage,
} from "../../states/leaderboard-selection";
import {
  getLoaderBarSignal,
  showLoaderBar,
  hideLoaderBar,
} from "../../states/loader-bar";
import {
  getLoginPageInputsEnabled,
  enableLoginPageInputs,
  disableLoginPageInputs,
} from "../../states/login";
import { modalState } from "../../states/modals";
import {
  getNotifications,
  getNotificationHistory,
} from "../../states/notifications";
import { getPsas } from "../../states/psas";
import { currentQuote, quoteStats } from "../../states/quote-rate";
import { quoteId } from "../../states/quote-report";
import { simpleModalConfig } from "../../states/simple-modal";
import {
  getSnapshot,
  getLastResult,
  setLastResult,
} from "../../states/snapshot";
import {
  wordsHaveNewline,
  setWordsHaveNewline,
  wordsHaveTab,
  setWordsHaveTab,
  getLoadedChallenge,
  setLoadedChallenge,
  getResultVisible,
  setResultVisible,
  getFocus,
  setFocus,
} from "../../states/test";
import { setTheme, getTheme } from "../../states/theme";

type SignalEntry = {
  name: string;
  get: () => unknown;
  set?: (value: unknown) => void;
  actions?: Record<string, () => void>;
};
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
      {
        name: "activePage",
        get: getActivePage,
        set: setActivePage as (v: unknown) => void,
      },
      {
        name: "version",
        get: getVersion,
        set: setVersion as (v: unknown) => void,
      },
      {
        name: "themeIndicator",
        get: getThemeIndicator,
        set: setThemeIndicator as (v: unknown) => void,
      },
      {
        name: "commandlineSubgroup",
        get: getCommandlineSubgroup,
        set: setCommandlineSubgroup as (v: unknown) => void,
      },
      {
        name: "globalOffsetTop",
        get: getGlobalOffsetTop,
        set: setGlobalOffsetTop as (v: unknown) => void,
      },
      {
        name: "isScreenshotting",
        get: getIsScreenshotting,
        set: setIsScreenshotting as (v: unknown) => void,
      },
      {
        name: "userId",
        get: getUserId,
        set: setUserId as (v: unknown) => void,
      },
      { name: "isLoggedIn", get: isLoggedIn },
      {
        name: "selectedProfileName",
        get: getSelectedProfileName,
        set: setSelectedProfileName as (v: unknown) => void,
      },
    ],
  },
  {
    file: "header",
    signals: [
      {
        name: "animatedLevel",
        get: getAnimatedLevel,
        set: setAnimatedLevel as (v: unknown) => void,
      },
      {
        name: "accountButtonSpinner",
        get: getAccountButtonSpinner,
        set: setAccountButtonSpinner as (v: unknown) => void,
      },
      {
        name: "xpBarData",
        get: getXpBarData,
        set: setXpBarData as (v: unknown) => void,
      },
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
      { name: "page", get: getPage, set: setPage as (v: unknown) => void },
      {
        name: "goToUserPage",
        get: getGoToUserPage,
        set: setGoToUserPage as (v: unknown) => void,
      },
    ],
  },
  {
    file: "loader-bar",
    signals: [
      {
        name: "loaderBarSignal",
        get: getLoaderBarSignal,
        actions: {
          showLoaderBar: () => showLoaderBar(),
          hideLoaderBar: () => hideLoaderBar(),
        },
      },
    ],
  },
  {
    file: "login",
    signals: [
      {
        name: "loginPageInputsEnabled",
        get: getLoginPageInputsEnabled,
        actions: {
          enable: () => enableLoginPageInputs(),
          disable: () => disableLoginPageInputs(),
        },
      },
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
      {
        name: "lastResult",
        get: getLastResult,
        set: setLastResult as (v: unknown) => void,
      },
    ],
  },
  {
    file: "theme",
    signals: [
      { name: "theme", get: getTheme, set: setTheme as (v: unknown) => void },
    ],
  },
  {
    file: "test",
    signals: [
      {
        name: "wordsHaveNewline",
        get: wordsHaveNewline,
        set: setWordsHaveNewline as (v: unknown) => void,
      },
      {
        name: "wordsHaveTab",
        get: wordsHaveTab,
        set: setWordsHaveTab as (v: unknown) => void,
      },
      {
        name: "loadedChallenge",
        get: getLoadedChallenge,
        set: setLoadedChallenge as (v: unknown) => void,
      },
      {
        name: "resultVisible",
        get: getResultVisible,
        set: setResultVisible as (v: unknown) => void,
      },
      { name: "focus", get: getFocus, set: setFocus as (v: unknown) => void },
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

function parseValue(input: string): unknown {
  const trimmed = input.trim();
  if (trimmed === "null") return null;
  if (trimmed === "undefined") return undefined;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  const num = Number(trimmed);
  if (trimmed !== "" && !Number.isNaN(num)) return num;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function SignalRow(props: { signal: SignalEntry }): JSXElement {
  const [flashing, setFlashing] = createSignal(false);
  const [editing, setEditing] = createSignal(false);
  const [editValue, setEditValue] = createSignal("");
  let initialized = false;

  const isEditable = (): boolean =>
    props.signal.set !== undefined || props.signal.actions !== undefined;

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

  function startEditing(): void {
    if (!isEditable()) return;
    setEditValue(formatValue(props.signal.get()));
    setEditing(true);
  }

  function commitEdit(): void {
    if (props.signal.set !== undefined) {
      props.signal.set(parseValue(editValue()));
    }
    setEditing(false);
  }

  function cancelEdit(): void {
    setEditing(false);
  }

  return (
    <tr
      class="border-b transition-colors duration-125"
      style={{
        "border-color": "#292E3D",
        "background-color": flashing() ? "rgba(83, 177, 253, 0.15)" : "",
      }}
    >
      <td class="w-50 px-2 py-1 whitespace-nowrap">{props.signal.name}</td>
      <td class="px-2 py-1 break-all">
        <Show
          when={editing()}
          fallback={
            <span
              class={
                props.signal.set !== undefined
                  ? "cursor-pointer hover:underline"
                  : ""
              }
              onClick={
                props.signal.set !== undefined
                  ? () => {
                      if (typeof props.signal.get() === "boolean") {
                        props.signal.set!(!props.signal.get());
                      } else {
                        startEditing();
                      }
                    }
                  : undefined
              }
            >
              {formatValue(props.signal.get())}
            </span>
          }
        >
          <input
            type="text"
            value={editValue()}
            onInput={(e) => {
              e.preventDefault();
              e.stopImmediatePropagation();
              setEditValue(e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            ref={(el) => setTimeout(() => el.focus())}
            class="w-full rounded border px-1 py-0.5 text-xs text-text outline-none focus:border-main"
            style={{
              "background-color": "#313749",
              "border-color": "#414962",
            }}
          />
        </Show>
      </td>
      <td class="w-50 px-2 py-1 whitespace-nowrap">
        <Show when={props.signal.set !== undefined}>
          <Show
            when={editing()}
            fallback={
              <button
                type="button"
                class="cursor-pointer rounded px-1.5 py-0.5 text-xs text-text hover:brightness-125"
                style={{
                  "background-color": "#313749",
                  border: "1px solid #414962",
                }}
                onClick={startEditing}
              >
                edit
              </button>
            }
          >
            <div class="flex gap-1">
              <button
                type="button"
                class="cursor-pointer rounded px-1.5 py-0.5 text-xs text-text hover:brightness-125"
                style={{
                  "background-color": "#313749",
                  border: "1px solid #414962",
                }}
                onClick={commitEdit}
              >
                set
              </button>
              <button
                type="button"
                class="cursor-pointer rounded px-1.5 py-0.5 text-xs text-text/50 hover:text-text"
                onClick={cancelEdit}
              >
                cancel
              </button>
            </div>
          </Show>
        </Show>
        <Show when={props.signal.actions !== undefined}>
          <div class="flex flex-wrap gap-1">
            <For each={Object.entries(props.signal.actions ?? {})}>
              {([name, fn]) => (
                <button
                  type="button"
                  class="cursor-pointer rounded px-1.5 py-0.5 text-xs text-text hover:brightness-125"
                  style={{
                    "background-color": "#313749",
                    border: "1px solid #414962",
                  }}
                  onClick={() => fn()}
                >
                  {name}
                </button>
              )}
            </For>
          </div>
        </Show>
      </td>
    </tr>
  );
}

function SignalGroupSection(props: { group: SignalGroup }): JSXElement {
  const [collapsed, setCollapsed] = createSignal(false);

  return (
    <div class="mb-4">
      <button
        type="button"
        class="mb-1 flex w-full cursor-pointer items-center gap-1 border-b px-2 py-1 text-left text-sm font-bold"
        style={{ color: "#53B1FD", "border-color": "#292E3D" }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span
          class="inline-block transition-transform duration-150"
          style={{
            transform: collapsed() ? "rotate(-90deg)" : "rotate(0deg)",
          }}
        >
          &#9660;
        </span>
        {props.group.file}
      </button>
      <Show when={!collapsed()}>
        <table class="w-full border-collapse">
          <tbody>
            <For each={props.group.signals}>
              {(signal) => <SignalRow signal={signal} />}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
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
          {(group) => <SignalGroupSection group={group} />}
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
