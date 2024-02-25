import * as Skeleton from "../popups/skeleton";
import * as Focus from "../test/focus";
import * as CommandlineLists from "./commands";
import Config from "../config";
import * as TestUI from "../test/test-ui";
import * as AnalyticsController from "../controllers/analytics-controller";
import * as ThemeController from "../controllers/theme-controller";
import { clearFontPreview } from "../ui";

const wrapperId = "commandLineWrapper";

type CommandlineMode = "search" | "input";
type InputModeParams = {
  command: MonkeyTypes.Command | null;
  placeholder: string | null;
  value: string | null;
  icon: string | null;
};

let visible = false;
let activeIndex = 0;
let usingSingleList = false;
let inputValue = "";
let filteredCommands: MonkeyTypes.Command[] = [];
let mouseMode = false;
let mode: CommandlineMode = "search";
let inputModeParams: InputModeParams = {
  command: null,
  placeholder: "",
  value: "",
  icon: "",
};

function removeCommandlineBackground(): void {
  $("#commandLineWrapper").addClass("noBackground");
  if (Config.showOutOfFocusWarning) {
    $("#words").removeClass("blurred");
  }
}

function addCommandlineBackground(): void {
  $("#commandLineWrapper").removeClass("noBackground");
  if (Config.showOutOfFocusWarning) {
    $("#words").addClass("blurred");
  }
}

export function show(): void {
  if (visible) {
    return;
  }
  mouseMode = false;
  visible = true;
  inputValue = "";
  activeIndex = 0;
  mode = "search";
  inputModeParams = {
    command: null,
    placeholder: null,
    value: null,
    icon: null,
  };
  usingSingleList = Config.singleListCommandLine === "on";
  Focus.set(false);
  Skeleton.append(wrapperId);
  CommandlineLists.setStackToDefault();
  updateInput();
  filterCommands();
  showCommands();
  updateActiveCommand();

  $("#commandLineWrapper")
    .stop(true, true)
    .css("opacity", 0)
    .removeClass("hidden")
    .animate(
      {
        opacity: 1,
      },
      125,
      () => {
        $("#commandLine input").trigger("focus");
      }
    );
}

function hide(focusTestUI = false): void {
  if (!visible) {
    return;
  }
  clearFontPreview();
  addCommandlineBackground();
  void ThemeController.clearPreview();
  $("#commandLineWrapper")
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        visible = false;
        $("#commandLineWrapper").addClass("hidden");
        Skeleton.remove(wrapperId);
        if (focusTestUI) {
          TestUI.focusWords();
        }
      }
    );
}

function goBackOrHide(): void {
  if (mode === "input") {
    mode = "search";
    inputModeParams = {
      command: null,
      placeholder: null,
      value: null,
      icon: null,
    };
    updateInput("");
    filterCommands();
    showCommands();
    updateActiveCommand();
    return;
  }

  if (CommandlineLists.getStackLength() > 1) {
    CommandlineLists.popFromStack();
    updateInput("");
    filterCommands();
    showCommands();
    updateActiveCommand();
  } else {
    hide();
  }
}

function filterCommands(): void {
  const configKey = usingSingleList
    ? undefined
    : CommandlineLists.getTopOfStack().configKey;
  const list = usingSingleList
    ? CommandlineLists.getSingleList()
    : CommandlineLists.getTopOfStack().list;

  const inputSplit = inputValue.toLowerCase().trim().split(" ");
  const newList = [];

  for (const command of list) {
    const isAvailable = command.available?.() ?? true;
    if (!isAvailable) continue;
    let foundCount = 0;
    for (const input of inputSplit) {
      const escaped = input.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const re = new RegExp("\\b" + escaped, "g");
      const matchDisplay = command.display.toLowerCase().match(re);
      const matchAlias =
        command.alias !== undefined
          ? command.alias.toLowerCase().match(re)
          : null;
      if (matchDisplay !== null || matchAlias !== null) {
        foundCount++;
      }
    }
    if (foundCount === inputSplit.length) {
      newList.push({
        configKey: configKey,
        ...command,
      });
    }
  }
  filteredCommands = newList;
}

