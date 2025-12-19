import * as Focus from "../test/focus";
import * as CommandlineLists from "./lists";
import Config from "../config";
import * as AnalyticsController from "../controllers/analytics-controller";
import * as ThemeController from "../controllers/theme-controller";
import { clearFontPreview } from "../ui";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import * as Notifications from "../elements/notifications";
import * as OutOfFocus from "../test/out-of-focus";
import * as ActivePage from "../states/active-page";
import * as Loader from "../elements/loader";
import { Command, CommandsSubgroup, CommandWithValidation } from "./types";
import { areSortedArraysEqual, areUnsortedArraysEqual } from "../utils/arrays";
import { parseIntOptional } from "../utils/numbers";
import { debounce } from "throttle-debounce";
import { intersect } from "@monkeytype/util/arrays";
import {
  createInputEventHandler,
  ValidationResult,
} from "../elements/input-validation";
import { isInputElementFocused } from "../input/input-element";
import { qs } from "../utils/dom";

type CommandlineMode = "search" | "input";
type InputModeParams = {
  command: Command | null;
  placeholder: string | null;
  value: string | null;
  icon: string | null;
  validation?: ValidationResult;
};

let activeIndex = 0;
let usingSingleList = false;
let inputValue = "";
let activeCommand: Command | null = null;
let mouseMode = false;
let mode: CommandlineMode = "search";
let inputModeParams: InputModeParams = {
  command: null,
  placeholder: "",
  value: "",
  icon: "",
};
let subgroupOverride: CommandsSubgroup | null = null;
let isAnimating = false;
let lastSingleListModeInputValue = "";

type CommandWithIsActive = Command & { isActive: boolean };

let lastState:
  | {
      list: CommandWithIsActive[];
      usingSingleList: boolean;
    }
  | undefined;

