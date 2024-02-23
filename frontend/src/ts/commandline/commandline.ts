import * as Skeleton from "../popups/skeleton";
import * as Focus from "../test/focus";
import * as CommandlineLists from "./commands";
import Config, * as UpdateConfig from "../config";

const wrapperId = "commandLineWrapper";

let visible = false;
let activeIndex = 0;
let usingSingleList = false;
let inputValue = "";
let filteredCommands: MonkeyTypes.Command[] = [];

function show(): void {
  if (visible) {
    return;
  }
  //take last element of array
  visible = true;
  inputValue = "";
  activeIndex = 0;
  usingSingleList = Config.singleListCommandLine === "on";
  Focus.set(false);
  Skeleton.append(wrapperId);
  updateInput();
  attachEventHandlers();
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

function hide(): void {
  if (!visible) {
    return;
  }
  visible = false;
  $("#commandLineWrapper")
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#commandLineWrapper").addClass("hidden");
        Skeleton.remove(wrapperId);
      }
    );
}

function filterCommands(): void {
  const list = CommandlineLists.getCurrent();
  const inputSplit = inputValue.toLowerCase().trim().split(" ");
  const newList = [];

  for (const command of list.list) {
    if (!(command.available?.() ?? true)) continue;
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
      newList.push(command);
    }
  }
  filteredCommands = newList;
}

function showCommands(): void {
  const element = document.querySelector("#commandLine .suggestions");
  if (element === null) {
    throw new Error("Commandline element not found");
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
}

function updateActiveCommand(): void {
  const elements = [
    ...document.querySelectorAll("#commandLine .suggestions .entry"),
  ];

  for (const element of elements) {
    element.classList.remove("active");
  }

  const element = elements[activeIndex];
  if (element === undefined) {
    return;
  }
  element.classList.add("active");
}

export function toggle(): void {
  if (visible) {
    hide();
  } else {
    show();
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

function updateInput(): void {
  const element: HTMLInputElement | null =
    document.querySelector("#commandLine input");

  if (element === null) {
    throw new Error("Commandline element not found");
  }

  element.value = inputValue;
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

function attachEventHandlers(): void {
  const element: HTMLInputElement | null =
    document.querySelector("#commandLine input");

  if (element === null) {
    throw new Error("Commandline element not found");
  }

  element.addEventListener("input", (e) => {
    inputValue = (e.target as HTMLInputElement).value;
    activeIndex = 0;
    filterCommands();
    showCommands();
    updateActiveCommand();
  });

  element.addEventListener("keydown", (e) => {
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
  });
}

Skeleton.save(wrapperId);