function hideCommands(): void {
  const element = document.querySelector("#commandLine .suggestions");
  if (element === null) {
    throw new Error("Commandline element not found");
  }
  element.innerHTML = "";
}

function showCommands(): void {
  const element = document.querySelector("#commandLine .suggestions");
  if (element === null) {
    throw new Error("Commandline element not found");
  }

  if (inputValue === "" && usingSingleList) {
    element.innerHTML = "";
    return;
  }

  let html = "";
  let index = 0;
  for (const command of filteredCommands) {
    let icon = command.icon ?? "fa-chevron-right";
    const faIcon = icon.startsWith("fa-");
    if (!faIcon) {
      icon = `<div class="textIcon">${icon}</div>`;
    } else {
      icon = `<i class="fas fa-fw ${icon}"></i>`;
    }
    if (command.configKey !== undefined) {
      if (
        (command.configValueMode !== undefined &&
          command.configValueMode === "include" &&
          (
            Config[command.configKey] as (
              | string
              | number
              | boolean
              | number[]
              | undefined
            )[]
          ).includes(command.configValue)) ||
        Config[command.configKey] === command.configValue
      ) {
        icon = `<i class="fas fa-fw fa-check"></i>`;
      } else {
        icon = `<i class="fas fa-fw"></i>`;
      }
    }
    let iconHTML = `<div class="icon">${icon}</div>`;
    if (command.noIcon && usingSingleList) {
      iconHTML = "";
    }
    let customStyle = "";
    if (command.customStyle !== undefined && command.customStyle !== "") {
      customStyle = command.customStyle;
    }

    if (command.id.startsWith("changeTheme") && command.customData) {
      html += `<div class="entry withThemeBubbles" command="${command.id}" index="${index}" style="${customStyle}">
      ${iconHTML}<div>${command.display}</div>
      <div class="themeBubbles" style="background: ${command.customData["bgColor"]};outline: 0.25rem solid ${command.customData["bgColor"]};">
        <div class="themeBubble" style="background: ${command.customData["mainColor"]}"></div>
        <div class="themeBubble" style="background: ${command.customData["subColor"]}"></div>
        <div class="themeBubble" style="background: ${command.customData["textColor"]}"></div>
      </div>
      </div>`;
    } else {
      html += `<div class="entry" command="${command.id}" index="${index}" style="${customStyle}">${iconHTML}<div>${command.display}</div></div>`;
    }
    index++;
  }
  element.innerHTML = html;

  for (const entry of element.querySelectorAll(".entry")) {
    entry.addEventListener("mouseenter", () => {
      if (!mouseMode) return;
      activeIndex = parseInt(entry.getAttribute("index") ?? "0");
      updateActiveCommand();
    });
    entry.addEventListener("mouseleave", () => {
      if (!mouseMode) return;
      activeIndex = parseInt(entry.getAttribute("index") ?? "0");
      updateActiveCommand();
    });
    entry.addEventListener("click", () => {
      activeIndex = parseInt(entry.getAttribute("index") ?? "0");
      runActiveCommand();
    });
  }
}

function updateActiveCommand(): void {
  const elements = [
    ...document.querySelectorAll("#commandLine .suggestions .entry"),
  ];

  for (const element of elements) {
    element.classList.remove("active");
  }

  const element = elements[activeIndex];
  const command = filteredCommands[activeIndex];
  if (element === undefined || command === undefined) {
    return;
  }
  element.classList.add("active");

  clearFontPreview();
  if (/changeTheme.+/gi.test(command.id)) {
    removeCommandlineBackground();
  } else {
    addCommandlineBackground();
  }
  if (
    (!/theme/gi.test(command.id) || command.id === "toggleCustomTheme") &&
    !(ThemeController.randomTheme ?? "")
  ) {
    void ThemeController.clearPreview();
  }
  command.hover?.();
}