function removeCommandlineBackground(): void {
  qs("#commandLine")?.addClass("noBackground");
  if (Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
}

function addCommandlineBackground(): void {
  qs("#commandLine")?.removeClass("noBackground");
  if (!isInputElementFocused()) {
    OutOfFocus.show();
  }
}

type ShowSettings = {
  subgroupOverride?: CommandsSubgroup | string;
  commandOverride?: string;
  singleListOverride?: boolean;
};

export function show(
  settings?: ShowSettings,
  modalShowSettings?: ShowOptions,
): void {
  void modal.show({
    ...modalShowSettings,
    focusFirstInput: true,
    beforeAnimation: async () => {
      mouseMode = false;
      inputValue = "";
      activeIndex = 0;
      mode = "search";
      cachedSingleSubgroup = null;
      inputModeParams = {
        command: null,
        placeholder: null,
        value: null,
        icon: null,
      };
      if (settings?.subgroupOverride !== undefined) {
        if (typeof settings.subgroupOverride === "string") {
          const exists = CommandlineLists.doesListExist(
            settings.subgroupOverride,
          );
          if (exists) {
            Loader.show();
            subgroupOverride = await CommandlineLists.getList(
              settings.subgroupOverride as CommandlineLists.ListsObjectKeys,
            );
            Loader.hide();
          } else {
            subgroupOverride = null;
            usingSingleList = Config.singleListCommandLine === "on";
            Notifications.add(
              `Command list ${settings.subgroupOverride} not found`,
              0,
            );
          }
        } else {
          subgroupOverride = settings.subgroupOverride;
        }
        usingSingleList = false;
      } else {
        subgroupOverride = null;
        usingSingleList = Config.singleListCommandLine === "on";
      }

      let showInputCommand: Command | undefined = undefined;

      if (settings?.commandOverride !== undefined) {
        const command = (await getList()).find(
          (c) => c.id === settings.commandOverride,
        );
        if (command === undefined) {
          Notifications.add(`Command ${settings.commandOverride} not found`, 0);
        } else if (command?.input !== true) {
          Notifications.add(
            `Command ${settings.commandOverride} is not an input command`,
            0,
          );
        } else {
          showInputCommand = command;
        }
      }

      if (settings?.singleListOverride) {
        usingSingleList = settings.singleListOverride;
      }
      activeCommand = null;
      Focus.set(false);
      CommandlineLists.setStackToDefault();
      await updateInput();
      await filterSubgroup();
      await showCommands();
      await updateActiveCommand();
      setTimeout(() => {
        keepActiveCommandInView();
        if (showInputCommand) {
          const escaped =
            showInputCommand.display.split("</i>")[1] ??
            showInputCommand.display;
          mode = "input";
          inputModeParams = {
            command: showInputCommand,
            placeholder: escaped,
            value: showInputCommand.defaultValue?.() ?? "",
            icon: showInputCommand.icon ?? "fa-chevron-right",
          };
          createValidationHandler(showInputCommand);
          void updateInput(inputModeParams.value as string);
          hideCommands();
        }
      }, 1);
    },
  });
}

function hide(clearModalChain = false): void {
  clearFontPreview();
  void ThemeController.clearPreview();
  isAnimating = true;
  void modal.hide({
    clearModalChain,
    afterAnimation: async () => {
      hideWarning();
      addCommandlineBackground();
      if (ActivePage.get() !== "test") {
        (document.activeElement as HTMLElement | undefined)?.blur();
      }
      isAnimating = false;
    },
  });
}

async function goBackOrHide(): Promise<void> {
  if (mode === "input") {
    mode = "search";
    inputModeParams = {
      command: null,
      placeholder: null,
      value: null,
      icon: null,
    };
    await updateInput("");
    await filterSubgroup();
    await showCommands();
    await updateActiveCommand();
    hideWarning();
    return;
  }

  if (CommandlineLists.getStackLength() > 1) {
    CommandlineLists.popFromStack();
    activeIndex = 0;
    await updateInput("");
    await filterSubgroup();
    await showCommands();
    await updateActiveCommand();
    hideWarning();
  } else {
    hide();
  }
}

async function filterSubgroup(): Promise<void> {
  const subgroup = await getSubgroup();
  subgroup.beforeList?.();
  const list = subgroup.list;

  const inputNoQuickSingle = inputValue
    .replace(/^>/gi, "")
    .toLowerCase()
    .trim();

  const inputSplit =
    inputNoQuickSingle.length === 0 ? [] : inputNoQuickSingle.split(" ");

  const matches: {
    matchCount: number;
    matchStrength: number;
  }[] = [];

  const matchCounts: number[] = [];
  for (const command of list) {
    const isAvailable = (await command.available?.()) ?? true;
    if (!isAvailable) {
      matches.push({
        matchCount: -1,
        matchStrength: -1,
      });
      continue;
    }

    if (inputNoQuickSingle.length === 0 || inputSplit.length === 0) {
      matches.push({
        matchCount: 0,
        matchStrength: 0,
      });
      continue;
    }

    const displaySplit = (
      usingSingleList
        ? (command.singleListDisplayNoIcon ?? "") || command.display
        : command.display
    )
      .toLowerCase()
      .split(" ");
    const aliasSplit = command.alias?.toLowerCase().split(" ") ?? [];

    const displayAliasSplit = displaySplit.concat(aliasSplit);
    const displayAliasMatchArray: (number | null)[] = displayAliasSplit.map(
      () => null,
    );

    let matchStrength = 0;

    for (const [inputIndex, input] of inputSplit.entries()) {
      for (const [
        displayAliasIndex,
        displayAlias,
      ] of displayAliasSplit.entries()) {
        const matchedInputIndex = displayAliasMatchArray[displayAliasIndex] as
          | null
          | number;
        if (
          displayAlias.startsWith(input) &&
          matchedInputIndex === null &&
          !displayAliasMatchArray.includes(inputIndex)
        ) {
          displayAliasMatchArray[displayAliasIndex] = inputIndex;
          matchStrength += input.length;
        }
      }
    }

    const matchCount = displayAliasMatchArray.filter((i) => i !== null).length;

    matchCounts.push(matchCount);
    matches.push({
      matchCount,
      matchStrength,
    });
  }

  const maxMatchStrength = Math.max(...matches.map((m) => m.matchStrength));

  let minMatchCountToShow = inputSplit.length;

  do {
    const count = matchCounts.filter((m) => m >= minMatchCountToShow).length;
    if (count > 0) {
      break;
    }
    minMatchCountToShow--;
  } while (minMatchCountToShow > 0);

  if (minMatchCountToShow === 0) {
    minMatchCountToShow = 1;
  }

  for (const [index, command] of list.entries()) {
    const match = matches[index];
    if (match === undefined) {
      command.found = false;
      continue;
    }
    if (
      match.matchCount >= minMatchCountToShow &&
      match.matchStrength >= maxMatchStrength
    ) {
      command.found = true;
    } else {
      command.found = false;
    }
  }
}

function hideCommands(): void {
  const element = document.querySelector("#commandLine .suggestions");
  if (element === null) {
    throw new Error("Commandline element not found");
  }
  element.innerHTML = "";
  lastState = undefined;
}

let cachedSingleSubgroup: CommandsSubgroup | null = null;

async function getSubgroup(): Promise<CommandsSubgroup> {
  if (subgroupOverride !== null) {
    return subgroupOverride;
  }

  if (usingSingleList) {
    if (cachedSingleSubgroup === null) {
      cachedSingleSubgroup = await CommandlineLists.getSingleSubgroup();
    } else {
      return cachedSingleSubgroup;
    }
  }

  return CommandlineLists.getTopOfStack();
}

async function getList(): Promise<Command[]> {
  return (await getSubgroup()).list;
}

function getCommandIconsHtml(command: Command & { isActive: boolean }): {
  iconHtml: string;
  configIconHtml: string;
} {
  let iconHtml = `<i class="fas fa-fw fa-chevron-right"></i>`;
  if (command.icon !== undefined && command.icon !== "") {
    const faIcon = command.icon.startsWith("fa-");
    const faType = command.iconType ?? "solid";
    const faTypeClass = faType === "solid" ? "fas" : "far";
    if (!faIcon) {
      iconHtml = `<div class="textIcon">${command.icon}</div>`;
    } else {
      iconHtml = `<i class="${faTypeClass} fa-fw ${command.icon}"></i>`;
    }
  }

  let configIconHtml = `<i class="fas fa-fw"></i>`;
  if (command.isActive) {
    configIconHtml = `<i class="fas fa-fw fa-check"></i>`;
  }

  return {
    iconHtml,
    configIconHtml,
  };
}

async function showCommands(): Promise<void> {
  const element = document.querySelector("#commandLine .suggestions");
  if (element === null) {
    throw new Error("Commandline element not found");
  }

  if (inputValue === "" && usingSingleList) {
    hideCommands();
    return;
  }

  const subgroup = await getSubgroup();

  const list = subgroup.list
    .filter((c) => c.found === true)
    .map((command) => {
      let isActive = false;
      if (command.active !== undefined) {
        isActive = command.active();
      } else {
        const configKey = command.configKey ?? subgroup.configKey;
        if (configKey !== undefined) {
          if (command.configValueMode === "include") {
            if (Array.isArray(command.configValue)) {
              isActive = areUnsortedArraysEqual(
                intersect(Config[configKey] as unknown[], command.configValue),
                command.configValue,
              );
            } else {
              isActive = (Config[configKey] as unknown[]).includes(
                command.configValue,
              );
            }
          } else {
            isActive = Config[configKey] === command.configValue;
          }
        }
      }

      return { ...command, isActive } as CommandWithIsActive;
    });

  if (
    lastState &&
    usingSingleList === lastState.usingSingleList &&
    areSortedArraysEqual(list, lastState.list)
  ) {
    return;
  }

  lastState = {
    list: list,
    usingSingleList: usingSingleList,
  };

  let html = "";
  let index = 0;

  let firstActive: null | number = null;

  for (const command of list) {
    if (command.found !== true) continue;
    let customStyle = "";
    if (command.customStyle !== undefined && command.customStyle !== "") {
      customStyle = command.customStyle;
    }

    const { iconHtml, configIconHtml } = getCommandIconsHtml(command);

    let display = command.display;
    if (usingSingleList) {
      display = (command.singleListDisplay ?? "") || command.display;
      if (command.configValue !== undefined || command.active !== undefined) {
        display = display.replace(
          `<i class="fas fa-fw fa-chevron-right chevronIcon"></i>`,
          `<i class="fas fa-fw fa-chevron-right chevronIcon"></i>` +
            configIconHtml,
        );
      }
    }

    let finalIconHtml = iconHtml;
    if (
      (!usingSingleList &&
        command.subgroup === undefined &&
        command.configValue !== undefined) ||
      (!usingSingleList && command.active !== undefined)
    ) {
      finalIconHtml = configIconHtml;
    }

    if (command.customData !== undefined) {
      if (command.id.startsWith("changeTheme")) {
        html += `<div class="command changeThemeCommand" data-command-id="${
          command.id
        }" data-index="${index}" style="${customStyle}">
      <div class="icon">${finalIconHtml}</div><div>${display}</div>
      <div class="themeFavIcon ${
        command.customData["isFavorite"] === true ? "" : "hidden"
      }">
        <i class="fas fa-star"></i>
      </div>
      <div class="themeBubbles" style="background: ${
        command.customData["bgColor"]
      };outline: 0.25rem solid ${command.customData["bgColor"]};">
        <div class="themeBubble" style="background: ${
          command.customData["mainColor"]
        }"></div>
        <div class="themeBubble" style="background: ${
          command.customData["subColor"]
        }"></div>
        <div class="themeBubble" style="background: ${
          command.customData["textColor"]
        }"></div>
      </div>
      </div>`;
      }
      if (command.id.startsWith("setFontFamily")) {
        let fontFamily = command.customData["name"];

        if (fontFamily === "Helvetica") {
          fontFamily = "Comic Sans MS";
        }

        if (command.customData["isSystem"] === false) {
          fontFamily += " Preview";
        }

        html += `<div class="command" data-command-id="${command.id}" data-index="${index}" style="font-family: '${fontFamily}'"><div class="icon">${finalIconHtml}</div><div>${display}</div></div>`;
      }
    } else {
      html += `<div class="command" data-command-id="${command.id}" data-index="${index}" style="${customStyle}"><div class="icon">${finalIconHtml}</div><div>${display}</div></div>`;
    }
    index++;
  }
  if (firstActive !== null && !usingSingleList) {
    activeIndex = firstActive;
  }

  element.innerHTML = html;
}

async function updateActiveCommand(): Promise<void> {
  if (isAnimating) return;

  const elements = [
    ...document.querySelectorAll("#commandLine .suggestions .command"),
  ];

  for (const element of elements) {
    element.classList.remove("active");
  }

  const element = elements[activeIndex];
  const command = (await getList()).filter((c) => c.found)[activeIndex];
  activeCommand = command ?? null;
  if (element === undefined || command === undefined) {
    clearFontPreview();
    void ThemeController.clearPreview(false);
    addCommandlineBackground();
    return;
  }
  element.classList.add("active");
  keepActiveCommandInView();

  clearFontPreview();
  if (
    command.id?.startsWith("changeTheme") ||
    command.id?.startsWith("setCustomThemeId")
  ) {
    removeCommandlineBackground();
  } else {
    void ThemeController.clearPreview();
    addCommandlineBackground();
  }

  command.hover?.();
}

let shakeTimeout: null | NodeJS.Timeout;

function handleInputSubmit(): void {
  if (isAnimating) return;
  if (inputModeParams.command === null) {
    throw new Error("Can't handle input submit - command is null");
  }

  if (inputModeParams.validation?.status === "checking") {
    //validation ongoing, ignore the submit
    return;
  } else if (inputModeParams.validation?.status === "failed") {
    modal.getModal().classList.add("hasError");
    if (shakeTimeout !== null) {
      clearTimeout(shakeTimeout);
    }
    shakeTimeout = setTimeout(() => {
      modal.getModal().classList.remove("hasError");
    }, 500);
    return;
  }

  if ("inputValueConvert" in inputModeParams.command) {
    inputModeParams.command.exec?.({
      commandlineModal: modal,

      // @ts-expect-error this is fine
      // oxlint-disable-next-line no-unsafe-assignment
      input: inputModeParams.command.inputValueConvert(inputValue),
    });
  } else {
    inputModeParams.command.exec?.({
      commandlineModal: modal,
      input: inputValue,
    });
  }

  void AnalyticsController.log("usedCommandLine", {
    command: inputModeParams.command.id,
  });
  hide();
}

async function runActiveCommand(): Promise<void> {
  if (isAnimating) return;
  if (activeCommand === null) return;
  const command = activeCommand;
  if (command.input) {
    const escaped = command.display.split("</i>")[1] ?? command.display;
    mode = "input";
    inputModeParams = {
      command: command,
      placeholder: escaped,
      value: command.defaultValue?.() ?? "",
      icon: command.icon ?? "fa-chevron-right",
    };
    createValidationHandler(command);

    await updateInput(inputModeParams.value as string);
    hideCommands();
  } else if (command.subgroup) {
    CommandlineLists.pushToStack(command.subgroup);
    await updateInput("");
    await filterSubgroup();
    await showCommands();
    await updateActiveCommand();
  } else {
    command.exec?.({
      commandlineModal: modal,
    });
    if (Config.singleListCommandLine === "on") {
      lastSingleListModeInputValue = inputValue;
    }
    const isSticky = command.sticky ?? false;
    if (!isSticky) {
      void AnalyticsController.log("usedCommandLine", { command: command.id });
      if (!command.opensModal) {
        hide(true);
      }
    } else {
      await filterSubgroup();
      await showCommands();
      await updateActiveCommand();
    }
  }
}

let lastActiveIndex: string | undefined;
function keepActiveCommandInView(): void {
  if (mouseMode) return;

  const active: HTMLElement | null = document.querySelector(
    ".suggestions .command.active",
  );

  if (active === null || active.dataset["index"] === lastActiveIndex) {
    return;
  }

  active.scrollIntoView({ behavior: "auto", block: "center" });
  lastActiveIndex = active.dataset["index"];
}

async function updateInput(setInput?: string): Promise<void> {
  const iconElement: HTMLElement | null = document.querySelector(
    "#commandLine .searchicon",
  );
  const element: HTMLInputElement | null =
    document.querySelector("#commandLine input");

  if (element === null || iconElement === null) {
    throw new Error("Commandline element or icon element not found");
  }

  if (setInput !== undefined) {
    inputValue = setInput;
  }

  element.value = inputValue;

  if (mode === "input") {
    if (inputModeParams.icon !== null) {
      iconElement.innerHTML = `<i class="fas fa-fw ${inputModeParams.icon}"></i>`;
    }
    if (inputModeParams.placeholder !== null) {
      element.placeholder = inputModeParams.placeholder;
    }
    if (inputModeParams.value !== null) {
      element.value = inputModeParams.value;
      //select the text inside
      element.setSelectionRange(0, element.value.length);
    }
  } else {
    iconElement.innerHTML = '<i class="fas fa-fw fa-search"></i>';
    element.placeholder = "Search...";

    const subgroup = await getSubgroup();

    if (subgroup.title !== undefined && subgroup.title !== "") {
      element.placeholder = `${subgroup.title}`;
    }

    let length = inputValue.length;
    if (setInput !== undefined) {
      length = setInput.length;
    }
    setTimeout(() => {
      element.setSelectionRange(length, length);
    }, 0);
  }
}

async function incrementActiveIndex(): Promise<void> {
  activeIndex++;
  if (activeIndex >= (await getList()).filter((c) => c.found).length) {
    activeIndex = 0;
  }
  await updateActiveCommand();
}

async function decrementActiveIndex(): Promise<void> {
  activeIndex--;
  if (activeIndex < 0) {
    activeIndex = (await getList()).filter((c) => c.found).length - 1;
  }
  await updateActiveCommand();
}

function showWarning(message: string): void {
  const warningEl = modal.getModal().querySelector<HTMLElement>(".warning");
  const warningTextEl = modal
    .getModal()
    .querySelector<HTMLElement>(".warning .text");
  if (warningEl === null || warningTextEl === null) {
    throw new Error("Commandline warning element not found");
  }
  warningEl.classList.remove("hidden");
  warningTextEl.textContent = message;
}

const showCheckingIcon = debounce(200, async () => {
  const checkingiconEl = modal
    .getModal()
    .querySelector<HTMLElement>(".checkingicon");
  if (checkingiconEl === null) {
    throw new Error("Commandline checking icon element not found");
  }
  checkingiconEl.classList.remove("hidden");
});

function hideCheckingIcon(): void {
  showCheckingIcon.cancel({ upcomingOnly: true });

  const checkingiconEl = modal
    .getModal()
    .querySelector<HTMLElement>(".checkingicon");
  if (checkingiconEl === null) {
    throw new Error("Commandline checking icon element not found");
  }
  checkingiconEl.classList.add("hidden");
}

function hideWarning(): void {
  const warningEl = modal.getModal().querySelector<HTMLElement>(".warning");
  if (warningEl === null) {
    throw new Error("Commandline warning element not found");
  }
  warningEl.classList.add("hidden");
}

function updateValidationResult(
  validation: NonNullable<InputModeParams["validation"]>,
): void {
  inputModeParams.validation = validation;
  if (validation.status === "checking") {
    showCheckingIcon();
  } else if (
    validation.status === "failed" &&
    validation.errorMessage !== undefined
  ) {
    showWarning(validation.errorMessage);
    hideCheckingIcon();
  } else {
    hideWarning();
    hideCheckingIcon();
  }
}

/*
 * Handlers needs to be created only once per command to ensure they debounce with the given delay
 */
const handlersCache = new Map<string, (e: Event) => Promise<void>>();

function createValidationHandler(command: Command): void {
  if ("validation" in command && !handlersCache.has(command.id)) {
    const commandWithValidation = command as CommandWithValidation<unknown>;
    const handler = createInputEventHandler(
      updateValidationResult,
      commandWithValidation.validation,
      "inputValueConvert" in commandWithValidation
        ? commandWithValidation.inputValueConvert
        : undefined,
    );
    handlersCache.set(command.id, handler);
  }
}

const modal = new AnimatedModal({
  dialogId: "commandLine",
  customEscapeHandler: (): void => {
    //
  },
  customWrapperClickHandler: (): void => {
    hide();
  },
  showOptionsWhenInChain: {
    focusFirstInput: true,
  },
  setup: async (modalEl): Promise<void> => {
    const input = modalEl.querySelector("input") as HTMLInputElement;

    input.addEventListener(
      "input",
      debounce(50, async (e) => {
        inputValue = ((e as InputEvent).target as HTMLInputElement).value;
        if (subgroupOverride === null) {
          if (Config.singleListCommandLine === "on") {
            usingSingleList = true;
          } else {
            usingSingleList = inputValue.startsWith(">");
          }
        }
        if (mode !== "search") return;
        mouseMode = false;
        activeIndex = 0;
        await filterSubgroup();
        await showCommands();
        await updateActiveCommand();
      }),
    );

    input.addEventListener("keydown", async (e) => {
      mouseMode = false;
      if (
        e.key === "ArrowUp" ||
        (e.ctrlKey &&
          (e.key.toLowerCase() === "k" || e.key.toLowerCase() === "p"))
      ) {
        if (
          Config.singleListCommandLine === "on" &&
          subgroupOverride === null &&
          inputValue === "" &&
          lastSingleListModeInputValue !== ""
        ) {
          inputValue = lastSingleListModeInputValue;
          await updateInput();
          await filterSubgroup();
          await showCommands();
          await updateActiveCommand();
          return;
        }
        e.preventDefault();
        await decrementActiveIndex();
      }
      if (
        e.key === "ArrowDown" ||
        (e.ctrlKey &&
          (e.key.toLowerCase() === "j" || e.key.toLowerCase() === "n"))
      ) {
        e.preventDefault();
        await incrementActiveIndex();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          await decrementActiveIndex();
        } else {
          await incrementActiveIndex();
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (mode === "search") {
          await runActiveCommand();
        } else if (mode === "input") {
          handleInputSubmit();
        } else {
          throw new Error("Unknown mode, can't handle enter press");
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        await goBackOrHide();
      }
    });

    input.addEventListener("input", async (e) => {
      if (
        inputModeParams === null ||
        inputModeParams.command === null ||
        !("validation" in inputModeParams.command)
      ) {
        return;
      }

      const handler = handlersCache.get(inputModeParams.command.id);
      if (handler === undefined) {
        throw new Error(
          `Expected handler for command ${inputModeParams.command.id} is missing`,
        );
      }

      await handler(e);
    });

    modalEl.addEventListener("mousemove", (_e) => {
      mouseMode = true;
    });

    const suggestions = document.querySelector(".suggestions") as HTMLElement;
    let lastHover: HTMLElement | undefined;

    suggestions.addEventListener("mousemove", async (e) => {
      mouseMode = true;
      const target = e.target as HTMLElement | null;
      if (target === lastHover) return;

      const dataIndex = parseIntOptional(target?.getAttribute("data-index"));

      if (dataIndex === undefined) return;

      lastHover = e.target as HTMLElement;
      activeIndex = dataIndex;
      await updateActiveCommand();
    });

    suggestions.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement | null;

      const dataIndex = parseIntOptional(target?.getAttribute("data-index"));

      if (dataIndex === undefined) return;

      const previous = activeIndex;
      activeIndex = dataIndex;
      if (previous !== activeIndex) {
        await updateActiveCommand();
      }
      await runActiveCommand();
    });
  },
});
