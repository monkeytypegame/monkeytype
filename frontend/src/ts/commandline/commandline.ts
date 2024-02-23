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
      }
    );
}

function filterCommands(): void {
  const list = CommandlineLists.getCurrent();
  const inputSplit = inputValue.toLowerCase().trim().split(" ");
  const newList = [];

  for (const command of list.list) {
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
  for (const command of filteredCommands) {
    html += `<div class="suggestion">${command.display}</div>`;
  }
  element.innerHTML = html;
}

export function toggle(): void {
  if (visible) {
    hide();
  } else {
    show();
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

function attachEventHandlers(): void {
  const element: HTMLInputElement | null =
    document.querySelector("#commandLine input");

  if (element === null) {
    throw new Error("Commandline element not found");
  }

  element.addEventListener("input", (e) => {
    inputValue = (e.target as HTMLInputElement).value;
    filterCommands();
    showCommands();
  });
}

Skeleton.save(wrapperId);
