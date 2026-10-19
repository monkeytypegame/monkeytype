import { intersect } from "@monkeytype/util/arrays";
import {
  For,
  JSXElement,
  Show,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import { debounce } from "throttle-debounce";

import { findMatchingCommands } from "../../commandline/filter";
import * as CommandlineLists from "../../commandline/lists";
import {
  Command,
  CommandsSubgroup,
  CommandWithValidation,
} from "../../commandline/types";
import { Config } from "../../config/store";
import * as AnalyticsController from "../../controllers/analytics-controller";
import * as ThemeController from "../../controllers/theme-controller";
import { createInputEventHandler } from "../../elements/input-validation";
import { isInputElementFocused } from "../../input/input-element";
import {
  getCommandlineShowSettings,
  setCommandlineShowSettings,
} from "../../states/commandline";
import { getActivePage } from "../../states/core";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import {
  clearModalStack,
  isModalInStack,
  isModalOpen,
  hideModal as storeHideModal,
  hideModalAndClearChain as storeClearChain,
} from "../../states/modals";
import { showNoticeNotification } from "../../states/notifications";
import { setTestFocusState } from "../../states/test";
import * as Focus from "../../test/focus";
import { FaObject } from "../../types/font-awesome";
import { ValidationResult } from "../../types/validation";
import { clearFontPreview } from "../../ui";
import { areUnsortedArraysEqual } from "../../utils/arrays";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Fa } from "../common/Fa";
import { ThemeBubbles } from "../common/ThemeBubbles";

const MODAL_ID = "Commandline";

/**
 * How many commands to render at once. The single list flattens every subgroup
 * into well over a thousand commands, and rendering all of them makes opening
 * the commandline and every keystroke in it noticeably slow. Only matches past
 * this cap are cut, which is far more than anyone scrolls through.
 */
const MAX_RENDERED_COMMANDS = 1000;

type CommandlineMode = "search" | "input";

/** `Command.icon` and `Command.iconType` are plain strings, so they need widening to the `Fa` props union. */
function faProps(icon: string, variant?: "regular" | "solid"): FaObject {
  return { icon, variant } as FaObject;
}

function isCommandActive(
  command: Command,
  subgroup: CommandsSubgroup,
): boolean {
  if (command.active !== undefined) {
    return command.active();
  }

  const configKey = command.configKey ?? subgroup.configKey;
  if (configKey === undefined) {
    return false;
  }

  if (command.configValueMode !== "include") {
    return Config[configKey] === command.configValue;
  }

  if (Array.isArray(command.configValue)) {
    return areUnsortedArraysEqual(
      intersect(Config[configKey] as unknown[], command.configValue),
      command.configValue,
    );
  }

  return (Config[configKey] as unknown[]).includes(command.configValue);
}

/**
 * Empty fixed-width icon, used to keep the display of inactive commands aligned
 * with the check mark of active ones.
 */
function ConfigIcon(props: { isActive: boolean; class?: string }): JSXElement {
  return (
    <Fa
      icon="fa-check"
      fixedWidth
      class={cn(!props.isActive && "invisible", props.class)}
    />
  );
}

function CommandIcon(props: {
  command: Command;
  isActive: boolean;
  singleList: boolean;
  colorClass: string;
}): JSXElement {
  // in list mode the leading icon doubles as the active indicator
  const useConfigIcon = (): boolean =>
    !props.singleList &&
    ((props.command.subgroup === undefined &&
      props.command.configValue !== undefined) ||
      props.command.active !== undefined);

  const icon = (): string => props.command.icon ?? "";
  const isTextIcon = (): boolean => icon() !== "" && !icon().startsWith("fa-");

  return (
    <Show
      when={!useConfigIcon()}
      fallback={
        <ConfigIcon
          isActive={props.isActive}
          class={cn("mr-2", props.colorClass)}
        />
      }
    >
      <Show
        when={isTextIcon()}
        fallback={
          <Fa
            {...faProps(
              icon() === "" ? "fa-chevron-right" : icon(),
              props.command.iconType,
            )}
            fixedWidth
            class={cn("mr-2", props.colorClass)}
          />
        }
      >
        <div
          class={cn(
            "mr-2 inline-block w-[1.25em] text-center font-black tracking-[-0.1rem]",
            props.colorClass,
          )}
        >
          {icon()}
        </div>
      </Show>
    </Show>
  );
}

