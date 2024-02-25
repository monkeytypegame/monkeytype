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
let activeCommand: MonkeyTypes.Command | null = null;
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
  activeCommand = null;
  usingSingleList = Config.singleListCommandLine === "on";
  Focus.set(false);
  Skeleton.append(wrapperId);
  CommandlineLists.setStackToDefault();
  beforeList();
  updateInput();
  filterSubgroup();
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
    filterSubgroup();
    showCommands();
    updateActiveCommand();
    return;
  }

  if (CommandlineLists.getStackLength() > 1) {
    CommandlineLists.popFromStack();
    updateInput("");
    filterSubgroup();
    showCommands();
    updateActiveCommand();
  } else {
    hide();
  }
}

function filterSubgroup(): void {
  const configKey = usingSingleList
    ? undefined
    : CommandlineLists.getTopOfStack().configKey;
  const list = getList();

  const inputSplit = inputValue.toLowerCase().trim().split(" ");

  for (const command of list) {
    const isAvailable = command.available?.() ?? true;
    if (!isAvailable) {
      command.found = false;
      continue;
    }
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
      if (configKey !== undefined) {
        command.configKey = configKey;
      }
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
}

function getList(): MonkeyTypes.Command[] {
  const subgroup = usingSingleList
    ? CommandlineLists.getSingleSubgroup()
    : CommandlineLists.getTopOfStack();

  return subgroup.list;
}

function beforeList(): void {
  const subgroup = usingSingleList
    ? CommandlineLists.getSingleSubgroup()
    : CommandlineLists.getTopOfStack();
  subgroup.beforeList?.();
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

  const list = getList().filter((c) => c.found === true);

  let html = "";
  let index = 0;

  for (const command of list) {
    if (command.found !== true) continue;
    let icon = command.icon ?? "fa-chevron-right";
    const faIcon = icon.startsWith("fa-");
    if (!faIcon) {
      icon = `<div class="textIcon">${icon}</div>`;
    } else {
      icon = `<i class="fas fa-fw ${icon}"></i>`;
    }
    let configIcon = "";
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
        configIcon = `<i class="fas fa-fw fa-check"></i>`;
      } else {
        configIcon = `<i class="fas fa-fw"></i>`;
      }
    }
    const iconHTML = `<div class="icon">${
      usingSingleList || configIcon === "" ? icon : configIcon
    }</div>`;
    let customStyle = "";
    if (command.customStyle !== undefined && command.customStyle !== "") {
      customStyle = command.customStyle;
    }

    let display = command.display;
    if (usingSingleList) {
      display = display.replace(
        `<i class="fas fa-fw fa-chevron-right chevronIcon"></i>`,
        `<i class="fas fa-fw fa-chevron-right chevronIcon"></i>` + configIcon
      );
    }

    if (command.id.startsWith("changeTheme") && command.customData) {
      html += `<div class="entry withThemeBubbles" command="${command.id}" index="${index}" style="${customStyle}">
      ${iconHTML}<div>${display}</div>
      <div class="themeBubbles" style="background: ${command.customData["bgColor"]};outline: 0.25rem solid ${command.customData["bgColor"]};">
        <div class="themeBubble" style="background: ${command.customData["mainColor"]}"></div>
        <div class="themeBubble" style="background: ${command.customData["subColor"]}"></div>
        <div class="themeBubble" style="background: ${command.customData["textColor"]}"></div>
      </div>
      </div>`;
    } else {
      html += `<div class="entry" command="${command.id}" index="${index}" style="${customStyle}">${iconHTML}<div>${display}</div></div>`;
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

  clearFontPreview();
  addCommandlineBackground();
  void ThemeController.clearPreview();

  const element = elements[activeIndex];
  const command = getList().filter((c) => c.found)[activeIndex];
  activeCommand = command ?? null;
  if (element === undefined || command === undefined) {
    return;
  }
  element.classList.add("active");

  if (/changeTheme.+/gi.test(command.id)) {
    removeCommandlineBackground();
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
  if (activeCommand === null) return;
  const command = activeCommand;
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
    beforeList();
    updateInput("");
    filterSubgroup();
    showCommands();
    updateActiveCommand();
  } else {
    command.exec?.();
    const isSticky = command.sticky ?? false;
    if (!isSticky) {
      void AnalyticsController.log("usedCommandLine", { command: command.id });
      hide(command.shouldFocusTestUI ?? false);
    } else {
      beforeList();
      filterSubgroup();
      showCommands();
      updateActiveCommand();
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
  if (activeIndex >= getList().filter((c) => c.found).length) {
    activeIndex = 0;
  }
  updateActiveCommand();
}

function decrementActiveIndex(): void {
  activeIndex--;
  if (activeIndex < 0) {
    activeIndex = getList().filter((c) => c.found).length - 1;
  }
  updateActiveCommand();
}

const input = document.querySelector("#commandLine input") as HTMLInputElement;

input.addEventListener("input", (e) => {
  inputValue = (e.target as HTMLInputElement).value;
  if (mode !== "search") return;
  mouseMode = false;
  activeIndex = 0;
  filterSubgroup();
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