function handleInputSubmit(): void {
  if (inputModeParams.command === null) {
    throw new Error("Can't handle input submit - command is null");
  }
  const value = inputValue;
  inputModeParams.command.exec?.(value);
  void AnalyticsController.log("usedCommandLine", {
    command: inputModeParams.command.id,
  });
  hide(inputModeParams.command.shouldFocusTestUI ?? false);
}

function runActiveCommand(): void {
  if (filteredCommands.length === 0) return;

  const command = filteredCommands[activeIndex];
  if (command === undefined) {
    throw new Error("Tried to run active command, but it was undefined");
  }

  if (command.input) {
    const escaped = command.display.split("</i>")[1] ?? command.display;
    // showInput(
    //   command.id,
    //   escaped,
    //   command.defaultValue ? command.defaultValue() : ""
    // );
    mode = "input";
    inputModeParams = {
      command: command,
      placeholder: escaped,
      value: command.defaultValue?.() ?? "",
      icon: command.icon ?? "fa-chevron-right",
    };
    updateInput(inputModeParams.value as string);
    hideCommands();
  } else if (command.subgroup) {
    if (command.subgroup.beforeList) {
      command.subgroup.beforeList();
    }
    CommandlineLists.pushToStack(
      command.subgroup as MonkeyTypes.CommandsSubgroup
    );
    updateInput("");
    filterCommands();
    showCommands();
    updateActiveCommand();
  } else {
    command.exec?.();
    const isSticky = command.sticky ?? false;
    if (!isSticky) {
      void AnalyticsController.log("usedCommandLine", { command: command.id });
      hide(command.shouldFocusTestUI ?? false);
    }
  }
}

function keepActiveCommandInView(): void {
  try {
    const scroll =
      Math.abs(
        ($(".suggestions").offset()?.top as number) -
          ($(".entry.active").offset()?.top as number) -
          ($(".suggestions").scrollTop() as number)
      ) -
      ($(".suggestions").outerHeight() as number) / 2 +
      ($($(".entry")[0] as HTMLElement).outerHeight() as number);
    $(".suggestions").scrollTop(scroll);
  } catch (e) {
    if (e instanceof Error) {
      console.log("could not scroll suggestions: " + e.message);
    }
  }
}

function updateInput(setInput?: string): void {
  const iconElement: HTMLElement | null = document.querySelector(
    "#commandLine .searchicon"
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
    iconElement.innerHTML = '<i class="fas fa-search"></i>';
    element.placeholder = "Search...";
  }
}

function incrementActiveIndex(): void {
  activeIndex++;
  if (activeIndex >= filteredCommands.length) {
    activeIndex = 0;
  }
  updateActiveCommand();
}

function decrementActiveIndex(): void {
  activeIndex--;
  if (activeIndex < 0) {
    activeIndex = filteredCommands.length - 1;
  }
  updateActiveCommand();
}

const input = document.querySelector("#commandLine input") as HTMLInputElement;

input.addEventListener("input", (e) => {
  inputValue = (e.target as HTMLInputElement).value;
  if (mode !== "search") return;
  mouseMode = false;
  activeIndex = 0;
  filterCommands();
  showCommands();
  updateActiveCommand();
});

input.addEventListener("keydown", (e) => {
  mouseMode = false;
  if (e.key === "ArrowUp") {
    e.preventDefault();
    decrementActiveIndex();
    keepActiveCommandInView();
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    incrementActiveIndex();
    keepActiveCommandInView();
  }
  if (e.key === "Enter") {
    e.preventDefault();
    if (mode === "search") {
      runActiveCommand();
    } else if (mode === "input") {
      handleInputSubmit();
    } else {
      throw new Error("Unknown mode, can't handle enter press");
    }
  }
  if (e.key === "Escape") {
    goBackOrHide();
  }
  if (e.key === "Tab") {
    e.preventDefault();
  }
});

const wrapper = document.querySelector("#commandLineWrapper") as HTMLElement;

wrapper.addEventListener("click", (e) => {
  if (e.target === wrapper) {
    hide();
  }
});

const commandLine = document.querySelector("#commandLine") as HTMLElement;

commandLine.addEventListener("mousemove", (e) => {
  mouseMode = true;
});

Skeleton.save(wrapperId);