/**
 * Font family commands preview their own font. `Helvetica` is swapped out as a
 * long standing easter egg.
 */
function fontFamilyPreview(command: Command): string | undefined {
  if (
    command.customData === undefined ||
    !command.id.startsWith("setFontFamily")
  ) {
    return undefined;
  }

  let fontFamily = String(command.customData["name"]);
  if (fontFamily === "Helvetica") {
    fontFamily = "Comic Sans MS";
  }
  if (command.customData["isSystem"] === false) {
    fontFamily += " Preview";
  }

  return `'${fontFamily}'`;
}

export function CommandlineModal(): JSXElement {
  let inputEl: HTMLInputElement | undefined;
  let suggestionsEl: HTMLDivElement | undefined;

  const [mode, setMode] = createSignal<CommandlineMode>("search");
  const [inputValue, setInputValue] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [usingSingleList, setUsingSingleList] = createSignal(false);
  const [list, setList] = createSignal<Command[]>([]);
  const [activeIds, setActiveIds] = createSignal<ReadonlySet<string>>(
    new Set(),
  );
  const [subgroupTitle, setSubgroupTitle] = createSignal("");
  const [inputCommand, setInputCommand] = createSignal<Command | null>(null);
  const [inputPlaceholder, setInputPlaceholder] = createSignal<string | null>(
    null,
  );
  const [inputIcon, setInputIcon] = createSignal<string | null>(null);
  const [warning, setWarning] = createSignal<string | null>(null);
  const [isChecking, setIsChecking] = createSignal(false);
  const [hiddenCount, setHiddenCount] = createSignal(0);
  const [hasError, setHasError] = createSignal(false);
  const [noBackground, setNoBackground] = createSignal(false);

  let subgroupOverride: CommandsSubgroup | null = null;
  let cachedSingleSubgroup: CommandsSubgroup | null = null;
  let validation: ValidationResult | undefined;
  let mouseMode = false;
  let isAnimating = false;
  let lastSingleListModeInputValue = "";
  let lastScrolledIndex: number | undefined;
  let shakeTimeout: NodeJS.Timeout | null = null;
  let latestRefreshId = 0;

  const activeCommand = createMemo(() => list()[activeIndex()]);

  const placeholder = (): string => {
    if (mode() === "input") {
      return inputPlaceholder() ?? "";
    }
    return subgroupTitle() !== "" ? subgroupTitle() : "Search...";
  };

  const removeCommandlineBackground = (): void => {
    setNoBackground(true);
    if (Config.showOutOfFocusWarning) {
      setTestFocusState("focused");
    }
  };

  const addCommandlineBackground = (): void => {
    setNoBackground(false);
    if (!isInputElementFocused()) {
      setTestFocusState("unfocused");
    }
  };

  const getSubgroup = async (): Promise<CommandsSubgroup> => {
    if (subgroupOverride !== null) {
      return subgroupOverride;
    }

    if (usingSingleList()) {
      cachedSingleSubgroup ??= await CommandlineLists.getSingleSubgroup();
      return cachedSingleSubgroup;
    }

    return CommandlineLists.getTopOfStack();
  };

  /**
   * Flags every command in the current subgroup as found or not, based on how
   * well its display and aliases match the words in the input.
   */
  const filterSubgroup = async (
    refreshId: number,
  ): Promise<CommandsSubgroup | null> => {
    const subgroup = await getSubgroup();
    subgroup.beforeList?.();
    const commands = subgroup.list;

    // a few `available()` implementations hit IndexedDB, so let them overlap
    // rather than queue up one per command
    const availability = await Promise.all(
      commands.map(async (command) => (await command.available?.()) ?? true),
    );

    // a newer refresh started meanwhile - `found` lives on the shared command
    // objects, so a stale result must not touch it
    if (refreshId !== latestRefreshId) return null;

    const found = findMatchingCommands(
      commands,
      availability,
      inputValue(),
      usingSingleList(),
    );
    for (const [index, command] of commands.entries()) {
      command.found = found[index] === true;
    }

    return subgroup;
  };

  const refresh = async (): Promise<void> => {
    const refreshId = ++latestRefreshId;
    const subgroup = await filterSubgroup(refreshId);
    if (subgroup === null || refreshId !== latestRefreshId) return;

    setSubgroupTitle(subgroup.title);

    if (inputValue() === "" && usingSingleList()) {
      setList([]);
      setHiddenCount(0);
      return;
    }

    const found = subgroup.list.filter((command) => command.found === true);

    // with an empty input, start out on the currently active option. It can sit
    // past the render cap (your current theme in a list of ~190), so the window
    // slides down to keep it reachable.
    const firstActive =
      inputValue() === ""
        ? found.findIndex((command) => isCommandActive(command, subgroup))
        : -1;

    const offset =
      firstActive >= MAX_RENDERED_COMMANDS
        ? firstActive - MAX_RENDERED_COMMANDS + 1
        : 0;

    const windowed = found.slice(offset, offset + MAX_RENDERED_COMMANDS);

    // `isCommandActive` reads the non-reactive Config, so the result is pinned
    // here rather than recomputed per row. Keeping it out of the list items
    // leaves those referentially stable, which is what lets `<For>` reuse rows
    // instead of rebuilding every one of them on each keystroke.
    const activeIds = new Set<string>();
    for (const command of windowed) {
      if (isCommandActive(command, subgroup)) {
        activeIds.add(command.id);
      }
    }

    setActiveIds(activeIds);
    setList(windowed);
    setHiddenCount(Math.max(found.length - MAX_RENDERED_COMMANDS, 0));

    if (firstActive !== -1) {
      setActiveIndex(firstActive - offset);
    }
  };

  /** The input is uncontrolled so that the caret position can be managed by hand. */
  const applyInputValue = (value: string, selectAll = false): void => {
    setInputValue(value);
    if (inputEl === undefined) return;

    inputEl.value = value;
    if (selectAll) {
      inputEl.setSelectionRange(0, value.length);
    } else {
      setTimeout(() => inputEl?.setSelectionRange(value.length, value.length));
    }
  };

  /*
   * Handlers need to be created only once per command to ensure they debounce with the given delay
   */
  const handlersCache = new Map<string, (e: Event) => Promise<void>>();

  const createValidationHandler = (command: Command): void => {
    if (!("validation" in command) || handlersCache.has(command.id)) return;

    const commandWithValidation = command as CommandWithValidation<unknown>;
    handlersCache.set(
      command.id,
      createInputEventHandler(
        updateValidationResult,
        commandWithValidation.validation,
        "inputValueConvert" in commandWithValidation
          ? commandWithValidation.inputValueConvert
          : undefined,
      ),
    );
  };

  const showCheckingIcon = debounce(200, () => setIsChecking(true));

  const hideCheckingIcon = (): void => {
    showCheckingIcon.cancel({ upcomingOnly: true });
    setIsChecking(false);
  };

  const updateValidationResult = (result: ValidationResult): void => {
    validation = result;
    if (result.status === "checking") {
      showCheckingIcon();
      return;
    }

    if (result.status === "failed" && result.errorMessage !== undefined) {
      setWarning(result.errorMessage);
    } else {
      setWarning(null);
    }
    hideCheckingIcon();
  };

  const enterInputMode = (command: Command): void => {
    setMode("input");
    setInputCommand(command);
    setInputPlaceholder(command.display);
    setInputIcon(command.icon ?? "fa-chevron-right");
    validation = undefined;
    createValidationHandler(command);
    applyInputValue(command.defaultValue?.() ?? "", true);
    setList([]);
    setHiddenCount(0);
  };

  const exitInputMode = (): void => {
    setMode("search");
    setInputCommand(null);
    setInputPlaceholder(null);
    setInputIcon(null);
    validation = undefined;
    setWarning(null);
    hideCheckingIcon();
  };

  const clearPreviewsAndLock = (): void => {
    clearFontPreview();
    void ThemeController.clearPreview();
    isAnimating = true;
  };

  const hide = (clearModalChain = false): void => {
    if (clearModalChain) {
      storeClearChain(MODAL_ID);
    } else {
      storeHideModal(MODAL_ID);
    }
  };

  const goBackOrHide = async (): Promise<void> => {
    if (mode() === "input") {
      exitInputMode();
      applyInputValue("");
      await refresh();
      return;
    }

    if (CommandlineLists.getStackLength() > 1) {
      CommandlineLists.popFromStack();
      setActiveIndex(0);
      applyInputValue("");
      await refresh();
      setWarning(null);
      return;
    }

    hide();
  };

  const handleInputSubmit = (): void => {
    if (isAnimating) return;

    const command = inputCommand();
    if (command === null) {
      throw new Error("Can't handle input submit - command is null");
    }

    if (validation?.status === "checking") {
      //validation ongoing, ignore the submit
      return;
    }

    if (validation?.status === "failed") {
      setHasError(true);
      if (shakeTimeout !== null) {
        clearTimeout(shakeTimeout);
      }
      shakeTimeout = setTimeout(() => setHasError(false), 500);
      return;
    }

    if ("inputValueConvert" in command) {
      const withConvert = command as CommandWithValidation<unknown>;
      command.exec?.({
        // @ts-expect-error the command converts the raw input itself
        input: withConvert.inputValueConvert(inputValue()),
      });
    } else {
      command.exec?.({ input: inputValue() });
    }

    void AnalyticsController.log("usedCommandLine", { command: command.id });
    hide();
  };

  const runActiveCommand = async (): Promise<void> => {
    if (isAnimating) return;

    const command = activeCommand();
    if (command === undefined) return;

    if (command.input === true) {
      enterInputMode(command);
      return;
    }

    if (command.subgroup !== undefined) {
      CommandlineLists.pushToStack(command.subgroup);
      setActiveIndex(0);
      applyInputValue("");
      await refresh();
      return;
    }

    command.exec?.({});

    if (Config.singleListCommandLine === "on") {
      lastSingleListModeInputValue = inputValue();
    }

    if (command.sticky === true) {
      await refresh();
      return;
    }

    void AnalyticsController.log("usedCommandLine", { command: command.id });
    if (command.opensModal === true) return;

    if (isModalOpen(MODAL_ID)) {
      hide(true);
    } else {
      // exec opened another modal, which is already hiding the commandline.
      // Clearing the chain here would drop that modal, so only make sure it
      // doesn't return to the commandline once closed.
      clearModalStack();
    }
  };

  const incrementActiveIndex = (): void => {
    setActiveIndex((index) => (index + 1 >= list().length ? 0 : index + 1));
  };

  const decrementActiveIndex = (): void => {
    setActiveIndex((index) => (index - 1 < 0 ? list().length - 1 : index - 1));
  };

  const debouncedSearch = debounce(50, () => void handleSearchInput());

  const handleSearchInput = async (): Promise<void> => {
    if (isAnimating || mode() !== "search") return;

    if (subgroupOverride === null) {
      setUsingSingleList(
        Config.singleListCommandLine === "on"
          ? true
          : inputValue().startsWith(">"),
      );
    }

    mouseMode = false;
    setActiveIndex(0);
    await refresh();
  };

  const handleInput = (
    e: InputEvent & { currentTarget: HTMLInputElement },
  ): void => {
    setInputValue(e.currentTarget.value);
    debouncedSearch();

    const command = inputCommand();
    if (command === null || !("validation" in command)) return;

    const handler = handlersCache.get(command.id);
    if (handler === undefined) {
      throw new Error(`Expected handler for command ${command.id} is missing`);
    }
    void handler(e);
  };

  const handleKeyDown = async (e: KeyboardEvent): Promise<void> => {
    //the commandline is on its way out - swallow everything
    if (isAnimating) {
      e.preventDefault();
      return;
    }

    mouseMode = false;
    const key = e.key.toLowerCase();

    if (e.key === "ArrowUp" || (e.ctrlKey && (key === "k" || key === "p"))) {
      // recall the last search when reopening the single list on an empty input
      if (
        Config.singleListCommandLine === "on" &&
        subgroupOverride === null &&
        inputValue() === "" &&
        lastSingleListModeInputValue !== ""
      ) {
        e.preventDefault();
        applyInputValue(lastSingleListModeInputValue);
        await refresh();
        return;
      }
      e.preventDefault();
      decrementActiveIndex();
    }

    if (e.key === "ArrowDown" || (e.ctrlKey && (key === "j" || key === "n"))) {
      e.preventDefault();
      incrementActiveIndex();
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        decrementActiveIndex();
      } else {
        incrementActiveIndex();
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (mode() === "search") {
        await runActiveCommand();
      } else {
        handleInputSubmit();
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      await goBackOrHide();
    }
  };

  const handleRowClick = async (index: number): Promise<void> => {
    setActiveIndex(index);
    await runActiveCommand();
  };

  const handleBeforeShow = async (): Promise<void> => {
    const settings = getCommandlineShowSettings();

    isAnimating = false;
    mouseMode = false;
    cachedSingleSubgroup = null;
    lastScrolledIndex = undefined;
    setActiveIndex(0);
    setList([]);
    setHiddenCount(0);
    setHasError(false);
    exitInputMode();

    const override = settings?.subgroupOverride ?? null;

    if (override !== null) {
      if (typeof override === "string") {
        if (CommandlineLists.doesListExist(override)) {
          showLoaderBar();
          try {
            subgroupOverride = await CommandlineLists.getList(override);
          } finally {
            hideLoaderBar();
          }
        } else {
          subgroupOverride = null;
          showNoticeNotification(`Command list ${override} not found`);
        }
      } else {
        subgroupOverride = override;
      }
      setUsingSingleList(false);
    } else {
      subgroupOverride = null;
      setUsingSingleList(Config.singleListCommandLine === "on");
    }

    Focus.set(false);
    CommandlineLists.setStackToDefault();
    applyInputValue("");
    await refresh();

    if (settings?.commandOverride === undefined) return;

    const command = (await getSubgroup()).list.find(
      (c) => c.id === settings.commandOverride,
    );

    if (command === undefined) {
      showNoticeNotification(`Command ${settings.commandOverride} not found`);
    } else if (command.input !== true) {
      showNoticeNotification(
        `Command ${settings.commandOverride} is not an input command`,
      );
    } else {
      enterInputMode(command);
    }
  };

  const handleAfterHide = (): void => {
    setWarning(null);
    hideCheckingIcon();
    addCommandlineBackground();
    if (getActivePage() !== "test") {
      (document.activeElement as HTMLElement | undefined)?.blur();
    }
    isAnimating = false;
    subgroupOverride = null;
    // a modal opened on top will return here - reopen with the same settings
    if (!isModalInStack(MODAL_ID)) {
      setCommandlineShowSettings(null);
    }
  };

  // theme and font previews follow the active command
  createEffect(() => {
    const command = activeCommand();
    if (isAnimating) return;

    clearFontPreview();

    if (
      command !== undefined &&
      (command.id.startsWith("changeTheme") ||
        command.id.startsWith("setCustomThemeId"))
    ) {
      removeCommandlineBackground();
    } else {
      void ThemeController.clearPreview();
      addCommandlineBackground();
    }

    command?.hover?.();
  });

  // keep the active command in view when navigating with the keyboard
  createEffect(() => {
    const index = activeIndex();
    void list();

    if (mouseMode || index === lastScrolledIndex) return;

    const container = suggestionsEl;
    const element = container?.querySelector<HTMLElement>(
      `[data-index="${index}"]`,
    );
    if (container === undefined || element === null || element === undefined) {
      return;
    }

    // scrollIntoView would scroll every scrollable ancestor, which drags the
    // input out of view whenever the modal itself overflows. Centre the row by
    // hand so only the suggestion list moves.
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    container.scrollTop +=
      elementRect.top -
      containerRect.top -
      (container.clientHeight - elementRect.height) / 2;

    lastScrolledIndex = index;
  });

  return (
    <AnimatedModal
      id="Commandline"
      focusFirstInput={true}
      beforeShow={handleBeforeShow}
      beforeHide={clearPreviewsAndLock}
      afterHide={handleAfterHide}
      onEscape={() => void goBackOrHide()}
      onBackdropClick={() => hide()}
      wrapperClass={cn(
        "duration-half items-start px-8 py-24 transition-colors",
        noBackground() && "bg-transparent",
      )}
      modalClass={cn(
        "duration-half flex max-w-[600px] flex-col gap-0 overflow-hidden p-0 ring-[0.2em] ring-transparent transition-shadow sm:p-0",
        noBackground() && "ring-sub-alt",
        hasError() && "animate-shake",
      )}
    >
      <div
        class="flex min-h-0 flex-1 flex-col"
        onMouseMove={() => (mouseMode = true)}
      >
        <div class="grid grid-cols-[auto_1fr] items-center">
          <Show
            when={isChecking()}
            fallback={
              <Fa
                {...faProps(
                  mode() === "input"
                    ? (inputIcon() ?? "fa-chevron-right")
                    : "fa-search",
                )}
                fixedWidth
                class="col-[1/2] row-[1/2] mx-4 mt-px text-sub"
              />
            }
          >
            <Fa
              icon="fa-circle-notch"
              spin
              fixedWidth
              class="col-[1/2] row-[1/2] mx-4 mt-px bg-bg text-sub"
            />
          </Show>
          <input
            ref={(el) => (inputEl = el)}
            type="text"
            class="w-full rounded-(--roundness) border-none bg-bg py-4 pr-4 pl-0 text-base text-text outline-none focus-visible:shadow-none"
            placeholder={placeholder()}
            onInput={handleInput}
            onKeyDown={(e) => void handleKeyDown(e)}
          />
        </div>

        <Show when={warning()}>
          {(message) => (
            <div class="grid grid-cols-[auto_1fr] bg-sub-alt py-2 text-xs">
              <Fa
                icon="fa-exclamation-triangle"
                fixedWidth
                class="mx-[1.15rem] text-error"
              />
              <div class="text-error">{message()}</div>
            </div>
          )}
        </Show>

        <div
          ref={(el) => (suggestionsEl = el)}
          class={cn(
            "ffscroll grid min-h-0 flex-1 cursor-pointer overflow-y-auto select-none",
            {
              "pb-2": list().length !== 0,
            },
          )}
        >
          <For each={list()}>
            {(command, index) => {
              const isRowActive = (): boolean => activeIndex() === index();
              const colorClass = (): string =>
                isRowActive() ? "text-bg" : "text-sub";
              const isConfigActive = (): boolean => activeIds().has(command.id);
              const isThemeCommand =
                command.customData !== undefined &&
                command.id.startsWith("changeTheme");

              return (
                <div
                  data-index={index()}
                  class={cn(
                    "grid grid-cols-[auto_1fr] px-4 py-2 text-xs leading-3",
                    isRowActive() ? "bg-text text-bg" : "text-sub",
                    isThemeCommand && "relative grid-cols-[auto_1fr_auto_auto]",
                  )}
                  style={{ "font-family": fontFamilyPreview(command) }}
                  onMouseMove={() => {
                    mouseMode = true;
                    setActiveIndex(index());
                  }}
                  onClick={() => void handleRowClick(index())}
                >
                  <div>
                    <CommandIcon
                      command={command}
                      isActive={isConfigActive()}
                      singleList={usingSingleList()}
                      colorClass={colorClass()}
                    />
                  </div>
                  <div>
                    <Show
                      when={
                        usingSingleList() &&
                        command.singleListParentDisplay !== undefined
                      }
                    >
                      {command.singleListParentDisplay}
                      <Fa
                        icon="fa-chevron-right"
                        fixedWidth
                        class={cn("mx-2", colorClass())}
                      />
                      <Show
                        when={
                          command.configValue !== undefined ||
                          command.active !== undefined
                        }
                      >
                        <ConfigIcon
                          isActive={isConfigActive()}
                          class={cn("mr-2", colorClass())}
                        />
                      </Show>
                    </Show>
                    {command.display}
                  </div>
                  <Show when={isThemeCommand}>
                    <div
                      class={cn(
                        "mr-1",
                        command.customData?.["isFavorite"] !== true && "hidden",
                      )}
                    >
                      <Fa icon="fa-star" />
                    </div>
                    <ThemeBubbles
                      inset
                      colors={{
                        bg: String(command.customData?.["bg"]),
                        main: String(command.customData?.["main"]),
                        sub: String(command.customData?.["sub"]),
                        text: String(command.customData?.["text"]),
                      }}
                    />
                  </Show>
                </div>
              );
            }}
          </For>
          <Show when={hiddenCount() > 0}>
            <div class="pointer-events-none px-4 py-2 text-xs leading-3 text-sub last:rounded-b-(--roundness)">
              {hiddenCount()} more {hiddenCount() === 1 ? "result" : "results"}{" "}
              - keep typing to narrow the search
            </div>
          </Show>
        </div>
      </div>
    </AnimatedModal>
  );
}
